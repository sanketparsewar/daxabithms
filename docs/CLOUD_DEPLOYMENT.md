# DaxabitHMS — Cloud & VPS Deployment Guide

This guide details how to deploy DaxabitHMS to a Cloud Virtual Private Server (VPS) such as Hetzner, DigitalOcean, AWS EC2, or Linode, with production-grade security, automatic HTTPS, and zero exposed database ports.

---

## 1. Cloud Architecture

In a production cloud deployment, all client traffic passes through an SSL-terminating reverse proxy (such as Caddy or Nginx) before reaching the DaxabitHMS web application.

```
       Internet / Remote Staff / Mobile Orders
                        │
                        ▼  HTTPS (Port 443)
       ┌─────────────────────────────────────────────────┐
       │   Cloud VPS (e.g., Ubuntu 24.04 LTS / Debian 12)│
       │                                                 │
       │   ┌─────────────────────────────────────────┐   │
       │   │ Reverse Proxy (Caddy / Nginx / Certbot) │   │
       │   │ Handles TLS & WebSocket Upgrades        │   │
       │   └───────────────────┬─────────────────────┘   │
       │                       │ HTTP (Port 1995)        │
       │                       ▼                         │
       │   ┌─────────────────────────────────────────┐   │
       │   │ DaxabitHMS Web Container (Next.js)      │   │
       │   └───────────────────┬─────────────────────┘   │
       │                       │ Internal Docker Network │
       │                       ▼                         │
       │   ┌─────────────────────────────────────────┐   │
       │   │ DaxabitHMS Backend (NestJS :4000)       │   │
       │   └───────────────────┬─────────────────────┘   │
       │                       │ Internal Docker Network │
       │                       ▼                         │
       │   ┌─────────────────────────────────────────┐   │
       │   │ PostgreSQL (Internal 5432) OR Neon/RDS │   │
       │   └─────────────────────────────────────────┘   │
       └─────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Zero Public Database Exposure:** The PostgreSQL database port (`5432`) and internal NestJS API port (`4000`) must **NEVER** be published to the public internet. Only ports `80` and `443` should be accessible externally.

---

## 2. Server Preparation & Hardening

### Step 1: Install Docker & Docker Compose
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose Plugin
sudo apt install -y docker-compose-plugin
```

### Step 2: Configure UFW Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 80/tcp comment "HTTP (Let's Encrypt)"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw enable
```

---

## 3. Environment Configuration

Clone the repository or deploy via `docker-compose.yml`:

```bash
mkdir -p /opt/daxabithms && cd /opt/daxabithms
```

Create `/opt/daxabithms/.env`:

```ini
# Production Environment Configuration
NODE_ENV=production
APP_VERSION=latest

# Web & Domain
HOST_PORT=1995
FRONTEND_ORIGIN=https://pos.yourrestaurant.com
CORS_ORIGIN=https://pos.yourrestaurant.com
COOKIE_SECURE=true
TRUST_PROXY=1

# Security Secrets (Must be unique 32+ byte random strings)
# Generate via: openssl rand -hex 32
JWT_SECRET=replace_with_64_char_random_hex_string_here
POSTGRES_PASSWORD=replace_with_strong_database_password_here
BACKUP_ENCRYPTION_KEY=replace_with_64_char_hex_encryption_key_here

# Database (Internal Docker DB or external Neon/RDS connection string)
DATABASE_URL=postgresql://daxabithms:replace_with_strong_database_password_here@postgres:5432/daxabithms

# Optional Off-Site Encrypted S3 Backups
S3_BACKUP_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BACKUP_BUCKET=restaurant-backups
S3_BACKUP_ACCESS_KEY_ID=your_r2_access_key
S3_BACKUP_SECRET_ACCESS_KEY=your_r2_secret_key
S3_BACKUP_REGION=auto
S3_BACKUP_INTERVAL_DAYS=1
S3_BACKUP_RETAIN_COUNT=7
```

---

## 4. HTTPS Reverse Proxy Setup

### Option A: Caddy (Recommended — Automatic SSL & Zero-Config)

Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y
```

Configure `/etc/caddy/Caddyfile`:
```caddy
pos.yourrestaurant.com {
    # Automatic Let's Encrypt TLS certificate provisioning
    reverse_proxy 127.0.0.1:1995 {
        # WebSocket and proxy headers handled automatically by Caddy
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    encode gzip zstd
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

### Option B: Nginx with Certbot

Install Nginx and Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/daxabithms`:
```nginx
server {
    listen 80;
    server_name pos.yourrestaurant.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pos.yourrestaurant.com;

    ssl_certificate /etc/letsencrypt/live/pos.yourrestaurant.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.yourrestaurant.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:1995;
        proxy_http_version 1.1;

        # WebSocket Upgrade support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and acquire certificate:
```bash
sudo ln -s /etc/nginx/sites-available/daxabithms /etc/nginx/sites-enabled/
sudo certbot --nginx -d pos.yourrestaurant.com
sudo systemctl reload nginx
```

---

## 5. Starting the Application

Launch the container stack:
```bash
docker compose up -d
```

Verify services:
```bash
docker compose ps
docker compose logs -f web backend
```

---

## 6. Maintenance & Updates

### Applying Migrations
Database migrations execute automatically on container startup. To inspect status manually:
```bash
docker compose exec backend npx prisma migrate status
```

### Creating On-Demand Database Backup
```bash
docker compose exec backend node -e "/* Trigger backup */"
```
Or simply use the **Settings > Backup > Backup Now** button in the web dashboard.

