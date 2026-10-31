# DaxabitHMS — Network Resilience, Idempotency & Offline Operations

This document outlines the architectural strategy and concrete mechanisms that ensure DaxabitHMS continues uninterrupted restaurant operations during internet (WAN) outages, local network packet loss, server restarts, and staff terminal reconnections.

---

## 1. The Core Principle: Zero WAN Dependence

> [!IMPORTANT]
> **Internet disconnection must NEVER stop a healthy local restaurant server.**

In hospitality environments, broadband and fiber connections frequently experience temporary drops, ISP maintenance, or router resets during busy meal services. DaxabitHMS is engineered so that **100% of core operations are self-contained on the local premises**:

```
                       ┌───────────────────────────────┐
                       │     Public Internet (WAN)     │
                       │          [ DOWN / CUT ]       │
                       └───────────────┬───────────────┘
                                       │ (No traffic needed for dining)
               ════════════════════════╪════════════════════════
                             RESTAURANT LOCAL LAN
               ════════════════════════╪════════════════════════
                                       │
                        ┌──────────────┴──────────────┐
                        │    Local Wi-Fi / Router     │
                        │        (192.168.1.1)        │
                        └──────────────┬──────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
     ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
     │ Waiter iPad        │ │ Cashier Terminal   │ │ Kitchen KDS Screen │
     │ (192.168.1.105)    │ │ (192.168.1.102)    │ │ (192.168.1.110)    │
     └──────────┬─────────┘ └──────────┬─────────┘ └──────────┬─────────┘
                │                      │                      │
                └──────────────────────┼──────────────────────┘
                                       │ Local HTTP & Socket.IO (:1995)
                                       ▼
                        ┌─────────────────────────────┐
                        │   DaxabitHMS Local Server   │
                        │       (192.168.1.100)       │
                        │                             │
                        │  • Web Standalone (:1995)   │
                        │  • NestJS Core (:4001)      │
                        │  • Local PostgreSQL (:55432)│
                        │  • ESC/POS Receipt Engine   │
                        └─────────────────────────────┘
```

### Self-Contained Local Operations:
1. **Catalog & Menus:** Categories, items, modifier groups, and recipes load from the local database.
2. **Order Taking & KOT:** Table orders and kitchen order tickets fire instantly across the local LAN without touching the internet.
3. **Receipt & Ticket Printing:** 80mm ESC/POS printers connect over the local network (TCP 9100) or USB without cloud print spoolers.
4. **Cash & Card Terminal Settlements:** Cash drawer opening and manual/standalone card terminal reconciliation execute locally.
5. **No External CDN Dependencies:** All JavaScript bundles, stylesheets, icons (`lucide-react`), and fonts are pre-compiled and served directly from the local server's standalone Next.js instance.

---

## 2. Idempotency & Preventing Duplicate Transactions

When Wi-Fi fluctuates or a staff member taps a button repeatedly during a momentary delay, the system must guarantee that **no order is duplicated and no payment is double-charged**.

### 2.1 Idempotent Order Creation
- **Mechanism:** The order creation payload supports a unique `clientRequestId`.
- **Database Index:** `@@unique([branchId, clientRequestId])` in the PostgreSQL schema.
- **Behavior:**
  - When an order request arrives, `OrdersService.createOrder` checks if an order with that `(branchId, clientRequestId)` already exists.
  - If a match is found (e.g. from a retransmitted packet), the server **replays the existing committed order** rather than creating a second ticket.
  - If concurrent requests hit the server simultaneously, PostgreSQL's unique constraint catches the race condition (`P2002`), ensuring exactly one order is written to disk.

### 2.2 Idempotent Payment Settlement
- **Mechanism:** Checkout requests carry a client-generated `requestId`.
- **Database Index:** `@@unique([orderId, clientRequestId])` in the `payments` table.
- **Behavior:**
  - If a cashier double-taps "Confirm Payment" or the terminal retries due to network jitter, `OrdersService.checkout` detects the existing payment row:
    ```typescript
    if (dto.requestId) {
      const replay = order.payments.some((p) => p.clientRequestId === dto.requestId);
      if (replay) return this.checkoutResult(branchId, orderId);
    }
    ```
  - The server immediately returns the confirmed settlement result.
  - **Zero duplicate payment rows are recorded**, and the customer's card/cash balance is protected against double-charging.

---

## 3. Realtime Connection Status & Visual Warnings

Staff must always know the precise connection state of their terminal.

### 3.1 Connection Status Pill (`ConnectionStatusBadge`)
Mounted in the dashboard topbar across all pages:
- **Online (Green):** Active Socket.IO push connection to the local server. Instant KDS and table synchronization.
- **Reconnecting (Amber with spinner):** Terminal is reconnecting after waking from sleep or crossing Wi-Fi access points.
- **Offline (Red with icon):** Local server is unreachable.

### 3.2 High-Visibility Disconnection Alert (`OfflineBanner`)
When a staff device drops off the local Wi-Fi, a persistent amber/red alert banner appears at the top of the interface:
> **⚠️ Server Disconnected:** Cannot communicate with the local DaxabitHMS server. Please verify this device is connected to the restaurant Wi-Fi. (Auto-retrying...)

---

## 4. The Authoritative Server vs. Disconnected Browsers

> [!CAUTION]
> **Never pretend that a disconnected browser can safely perform authoritative billing without a functioning server.**

Some POS marketing materials claim "100% offline browser mode" where cashiers continue charging guests on laptops while the server machine is completely turned off. In a real restaurant, this causes catastrophic business failures:
1. **Inventory Corruption:** Two waitstaff in different dining areas sell the last 3 portions of dry-aged steak simultaneously because neither browser knows what the other is doing.
2. **Fiscal Law Non-Compliance:** Regulations like Spain's **Veri\*Factu** require strict sequential, tamper-evident chaining (`Record N+1` must hash `Record N`). Independent offline browsers generate conflicting chains that are legally invalid and subject to fines.
3. **Table Collisions:** Table 4 is marked vacant on one phone and occupied on another, resulting in double-booked guests.
4. **Cash Reconciliation Gaps:** Shift closings cannot balance cash drawers against orders stored only in browser local storage.

### The DaxabitHMS Architecture:
- The **Local Server** (installed on the restaurant's primary machine) is the single authoritative source of truth.
- If the outside internet is severed, the local server **keeps running at full speed**.
- If a tablet moves out of Wi-Fi range, its UI displays the red **Offline** indicator and blocks checkout until the tablet re-establishes contact with the local server.
- Upon reconnection, TanStack Query cache automatically invalidates and refetches the latest table states and orders.

---

## 5. Desktop Client Automatic Reconnect (WinForms + WebView2)

The Windows Desktop client ([`MainForm.cs`](file:///D:/daxabithms/windows/msix/Launcher/MainForm.cs)) handles network hiccups automatically:
1. **Health Probe:** Polls `http://127.0.0.1:1995/api/health` every 5 seconds when the connection drops.
2. **Connection Error Screen:** Displays server address, diagnostic details, and a manual **Reconnect Now (`Ctrl+R`)** button.
3. **Seamless Resume:** As soon as the server answers the health probe, the error screen automatically transitions back to the active POS view without requiring the application to be restarted.

---

## 6. Temporary Database Unavailability & Server Restarts

1. **PostgreSQL Restarts:** If the local database restarts (e.g. system update), Prisma client automatically reconnects on subsequent queries.
2. **Crash Resilience:** In-flight transactions are protected by PostgreSQL ACID guarantees. Uncommitted transactions roll back cleanly; committed orders remain permanently on disk.
3. **Windows Service Supervision:** The `DaxabitHMSServer` service is configured with `Restart-Service` failure actions in the Service Control Manager (SCM), automatically reviving the application server within 5 seconds of an unexpected failure.

