; DaxabitHMS Inno Setup Installer Script
; Produces DaxabitHMS-Setup.exe supporting Mode A (Server) and Mode B (Client)

#define MyAppName "DaxabitHMS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Daxabit Technologies"
#define MyAppURL "https://github.com/daxabit/daxabithms"
#define MyAppExeName "DaxabitHMS.exe"

[Setup]
AppId={{5E9F8B2C-4A1D-4C6E-9B3E-8F1A2D3C4B5E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=..\..\LICENSE
OutputDir=..\..\out\installer
OutputBaseFilename=DaxabitHMS-Setup
SetupIconFile=..\msix\Assets\app.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes
RestartApplications=no

[Types]
Name: "server"; Description: "Full Local Application Server + Desktop Client (Main Restaurant PC - Recommended)"; Flags: iscustom
Name: "client"; Description: "Lightweight Client Terminal (For Waiter/Bar/KDS devices connecting to Main PC)"

[Components]
Name: "client_core"; Description: "DaxabitHMS Desktop Client Shell (WinForms + WebView2)"; Types: server client; Flags: fixed
Name: "server_core"; Description: "Local Server (PostgreSQL 16, NestJS Backend, Standalone Web Server)"; Types: server

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart_service"; Description: "Register and start local background service automatically on Windows boot"; GroupDescription: "Service Lifecycle:"; Components: server_core

[Files]
; Client binaries (always installed)
Source: "..\msix\out\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: client_core

; Server binaries and runtimes (Server mode only)
Source: "..\msix\out\stage\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: server_core
Source: "service-runner.ps1"; DestDir: "{app}\service"; Flags: ignoreversion; Components: server_core
Source: "setup-server.ps1"; DestDir: "{app}\service"; Flags: ignoreversion; Components: server_core

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Dirs]
Name: "{commonappdata}\{#MyAppName}"; Permissions: users-modify
Name: "{commonappdata}\{#MyAppName}\server"; Permissions: users-modify; Components: server_core
Name: "{commonappdata}\{#MyAppName}\server\pgdata"; Permissions: users-modify; Components: server_core
Name: "{commonappdata}\{#MyAppName}\server\uploads"; Permissions: users-modify; Components: server_core
Name: "{commonappdata}\{#MyAppName}\server\logs"; Permissions: users-modify; Components: server_core

[Run]
; Mode A: Safe Server initialization, migrations, and firewall rule
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\service\setup-server.ps1"" -InstallDir ""{app}"" -DataDir ""{commonappdata}\{#MyAppName}\server"""; \
    StatusMsg: "Provisioning local database, applying migrations, and configuring security..."; \
    Flags: runhidden waituntilterminated; Components: server_core

; Register Windows background service via sc.exe (with auto-restart on unexpected failure)
Filename: "sc.exe"; Parameters: "create DaxabitHMSServer binPath= ""powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \""{app}\service\service-runner.ps1\"" -InstallDir \""{app}\"" -DataDir \""{commonappdata}\{#MyAppName}\server\"""" start= auto DisplayName= ""DaxabitHMS Restaurant Server"""; \
    StatusMsg: "Registering Windows Background Service..."; \
    Flags: runhidden waituntilterminated; Components: server_core; Tasks: autostart_service

Filename: "sc.exe"; Parameters: "failure DaxabitHMSServer reset= 86400 actions= restart/5000/restart/10000/restart/60000"; \
    Flags: runhidden waituntilterminated; Components: server_core; Tasks: autostart_service

; Start the background service
Filename: "sc.exe"; Parameters: "start DaxabitHMSServer"; \
    StatusMsg: "Starting DaxabitHMS Server..."; \
    Flags: runhidden waituntilterminated; Components: server_core; Tasks: autostart_service

; Launch Desktop Client at end of setup
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Stop and remove Windows service
Filename: "sc.exe"; Parameters: "stop DaxabitHMSServer"; Flags: runhidden; Components: server_core
Filename: "sc.exe"; Parameters: "delete DaxabitHMSServer"; Flags: runhidden; Components: server_core

; Graceful fast shutdown of PostgreSQL if still running
Filename: "{app}\server\postgres\bin\pg_ctl.exe"; Parameters: "stop -D ""{commonappdata}\{#MyAppName}\server\pgdata"" -m fast -w"; Flags: runhidden; Components: server_core

; Remove firewall rule
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""DaxabitHMS POS Server"""; Flags: runhidden; Components: server_core

[Code]
var
  PurgeDataRequested: Boolean;

// Check Windows 10 Version 1809 (Build 17763) or higher
function InitializeSetup(): Boolean;
var
  Version: TWindowsVersion;
begin
  Result := True;
  GetWindowsVersionEx(Version);

  if (Version.Major < 10) or ((Version.Major = 10) and (Version.Build < 17763)) then
  begin
    SuppressibleMsgBox('DaxabitHMS requires Windows 10 (Version 1809 or higher) or Windows 11 64-bit.', mbCriticalError, MB_OK, MB_OK);
    Result := False;
    Exit;
  end;
end;

// Detect Microsoft Edge WebView2 Evergreen Runtime
function IsWebView2Installed(): Boolean;
var
  RegKey64: string;
  RegKey32: string;
  Value: string;
begin
  RegKey64 := 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  RegKey32 := 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  
  Result := RegQueryStringValue(HKLM, RegKey64, 'pv', Value) or
            RegQueryStringValue(HKLM, RegKey32, 'pv', Value) or
            RegQueryStringValue(HKCU, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Value);
end;

// Detect Visual C++ 2015-2022 x64 Redistributable
function IsVCRedistInstalled(): Boolean;
var
  Installed: Cardinal;
begin
  Result := RegQueryDWordValue(HKLM, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64', 'Installed', Installed) and (Installed = 1);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if not IsWebView2Installed() then
    begin
      SuppressibleMsgBox('Notice: Microsoft Edge WebView2 Runtime was not detected on this system.' + #13#10 +
                         'DaxabitHMS requires WebView2 to render the application interface.' + #13#10 +
                         'Please install it from Microsoft if the app fails to start.', mbInformation, MB_OK, MB_OK);
    end;
  end;
end;

// Check command line parameter for data purge
function CmdLineParamExists(const Param: string): Boolean;
var
  I: Integer;
begin
  Result := False;
  for I := 1 to ParamCount do
  begin
    if CompareText(ParamStr(I), Param) = 0 then
    begin
      Result := True;
      Exit;
    end;
  end;
end;

// Safe Uninstaller: Preserves Business Data by default
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  DataDir: string;
  ConfirmDelete: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    DataDir := ExpandConstant('{commonappdata}\{#MyAppName}\server\pgdata');
    PurgeDataRequested := CmdLineParamExists('/PURGE_DATA=1') or CmdLineParamExists('/PURGEDATA=1');

    if DirExists(DataDir) and not PurgeDataRequested and not UninstallSilent then
    begin
      ConfirmDelete := SuppressibleMsgBox(
        'Do you want to PERMANENTLY delete all restaurant data, invoices, and billing history?' + #13#10#13#10 +
        'Select NO to keep your restaurant records safe for future reinstalls or backups (Recommended).' + #13#10 +
        'Select YES only if you are completely decommissioning this computer.',
        mbConfirmation, MB_YESNO, IDNO);

      PurgeDataRequested := (ConfirmDelete = IDYES);
    end;
  end;

  if CurUninstallStep = usPostUninstall then
  begin
    if PurgeDataRequested then
    begin
      DelTree(ExpandConstant('{commonappdata}\{#MyAppName}'), True, True, True);
    end;
  end;
end;
