<#
.SYNOPSIS
  Polls the dedicated Postgres instance until it accepts real connections, or times out.
  The EDB installer (and a service restart) usually leaves Postgres ready immediately,
  but "usually" is a race condition, not a guarantee -- callers must wait on this before
  running psql against the instance.
#>
param(
    [Parameter(Mandatory = $true)][string]$PsqlPath,
    [int]$Port = 5433,
    [string]$SuperUser = "postgres",
    [Parameter(Mandatory = $true)][string]$SuperPassword,
    [int]$TimeoutSeconds = 15
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $SuperPassword

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ((Get-Date) -lt $deadline) {
    try {
        & $PsqlPath -h 127.0.0.1 -p $Port -U $SuperUser -d postgres -w -c "SELECT 1" *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Postgres on port $Port is ready."
            exit 0
        }
    }
    catch {
        # psql not answering yet -- expected while the service is still starting up.
    }
    Start-Sleep -Seconds 1
}

Write-Error "Postgres on port $Port did not become ready within $TimeoutSeconds seconds."
exit 1
