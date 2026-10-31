# DaxabitHMS: Production Deployment & Go-Live Checklist

This checklist must be executed and signed off by the restaurant owner and IT lead before opening doors for live customer billing.

---

## 1. Infrastructure & System Readiness

- [ ] **Dedicated Hardware**: Main server PC has a minimum of 8 GB RAM and 20 GB free SSD storage.
- [ ] **Power Protection**: Server PC and main Wi-Fi router are connected to an Uninterruptible Power Supply (UPS) with at least 30 minutes of battery backup.
- [ ] **Windows Power Plan**: Server PC is set to **Never Sleep / Never Hibernate** when plugged into AC power.
- [ ] **Operating System**: Windows 10/11 is updated with the latest security cumulative updates.
- [ ] **WebView2 Runtime**: Microsoft Edge WebView2 Evergreen Runtime verified and installed.
- [ ] **Service Autostart**: Windows Service `DaxabitHMSServer` is set to **Automatic** startup with failure restart configured.

---

## 2. Local Network (LAN) & Router Setup

- [ ] **Static IP Reservation**: Server PC is assigned a permanent static IP address (e.g. `192.168.1.100`) via router DHCP reservation.
- [ ] **AP Isolation Disabled**: Router guest isolation is turned OFF so tablets can communicate with the server.
- [ ] **Dedicated POS SSID**: Recommended separate Wi-Fi network for restaurant terminals (e.g. `Restaurant-Internal`), distinct from guest Wi-Fi.
- [ ] **Windows Firewall Rule**: Port `1995` TCP inbound rule confirmed active for Private network profile.
- [ ] **Tablet Reachability**: Browser URL `http://192.168.1.100:1995` opens cleanly on waiter tablets and KDS screens.

---

## 3. Business Profile & Legal Compliance

- [ ] **Establishment Details**: Legal entity name, trade name, branch address, and phone number verified under `/settings`.
- [ ] **Brand Logo**: High-resolution restaurant logo uploaded and verified on receipt preview.
- [ ] **Tax Regime Configured**:
  - [ ] India: GSTIN verified, standard 5% / 18% tax rates assigned to menu items.
  - [ ] Spain: NIF verified, VERI*FACTU certificate and IVA rates configured.
  - [ ] Other: Tax inclusive/exclusive mode verified.
- [ ] **UPI Dynamic QR Code**: Verified UPI VPA and payee name generate scannable payment QRs on checkout.
- [ ] **Receipt Header & Footer**: FSSAI number, tax ID, and return policy configured on receipt template.

---

## 4. Hardware & Thermal Printers

- [ ] **Paper Width**: Matching paper roll width (`58 mm` or `80 mm`) selected in printer settings.
- [ ] **Test Print**: Receipt test prints cleanly with crisp text, correct currency symbols, and proper barcode/QR rendering.
- [ ] **Cash Drawer Kick**: Settling a cash order successfully triggers the cash drawer kick-out pulse.
- [ ] **Kitchen Printer / KDS**: Sending a KOT generates a paper kitchen slip or renders immediately on `/kds`.
- [ ] **Audio Chime**: Audio unlocked on kitchen screens; chime rings audibly upon new ticket arrival.

---

## 5. Menu, Pricing & Inventory

- [ ] **Category Hierarchy**: Starters, Mains, Breads, Rice, Desserts, and Drinks organized cleanly.
- [ ] **Price Accuracy**: Every menu item selling price verified against the physical print menu.
- [ ] **Portions & Modifiers**: Portions (Half/Full) and modifiers (Spice levels, add-ons) tested on POS.
- [ ] **Veg / Non-Veg Markers**: Dietary indicators verified on all dishes.
- [ ] **Initial Inventory Count**: Key raw ingredients entered with current stock and cost per unit under `/inventory`.
- [ ] **Recipe BOM**: Core high-cost dishes linked to recipes for automated inventory deduction.

---

## 6. Staff Accounts & Access Security

- [ ] **Default Passwords Changed**: Initial setup passwords replaced with strong credentials.
- [ ] **Staff Accounts Created**: Separate logins created for cashiers, waitstaff, chefs, and managers under `/settings/staff`.
- [ ] **Fast 4-Digit PINs**: 4-digit PINs assigned to each terminal user and tested on the POS lock screen.
- [ ] **Role Permissions Enforced**: Verified that waitstaff and cashiers cannot access restricted settings, P&L reports, or user deletion.
- [ ] **Two-Factor Authentication**: 2FA enabled for Owner and General Manager administrative logins.

---

## 7. Backups, Recovery & Sign-Off

- [ ] **Automated Backup Schedule**: Automated nightly backup verified in `/settings/backup`.
- [ ] **Manual Backup Tested**: Generated a manual backup and downloaded the archive to an external USB flash drive.
- [ ] **Disaster Recovery Validated**: Verified that backup archive can be restored onto a test instance.
- [ ] **Staff Training Complete**: Cashiers and waitstaff trained on POS shortcuts (`/`, `F2`, `F8`, `Esc`) and table switching.

### Go-Live Authorization
- **Restaurant General Manager**: ____________________  **Date**: ____________
- **Lead Systems Integrator**: _______________________  **Date**: ____________

