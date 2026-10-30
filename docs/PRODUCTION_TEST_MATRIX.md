# DaxabitHMS — Production Test Matrix & Hardware Verification Protocols

**Document Date:** October 2026  
**Test Automation Frameworks:** Jest (Backend), Node.js Test Runner (Frontend), Supertest (E2E)  
**Target Coverage Scope:** Auth, RBAC, Multi-tenancy, POS Math, Inventory, Realtime, Hardware Transports.

---

## 1. Automated Test Suites & Coverage Inventory

```
Automated Test Coverage Overview:
├── apps/web/lib/
│   ├── bill.test.ts               # Billing arithmetic, split tenders, change calculation (9 tests)
│   ├── branch-state.test.ts       # Branch bootstrap & error resilience (4 tests)
│   ├── kds-station.test.ts        # KDS station selection & persistence (8 tests)
│   ├── kiosk-basket.test.ts       # Cart options, line merging, tax regime backout (7 tests)
│   ├── kiosk-flow.test.ts         # Flow steps, double-submit guard, idempotency retry (8 tests)
│   ├── kiosk-ticket.test.ts       # Ticket formatting, locale money, QR payload (3 tests)
│   ├── pos-drafts.test.ts         # Multi-table cart drafts isolation (6 tests)
│   ├── realtime-keys.test.ts      # WebSocket event-to-cache invalidation mapping (4 tests)
│   ├── route-access.test.ts       # RBAC URL access control & redirect logic (5 tests)
│   └── scan.test.ts               # Keyboard-wedge scanner CR/LF parsing (5 tests)
│       └── TOTAL FRONTEND TESTS: 59 PASSING (0 FAILING)
│
├── apps/backend/src/
│   ├── modules/orders/
│   │   ├── settlement.spec.ts     # Multi-tender billing, discount distribution, change (Jest)
│   │   ├── order-lifecycle.spec.ts# State transitions (OPEN -> PAID, cancel, refund) (Jest)
│   │   ├── receipt.html.spec.ts   # Browser HTML/CSS receipt layout and tax breakdown (Jest)
│   │   ├── escpos/encoder.spec.ts # ESC/POS binary command encoding, codepages, rulers (Jest)
│   │   ├── escpos-receipt.spec.ts # ESC/POS full job rendering, 58mm/80mm layouts, drawer kicks (Jest)
│   │   └── escpos-network.spec.ts # Raw TCP socket network thermal printing transport (Jest)
│   ├── modules/accounting/
│   │   ├── accounting.calc.spec.ts# Cash drawer reconciliation & float arithmetic (Jest)
│   │   ├── accounting.service.spec.ts # Shift closing & drawer vouchers (Jest)
│   │   └── ledger.service.spec.ts # Double-entry journal balances (debit == credit) (Jest)
│   ├── modules/inventory/
│   │   └── stock-plan.spec.ts     # Recipe ingredient deduction & FIFO batch planning (Jest)
│   ├── modules/hr/
│   │   └── payroll.calc.spec.ts   # Overtime, hourly wage, statutory deduction math (Jest)
│   ├── modules/marketing/
│   │   └── discounts.spec.ts      # Coupon codes, automatic happy hours, flat/% caps (Jest)
│   ├── modules/verifactu/
│   │   ├── verifactu.domain.spec.ts # SHA-256 huella chaining, XML canonicalization (Jest)
│   │   ├── verifactu.aeat.spec.ts # AEAT request envelopes and response parsers (Jest)
│   │   └── verifactu.mtls.spec.ts # Mutual TLS client certificate presentation (Jest)
│   ├── modules/webhooks/
│   │   ├── signing.spec.ts        # HMAC-SHA256 signature verification (Jest)
│   │   └── net-guard.spec.ts      # SSRF egress guard blocking private IP ranges (Jest)
│   ├── modules/reports/
│   │   ├── csv.spec.ts            # CSV formatting, escaping, injection guards (Jest)
│   │   └── report-schedules.service.spec.ts # Automated cron schedule triggers (Jest)
│   ├── auth/
│   │   ├── totp.spec.ts           # RFC 6238 TOTP window validation & backup codes (Jest)
│   │   └── two-factor.service.spec.ts # 2FA setup, challenge, verification (Jest)
│   ├── common/
│   │   ├── time.spec.ts           # Timezone calculations & business day boundaries (Jest)
│   │   └── guards/permissions-policy.spec.ts # Permission inheritance & policy matrix (Jest)
│   └── sync/
│       └── sync.service.spec.ts   # Two-way server sync conflict resolution (Jest)
│           └── TOTAL BACKEND TESTS: 215 PASSING (0 FAILING, 1 SKIPPED)
```

---

## 2. Test Execution Matrix by Domain

### 2.1 Multi-Tenant Isolation & IDOR Attacks

| Test Case ID | Test Scenario | Execution Method | Expected Result | Verified Status |
|---|---|---|---|---|
| SEC-TENANT-01 | User from Restaurant A attempts to read Modifier Groups from Restaurant B | Automated Integration | Returns `404 Not Found` or empty list | Verified |
| SEC-TENANT-02 | Unauthenticated Socket.IO connection attempts to join `branch:<branchId>` room | Automated Integration | Gateway rejects connection immediately with `io server disconnect` | Verified |
| SEC-TENANT-03 | User from Branch A attempts to checkout an order belonging to Branch B | Automated Integration | Returns `404 Not Found`; zero state change | Verified |
| SEC-TENANT-04 | User supplies `tableId` belonging to another restaurant during order creation | Automated Integration | Returns `400 Bad Request`; table rejected | Verified |

---

### 2.2 Concurrency & TOCTOU Race Guards

| Test Case ID | Test Scenario | Execution Method | Expected Result | Verified Status |
|---|---|---|---|---|
| RAC-CHECK-01 | 10 simultaneous checkout requests on the same OPEN order | Automated Concurrency Probe | Exactly 1 request returns `201 Created`; 9 return `409 Conflict`. Zero double-payment rows. | Verified |
| RAC-LOYAL-01 | 2 simultaneous checkouts redeeming the same customer's loyalty points balance | Automated Concurrency Probe | Atomic CAS decrements balance; second request gets `count === 0` and fails safely without overdraft. | Verified |
| RAC-STOCK-01 | 2 concurrent checkouts consuming the last available batch of an ingredient | Automated Concurrency Probe | Transaction takes `SELECT FOR UPDATE` lock; second checkout observes depleted stock and logs event. | Verified |
| RAC-REFUND-01 | 2 simultaneous refund requests on the same order | Automated Concurrency Probe | In-transaction row lock serializes refunds; total refund sum never exceeds order total. | Verified |

---

### 2.3 POS Arithmetic & Multi-Region Tax

| Test Case ID | Test Scenario | Execution Method | Expected Result | Verified Status |
|---|---|---|---|---|
| MATH-GST-01 | 100.00 INR item with 18% inclusive GST | Unit Test (`bill.test.ts`) | Subtotal = 84.75 INR, CGST (9%) = 7.63 INR, SGST (9%) = 7.63 INR. Total = 100.00 INR. | Verified |
| MATH-IVA-01 | 100.00 EUR item with 10% inclusive Spain IVA | Unit Test (`bill.test.ts`) | Subtotal = 90.91 EUR, IVA = 9.09 EUR. Total = 100.00 EUR. | Verified |
| MATH-DISC-01 | 20% discount applied to 100.00 tax-inclusive bill | Unit Test (`settlement.spec.ts`) | Subtotal = 80.00, discount = 20.00, tax recalculated pro-rata on 80.00 base. | Verified |
| MATH-SPLIT-01 | 150.00 bill paid 100.00 cash (with 120.00 tendered) + 50.00 card | Unit Test (`settlement.spec.ts`) | Cash applied = 100.00, change given = 20.00, card applied = 50.00, balance = 0.00. | Verified |

---

## 3. Physical Hardware & Manual Testing Protocols

### 3.1 Thermal Printer Testing Protocol (80mm & 58mm ESC/POS)
- **Applies to:** USB thermal printers, Ethernet/LAN thermal printers.
- **Physical Test Procedure:**
  1. Connect 80mm thermal printer (e.g. Epson TM-T88VI or Xprinter XP-N160I) via USB or Ethernet.
  2. In DaxabitHMS: **Settings → Printers → Print Test Slip**.
  3. **Inspection Checklist:**
     - [ ] Check column ruler: characters 1 to 48 fit cleanly on 80mm paper without trailing line wraps.
     - [ ] Check accented characters and currency symbols: confirm `€`, `£`, `Rs.` and accented glyphs (`ñ`, `é`) render without `?` placeholders.
     - [ ] Check paper cut command: printer performs a clean partial cut at the end of the slip.
     - [ ] Check barcode / QR code readability: scan printed QR code with a mobile camera; confirm URL decodes accurately.

---

### 3.2 Cash Drawer Kick Pulse Protocol
- **Applies to:** Standard 24V RJ11/RJ12 cash drawers connected to the thermal printer's DK port.
- **Physical Test Procedure:**
  1. Plug cash drawer cable into the printer's rear DK port.
  2. In DaxabitHMS: **Settings → Printers → Open Cash Drawer** (or settle an order with Cash tender).
  3. **Inspection Checklist:**
     - [ ] Drawer kicks open immediately on print start without solenoid hesitation.
     - [ ] Card and UPI payments do **not** kick the cash drawer.
     - [ ] "No Sale" manual drawer open records an entry in the Audit Log.

---

### 3.3 Barcode Scanner Keyboard-Wedge Protocol
- **Applies to:** USB handheld 1D/2D barcode scanners.
- **Physical Test Procedure:**
  1. Plug USB scanner into the POS terminal.
  2. Open the POS screen.
  3. Scan a physical product barcode without clicking the search input box.
  4. **Inspection Checklist:**
     - [ ] Scanner input is captured automatically by the keyboard-wedge listener.
     - [ ] The matching menu item is added to the cart, or a notification "Item not found" is displayed.
     - [ ] Trailing `\r\n` characters are consumed and do not submit open modal forms.

---

### 3.4 Windows Desktop Standalone Installation & Upgrade Protocol
- **Applies to:** Windows 10 (1809+) and Windows 11 PCs.
- **Physical Test Procedure:**
  1. Build package: `pwsh windows/msix/build-windows-msix.ps1 -IncludeEmbeddedServer`.
  2. Install on a clean Windows machine without Node or Postgres pre-installed.
  3. Launch DaxabitHMS from the Start Menu.
  4. Select "This PC is the main restaurant computer".
  5. **Inspection Checklist:**
     - [ ] Embedded PostgreSQL initializes in `%LOCALAPPDATA%\DaxabitHMS\pgdata` on port 5433 without requiring UAC administrator elevation.
     - [ ] NestJS backend and Next.js frontend boot and health checks return `200 OK`.
     - [ ] WebView2 loads `http://localhost:3000` with zero script errors.
     - [ ] Window close button minimizes the application to the Windows System Tray; secondary LAN devices remain able to connect.
     - [ ] Right-click System Tray icon → Exit cleanly terminates PostgreSQL, NestJS, and Next.js child process trees without orphaned zombie processes.
