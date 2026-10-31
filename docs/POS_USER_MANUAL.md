# DaxabitHMS: Point of Sale (POS) User Manual

This manual provides front-of-house staff (cashiers, waitstaff, and supervisors) with complete instructions for operating the **DaxabitHMS POS Terminal** (`/pos`).

---

## 1. POS Terminal Layout Overview

The POS terminal is optimized for speed, clarity, and error prevention:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Search Menu: / ]                       [Table: T-04] [Dine-In ▼]     │
├───────────────┬───────────────────────────────┬────────────────────────┤
│ CATEGORIES    │ PRODUCT GRID                  │ ORDER CART             │
│               │                               │                        │
│ • All Items   │ ┌───────────┐  ┌───────────┐  │ Table T-04 (Round 1)   │
│ • Starters    │ │ Paneer    │  │ Garlic    │  │ ─────────────────────  │
│ • Tandoor     │ │ Tikka     │  │ Naan      │  │ 2x Paneer Tikka $24.00 │
│ • Curries     │ │ $12.00    │  │ $3.50     │  │   - Spicy / Extra Mint │
│ • Breads      │ └───────────┘  └───────────┘  │ 3x Garlic Naan  $10.50 │
│ • Rice        │ ┌───────────┐  ┌───────────┐  │ ─────────────────────  │
│ • Drinks      │ │ Butter    │  │ Mango     │  │ Subtotal:       $34.50 │
│ • Desserts    │ │ Chicken   │  │ Lassi     │  │ Tax (5% GST):    $1.73 │
│               │ │ $14.50    │  │ $4.00     │  │ Total Due:      $36.23 │
│               │ └───────────┘  └───────────┘  │ [ Send to Kitchen: F8] │
│               │                               │ [ Pay / Checkout:  F2] │
├───────────────┴───────────────────────────────┴────────────────────────┤
│ Shortkeys: [/] Search  [F2] Checkout  [F8] Send KOT  [Esc] Clear       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Order Types: Dine-In, Takeaway, and Delivery

Switch order modes using the top tabs in the cart panel:

### A. Dine-In Orders
1. Select **Dine-In**.
2. Click **Select Table** (or click a table directly from the [Tables View](file:///d:/daxabithms/apps/web/app/(dashboard)/tables/page.tsx)).
3. Ring up items. The table number is permanently associated with the bill.

### B. Takeaway / Counter Pickup
1. Select **Takeaway**.
2. No table selection is required.
3. Enter optional customer name or phone number for pickup calling.

### C. Direct Delivery Orders
1. Select **Delivery**.
2. Enter **Delivery Address**, **Pincode**, and **Customer Phone Number**.
3. Optionally enter a scheduled delivery time.

---

## 3. Adding Items, Portions, and Modifiers

### Standard Items
- Tap an item tile once to add 1 quantity to the cart. Tap again to increment.
- Use the fast search bar (`/` key) to find any dish by typing 2 or 3 letters (e.g. `pan` for *Paneer Tikka*).

### Portions & Custom Sizing
- If an item offers portions (e.g. *Full / Half*), a modal immediately appears:
  - Tap **Full ($14.00)** or **Half ($8.00)**. The selected portion adds to the cart.

### Modifiers & Special Preparation Notes
- If an item has custom options, the modifier selector opens automatically:
  - Select required options (e.g., *Spice Level: Medium*).
  - Select optional add-ons (e.g., *Extra Cheese +$1.50*).
  - Tap **Confirm** to add.
  - Modifiers display neatly beneath the item name on both the screen and the printed kitchen ticket.

---

## 4. Sending Orders to the Kitchen (KOT)

1. Review the items in the cart panel.
2. Click **Send to Kitchen** (or press `F8` / `Ctrl + Enter`):
   - The order lines are dispatched to the **Kitchen Display System** (`/kds`).
   - If a kitchen thermal printer is configured, a Kitchen Order Ticket (KOT) prints automatically.
   - The table status changes to **Occupied (Blue)**.
   - The cart clears, ready for the next table order.

### Adding Rounds to an Open Table
- To add more food (e.g. second round of drinks or desserts):
  1. Select the same table (`T-04`).
  2. The POS detects the existing open bill.
  3. Add the new items.
  4. Click **Add to order & send to kitchen**:
     - Only the newly added items are sent to the kitchen as *Round 2*. Previous items are not re-sent.

---

## 5. Billing, Checkout & Payment Methods (`F2`)

When the customer requests the check:
1. Open the table and click **Checkout / Pay** (or press `F2`).
2. The **Checkout Panel** displays the complete bill breakdown:
   - Itemized lines and quantities
   - Net Subtotal
   - Itemized Taxes (CGST/SGST, VAT, or Sales Tax)
   - Final Total Amount

### Payment Method 1: Cash
1. Select **Cash**.
2. Enter the amount handed by the customer in **Amount Tendered** (or tap fast currency quick-cash chips: `$20`, `$50`, `$100`).
3. Daxabit immediately calculates and displays **Change Due**.
4. Click **Record Payment**. Cash drawer kicks open automatically via receipt printer pulse.

### Payment Method 2: Credit / Debit Card
1. Select **Card**.
2. Enter the amount to charge (defaults to full remaining balance).
3. Process payment on your card terminal / EDC machine.
4. Click **Record Payment**.

### Payment Method 3: Dynamic UPI QR Code
1. Select **UPI**.
2. Daxabit instantly generates a dynamic UPI QR code on the screen and on the customer-facing display.
3. The guest scans the QR with any UPI app (GPay, PhonePe, Paytm).
4. Verify the confirmation on your bank terminal or POS, then click **Record Payment**.

---

## 6. Split Bills & Partial Payments

Daxabit allows a single table bill to be split across multiple guests or payment methods:
- **Part Payment by Cash, Part by Card**:
  - Select Cash ➔ Enter `$20.00` ➔ Record.
  - System indicates: `Part payment of $20.00 recorded — $15.50 still due`.
  - Select Card ➔ Remaining balance of `$15.50` pre-fills ➔ Record.
  - Bill marks as **Fully Paid**.

---

## 7. Discounts, Vouchers & Customer Loyalty

1. **Manager Discounts**:
   - Authorized staff can enter a percentage discount (e.g. `10%`) or a fixed monetary discount.
   - Discounts calculate automatically before tax.
2. **Customer Loyalty Points**:
   - Look up customer by phone number.
   - Available points appear on screen. Click **Redeem Points** to apply the cash credit.
3. **Gift Cards**:
   - Enter the gift card code. Remaining card balance applies against the bill.

---

## 8. Printing Receipts, Reprints & Duplicates

- **Automatic Receipt**: Once settled, click **Print Receipt** (or thermal receipt prints automatically if configured).
- **Reprinting Receipts**:
  - If a guest requests a duplicate copy or paper jams:
  - Open **Orders ➔ History** (`/orders`).
  - Open the transaction and click **Reprint Receipt**.
  - Reprints automatically stamp **"DUPLICATE COPY"** with the reprint timestamp to prevent fraudulent double-claiming.

---

## 9. Fast POS Keyboard Shortcuts

| Shortcut | Function | Practical Use Case |
| :--- | :--- | :--- |
| `/` or `F3` | **Focus Search** | Fast lookup of dishes without touching mouse or touchscreen. |
| `F2` | **Checkout / Pay** | Instant transition from cart to payment method selection. |
| `F8` or `Ctrl + Enter`| **Send to Kitchen** | Dispatches current cart to cooks with zero mouse clicks. |
| `Escape` | **Cancel / Back** | Closes active pickers, clears search, or exits overlays. |
| `Enter` | **Confirm Selection**| Confirms active modal selection. |

