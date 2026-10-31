# DaxabitHMS: Data Export Procedures & Portability Guide

This guide details the standard operational procedures for exporting sales ledgers, tax registers, customer profiles, and full database snapshots from **DaxabitHMS**.

---

## 1. Overview of Export Capabilities

DaxabitHMS provides native data portability without vendor lock-in, supporting multiple industry-standard export formats:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA EXPORT FORMATS                             │
│                                                                        │
│  [Excel (.xlsx)]  ──  Pre-formatted multi-column financial workbooks   │
│  [CSV (.csv)]     ──  Raw tabular records for Tally, QuickBooks, ERP  │
│  [PDF (.pdf)]     ──  Official audit-ready printable documents        │
│  [JSON / SQL]     ──  Full cryptographic database schema dumps        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sales & Transaction Ledger Export (`/reports`)

To export sales transaction history for your accountant or tax auditor:
1. Navigate to **Reports** (`/reports`).
2. In the left navigation menu, select the desired report:
   - **Daily Sales Summary**: Aggregates orders, gross sales, net sales, discounts, and tips.
   - **Payment Modes Register**: Itemizes cash, credit/debit card, and digital UPI amounts.
   - **Tax Collected Summary**: Itemizes CGST, SGST, IGST, or VAT rates across all settled bills.
   - **Item-Level Sales**: Detailed count and revenue per dish.
3. Select your date filter range (e.g. *Start: 2026-10-01* to *End: 2026-10-31*).
4. Click:
   - **Excel** (`.xlsx`): Downloads structured spreadsheet with column totals.
   - **CSV** (`.csv`): Downloads comma-delimited data for automated accounting import.
   - **PDF** (`.pdf`): Generates printable, high-contrast document.

---

## 3. GST Tax Filing Export (India Compliance)

For Indian Chartered Accountants filing monthly **GSTR-1** and **GSTR-3B**:
1. Navigate to **Accounting ➔ GST Tab** (`/accounting`).
2. Select the tax filing month.
3. Review:
   - **B2C (Others)**: Aggregated consumer walk-in dining totals with tax slab breakdown (e.g., 5% vs 18%).
   - **B2B (Registered)**: Invoices carrying customer GSTIN numbers.
4. Click **Export GST Filing Report (Excel/CSV)**.
5. Provide the downloaded file to your CA or upload directly into GST offline utility tools.

---

## 4. Customer Data Export (Data Portability)

Under privacy regulations (including India's DPDP Act 2023), customers have the right to request a copy of their personal data:
1. Navigate to **Customers** (`/customers`).
2. Locate the customer record via name or phone number.
3. Open the customer profile:
   - Displays all recorded contact info, visit history, loyalty points balance, and past orders.
4. Click **Export Customer Record**:
   - Generates a secure JSON or CSV file containing all personal information and order history associated with that individual.

---

## 5. Complete Database Snapshot Export (`/settings/backup`)

For complete server migration or off-site disaster recovery:
1. Navigate to **Settings ➔ Backup** (`/settings/backup`).
2. Click **Create Manual Backup Now**.
3. Daxabit freezes active write queues, runs `pg_dump`, and bundles the database into a compressed archive (`.tar.gz` or `.sql`).
4. In the Backups list, click **Download**:
   - The encrypted backup archive downloads to your administrative computer.
   - Store the backup archive on an external encrypted hard drive or secure cloud storage.

> For full backup and recovery instructions, see:
> [Database Backup and Recovery Guide](file:///d:/daxabithms/docs/DATABASE_BACKUP_AND_RECOVERY.md)

