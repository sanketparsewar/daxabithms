# Windows Desktop Installation

DaxabitHMS for Windows is a local desktop application. The MSIX package includes the local PostgreSQL database, the Node.js/NestJS API, and the Next.js interface hosted inside WebView2. It does not connect to a remote server or accept connections from other devices.

## Install

1. Download the DaxabitHMS MSIX package from the project’s [latest release](https://github.com/sanketparsewar/daxabithms/releases/latest).
2. Open the package and complete the Windows install prompt.
3. Launch **DaxabitHMS** from Start.
4. On first launch, wait while the local database and services initialize, then create the owner account in the app.

The first setup requires several gigabytes of free disk space for the bundled runtime and local data. The Microsoft Edge WebView2 Runtime is also required.

## Local data

The desktop app stores its configuration, logs, WebView2 profile, PostgreSQL data, and uploads under `%LOCALAPPDATA%\DaxabitHMS`. Use **File → Remove All Local Data & Uninstall** only when you intend to permanently remove that local business data.

For package build details and diagnostics, see [`windows/msix/README.md`](../windows/msix/README.md).
