<#
.SYNOPSIS
  Exits 0 if an adequate Node.js (>= MinVersion) is already on PATH, 1 otherwise.
  Never installs anything itself -- the installer decides what to do with the result.
  On success, prints ONLY the resolved node.exe's directory to stdout -- nothing else.
  The installer captures this script's stdout as a single value to parse (via a
  powershell.exe invocation whose output is redirected to a file), and Write-Host
  output ends up in that same captured stream, so no other Write-Host/Write-Output
  call may appear here: any of it would corrupt the parsed value. Errors go to
  Write-Error (stderr) instead, which the installer never parses -- only checks this
  script's exit code.
#>
param(
    [string]$MinVersion = "18.18.0"
)

$ErrorActionPreference = "Stop"

try {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Error "No node on PATH."
        exit 1
    }

    $rawVersion = (& node --version).Trim().TrimStart("v")
    $installed = [version]$rawVersion
    $minimum = [version]$MinVersion

    if ($installed -ge $minimum) {
        Write-Output (Split-Path $nodeCmd.Source -Parent)
        exit 0
    }

    Write-Error "Existing node v$rawVersion is below minimum v$MinVersion."
    exit 1
}
catch {
    Write-Error "Check-Node.ps1 failed to determine node version: $_"
    exit 1
}
