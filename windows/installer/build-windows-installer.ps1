#Requires -Version 7.0
<#
.SYNOPSIS
  Builds the DaxabitHMS-Setup.exe unified Windows installer using Inno Setup.
  Supports both Mode A (Server) and Mode B (Client).

.DESCRIPTION
  1. Publishes the native WinForms WebView2 Launcher shell (win-x64, self-contained).
  2. Runs stage-server-assets.ps1 to package portable Node.js, PostgreSQL 16, backend, and standalone web.
  3. Compiles DaxabitHMS-Setup.iss with Inno Setup compiler (ISCC.exe).
  4. Produces out/installer/DaxabitHMS-Setup.exe.

.PARAMETER SkipServerStaging
  Skips running stage-server-assets.ps1 if the server payload was already staged.
#>

param(
    [switch]$SkipServerStaging,
    [string]$Configuration = 'Release',
    [string]$CertificatePath,
    [string]$CertificatePassword,
    [string]$TimeStampServer = 'http://timestamp.digicert.com'
)

$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
$MsixDir = Join-Path $ScriptDir '..\msix'
$LauncherProj = Join-Path $MsixDir 'Launcher\Launcher.csproj'
$PublishDir = Join-Path $MsixDir 'out\publish'
$StageDir = Join-Path $MsixDir 'out\stage'
$InstallerOutputDir = Join-Path $RepoRoot 'out\installer'
$IssFile = Join-Path $ScriptDir 'DaxabitHMS-Setup.iss'

Write-Host "=== DaxabitHMS Windows Installer Build ===" -ForegroundColor Cyan
Write-Host "RepoRoot: $RepoRoot" -ForegroundColor Cyan

# 1. Check for required build tools
foreach ($tool in 'dotnet') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool not found on PATH. Install .NET 8 SDK."
    }
}

$isccPath = $null
if (Get-Command 'iscc' -ErrorAction SilentlyContinue) {
    $isccPath = 'iscc'
} elseif (Test-Path "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe") {
    $isccPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
} elseif (Test-Path "$env:ProgramFiles\Inno Setup 6\ISCC.exe") {
    $isccPath = "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
}

if (-not $isccPath) {
    throw "Inno Setup compiler (ISCC.exe) not found. Download and install Inno Setup 6 from https://jrsoftware.org/isdl.php"
}

# 2. Publish Launcher (self-contained win-x64)
Write-Host "-- Publishing WinForms Launcher..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $PublishDir | Out-Null
& dotnet publish $LauncherProj -c $Configuration -r win-x64 --self-contained -o $PublishDir
if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed with exit code $LASTEXITCODE"
}

# 3. Stage Server Assets (Postgres + Node + Backend + Web Standalone)
if (-not $SkipServerStaging) {
    Write-Host "-- Staging Server Assets..." -ForegroundColor Yellow
    $stageScript = Join-Path $MsixDir 'stage-server-assets.ps1'
    & pwsh -File $stageScript -StageDir $StageDir -RepoRoot $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        throw "stage-server-assets.ps1 failed with exit code $LASTEXITCODE"
    }
} else {
    Write-Host "-- Skipping server staging as requested." -ForegroundColor DarkGray
    $serverStageDir = Join-Path $StageDir 'server'
    New-Item -ItemType Directory -Force -Path $serverStageDir | Out-Null
    $placeholder = Join-Path $serverStageDir '.staging-placeholder'
    if (-not (Test-Path $placeholder) -and ((Get-ChildItem $serverStageDir -ErrorAction SilentlyContinue).Count -eq 0)) {
        Set-Content -Path $placeholder -Value "Server staging was skipped during this build."
    }
}

# 4. Compile Installer with Inno Setup
Write-Host "-- Compiling Installer with Inno Setup ($isccPath)..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallerOutputDir | Out-Null
& $isccPath $IssFile
if ($LASTEXITCODE -ne 0) {
    throw "ISCC compiler failed with exit code $LASTEXITCODE"
}

$finalInstaller = Join-Path $InstallerOutputDir 'DaxabitHMS-Setup.exe'
if (Test-Path $finalInstaller) {
    $sizeMb = [math]::Round(((Get-Item $finalInstaller).Length / 1MB), 2)
    Write-Host "Installer built successfully: $finalInstaller ($sizeMb MB)" -ForegroundColor Green
# 5. Sign Installer (Optional Production Authenticode Signing)
if ($CertificatePath) {
    if (-not (Get-Command signtool -ErrorAction SilentlyContinue)) {
        throw "signtool not found on PATH — required for signing installer."
    }
    if (-not (Test-Path $CertificatePath)) { throw "Certificate not found at $CertificatePath" }
    Write-Host "-- Signing DaxabitHMS-Setup.exe with Authenticode certificate..." -ForegroundColor Cyan
    & signtool sign /fd SHA256 /tr $TimeStampServer /td SHA256 /f $CertificatePath /p $CertificatePassword $finalInstaller
    if ($LASTEXITCODE -ne 0) { throw "signtool sign failed with exit code $LASTEXITCODE" }
    Write-Host "Installer signed successfully." -ForegroundColor Green
}

} else {
    throw "Build completed but $finalInstaller was not found."
}
