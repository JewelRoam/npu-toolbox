use std::process::Command;

fn run_powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .map_err(|e| format!("PowerShell execution failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    println!("STDOUT:\n{}", stdout);
    if !stderr.is_empty() {
        println!("STDERR:\n{}", stderr);
    }
    println!("Exit code: {:?}", output.status.code());

    Ok(stdout)
}

fn main() {
    println!("Testing NPU detection...");

    // Method 1: Check for Intel AI Boost via Device Manager
    let intel_script = r#"
        try {
            # Check for Intel AI Boost NPU
            $devices = Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object {
                $_.FriendlyName -like '*AI*' -or
                $_.FriendlyName -like '*NPU*' -or
                $_.FriendlyName -like '*Neural*' -or
                $_.FriendlyName -like '*Intel*Boost*'
            }

            if ($devices) {
                foreach ($d in $devices) {
                    Write-Output "DEVICE=$($d.FriendlyName)|$($d.Status)"
                }
            } else {
                Write-Output "NO_DEVICES_FOUND"
            }
        } catch {
            Write-Output "PS_ERROR=$($_.Exception.Message)"
        }
    "#;

    match run_powershell(intel_script) {
        Ok(output) => {
            println!("\nParsing output:");
            for line in output.lines() {
                let line = line.trim();
                if line.is_empty() { continue; }
                println!("Line: '{}'", line);

                if line.starts_with("DEVICE=") {
                    let parts: Vec<&str> = line[7..].split('|').collect();
                    let name = parts.get(0).unwrap_or(&"");
                    println!("Found device: '{}'", name);

                    let name_lower = name.to_lowercase();
                    if name_lower.contains("intel") && name_lower.contains("ai boost") {
                        println!("*** DETECTED INTEL AI BOOST: {} ***", name);
                    }
                }
            }
        }
        Err(e) => {
            println!("Error: {}", e);
        }
    }
}