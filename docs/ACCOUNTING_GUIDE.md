# DaxabitHMS: Restaurant Accounting & Financial Reconciliation Guide

This guide covers daily till reconciliation (cash closes / Z-reports), petty cash expenses, tax accounting, Profit & Loss reporting, and financial export in **DaxabitHMS** (`/accounting`).

---

## 1. Accounting Lifecycle Overview

Daxabit provides full double-entry bookkeeping and daily cash auditing tailored for restaurant operations:

```
┌─────────────────────────────────────────────────────────────┐
│                       DAILY REGISTER                        │
│             Opening Float: $150.00 (Morning)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       CASH SALES (+)        │ │     TILL EXPENSES (-)       │
│  Live POS cash payments:    │ │  Petty cash paid from till: │
│  +$1,420.50                 │ │  -$45.00 (Emergency milk)   │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPECTED DRAWER CASH                      │
│      $150.00 + $1,420.50 - $45.00 = $1,525.50               │
│                                                             │
│      Actual Counted Cash:           $1,525.00               │
│      Overage / Shortage:             -$0.50 (Audited)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Daily Cash Drawer Close (Cash Close / Z-Report)

At the conclusion of each shift or business day:
1. Navigate to **Accounting** (`/accounting`) and select the **Cash Close** tab.
2. Enter the **Starting Cash Float** (the baseline cash kept in the drawer in the morning, e.g. `$150.00`).
3. Count the physical banknotes and coins in the cash drawer and enter the total into **Actual Counted Cash**.
4. Daxabit automatically compiles:
   - Total Cash Tendered across all settled orders
   - Total Cash Change refunded to customers
   - Total Petty Cash Disbursements paid out of the register
   - **Theoretical Cash Balance**: `Starting Float + Net Cash Sales - Petty Expenses`
   - **Variance (Overage or Shortage)**
5. If a variance exists, enter an explanatory supervisor note.
6. Click **Record Cash Close**:
   - The register closes securely.
   - An official **Z-Report Slip** prints on the thermal printer itemizing sales, taxes, cash, card, and digital UPI amounts.
   - The register is locked from retroactive manipulation.

---

## 3. Petty Cash & Till Expenses (`/accounting` ➔ Expenses)

Restaurants often pay small expenses directly from the cash register (e.g. emergency grocery runs, delivery boy tips, daily ice bags):
1. In **Accounting**, navigate to the **Expenses** tab.
2. Enter:
   - **Date**: e.g., `2026-10-31`.
   - **Expense Category**: *Kitchen Supplies*, *Produce*, *Gas Refill*, *Maintenance*, *Cleaning*.
   - **Amount**: Monetary figure.
   - **Note / Receipt Ref**: Vendor invoice or receipt reference.
   - **Paid From Cash Till**: Check this box if paid directly out of the cash drawer so the evening cash reconciliation accounts for the disbursement.
3. Click **Add Expense**.

---

## 4. Tax Compliance & Reporting (GST, VAT, VERI*FACTU)

### India GST Reporting (`/accounting` ➔ GST Tab)
- Real-time aggregation of **B2C (Small)** and **B2B (Registered with GSTIN)** transactions.
- Automated separation of:
  - Total Taxable Value
  - **CGST Amount** (Central Tax, e.g. 2.5%)
  - **SGST Amount** (State Tax, e.g. 2.5%)
  - **IGST Amount** (Inter-State Tax, e.g. 5%)
- Export directly to Excel / CSV in the format required for monthly **GSTR-1** and **GSTR-3B** return filing by your Chartered Accountant.

### Spanish VERI*FACTU Invoicing
- All issued simplified and complete invoices carry sequential numbering without gaps.
- Chained cryptographic signatures link each invoice record to the previous hash.
- Access the immutable audit trail under **Settings ➔ VERI*FACTU** (`/settings/verifactu`).

---

## 5. Profit & Loss (P&L) Statement

Navigate to the **Profit & Loss** tab:
1. Select date range (e.g., *Current Month*, *Last Quarter*, *Custom Range*).
2. Daxabit computes:
   - **Gross Operating Revenue**: Net food & beverage sales.
   - **Cost of Goods Sold (COGS)**: Raw ingredient depletion computed from recipe BOM deductions and purchase orders.
   - **Gross Profit**: `Revenue - COGS` (and Gross Margin %).
   - **Operating Expenses (OPEX)**: Staff wages/payroll, rent, utilities, marketing, maintenance.
   - **Net Operating Profit**: Bottom-line restaurant earnings before tax.

---

## 6. Financial Export for Accountants (`/reports`)

Export your books to your external accountant or ERP software:
1. Navigate to **Reports** (`/reports`).
2. Select report type:
   - *Daily Sales Summary*
   - *Payment Modes Breakdown (Cash vs Card vs UPI)*
   - *Tax Collected Register*
   - *Item Sales & Food Cost Analysis*
3. Select date range.
4. Click **Excel (.xlsx)** for spreadsheet analysis, **CSV** for ERP/Tally import, or **PDF** for printed records.

