# Deploy Vite build: tar stream over ssh (scp breaks when remote shell prints MOTD; nginx root: china-cloud.nginx.conf)
$ErrorActionPreference = "Stop"
try {
  if ([Console]::OutputEncoding.CodePage -ne 65001) {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  }
  $OutputEncoding = [Console]::OutputEncoding
} catch { }

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$envFile = Join-Path $root "deployment.env"
if (-not (Test-Path $envFile)) {
  Write-Host "Missing deployment.env — copy deployment.env.example, set DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH." -ForegroundColor Red
  exit 1
}

$DEPLOY_HOST = $null
$DEPLOY_USER = $null
$DEPLOY_PATH = $null
$DEPLOY_SSH_PORT = $null

foreach ($line in Get-Content $envFile -Encoding UTF8) {
  $t = $line.TrimStart([char]0xFEFF).Trim()
  if ($t.StartsWith('#') -or $t.Length -eq 0) { continue }
  if ($t -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    switch ($Matches[1]) {
      'DEPLOY_HOST' { $DEPLOY_HOST = $Matches[2].Trim() }
      'DEPLOY_USER' { $DEPLOY_USER = $Matches[2].Trim() }
      'DEPLOY_PATH' { $DEPLOY_PATH = $Matches[2].Trim() }
      'DEPLOY_SSH_PORT' { $DEPLOY_SSH_PORT = $Matches[2].Trim() }
    }
  }
}

if (-not $DEPLOY_HOST -or -not $DEPLOY_USER -or -not $DEPLOY_PATH) {
  Write-Host "deployment.env must define DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH." -ForegroundColor Red
  exit 1
}

Write-Host "[deploy] Using DEPLOY_HOST=$DEPLOY_HOST  USER=$DEPLOY_USER  PATH=$DEPLOY_PATH" -ForegroundColor DarkGray

Write-Host "[deploy] npm run build" -ForegroundColor Cyan
npm run build
if (-not (Test-Path (Join-Path $root "dist\index.html"))) {
  Write-Host "Build failed: dist/index.html not found." -ForegroundColor Red
  exit 1
}

if (-not (Get-ChildItem "$root/dist" -Force | Select-Object -First 1)) {
  Write-Host "dist folder is empty." -ForegroundColor Red
  exit 1
}

$windir = if ($env:SYSTEMROOT) { $env:SYSTEMROOT } else { 'C:\WINDOWS' }
$sshExe = Join-Path $windir 'System32\OpenSSH\ssh.exe'
if (-not (Test-Path $sshExe)) {
  Write-Host "OpenSSH ssh not found: $sshExe" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) {
  Write-Host "Windows tar.exe not found (need Windows 10+). Install tar or use WSL." -ForegroundColor Red
  exit 1
}

$remoteBase = ($DEPLOY_PATH.TrimEnd('/') -replace '\\', '/')
$sshTarget = "{0}@{1}" -f $DEPLOY_USER, $DEPLOY_HOST

$sshOpts = @(
  '-o', 'ConnectTimeout=30',
  '-o', 'StrictHostKeyChecking=accept-new'
)
if ($DEPLOY_SSH_PORT -and $DEPLOY_SSH_PORT.Trim().Length -gt 0) {
  $sshOpts = @('-p', $DEPLOY_SSH_PORT.Trim()) + $sshOpts
}

Write-Host "[deploy] prepare remote: $remoteBase (ssh)" -ForegroundColor Cyan
$prep = "set -e; mkdir -p '$remoteBase'; chmod 755 '$remoteBase' 2>/dev/null || true; rm -rf '$remoteBase'/*"
& $sshExe @sshOpts $sshTarget $prep
if ($LASTEXITCODE -ne 0) {
  Write-Host "ssh prepare failed ($LASTEXITCODE)." -ForegroundColor Red
  exit $LASTEXITCODE
}

$distDir = Join-Path $root "dist"
Write-Host "[deploy] upload dist via tar|ssh (avoids scp + noisy .bashrc)" -ForegroundColor Cyan
Push-Location $distDir
try {
  $extract = "tar xf - -C '$remoteBase'"
  & tar.exe -cf - . | & $sshExe @sshOpts $sshTarget $extract
  if ($LASTEXITCODE -ne 0) {
    Write-Host "ssh/tar upload failed ($LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}

Write-Host "[deploy] Done. Open https://china-cloud.ru (hard refresh / cache)." -ForegroundColor Green
