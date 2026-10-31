# DaxabitHMS: Version Information & Lifecycle Policy

This document defines the versioning scheme, compatibility contracts, and release lifecycle policies for **DaxabitHMS**.

---

## 1. Semantic Versioning Specification (SemVer 2.0.0)

DaxabitHMS adheres strictly to **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):

```
       v 2 . 1 . 4
         │   │   └── PATCH: Backward-compatible bug fixes, UI polish, thermal printer tweaks
         │   └────── MINOR: Backward-compatible new features (new reports, KDS stations, UPI modes)
         └────────── MAJOR: Breaking database schema changes, protocol updates, or API redesigns
```

- **MAJOR**: Incompatible API changes, major Prisma migrations requiring data transformation, or client-server protocol shifts.
- **MINOR**: Additions in functionality in a backward-compatible manner (e.g. adding a new export format, new modifier rule).
- **PATCH**: Backward-compatible bug fixes, performance optimizations, and security patches.

---

## 2. Version Discovery & Gating Endpoints

Daxabit provides unauthenticated public version query endpoints:

### `GET /api/v1/system/version`
Returns the active server version and minimum supported client versions:
```json
{
  "serverVersion": "1.0.0",
  "minClientVersion": "1.0.0",
  "recommendedClientVersion": "1.0.0",
  "environment": "production"
}
```

### `GET /api/v1/system/compatibility?clientVersion=1.0.0`
Evaluates whether a connecting desktop or mobile client can safely operate with the server:
```json
{
  "compatible": true,
  "clientVersion": "1.0.0",
  "serverVersion": "1.0.0",
  "requiresUpdate": false
}
```

If `compatible: false` is returned, the Windows desktop client prevents silent corrupted billing and presents the user with an explicit update prompt.

---

## 3. Client & Server Compatibility Contract

| Scenario | Server Version | Client Version | Status | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Match** | `1.2.0` | `1.2.0` | 🟢 Fully Compatible | None. |
| **Minor Difference** | `1.2.5` | `1.2.0` | 🟢 Compatible | Client may lack latest UI improvements. |
| **Major Discrepancy**| `2.0.0` | `1.2.0` | 🔴 Blocked | Client must be updated before operating. |

---

## 4. Release History & Active Branches

| Release | Release Date | Status | Database Schema Version | Minimum Supported Client |
| :--- | :--- | :--- | :--- | :--- |
| **v1.0.0 (Initial GA)** | October 2026 | Active Production LTS | `20261031_initial` | `1.0.0` |
| **v1.1.0** | Planned Q1 2027 | In Development | TBD | `1.0.0` |

---

## 5. Security & Hotfix Support Policy

- Critical security vulnerabilities receive hotfix patch releases (`v1.0.x`) within 24–48 hours of verification.
- Database migrations within patch releases are strictly forbidden from dropping tables or changing column types destructively.

