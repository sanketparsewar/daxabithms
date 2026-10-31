# DaxabitHMS — Known Operational Limitations & Boundaries

This document describes intentional architectural constraints, platform behaviors, and operational boundaries in DaxabitHMS v1.0.5. Understanding these boundaries ensures smooth deployment and operation in real restaurant environments.

---

## 1. Network & Protocol Limitations

### 1.1 Plain HTTP Cookie Handling on Local Area Networks (LAN)
- **Constraint:** RFC 6265 specifies that modern browsers (Chrome, Edge, Firefox, Safari) **silently reject** cookies carrying the `Secure` flag if delivered over plain `http://` connections.
- **Behavior:** In DaxabitHMS, `COOKIE_SECURE` defaults to `auto` (or `false` on HTTP). If an administrator manually forces `COOKIE_SECURE=true` in `.env` while running on an unencrypted LAN IP (`http://192.168.1.100:1995`), logins will fail because the browser drops the session cookie.
- **Guidance:** Leave `COOKIE_SECURE` unset or set to `auto` on LAN. Only set `COOKIE_SECURE=true` when running behind an SSL-terminating reverse proxy (HTTPS).

### 1.2 Mobile Browser Autoplay Audio Restrictions
- **Constraint:** Apple WebKit (Safari on iPad/iPhone) and Google Chrome on Android enforce strict autoplay policies that block programmatic audio alerts (`AudioContext` / HTML5 Audio) until the user has performed at least one physical tap on the page.
- **Behavior:** When opening the Kitchen Display System (KDS) on a newly mounted tablet, the audible new-ticket chime will not play until a kitchen staff member taps the screen or clicks the **Turn on sound** button once.
- **Guidance:** Once unlocked by a single tap, audio remains functional indefinitely for the duration of the browser tab's lifecycle.

---

## 2. Printing & Hardware Constraints

### 2.1 Direct-USB vs Network Thermal Printers
- **Linux / Docker:** The backend writes directly to the Linux kernel character device node (`/dev/usb/lp0` or `c 180:*` / `c 189:*`).
- **Windows Host:** Windows does not expose raw character device nodes like `/dev/usb/lp0`. Therefore, on Windows:
  1. **Network Thermal Printers (Recommended):** Connect the printer to the local Ethernet/Wi-Fi router and configure its IP address in DaxabitHMS (Port 9100).
  2. **USB Thermal Printers:** Connect via the Windows Print Spooler driver and use the Windows Desktop Application (`Ctrl+P` / Native Print Spooler integration).

### 2.2 Serial / COM Port Cash Drawers
- Cash drawers connected via standard RJ12 solenoid cables to the thermal printer kick port are fully supported. Standalone RS-232 serial cash drawers connected directly to PC COM ports require a virtual printer spooler driver.

---

## 3. Database & Concurrency

### 3.1 Multi-Tenant Isolation
- DaxabitHMS enforces strict logical multi-tenant isolation via mandatory `restaurantId` and `branchId` scoping on all queries and mutations. Physical tenant database sharding (separate Postgres database per restaurant) is not required for standard restaurant chains and is not implemented in v1.0.5.

### 3.2 Serverless PostgreSQL Poolers (Neon / Supabase)
- When connecting to Neon via serverless poolers (PgBouncer), Prisma connects over TCP pooler mode. Ensure migration commands (`prisma migrate deploy`) connect through the direct connection or that pooler timeouts are sufficiently configured for large schema updates.

---

## 4. Multi-Server Clustering & Storage

### 4.1 Local Uploads in Clustered Environments
- In single-node installations (the vast majority of restaurant servers), uploaded menu item images and restaurant logos are stored on the local filesystem (`/data/uploads` or `%PROGRAMDATA%\DaxabitHMS\server\uploads`).
- If deploying a horizontally scaled multi-server cluster behind a cloud load balancer, an S3-compatible object store (AWS S3, Cloudflare R2, MinIO) must be configured so all application nodes share a unified image repository.

