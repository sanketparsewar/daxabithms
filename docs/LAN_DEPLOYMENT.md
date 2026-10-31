# DaxabitHMS — Local Area Network (LAN) Deployment Guide

This guide details how to install DaxabitHMS on a single computer inside a restaurant and provide seamless, concurrent access to all staff devices (cashier POS, kitchen KDS, waiter tablets, manager laptops, and mobile phones) over the local Wi-Fi / Ethernet network.

---

## 1. Architecture Overview

In a typical restaurant LAN deployment, one dedicated host machine acts as the **Local Application Server**. All other staff devices connect as thin clients using standard web browsers or the lightweight DaxabitHMS Windows Desktop client.

```
                              ┌────────────────────────────────────────┐
                              │         Restaurant Local Router        │
                              │     (192.168.1.1 - DHCP / Wi-Fi AP)    │
                              └───────────────────┬────────────────────┘
                                                  │
                ┌─────────────────────────────────┼────────────────────────────────┐
                │                                 │                                │
                ▼                                 ▼                                ▼
     ┌───────────────────────┐         ┌───────────────────────┐        ┌──────────────────────┐
     │   Main Server Machine │         │  Waitstaff / iPad     │        │ Kitchen KDS Screen   │
     │   (192.168.1.100)     │         │  (192.168.1.105)      │        │ (192.168.1.110)      │
     │                       │         │                       │        │                      │
     │ ┌───────────────────┐ │         │ Browser / Web App:    │        │ Android / Chrome:    │
     │ │ Next.js (:1995)   │ │◄────────┤ http://192.168.1.100  │        │ http://192.168.1.100 │
     │ └─────────┬─────────┘ │         │        :1995          │        │        :1995/kds     │
     │           ▼           │         └───────────────────────┘        └──────────────────────┘
     │ ┌───────────────────┐ │
     │ │ NestJS (:4001)    │ │
     │ └─────────┬─────────┘ │
     │           ▼           │
     │ ┌───────────────────┐ │
     │ │ PostgreSQL        │ │
     │ │ (:55432 localhost)│ │
     │ └───────────────────┘ │
     └───────────────────────┘
```

### Security Boundaries
- **Only Port 1995 is exposed** to the LAN.
- The PostgreSQL database (`127.0.0.1:55432`) and internal API (`127.0.0.1:4001`) are bound exclusively to the loopback interface or internal Docker network. They are **never** directly reachable from the LAN or internet.
- All requests pass through the Next.js reverse-proxy layer on port 1995, enforcing session cookies, authentication, and branch isolation.

---

## 2. Server Machine Setup

### Step 1: Assign a Static Local IP
To ensure staff devices always reach the server at the same address, reserve a static IP in your router's DHCP table for the server machine (e.g. `192.168.1.100`), or configure a static IP on the server network adapter:

#### Windows Static IP:
```powershell
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.1.100 -PrefixLength 24 -DefaultGateway 192.168.1.1
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("1.1.1.1","8.8.8.8")
```

### Step 2: Open Inbound Port 1995 in Firewall
The installer (`DaxabitHMS-Setup.exe`) creates this rule automatically. If configuring manually:

#### Windows Firewall (PowerShell as Administrator):
```powershell
New-NetFirewallRule -Name "DaxabitHMS-Web-LAN" `
  -DisplayName "DaxabitHMS Web Server (Inbound TCP 1995)" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 1995 `
  -Profile Private,Domain
```

#### Linux Host (UFW):
```bash
sudo ufw allow 1995/tcp comment "DaxabitHMS Web LAN"
```

---

## 3. Connecting Client Devices

Every device connected to the restaurant's local Wi-Fi or Ethernet network can open DaxabitHMS directly in its web browser:

| Device Type | Recommended Browser | URL |
| :--- | :--- | :--- |
| **Cashier Terminal (Windows/Mac)** | Chrome, Edge, Firefox | `http://192.168.1.100:1995` |
| **Waitstaff Tablets (iPad / iPadOS)** | Safari, Chrome | `http://192.168.1.100:1995` |
| **Waitstaff Mobiles (Android / iOS)** | Chrome, Safari | `http://192.168.1.100:1995` |
| **Kitchen Display (Smart TV / Android Tablet)** | Chrome (Fullscreen / Kiosk) | `http://192.168.1.100:1995/kds` |
| **Customer Self-Service Kiosk** | Chrome Kiosk Mode | `http://192.168.1.100:1995/kiosk` |

> [!TIP]
> **Add to Home Screen (PWA):** On iOS Safari, tap **Share** &rarr; **Add to Home Screen**. On Android Chrome, tap the menu (three dots) &rarr; **Install App** / **Add to Home Screen**. This runs DaxabitHMS in a clean, full-screen standalone window without browser address bars.

---

## 4. Multi-User & Realtime Concurrency

DaxabitHMS is engineered for high-concurrency restaurant service:

1. **Role-Based Views**: Cashiers, waiters, cooks, and managers can be logged in simultaneously on different devices under their respective accounts.
2. **Realtime Push (Socket.IO)**:
   - When a waiter sends an order from an iPad, the kitchen ticket (`kot.created`) instantly appears on the KDS terminal with audio alert.
   - When the kitchen marks an item ready (`kot.updated`), the table status updates across all waiter screens.
   - When payment is recorded at the cashier till, the table status immediately reflects `PAID` / `VACANT`.
3. **Resilient Reconnection**:
   - Tablets entering sleep mode or experiencing temporary Wi-Fi dead-zones automatically reconnect within 1 to 5 seconds upon waking.
   - TanStack Query cache automatically invalidates and refreshes state after reconnection to prevent stale drafts.
4. **Draft Safety**:
   - Order drafts are keyed per-table in local browser state. If a waiter starts an order on Table 4, switches to Table 8, and returns to Table 4, the draft items are preserved.

---

## 5. LAN Connection Diagnostics

To check LAN health and verify device connectivity:

1. Log into DaxabitHMS as an administrator or manager.
2. Navigate to **Support & Diagnostics** (or call `GET /api/v1/system/network-diagnostics`).
3. Verify:
   - **Server Addresses**: Lists all detected IPv4 addresses (e.g. `192.168.1.100`).
   - **Client IP**: Confirms the caller's actual device IP (e.g. `192.168.1.105`).
   - **Socket.IO Status**: Reports active connection status.

---

## 6. Troubleshooting & Common Issues

### Issue 1: "Cannot Reach http://192.168.1.100:1995 from Tablets"
- **Cause**: Wi-Fi Access Point "Client Isolation" or "AP Isolation" is enabled.
- **Solution**: Open your router/AP settings (e.g., UniFi, TP-Link, Asus) and ensure **Client Isolation** / **Guest Network Isolation** is disabled for your staff SSID. Staff devices must be permitted to communicate with each other on the local subnet.
- **Cause**: Windows network profile is set to "Public" instead of "Private".
- **Solution**: Open Windows Settings &rarr; Network & Internet &rarr; Properties &rarr; Set network profile type to **Private network**.

### Issue 2: "Login Succeeds but Redirects Back to Login (Cookie Error)"
- **Cause**: `COOKIE_SECURE=true` is set while accessing over plain `http://`. Browsers reject `Secure` cookies over insecure HTTP connections.
- **Solution**: Keep `COOKIE_SECURE=false` (the default) when operating over plain HTTP on LAN. Only set `COOKIE_SECURE=true` when accessing through HTTPS.

### Issue 3: "Kitchen Audio Does Not Chime"
- **Cause**: Modern mobile browsers (iOS Safari, Android Chrome) block autoplaying audio until the user interacts with the page.
- **Solution**: Tap anywhere on the KDS screen or click the **Turn on sound** button once after opening the page. DaxabitHMS unlocks the Web Audio context for continuous alerts.

