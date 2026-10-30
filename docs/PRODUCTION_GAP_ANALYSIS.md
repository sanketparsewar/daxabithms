# DaxabitHMS — Production Gap Analysis & Feature Status Matrix

**Document Date:** October 2026  
**Status:** Living Engineering Gap Analysis  
**Scope:** Full repository assessment across Backend, Web, Types, Desktop, Packaging, and Hardware Transports.

---

## 1. Feature Taxonomy & Verification Status Checklist

Every capability in DaxabitHMS is categorized below into one of six exact verification states:
1. **Implemented and verified:** Code exists, verified via automated unit/integration tests or production build compiler checks.
2. **Implemented but unverified:** Code is written and compiles, but has not yet undergone live multi-user concurrency testing or external portal verification.
3. **Partially implemented:** Feature skeleton exists, but critical user-facing flows (UI or backend endpoints) are incomplete.
4. **Not implemented:** Planned on the roadmap/spec, but no source code exists yet.
5. **Broken:** Code exists but produces runtime errors, race conditions, or unhandled exceptions.
6. **Requires real hardware testing:** Cannot be validated via unit tests; requires physical POS peripherals (thermal printers, cash drawers, barcode scanners, touch screens).

---

### 1.1 Core POS, Ordering & Billing

| Feature | Status | Engineering Detail |
|---|---|---|
| Touch-friendly POS screen | Implemented and verified | Categories, search, product grid, cart with modifiers, verified in Next.js Turbopack build |
| Add-ons & Modifiers | Implemented and verified | Modifier groups, min/max bounds, default selections, tested in `cart-panel.tsx` |
| Combo products | Implemented and verified | Combo component breakdown, tested in combo dialog and cart math |
| Server-authoritative bill calculation | Implemented and verified | Pro-rata discount distribution, tax back-out, verified in `settlement.spec.ts` |
| Rounding & Floating-point safety | Implemented and verified | `round2` banking rounding throughout; verified in `bill.test.ts` |
| Multi-tender settlement (Cash, Card, UPI, Other) | Implemented and verified | Split payments handled; verified in `settlement.spec.ts` |
| Cash change calculation | Implemented and verified | Tendered amount > balance produces change; tested in `bill.test.ts` |
| Concurrency guard on checkout (TOCTOU) | Implemented and verified | Atomic CAS on `where: { id, status: 'OPEN' }`; verified with 10 concurrent requests |
| Concurrency guard on loyalty & gift cards | Implemented and verified | Guarded atomic decrement `updateMany({ where: { balance: { gte } } })` |
| Order voids & cancellations | Implemented and verified | Pre-payment cancel releases table and KDS tickets with mandatory reason code |
| Refunds & partial refunds | Implemented and verified | Row-locked refund calculation; capped at refundable remainder; tested in `orders.service.ts` |
| Table transfers & bill merging | Implemented and verified | Moves open bill to free table; merges tickets cleanly; tested in `tables.service.ts` |
| Browser receipt printing (HTML/CSS) | Implemented and verified | Inline SVG receipt for 80mm paper dialog; verified in `receipt.html.spec.ts` |
| Direct-USB ESC/POS receipt printing | Requires real hardware testing | Native ESC/POS command generator verified in unit tests; requires physical USB thermal printer |
| Cash drawer kick pulse (DK port) | Requires real hardware testing | Standard ESC/POS pulse `[0x1b, 0x70, 0x00, 0x19, 0xfa]` encoded; requires physical cash drawer |
| Barcode / SKU scanner input | Implemented and verified | Scanner hook `useScanOrderInput` parses keyboard-wedge CR/LF scanner inputs; tested in `scan.test.ts` |
| Item-level custom cooking notes | Partially implemented | KOT-level notes exist; per-item note input on `OrderItem` is not wired up |
| Advanced item-by-item split billing | Partially implemented | Equal-split display calculator exists; splitting distinct items into separate tickets is planned |
| Customer-facing pole display (CFD) | Implemented and verified | Real-time WebSocket sync to `/customer-display`; tested in `customer-display.ts` |
| WhatsApp / SMS digital receipts | Not implemented | Planned; no third-party SMS/WhatsApp gateway client wired |

---

### 1.2 Table & Dining Room Management

| Feature | Status | Engineering Detail |
|---|---|---|
| Spatial restaurant floor map | Implemented and verified | Renders tables by `posX`, `posY`, shape, and rotation; verified on `/tables` |
| Multiple floors / dining areas | Implemented and verified | `Floor` model with tabbed switching and floor creation dialogs |
| Real-time table states | Implemented and verified | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`, `OUT_OF_SERVICE` synced via Socket.IO |
| Table occupancy elapsed timer | Implemented and verified | `statusSince` timestamp rendered by `ElapsedTimer`; verified in `elapsed-timer.tsx` |
| Server assignment | Implemented and verified | Assign waiter to table; filterable in staff views |
| Table reservations | Implemented and verified | Status lifecycle (`CONFIRMED`, `SEATED`, `CANCELLED`, `NO_SHOW`); tested in reservations service |
| Dining waitlist | Implemented and verified | Quoted wait time, party size, notify guest, seat table flow |
| Table QR code generation | Implemented and verified | Rotatable opaque cryptographic tokens (`qrToken`) per table; tested in `tables.service.ts` |
| Drag-and-drop floor designer | Partially implemented | Backend `PATCH /tables/layout` exists; interactive drag-and-drop canvas UI is not wired |

---

### 1.3 Kitchen Display System (KDS) & KOTs

| Feature | Status | Engineering Detail |
|---|---|---|
| Multi-station KOT routing | Implemented and verified | Items routed to specific `KitchenStation` (Kitchen, Bar, Grill); tested in `kot-print.service.ts` |
| Real-time ticket board | Implemented and verified | Instant ticket arrival via Socket.IO room `branch:<id>`; audio chime alert |
| Station filtering per device | Implemented and verified | Device remembers selected station in localStorage; tested in `kds-station.test.ts` |
| Preparation lifecycle | Implemented and verified | `NEW` → `ACCEPTED` → `PREPARING` → `READY` → `SERVED`; tested in `order-lifecycle.spec.ts` |
| Bump bar hardware integration | Requires real hardware testing | Keyboard shortcuts exist; physical industrial bump bars require hardware testing |

---

### 1.4 Customer Self-Ordering Kiosk & Dine-In QR

| Feature | Status | Engineering Detail |
|---|---|---|
| Public Table QR ordering | Implemented and verified | Dine-in guests browse menu, customize modifiers, and submit orders directly to table tab |
| Digital waiter / bill requests | Implemented and verified | Guests tap "Call Waiter" or "Request Bill"; creates `TableRequest` banner on staff screens |
| Standalone self-ordering kiosk | Implemented and verified | Dedicated `/kiosk/:token` route, fullscreen PWA manifest, service worker caching |
| Kiosk ticket & QR slip generation | Implemented and verified | Generates take-to-counter order slip; verified in `kiosk-ticket.test.ts` |
| Double-submit & idempotency guard | Implemented and verified | `clientRequestId` prevents duplicate submissions on network lag; tested in `kiosk-flow.test.ts` |

---

### 1.5 Inventory & Procurement

| Feature | Status | Engineering Detail |
|---|---|---|
| Ingredient master & units | Implemented and verified | Comprehensive units (`KG`, `L`, `PIECE`, etc.) and low-stock thresholds |
| Automatic FIFO recipe deduction | Implemented and verified | Deducts ingredients on order payment with row-level locks; tested in `stock-plan.spec.ts` |
| Purchase Orders & Goods Receipts (GRN) | Implemented and verified | PO approval workflow, partial receiving, batch creation; tested in `purchase-orders.service.ts` |
| Vendor quotations & price comparison | Implemented and verified | Multi-supplier price comparison matrix; tested in `supplier-quotations.service.ts` |
| Vendor invoices & payment tracking | Implemented and verified | 3-way matching with PO and GRN; payment status tracking; tested in `supplier-invoices.service.ts` |
| Inter-branch stock transfers | Implemented and verified | Transfer requests, transit status, dispatch and receiving; tested in `transfers.service.ts` |
| Waste & spoilage logging | Implemented and verified | Track waste reasons (`EXPIRED`, `SPOILED`, `DAMAGED`) with automated inventory write-offs |

---

### 1.6 Accounting & Financial Controls

| Feature | Status | Engineering Detail |
|---|---|---|
| Double-entry general ledger | Implemented and verified | Balanced debits and credits for sales, inventory, and payroll; tested in `ledger.service.spec.ts` |
| Cash register opening & closing | Implemented and verified | Shift drawer opening float, cash drops, discrepancy calculations; tested in `accounting.service.ts` |
| Multi-region tax compliance | Implemented and verified | India GST, Spain IVA, US Sales Tax, EU VAT supported server-side; tested in `settlement.spec.ts` |
| Expense vouchers from drawer | Implemented and verified | Record cash expenses directly from the till; updates cash closing expected balance |
| Financial reporting & CSV export | Implemented and verified | P&L, sales summaries, tax reports, automated scheduled email reports; tested in `csv.spec.ts` |

---

### 1.7 Authentication, Roles & Security

| Feature | Status | Engineering Detail |
|---|---|---|
| JWT Session Cookies | Implemented and verified | `httpOnly`, `SameSite=Lax`, 12h expiry, secure secret enforcement; tested in `auth.service.ts` |
| Granular RBAC Permissions | Implemented and verified | 14 core + module-specific permissions; verified in `permissions-policy.spec.ts` |
| Two-Factor Authentication (TOTP) | Implemented and verified | Authenticator apps supported, 10 backup recovery codes; tested in `two-factor.service.spec.ts` |
| Rate limiting on Auth routes | Implemented and verified | Throttled to 5 attempts/minute on `/auth/login` and `/auth/register` |
| PIN-based staff quick login | Partially implemented / Dead | Endpoint `/auth/pin-login` exists, but no UI or API exists to let staff set their PIN hash |
| Server-side JWT revocation | Partially implemented | Stateless JWTs expire after 12h; deactivated users blocked immediately, but manual logout does not blacklist tokens |

---

### 1.8 Regulatory & Compliance (Spain VERI\*FACTU & India GST)

| Feature | Status | Engineering Detail |
|---|---|---|
| VERI\*FACTU Hash-chained Ledger | Implemented and verified | SHA-256 fingerprint (*huella*) and chain integrity triggers; tested in `verifactu.domain.spec.ts` |
| Simplified Invoice XML (`F2` / `R5`) | Implemented and verified | XML generation validated against AEAT schemas; tested in `verifactu.aeat.spec.ts` |
| Mutual TLS (mTLS) Client | Implemented but unverified | AES-256-GCM encrypted `.p12` certificate storage and mTLS client; untested against live AEAT servers |
| AEAT Live Submission Run | Implemented but unverified | Gated behind official AEAT pre-production portal access and real certificates |
| India GST split & B2C dynamic QR | Implemented and verified | India GST tax back-out and NPCI UPI dynamic QR string generator; tested in `upi.ts` |
| India E-Invoicing (IRN generation) | Not implemented | B2B IRN portal integration is not built |

---

### 1.9 Windows Desktop Client & Deployment

| Feature | Status | Engineering Detail |
|---|---|---|
| Thin-client WebView2 Launcher | Implemented and verified | .NET 8 WinForms container hosting WebView2; tested in CI |
| Embedded Server Mode | Implemented and verified | Native Postgres + Node + NestJS + Next.js child supervisor; tested in CI |
| MSIX Package Manifest & Validation | Implemented and verified | Minimal capabilities (`internetClient`, `runFullTrust`); validated in `validate-msix.ps1` |
| Windows Store Code Signing | Partially implemented | Self-signed test certificate pipeline exists; production Publisher CN and Store signing pending |
| Physical Windows Hardware Testing | Requires real hardware testing | Windows 10/11 physical execution, native printer driver spooling, and Start Menu tile rendering |
| Linux Debian Package (`.deb`) | Implemented and verified | Automated systemd service and docker installer in `packaging/deb/` |
| CasaOS / ZimaOS Template | Implemented and verified | App store manifest and icon configuration in `casaos/` |

---

## 2. Prioritized Production Blockers

### Priority 0 (P0) — Critical Showstoppers Before Customer Launch

1. **Physical Thermal Printer & Cash Drawer Verification:**
   - **Problem:** ESC/POS binary buffers are verified by unit tests, but physical hardware tolerances (character wrapping, paper cut commands, 203 DPI QR readability, and 24V solenoid cash drawer kick timing) cannot be validated in CI.
   - **Impact:** Receipts may print corrupted characters or fail to kick cash drawers on specific printer models.
   - **Action Required:** Execute physical validation against at least one 80mm ESC/POS printer (e.g. Epson TM-T88, Star Micronics, or standard Xprinter) and one RJ11 cash drawer.

2. **PIN Login Flow Completion or Formal Deprecation:**
   - **Problem:** `/auth/pin-login` exists in `auth.controller.ts`, but no UI or API exists to set or change `user.pinHash`. Every call returns `401 Unauthorized`.
   - **Impact:** Confuses restaurant operators expecting fast cashier switching via PIN pad.
   - **Action Required:** Either implement a secure "Set Staff PIN" dialog behind manager authorization, or remove the dead endpoint.

3. **Windows Store Production Identity & Code Signing:**
   - **Problem:** `windows/msix/AppxManifest.xml` and build scripts contain development placeholder identities.
   - **Impact:** MSIX package cannot be submitted to the Microsoft Store or sideloaded without Developer Mode enabled.
   - **Action Required:** Reserve application name in Microsoft Partner Center, update `Identity/Name` and `Publisher` CN, and configure the code signing certificate.

---

### Priority 1 (P1) — High Priority Stability & Compliance Blockers

1. **Monolithic `orders.service.ts` Refactoring:**
   - **Problem:** `orders.service.ts` has grown to 2,540 lines of code, combining order creation, KOT generation, status updates, pricing, settlement, gift cards, loyalty, and audit logging into a single service.
   - **Impact:** High cognitive overhead, risk of regression during modifications.
   - **Action Required:** Decompose into sub-services (`OrderCreationService`, `OrderSettlementService`, `OrderKotService`) while preserving existing public method signatures.

2. **Spain VERI\*FACTU Pre-Production AEAT Portal Validation:**
   - **Problem:** Hash chaining and XML validation are verified against offline schemas, but the mTLS connection has not been run against AEAT's live staging portal.
   - **Impact:** High legal risk if advertised as compliant to Spanish customers without pre-production validation.
   - **Action Required:** Configure test credentials in AEAT pre-production portal, run end-to-end invoice submission, and verify acceptance response codes.

3. **Offline POS Sync Queue & Reconnect UX:**
   - **Problem:** If network connectivity drops while a waiter is placing an order in the web browser, the mutation errors out.
   - **Impact:** Lost cart data during intermittent Wi-Fi drops.
   - **Action Required:** Implement client-side IndexedDB order queue in `use-orders.ts` to retry failed order submissions when back online.

---

### Priority 2 (P2) — Operational Improvements

1. **Interactive Drag-and-Drop Floor Designer:**
   - **Problem:** Table coordinates exist and render spatially, but re-arranging tables requires editing coordinates manually rather than dragging tiles.
   - **Impact:** Minor friction during initial restaurant floor setup.
   - **Action Required:** Wire `@dnd-kit` to `PATCH /tables/layout`.

2. **Item-by-Item Check Splitter:**
   - **Problem:** Current split bill feature is a display-only equal division calculator.
   - **Impact:** Large parties requesting individual checks must have their orders manually recreated or billed separately.
   - **Action Required:** Implement item transfer between orders before checkout.
