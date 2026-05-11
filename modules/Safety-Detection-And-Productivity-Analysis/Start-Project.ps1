$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ToolsDir = Join-Path $Root ".tools"
$LogsDir = Join-Path $Root "logs"
$PidsDir = Join-Path $Root ".pids"
$NpmDir = Join-Path $ToolsDir "npm-10.9.2"
$NpmCli = Join-Path $NpmDir "bin\npm-cli.js"
$FrontendPid = Join-Path $PidsDir "frontend.pid"
$BackendPid = Join-Path $PidsDir "backend.pid"

New-Item -ItemType Directory -Force -Path $ToolsDir, $LogsDir, $PidsDir | Out-Null

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Command($Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-NodePath {
  if (Test-Command "node") {
    return (Get-Command "node").Source
  }

  $LocalNode = Join-Path $ToolsDir "node-v20.19.5-win-x64\node.exe"
  if (Test-Path $LocalNode) {
    return $LocalNode
  }

  Write-Step "Node.js was not found. Downloading a portable local copy"
  $ZipPath = Join-Path $ToolsDir "node.zip"
  Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.19.5/node-v20.19.5-win-x64.zip" -OutFile $ZipPath
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $ToolsDir -Force
  Remove-Item -LiteralPath $ZipPath -Force
  return $LocalNode
}

function Get-PythonCommand {
  $Candidates = @(
    @{ exe = "py"; args = @("-3.12") },
    @{ exe = "python"; args = @() },
    @{ exe = "python3"; args = @() }
  )

  foreach ($Candidate in $Candidates) {
    if (-not (Test-Command $Candidate.exe)) {
      continue
    }

    $Version = & $Candidate.exe @($Candidate.args + @("-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")) 2>$null
    if ($LASTEXITCODE -eq 0 -and $Version -eq "3.12") {
      return $Candidate
    }
  }

  throw @"
Python 3.12 was not found.

Please install Python 3.12 for Windows, then run Start-Project.bat again.
Download page: https://www.python.org/downloads/release/python-312/

The project libraries will still be installed only inside this folder's .venv directory.
"@
}

function Start-TrackedProcess($Name, $FilePath, $Arguments, $PidFile, $OutFile, $ErrFile) {
  if (Test-Path $PidFile) {
    $ExistingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($ExistingPid -and (Get-Process -Id $ExistingPid -ErrorAction SilentlyContinue)) {
      Write-Host "$Name is already running. PID: $ExistingPid" -ForegroundColor Yellow
      return
    }
  }

  $Process = Start-Process `
    -FilePath $FilePath `
    -ArgumentList $Arguments `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $OutFile `
    -RedirectStandardError $ErrFile `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -Path $PidFile -Value $Process.Id
  Write-Host "$Name started. PID: $($Process.Id)" -ForegroundColor Green
}

function Wait-ForUrl($Url, $Name) {
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
        Write-Host "$Name is ready: $Url" -ForegroundColor Green
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  Write-Host "$Name did not respond yet. Check the logs folder if the browser does not open." -ForegroundColor Yellow
}

Set-Location $Root

Write-Step "Checking local tools"
$Node = Get-NodePath
Write-Host "Node.js: $Node"

if (-not (Test-Path $NpmCli)) {
  Write-Step "Preparing local npm inside .tools"
  $NpmTgz = Join-Path $ToolsDir "npm.tgz"
  Invoke-WebRequest -Uri "https://registry.npmjs.org/npm/-/npm-10.9.2.tgz" -OutFile $NpmTgz
  tar -xzf $NpmTgz -C $ToolsDir
  if (Test-Path $NpmDir) {
    Remove-Item -LiteralPath $NpmDir -Recurse -Force
  }
  Rename-Item -Path (Join-Path $ToolsDir "package") -NewName "npm-10.9.2"
  Remove-Item -LiteralPath $NpmTgz -Force
}

Write-Step "Installing frontend dependencies locally"
if (-not (Test-Path (Join-Path $Root "node_modules"))) {
  & $Node $NpmCli install --legacy-peer-deps
} else {
  Write-Host "node_modules already exists. Skipping npm install."
}

Write-Step "Building frontend"
& $Node $NpmCli run build

Write-Step "Preparing local Python environment"
$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
  $Python = Get-PythonCommand
  & $Python["exe"] @($Python["args"] + @("-m", "venv", ".venv"))
}

& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r requirements.txt

Write-Step "Starting backend and frontend"
Start-TrackedProcess `
  -Name "Backend" `
  -FilePath $VenvPython `
  -Arguments @("backend\local_server.py") `
  -PidFile $BackendPid `
  -OutFile (Join-Path $LogsDir "backend.out.log") `
  -ErrFile (Join-Path $LogsDir "backend.err.log")

Start-Sleep -Seconds 5

Start-TrackedProcess `
  -Name "Frontend" `
  -FilePath $Node `
  -Arguments @("scripts\serve-build.js") `
  -PidFile $FrontendPid `
  -OutFile (Join-Path $LogsDir "frontend.out.log") `
  -ErrFile (Join-Path $LogsDir "frontend.err.log")

Wait-ForUrl "http://127.0.0.1:5000/" "Backend"
Wait-ForUrl "http://127.0.0.1:3000/safety-detection/app/" "Frontend"

Write-Host ""
Write-Host "Project is running." -ForegroundColor Green
Write-Host "Open this link in Google Chrome or Microsoft Edge:"
Write-Host "http://127.0.0.1:3000/safety-detection/app/" -ForegroundColor Cyan
Write-Host ""
Write-Host "To close the project, run Stop-Project.bat."
Start-Process "http://127.0.0.1:3000/safety-detection/app/"
