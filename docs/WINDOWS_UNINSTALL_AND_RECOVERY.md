# DaxabitHMS: Windows Uninstallation, Data Safety & Disaster Recovery Guide

## 1. Business Data Preservation Guarantee

In a commercial restaurant environment, financial ledgers, tax invoices, customer audit trails, and inventory stock balances constitute vital legal and business assets. **Under no circumstances should removing or updating an application binary silently destroy customer business data.**

DaxabitHMS enforces strict architectural separation between program binaries and customer data:
- **Application Binaries & Runtimes:** Stored in `C:\Program Files\DaxabitHMS\` (read-only after installation).
- **Persistent Business State & Databases:** Stored in `%PROGRAMDATA%\DaxabitHMS\server\` (`pgdata\`, `uploads\`, `logs\`, `backend.env`).

When an administrator runs the DaxabitHMS uninstaller, the application binaries, shortcuts, background services, and firewall rules are cleanly removed, **while all database files, uploaded menu images, and invoice history are preserved by default.**

---

## 2. Standard Uninstallation Walkthrough

### Method 1: Using Windows Settings
1. Open **Windows Settings** (`Win + I`).
2. Navigate to **Apps** -> **Installed Apps** (or **Apps & Features** on Windows 10).
3. Search for **DaxabitHMS**.
4. Click the three dots `...` next to DaxabitHMS and select **Uninstall**.
5. Approve the Windows UAC confirmation prompt.

### Method 2: Using Control Panel
1. Open **Control Panel** -> **Programs and Features**.
2. Select **DaxabitHMS** and click **Uninstall**.

### Method 3: Using the Start Menu Shortcut
1. Click **Start Menu** -> **DaxabitHMS** -> **Uninstall DaxabitHMS**.

---

## 3. Data Retention Prompt & Confirmation

During uninstallation, if a local server database is detected at `%PROGRAMDATA%\DaxabitHMS\server\pgdata`, the uninstaller displays an explicit confirmation dialog:

```
+---------------------------------------------------------------------------------------+
|                                  Uninstall DaxabitHMS                                 |
+---------------------------------------------------------------------------------------+
|  Do you want to PERMANENTLY delete all restaurant data, invoices, and billing history? |
|                                                                                       |
|  Select NO to keep your restaurant records safe for future reinstalls or backups       |
|  (Recommended).                                                                       |
|                                                                                       |
|  Select YES only if you are completely decommissioning this computer.                 |
|                                                                                       |
|                             [ Yes ]              [ No (Recommended) ]                 |
+---------------------------------------------------------------------------------------+
```

- **Selecting NO (Default):**
  - All restaurant invoices, menu configurations, staff records, and database tables are safely kept intact on disk.
  - If DaxabitHMS is reinstalled in the future, it immediately detects the existing database and resumes operations with zero data loss.
- **Selecting YES (Decommissioning):**
  - Permanently purges `%PROGRAMDATA%\DaxabitHMS` and all subsidiary database tables.
  - This option should only be chosen when retiring or permanently transferring hardware.

---

## 4. Automated Service & Network Teardown

During uninstallation, the uninstaller automatically executes the following teardown actions:
1. **Service Stoppage:** Sends a stop command to the `DaxabitHMSServer` Windows Service.
2. **Service Deletion:** Unregisters `DaxabitHMSServer` from the Windows Service Control Manager (`sc.exe delete DaxabitHMSServer`).
3. **Graceful PostgreSQL Shutdown:** Executes `pg_ctl.exe stop -D "%PROGRAMDATA%\DaxabitHMS\server\pgdata" -m fast -w` to flush all active transactions and WAL buffers to disk.
4. **Firewall Rule Removal:** Removes the inbound TCP port 1995 firewall rule (`netsh advfirewall firewall delete rule name="DaxabitHMS POS Server"`).
5. **Shortcuts & Binaries:** Cleans up Start Menu shortcuts, desktop icons, and removes the `C:\Program Files\DaxabitHMS` folder.

---

## 5. Silent Uninstallation & Fleet Automation

For system administrators managing multiple restaurant terminals via remote management scripts (e.g., PowerShell Remoting, Microsoft Intune, Datto, NinjaOne):

### Safe Silent Uninstall (Preserves All Data - Default)
```cmd
"C:\Program Files\DaxabitHMS\unins000.exe" /VERYSILENT /SUPPRESSMSGBOXES
```

### Complete Decommissioning (Permanently Deletes All Data)
To completely wipe both the application and the database in an automated script, pass the explicit `/PURGE_DATA=1` parameter:
```cmd
"C:\Program Files\DaxabitHMS\unins000.exe" /VERYSILENT /SUPPRESSMSGBOXES /PURGE_DATA=1
```

---

## 6. Disaster Recovery & Hardware Migration

### Scenario 1: Reinstalling on the Same Computer
If the application binaries were damaged or uninstalled, restoring service on the same machine takes under two minutes:
1. Download and run `DaxabitHMS-Setup.exe`.
2. Select **Full Local Application Server + Desktop Client**.
3. The setup script detects the existing `%PROGRAMDATA%\DaxabitHMS\server\pgdata` folder.
4. Existing database credentials and configuration in `backend.env` are preserved.
5. Pending database migrations are automatically verified and applied.
6. The `DaxabitHMSServer` service is re-registered and started.
7. Launch DaxabitHMS—all restaurant data, open orders, and reports are immediately available.

---

### Scenario 2: Migrating to a New Server PC

To migrate an entire restaurant setup to new counter hardware without losing any data:

#### Step 1: Create a Full Backup on the Old Computer
1. On the old PC, open **DaxabitHMS** -> **Settings** -> **Database & Backup**.
2. Click **Create Backup Now**.
3. Alternatively, create a consistent manual dump using Command Prompt:
   ```cmd
   cd "C:\Program Files\DaxabitHMS\server\postgres\bin"
   pg_dump.exe -h 127.0.0.1 -p 55432 -U daxabit_admin -F c -b -v -f "C:\DaxabitHMS_Backup.dump" daxabithms
   ```
   *(Enter the password found in `%PROGRAMDATA%\DaxabitHMS\server\pg-password.txt` if prompted).*
4. Copy `DaxabitHMS_Backup.dump` to an external USB drive or secure network share.
5. Also copy the `uploads` directory (`%PROGRAMDATA%\DaxabitHMS\server\uploads`) if customized menu images or receipts exist.

#### Step 2: Install DaxabitHMS on the New Computer
1. Run `DaxabitHMS-Setup.exe` on the new PC.
2. Complete the standard **Full Server Installation**.
3. Once installation completes, stop the service to perform the restoration:
   ```cmd
   sc.exe stop DaxabitHMSServer
   ```

#### Step 3: Restore Database onto the New Computer
1. Temporarily start PostgreSQL:
   ```cmd
   cd "C:\Program Files\DaxabitHMS\server\postgres\bin"
   pg_ctl.exe start -D "%PROGRAMDATA%\DaxabitHMS\server\pgdata" -w
   ```
2. Restore the database dump:
   ```cmd
   pg_restore.exe -h 127.0.0.1 -p 55432 -U daxabit_admin -d daxabithms --clean --if-exists -v "D:\DaxabitHMS_Backup.dump"
   ```
3. Copy the saved `uploads` folder into `%PROGRAMDATA%\DaxabitHMS\server\uploads`.
4. Stop the temporary PostgreSQL instance:
   ```cmd
   pg_ctl.exe stop -D "%PROGRAMDATA%\DaxabitHMS\server\pgdata" -m fast -w
   ```
5. Restart the managed background service:
   ```cmd
   sc.exe start DaxabitHMSServer
   ```
6. Open DaxabitHMS on the new machine. All historical records, past invoices, menu items, and active tables are fully restored.

---

### Scenario 3: Cold Folder Backup & Restore

If you perform image or folder-level backups:
1. Ensure the `DaxabitHMSServer` service is stopped before copying the database folder to prevent copying during an active write checkpoint.
2. Back up the entire `%PROGRAMDATA%\DaxabitHMS\server` folder.
3. On a fresh installation, stopping the service, restoring that folder into `%PROGRAMDATA%\DaxabitHMS\server`, and restarting the service provides a complete, 100% byte-for-byte system recovery.

---

## 7. PostgreSQL Crash Recovery & Integrity Verification

### Automatic Write-Ahead Log (WAL) Replay
PostgreSQL includes built-in ACID crash recovery:
- If the restaurant PC experiences an abrupt power outage or hard shutdown while taking orders, PostgreSQL automatically enters recovery mode upon restart.
- PostgreSQL reads the `pg_wal` transaction log, completes all committed transactions, rolls back any incomplete transactions, and brings the database to a completely consistent state.
- Operators do not need to execute manual database repair utilities.

### Verifying Cluster Health
To manually verify database health:
```cmd
cd "C:\Program Files\DaxabitHMS\server\postgres\bin"
pg_ctl.exe status -D "%PROGRAMDATA%\DaxabitHMS\server\pgdata"
```

If the status reports `pg_ctl: server is running (PID: ...)`, the database engine is healthy and accepting queries.
