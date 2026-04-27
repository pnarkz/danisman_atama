$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'

function Ensure-EnvFile([string]$dir) {
  $envPath = Join-Path $dir '.env'
  if (Test-Path $envPath) { return }

  $examplePath = Join-Path $dir '.env.example'
  if (Test-Path $examplePath) {
    Copy-Item $examplePath $envPath
    return
  }
}

Ensure-EnvFile $backendDir
Ensure-EnvFile $frontendDir

# Use npm.cmd to avoid Start-Process issues with npm.ps1
$npmCmd = Join-Path ${env:ProgramFiles} 'nodejs\npm.cmd'
if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd bulunamadi: $npmCmd"
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location `"$backendDir`"; & `"$npmCmd`" start"
)

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location `"$frontendDir`"; & `"$npmCmd`" start"
)

Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000/api" -ForegroundColor Green
