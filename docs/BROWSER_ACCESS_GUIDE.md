# DaxabitHMS: Browser and LAN Device Access Guide

DaxabitHMS is built with a responsive web architecture that runs across desktop monitors, touchscreen billing terminals, mobile tablets, and handheld smartphones.

---

## 1. Supported Browsers & Devices

| Platform | Recommended Browser | Minimum Version | Features Supported |
| :--- | :--- | :--- | :--- |
| **Windows Desktop / PC** | Microsoft Edge or Google Chrome | 110+ | Full POS, WebUSB/Raw ESC/POS Thermal Printing, System Spooler, KDS |
| **Apple iPad / iPadOS** | Safari or Google Chrome | iPadOS 16.0+ | Full POS Touch Layout, KDS Wallboard, Responsive Table Editor |
| **Android Tablet / POS** | Google Chrome | 115+ | Full POS Touch Layout, KDS Chimes, PWA Standalone Mode |
| **Android / iPhone Handheld**| Chrome or Safari | iOS 16+ / Android 10+ | Mobile Waiter POS (Auto-docking cart sheet), Tables View, Order Approvals |
| **macOS / Linux** | Google Chrome, Edge, Firefox | 115+ | Management Dashboard, Reports, Accounting, Menu Engineering |

---

## 2. Connecting to the Restaurant Server via LAN

### Step 1: Discover the Server's Local IP Address
On the main Windows computer where DaxabitHMS server is installed:
1. Open PowerShell or Command Prompt.
2. Run `ipconfig` and note the **IPv4 Address** (e.g. `192.168.1.100`).
3. Note the port: default is `1995`.

> **Pro Tip**: Set a **DHCP Static IP Reservation** in your restaurant Wi-Fi router for the server's MAC address so the IP address never changes after a power cycle.

### Step 2: Access From Client Devices
1. Connect the client tablet, phone, or laptop to the **same restaurant Wi-Fi network**.
2. Open Google Chrome or Safari.
3. In the URL address bar, enter:
   ```text
   http://192.168.1.100:1995
   ```
   *(Replace `192.168.1.100` with your actual server IP).*

### Step 3: Install as Progressive Web App (PWA)
For a native, distraction-free app experience without browser URL bars:
- **On Android (Chrome)**: Tap the three-dot menu `⋮` ➔ select **Install App** or **Add to Home screen**.
- **On iPad / iPhone (Safari)**: Tap the Share button `⎋` ➔ scroll down and select **Add to Home Screen**.
- **On Windows / Chrome / Edge**: Click the install icon in the right side of the address bar ➔ select **Install DaxabitHMS**.

The app opens as a standalone full-screen window with custom Daxabit branding.

---

## 3. Responsive Touch & Tablet Layouts

Daxabit adapts intelligently based on screen size:

* **Desktop & Large Tablets (10.2" iPad, POS Terminals: ≥ 1024px width)**:
  * POS displays the **Category Sidebar**, **Dish Grid**, and **Live Bill Cart** side-by-side on one screen.
  * Rapid single-tap ordering with immediate visual confirmation.
* **Handheld Phones & Small Tablets (< 1024px width)**:
  * POS shows dishes full-screen for high readability.
  * Cart docks into a sleek bottom banner (`View Cart · 3 items · $28.50`).
  * Tapping the banner smoothly slides up the order review sheet for kitchen dispatch.

---

## 4. Real-time WebSocket Connectivity & Reconnection

* Daxabit utilizes an active Socket.IO connection for instant push updates:
  * When a waiter sends a KOT, the kitchen screen immediately chimes and renders the ticket.
  * When a payment is recorded, table occupancy dots update in real-time.
* **Wireless Resilience**: If a waiter walks to a patio or outdoor area with momentary Wi-Fi packet loss:
  1. The header badge switches from green (**Connected**) to amber (**Reconnecting...**).
  2. The application maintains open cart drafts in browser memory.
  3. When Wi-Fi signal resumes, the client reconnects automatically within 2 seconds with exponential backoff and synchronizes pending table states without data loss.

---

## 5. Security, Cookies & Firewall Configuration

### Windows Firewall Rules
The Windows Server Installer automatically creates the necessary inbound firewall exception:
- **Rule Name**: `DaxabitHMS Web & API Server`
- **Protocol**: TCP
- **Port**: `1995`
- **Scope**: Local Subnet (Private / Domain profiles)

If you configure firewall rules manually via PowerShell:
```powershell
New-NetFirewallRule -DisplayName "DaxabitHMS Web Server" `
  -Direction Inbound -LocalPort 1995 -Protocol TCP `
  -Action Allow -Profile Private
```

### Cookie & Authentication Hardening
- Authentication cookies use `HttpOnly` and `SameSite=Lax` flags to prevent XSS credential theft.
- When accessed over plain HTTP on a local LAN IP (e.g. `http://192.168.1.100:1995`), cookies are restricted to internal network origins.
- Cross-Origin Resource Sharing (CORS) strictly rejects requests originating from unauthorized external domains.

---

## 6. Secure Remote Access (HTTPS & Cloud)

> **Important**: Never expose port `1995` directly to the public internet without an encrypted HTTPS reverse proxy and firewall hardening.

If the restaurant owner wants remote access from home or while traveling, implement one of these sanctioned approaches:

### Recommended Option A: Zero-Trust Tunnel (Cloudflare Tunnel or Tailscale)
- **Tailscale**: Install Tailscale on the server PC and owner's mobile phone. Connect securely via private WireGuard IP without opening any ports on the router.
- **Cloudflare Tunnel (`cloudflared`)**: Creates an outbound TLS tunnel from the restaurant server to Cloudflare edge with automatic SSL certificates and optional email/OTP authentication.

### Recommended Option B: Nginx / Caddy HTTPS Reverse Proxy
If running on a cloud VPS or dynamic DNS:
```nginx
server {
    listen 443 ssl http2;
    server_name pos.yourrestaurant.com;

    ssl_certificate /etc/letsencrypt/live/pos.yourrestaurant.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.yourrestaurant.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:1995;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
In HTTPS mode, Daxabit automatically enables `Secure` cookie attributes.

