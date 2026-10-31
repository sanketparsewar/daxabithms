# DaxabitHMS: System Administrator Manual

This manual provides systems engineers, IT administrators, and DevOps personnel with comprehensive operational instructions for managing the **DaxabitHMS** platform.

---

## 1. System Architecture & Components

DaxabitHMS is built as an enterprise-grade TypeScript monorepo:

```
┌────────────────────────────────────────────────────────┐
│                   DaxabitHMS Monorepo                  │
│                                                        │
│  [apps/backend]   ──  NestJS 11 REST API + Socket.IO   │
│  [apps/web]       ──  Next.js 16 (App Router / React) │
│  [packages/types] ──  Shared TypeScript DTOs & Schemas │
│  [windows/msix]   ──  WinForms + WebView2 Client       │
│  [windows/installer] ─ Inno Setup Server Bootstrapper  │
└────────────────────────────────────────────────────────┘
```

- **Runtime**: Node.js 22 LTS x64 (bundled portable on Windows Server mode)
- **Database Engine**: PostgreSQL 16+ with Prisma ORM
- **Realtime Layer**: Socket.IO with WebSocket and long-polling fallbacks
- **State & Caching**: TanStack React Query on frontend, connection pooling on backend

---

## 2. Environment Variables & Configuration Reference

Primary configuration resides in `.env` (or `%PROGRAMDATA%\DaxabitHMS\server\config\server.env` on Windows):

| Variable | Description | Default | Security Consideration |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `production` | Set to `production` in live environments. |
| `PORT` | Backend HTTP API port | `3001` | Private port; reverse proxied or accessed via Next.js. |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Must point to an authenticated database. |
| `JWT_SECRET` | Secret key for JWT signing | *Random 64-char string* | Change in production; never commit to git. |
| `SESSION_SECRET` | Secret for cookie sessions | *Random 64-char string* | Minimum 32 bytes of cryptographic entropy. |
| `FRONTEND_URL` | Allowed origin for CORS & push | `http://localhost:1995` | Comma-separated list for custom domains. |
| `BACKUP_SCHEDULE` | Cron expression for automated backup | `0 0 * * *` (Midnight) | Daily automated database snapshot. |
| `BACKUP_DIR` | Absolute path for backup dumps | `%PROGRAMDATA%\...\backups` | Ensure drive volume has sufficient free space. |

---

## 3. Database Maintenance & Prisma Migrations

### Running Migrations in Production
When applying updates:
```bash
# In Linux / Docker:
pnpm prisma migrate deploy

# On Windows Server:
& "$env:ProgramFiles\DaxabitHMS\runtimes\node\node.exe" `
  "$env:ProgramFiles\DaxabitHMS\server\prisma-cli.js" migrate deploy
```

### PostgreSQL Vacuuming & Query Optimization
For large restaurant databases handling 1,000+ orders daily:
```sql
-- Analyze table statistics for optimal query planning
ANALYZE orders;
ANALYZE order_items;
ANALYZE inventory_transactions;

-- Run VACUUM to reclaim storage and update index maps
VACUUM (ANALYZE, VERBOSE) orders;
```

---

## 4. Windows Service Lifecycle Management

The Windows server installer registers the system service `DaxabitHMSServer`:

```powershell
# Check service status
Get-Service -Name DaxabitHMSServer

# Stop the server cleanly
Stop-Service -Name DaxabitHMSServer

# Start the server
Start-Service -Name DaxabitHMSServer

# Restart after configuration update
Restart-Service -Name DaxabitHMSServer
```

### Log File Locations
- Server stdout/stderr logs: `%PROGRAMDATA%\DaxabitHMS\server\logs\server.log`
- PostgreSQL engine logs: `%PROGRAMDATA%\DaxabitHMS\server\data\log\`
- Update audit logs: `%PROGRAMDATA%\DaxabitHMS\server\logs\updates.log`

---

## 5. API Keys & Third-Party Integrations (`/settings/api-keys`)

Administrators can issue programmatic REST API keys for ERP software, accounting packages, or delivery aggregators:
1. Navigate to **Settings ➔ API Keys** (`/settings/api-keys`).
2. Click **Generate New API Key**:
   - Set description (e.g., *Zomato Aggregator*, *Tally Accounting Sync*).
   - Set expiration window.
   - Choose scoped permissions (e.g. `orders.read`, `inventory.read`).
3. Copy the secret key immediately. It is never displayed again.
4. Requests authenticate via header: `Authorization: Bearer <API-KEY>`.

---

## 6. Outbound Webhooks (`/settings/webhooks`)

Trigger real-time HTTP callbacks to third-party endpoints when key events happen:
- Supported events:
  - `order.created`: Fires when new order is received.
  - `order.paid`: Fires when check is settled.
  - `inventory.low_stock`: Fires when ingredient reaches reorder threshold.
- Daxabit signs all outbound webhook payloads using **HMAC SHA-256** with your configured webhook secret in the header `X-Daxabit-Signature`.

