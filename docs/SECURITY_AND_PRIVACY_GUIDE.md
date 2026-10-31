# DaxabitHMS: Security, Privacy & Compliance Guide

This guide details the security architecture, encryption standards, tenant isolation boundaries, and privacy compliance requirements (including India's **DPDP Act 2023** and **GST statutory record retention**) for **DaxabitHMS**.

---

## 1. Security Architecture & Threat Model

DaxabitHMS is engineered for self-hosted and cloud restaurant environments where financial transaction integrity and customer privacy are paramount:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SECURITY PERIMETERS                             │
│                                                                        │
│  [Client Tier]        ──  HttpOnly, SameSite=Lax Secure Cookies,       │
│                           Strict CSP, Sanitized HTML Outputs           │
│                                                                        │
│  [Network Tier]       ──  TLS 1.3 Encryption, LAN Origin Scoping,      │
│                           CORS Whitelisting, WebSocket Auth Guards     │
│                                                                        │
│  [Application Tier]   ──  Role-Based Access Control (RBAC), Rate       │
│                           Limiting, Idempotency Token Enforcement      │
│                                                                        │
│  [Data Tier]          ──  Tenant-Scoped PostgreSQL Queries, Encrypted │
│                           Backup Archives (AES-256), SHA-256 Chaining  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Credential Protection

### Password Hashing
- User master passwords are encrypted using **Argon2id / bcrypt** with adaptive work factor salt rounds. Plaintext passwords are never stored, logged, or recoverable.

### 4-Digit Staff PIN Security
- Staff terminal PINs are hashed using salted cryptographic hashes before database persistence. PIN attempts are rate-limited: 5 incorrect PIN submissions lock the terminal account for 5 minutes.

### Session Management
- Authentication sessions use cryptographically random 256-bit session tokens stored in secure, server-managed HTTP cookies.
- Cookies carry the `HttpOnly` attribute (inaccessible to browser JavaScript, mitigating XSS token theft) and `SameSite=Lax` (mitigating CSRF attacks).
- When operating over HTTPS, cookies automatically include the `Secure` flag.

### Two-Factor Authentication (2FA / TOTP)
- Implements RFC 6238 Time-Based One-Time Passwords (TOTP). Compatible with Google Authenticator, Microsoft Authenticator, and hardware tokens.
- Generates 8 single-use cryptographic recovery codes stored as SHA-256 hashes.

---

## 3. Multi-Tenant Data Isolation

Daxabit guarantees complete data isolation between restaurants and across branches within a restaurant:
- **Mandatory Tenant Foreign Keys**: All primary entities (`orders`, `tables`, `menu_items`, `customers`, `payments`, `inventory`) are strictly keyed by `restaurantId` and `branchId`.
- **Query Scoping**: NestJS repository filters enforce tenant identification on every query, update, and deletion.
- **Cross-Tenant Prevention**: Users cannot read, query, or mutate records belonging to other restaurant accounts, validated by continuous automated security tests.

---

## 4. Privacy Regulations & Compliance

### A. India Digital Personal Data Protection Act, 2023 (DPDP Act)
Restaurants operating in India and collecting customer personal data (name, mobile phone number, birthdate, email) must observe key DPDP statutory principles:

1. **Lawful Purpose & Notice**:
   - Customer phone numbers may only be collected for legitimate restaurant business purposes (delivering digital GST e-bills, loyalty points, or table reservation updates).
   - Staff must inform customers when requesting their phone number at the POS counter.
2. **Data Minimization**:
   - Daxabit allows billing without requiring customer phone numbers. Customers who prefer anonymity can be rung up as a standard walk-in guest.
3. **Data Principal Rights**:
   - Customers have the right to request a copy of their personal data or request deletion of non-statutory records (see [Customer Data Deletion Procedure](file:///d:/daxabithms/docs/CUSTOMER_DATA_DELETION_PROCEDURE.md)).
4. **Reasonable Security Safeguards**:
   - Customer database files and backup archives must be encrypted and protected behind strong administrative passwords.

### B. India GST Record Retention Obligations
> **Critical Statutory Requirement**: Under Section 36 of the Central Goods and Services Tax (CGST) Act, 2017:
> - Every registered taxpayer must retain accounts and records (tax invoices, credit/debit notes, cash books, inventory ledgers) for a period of **72 months (6 years)** from the due date of furnishing the annual return for that financial year.
> - While customer marketing profiles can be anonymized upon request, **tax invoices and billing transactions must be preserved for 6 years** to comply with Indian tax audits.

### C. European Union GDPR Compliance
- Provides mechanisms for Right to Access (Article 15), Right to Rectification (Article 16), and Right to Erasure (Article 17).
- Transactional financial ledgers are retained in accordance with statutory accounting requirements (commercial code retention).

---

## 5. Tamper-Proof Audit Logging (`/settings/audit-log`)

Daxabit maintains an append-only, searchable **Audit Trail**:
- Every critical managerial action is recorded:
  - User ID, role, and IP address
  - Action taken (e.g. *Order Discount Applied*, *Bill Voided*, *Price Modified*, *Staff Created*, *Backup Restored*)
  - Before and after state differences
- Audit records cannot be altered or deleted from the web application interface.

---

## 6. Backup Encryption & Storage Hygiene

- Automated database backups (`.tar.gz` / `.sql`) can be encrypted using AES-256-GCM encryption.
- Backup files should be replicated to a secondary physical drive or encrypted cloud storage outside the main billing terminal.
- Discarded hard drives or terminal upgrades must undergo secure cryptographic disk sanitization (NIST SP 800-88) before disposal.

