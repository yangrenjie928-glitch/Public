# Deploy Vite production build over SSH/scp (see china-cloud.nginx.conf: root .../dist)
# Настрой deployment.env рядом с корнем репозитория (не коммитится).
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$envFile = Join-Path $root "deployment.env"
if (-not (Test-Path $envFile)) {
  Write-Error "Нет файла deployment.env — создай файл и заполни DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH."
  exit 1
}

$DEPLOY_HOST = $null
$DEPLOY_USER = $null
$DEPLOY_PATH = $null
$DEPLOY_SSH_PORT = $null

foreach ($line in Get-Content $envFile -Encoding UTF8) {
  $t = $line.Trim()
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
  Write-Error "deployment.env должен содержать DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH."
  exit 1
}

if ($DEPLOY_HOST -eq '123.45.67.89') {
  Write-Host @"

DEPLOY_HOST всё ещё служебный пример 123.45.67.89.
Откройте deployment.env и укажите реальный IP или имя вашей виртуальной машины, затем снова:
  npm run deploy:vm

"@ -ForegroundColor Yellow
  exit 2
}

Write-Host "[deploy] npm run build" -ForegroundColor Cyan
npm run build
if (-not (Test-Path (Join-Path $root "dist\index.html"))) {
  Write-Error "Сборка не создала dist/index.html"
  exit 1
}

if (-not (Get-ChildItem "$root/dist" -Force | Select-Object -First 1)) {
  Write-Error "Папка dist пустая"
  exit 1
}

$windir = if ($env:SYSTEMROOT) { $env:SYSTEMROOT } else { 'C:\WINDOWS' }
$scpExe = Join-Path $windir 'System32\OpenSSH\scp.exe'
if (-not (Test-Path $scpExe)) {
  Write-Error "Не найден $scpExe. Включите OpenSSH Client в Windows или установите клиент SCP."
  exit 1
}

$distGlob = Join-Path $root "dist\*"
$target = "{0}@{1}:{2}/" -f $DEPLOY_USER, $DEPLOY_HOST, ($DEPLOY_PATH.TrimEnd('/') -replace '\\','/')

Write-Host "[deploy] копирую dist -> $target" -ForegroundColor Cyan

$scpArgs = @(
  '-o', 'ConnectTimeout=20',
  '-o', 'StrictHostKeyChecking=accept-new',
  '-r',
  $distGlob,
  $target
)
if ($DEPLOY_SSH_PORT -and $DEPLOY_SSH_PORT.Trim().Length -gt 0) {
  $scpArgs = @('-P', $DEPLOY_SSH_PORT.Trim()) + $scpArgs
}

& $scpExe @scpArgs

if ($LASTEXITCODE -ne 0) {
  Write-Error "scp завершился с кодом $LASTEXITCODE — проверьте SSH ключ, пользователя и путь на сервере."
  exit $LASTEXITCODE
}

Write-Host "[deploy] Готово. Проверьте https://china-cloud.ru при необходимости сброс кэша." -ForegroundColor Green
