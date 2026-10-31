# DaxabitHMS: Kitchen Display System (KDS) User Manual

This manual guides kitchen managers, chefs, station line cooks, and expeditors on using the **DaxabitHMS Kitchen Display System** (`/kds`).

---

## 1. Kitchen Display Architecture

Daxabit replaces paper kitchen chits with digital touchscreen boards mounted in cooking lines:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Live KDS: Main Kitchen]  [Sound Alert: ON 🔔]  [Active Tickets: 8]   │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ NEW (2)         │ ACCEPTED (3)     │ PREPARING (2)   │ READY (1)       │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ ┌─────────────┐ │ ┌──────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │
│ │#104 - T-02  │ │ │#101 - T-05   │ │ │#099 - Take  │ │ │#098 - T-01  │ │
│ │Time: 01:15  │ │ │Time: 08:30   │ │ │Time: 14:20  │ │ │Time: 19:40  │ │
│ │─────────────│ │ │──────────────│ │ │─────────────│ │ │─────────────│ │
│ │2x Butter    │ │ │1x Tandoori   │ │ │1x Biryani   │ │ │1x Dal Makhni│ │
│ │   Chicken   │ │   Chicken (Med)│ │   (Full)      │ │   (Ready!)    │ │
│ │4x Roti      │ │ │2x Garlic Naan│ │ │1x Raita     │ │ └─────────────┘ │
│ └─────────────┘ │ └──────────────┘ │ └─────────────┘ │                 │
│ [Accept: Tap]   │ [Start Cooking]  │ [Mark Ready]    │ [Serve: Tap]    │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

---

## 2. Audio Chime Alerts & Initial Sound Unlock

1. Open `/kds` on your kitchen tablet or wall monitor.
2. **Audio Permission**: Modern browsers require one initial screen interaction to play audio. Tap anywhere on the screen upon loading. A brief pleasant chime confirms audio is unlocked.
3. **Audible KOT Chime**: Whenever a new order is sent from any POS terminal, QR code menu, or kiosk, a distinct chime rings throughout the kitchen to alert cooks immediately.

---

## 3. Station Filtering & Multi-Station Routing

In larger kitchens with specialized stations:
- Use the **Station Chips** at the top of the KDS:
  - `All Stations`: Expeditor / Head Chef overview.
  - `Hot Kitchen`: Curries, gravies, rice, pans.
  - `Tandoor / Grill`: Kebabs, tikkas, naans, rotis.
  - `Cold Pantry`: Salads, appetizers, desserts.
  - `Bar`: Cocktails, beers, soft drinks.
- **Device Memory**: When you select a station on a physical screen (e.g. tablet mounted at the grill), Daxabit remembers that choice on that device even if the browser is closed or refreshed.

---

## 4. Ticket Lifecycle Stages

Cooks advance tickets with a single tap on the screen:

| Stage | Color | Meaning | Action to Progress |
| :--- | :--- | :--- | :--- |
| **NEW** | 🔵 **Blue** | Just arrived from POS / Online | Tap card or click **Accept** to acknowledge. |
| **ACCEPTED** | 🟡 **Amber** | Order acknowledged by kitchen | Tap **Start Preparing** when cook begins dish. |
| **PREPARING** | 🟠 **Orange** | Actively on stove / grill / oven | Tap **Mark Ready** when cooking completes. |
| **READY** | 🟢 **Green** | Plated and on the pass | Food runner or waiter collects food; tap **Serve**. |

---

## 5. Prep Timer & Delay Warnings

Each ticket tracks elapsed time since order creation:
- 🟢 **Under 10 Minutes**: Standard preparation pace.
- 🟡 **10 to 18 Minutes**: Elevated prep time warning.
- 🔴 **Over 20 Minutes**: Delayed ticket alert. The header flashes red to notify expeditors to expedite the order.

---

## 6. Managing Incoming Online & Self-Serve Orders

When customers place orders via **Table QR Code** or **Self-Ordering Kiosk**:
1. If branch settings require manual confirmation, the ticket appears in the **Incoming Decision Banner** at the top of the KDS.
2. The card displays the items, table or takeaway mode, and timestamp.
3. Tap **Accept Order** to push it into the active cooking line, or tap **Decline / Reject** if the kitchen is at full capacity or an ingredient is out of stock.

---

## 7. Kitchen Thermal Ticket Printing (Hardware Fallback)

For kitchens preferring paper tickets alongside the KDS:
1. Connect a 80mm ESC/POS thermal printer over LAN or USB.
2. In **Settings ➔ Hardware**, configure the kitchen printer IP.
3. When waiters press **Send to Kitchen**, a paper KOT prints with:
   - Order number and Table number
   - Waiter name and timestamp
   - High-contrast bold item names and quantities
   - Highlighted modifier notes (e.g. *NO ONION / NO GARLIC*)
   - Bottom tear-off perforation

