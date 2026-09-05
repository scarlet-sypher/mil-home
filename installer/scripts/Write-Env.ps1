<#
.SYNOPSIS
  Renders installer/templates/env.template into {app}\.env with the resolved DB port.
  Always run, including on an update re-install, so .env stays in sync with whatever
  port the dedicated Postgres instance actually ended up on.
#>
param(
    [Parameter(Mandatory = $true)][string]$TemplatePath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][int]$DbPort
)

$ErrorActionPreference = "Stop"

$content = Get-Content -Path $TemplatePath -Raw
$content = $content -replace "__DB_PORT__", $DbPort
Set-Content -Path $OutputPath -Value $content -Encoding ascii -NoNewline

Write-Host "Wrote $OutputPath with DB port $DbPort."
exit 0
