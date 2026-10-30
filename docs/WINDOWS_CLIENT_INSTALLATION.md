# DaxabitHMS: Windows Client Installation Guide (Mode B)

## 1. Overview & Architecture

Mode B provides a lightweight, high-performance desktop application for multi-terminal restaurant operations. In real restaurant environments, a single main server computer typically coordinates multiple client terminals:
- **Cashier / POS Billing Counters**
- **Table-Side Waiter Tablets**
- **Bar Order Stations**
- **Kitchen Display Systems (KDS)**
- **Manager / Back-Office Desktops**

```
                  +-----------------------------------+
                  |      Main Server Computer         |
                  |     (Mode A: DaxabitHMSServer)    |
                  |     IP: 192.168.1.50:1995         |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          | (LAN / Wi-Fi)           | (LAN / Wi-Fi)           | (LAN / Wi-Fi)
          v                         v                         v
+-------------------+     +-------------------+     +-------------------+
| Cashier Counter   |     | Kitchen Display   |     | Waiter Tablet     |
| (Mode B Client)   |     | (Mode B Client)   |     | (Mode B Client)   |
| Native Printing   |     | Touch KDS Screen  |     | Table Ordering    |
+-------------------+     +-------------------+     +-------------------+
```

### Key Architectural Characteristics
- **Ultra-Lightweight Footprint:** ~25 MB total footprint. Bundles only the native Windows desktop launcher (WinForms + WebView2).
- **Zero Server Overhead:** Contains no database engines, no background services, and no Node.js runtimes.
- **Runs as Standard User:** Requires zero administrator elevation (`requestedExecutionLevel="asInvoker"`). Can be safely deployed on employee-accessible terminals with restricted user accounts.
- **Native Hardware Integration:** Utilizes the native Windows Print Spooler (`window.print()`), enabling direct receipt and invoice printing across USB, Bluetooth, and network thermal receipt printers.
- **Real-Time Collaboration:** Synchronizes order additions, table status changes, and kitchen tickets in real-time over WebSocket channels (`/socket.io`) connected to the main server.
- **Flexible Distribution:** Deployable via the unified setup installer (`DaxabitHMS-Setup.exe` with "Client" component) or as a packaged modern MSIX app (`DaxabitHMS.msix`) for corporate Microsoft Intune / MDM distribution.

---

## 2. System Requirements & Compatibility

| Component | Minimum Requirement | Recommended |
|---|---|---|
| **Operating System** | Windows 10 (Version 1809 / Build 17763 or higher) or Windows 11 64-bit | Windows 10/11 Pro 64-bit |
| **Processor** | Intel Celeron / Pentium 1.8 GHz or equivalent x64 processor | Intel Core i3 / AMD Ryzen 3 or higher |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 100 MB free disk space | 500 MB free disk space |
| **Network** | Ethernet (100 Mbps) or 802.11ac Wi-Fi connected to the same LAN as the server | Wired Gigabit Ethernet |
| **Runtimes** | Microsoft Edge WebView2 Evergreen Runtime (pre-installed on Windows 11 and updated Windows 10) |

---

## 3. Installation Walkthrough

### Option 1: Using `DaxabitHMS-Setup.exe`
1. Download `DaxabitHMS-Setup.exe` to the client computer.
2. Launch `DaxabitHMS-Setup.exe`.
3. In the setup wizard, select **Lightweight Client Terminal (For Waiter/Bar/KDS devices connecting to Main PC)**.
4. Click **Next** and **Install**.
5. Check **Create Desktop Icon** if desired.
6. The client files install into `C:\Program Files\DaxabitHMS\` (or `%LOCALAPPDATA%\Programs\DaxabitHMS` for standard user installs).
7. Click **Finish** to launch DaxabitHMS.

### Option 2: Using `DaxabitHMS.msix` (MSIX Package)
1. Double-click `DaxabitHMS.msix`.
2. Windows App Installer opens, displaying the verified package identity and capabilities.
3. Click **Install**.
4. The client installs cleanly into the user profile with zero administrative elevation required.
5. Launch DaxabitHMS from the Windows Start Menu.

---

## 4. Connecting to the Restaurant Server

### Step 1: Discovering the Main Server's Address
Ensure the client PC is connected to the same local Wi-Fi or Ethernet network as the main restaurant computer. Obtain the server's local IP address from the main computer:
- On the main server PC, open Command Prompt and type `ipconfig`.
- Note the IPv4 Address (e.g. `192.168.1.50`).
- The default DaxabitHMS service port is `1995`.

### Step 2: First-Run Connection Setup
When DaxabitHMS launches for the first time on a client terminal:
1. The **Connect to Server** dialog appears automatically.
2. Enter the server's address into the field.
   - **Smart Address Normalization:** You can type `192.168.1.50`, `192.168.1.50:1995`, or `http://192.168.1.50:1995`. The launcher automatically normalizes and validates the entry.
3. Click **Test Connection**.
   - The client performs an immediate HTTP health ping to `http://<server-ip>:1995/api/health`.
   - If reachable, a green **"Connected."** status appears.
4. Click **Connect**.
5. The launcher stores the configuration in `%LOCALAPPDATA%\DaxabitHMS\config.json` and loads the live restaurant dashboard.

```
+-------------------------------------------------------------+
|                 Connect to DaxabitHMS Server                |
+-------------------------------------------------------------+
|  Enter the network address of your main restaurant computer:|
|                                                             |
|  [ 192.168.1.50:1995                                     ]  |
|                                                             |
|  Status: [ Connected.                                    ]  |
|                                                             |
|         [ Test Connection ]         [ Connect ]  [ Cancel ] |
+-------------------------------------------------------------+
```

### Changing the Server Address Later
If the server's IP address changes or the terminal is relocated to another branch:
1. Click **File** in the top application menu bar.
2. Select **Change server address…**.
3. Enter the new IP address, test the connection, and click **Connect**.

---

## 5. Daily Terminal Operations

### Staff Authentication
- Staff members can log in using their assigned Email/Password or their 4-digit quick POS PIN.
- Granular Role-Based Access Control (RBAC) ensures staff members only see the interfaces assigned to their role:
  - **Cashier Role:** Direct POS register, table management, order billing, split payments, and receipt printing.
  - **Kitchen / Chef Role:** Full-screen Kitchen Display System (KDS), displaying live ticket items, preparation timers, and order status buttons (Preparing, Ready, Served).
  - **Waiter Role:** Fast mobile table ordering, modifiers, and instant kitchen ticket transmission.
  - **Manager Role:** Shift management, reports, cash drawer reconciliations, and staff attendance.

### Printing Receipts & Kitchen Order Tickets (KOT)
- When completing an order or clicking **Print Receipt**, the web application invokes `window.print()`.
- The native Windows Print Spooler dialog appears, or prints silently if configured in Windows printer preferences.
- Works natively with any standard Windows printer driver:
  - 80mm and 58mm Thermal Receipt Printers (Epson, Star Micronics, Citizen, Bixolon, TVS, Rongta, etc.)
  - Standard A4 / Letter office printers for tax invoices and financial reports.

---

## 6. Troubleshooting Client Connectivity

### Problem: "Could not reach that address"

#### Checklist
1. **Network Verification:** Verify that the client computer is connected to the restaurant LAN and not a segregated "Guest" Wi-Fi network with client isolation enabled.
2. **Ping Test:**
   Open Command Prompt on the client PC:
   ```cmd
   ping 192.168.1.50
   ```
   If ping fails, verify router connectivity and physical cabling.
3. **Firewall Verification on Main Server:**
   Ensure the Windows Firewall inbound rule on the server is active:
   ```cmd
   netsh advfirewall firewall show rule name="DaxabitHMS POS Server"
   ```
4. **Browser Test:**
   Open Microsoft Edge or Chrome on the client PC and navigate to:
   `http://192.168.1.50:1995/api/health`
   The browser should return a JSON response: `{"status":"ok", ...}`.
5. **Static IP Recommendation:**
   Assign a static IP address or DHCP reservation to the main server computer in the restaurant's network router settings so its IP address never changes during lease renewals.
