# Windows Desktop Services

The former Windows LAN server installation has been retired. The supported Windows package is the local desktop application described in [Windows Desktop Installation](WINDOWS_CLIENT_INSTALLATION.md).

The desktop bundle still contains separate Node.js/NestJS backend and Next.js frontend components, plus PostgreSQL. It runs them on `127.0.0.1` for the desktop app only. It does not configure Windows Firewall rules or offer thin-client access from tablets and other PCs.
