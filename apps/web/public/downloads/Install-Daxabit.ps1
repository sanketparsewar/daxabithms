# Daxabit Hospitality Suite — Automated Windows Setup & Launcher
# Online & Offline desktop installation
param(
    [string]$ServerUrl = "http://localhost:3000",
    [switch]$StandaloneOffline
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     DAXABIT HOSPITALITY MANAGEMENT SYSTEM FOR WINDOWS     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$EdgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $EdgePath)) {
    $EdgePath = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}

# Create desktop shortcut
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [System.Environment]::GetFolderPath('Desktop')
    $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine($DesktopPath, "Daxabit HMS.lnk"))
    $Shortcut.TargetPath = $EdgePath
    $Shortcut.Arguments = "--app=$ServerUrl --window-size=1280,800"
    $Shortcut.Description = "Daxabit Restaurant & Hospitality Management System"
    $Shortcut.Save()
    Write-Host "[+] Desktop shortcut created: Daxabit HMS.lnk" -ForegroundColor Green
} catch {
    Write-Host "[!] Could not create desktop shortcut automatically: $_" -ForegroundColor Yellow
}

if ($StandaloneOffline) {
    Write-Host "[*] Starting Offline Embedded Server environment..." -ForegroundColor Cyan
    irm https://raw.githubusercontent.com/sanketparsewar/daxabithms/main/scripts/quickstart.ps1 | iex
} else {
    Write-Host "[*] Launching Daxabit Desktop App window..." -ForegroundColor Green
    if (Test-Path $EdgePath) {
        Start-Process -FilePath $EdgePath -ArgumentList "--app=$ServerUrl --window-size=1280,800"
    } else {
        Start-Process $ServerUrl
    }
}

Write-Host "`nInstallation & Launcher completed!" -ForegroundColor Green
