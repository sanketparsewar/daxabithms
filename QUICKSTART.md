# Daxabit — Quick Start Guide

Welcome to **Daxabit**, a modern, offline-first Restaurant & Hospitality Management System (POS, Kitchen Display System, Table Management, Inventory, and CRM).

This step-by-step guide walks you through setting up and running Daxabit on your local machine in under 5 minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: `v22` or newer (Recommended: install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`)
- **pnpm**: `v9` or newer (`corepack enable && corepack prepare pnpm@latest --activate` or `npm install -g pnpm`)
- **PostgreSQL**: `v15` or newer (Local service, Docker container, or cloud provider like Neon/Supabase)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/sanketparsewar/daxabithms.git
cd daxabithms

# Install all workspace dependencies
pnpm install
```

---

### Step 2: Configure Environment Variables

Daxabit uses monorepo workspaces with individual `.env` files for the backend and web frontend:

#### 1. Backend Environment (`apps/backend/.env`)

Copy the template or create `apps/backend/.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Ensure your `DATABASE_URL` and security secrets are configured:

```env
# Database Connection (replace with your local or cloud PostgreSQL credentials)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/daxabit?schema=public"

# Application Ports
PORT=4001
CORS_ORIGIN="http://localhost:3000"

# Security & Secrets (generate random strings in production)
JWT_SECRET="daxabit_super_secret_jwt_key_min_32_chars_long_12345"
SESSION_SECRET="daxabit_super_secret_session_key_min_32_chars_12345"
DATA_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

#### 2. Web Frontend Environment (`apps/web/.env.local`)

Create or update `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4001"
```

---

### Step 3: Initialize Database & Build Shared Packages

Run the database migrations and build the shared TypeScript packages:

```bash
# 1. Build the shared types package
pnpm --filter @daxabithms/types build

# 2. Push schema / run migrations on your database
pnpm --filter @daxabithms/backend prisma migrate dev

# 3. (Optional) Seed initial demo data (menu, tables, default admin)
pnpm --filter @daxabithms/backend seed
```

---

### Step 4: Start the Development Server

Launch both the frontend and backend in development mode with a single command:

```bash
npm run dev
```

You will see:
- 🌐 **Web Frontend (POS, KDS, Admin)**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend REST API**: [http://localhost:4001/api/v1](http://localhost:4001/api/v1)
- 📖 **Interactive Swagger API Documentation**: [http://localhost:4001/api/docs](http://localhost:4001/api/docs)

---

## 🔑 Default Credentials & First Login

If you ran the database seed:
- **Email**: `admin@daxabit.com` (or the email specified in seed)
- **Password**: `password123`

### Fresh Instance Setup (No Seed)
If starting without seeded data:
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **Get started free** or navigate to [http://localhost:3000/signup](http://localhost:3000/signup).
3. Enter your restaurant name, initial branch location, and admin password to initialize your venue.

---

## 🐳 Alternative: Running with Docker Compose

If you prefer running everything in containerized isolation:

```bash
# Start Postgres, Backend API, and Web App together
docker compose up -d

# View live container logs
docker compose logs -f
```

Your app will be live at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Common Commands Cheatsheet

| Task | Command |
|---|---|
| Run all dev servers | `npm run dev` |
| Typecheck entire project | `pnpm --filter web typecheck && pnpm --filter @daxabithms/backend typecheck` |
| Run web test suite | `pnpm --filter web test` |
| Run backend test suite | `pnpm --filter @daxabithms/backend test` |
| Open Prisma Database Studio | `pnpm --filter @daxabithms/backend prisma studio` |
| Build for production | `pnpm build` |

---

## 💬 Support & Contributing

- **Documentation**: Visit `/docs` within the running app or browse the [docs/](./docs) folder.
- **Reporting Issues**: [https://github.com/sanketparsewar/daxabithms/issues](https://github.com/sanketparsewar/daxabithms/issues)
- **Company**: Daxabit — [https://daxabit.com](https://daxabit.com)
