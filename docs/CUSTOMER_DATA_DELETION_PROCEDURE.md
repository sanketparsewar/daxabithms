# DaxabitHMS: Customer Data Deletion & Anonymization Procedure

This standard operational procedure details how to handle customer requests for erasure, account deletion, and the Right to be Forgotten under data privacy laws (such as India's **DPDP Act 2023** and **GDPR**), while strictly preserving statutory tax accounting obligations.

---

## 1. Statutory Retention vs Privacy Rights: The Legal Balance

When a customer requests: *"Please delete my phone number and personal details from your restaurant system"*, two competing legal requirements must be balanced:

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       PRIVACY LEGISLATION            │  │        TAX & STATUTORY LAWS          │
│   (India DPDP Act 2023 / GDPR)       │  │ (India CGST Act Sec 36 / Commercial) │
│                                      │  │                                      │
│  Right to erasure of personal data;  │  │  Mandatory obligation to retain all   │
│  consent withdrawal for marketing.   │  │  tax invoices and sales ledgers for   │
│                                      │  │  72 MONTHS (6 YEARS) for tax audits. │
└──────────────────┬───────────────────┘  └──────────────────┬───────────────────┘
                   │                                         │
                   └────────────────────┬────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DAXABIT HYBRID ANONYMIZATION SOLUTION                │
│                                                                        │
│  1. PERSONAL IDENTIFIERS PURGED: Name, phone, email, notes, and        │
│     loyalty balances are permanently overwritten with random hashes.   │
│  2. FINANCIAL AUDIT PRESERVED: Invoice number, items sold, tax split,  │
│     and currency totals remain intact under generic "Walk-in Guest".   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Deletion / Anonymization Workflow

### Step 1: Identity & Verification
Before deleting customer records, verify that the requester is the genuine account owner:
- Confirm that the request originates from the verified mobile phone number or registered email address on file.

### Step 2: In-App Anonymization (`/customers`)
1. Navigate to **Customers** (`/customers`).
2. Search for the customer using their phone number or name.
3. Click the customer row to open the profile details dialog.
4. Click **Delete / Anonymize Customer**:
   - A confirmation dialog appears with explicit legal warning:
     > *"This action will permanently purge all customer contact details, phone numbers, and loyalty points. Historical billing records will be anonymized to comply with tax retention laws. This cannot be undone."*
5. Type **CONFIRM** or enter Manager PIN to authorize.
6. Click **Permanently Anonymize**.

### Step 3: What the System Executes in the Database
The database transaction executes the following sanitization:
1. `Customer.name` ➔ `Anonymized Customer #XXXX`
2. `Customer.phone` ➔ `NULL` (or unique hashed salt)
3. `Customer.email` ➔ `NULL`
4. `Customer.notes` ➔ `NULL`
5. `Customer.loyaltyPoints` ➔ `0` (forfeited)
6. All historical orders linked to this customer retain their financial amounts and tax breakdown, but display as a generic walk-in guest.
7. An audit record is logged in `/settings/audit-log`:
   `[ACTION: CUSTOMER_ANONYMIZED] [USER: Manager] [CUSTOMER_ID: cust_abc123]`

---

## 3. Communication to the Customer

Send a formal written acknowledgment to the customer (via SMS or email):

> *"Dear Guest, in response to your request, your personal contact information and loyalty account have been permanently erased from our restaurant customer records. In accordance with statutory tax regulations (Section 36 of the Indian CGST Act), historical invoice numbers and financial totals are retained without personal identifiers for statutory tax compliance. Thank you."*

