# DaxabitHMS: Windows Server Installation Guide (Mode A)

## 1. Overview & Architecture

DaxabitHMS provides a seamless, zero-dependency installation experience for restaurant owners on Windows 10 and Windows 11. A restaurant owner can download a single setup file (`DaxabitHMS-Setup.exe`), run the installer, and start billing without ever opening a terminal or installing Node.js, pnpm, PostgreSQL, or Docker.

### Key Architectural Characteristics
- **Zero Third-Party Prerequisites:** Bundles minimal, version-pinned portable runtimes (PostgreSQL 16.15.0 x64 and Node.js 22 LTS x64).
- **Offline Self-Sufficiency:** Requires no internet connection for daily restaurant operations after the initial installation.
- **Service Isolation & Lifecycle:** Runs PostgreSQL, NestJS Backend, and Next.js Standalone Web Server as a managed Windows Background Service (`DaxabitHMSServer`) configured with automatic failure recovery.
- **Enterprise Data Segregation:** Binaries install to `C:\Program Files\DaxabitHMS`, while all customer database records, receipts, and uploads reside in `%PROGRAMDATA%\DaxabitHMS\server\`, completely isolated from application updates and standard uninstalls.
- **Native Windows Printing:** Thermal and invoice printing routes through WebView2 and the native Windows Print Spooler (`window.print()`), supporting all Windows-certified thermal, USB, Bluetooth, and network ESC/POS receipt printers without third-party printer servers.

---

## 2. System Requirements & Compatibility

| Component | Minimum Requirement | Recommended |
|---|---|---|
| **Operating System** | Windows 10 64-bit (Version 1809 / Build 17763 or higher) or Windows 11 | Windows 11 Pro 64-bit |
| **Processor** | Dual-core 64-bit (x64) 2.0 GHz | Quad-core Intel Core i5 / AMD Ryzen 5 or higher |
| **RAM** | 4 GB | 8 GB or 16 GB |
| **Storage** | 4 GB free disk space (NTFS volume) | 10 GB+ SSD storage |
| **Display** | 1280 x 720 resolution | 1920 x 1080 Full HD touchscreen |
| **Runtimes** | Microsoft Edge WebView2 Evergreen Runtime & VC++ 2015-2022 x64 (verified automatically by installer) | Pre-installed on all modern Windows 10/11 systems |

---

## 3. End-to-End Installation Flow

### Step 1: Download & Execution
1. The restaurant owner downloads `DaxabitHMS-Setup.exe` from the authorized release portal.
2. Double-click `DaxabitHMS-Setup.exe`.
3. When prompted by Windows User Account Control (UAC), click **Yes** to permit administrative configuration of the local database service and firewall rules.

### Step 2: Compatibility & Dependency Validation
The installer automatically executes pre-flight checks:
- Verifies that Windows is 64-bit and version 1809 or higher.
- Queries registry for the Microsoft Edge WebView2 Evergreen Runtime (`{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`).
- Queries registry for the Microsoft Visual C++ 2015–2022 x64 Redistributable runtime.
- If any required component is absent, the installer notifies the user and offers seamless resolution.

### Step 3: Installation Mode Selection
The installer presents two options:
1. **Full Local Application Server + Desktop Client (Main Restaurant PC - Recommended)**:
   Installs the full POS server stack, initializes local PostgreSQL, registers the Windows service, configures the firewall, and installs the desktop client.
2. **Lightweight Client Terminal**:
   Installs only the thin client shell to connect to another PC on the restaurant network.

*Select option 1 (Full Server Mode).*

### Step 4: Automated File Deployment
The installer deploys application assets to standard system locations:
- Program binaries: `C:\Program Files\DaxabitHMS\`
- Embedded server payload: `C:\Program Files\DaxabitHMS\server\`
  - `node\node.exe`: Portable Node.js runtime.
  - `postgres\bin\`: Portable PostgreSQL 16 utilities (`postgres.exe`, `initdb.exe`, `pg_ctl.exe`, `createdb.exe`, `pg_dump.exe`, `pg_restore.exe`).
  - `backend\`: Production-compiled NestJS backend with pre-packaged native Prisma Windows query engine.
  - `web\`: Production Next.js standalone server and optimized public assets.
- Service supervisor: `C:\Program Files\DaxabitHMS\service\service-runner.ps1`.

### Step 5: Safe Database Provisioning & Security Hardening
The installer executes `setup-server.ps1` in the background:
1. Creates directory `%PROGRAMDATA%\DaxabitHMS\server\` with subdirectories `pgdata\`, `uploads\`, and `logs\`.
2. Checks for an existing database cluster:
   - If fresh: Generates a cryptographically secure 32-character database password, initializes the PostgreSQL database with SCRAM-SHA-256 authentication (`initdb.exe`), restricts NTFS permissions on `pg-password.txt` to `SYSTEM` and `Administrators`, starts temporary PostgreSQL, and creates the `daxabithms` database.
   - If upgrading: Detects existing `PG_VERSION` and preserves all historical business data and credentials without modification.
3. Generates cryptographically secure 64-character JWT secret and 32-byte encryption key.
4. Writes environment configuration to `%PROGRAMDATA%\DaxabitHMS\server\backend.env`.
5. Executes Prisma database migrations (`prisma migrate deploy`) using the embedded Node.js engine to initialize the database schema and composite indexes.
6. Cleanly stops the temporary PostgreSQL instance via `pg_ctl stop -m fast -w`.

### Step 6: Network & Firewall Automation
The installer configures Windows Firewall to permit inbound connections to the POS server:
```cmd
netsh advfirewall firewall add rule name="DaxabitHMS POS Server" dir=in action=allow protocol=TCP localport=1995 profile=private,domain
```
This enables other waiter tablets, handheld terminals, and kitchen displays on the restaurant's local network (LAN) to communicate with this server immediately.

### Step 7: Windows Service Registration & Failure Recovery
The installer registers `DaxabitHMSServer` with the Windows Service Control Manager:
- **Startup Type:** Automatic (`start=auto`), ensuring the server starts whenever the computer boots, even before any user logs in.
- **Failure Recovery Policy:** Configured via `sc.exe failure DaxabitHMSServer reset=86400 actions=restart/5000/restart/10000/restart/60000`:
  - 1st Failure: Automatically restart service after 5 seconds.
  - 2nd Failure: Automatically restart service after 10 seconds.
  - Subsequent Failures: Automatically restart service after 60 seconds.
- **Service Process:** Executes `service-runner.ps1`, which launches PostgreSQL on port 55432, NestJS Backend on port 4001, and Next.js Web on port 1995, maintaining continuous health monitoring.

### Step 8: Desktop Shortcuts & Automatic Launch
- Creates Start Menu shortcut: `DaxabitHMS`.
- Creates Desktop shortcut: `DaxabitHMS`.
- Automatically launches `C:\Program Files\DaxabitHMS\DaxabitHMS.exe`.
- The launcher queries `http://127.0.0.1:1995/api/health`, detects that the managed Windows service is active, and immediately loads the user interface.

---

## 4. First-Run Owner Onboarding Experience

When the application opens for the first time, the restaurant owner is greeted by the First-Run Setup Wizard:

```
+-------------------------------------------------------------------+
|                           DaxabitHMS                              |
|                   Welcome to your Restaurant POS                  |
|                                                                   |
|  [ Step 1: Create Owner Account ]                                 |
|  - Full Name: John Doe                                            |
|  - Email Address: owner@daxabitrestaurant.com                      |
|  - Password: ••••••••••••••••                                     |
|                                                                   |
|  [ Step 2: Restaurant & Branch Setup ]                            |
|  - Restaurant Name: Daxabit Bistro & Grill                         |
|  - Currency: USD / INR / EUR                                      |
|  - Tax / GST Rate: 5% (Configurable inclusive/exclusive)          |
|  - Table Count: 20                                                |
|                                                                   |
|  [ Complete Setup & Open Cash Register ]                          |
+-------------------------------------------------------------------+
```

1. **Owner Registration:** The owner enters their name, email, and password. The system registers the account as a Super Admin with complete RBAC permissions.
2. **Restaurant Details:** The owner specifies restaurant legal details, invoice header information, currency formatting, and default tax configurations.
3. **Start Billing:** Clicking "Complete Setup" opens the POS register. The restaurant owner can immediately add items, create tables, take customer orders, and print invoices.

---

## 5. Server Lifecycle & Maintenance

### Managing the Background Service
The server runs continuously in the background. Operators and IT administrators can inspect or manage the service via:

#### Using Windows Services Applet
1. Press `Win + R`, type `services.msc`, and press **Enter**.
2. Locate **DaxabitHMS Restaurant Server**.
3. Right-click to **Start**, **Stop**, or **Restart**.

#### Using Command Prompt (Admin)
```cmd
:: Check status
sc.exe query DaxabitHMSServer

:: Stop the server
sc.exe stop DaxabitHMSServer

:: Start the server
sc.exe start DaxabitHMSServer
```

### Safe Shutdown & Power Loss Resilience
- When Windows shuts down or restarts, Windows sends a service termination signal.
- `service-runner.ps1` captures this signal, initiates graceful child process termination, and executes:
  ```cmd
  pg_ctl.exe stop -D "%PROGRAMDATA%\DaxabitHMS\server\pgdata" -m fast -w
  ```
- This flushes all PostgreSQL Write-Ahead Logs (WAL) to disk, ensuring that financial ledger transactions and customer invoices are never corrupted by an operating system restart.

---

## 6. Diagnostic Logs & Troubleshooting

All diagnostic logs are stored outside the installation directory in `%PROGRAMDATA%\DaxabitHMS\server\logs\`:

| Log File | Description |
|---|---|
| `service-runner.log` | Health monitoring events, service startup, and restart timestamps. |
| `installer-setup.log` | Step-by-step installation output, PostgreSQL `initdb` results, and Prisma migrations. |
| `postgres.log` | Native PostgreSQL engine queries, connection events, and checkpoints. |
| `backend.log` | NestJS API requests, financial transaction logs, and authentication events. |
| `web.log` | Next.js server rendering logs and frontend routing. |

### Common Resolutions

#### Port Conflicts
DaxabitHMS uses default ports:
- **Port 1995:** Web Frontend & LAN Access
- **Port 4001:** Backend API
- **Port 55432:** Local PostgreSQL

If port 1995 is occupied by another application, edit `%PROGRAMDATA%\DaxabitHMS\config.json` and `%PROGRAMDATA%\DaxabitHMS\server\backend.env` to specify an alternate port (e.g. 1996), then restart the `DaxabitHMSServer` service.
