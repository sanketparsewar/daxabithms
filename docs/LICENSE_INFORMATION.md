# DaxabitHMS: License Information & AGPL-3.0 Compliance Guide

This document clarifies the legal obligations, commercial use permissions, and compliance requirements under the **GNU Affero General Public License Version 3 (AGPL-3.0)** governing **DaxabitHMS**.

---

## 1. Primary License Terms

DaxabitHMS is licensed under the **GNU Affero General Public License Version 3 (AGPL-3.0)** as published by the Free Software Foundation.

A complete, unaltered copy of the license is located in the root repository directory:
[LICENSE](file:///d:/daxabithms/LICENSE)

> [!IMPORTANT]
> **License Preservation Rule**: Do not remove, alter, or silently change the existing AGPL-3.0 license when distributing or deploying this codebase. Any derivative work or modified version must remain licensed under AGPL-3.0 or compatible copyleft licenses.

---

## 2. AGPL-3.0 Key Obligations Explained

The AGPL-3.0 was specifically drafted for server and cloud software to guarantee software freedom when applications are accessed over a network.

### A. Commercial On-Premise Use in Restaurants
* **Permitted**: A restaurant owner or company may freely download, install, self-host, and use DaxabitHMS for their internal restaurant operations (commercial food sales, table management, inventory, and payroll) without paying software royalties or licensing fees.
* **Internal Modifications**: A restaurant business may modify the software for internal private use without publishing source code, provided they do not distribute copies or offer network access to third parties outside their organization.

### B. Remote Network Interaction (Section 13)
* **The Network Copyleft Trigger**: Under Section 13 of AGPL-3.0, if you modify DaxabitHMS and host it on a network (such as offering a hosted multi-tenant Software-as-a-Service / SaaS platform to third-party restaurant clients):
  * You **must make the complete Corresponding Source code of your modified version available** to all users interacting with the software remotely through the computer network.
  * You must provide a prominent, accessible mechanism (e.g., a "Download Source Code" link in the application interface) offering the source code at no charge under the terms of the AGPL-3.0.

### C. Distribution of Modified Binaries
* If you distribute compiled packages (e.g. customized `.msi`, `.msix`, or `Setup.exe` installers) to other companies or franchises:
  * You must accompany the binaries with the complete machine-readable source code, or provide a written offer valid for at least three years to furnish the source code under AGPL-3.0.
  * You must retain all copyright notices, author credits, and license headers.

---

## 3. What You Can and Cannot Do

| Activity | Permitted under AGPL-3.0? | Conditions / Requirements |
| :--- | :---: | :--- |
| **Run in your own restaurant(s)** | ✅ **YES** | No requirement to publish code. Free for commercial operations. |
| **Charge for setup & hardware support** | ✅ **YES** | You may sell consulting, hardware, installation, and training services. |
| **Modify source code for your restaurant** | ✅ **YES** | If kept internal to your organization, no publication required. |
| **Host as a public commercial SaaS** | ✅ **YES** | **Must provide source code of your modified version to users** under Section 13. |
| **Silently close the source code** | ❌ **NO** | You cannot take AGPL-3.0 code, add features, and distribute it as closed proprietary software. |
| **Strip copyright headers or license** | ❌ **NO** | Copyright headers and license files must be preserved in full. |

---

## 4. Legal Disclaimers & Professional Consultation

* **Software Provided "As Is"**: The software is provided without warranty of any kind, either expressed or implied, including the implied warranties of merchantability and fitness for a particular purpose, as set forth in Sections 15 and 16 of the AGPL-3.0.
* **Statutory Compliance**: While DaxabitHMS provides technical mechanisms for GST, VERI*FACTU, and data privacy, restaurant owners and system deployers must consult with certified tax accountants, legal counsel, and compliance professionals in their respective jurisdictions to verify statutory compliance.

