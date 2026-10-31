# DaxabitHMS — Secure Remote Access Guide

This guide outlines approved, production-grade patterns for accessing DaxabitHMS remotely (outside the restaurant's local Wi-Fi / LAN), ensuring owner reports, multi-branch management, and off-site operations remain protected against unauthorized access.

---

## 1. Security Warning: Why Simple Router Port-Forwarding is Prohibited

> [!CAUTION]
> **NEVER forward unencrypted HTTP (Port 1995 or 80) directly on your restaurant router to the public internet.**
> 
> Direct router port forwarding without HTTPS and hardened access control exposes:
> 1. Staff credentials and session tokens to interception over public networks.
> 2. The server to automated internet scanning bots, brute-force attacks, and distributed denial of service (DDoS).
> 3. Point of Sale and financial records to unauthorized tampering.

To achieve secure remote access, choose one of the three industry-standard patterns described below.

---

## 2. Approach 1: Tailscale / WireGuard Mesh VPN (Highest Security, Zero Open Ports)

**Best for:** Restaurant owners and managers who want to check reports, edit menus, and view sales from home or mobile phones without exposing anything to the public internet.

```
       Restaurant Server                     Owner's Phone / Laptop
     ┌───────────────────────┐            ┌───────────────────────────┐
     │  DaxabitHMS (:1995)   │            │ Browser / Tailscale App   │
     │  Tailscale:           │◄══════════►│ Tailscale:                │
     │  100.85.20.1          │  WireGuard │ 100.85.20.2               │
     └───────────────────────┘  Encrypted └───────────────────────────┘
```

### Why It's Best:
- **Zero open ports** on the restaurant router.
- Direct peer-to-peer WireGuard encrypted tunnel.
- Operates over mobile 4G/5G, home broadband, or hotel Wi-Fi.
- DaxabitHMS has built-in support for Tailscale's `100.64.0.0/10` CGNAT range in its CORS security layer.

### Setup Instructions:
1. **Install Tailscale on the Server Machine**:
   - Download from [tailscale.com](https://tailscale.com) and log in.
   - Note the server's Tailscale IP address (e.g., `100.85.20.1`) or MagicDNS name (e.g., `pos-server`).
2. **Install Tailscale on Your Mobile / Remote Laptop**:
   - Install the Tailscale app from the App Store / Google Play / macOS / Windows.
   - Log into the same account.
3. **Connect**:
   - Open your browser on your remote device and navigate to:
     `http://100.85.20.1:1995` or `http://pos-server:1995`
   - Log in securely as normal.

---

## 3. Approach 2: Cloudflare Zero Trust / Cloudflare Tunnel (`cloudflared`)

**Best for:** Restaurants that want a public custom domain (e.g., `https://pos.myrestaurant.com`) for remote management or customer QR-ordering, with zero open inbound firewall ports.

```
 Remote Device          Cloudflare Edge                 Restaurant Server
┌──────────────┐     ┌─────────────────────┐         ┌───────────────────────┐
│ Browser      │────►│ TLS 1.3 / WAF       │◄───────►│ cloudflared daemon    │
│              │     │ Zero Trust Access   │ Outbound│ DaxabitHMS (:1995)    │
└──────────────┘     └─────────────────────┘ Tunnel  └───────────────────────┘
```

### Setup Instructions:
1. **Sign Up for Cloudflare Zero Trust** (Free tier covers up to 50 users).
2. **Create a Tunnel** in Cloudflare Zero Trust Dashboard &rarr; Networks &rarr; Tunnels.
3. **Install the Connector (`cloudflared`) on the Server Machine**:
   - **Windows (PowerShell)**:
     ```powershell
     winget install --id Cloudflare.cloudflared
     cloudflared service install <your-tunnel-token>
     ```
   - **Linux / Docker**:
     Add the `cloudflared` container to `docker-compose.yml`.
4. **Route the Hostname**:
   - Point `pos.myrestaurant.com` to `http://localhost:1995` in the Cloudflare Tunnel configuration.
5. **Add Access Protection (Optional but Recommended)**:
   - Configure a Cloudflare Access Application to require email one-time passcode (OTP) or Google workspace authentication before reaching the login screen.

---

## 4. Approach 3: Hardened Reverse Proxy with Domain & HTTPS (VPS Deployment)

**Best for:** Cloud VPS installations where the server already has a public static IP address.

### Mandatory Hardening Measures:
1. **Automatic TLS Encryption**: Use Caddy or Nginx + Certbot for TLS 1.3 encryption.
2. **Secure Cookies**: Set `COOKIE_SECURE=true` in `.env` so session cookies are strictly delivered over HTTPS.
3. **CORS Restrictions**: Set `CORS_ORIGIN=https://pos.yourrestaurant.com` to prevent unauthorized cross-origin requests.
4. **Internal Services Guard**: Ensure PostgreSQL (`5432`) and backend (`4000`) are bound to `127.0.0.1` or internal Docker network only.
5. **Fail2ban / IP Banning**: Install `fail2ban` on the VPS to automatically ban IP addresses that generate excessive authentication failures.

---

## 5. Account & Access Security Best Practices

Regardless of your chosen remote access approach, enforce the following security controls within DaxabitHMS:

1. **Two-Factor Authentication (TOTP 2FA)**:
   - Every user with `users.manage`, `settings.manage`, or Owner privileges should enable 2FA via **Settings > Security > Two-Factor Authentication**.
   - Compatible with Google Authenticator, 1Password, Bitwarden, and Apple Keychain.
2. **Role-Based Access Control (RBAC)**:
   - Do not grant waitstaff or cashier accounts administrative permissions.
   - Use the **Waiter** role for table service staff, limiting their view strictly to menu, tables, and POS.
3. **Terminal PINs for Shift Changes**:
   - Enable quick PIN login for busy service floors, while requiring full passwords + 2FA for administrative settings and financial reporting.
4. **Audit Logging**:
   - All critical actions (refunds, voids, cash drawer openings, price modifications, user updates) are recorded in **Settings > Audit Log** with timestamp, user ID, IP address, and details.

