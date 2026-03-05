use serde::{Deserialize, Serialize};
use std::process::Command;
use log::{info, warn};

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
pub struct NPUStatus {
    pub has_npu: bool,
    pub vendor: String,
    pub model: String,
    pub compute_units: u32,
    pub tops: f32,
    pub driver_version: String,
    pub status: String,
    pub recommendations: Vec<String>,
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

/// Execute PowerShell command and return output
fn run_powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .map_err(|e| format!("PowerShell execution failed: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    if !stderr.is_empty() {
        warn!("PowerShell stderr: {}", stderr);
    }
    
    Ok(stdout)
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
            
            # Try to get temperature (requires admin or specific tools)
            $temp = $null
            
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
    
    match run_powershell(script) {
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
            
            Ok(CPUInfo {
                name,
                cores,
                threads,
                frequency,
                temperature: 0.0, // Temperature requires special drivers/tools
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
    
    match run_powershell(script) {
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
    
    match run_powershell(script) {
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
    
    match run_powershell(script) {
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

/// Detect NPU using multiple methods
async fn detect_npu_internal() -> NPUStatus {
    info!("Detecting NPU...");
    
    // Method 1: Check for Intel AI Boost via Device Manager
    let intel_script = r#"
        try {
            # Check for Intel AI Boost NPU
            $devices = Get-PnpDevice | Where-Object { 
                $_.FriendlyName -like '*AI*' -or 
                $_.FriendlyName -like '*NPU*' -or
                $_.FriendlyName -like '*Neural*' -or
                $_.FriendlyName -like '*Intel*Boost*'
            }
            
            if ($devices) {
                foreach ($d in $devices) {
                    Write-Output "DEVICE=$($d.FriendlyName)"
                    Write-Output "STATUS=$($d.Status)"
                }
            }
            
            # Also check WMI for Intel NPU
            $pnpEntities = Get-CimInstance -ClassName Win32_PnPEntity | Where-Object {
                $_.Name -like '*AI*' -or 
                $_.Name -like '*NPU*' -or
                $_.Name -like '*Neural*'
            }
            
            if ($pnpEntities) {
                foreach ($p in $pnpEntities) {
                    Write-Output "PNP_NAME=$($p.Name)"
                }
            }
        } catch {
            Write-Output "ERROR=$($_.Exception.Message)"
        }
    "#;
    
    let mut has_npu = false;
    let mut npu_name = String::new();
    let mut vendor = String::new();
    
    match run_powershell(intel_script) {
        Ok(output) => {
            info!("NPU detection output: {}", output);
            
            for line in output.lines() {
                if line.starts_with("DEVICE=") || line.starts_with("PNP_NAME=") {
                    let name = if line.starts_with("DEVICE=") {
                        &line[7..]
                    } else {
                        &line[9..]
                    };
                    
                    let name_lower = name.to_lowercase();
                    
                    if name_lower.contains("intel") || name_lower.contains("ai boost") {
                        has_npu = true;
                        vendor = "Intel".to_string();
                        npu_name = name.to_string();
                    } else if name_lower.contains("amd") || name_lower.contains("ryzen ai") || name_lower.contains("xdna") {
                        has_npu = true;
                        vendor = "AMD".to_string();
                        npu_name = name.to_string();
                    } else if name_lower.contains("npu") || name_lower.contains("neural") {
                        has_npu = true;
                        npu_name = name.to_string();
                    }
                }
            }
        }
        Err(e) => {
            warn!("NPU detection PowerShell error: {}", e);
        }
    }
    
    // Method 2: Check for NPU via registry (Intel specific)
    if !has_npu {
        let registry_script = r#"
            try {
                # Check Intel NPU driver
                $intelNpu = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e97b-e325-11ce-bfc1-08002be10318}\*" -ErrorAction SilentlyContinue | Where-Object {
                    $_.DriverDesc -like '*AI*' -or $_.DriverDesc -like '*NPU*' -or $_.DriverDesc -like '*Neural*'
                }
                
                if ($intelNpu) {
                    Write-Output "REGISTRY_FOUND=$($intelNpu.DriverDesc)"
                }
            } catch {
                # Ignore registry errors
            }
        "#;
        
        match run_powershell(registry_script) {
            Ok(output) => {
                if output.contains("REGISTRY_FOUND=") {
                    for line in output.lines() {
                        if line.starts_with("REGISTRY_FOUND=") {
                            has_npu = true;
                            npu_name = line[15..].to_string();
                            vendor = if npu_name.to_lowercase().contains("intel") { "Intel".to_string() } else { "Unknown".to_string() };
                        }
                    }
                }
            }
            Err(_) => {}
        }
    }
    
    if has_npu {
        let model = if npu_name.is_empty() {
            "NPU".to_string()
        } else {
            npu_name
        };
        
        let tops = if vendor == "Intel" { 40.0 } else { 45.0 };
        
        NPUStatus {
            has_npu: true,
            vendor,
            model,
            compute_units: 0, // Requires specific driver API
            tops,
            driver_version: "Installed".to_string(),
            status: "available".to_string(),
            recommendations: vec![
                "NPU detected and available".to_string(),
                "Can use NPU-accelerated AI features".to_string(),
            ],
        }
    } else {
        NPUStatus {
            has_npu: false,
            vendor: String::new(),
            model: String::new(),
            compute_units: 0,
            tops: 0.0,
            driver_version: String::new(),
            status: "not_detected".to_string(),
            recommendations: vec![
                "No NPU detected on this system".to_string(),
                "AI features will use CPU/GPU acceleration".to_string(),
            ],
        }
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
    let npu = detect_npu_internal().await;
    
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
    Ok(detect_npu_internal().await)
}

#[tauri::command]
pub async fn detect_npu() -> Result<NPUStatus, String> {
    Ok(detect_npu_internal().await)
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
    
    match run_powershell(script) {
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
    
    run_powershell(&script)?;
    
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

/// Load settings from file
#[tauri::command]
pub async fn load_settings() -> Result<String, String> {
    let config_file = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("NPUToolbox")
        .join("settings.json");
    
    if !config_file.exists() {
        return Ok(r#"{"theme":"light","language":"zh-CN","autoCheckUpdates":true,"downloadPath":"./downloads","cachePath":"./cache"}"#.to_string());
    }
    
    let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
    Ok(content)
}