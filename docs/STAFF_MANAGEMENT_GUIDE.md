# DaxabitHMS: Staff Management & Access Control Guide

This guide covers creating staff accounts, assigning roles and permissions, setting up 4-digit terminal PINs, scheduling shifts, and enforcing two-factor authentication in **DaxabitHMS**.

---

## 1. Role-Based Access Control (RBAC) Matrix

Daxabit enforces strict role separation so team members only access areas required for their duties:

| Permission | Owner / Admin | Store Manager | Cashier | Waitstaff | Kitchen Cook |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard & Sales Overview** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **POS Order Entry** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Checkout & Cash Collection** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Apply Manager Discounts** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Void / Refund Paid Orders** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Kitchen Display (KDS)** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Table Layout Management** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Menu & Price Adjustments** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Inventory & Stock POs** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cash Close & Till Audit** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Financial P&L & Reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Staff & System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Creating Staff Accounts (`/settings/staff`)

1. Navigate to **Settings ➔ Staff** (`/settings/staff`).
2. Click **Add Staff**:
   - **Full Name**: e.g., *Rahul Verma*.
   - **Email / Phone**: Login identifier or contact phone.
   - **Assigned Role**: Select *Cashier*, *Waitstaff*, *Chef*, *Manager*, or custom role.
   - **Branch Assignment**: Choose which branch(es) this employee is authorized to access.
   - **Password**: Set an initial secure password.
3. Click **Save Staff Account**.

---

## 3. Fast 4-Digit Terminal PINs

On busy restaurant counters with a shared touchscreen POS terminal, logging in with an email and password for every table slows down service. Daxabit solves this with **4-Digit Staff PINs**:

1. In the Staff Accounts table, locate the employee and click **Set PIN**.
2. Enter a unique 4-digit numerical code (e.g. `1234`, `4829`).
3. Click **Save PIN**.
4. **How it Works in Service**:
   - Cashiers and waiters tap their avatar or lock button on the terminal.
   - A numeric touch keypad appears.
   - Entering their 4-digit PIN switches the active terminal user in less than 1 second.
   - All orders, table seatings, and payments are logged with that specific staff member's ID.

---

## 4. Shift Scheduling & Roster Management (`/team`)

1. Navigate to **Team** (`/team`) and select the **Schedule** tab.
2. Select the staff member, shift date, and start/finish hours (e.g. `09:00` to `17:00`).
3. Click **Add Shift**.
4. View the 7-day weekly roster schedule. Shifts can be edited or removed with one click.

---

## 5. Attendance & Clock-In / Clock-Out (`/attendance`)

- Employees can record their clock-in and clock-out timestamps at the beginning and end of each work shift.
- System calculates total daily hours worked, overtime, and punctuality logs.
- Attendance records automatically link to the **Payroll Calculation** module under `/team` ➔ *Payroll*.

---

## 6. Two-Factor Authentication (2FA) for Admins

To prevent unauthorized access to sensitive financial records and customer data:
1. Navigate to **Settings ➔ Security** (`/settings/security`).
2. Click **Enable Two-Factor Authentication**.
3. Scan the QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
4. Enter the 6-digit confirmation code.
5. Save your **Emergency Recovery Codes** in a safe physical location.
6. Subsequent logins will require the master password plus the time-based one-time code (TOTP).
7. If an employee loses their device, the Restaurant Owner can reset their 2FA status from `/settings/staff`.

