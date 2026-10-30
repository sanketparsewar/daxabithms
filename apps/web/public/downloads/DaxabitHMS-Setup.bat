@echo off
setlocal EnableDelayedExpansion
title Daxabit Hospitality Suite - Windows Setup

echo ====================================================================
echo             DAXABIT HOSPITALITY MANAGEMENT SYSTEM
echo             Windows Desktop Setup ^& Launcher (Offline/Online)
echo ====================================================================
echo.

:: Detect if Microsoft Edge exists (used for native standalone window mode)
set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" (
    set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

:: User choice
echo Choose an installation or launch option:
echo.
echo   [1] Launch Daxabit Desktop App (Online/LAN Client)
echo   [2] Launch Standalone Offline Server + Desktop (All-in-One PC)
echo   [3] Create Desktop Shortcut for Daxabit HMS
echo   [4] Install / Build Native MSIX Package (Developer Mode)
echo   [5] Exit
echo.
set /p CHOICE="Enter choice (1-5) [default: 1]: "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto LaunchClient
if "%CHOICE%"=="2" goto LaunchOffline
if "%CHOICE%"=="3" goto CreateShortcut
if "%CHOICE%"=="4" goto BuildMSIX
if "%CHOICE%"=="5" goto End

:LaunchClient
echo.
echo --------------------------------------------------------------------
echo Starting Daxabit Desktop in Standalone Window Mode...
echo --------------------------------------------------------------------
set /p SERVER_URL="Enter Server URL [Press Enter for http://localhost:3000]: "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:3000

if exist "%EDGE_PATH%" (
    start "" "%EDGE_PATH%" --app="%SERVER_URL%" --window-size=1280,800
) else (
    start "" "%SERVER_URL%"
)
goto End

:LaunchOffline
echo.
echo --------------------------------------------------------------------
echo Setting up Complete Standalone Offline Restaurant Server...
echo --------------------------------------------------------------------
echo This will check your local dependencies and start the offline stack.
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '..\..\scripts\quickstart.ps1') { & '..\..\scripts\quickstart.ps1' } else { irm https://raw.githubusercontent.com/daxabithms/daxabithms/master/scripts/quickstart.ps1 | iex }"
goto End

:CreateShortcut
echo.
echo --------------------------------------------------------------------
echo Creating Desktop Shortcut...
echo --------------------------------------------------------------------
set /p SHORTCUT_URL="Target URL [default: http://localhost:3000]: "
if "%SHORTCUT_URL%"=="" set SHORTCUT_URL=http://localhost:3000

powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Daxabit HMS.lnk')); $Shortcut.TargetPath = '%EDGE_PATH%'; $Shortcut.Arguments = '--app=' + '%SHORTCUT_URL%'; $Shortcut.Description = 'Daxabit Hospitality Suite'; $Shortcut.Save(); Write-Host 'Desktop shortcut created successfully!'"
pause
goto End

:BuildMSIX
echo.
echo --------------------------------------------------------------------
echo Launching MSIX Packaging Script...
echo --------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '..\..\windows\msix\build-windows-msix.ps1') { & '..\..\windows\msix\build-windows-msix.ps1' -SelfSignedTest -InstallLocally } else { Write-Host 'Please run from repository directory to build MSIX package.' -ForegroundColor Yellow }"
pause
goto End

:End
echo.
echo Setup completed.
exit /b 0
