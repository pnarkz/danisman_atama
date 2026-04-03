$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path (Split-Path -Parent $root) "backend"
$sourceDb = Join-Path $backendDir "db\\danisman_atama.db"
$tempDir = Join-Path $env:TEMP "danisman-atama-playwright"
$targetDb = Join-Path $tempDir "danisman_atama.e2e.db"

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Remove-Item $targetDb -Force -ErrorAction SilentlyContinue
Remove-Item "$targetDb-shm" -Force -ErrorAction SilentlyContinue
Remove-Item "$targetDb-wal" -Force -ErrorAction SilentlyContinue
Copy-Item $sourceDb $targetDb -Force

$sourceShm = "$sourceDb-shm"
$sourceWal = "$sourceDb-wal"
$targetShm = "$targetDb-shm"
$targetWal = "$targetDb-wal"

if (Test-Path $sourceShm) {
  Copy-Item $sourceShm $targetShm -Force
}

if (Test-Path $sourceWal) {
  Copy-Item $sourceWal $targetWal -Force
}

$env:PORT = "3000"
$env:DB_PATH = $targetDb

Set-Location $backendDir
npm start
