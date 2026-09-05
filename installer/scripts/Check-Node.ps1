<#
.SYNOPSIS
  Exits 0 if an adequate Node.js (>= MinVersion) is already on PATH, 1 otherwise.
  Never installs anything itself -- the installer decides what to do with the result.
  On success, prints the resolved node.exe's directory as the last line of stdout --
  the installer is a single long-lived process, so it never sees an in-process PATH
  refresh after installing Node itself, and needs this absolute directory to invoke
  node/npm/npx later in the same run regardless of which case (pre-existing vs
  freshly-installed) applies.
#>
param(
    [string]$MinVersion = "18.18.0"
)

$ErrorActionPreference = "Stop"

try {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Host "No node on PATH."
        exit 1
    }

    $rawVersion = (& node --version).Trim().TrimStart("v")
    $installed = [version]$rawVersion
    $minimum = [version]$MinVersion

    if ($installed -ge $minimum) {
        Write-Host "Existing node v$rawVersion satisfies minimum v$MinVersion."
        Write-Output (Split-Path $nodeCmd.Source -Parent)
        exit 0
    }

    Write-Host "Existing node v$rawVersion is below minimum v$MinVersion."
    exit 1
}
catch {
    Write-Error "Check-Node.ps1 failed to determine node version: $_"
    exit 1
}
