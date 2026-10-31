# Restaurant Owner Onboarding & Operations Guide

Welcome to **DaxabitHMS**, a modern, self-hosted Restaurant & Hotel Management System. This guide walks restaurant owners and managers through configuring their establishment from day one, setting up hardware, and running daily operations without requiring developer assistance.

---

## 1. Quick-Start Setup Checklist

When you first launch Daxabit and sign in as an Owner or Administrator, you are greeted with the **Onboarding Checklist** on your Dashboard. Follow these steps in order:

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. Business Profile ──▶ 2. Dining Floor ──▶ 3. Menu & Pricing        │
│          │                                          │                  │
│          ▼                                          ▼                  │
│  4. Hardware & Print ──▶ 5. Staff Accounts ──▶ 6. First POS Sale       │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Restaurant Profile & Regional Taxes (`/settings`)
1. Navigate to **Settings** (`/settings`).
2. Verify or update your **Restaurant Name**, **Legal Name**, and **Contact Phone**.
3. Upload your restaurant's logo (PNG or JPEG). It will automatically display on receipt headers, the customer-facing display, and the desktop navigation bar.
4. Set your **Branch Currency** (e.g. `USD`, `INR`, `EUR`, `GBP`).
5. Select your **Tax Regime & Mode**:
   - **India**: GST mode with standard CGST/SGST splitting. Enter your GSTIN.
   - **Spain**: VERI*FACTU mode with standard IVA rates and ticket chaining.
   - **United States / Canada / Other**: Standard inclusive or exclusive sales tax.
6. Click **Save Settings**.

---

### Step 2: Dining Floor Plan & Tables (`/tables`)
1. Navigate to **Tables** (`/tables`).
2. Click **Add Floor** to create your main dining zones (e.g., *Main Dining Room*, *Patio*, *Bar Counter*).
3. Click **Add Table** to create tables on each floor:
   - Assign a **Table Number** (e.g. `T-01`, `Bar-1`).
   - Set the **Seat Capacity** (e.g. `2`, `4`, `6`, `8` seats).
   - Select the shape (Square, Rectangle, or Round).
4. Tap **Edit Floor Plan** anytime to drag and arrange tables on the canvas to match your physical dining room layout. Table positions save automatically.

---

### Step 3: Menu Categories & Dishes (`/menu`)
1. Navigate to **Menu** (`/menu`).
2. Click **Add Category** to create your menu sections (e.g., *Starters*, *Main Course*, *Desserts*, *Beverages*).
3. Click **Add Item** to add dishes under each category:
   - **Name & Description**: e.g., *Paneer Tikka*, *Margherita Pizza*.
   - **Price & Tax Rate**: Base selling price and tax percentage.
   - **Portions**: Enable half-portion or custom sizing if applicable.
   - **Dietary Marker**: Check "Vegetarian" or leave unchecked for non-veg.
   - **Modifier Groups**: Attach customizations (e.g., *Spice Level: Mild / Medium / Hot*, *Extra Cheese*).
   - **Kitchen Prep Station**: Assign to *Grill*, *Hot Kitchen*, or *Bar* for specialized kitchen display routing.

---

### Step 4: Printers & Hardware Configuration (`/settings`)
Daxabit supports both direct **ESC/POS thermal printers** (USB and Network) and standard **Windows print spooler** printers.

1. Navigate to **Settings** and scroll to **Hardware & Receipt Printing**.
2. **Paper Width**: Select `58 mm` or `80 mm` thermal paper roll width.
3. **Connection Type**:
   - **USB**: For direct USB POS printers plugged into the terminal computer.
   - **Network**: For kitchen thermal printers connected over LAN (enter printer IP address and port `9100`).
   - **Browser / Windows Spooler**: Works out-of-the-box with any installed Windows or system printer.
4. Click **Print Test Receipt** or **Printer Diagnostics** to verify alignment, font rendering, and cash drawer kick-out pulses.

---

### Step 5: Team Accounts & Fast Terminal PINs (`/settings/staff`)
1. Navigate to **Settings → Staff** (`/settings/staff`).
2. Click **Add Staff** to create accounts for your team:
   - **Cashier**: Can operate POS, apply discounts, and record payments.
   - **Waitstaff**: Can take orders, add items to open tables, and request bills.
   - **Chef / Kitchen Staff**: Dedicated access to the Kitchen Display System (`/kds`).
   - **Store Manager**: Access to reporting, shift closings, and inventory adjustments.
3. **Set 4-Digit PINs**: Assign a 4-digit PIN to each staff member. Staff can quickly switch accounts on shared touchscreen terminals without retyping lengthy passwords.

---

### Step 6: Take Your First POS Test Order (`/pos`)
1. Navigate to **POS** (`/pos`).
2. Choose **Dine-in** and select an available table (e.g., `T-01`).
3. Click menu items to add them to the cart. Pick modifiers if prompted.
4. Click **Send to Kitchen** (or press `F8` / `Ctrl+Enter`):
   - The ticket appears instantly on the **Kitchen Display System** (`/kds`) with an audible chime.
5. In the cart panel, click **Checkout** (or press `F2`):
   - Select payment mode: **Cash**, **Card**, or **UPI QR**.
   - If Cash: Enter tendered amount; the system calculates exact change due.
   - Click **Record Payment** to finalize the order.
   - Click **Print Receipt** to issue the customer tax invoice.

---

## 2. Daily Operational Workflow

```
   ┌─────────────────────────────────────────────────────────┐
   │                    1. MORNING OPEN                      │
   │  - Manager logs in & checks Low Stock alerts            │
   │  - Open POS till & enter opening cash float             │
   └──────────────────────────┬──────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    2. LIVE SERVICE                      │
   │  - Waiters take orders on tablet or POS (/pos)          │
   │  - Kitchen prepares tickets via KDS (/kds)              │
   │  - Cashiers settle checks & print thermal slips         │
   │  - Online / QR orders reviewed on Orders (/orders)      │
   └──────────────────────────┬──────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    3. SHIFT / NIGHT CLOSE               │
   │  - Cashier counts till drawer at /accounting            │
   │  - System checks for cash overage or shortage           │
   │  - Print daily Z-report & review P&L / tax summaries    │
   │  - Automated database backup runs at midnight           │
   └─────────────────────────────────────────────────────────┘
```

---

## 3. High-Speed POS Keyboard Shortcuts

For high-volume front-of-house counters with physical keyboards:

| Key | Action | Description |
| :--- | :--- | :--- |
| `/` or `F3` | **Search Menu** | Instantly focuses the menu search bar to look up dishes by name. |
| `F2` | **Checkout / Pay** | Opens the payment panel or tenders the active bill. |
| `F8` or `Ctrl + Enter` | **Send to Kitchen** | Dispatches current cart items to the KDS kitchen line. |
| `Escape` | **Clear / Cancel** | Clears the active search query, closes pickers, or dismisses dialogs. |

---

## 4. Kitchen Display System (KDS) Operation

Kitchen staff use the screen at `/kds`:
- **New Tickets**: High-priority tickets arriving from POS, QR code ordering, or online kiosks.
- **Audible Alerts**: Built-in sound chimes trigger when new orders are placed.
- **Stage Progression**: Cooks tap cards to advance items: `New` ➔ `Accepted` ➔ `Preparing` ➔ `Ready`.
- **Prep Stations**: Kitchens with multiple stations (e.g. *Hot Kitchen*, *Cold Pantry*, *Bar*) can filter tickets by station using the top station chips.

---

## 5. End-of-Day Till Reconciliation & Reports

1. Navigate to **Accounting** (`/accounting`) and select the **Cash Close** tab.
2. Enter the **Opening Float** and the **Physical Counted Cash** in the till drawer.
3. The system compares the physical cash against recorded cash sales and expenses paid from the register.
4. If an overage or shortage exists, enter an explanatory note.
5. Click **Close Register & Record Shift**:
   - The register closes securely and logs the cashier's user ID and timestamp.
6. Navigate to **Reports** (`/reports`) to print or export:
   - **Sales Summary by Payment Mode** (Cash, Card, UPI).
   - **Tax Collected Summary** (for monthly VAT/GST filing).
   - **Item Sales & Category Performance**.
   - Export formats: **Excel (.xlsx)**, **PDF**, or **CSV**.

---

## 6. Access Control & Role Permissions

| Role | Permitted Areas | Restricted Areas |
| :--- | :--- | :--- |
| **Owner / Administrator** | Full access to all screens, settings, financial reports, and backups. | None |
| **Store / General Manager** | Dashboard, POS, KDS, Tables, Inventory, Accounting, Reports, Staff PINs. | Server sync & API keys |
| **Cashier** | POS, Tables, Orders, Basic Receipt Printing, Till Reconciliation. | System settings, user deletion, raw tax regime edits |
| **Waitstaff** | POS (order entry), Tables (seating & bill requests). | Financial ledgers, reports, staff admin |
| **Kitchen Staff (Cook/Chef)**| KDS (Kitchen Display System tickets & order acceptance). | Billing, cash till, user settings |

If a team member attempts to open a restricted URL directly, Daxabit displays a clear **Access Restricted** screen with a single click to return to their permitted workspace.

---

## 7. Troubleshooting & Common Questions

### Q: What if the internet goes down during service?
> **Answer**: Daxabit is fully self-hosted on your local computer or LAN server. Local POS billing, table ordering, KDS tickets, and receipt printing continue working seamlessly without any active internet connection.

### Q: What if an order is entered incorrectly?
> **Answer**: Managers and cashiers can open the order from `/orders` or the table tile to modify items, apply manager discounts, or cancel the order before settlement. All edits are logged in the tamper-proof Audit Log (`/settings/audit-log`).

### Q: How do we back up our restaurant data?
> **Answer**: Daxabit runs automated daily database backups. You can also trigger an instant manual backup anytime under **Settings → Backup** (`/settings/backup`) and download an encrypted backup archive to a safe USB drive.

