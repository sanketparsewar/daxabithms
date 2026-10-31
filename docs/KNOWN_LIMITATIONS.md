# DaxabitHMS — Known Operational Limitations & Boundaries

**Version:** 1.0.0 (Production Release)  
**Document Purpose:** Defines architectural constraints, platform behaviors, and operational boundaries in DaxabitHMS to guide system administrators and restaurant operators during deployment.

---

## 1. Network & Protocol Boundaries

### 1.1 Plain HTTP Cookie Handling on Local Area Networks (LAN)
- **Constraint:** RFC 6265 mandates that modern browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari) silently reject cookies marked with the `Secure` attribute when transmitted over unencrypted `http://` connections.
- **Behavior in Daxabit:** The authentication system automatically detects whether the incoming connection is TLS/HTTPS or local HTTP. On local LAN IPs (e.g. `http://192.168.1.100:1995`), cookies are sent without the `Secure` flag so logins succeed.
- **Operational Rule:** Do not manually force `COOKIE_SECURE=true` in `.env` when deploying on an unencrypted local network. Only enable `COOKIE_SECURE=true` when running behind an SSL-terminating reverse proxy (HTTPS).

### 1.2 Mobile WebKit & Chromium Audio Autoplay Restrictions
- **Constraint:** Apple iOS/iPadOS Safari and Android Chrome enforce strict user-gesture policies prohibiting web applications from playing unprompted audio chimes.
- **Behavior in Daxabit:** When mounting a new tablet in the kitchen for the Kitchen Display System (`/kds`), the audible KOT chime requires a single initial physical screen tap when the page loads in the morning.
- **Operational Rule:** Kitchen staff should tap the screen once upon opening the morning shift. Once unlocked, all subsequent incoming tickets chime audibly without further taps.

---

## 2. Printing & Hardware Constraints

### 2.1 Direct USB Character Devices vs Windows Print Spooler
- **Constraint:** Linux kernels expose raw character device nodes (`/dev/usb/lp0`), whereas Windows routes USB printers through the Windows Hardware Device Manager and Print Spooler subsystem.
- **Behavior in Daxabit:**
  - **On Windows**: Thermal receipt printing uses the native Windows Print Spooler driver integration (`Ctrl+P` / WebView2 native printing) or Network Ethernet/Wi-Fi printing (Port 9100).
  - **On Linux / Docker**: Raw ESC/POS byte streaming directly to `/dev/usb/lp0` is supported.
- **Operational Rule:** For Windows-based restaurant counters, install the manufacturer's Windows printer driver and set paper width to 58mm or 80mm in printer properties.

### 2.2 Serial / COM Port Cash Drawers
- **Constraint:** Daxabit standardizes on industry-standard 24V RJ12 solenoid kick cables plugged into the DK port of the thermal receipt printer.
- **Operational Rule:** Standalone legacy RS-232 serial cash drawers plugged directly into a PC COM port are not natively driven via raw byte signals; use an RJ12 printer-driven drawer.

---

## 3. Database & Concurrency Boundaries

### 3.1 Logical vs Physical Multi-Tenancy
- **Architecture:** Daxabit enforces strict logical multi-tenant isolation via mandatory `restaurantId` and `branchId` scoping on every Prisma query, validated by automated security tests.
- **Boundary:** Database tables are shared across tenants on a single PostgreSQL instance. Physical database sharding (separate isolated PostgreSQL databases per restaurant brand) is not implemented in v1.0.0.

### 3.2 Active Billing Update Protection
- **Constraint:** Software upgrades cannot be applied while guests have active open dining orders on tables.
- **Behavior:** The update API (`POST /api/v1/system/update/apply`) returns HTTP 409 Conflict if active billing is in progress.
- **Operational Rule:** Schedule software updates during daily closing hours after all tables have been paid and the register shift has been closed.

---

## 4. Multi-Server Clustering & Media Storage

### 4.1 Local Filesystem Storage for Uploads
- **Constraint:** In standard single-server deployments (Windows installer or standalone Docker), uploaded menu dish photos and restaurant logos are stored on the local volume (`/data/uploads` or `%PROGRAMDATA%\DaxabitHMS\server\uploads`).
- **Operational Rule:** If deploying a horizontally scaled multi-server cluster behind a cloud load balancer, configure an S3-compatible object store (AWS S3, Cloudflare R2, MinIO) so all backend nodes share a unified image repository.
