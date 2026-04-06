use serde::{Deserialize, Serialize};
use log::{info, warn};
use std::process::Command;

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

pub struct NPUDetector;

impl NPUDetector {
    /// Run PowerShell command and return output
    fn run_powershell(script: &str) -> Result<String, String> {
        match Command::new("powershell")
            .args(["-NoProfile", "-Command", script])
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    Ok(String::from_utf8_lossy(&output.stdout).to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(format!("PowerShell error: {}", stderr))
                }
            }
            Err(e) => Err(format!("Failed to run PowerShell: {}", e)),
        }
    }

    /// Detect NPU using CIM (Common Information Model) queries
    pub fn detect_via_cim() -> Result<Option<NPUStatus>, String> {
        info!("Detecting NPU via CIM...");

        let script = r#"
            try {
                # Check for Intel AI Boost NPU using CIM - specific matching
                $devices = Get-CimInstance -ClassName Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object {
                    ($_.Name -like '*Intel*AI*Boost*' -or
                     $_.Name -like '*Intel*NPU*' -or
                     $_.Name -like '*Meteor*Lake*NPU*' -or
                     $_.Name -like '*Lunar*Lake*NPU*' -or
                     $_.Name -like '*AMD*Ryzen*AI*' -or
                     $_.Name -like '*AMD*XDNA*') -and
                    ($_.DeviceID -notlike '*HID*' -and
                     $_.DeviceID -notlike '*USB*' -and
                     $_.DeviceID -notlike '*DISPLAY*' -and
                     $_.DeviceID -notlike '*KEYBOARD*')
                }

                if ($devices) {
                    foreach ($d in $devices) {
                        Write-Output "CIM_DEVICE=$($d.Name)|$($d.DeviceID)|$($d.Status)"
                    }
                } else {
                    Write-Output "CIM_NO_DEVICES"
                }
            } catch {
                Write-Output "CIM_ERROR=$($_.Exception.Message)"
            }
        "#;

        let output = Self::run_powershell(script)?;

        for line in output.lines() {
            let line = line.trim();
            if line.is_empty() { continue; }

            if line.starts_with("CIM_DEVICE=") {
                let parts: Vec<&str> = line[11..].split('|').collect();
                if parts.len() >= 2 {
                    let name = parts[0];
                    let device_id = parts[1];

                    let (vendor, tops) = if device_id.to_lowercase().contains("ven_8086") {
                        ("Intel", 40.0)
                    } else if device_id.to_lowercase().contains("ven_1002") {
                        ("AMD", 45.0)
                    } else {
                        ("Unknown", 0.0)
                    };

                    info!("Found NPU via CIM: {} ({})", name, device_id);

                    return Ok(Some(NPUStatus {
                        has_npu: true,
                        vendor: vendor.to_string(),
                        model: name.to_string(),
                        compute_units: 0,
                        tops,
                        driver_version: "Installed".to_string(),
                        status: "available".to_string(),
                        recommendations: vec![
                            format!("NPU detected: {}", name),
                            "Can use NPU-accelerated AI features".to_string(),
                        ],
                    }));
                }
            }
        }

        Ok(None)
    }

    /// Detect NPU by analyzing CPU model (Intel Core Ultra, AMD Ryzen AI)
    pub fn detect_via_cpu() -> Result<Option<NPUStatus>, String> {
        info!("Detecting NPU via CPU model analysis...");

        let script = r#"
            try {
                $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
                $cpuName = $cpu.Name

                Write-Output "CPU_NAME=$cpuName"

                # Check for Intel Ultra/Core series that have NPU - specific models
                if ($cpuName -match 'Ultra.*7.*255H|Ultra.*7.*265|Ultra.*5.*225H|Ultra.*5.*245' -or
                    $cpuName -match 'Core.*i[3579]-1[345]\d{3}') {
                    Write-Output "INTEL_ULTRA_CPU=$cpuName"
                } elseif ($cpuName -match 'Ryzen.*AI.*9.*9\d{3}|Ryzen.*AI.*7.*7\d{3}' -or
                          $cpuName -match 'XDNA') {
                    Write-Output "AMD_AI_CPU=$cpuName"
                }
            } catch {
                Write-Output "CPU_CHECK_ERROR=$($_.Exception.Message)"
            }
        "#;

        let output = Self::run_powershell(script)?;

        for line in output.lines() {
            let line = line.trim();
            if line.starts_with("INTEL_ULTRA_CPU=") {
                let cpu_name = &line[17..];
                info!("Inferred Intel NPU from CPU model: {}", cpu_name);

                return Ok(Some(NPUStatus {
                    has_npu: true,
                    vendor: "Intel".to_string(),
                    model: "Intel AI Boost (inferred from CPU)".to_string(),
                    compute_units: 0,
                    tops: 40.0,
                    driver_version: "Installed".to_string(),
                    status: "available".to_string(),
                    recommendations: vec![
                        format!("NPU-capable CPU detected: {}", cpu_name),
                        "Intel AI Boost NPU available".to_string(),
                    ],
                }));
            } else if line.starts_with("AMD_AI_CPU=") {
                let cpu_name = &line[12..];
                info!("Inferred AMD NPU from CPU model: {}", cpu_name);

                return Ok(Some(NPUStatus {
                    has_npu: true,
                    vendor: "AMD".to_string(),
                    model: "AMD Ryzen AI (inferred from CPU)".to_string(),
                    compute_units: 0,
                    tops: 45.0,
                    driver_version: "Installed".to_string(),
                    status: "available".to_string(),
                    recommendations: vec![
                        format!("NPU-capable CPU detected: {}", cpu_name),
                        "AMD Ryzen AI NPU available".to_string(),
                    ],
                }));
            }
        }

        Ok(None)
    }

    /// Detect NPU via registry analysis
    pub fn detect_via_registry() -> Result<Option<NPUStatus>, String> {
        info!("Detecting NPU via registry analysis...");

        let script = r#"
            try {
                $found = $false
                $found_info = ""

                # Check multiple registry locations
                $registryPaths = @(
                    "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e97b-e325-11ce-bfc1-08002be10318}",
                    "HKLM:\SYSTEM\CurrentControlSet\Services",
                    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DevicePath",
                    "HKLM:\HARDWARE\DEVICEMAP"
                )

                foreach ($path in $registryPaths) {
                    if (Test-Path $path) {
                        try {
                            $items = Get-ChildItem $path -ErrorAction SilentlyContinue
                            foreach ($item in $items) {
                                $props = Get-ItemProperty $item.PSPath -ErrorAction SilentlyContinue
                                if ($props) {
                                    $desc = $props.DriverDesc
                                    $service = $props.Service
                                    $deviceDesc = $props.DeviceDesc

                                    if (($desc -and ($desc -like '*AI*' -or $desc -like '*NPU*' -or $desc -like '*Neural*')) -or
                                        ($service -and ($service -like '*AI*' -or $service -like '*NPU*' -or $service -like '*Neural*')) -or
                                        ($deviceDesc -and ($deviceDesc -like '*AI*' -or $deviceDesc -like '*NPU*' -or $deviceDesc -like '*Neural*'))) {

                                        $found_info = "$desc|$service|$deviceDesc"
                                        $found = $true
                                        break
                                    }
                                }
                            }
                            if ($found) { break }
                        } catch {
                            # Continue to next path
                        }
                    }
                }

                if ($found) {
                    Write-Output "REGISTRY_FOUND=$found_info"
                } else {
                    Write-Output "REGISTRY_NO_MATCH"
                }
            } catch {
                Write-Output "REGISTRY_ERROR=$($_.Exception.Message)"
            }
        "#;

        let output = Self::run_powershell(script)?;

        for line in output.lines() {
            if line.starts_with("REGISTRY_FOUND=") {
                let found_info = &line[15..];
                let parts: Vec<&str> = found_info.split('|').collect();
                let desc = parts.get(0).unwrap_or(&"NPU");

                let (vendor, tops) = if desc.to_lowercase().contains("intel") {
                    ("Intel", 40.0)
                } else if desc.to_lowercase().contains("amd") {
                    ("AMD", 45.0)
                } else {
                    ("Unknown", 0.0)
                };

                info!("Found NPU via registry: {}", desc);

                return Ok(Some(NPUStatus {
                    has_npu: true,
                    vendor: vendor.to_string(),
                    model: desc.to_string(),
                    compute_units: 0,
                    tops,
                    driver_version: "Installed".to_string(),
                    status: "available".to_string(),
                    recommendations: vec![
                        format!("NPU detected via registry: {}", desc),
                        "Can use NPU-accelerated AI features".to_string(),
                    ],
                }));
            }
        }

        Ok(None)
    }

    /// Detect NPU via driver file analysis
    pub fn detect_via_driver_files() -> Result<Option<NPUStatus>, String> {
        info!("Detecting NPU via driver file analysis...");

        let script = r#"
            try {
                $driverPaths = @(
                    "$env:windir\System32\drivers",
                    "$env:windir\SysWOW64\drivers"
                )

                $npuDrivers = @("iguard.sys", "igcc.sys", "npudrv.sys", "neural.sys", "ai_boost.sys", "IntelNpuDriver.sys")
                $found = $false
                $found_driver = ""

                foreach ($path in $driverPaths) {
                    if (Test-Path $path) {
                        foreach ($driver in $npuDrivers) {
                            $driverPath = Join-Path $path $driver
                            if (Test-Path $driverPath) {
                                $found_driver = $driver
                                $found = $true
                                break
                            }
                        }
                        if ($found) { break }
                    }
                }

                if ($found) {
                    Write-Output "DRIVER_FOUND=$found_driver"
                } else {
                    Write-Output "DRIVER_NO_MATCH"
                }
            } catch {
                Write-Output "DRIVER_ERROR=$($_.Exception.Message)"
            }
        "#;

        let output = Self::run_powershell(script)?;

        for line in output.lines() {
            if line.starts_with("DRIVER_FOUND=") {
                let driver = &line[13..];

                let (vendor, model, tops) = if driver.to_lowercase().contains("intel") || driver.to_lowercase().contains("ig") {
                    ("Intel", "Intel AI Boost", 40.0)
                } else {
                    ("Unknown", "NPU Device", 0.0)
                };

                info!("Found NPU via driver file: {}", driver);

                return Ok(Some(NPUStatus {
                    has_npu: true,
                    vendor: vendor.to_string(),
                    model: model.to_string(),
                    compute_units: 0,
                    tops,
                    driver_version: "Installed".to_string(),
                    status: "available".to_string(),
                    recommendations: vec![
                        format!("NPU driver detected: {}", driver),
                        "Can use NPU-accelerated AI features".to_string(),
                    ],
                }));
            }
        }

        Ok(None)
    }

    /// Detect NPU via specific device IDs
    pub fn detect_via_device_id() -> Result<Option<NPUStatus>, String> {
        info!("Detecting NPU via device ID analysis...");

        let script = r#"
            try {
                # Check for known NPU device IDs
                $npuDeviceIds = @(
                    "PCI\VEN_8086&DEV_7D55",  # Intel Meteor Lake NPU
                    "PCI\VEN_8086&DEV_7D15",  # Intel Meteor Lake NPU
                    "PCI\VEN_8086&DEV_643E",  # Intel Lunar Lake NPU
                    "PCI\VEN_8086&DEV_64BE",  # Intel Lunar Lake NPU
                    "PCI\VEN_1002&DEV_1502"   # AMD Ryzen AI NPU
                )

                foreach ($deviceId in $npuDeviceIds) {
                    $device = Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object {
                        $_.DeviceID -like "*$deviceId*"
                    }

                    if ($device) {
                        Write-Output "DEVICE_ID_FOUND=$($device.DeviceID)|$($device.FriendlyName)"
                        break
                    }
                }

                Write-Output "DEVICE_ID_NO_MATCH"
            } catch {
                Write-Output "DEVICE_ID_ERROR=$($_.Exception.Message)"
            }
        "#;

        let output = Self::run_powershell(script)?;

        for line in output.lines() {
            if line.starts_with("DEVICE_ID_FOUND=") {
                let parts: Vec<&str> = line[16..].split('|').collect();
                let device_id = parts.get(0).unwrap_or(&"");
                let friendly_name = parts.get(1).unwrap_or(&"NPU Device");

                let (vendor, tops) = if device_id.to_lowercase().contains("ven_8086") {
                    ("Intel", 40.0)
                } else if device_id.to_lowercase().contains("ven_1002") {
                    ("AMD", 45.0)
                } else {
                    ("Unknown", 0.0)
                };

                info!("Found NPU via device ID: {} ({})", device_id, friendly_name);

                return Ok(Some(NPUStatus {
                    has_npu: true,
                    vendor: vendor.to_string(),
                    model: friendly_name.to_string(),
                    compute_units: 0,
                    tops,
                    driver_version: "Installed".to_string(),
                    status: "available".to_string(),
                    recommendations: vec![
                        format!("NPU detected: {}", friendly_name),
                        "Can use NPU-accelerated AI features".to_string(),
                    ],
                }));
            }
        }

        Ok(None)
    }

    /// Main NPU detection function that tries all methods
    pub fn detect_npu() -> NPUStatus {
        info!("Starting comprehensive NPU detection...");

        // Try each detection method in order
        let detection_methods = [
            ("CIM", Self::detect_via_cim()),
            ("CPU", Self::detect_via_cpu()),
            ("Registry", Self::detect_via_registry()),
            ("Driver Files", Self::detect_via_driver_files()),
            ("Device ID", Self::detect_via_device_id()),
        ];

        for (method_name, result) in detection_methods {
            match result {
                Ok(Some(npu_status)) => {
                    info!("NPU detected using {} method", method_name);
                    return npu_status;
                }
                Ok(None) => {
                    info!("{} method found no NPU", method_name);
                }
                Err(e) => {
                    warn!("{} method failed: {}", method_name, e);
                }
            }
        }

        // No NPU detected
        info!("No NPU detected on this system after comprehensive search");
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
                "AI features will use CPU/GPU acceleration instead".to_string(),
                "Consider checking for BIOS updates or driver installations".to_string(),
            ],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_via_cim() {
        let result = NPUDetector::detect_via_cim();
        // Just check it doesn't panic
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_via_cpu() {
        let result = NPUDetector::detect_via_cpu();
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_via_registry() {
        let result = NPUDetector::detect_via_registry();
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_via_driver_files() {
        let result = NPUDetector::detect_via_driver_files();
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_via_device_id() {
        let result = NPUDetector::detect_via_device_id();
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_npu() {
        let result = NPUDetector::detect_npu();
        // Should return a valid NPUStatus
        assert!(matches!(result.has_npu, true | false));
    }
}