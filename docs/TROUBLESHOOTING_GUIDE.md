# DaxabitHMS: Operational Troubleshooting Guide

This guide provides fast diagnosis and resolution steps for common technical and operational issues encountered in restaurant environments.

---

## 1. Quick Diagnostic Flowchart

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WHAT IS THE SYMPTOM?                            │
│                                                                        │
│  [A] Thermal printer is not printing slips        ──▶ Jump to Section 2│
│  [B] Tablets cannot connect to Server on LAN      ──▶ Jump to Section 3│
│  [C] Realtime badge shows "Reconnecting..." (Amber) ─▶ Jump to Section 4│
│  [D] KDS is not playing sound chimes              ──▶ Jump to Section 5│
│  [E] Cash drawer does not pop open                ──▶ Jump to Section 6│
│  [F] Windows Desktop client shows error screen    ──▶ Jump to Section 7│
│  [G] Port conflict or database service offline    ──▶ Jump to Section 8│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Thermal Printer Issues (Receipts & KOTs)

### Symptom: Printer does not print when clicking "Print Receipt"
1. **Physical Checks**:
   - Verify printer power LED is solid green (not blinking red or amber).
   - Check paper roll: ensure thermal paper is installed in the correct orientation (thermal coating facing the printhead).
   - Close cover firmly until it clicks.
2. **Windows Print Spooler**:
   - If printing via Windows Print Spooler: Open Windows **Printers & Scanners** ➔ click your printer ➔ **Open queue**.
   - If a previous print job is stuck with status "Error - Printing", right-click it and choose **Cancel**.
   - Restart the Windows Print Spooler service via PowerShell:
     ```powershell
     Restart-Service -Name Spooler -Force
     ```
3. **USB Thermal Printer Direct (ESC/POS)**:
   - Navigate to **Settings ➔ Printer Diagnostics**.
   - Verify paper width matches installed roll (`58 mm` vs `80 mm`).
   - Click **Print Test Receipt**.
4. **Network Kitchen Printer (Ethernet / Wi-Fi)**:
   - Verify the printer has an active IP address by holding down the printer's **FEED** button while turning on power (self-test slip will print its current IP).
   - Ensure the IP matches the IP entered under Settings (e.g. `192.168.1.201`, port `9100`).

---

## 3. LAN Device Connection Issues (Tablets & Phones)

### Symptom: Tablet shows "This site can't be reached" or connection timed out
1. **Verify Wi-Fi Network**: Ensure the tablet is connected to the **same Wi-Fi router** as the main server PC, not a guest network or cellular data.
2. **Check Router "AP Isolation"**: Some commercial guest Wi-Fi routers have *Access Point (AP) Isolation* enabled, which prevents Wi-Fi devices from talking to each other. Log into your router admin panel and **disable AP Isolation / Client Isolation**.
3. **Check Server IP Address**:
   - Open Command Prompt on the server PC and run `ipconfig`.
   - Confirm if the server's IP address changed (e.g. from `192.168.1.100` to `192.168.1.105`).
   - If changed, configure a **DHCP Static IP Reservation** in your router for the server PC.
4. **Windows Firewall Blocking Port 1995**:
   - Ensure Windows network profile is set to **Private** (not Public).
   - Re-apply the firewall exception via administrative PowerShell:
     ```powershell
     New-NetFirewallRule -DisplayName "DaxabitHMS Web" -Direction Inbound -LocalPort 1995 -Protocol TCP -Action Allow -Profile Private
     ```

---

## 4. Real-time Push Status Shows Amber ("Reconnecting...")

### Symptom: Orders placed on tablet don't appear on KDS without refreshing
1. Check the header status dot:
   - 🟢 **Green (Connected)**: WebSocket connection is healthy and streaming events.
   - 🟡 **Amber (Reconnecting...)**: Connection lost, actively retrying.
   - 🔴 **Red (Offline)**: Server unreachable.
2. If amber persists:
   - Check if the main server PC has entered sleep/hibernation mode. On the server PC, go to Windows **Power & Sleep settings** and set **Sleep** to **Never** when plugged in.
   - Check if an antivirus or proxy software is inspecting or buffering WebSocket connections.

---

## 5. KDS Kitchen Sound Chime Not Playing

### Symptom: New orders arrive on KDS visually, but no chime rings
1. Modern web browsers (Chrome, Edge, Safari) prohibit web pages from playing audio automatically until the user interacts with the page.
2. **Solution**: Simply tap or click anywhere on the KDS screen once when first loading the page in the morning.
3. Verify device volume is not muted and Bluetooth headphones are not accidentally capturing audio.

---

## 6. Cash Drawer Does Not Kick Open

### Symptom: Payment records successfully, but the cash till remains locked
1. Cash drawers in restaurants connect via an RJ-11/RJ-12 phone-style cable plugged into the back of the **thermal receipt printer**, not directly to the PC.
2. Ensure the cable is plugged into the **DK (Drawer Kick)** port of the receipt printer.
3. In your Windows Printer Properties ➔ **Device Settings**, ensure **Cash Drawer** is set to **Open Before Printing** or **Open After Printing**.

---

## 7. Windows Desktop Client Issues

### Symptom: Client shows "Server Version Incompatible"
- The desktop client enforces version compatibility checks. If the server was upgraded to a new release (e.g. `2.0.0`), older clients must be upgraded to match.
- Download the matching client MSIX package from `/download/windows` or your release portal.

### Symptom: White screen or WebView2 initialization failure
- Ensure the Microsoft Edge WebView2 Evergreen Runtime is installed.
- Download and run the official Microsoft WebView2 Bootstrapper installer:
  `https://go.microsoft.com/fwlink/p/?LinkId=2124703`

---

## 8. Server Service & Database Diagnostics

### Check Service Status (Windows)
Open PowerShell as Administrator:
```powershell
# Check server service status
Get-Service -Name DaxabitHMSServer

# Restart server service
Restart-Service -Name DaxabitHMSServer

# View recent service logs
Get-Content -Path "$env:ProgramData\DaxabitHMS\server\logs\server.log" -Tail 50
```

### Check PostgreSQL Local Database Status
```powershell
# Verify PostgreSQL is listening on port 5432
Get-NetTCPConnection -LocalPort 5432 -State Listen
```
If port 5432 is occupied by an older existing PostgreSQL instance, Daxabit server configuration can be updated in `%PROGRAMDATA%\DaxabitHMS\server\config\server.env` with a custom port.

