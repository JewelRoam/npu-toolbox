use std::process::Command;

fn main() {
    let script = r#"
        $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
        Write-Output "NAME=$($cpu.Name)"
        Write-Output "CORES=$($cpu.NumberOfCores)"
    "#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .expect("Failed to execute PowerShell");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    println!("STDOUT:\n{}", stdout);
    println!("STDERR:\n{}", stderr);
    println!("Exit code: {:?}", output.status.code());
}
