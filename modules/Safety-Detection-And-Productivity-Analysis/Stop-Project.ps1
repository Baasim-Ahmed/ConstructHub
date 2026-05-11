$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidsDir = Join-Path $Root ".pids"
$PidFiles = @(
  (Join-Path $PidsDir "frontend.pid"),
  (Join-Path $PidsDir "backend.pid")
)

function Stop-ProcessTree($TrackedPid) {
  $Children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$TrackedPid" -ErrorAction SilentlyContinue
  foreach ($Child in $Children) {
    Stop-ProcessTree ([int]$Child.ProcessId)
  }

  if (Get-Process -Id $TrackedPid -ErrorAction SilentlyContinue) {
    Stop-Process -Id $TrackedPid -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $TrackedPid" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Closing the project..." -ForegroundColor Cyan

foreach ($PidFile in $PidFiles) {
  if (-not (Test-Path $PidFile)) {
    continue
  }

  $PidText = (Get-Content -Raw -Path $PidFile).Trim()
  $TrackedPid = 0
  if ([int]::TryParse($PidText, [ref]$TrackedPid)) {
    Stop-ProcessTree $TrackedPid
  }

  Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

foreach ($Port in @(3000, 5000)) {
  $Connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($Connection in $Connections) {
    $TrackedPid = [int]$Connection.OwningProcess
    if (-not $TrackedPid) {
      continue
    }

    $ProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$TrackedPid" -ErrorAction SilentlyContinue
    $CommandLine = $ProcessInfo.CommandLine
    if ($CommandLine -like "*scripts\serve-build.js*" -or $CommandLine -like "*backend\local_server.py*") {
      Stop-ProcessTree $TrackedPid
    }
  }
}

Write-Host "Done. You can close this window." -ForegroundColor Green
Start-Sleep -Seconds 2
