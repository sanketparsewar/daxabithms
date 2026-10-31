# DaxabitHMS: Inventory Management & Recipe Costing Guide

This guide explains how to track raw food ingredients, manage supplier purchase orders, link recipes to menu items, and control food cost waste in **DaxabitHMS** (`/inventory`).

---

## 1. Inventory Architecture

Daxabit tracks stock at the ingredient level rather than the dish level:

```
┌─────────────────────────────────────────────────────────────┐
│                       RAW INGREDIENT                        │
│                     "Mozzarella Cheese"                     │
│  - Unit: kg                                                 │
│  - Cost/Unit: $8.50                                         │
│  - Current Stock: 14.5 kg                                   │
│  - Reorder Threshold: 5.0 kg                                │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
       (Automated Deduction)           (Stock Receiving)
               │                               │
               ▼                               │
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       POS MENU SALE         │ │       PURCHASE ORDER        │
│    "Margherita Pizza"       │ │      Supplier: Dairy Co     │
│   Deducts: 0.150 kg Cheese  │ │      Received: +20.0 kg     │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Managing Raw Ingredients (`/inventory`)

1. Navigate to **Inventory** (`/inventory`).
2. Click **Add Ingredient**:
   - **Ingredient Name**: e.g., *Basmati Rice*, *Chicken Breast*, *Cooking Oil*, *Coffee Beans*.
   - **Measurement Unit**: `kg`, `g`, `L`, `mL`, `piece`, `can`, `box`.
   - **Current Physical Stock**: Existing count in stock room.
   - **Reorder Level**: Minimum safety threshold. When stock falls below this level, Daxabit triggers a red **Low Stock Alert** on the Dashboard.
   - **Cost Per Unit**: Purchase price per unit for accurate cost of goods sold (COGS) reporting.
3. Click **Save Ingredient**.

---

## 3. Recipe Costing & Bill of Materials (BOM)

Linking recipes to menu items enables automated inventory deduction and precise gross margin calculation:

1. Navigate to **Menu** (`/menu`) and edit a dish.
2. Under **Recipe / Stock Deduction**:
   - Select raw ingredients and portion consumption.
   - *Example: Chicken Biryani Recipe*
     - Basmati Rice: `0.200 kg` ($0.40)
     - Raw Chicken: `0.300 kg` ($1.80)
     - Ghee / Spices: `0.050 kg` ($0.60)
3. Daxabit calculates the **Theoretical Plate Cost** (e.g. `$2.80`).
4. Comparing Plate Cost to Selling Price (e.g. `$14.00`) reveals your **Gross Profit Margin** (80%).
5. Whenever this dish is sold at the POS, the exact quantities deduct from current stock automatically.

---

## 4. Manual Stock Adjustments & Physical Audits

Discrepancies happen due to measuring variance or unrecorded kitchen tasting:
1. In the ingredient list, click **Adjust Stock**.
2. Select reason:
   - **Physical Count / Cycle Count Reconciliation**: Enter the exact count observed.
   - **Received Delivery Without PO**: Add stock received directly.
   - **Damaged / Expired**: Deduct damaged goods.
3. Daxabit logs the adjustment, user ID, timestamp, and adjustment quantity to the Audit Log.

---

## 5. Waste Logging & Spoilage Tracking (`/inventory/waste`)

Tracking food waste is essential for controlling restaurant operating costs:
1. Navigate to **Inventory ➔ Waste** (`/inventory/waste`).
2. Click **Log Waste**:
   - Select the ingredient or finished dish.
   - Enter quantity wasted (e.g. `2.5 kg`).
   - Select Reason: *Burned / Overcooked*, *Expired*, *Dropped*, *Customer Return*.
   - Enter optional kitchen notes.
3. Daxabit computes the financial cost of the waste and plots the **14-day Waste Cost Trend** on your main Dashboard.

---

## 6. Suppliers & Purchase Orders (`/inventory/purchase-orders`)

### Supplier Management
1. Navigate to **Inventory ➔ Suppliers** (`/inventory/suppliers`).
2. Add supplier company name, contact representative, phone, email, and GSTIN/Tax ID.

### Creating Purchase Orders (PO)
1. Navigate to **Inventory ➔ Purchase Orders**.
2. Click **Create Purchase Order**:
   - Select the vendor.
   - Add line items, expected delivery date, and agreed unit purchase prices.
   - Click **Issue PO** (prints or exports to PDF for emailing the vendor).
3. **Receiving Stock**:
   - When the delivery truck arrives, open the PO and click **Receive Goods**.
   - Enter verified received quantities.
   - Stock balances update automatically, and the invoice amount logs to Accounts Payable.

