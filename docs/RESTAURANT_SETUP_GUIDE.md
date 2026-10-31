# DaxabitHMS: Restaurant Setup & Configuration Guide

This guide details how restaurant owners and general managers configure their establishment, tax regimes, multi-branch operations, and floor plans in **DaxabitHMS**.

---

## 1. Restaurant Hierarchy & Multi-Branch Architecture

DaxabitHMS is organized into a clean multi-branch model:

```
                  ┌───────────────────────────────┐
                  │          RESTAURANT           │
                  │   Legal Entity, Master Brand  │
                  └──────────────┬────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│        BRANCH 1: MAIN         │       │       BRANCH 2: EXPRESS       │
│  - Unique tax regime (GST)    │       │  - Separate menu pricing      │
│  - Dedicated floor plans      │       │  - Dedicated staff & printers │
│  - Local receipt printers     │       │  - Separate till & cash drawer│
└───────────────────────────────┘       └───────────────────────────────┘
```

1. **Restaurant**: The top-level company/legal entity (e.g., *Saffron Hospitality Group LLC*). Defines common brand assets, master currency, and company logo.
2. **Branch**: An individual physical dining outlet, food truck, or ghost kitchen (e.g., *Downtown Flagship*, *Airport Kiosk*). Each branch maintains its own floors, tables, staff assignments, inventory warehouses, and tax identification numbers.

---

## 2. Business Profile Configuration (`/settings`)

Navigate to **Settings** (`/settings`):

### General Profile
- **Restaurant Name**: The customer-facing trade name displayed on bills, customer display screens, and online order pages.
- **Legal Name**: The official registered entity name printed on tax invoices and accounting records.
- **Brand Logo**: Upload your high-resolution PNG/JPEG logo. This appears on receipts, customer-facing terminals, and the desktop navigation bar.
- **Master Currency**: Select your currency symbol and ISO code (`INR (₹)`, `USD ($)`, `EUR (€)`, `GBP (£)`, etc.).

### Contact & Location
- **Branch Address**: Street, city, state, postal code.
- **Contact Telephone**: Customer inquiry phone number printed on the receipt footer.
- **Website / QR URL**: Your digital menu or direct online ordering link.

---

## 3. Regional Tax Regimes & Compliant Billing

DaxabitHMS supports specialized international and domestic tax calculation regimes:

### Option A: India GST Regime (`IN_GST`)
- **GSTIN**: Enter your 15-character Goods and Services Tax Identification Number.
- **Tax Breakdown**: Automatically computes and displays **CGST** (Central Tax) and **SGST** (State Tax) for intra-state billing, or **IGST** for inter-state transactions.
- **Tax Rates**: Configured per menu item (e.g. 5% for standard restaurant dining without ITC, 18% for alcoholic beverages or corporate catering).
- **Invoice Compliance**: Receipts include HSN/SAC codes, invoice serial numbers, customer GSTIN (for B2B bills), and CGST/SGST itemized breakdown.

### Option B: Spain VERI*FACTU & IVA (`ES_IVA` / `ES_CANARY_IGIC`)
- **NIF/CIF**: Enter your Spanish Tax Identification Number.
- **Chained Invoice Cryptographic Hash**: Generates SHA-256 chained hashes linking each invoice to its predecessor in compliance with Ley Antifraude 11/2021 and RD 1007/2023.
- **Tax Breakdown**: Itemizes standard IVA (10% restaurant hospitality rate, 21% bar/spirits, 4% basic items).
- **Direct AEAT Dispatch**: Configure digital certificate (mTLS) for immediate or batch transmission to the Agencia Tributaria under `/settings/verifactu`.

### Option C: Universal Sales Tax / VAT (`UNIVERSAL_VAT` / `US_SALES_TAX`)
- **Tax Mode**:
  - **Exclusive**: Prices on menu are net; sales tax is added at checkout.
  - **Inclusive**: Prices on menu already include sales tax.
- **Custom Tax Label**: Customize tax heading (e.g., *VAT*, *State Tax*, *Service Charge*, *Municipality Fee*).

---

## 4. Cashless Digital Payments & Dynamic UPI QR

For restaurants operating in India or accepting digital mobile payments:
1. In **Settings**, locate **UPI Digital Payments**.
2. Enter your **UPI VPA / Handle** (e.g., `restaurant@icici` or `manager@upi`).
3. Enter your **Payee Business Name** (e.g., *Spice Route Bistro*).
4. **How it Works in Service**:
   - When a cashier chooses **UPI** on the POS checkout panel, Daxabit automatically generates a dynamic payment QR code with the exact order total encoded.
   - If a customer display is connected (`/customer-display`), the dynamic QR appears on the guest-facing screen instantly.
   - Customer scans using Google Pay, PhonePe, Paytm, or BHIM. Amount and reference are pre-filled, eliminating manual cashier entry errors.

---

## 5. Dining Floors & Interactive Table Layouts (`/tables`)

### Adding Dining Floors
1. Navigate to **Tables** (`/tables`).
2. Click **Add Floor** (e.g., *Main Dining*, *AC Family Hall*, *Rooftop Bar*, *Outdoor Patio*).
3. Switch between floors easily using the top floor tabs.

### Creating Dining Tables
1. Click **Add Table**:
   - **Table Number / Code**: e.g., `T-01`, `Booth-3`, `Bar-4`.
   - **Seat Capacity**: e.g., 2, 4, 6, 8.
   - **Shape**: Square, Rectangle, or Round.
2. Click **Save**.

### Interactive Floor Plan Drag-and-Drop
1. Click **Edit Floor Plan** in the top right.
2. Tables switch to interactive editing mode. Drag and place each table to mirror your physical dining room layout.
3. Positions (`posX`, `posY`) save automatically in real-time.
4. Click **Done Editing** to lock the layout into live service mode.

---

## 6. Table Status Lifecycle

During active restaurant service, each table tile indicates real-time occupancy:

| Indicator | Status | Meaning | Permitted Actions |
| :--- | :--- | :--- | :--- |
| 🟢 **Green** | **Available** | Clean and ready for seating | Tap to seat guests & open POS order |
| 🔵 **Blue** | **Occupied** | Guests seated; open orders in progress | Tap to view cart, add items, send KOT, or print bill |
| 🟡 **Amber** | **Reserved** | Reserved for upcoming booking | Tap to seat arriving party or view reservation details |
| ⚪ **Gray** | **Cleaning / Out of Service** | Table cleared; pending sanitization | Tap to mark as Available for next party |

---

## 7. Online Ordering & Kiosk Auto-Approval Settings

Under **Settings ➔ Online Orders & Table Bookings**:
- **Auto-Confirm Online Orders**:
  - When **Enabled**: Mobile QR orders and digital kiosk orders immediately create kitchen KOTs without cashier intervention.
  - When **Disabled**: New online orders arrive into the **Orders ➔ Pending** queue (`/orders`) with an audible chime, allowing managers to verify kitchen capacity before accepting.
- **Auto-Confirm Reservations**: Controls whether guest table bookings on your website are approved automatically or held for manager review.

