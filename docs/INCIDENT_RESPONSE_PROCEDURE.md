# DaxabitHMS: Incident Response & Operational Recovery Plan

This standard operating procedure defines the identification, containment, recovery, and regulatory reporting steps for cybersecurity incidents, server failures, and data breaches affecting **DaxabitHMS**.

---

## 1. Incident Classification Severity Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SEVERITY CLASSIFICATION                         │
│                                                                        │
│  [SEV-1: CRITICAL]   ──  Confirmed data breach, ransomware infection,  │
│                          database wiped, complete server outage        │
│                                                                        │
│  [SEV-2: HIGH]       ──  Payment gateway failure, database corruption, │
│                          all printers offline, Wi-Fi LAN disruption    │
│                                                                        │
│  [SEV-3: MEDIUM]     ──  Single tablet disconnected, partial KDS lag,  │
│                          isolated thermal printer jam                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Four-Phase Incident Response Lifecycle

### Phase 1: Identification & Triage (0 – 15 Minutes)
1. **Report Received**: Shift manager notices abnormal server behavior, unauthorized login, or crash.
2. **Initial Verification**:
   - Check server service: `Get-Service -Name DaxabitHMSServer`.
   - Inspect recent error logs: `%PROGRAMDATA%\DaxabitHMS\server\logs\server.log`.
   - Check if database file is locked or corrupted.
3. **Declare Severity**: IT Administrator sets SEV-1, SEV-2, or SEV-3.

### Phase 2: Immediate Containment (15 – 30 Minutes)
- **If Suspected Ransomware or Cyber Intrusion**:
  1. **Physically disconnect the server PC from the network** (unplug Ethernet cable and turn off Wi-Fi immediately) to prevent lateral spread.
  2. Do **NOT** shut down or power off the PC abruptly (preserving volatile memory for forensic analysis).
  3. Freeze administrative passwords and revoke all active JWT sessions.
- **If Hardware Drive Failure**:
  1. Power off machine safely to avoid further disk platter damage.
  2. Prepare secondary standby PC.

### Phase 3: Eradication & Disaster Recovery (30 – 90 Minutes)
1. **Clean Installation**:
   - If server was compromised or drive failed, perform a fresh installation of Windows and `DaxabitHMS-Setup.exe` on a verified clean machine.
2. **Database Snapshot Restore**:
   - Locate the most recent automated backup from the off-site storage or secondary drive (`%PROGRAMDATA%\DaxabitHMS\backups\`).
   - Run the restoration procedure:
     ```powershell
     # Stop server service
     Stop-Service -Name DaxabitHMSServer

     # Restore database dump
     & "$env:ProgramFiles\DaxabitHMS\runtimes\postgres\bin\pg_restore.exe" `
       -U daxabit -d daxabit -c "$env:ProgramData\DaxabitHMS\backups\backup-latest.dump"

     # Restart service
     Start-Service -Name DaxabitHMSServer
     ```
3. **Integrity Validation**:
   - Verify that recent orders, table layout, and menu items load accurately.

### Phase 4: Operational Fallback During Service Rush
If a server failure occurs during peak dinner rush before the server can be restored:
1. **Paper Kitchen Chits**: Floor supervisors transition to pre-printed duplicate paper order pads.
2. **Manual Standalone Card Terminals**: Process payments on physical bank EDC credit card terminals.
3. **Post-Service Data Entry**: Once Daxabit is restored, cashier keys in paper bills under a specific "Offline Catch-up Shift" to reconcile daily sales and inventory.

---

## 3. Statutory Breach Notification Obligations

### India CERT-In & DPDP Act Reporting
Under Indian cybersecurity regulations (Directions issued under Section 70B of the IT Act by CERT-In):
- **CERT-In 6-Hour Mandate**: Significant cybersecurity incidents (including ransomware, database intrusions, or malicious network breaches) must be reported to the Indian Computer Emergency Response Team (CERT-In) at `incident@cert-in.org.in` within **6 hours** of noticing.
- **Data Protection Board (DPBI) Notice**: Under Section 8(6) of the DPDP Act 2023, in the event of a personal data breach, the restaurant (Data Fiduciary) must give notice to the Data Protection Board of India and to each affected customer in the prescribed form and manner.

---

## 4. Post-Incident Review & Root-Cause Remediation

Within 48 hours of resolving any SEV-1 or SEV-2 incident:
1. Conduct a post-mortem review with the restaurant owner and IT lead.
2. Document:
   - Root cause (e.g. outdated Windows patch, weak staff password, power surge).
   - Timeline of downtime.
   - Financial variance or lost orders.
3. Implement permanent prevention measures (e.g. installing UPS battery backup, enforcing 2FA, updating firewall policies).

