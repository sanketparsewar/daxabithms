# Windows Desktop Installer

This optional Inno Setup installer builds the same local-only Windows desktop application as the MSIX package. It installs a local PostgreSQL database, the Node.js/NestJS API, the Next.js UI, and a WinForms/WebView2 launcher. All listeners bind to loopback; the installer does not open firewall ports or provide a remote-client mode.

## Build

Requires Windows 10/11 x64, the .NET 8 SDK, Node.js 22+, pnpm 11+, and Inno Setup 6.

```powershell
cd windows/installer
./build-windows-installer.ps1
```

The setup executable is written to `out/installer/DaxabitHMS-Setup.exe`. For the MSIX package, see [`windows/msix/README.md`](../msix/README.md).
