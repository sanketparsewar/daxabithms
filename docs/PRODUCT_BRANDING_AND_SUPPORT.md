# DaxabitHMS: Product Branding & Support Configuration

This guide details how restaurant owners can customize product branding, set up white-label logos, and configure support channels for staff in **DaxabitHMS**.

---

## 1. White-Label Branding Philosophy

DaxabitHMS is designed as an operator-first, white-label restaurant and hotel system:
- **Your Restaurant Brand Leads**: The operator's business name and custom logo take the prime visual spot on the desktop sidebar header, mobile nav bar, and customer display screen.
- **Customer Receipts**: Receipts prominently display the restaurant's trade name, legal entity, address, phone number, and tax ID, without intrusive third-party watermarks.
- **Product Mark**: The DaxabitHMS mark is placed respectfully in a small credit footer (`BrandFooter`) at the bottom of the navigation bar.

---

## 2. Configuring Custom Brand Assets (`/settings`)

### A. Restaurant Logo
1. Navigate to **Settings** (`/settings`).
2. In the **Restaurant Information** card, click **Upload Logo**.
3. Select a PNG, SVG, or JPEG image (recommended size: `512 × 512 px`, transparent background).
4. Click **Save Settings**.
5. The logo automatically updates across:
   - POS terminal header
   - Customer-facing payment display (`/customer-display`)
   - Online QR ordering landing page
   - Thermal receipt headers (converted to monochrome bitmap)

### B. Receipt Header & Footer Customization
- **Receipt Header**:
  - Line 1: Restaurant Name (Bold, double height)
  - Line 2: Legal Entity Name & Branch Address
  - Line 3: GSTIN / NIF / Tax ID
  - Line 4: Contact Phone & Wi-Fi Password (optional)
- **Receipt Footer**:
  - Custom greeting (e.g. *"Thank you for dining with us! Please visit again."*)
  - Return / feedback policy
  - FSSAI License Number (for Indian restaurants) or Commercial Register Number

---

## 3. Support Contact Configuration

Provide your shift managers and staff with a clear escalation path during operational issues:

1. **In-App Support Configuration**:
   - Administrators can configure primary and secondary support contacts in `%PROGRAMDATA%\DaxabitHMS\server\config\server.env` or system settings:
     ```env
     SUPPORT_EMAIL=support@yourrestaurantgroup.com
     SUPPORT_PHONE=+91-98765-43210
     SUPPORT_PORTAL_URL=https://help.yourrestaurant.com
     ```
2. **Staff Help Screen**:
   - Staff clicking the Help icon in the bottom sidebar view the configured direct phone number for the on-duty IT manager or authorized system integrator.

---

## 4. Operational Support Escalation Matrix

| Priority Level | Example Scenario | Target Response Time | Contact Method |
| :--- | :--- | :--- | :--- |
| **P1 - Critical Blocker** | Entire server offline, database down, live billing halted | **< 15 minutes** | Direct phone call to on-duty IT lead |
| **P2 - Degraded Service** | Kitchen thermal printer offline (KDS screen operational) | **< 1 hour** | Phone / WhatsApp emergency group |
| **P3 - Minor Issue** | Recipe costing correction, staff PIN reset, report query | **< 24 hours** | Support email / ticketing portal |
| **P4 - Feature Request** | New report format, custom modifier rule | **Next Release** | Product backlog review |

