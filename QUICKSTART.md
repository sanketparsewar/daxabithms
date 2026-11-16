# DaxabitHMS Desktop Quick Start

DaxabitHMS is distributed as a local desktop application. The database, Node.js API, and interface run on the same computer; the packaged app does not expose a browser service to the LAN.

## Ubuntu and Debian

Install the release `.deb` package and launch **DaxabitHMS** from the Applications menu. The package installs the local service and opens its interface in a Chromium app window. On first start, Docker downloads the service images; later use and business data stay local.

## Windows

Install the release MSIX package and launch **DaxabitHMS** from Start. On first launch, the app initializes its bundled PostgreSQL database and starts its local Node.js backend and interface. The first setup can take a few minutes.

On either platform, create the owner account through the app’s signup flow. The new database has no demo data by default.

## Desktop components

- `apps/backend`: Node.js API built with NestJS, Prisma, and PostgreSQL.
- `apps/web`: Next.js interface embedded in the desktop app.
- `packages/types`: Shared TypeScript and Zod contracts.

The frontend and backend have separate builds and Dockerfiles. Desktop packages run them locally and bind service ports to loopback.

## Developer setup

Development requires Node.js 22+, pnpm, and local PostgreSQL. Copy `apps/backend/.env.example` to `apps/backend/.env`, set `DATABASE_URL` to your local database, then build the shared types and apply migrations:

```bash
pnpm install
pnpm --filter @daxabithms/types build
cd apps/backend
./node_modules/.bin/prisma migrate dev
cd ../..
pnpm dev
```

The development command runs the API on port 4001 and Next.js on port 3000. This is for development; end users should use the desktop installer.
