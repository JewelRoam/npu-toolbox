//! Shared PowerShell execution utilities.

use log::warn;
use std::process::Command;

/// Execute PowerShell script, return stdout regardless of exit code.
/// Stderr is logged as a warning but does not cause an error.
/// Use for data-gathering commands where partial output is acceptable.
pub fn run(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("PowerShell execution failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !stderr.is_empty() {
        warn!("PowerShell stderr: {}", stderr.trim());
    }

    Ok(stdout)
}

/// Execute PowerShell script, return stdout only on success (exit code 0).
/// Use for detection/query commands where a non-zero exit means failure.
pub fn run_strict(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("PowerShell execution failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PowerShell error: {}", stderr.trim()));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}