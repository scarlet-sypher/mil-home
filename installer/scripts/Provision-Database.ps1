<#
.SYNOPSIS
  Creates the rms_home role and rms_home database inside this app's dedicated Postgres
  instance only. Idempotent -- safe to call again if a prior install attempt got this
  far but failed on a later step.
#>
param(
    [Parameter(Mandatory = $true)][string]$PsqlPath,
    [int]$Port = 5433,
    [string]$SuperUser = "postgres",
    [Parameter(Mandatory = $true)][string]$SuperPassword,
    [string]$AppUser = "rms_home",
    [string]$AppPassword = "rms_home_dev",
    [string]$AppDatabase = "rms_home"
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $SuperPassword

$createRoleSql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AppUser') THEN
    CREATE ROLE $AppUser LOGIN SUPERUSER PASSWORD '$AppPassword';
  END IF;
END
`$`$;
"@

& $PsqlPath -h 127.0.0.1 -p $Port -U $SuperUser -d postgres -w -v ON_ERROR_STOP=1 -c $createRoleSql
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create role $AppUser."
    exit 1
}

$dbExists = & $PsqlPath -h 127.0.0.1 -p $Port -U $SuperUser -d postgres -w -tAc "SELECT 1 FROM pg_database WHERE datname = '$AppDatabase'"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to check for existing database $AppDatabase."
    exit 1
}

if (-not ($dbExists -match "1")) {
    & $PsqlPath -h 127.0.0.1 -p $Port -U $SuperUser -d postgres -w -v ON_ERROR_STOP=1 -c "CREATE DATABASE $AppDatabase OWNER $AppUser"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create database $AppDatabase."
        exit 1
    }
}

Write-Host "Role '$AppUser' and database '$AppDatabase' are provisioned."
exit 0
