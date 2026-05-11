# Deploy static dist via Vite CLI + SCP (see china-cloud.nginx.conf: root .../dist).
# После сборки нужен уже установленный node_modules (`npm install` из системного Node).

$OutputEncoding = [System.Text.UTF8Encoding]::UTF8

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$envFile = Join-Path $root "deployment.env"
if (-not (Test-Path $envFile)) {
  Write-Error "[deploy] Missing deployment.env — add DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH."
  exit 1
}

$DEPLOY_HOST = $null
$DEPLOY_USER = $null
$DEPLOY_PATH = $null
$DEPLOY_SSH_PORT = $null

foreach ($raw in Get-Content $envFile -Encoding UTF8) {
  $t = $raw.TrimStart([char]0xFEFF).TrimEnd("`r").Trim()
  if (-not $t -or ($t.StartsWith('#'))) { continue }
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
  Write-Error "[deploy] deployment.env needs DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH."
  exit 1
}

if ($DEPLOY_HOST -eq '123.45.67.89') {
  Write-Host @"

[deploy] DEPLOY_HOST is still the demo IP 123.45.67.89.
Put your real VPS IP / hostname in deployment.env, then:
   npm run deploy:vm

[deploy] 请把 DEPLOY_HOST 改成真实虚拟机 IP 或域名，再执行 npm run deploy:vm。

"@ -ForegroundColor Yellow
  exit 2
}

$viteJs = Join-Path $root "node_modules\vite\bin\vite.js"
if (-not (Test-Path $viteJs)) {
  Write-Error "[deploy] No node_modules/vite. From system Node (e.g. D:\) open this folder and run: npm install"
  exit 1
}

$nodeExe = $null
foreach ($cmd in @(Get-Command node -CommandType Application -ErrorAction SilentlyContinue)) {
  if (-not $cmd.Source) { continue }
  $full = (Resolve-Path -LiteralPath $cmd.Source).Path
  $rootTrail = ($root.TrimEnd('\') + '\')
  if (-not ($full.StartsWith($rootTrail, [StringComparison]::OrdinalIgnoreCase))) {
    $nodeExe = $full
    break
  }
}
if (-not $nodeExe) {
  try {
    $nodeExe = (@(Get-Command node -CommandType Application -All -ErrorAction Stop)[0].Source)
  } catch {
    $nodeExe = 'node'
  }
}

Write-Host "[deploy] vite build (via node.exe; does not call npm):" -ForegroundColor Cyan
Write-Host ("  node = $nodeExe") -ForegroundColor DarkGray
Push-Location $root
try {
  & $nodeExe $viteJs build
} finally {
  Pop-Location
}

if (-not (Test-Path (Join-Path $root "dist\index.html"))) {
  Write-Error "[deploy] Build did not create dist/index.html"
  exit 1
}

if (-not (Get-ChildItem "$root/dist" -Force | Select-Object -First 1)) {
  Write-Error "[deploy] dist folder empty"
  exit 1
}

$windir = if ($env:SYSTEMROOT) { $env:SYSTEMROOT } else { 'C:\WINDOWS' }
$scpExe = Join-Path $windir 'System32\OpenSSH\scp.exe'
if (-not (Test-Path $scpExe)) {
  Write-Error "[deploy] SCP not found: $scpExe. Enable Windows OpenSSH Client."
  exit 1
}

$distGlob = Join-Path $root "dist\*"
$target = "{0}@{1}:{2}/" -f $DEPLOY_USER, $DEPLOY_HOST, ($DEPLOY_PATH.TrimEnd('/') -replace '\\', '/')

Write-Host "[deploy] scp -> $target" -ForegroundColor Cyan

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
  Write-Error "[deploy] scp exited with $LASTEXITCODE — check SSH key, user and remote path."
  exit $LASTEXITCODE
}

Write-Host "[deploy] Done. Hard-refresh browser if CDN/browser cached old assets." -ForegroundColor Green
