<#
.SYNOPSIS
  Finds a free TCP port on 127.0.0.1, starting at -PreferredPort and counting up.
  Prints the chosen port to stdout (and nothing else) on success.
#>
param(
    [int]$PreferredPort = 5433,
    [int]$MaxAttempts = 20
)

$ErrorActionPreference = "Stop"

function Test-PortFree([int]$Port) {
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        return $true
    }
    catch {
        return $false
    }
    finally {
        if ($listener) { $listener.Stop() }
    }
}

for ($i = 0; $i -lt $MaxAttempts; $i++) {
    $candidate = $PreferredPort + $i
    if (Test-PortFree -Port $candidate) {
        Write-Output $candidate
        exit 0
    }
}

Write-Error "Find-FreePort.ps1 could not find a free port in range $PreferredPort..$($PreferredPort + $MaxAttempts - 1)."
exit 1
