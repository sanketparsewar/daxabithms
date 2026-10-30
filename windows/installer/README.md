# DaxabitHMS Windows Installer

This directory provides the production-grade Windows installation pipeline for DaxabitHMS.

## Distribution Architecture: EXE Installer vs. MSIX Package

### Why a Dual-Distribution Model?

1. **Server Installation (Mode A) -> `DaxabitHMS-Setup.exe` (Signed Inno Setup Installer)**
   - **Requirement:** Local PostgreSQL database, NestJS backend, and Next.js standalone web server running as a persistent Windows Service (`DaxabitHMSServer`) across reboots and user logoffs.
   - **Why MSIX Cannot Serve This Role:** Modern MSIX packages operate under the Windows AppContainer/Desktop Bridge sandbox. Files in `C:\Program Files\WindowsApps` carry restrictive access control lists (ACLs) that block spawning bundled arbitrary executables (such as `initdb.exe` and `postgres.exe`) directly in-place. Furthermore, MSIX packages cannot register native Windows Services with the Windows Service Control Manager (`sc.exe`), and MSIX offers no custom uninstallation hooks to protect customer business databases from accidental deletion upon application removal.
   - **Solution:** `DaxabitHMS-Setup.exe` installs application binaries to `C:\Program Files\DaxabitHMS`, stores data outside the program directory in `%PROGRAMDATA%\DaxabitHMS\server`, configures Windows Firewall rules for port 1995, registers a managed Windows background service with automatic failure recovery, and guarantees business data preservation upon uninstallation.

2. **Client Installation (Mode B) -> `DaxabitHMS-Setup.exe` (Client Component) OR `DaxabitHMS.msix`**
   - **Requirement:** Thin desktop shell (WinForms + WebView2) that connects to the main restaurant server over the local area network (LAN) or VPN.
   - **Zero Admin Rights:** Runs under standard user privileges (`asInvoker`).
   - **Clean Sandbox & Store Distribution:** Ideal for POS terminals, waiter tablets, bar order stations, and Kitchen Display Systems (KDS).

---

## Directory Contents

| File | Purpose |
|---|---|
| `DaxabitHMS-Setup.iss` | Inno Setup configuration script defining installer pages, prerequisite checks, component selection, firewall configuration, service registration, and data-safe uninstaller logic. |
| `service-runner.ps1` | Managed background supervisor daemon for the Windows Service lifecycle. Automatically monitors PostgreSQL, NestJS Backend, and Next.js Web processes, handles port health checks, restarts failed child processes, and coordinates graceful database shutdown (`pg_ctl stop -m fast -w`). |
| `setup-server.ps1` | Silent server provisioning utility executed during installation. Safely initializes the PostgreSQL database cluster with SCRAM-SHA-256 authentication, generates cryptographically secure secrets, writes `backend.env`, executes Prisma database migrations, and configures the Windows Firewall. |
| `build-windows-installer.ps1` | End-to-end automation script to publish the WinForms client, stage portable Node.js and PostgreSQL runtimes, and compile `DaxabitHMS-Setup.exe`. |

---

## Building the Installer

### Prerequisites
- Windows 10/11 64-bit build machine
- .NET 8 SDK
- Node.js 22 LTS & pnpm 11+
- Inno Setup 6 (`ISCC.exe` on PATH or in standard Program Files location)

### Build Command
```powershell
cd windows/installer
./build-windows-installer.ps1
```

The resulting unified setup executable will be located at:
`out/installer/DaxabitHMS-Setup.exe`
