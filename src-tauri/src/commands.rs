use serde::{Deserialize, Serialize};
use std::process::Command;
use log::{info, warn};
use tauri::Emitter;

use crate::npu_detector::{NPUDetector, NPUStatus};
use crate::ps;

// ============ Data Structures ============

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CPUInfo {
    pub name: String,
    pub cores: u32,
    pub threads: u32,
    pub frequency: String,
    pub temperature: f32,
    pub usage: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GPUInfo {
    pub name: String,
    pub vram: String,
    pub driver: String,
    pub usage: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total: String,
    pub used: String,
    pub usage: f32,
    pub slots: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageInfo {
    pub name: String,
    pub size: String,
    pub health: u32,
    pub temp: f32,
    pub storage_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareInfo {
    pub cpu: CPUInfo,
    pub gpu: GPUInfo,
    pub memory: MemoryInfo,
    pub npu: NPUStatus,
    pub storage: Vec<StorageInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub is_downloaded: bool,
    pub requires_npu: bool,
    pub size_mb: f32,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub os_version: String,
    pub computer_name: String,
    pub uptime: String,
}

// ============ Helper Functions ============

/// Get CPU temperature using multiple fallback methods.
/// Returns -1.0 if unavailable.
fn get_cpu_temperature() -> f32 {
    let script = r#"
        # Method 1: Performance counter thermal zone (no admin needed)
        try {
            $thermal = Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -ErrorAction Stop
            if ($thermal) {
                $maxTemp = ($thermal | ForEach-Object { $_.Temperature } | Measure-Object -Maximum).Maximum
                if ($maxTemp -and $maxTemp -gt 0) {
                    Write-Output "TEMP=$([math]::Round($maxTemp, 1))"
                    exit 0
                }
            }
        } catch {}

        # Method 2: MSAcpi_ThermalZoneTemperature (may need admin)
        try {
            $temps = Get-CimInstance -Namespace "root/wmi" -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop
            if ($temps) {
                $maxTemp = ($temps | ForEach-Object { ($_.CurrentTemperature - 2732) / 10 } | Measure-Object -Maximum).Maximum
                if ($maxTemp -and $maxTemp -gt 0) {
                    Write-Output "TEMP=$([math]::Round($maxTemp, 1))"
                    exit 0
                }
            }
        } catch {}

        # Method 3: Registry-based thermal comfort (Windows 11+)
        try {
            $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\thermalcomfort\ThermalZones"
            if (Test-Path $regPath) {
                $zones = Get-ChildItem -Path $regPath -ErrorAction Stop
                foreach ($zone in $zones) {
                    $tempVal = (Get-ItemProperty -Path $zone.PSPath -Name "Temperature" -ErrorAction SilentlyContinue).Temperature
                    if ($tempVal -and $tempVal -gt 0) {
                        Write-Output "TEMP=$([math]::Round($tempVal / 10, 1))"
                        exit 0
                    }
                }
            }
        } catch {}

        Write-Output "TEMP=-1"
    "#;

    if let Ok(output) = ps::run(script) {
        for line in output.lines() {
            if line.starts_with("TEMP=") {
                if let Ok(temp) = line[5..].trim().parse::<f32>() {
                    if temp > 0.0 {
                        return temp;
                    }
                }
            }
        }
    }
    -1.0
}

/// Get real CPU information
async fn get_cpu_info() -> Result<CPUInfo, String> {
    info!("Getting CPU info...");
    
    let script = r#"
        try {
            $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
            $name = $cpu.Name
            $cores = $cpu.NumberOfCores
            $threads = $cpu.NumberOfLogicalProcessors
            
            # Get max frequency
            $maxFreq = $cpu.MaxClockSpeed
            $freqGHz = [math]::Round($maxFreq / 1000, 2)
            
            # Get current usage
            $usage = (Get-CimInstance -ClassName Win32_Processor).LoadPercentage
            if (-not $usage) { $usage = 0 }
            
            # Output as structured text
            Write-Output "NAME=$name"
            Write-Output "CORES=$cores"
            Write-Output "THREADS=$threads"
            Write-Output "FREQ=$freqGHz"
            Write-Output "USAGE=$usage"
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    match ps::run(script) {
        Ok(output) => {
            let lines: Vec<&str> = output.lines().collect();
            let mut name = String::new();
            let mut cores = 0u32;
            let mut threads = 0u32;
            let mut frequency = String::new();
            let mut usage = 0f32;
            let mut has_error = false;
            
            for line in lines {
                if line.starts_with("ERROR=") {
                    has_error = true;
                    warn!("CPU info error: {}", line);
                    break;
                } else if line.starts_with("NAME=") {
                    name = line[5..].to_string();
                } else if line.starts_with("CORES=") {
                    cores = line[6..].parse().unwrap_or(0);
                } else if line.starts_with("THREADS=") {
                    threads = line[8..].parse().unwrap_or(0);
                } else if line.starts_with("FREQ=") {
                    frequency = format!("{} GHz", line[5..].trim());
                } else if line.starts_with("USAGE=") {
                    usage = line[6..].parse().unwrap_or(0.0);
                }
            }
            
            if has_error || name.is_empty() {
                return Err("Failed to get CPU info".to_string());
            }
            
            let temperature = get_cpu_temperature();
            
            Ok(CPUInfo {
                name,
                cores,
                threads,
                frequency,
                temperature,
                usage,
            })
        }
        Err(e) => Err(e),
    }
}

/// Get real GPU information
async fn get_gpu_info() -> Result<GPUInfo, String> {
    info!("Getting GPU info...");
    
    let script = r#"
        try {
            $gpu = Get-CimInstance -ClassName Win32_VideoController | Select-Object -First 1
            $name = $gpu.Name
            $vramBytes = $gpu.AdapterRAM
            $driver = $gpu.DriverVersion
            
            if ($vramBytes -and $vramBytes -gt 0) {
                $vram = "$([math]::Round($vramBytes / 1GB, 0)) GB"
            } else {
                $vram = "Shared Memory"
            }
            
            Write-Output "NAME=$name"
            Write-Output "VRAM=$vram"
            Write-Output "DRIVER=$driver"
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    match ps::run(script) {
        Ok(output) => {
            let lines: Vec<&str> = output.lines().collect();
            let mut name = String::new();
            let mut vram = String::new();
            let mut driver = String::new();
            let mut has_error = false;
            
            for line in lines {
                if line.starts_with("ERROR=") {
                    has_error = true;
                    warn!("GPU info error: {}", line);
                    break;
                } else if line.starts_with("NAME=") {
                    name = line[5..].to_string();
                } else if line.starts_with("VRAM=") {
                    vram = line[5..].to_string();
                } else if line.starts_with("DRIVER=") {
                    driver = line[7..].to_string();
                }
            }
            
            if has_error || name.is_empty() {
                return Err("Failed to get GPU info".to_string());
            }
            
            Ok(GPUInfo {
                name,
                vram,
                driver,
                usage: 0.0, // GPU usage requires specialized APIs
            })
        }
        Err(e) => Err(e),
    }
}

/// Get real memory information
async fn get_memory_info() -> Result<MemoryInfo, String> {
    info!("Getting memory info...");
    
    let script = r#"
        try {
            $os = Get-CimInstance -ClassName Win32_OperatingSystem
            $cs = Get-CimInstance -ClassName Win32_ComputerSystem
            
            $totalBytes = $cs.TotalPhysicalMemory
            $freeBytes = $os.FreePhysicalMemory * 1KB
            
            $totalGB = [math]::Round($totalBytes / 1GB, 0)
            $usedGB = [math]::Round(($totalBytes - $freeBytes) / 1GB, 0)
            $usagePercent = [math]::Round((($totalBytes - $freeBytes) / $totalBytes) * 100, 0)
            
            # Try to get memory slot info
            $slots = Get-CimInstance -ClassName Win32_PhysicalMemory -ErrorAction SilentlyContinue
            $slotCount = if ($slots) { $slots.Count } else { 1 }
            
            Write-Output "TOTAL=$totalGB"
            Write-Output "USED=$usedGB"
            Write-Output "USAGE=$usagePercent"
            Write-Output "SLOTS=$slotCount slot(s)"
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    match ps::run(script) {
        Ok(output) => {
            let lines: Vec<&str> = output.lines().collect();
            let mut total = String::new();
            let mut used = String::new();
            let mut usage = 0f32;
            let mut slots = String::new();
            let mut has_error = false;
            
            for line in lines {
                if line.starts_with("ERROR=") {
                    has_error = true;
                    warn!("Memory info error: {}", line);
                    break;
                } else if line.starts_with("TOTAL=") {
                    total = format!("{} GB", line[6..].trim());
                } else if line.starts_with("USED=") {
                    used = format!("{} GB", line[5..].trim());
                } else if line.starts_with("USAGE=") {
                    usage = line[6..].parse().unwrap_or(0.0);
                } else if line.starts_with("SLOTS=") {
                    slots = line[6..].to_string();
                }
            }
            
            if has_error || total.is_empty() {
                return Err("Failed to get memory info".to_string());
            }
            
            Ok(MemoryInfo {
                total,
                used,
                usage,
                slots,
            })
        }
        Err(e) => Err(e),
    }
}

/// Get real storage information
async fn get_storage_list() -> Result<Vec<StorageInfo>, String> {
    info!("Getting storage info...");
    
    let script = r#"
        try {
            $disks = Get-CimInstance -ClassName Win32_DiskDrive
            $result = @()
            
            foreach ($disk in $disks) {
                $name = $disk.Model
                $sizeGB = [math]::Round($disk.Size / 1GB, 0)
                
                # Determine storage type
                $mediaType = $disk.MediaType
                $storageType = if ($mediaType -match "SSD|NVMe|Fixed" -or $name -match "SSD|NVMe") { 
                    "SSD/NVMe" 
                } else { 
                    "HDD" 
                }
                
                $result += "$name|$sizeGB|$storageType"
            }
            
            Write-Output ($result -join "`n")
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    match ps::run(script) {
        Ok(output) => {
            let output = output.trim();
            if output.starts_with("ERROR=") || output.is_empty() {
                return Err("Failed to get storage info".to_string());
            }
            
            let mut storage_list = Vec::new();
            
            for line in output.lines() {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 3 {
                    storage_list.push(StorageInfo {
                        name: parts[0].to_string(),
                        size: format!("{} GB", parts[1]),
                        health: 100, // Health requires SMART data
                        temp: 0.0,   // Temperature requires specialized tools
                        storage_type: parts[2].to_string(),
                    });
                }
            }
            
            if storage_list.is_empty() {
                return Err("No storage devices found".to_string());
            }
            
            Ok(storage_list)
        }
        Err(e) => Err(e),
    }
}

// ============ Command Implementations ============

#[tauri::command]
pub async fn get_hardware_info() -> Result<HardwareInfo, String> {
    info!("Getting complete hardware info");
    
    // Get each component with error handling
    let cpu = get_cpu_info().await.map_err(|e| format!("CPU: {}", e))?;
    let gpu = get_gpu_info().await.map_err(|e| format!("GPU: {}", e))?;
    let memory = get_memory_info().await.map_err(|e| format!("Memory: {}", e))?;
    let storage = get_storage_list().await.map_err(|e| format!("Storage: {}", e))?;
    let npu = NPUDetector::detect_npu();
    
    Ok(HardwareInfo {
        cpu,
        gpu,
        memory,
        npu,
        storage,
    })
}

#[tauri::command]
pub async fn get_npu_status() -> Result<NPUStatus, String> {
    Ok(NPUDetector::detect_npu())
}

#[tauri::command]
pub async fn detect_npu() -> Result<NPUStatus, String> {
    Ok(NPUDetector::detect_npu())
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let script = r#"
        try {
            $os = Get-CimInstance -ClassName Win32_OperatingSystem
            $cs = Get-CimInstance -ClassName Win32_ComputerSystem
            
            $osName = $os.Caption
            $computerName = $cs.Name
            $lastBoot = $os.LastBootUpTime
            $uptime = (Get-Date) - $lastBoot
            
            Write-Output "OS=$osName"
            Write-Output "COMPUTER=$computerName"
            Write-Output "UPTIME=$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    match ps::run(script) {
        Ok(output) => {
            let lines: Vec<&str> = output.lines().collect();
            let mut os_version = String::new();
            let mut computer_name = String::new();
            let mut uptime = String::new();
            
            for line in lines {
                if line.starts_with("OS=") {
                    os_version = line[3..].to_string();
                } else if line.starts_with("COMPUTER=") {
                    computer_name = line[9..].to_string();
                } else if line.starts_with("UPTIME=") {
                    uptime = line[7..].to_string();
                }
            }
            
            Ok(SystemInfo {
                os_version,
                computer_name,
                uptime,
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn get_tools_list() -> Result<Vec<Tool>, String> {
    let tools = vec![
        Tool {
            id: "ollama".to_string(),
            name: "Ollama".to_string(),
            description: "Local LLM runtime, supports 100+ open source models".to_string(),
            category: "ai".to_string(),
            is_downloaded: false,
            requires_npu: false,
            size_mb: 150.0,
            version: "0.5.0".to_string(),
        },
        Tool {
            id: "cpu-z".to_string(),
            name: "CPU-Z".to_string(),
            description: "Professional CPU detection tool".to_string(),
            category: "hardware".to_string(),
            is_downloaded: false,
            requires_npu: false,
            size_mb: 2.0,
            version: "2.10".to_string(),
        },
        Tool {
            id: "gpu-z".to_string(),
            name: "GPU-Z".to_string(),
            description: "Professional GPU detection tool".to_string(),
            category: "hardware".to_string(),
            is_downloaded: false,
            requires_npu: false,
            size_mb: 3.0,
            version: "2.55".to_string(),
        },
        Tool {
            id: "musicgen".to_string(),
            name: "MusicGen".to_string(),
            description: "Meta music generation model".to_string(),
            category: "audio".to_string(),
            is_downloaded: false,
            requires_npu: true,
            size_mb: 800.0,
            version: "1.0".to_string(),
        },
        Tool {
            id: "tabby".to_string(),
            name: "Tabby".to_string(),
            description: "Self-hosted coding assistant".to_string(),
            category: "programming".to_string(),
            is_downloaded: false,
            requires_npu: false,
            size_mb: 500.0,
            version: "0.8.0".to_string(),
        },
    ];
    
    Ok(tools)
}

#[tauri::command]
pub async fn download_tool(tool_id: String, download_url: String, save_path: String) -> Result<String, String> {
    info!("Downloading tool: {} from {}", tool_id, download_url);
    
    std::fs::create_dir_all(&save_path).map_err(|e| e.to_string())?;
    
    let file_path = format!("{}/{}.zip", save_path, tool_id);
    
    let script = format!(
        "Invoke-WebRequest -Uri '{}' -OutFile '{}' -UseBasicParsing",
        download_url, file_path
    );
    
    ps::run(&script)?;
    
    info!("Tool {} download completed", tool_id);
    Ok(format!("Download completed: {}", file_path))
}

#[tauri::command]
pub async fn launch_tool(tool_id: String, tool_path: String) -> Result<String, String> {
    info!("Launching tool: {} at {}", tool_id, tool_path);
    
    let path = std::path::Path::new(&tool_path);
    if !path.exists() {
        return Err(format!("Tool not found: {}", tool_path));
    }
    
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &tool_path])
            .spawn()
            .map_err(|e| format!("Failed to launch: {}", e))?;
    }
    
    info!("Tool {} launched", tool_id);
    Ok(format!("Tool launched: {}", tool_id))
}

#[tauri::command]
pub async fn get_storage_info() -> Result<Vec<StorageInfo>, String> {
    get_storage_list().await
}

#[tauri::command]
pub async fn cleanup_cache(cache_path: String) -> Result<u64, String> {
    info!("Cleaning cache: {}", cache_path);
    
    let path = std::path::Path::new(&cache_path);
    if !path.exists() {
        return Ok(0);
    }
    
    let mut cleaned: u64 = 0;
    
    for entry in std::fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        if metadata.is_file() {
            cleaned += metadata.len();
            std::fs::remove_file(entry.path()).ok();
        } else if metadata.is_dir() {
            cleaned += clean_dir(&entry.path());
        }
    }
    
    info!("Cleaned {} bytes", cleaned);
    Ok(cleaned)
}

fn clean_dir(path: &std::path::Path) -> u64 {
    let mut cleaned: u64 = 0;
    
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    cleaned += metadata.len();
                    std::fs::remove_file(entry.path()).ok();
                } else if metadata.is_dir() {
                    cleaned += clean_dir(&entry.path());
                }
            }
        }
    }
    
    std::fs::remove_dir(path).ok();
    cleaned
}

/// Calculate directory size in bytes
fn get_dir_size(path: &std::path::Path) -> u64 {
    if !path.exists() {
        return 0;
    }
    let mut size: u64 = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    size += metadata.len();
                } else if metadata.is_dir() {
                    size += get_dir_size(&entry.path());
                }
            }
        }
    }
    size
}

#[tauri::command]
pub async fn get_cache_size(cache_path: String) -> Result<u64, String> {
    let size = get_dir_size(std::path::Path::new(&cache_path));
    Ok(size)
}

/// Save settings to file
#[tauri::command]
pub async fn save_settings(settings_json: String) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("NPUToolbox");
    
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    
    let config_file = config_dir.join("settings.json");
    std::fs::write(&config_file, &settings_json).map_err(|e| e.to_string())?;
    
    info!("Settings saved to: {:?}", config_file);
    Ok(())
}

/// Load settings from file, returning sensible defaults with absolute paths.
#[tauri::command]
pub async fn load_settings() -> Result<String, String> {
    let config_file = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("NPUToolbox")
        .join("settings.json");
    
    if !config_file.exists() {
        let download_dir = dirs::download_dir()
            .or_else(dirs::home_dir)
            .unwrap_or_default()
            .join("NPUToolbox");
        let cache_dir = dirs::cache_dir()
            .unwrap_or_default()
            .join("NPUToolbox");
        let defaults = serde_json::json!({
            "theme": "light",
            "language": "zh-CN",
            "autoCheckUpdates": true,
            "downloadPath": download_dir.to_string_lossy(),
            "cachePath": cache_dir.to_string_lossy(),
        });
        return Ok(defaults.to_string());
    }
    
    let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
    Ok(content)
}

// ============ Ollama Proxy Commands ============

const OLLAMA_BASE: &str = "http://127.0.0.1:11434";

/// Check if Ollama is running
#[tauri::command]
pub async fn ollama_check() -> Result<bool, String> {
    Ok(
        reqwest::Client::new()
            .get(format!("{}/api/tags", OLLAMA_BASE))
            .timeout(std::time::Duration::from_secs(3))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    )
}

/// List locally available Ollama models
#[tauri::command]
pub async fn ollama_list_models() -> Result<Vec<serde_json::Value>, String> {
    let resp = reqwest::Client::new()
        .get(format!("{}/api/tags", OLLAMA_BASE))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| format!("Cannot connect to Ollama: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama returned status {}", resp.status()));
    }

    let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let models = body["models"].as_array().cloned().unwrap_or_default();
    Ok(models)
}

/// Send a chat message to Ollama and stream the response via Tauri events.
/// Emits "ollama-chat-chunk" with { content: string } for each token,
/// and "ollama-chat-done" when complete.
#[tauri::command]
pub async fn ollama_chat(
    app: tauri::AppHandle,
    model: String,
    messages: Vec<serde_json::Value>,
) -> Result<(), String> {
    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
    });

    let resp = reqwest::Client::new()
        .post(format!("{}/api/chat", OLLAMA_BASE))
        .timeout(std::time::Duration::from_secs(300))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama error {}: {}", status, text));
    }

    use futures_util::StreamExt;
    let mut stream = resp.bytes_stream();
    let mut buf = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buf.push_str(&String::from_utf8_lossy(&chunk));

        // Process complete JSON lines
        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].trim().to_string();
            buf = buf[pos + 1..].to_string();

            if line.is_empty() { continue; }
            let parsed: serde_json::Value = match serde_json::from_str(&line) {
                Ok(v) => v,
                Err(_) => continue,
            };

            if let Some(content) = parsed["message"]["content"].as_str() {
                if !content.is_empty() {
                    let _ = app.emit("ollama-chat-chunk", serde_json::json!({ "content": content }));
                }
            }

            if parsed["done"].as_bool() == Some(true) {
                let _ = app.emit("ollama-chat-done", serde_json::json!({}));
                return Ok(());
            }
        }
    }

    // If stream ended without explicit "done", emit done anyway
    let _ = app.emit("ollama-chat-done", serde_json::json!({}));
    Ok(())
}
