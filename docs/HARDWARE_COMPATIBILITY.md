# Hardware Compatibility, POS & Thermal Printing Guide

This document specifies the hardware architecture, tested models, physical interfaces, ESC/POS byte-level command protocols, anti-fraud reprint rules, and failure recovery procedures for DaxabitHMS.

---

## 1. Overview & Printing Architecture

DaxabitHMS supports two complementary printing paradigms:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DaxabitHMS POS Terminal                         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
        Native ESC/POS Driver              OS Print Spooler / HTML
                    │                                │
    ┌───────────────┴───────────────┐        ┌───────┴───────────────┐
    │                               │        │                       │
Network TCP (Port 9100)      Direct USB     Windows Print Spooler   Browser Print
(Epson / Star / Munbyn)     (/dev/usb/lp0)  (WebView2 / Win32)      (Chrome/Edge/iPad)
    │                               │        │                       │
    ▼                               ▼        ▼                       ▼
Kitchen Ticket / Till       Till Printer    Counter Printer        A4 / PDF / Thermal
```

1. **Native ESC/POS Thermal Printing**: 
   - Generates raw ESC/POS binary command streams directly in Node.js/NestJS.
   - Text is formatted with printer-native fonts (Font A 12×24, Font B 9×17) with zero bitmap rendering latency (<100 ms).
   - Driven over raw TCP sockets (port 9100) or direct USB character devices (`/dev/usb/lp0` / libusb).
2. **Browser & Windows Print Spooler (`window.print()` / WebView2)**:
   - Self-printing HTML templates formatted for 80 mm thermal paper (`@page { size: 80mm auto; margin: 0; }`).
   - Integrates natively with Windows Print Spooler via WebView2 `CoreWebView2.ShowPrintUI()`.
   - Compatible with any printer driver recognized by Microsoft Windows, macOS, Linux CUPS, or iOS AirPrint.

---

## 2. Thermal Receipt Printers (58 mm & 80 mm)

DaxabitHMS automatically adjusts layout, character width, wrapping, and borders based on the configured paper profile.

| Parameter | 58 mm Thermal Roll | 80 mm Thermal Roll |
| :--- | :--- | :--- |
| **Physical Paper Width** | 58 mm (2.28 in) | 80 mm (3.15 in) |
| **Printable Width** | 48 mm (384 dots @ 203 DPI) | 72 mm (576 dots @ 203 DPI) |
| **Standard Columns (Font A)** | 32 characters | 48 characters (or 42 on narrow heads) |
| **Typical Roll Diameter** | 40 mm – 50 mm | 60 mm – 83 mm |
| **Recommended Use** | Food trucks, QSR kiosks, small bars | Fine dining, itemized bills, tax invoices, KOTs |

### Verified Hardware Models

| Manufacturer | Model Series | Interface Tested | Supported Speeds | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Epson** | TM-T88VI / TM-T88VII | USB, Ethernet (TCP/9100) | Up to 500 mm/sec | Industry standard; perfect ESC/POS emulation |
| **Epson** | TM-T20III | USB, Ethernet | Up to 250 mm/sec | Best-value counter thermal printer |
| **Star Micronics** | TSP143III (TSP100 series) | USB, LAN, Wi-Fi | 250 mm/sec | Full support via Windows Spooler and ESC/POS |
| **Star Micronics** | TSP654II | Ethernet (Port 9100) | 300 mm/sec | Ideal for heavy kitchen ticket output |
| **Munbyn** | ITPP047 / ITPP130 | USB, Ethernet | 230–300 mm/sec | Auto-cutter supported; 80 mm / 58 mm divider |
| **Bixolon** | SRP-330II / SRP-350III | USB, Ethernet | 250 mm/sec | Robust thermal head; high reliability |
| **Xprinter** | XP-N160II / XP-Q90EC | USB, LAN | 160–200 mm/sec | Budget 80 mm & 58 mm ESC/POS thermal printers |
| **Rongta** | RP326 / RP80 | USB, Ethernet | 250 mm/sec | Fully compatible with DaxabitHMS ESC/POS writer |

---

## 3. Cash Drawer Integration (RJ12 24V Solenoid)

Cash drawers plug directly into the **DK (Drawer Kick) port** of the thermal receipt printer using a standard 6-pin RJ11/RJ12 modular connector.

```
       RJ12 Drawer Kick Pinout
       ┌─────────────────────┐
       │ 1  2  3  4  5  6    │
       └───┬───┬───┬───┬─────┘
           │   │   │   │
           │   │   │   └─ Pin 4: +24V DC Power (from printer)
           │   │   └───── Pin 3: Drawer open/close status switch
           │   └───────── Pin 2: Solenoid drive signal (-)
           └───────────── Pin 1: Frame Ground
```

### Pulse Command Protocol
DaxabitHMS triggers drawer opening by sending the standard ESC/POS pulse sequence:
$$\text{ESC}\;p\;m\;t_1\;t_2 \implies \texttt{0x1B}\;\texttt{0x70}\;\texttt{0x00}\;\texttt{0x19}\;\texttt{0xFA}$$
- `m = 0`: Connector pin 2.
- $t_1 = 25$ ($25 \times 2\text{ ms} = 50\text{ ms}$ ON pulse).
- $t_2 = 250$ ($250 \times 2\text{ ms} = 500\text{ ms}$ OFF pause).

### Cash Drawer Business Rules
1. **Cash Settlement**: Cash drawers kick open automatically when a bill is paid with `CASH` (`tendered` & `changeGiven` recorded).
2. **Card & Digital Payments**: No drawer kick is sent for card, UPI, bank transfer, or customer account payments.
3. **Provisional Bill / Preview**: Printing a provisional bill prior to payment never kicks the drawer.
4. **Manual "Open Drawer / No Sale"**: Cashiers with the `bills.print` permission can manually pop the till via `POST /api/v1/orders/print/drawer`. Every manual drawer open event is logged to the PostgreSQL `AuditLog` table with timestamp and employee user ID.

---

## 4. Kitchen Order Ticket (KOT) Printing

Kitchen printers are deployed directly in prep areas (Grill, Hot Line, Cold/Salad Station, Bar) to notify kitchen staff of incoming orders.

### KOT Design & Typography
- **No Prices / No Financial Totals**: Pure operational focus on station, table, item name, quantity, modifiers, and preparation instructions.
- **Large High-Contrast Font**: Double-height/double-width text for table number (`#Table 4`) and item quantities (`2×`).
- **Kitchen Notes & Allergies**: Prominently emphasized with a framed box to alert cooks to allergens (e.g., `Note: Nut allergy — use clean pan`).
- **Station-Specific Dispatch**: Multi-station routing sends kitchen items to the printer configured for their station category.

### Kitchen Duplicate Prevention & Reprint Banner
- **Initial Ticket**: Prints cleanly without reprint markers.
- **Reprint Request**: If kitchen staff request a reprint (e.g., ticket soaked or lost), the system stamps:
  ```
  ********************************
      *** REPRINT #1 ***
  ********************************
  ```
  in double-tall font on both thermal ESC/POS slips and browser printouts.

---

## 5. Duplicate Print Identification & Anti-Fraud Protection

To protect restaurant owners against employee theft (e.g., re-printing an existing bill to collect cash from a second customer without recording a sale) or fraudulent corporate tax expense claims:

1. **Original Print**: Initial bill or customer receipt prints with normal header and invoice numbering.
2. **Duplicate Detection**: The backend queries the `AuditLog` table for prior `order.receipt_printed` or `order.bill_printed` events.
3. **Prominent Watermark**: If an order has already been printed, or if the client explicitly requests a copy, DaxabitHMS stamps:
   ```
   ================================
     *** DUPLICATE / REPRINT ***
   ================================
   ```
   - **ESC/POS**: Centered, bold, tall Font A text surrounded by horizontal rules.
   - **HTML Print**: Prominent bordered banner (`border: 2px dashed #000; letter-spacing: 1px`).

---

## 6. Safe Decoupling: Billing vs. Printing Fault Tolerance

> [!IMPORTANT]
> **A failed print job must NEVER cancel, rollback, or duplicate a financial transaction.**

### Transaction Decoupling Flow
```
User clicks "Complete Payment" ($55.00 Cash)
   │
   ▼
[ACID PostgreSQL Transaction]
   ├── Order status updated to PAID
   ├── Payment row inserted ($55.00 COMPLETED)
   ├── billedAt timestamp recorded
   └── Inventory deducted (FIFO recipes)
   │
[Transaction Successfully COMMITTED]
   │
   ▼
[Isolated Print Execution Boundary]
   ├── Dispatch ESC/POS bytes to Thermal Printer / Spooler
   │
   ├── SUCCESS: Receipt prints, drawer opens.
   │
   └── FAILURE (Out of paper / cable disconnected / printer offline):
       ├── Caught in try/catch boundary
       ├── Database transaction REMAINS 100% COMMITTED
       ├── UI displays warning toast: "Payment confirmed. Printer offline."
       └── Cashier loads paper roll and clicks "Reprint receipt"
```

---

## 7. Peripheral Hardware Compatibility

### Barcode & 2D QR Scanners
- **Supported Interfaces**: USB HID (Human Interface Device) Keyboard Wedge, Bluetooth HID.
- **Symbologies Supported**: 
  - 1D Barcodes: Code 128, Code 39, EAN-13, UPC-A (retail and packaged inventory).
  - 2D Barcodes: QR Code, Data Matrix (table ordering QR, invoice verification).
- **Configuration**:
  - Scanner must be configured with a **Carriage Return (Enter / `\r\n`) suffix**.
  - DaxabitHMS POS captures scanner input in fast-entry buffer with debounce protection.

### Customer-Facing Displays (CFD) / Pole Displays
- **Secondary HDMI / USB Monitor**:
  - DaxabitHMS supports an extended-screen customer display web view.
  - Shows line-by-line item additions, modifiers, running subtotal, and dynamic UPI / card payment QR codes.
- **2×20 VFD Character Displays**:
  - Supported via serial COM / USB-to-Serial emulation (`ESC/POS` display command `0x0C` clear display, `0x1F 0x24` cursor positioning).

### Touchscreen Terminals
- **Tested Panels**: Elo Touch, Posiflex, FEC, Sunmi T2s, standard Windows Touch (Surface / All-in-One PC).
- **Interface Ergonomics**:
  - Minimum touch target dimension of 44×44 CSS pixels.
  - Large numeric keypad for quick cash entry.
  - High-DPI support (`PerMonitorV2` in `MainForm.cs`) ensures crisp rendering on 1080p, 2K, and 4K counter terminals without blurred fonts.

---

## 8. Character Set & Code Page Matrix

DaxabitHMS provides native code page translation for international restaurants:

| Code Page | Region / Languages | Currency Symbols Supported |
| :--- | :--- | :--- |
| **CP858** *(Default)* | Western Europe, Latin America | €, $, £, Rs. (Euro supported at `0xD5`) |
| **CP437** | US English, standard ASCII | $, £ (falls back to `EUR ` for Euro) |
| **CP850** | Western European multilingual | $, £ (falls back to `EUR `) |
| **CP1252** | Windows Latin-1 | €, $, £ |

*If an employee enters a character not present in the printer's hardware code page, DaxabitHMS logs it into `unsupportedChars` and prints a graceful fallback rather than crashing the print spooler.*

---

## 9. Hardware Troubleshooting & Field Guide

### 1. Printer Prints Blank Paper
- **Cause**: Thermal paper roll inserted upside down.
- **Fix**: Open the printer lid, flip the paper roll over so the heat-sensitive coating faces the thermal print head.

### 2. Printer Shows Red Error Light / Cutter Locked
- **Cause**: Paper jam or knife stuck midway during auto-cut.
- **Fix**: Power off the printer. Turn the manual gear knob behind the front cutter cover until the knife returns to home position. Remove jammed paper and power back on.

### 3. Garbled Text / Strange Symbols
- **Cause**: Baud rate mismatch (on serial printers) or incorrect code page selected in branch settings.
- **Fix**: Go to **Settings > Printer**, ensure Character Set is set to **CP858** or **CP437**, and click **Send test print**.

### 4. Network Printer Offline (Port 9100)
- **Cause**: IP address changed via DHCP lease expiration.
- **Fix**: Assign a static DHCP reservation in the restaurant's router for all thermal printers. Enter the static IP in **Settings > Printer > Printer address**.

