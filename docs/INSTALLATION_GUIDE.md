# DaxabitHMS: Master Installation Guide

This guide covers the installation and setup of **DaxabitHMS** across all supported deployment architectures.

---

## 1. Deployment Architecture Options

DaxabitHMS is designed for flexibility, supporting four primary deployment topologies depending on the restaurant's operational size and IT setup:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT TOPOLOGIES                           │
│                                                                        │
│  [Option 1: Windows Single-PC]  ──  Server + POS on one Windows PC    │
│  [Option 2: Restaurant LAN]     ──  One PC is Server; others connect  │
│                                     via browser / lightweight client   │
│  [Option 3: Linux / Docker]     ──  Containerized server on Linux /    │
│                                     Synology NAS / On-premise server   │
│  [Option 4: Cloud / VPS]        ──  Hosted on DigitalOcean / AWS / GCP │
│                                     with secure HTTPS reverse proxy    │
└────────────────────────────────────────────────────────────────────────┘
```

| Topology | Best Suited For | Internet Required? | Hardware Needed |
| :--- | :--- | :--- | :--- |
| **Windows Single-PC** | Cafes, food trucks, quick-service with 1 billing terminal | No (100% offline) | 1 Windows 10/11 PC |
| **Restaurant LAN** | Dine-in restaurants with kitchen, waiters on tablets, cashier | No (100% offline) | 1 Main Windows PC + Wi-Fi router + tablets |
| **Linux / Docker** | Multi-brand kitchens, restaurant groups with on-site server | No (100% offline) | Mini PC / Server running Ubuntu / Debian |
| **Cloud / VPS** | Multi-branch franchises needing central data aggregation | Yes | VPS (2 vCPU, 4GB RAM) + Domain + SSL |

---

## 2. Hardware & System Prerequisites

### Minimum Requirements (Single Terminal)
- **CPU**: Dual-core x64 processor (Intel Core i3 / AMD Ryzen 3 or higher, 2.0 GHz)
- **RAM**: 4 GB (8 GB strongly recommended for Server Mode)
- **Storage**: 10 GB free space on an SSD volume (HDD not recommended for live billing)
- **Operating System**: Windows 10 (Build 1809+) or Windows 11 64-bit; Ubuntu 22.04+ for Linux
- **Display**: 1280 × 720 resolution (1920 × 1080 touchscreen recommended)

### Network Prerequisites (For Multi-Device LAN)
- Dedicated Wi-Fi router (Wi-Fi 5 / Wi-Fi 6) located in the dining/billing area
- Static local IP address assigned to the server PC (e.g. `192.168.1.100`) via DHCP reservation in your router
- Inbound TCP port `1995` (Web & API) and `5432` (PostgreSQL local only) permitted in Windows Firewall (automated by the Windows Server Installer)

---

## 3. Option 1 & 2: Windows Installation (Quick-Start)

The Windows installer (`DaxabitHMS-Setup.exe`) automates all database, service, firewall, and runtime configurations.

### Step 1: Run Installer on Server PC
1. Download `DaxabitHMS-Setup.exe` from your authorized release source.
2. Double-click to run. When prompted by Windows User Account Control (UAC), click **Yes**.
3. Select **Full Server Mode** (installs PostgreSQL, backend service, web server, and desktop launcher).
4. Click **Install**. The installer configures:
   - Portable PostgreSQL 16 on local loopback (`127.0.0.1:5432`)
   - `DaxabitHMSServer` Windows Background Service
   - Windows Firewall inbound rule for port `1995`
   - Desktop and Start Menu shortcuts
5. Once installation finishes, check **Launch DaxabitHMS** and click **Finish**.

> For deep-dive Windows server configuration and uninstallation recovery, see:
> - [Windows Server Installation Guide](file:///d:/daxabithms/docs/WINDOWS_SERVER_INSTALLATION.md)
> - [Windows Client Installation Guide](file:///d:/daxabithms/docs/WINDOWS_CLIENT_INSTALLATION.md)

### Step 2: Connect Other Devices on the LAN
On any tablet, phone, or secondary PC connected to the same restaurant Wi-Fi:
1. Open Google Chrome, Microsoft Edge, or Safari.
2. Enter the server's local address: `http://<SERVER-IP>:1995` (e.g. `http://192.168.1.100:1995`).
3. Bookmark or tap **Add to Home Screen** to install as a full-screen Progressive Web App (PWA).

> For detailed LAN routing and router configuration, see:
> - [LAN Deployment Guide](file:///d:/daxabithms/docs/LAN_DEPLOYMENT.md)
> - [Browser Access Guide](file:///d:/daxabithms/docs/BROWSER_ACCESS_GUIDE.md)

---

## 4. Option 3: Linux & Docker Installation

For Linux servers or Docker environments:

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2 installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

### Step 1: Clone or Copy Compose Stack
Create a directory `/opt/daxabithms` and place the production `docker-compose.yml`:
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: daxabit-postgres
    restart: always
    environment:
      POSTGRES_DB: daxabit
      POSTGRES_USER: daxabit
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ChangeMeSecurePassword123}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U daxabit -d daxabit"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/daxabithms/backend:latest
    container_name: daxabit-backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://daxabit:${DB_PASSWORD:-ChangeMeSecurePassword123}@postgres:5432/daxabit?schema=public
      JWT_SECRET: ${JWT_SECRET:-GenerateA32ByteSecretStringHere}
      SESSION_SECRET: ${SESSION_SECRET:-GenerateAnother32ByteSecretStringHere}
      FRONTEND_URL: http://localhost:1995
    volumes:
      - uploads:/app/uploads
      - backups:/app/backups

  web:
    image: ghcr.io/daxabithms/web:latest
    container_name: daxabit-web
    restart: always
    ports:
      - "1995:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_API_URL: http://localhost:1995/api/v1
    depends_on:
      - backend

volumes:
  pgdata:
  uploads:
  backups:
```

### Step 2: Initialize & Start Containers
```bash
cd /opt/daxabithms
docker compose up -d
```

### Step 3: Run Database Migrations
```bash
docker compose exec backend pnpm prisma migrate deploy
```

---

## 5. First-Run Setup & Initialization

1. Open your browser to `http://localhost:1995` (or `http://<SERVER-IP>:1995`).
2. You will be greeted by the **Setup Account** wizard (`/signup`):
   - Enter your **Restaurant Name** (e.g. *Royal Taj Bistro*).
   - Enter your **First Branch Name** (e.g. *Downtown Location*).
   - Enter the **Owner Name**, **Email Address**, and master **Password**.
3. Click **Complete Setup & Launch**.
4. You land on the **Dashboard** with the **Owner Onboarding Checklist** ready to guide you through tables, menu, printers, and staff.

> Follow the complete setup walkthrough in:
> - [Restaurant Setup Guide](file:///d:/daxabithms/docs/RESTAURANT_SETUP_GUIDE.md)
> - [Restaurant Owner Onboarding Guide](file:///d:/daxabithms/docs/RESTAURANT_OWNER_ONBOARDING_GUIDE.md)

---

## 6. Post-Installation Verification Checklist

Before opening the doors for customer service, verify these key health indicators:

- [ ] **Database Connection**: Dashboard loads without query errors.
- [ ] **Realtime Push (WebSocket)**: Connection status indicator in header shows green dot (**Connected**).
- [ ] **Printer Diagnostics**: Navigate to `Settings` ➔ scroll to `Printer Diagnostics` ➔ click `Print Test Receipt`.
- [ ] **LAN Device Reachability**: Open `http://<SERVER-IP>:1995` on a tablet and log in with a waiter account.
- [ ] **First Test Sale**: Ring up an item in POS, send KOT to kitchen, settle via Cash, and verify print.
- [ ] **Automated Backup**: Confirm `%PROGRAMDATA%\DaxabitHMS\backups\` (or Docker `backups` volume) is writable.

