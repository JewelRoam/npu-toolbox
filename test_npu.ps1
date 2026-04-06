# Test CPU detection
try {
    $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    Write-Host "CPU: $($cpu.Name)"

    if ($cpu.Name -match 'Ultra|Core.*i[3579]') {
        Write-Host "INTEL_ULTRA_CPU detected: $($cpu.Name)"
    } elseif ($cpu.Name -match 'Ryzen.*AI|XDNA') {
        Write-Host "AMD_AI_CPU detected: $($cpu.Name)"
    }
} catch {
    Write-Host "CPU check error: $($_.Exception.Message)"
}

# Test CIM NPU detection
try {
    $devices = Get-CimInstance -ClassName Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like '*AI*' -or
        $_.Name -like '*NPU*' -or
        $_.Name -like '*Neural*' -or
        $_.Name -like '*Intel*Boost*'
    }

    if ($devices) {
        Write-Host "CIM devices found:"
        foreach ($d in $devices) {
            Write-Host "  - $($d.Name) (Status: $($d.Status))"
        }
    } else {
        Write-Host "No CIM NPU devices found"
    }
} catch {
    Write-Host "CIM error: $($_.Exception.Message)"
}