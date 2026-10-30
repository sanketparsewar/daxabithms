#Requires -Version 5.1
<#
.SYNOPSIS
  DaxabitHMS Windows Background Service Runner.
  Manages the lifecycle of PostgreSQL, NestJS Backend, and Next.js Web standalone server.
  Ensures automatic restart on failure, health monitoring, and graceful database shutdown.
#>

param(
    [string]$DataDir = "$env:ProgramData\DaxabitHMS\server",
    [string]$InstallDir = "$PSScriptRoot\.."
)

$ErrorActionPreference = 'Continue'

$PostgresPort = 55432
$BackendPort = 4001
$WebPort = 1995

$PgDataDir = Join-Path $DataDir 'pgdata'
$LogDir = Join-Path $DataDir 'logs'
$BackendEnvPath = Join-Path $DataDir 'backend.env'

$ServerDir = Join-Path $InstallDir 'server'
$NodeExe = Join-Path $ServerDir 'node\node.exe'
$PgBinDir = Join-Path $ServerDir 'postgres\bin'
$PgCtl = Join-Path $PgBinDir 'pg_ctl.exe'
$BackendDir = Join-Path $ServerDir 'backend'
$WebDir = Join-Path $ServerDir 'web'

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

$ServiceLog = Join-Path $LogDir 'service-runner.log'

function Log-Message([string]$msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
    $entry = "[$timestamp] $msg"
    Write-Host $entry
    try {
        Add-Content -Path $ServiceLog -Value $entry -ErrorAction SilentlyContinue
    } catch {}
}

Log-Message "=== DaxabitHMS Server Service Starting ==="
Log-Message "DataDir: $DataDir"
Log-Message "InstallDir: $InstallDir"

# Validate prerequisites
if (-not (Test-Path $PgDataDir)) {
    Log-Message "ERROR: PostgreSQL data directory not found at $PgDataDir. Run setup first."
    exit 1
}

if (-not (Test-Path $BackendEnvPath)) {
    Log-Message "ERROR: backend.env configuration not found at $BackendEnvPath."
    exit 1
}

# 1. Start PostgreSQL
Log-Message "Starting PostgreSQL 16 on port $PostgresPort..."
$pgLog = Join-Path $LogDir 'postgres.log'
$startPgArgs = "start -D `"$PgDataDir`" -l `"$pgLog`" -w -t 60"

$pgProcess = Start-Process -FilePath $PgCtl -ArgumentList $startPgArgs -WorkingDirectory $PgBinDir -NoNewWindow -Wait -PassThru
if ($pgProcess.ExitCode -ne 0) {
    Log-Message "WARNING: pg_ctl start returned exit code $($pgProcess.ExitCode). Checking status..."
    $statusProcess = Start-Process -FilePath $PgCtl -ArgumentList "status -D `"$PgDataDir`"" -WorkingDirectory $PgBinDir -NoNewWindow -Wait -PassThru
    if ($statusProcess.ExitCode -ne 0) {
        Log-Message "FATAL: PostgreSQL failed to start. Check $pgLog"
        exit 1
    }
}
Log-Message "PostgreSQL is running."

# Helper to read environment variables from backend.env
$BackendEnv = @{}
Get-Content $BackendEnvPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('=')
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        $BackendEnv[$key] = $val
    }
}

# 2. Function to start Backend
function Start-BackendProcess {
    Log-Message "Spawning NestJS Backend (Port $BackendPort)..."
    $backendMainJs = Join-Path $BackendDir 'dist\src\main.js'
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $NodeExe
    $psi.Arguments = "`"$backendMainJs`""
    $psi.WorkingDirectory = $BackendDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    foreach ($k in $BackendEnv.Keys) {
        $psi.EnvironmentVariables[$k] = $BackendEnv[$k]
    }
    $psi.EnvironmentVariables["PORT"] = [string]$BackendPort
    $psi.EnvironmentVariables["NODE_ENV"] = "production"

    $proc = [System.Diagnostics.Process]::Start($psi)
    
    # Async log readers
    $backendLog = Join-Path $LogDir 'backend.log'
    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            Add-Content -Path (Join-Path $Event.MessageData 'backend.log') -Value $EventArgs.Data -ErrorAction SilentlyContinue
        }
    } -MessageData $LogDir | Out-Null
    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            Add-Content -Path (Join-Path $Event.MessageData 'backend.log') -Value $EventArgs.Data -ErrorAction SilentlyContinue
        }
    } -MessageData $LogDir | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    return $proc
}

# 3. Function to start Web App
function Start-WebProcess {
    Log-Message "Spawning Next.js Web Standalone (Port $WebPort)..."
    $webServerJs = Join-Path $WebDir 'apps\web\server.js'
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $NodeExe
    $psi.Arguments = "`"$webServerJs`""
    $psi.WorkingDirectory = $WebDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $psi.EnvironmentVariables["PORT"] = [string]$WebPort
    $psi.EnvironmentVariables["HOSTNAME"] = "0.0.0.0"
    $psi.EnvironmentVariables["NODE_ENV"] = "production"
    $psi.EnvironmentVariables["BACKEND_URL"] = "http://127.0.0.1:$BackendPort"

    $proc = [System.Diagnostics.Process]::Start($psi)

    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            Add-Content -Path (Join-Path $Event.MessageData 'web.log') -Value $EventArgs.Data -ErrorAction SilentlyContinue
        }
    } -MessageData $LogDir | Out-Null
    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            Add-Content -Path (Join-Path $Event.MessageData 'web.log') -Value $EventArgs.Data -ErrorAction SilentlyContinue
        }
    } -MessageData $LogDir | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    return $proc
}

# Clean shutdown handler
$script:Running = $true
function Stop-AllServices {
    Log-Message "Shutting down all DaxabitHMS services gracefully..."
    $script:Running = $false

    if ($script:WebProc -and -not $script:WebProc.HasExited) {
        Log-Message "Stopping Web process..."
        try {
            $script:WebProc.Kill($true)
            $script:WebProc.WaitForExit(5000)
        } catch {}
    }

    if ($script:BackendProc -and -not $script:BackendProc.HasExited) {
        Log-Message "Stopping Backend process..."
        try {
            $script:BackendProc.Kill($true)
            $script:BackendProc.WaitForExit(5000)
        } catch {}
    }

    Log-Message "Stopping PostgreSQL gracefully (flushing WAL)..."
    Start-Process -FilePath $PgCtl -ArgumentList "stop -D `"$PgDataDir`" -m fast -w" -WorkingDirectory $PgBinDir -NoNewWindow -Wait
    Log-Message "All services stopped cleanly."
}

# Trap signals / process exit
[Console]::TreatControlCAsInput = $false
Register-EngineEvent -SourceIdentifier ([System.Management.Automation.PsEngineEvent]::Exiting) -Action {
    Stop-AllServices
} | Out-Null

$script:BackendProc = Start-BackendProcess
$script:WebProc = Start-WebProcess

Log-Message "Services started. Entering supervisor health-monitoring loop."

$restartBackoffSec = 3

while ($script:Running) {
    Start-Sleep -Seconds 5

    # Check Backend
    if ($script:BackendProc.HasExited) {
        $code = $script:BackendProc.ExitCode
        Log-Message "WARNING: Backend exited unexpectedly with code $code. Restarting in $restartBackoffSec seconds..."
        Start-Sleep -Seconds $restartBackoffSec
        $script:BackendProc = Start-BackendProcess
    }

    # Check Web
    if ($script:WebProc.HasExited) {
        $code = $script:WebProc.ExitCode
        Log-Message "WARNING: Web server exited unexpectedly with code $code. Restarting in $restartBackoffSec seconds..."
        Start-Sleep -Seconds $restartBackoffSec
        $script:WebProc = Start-WebProcess
    }
}

Stop-AllServices
