<div align="center">
  <h1>CRYBRUH</h1>
  <p><b>Advanced Decentralized Browser Architecture</b></p>
  <p>Developed by <b>Студия CRYTEAM</b></p>
</div>

<br />

## Overview

CRYBRUH is a next-generation decentralized browser shell engineered to maximize user privacy, isolation, and access to distributed networks. The architecture leverages Electron for desktop OS integration and React for the dynamic rendering engine, implementing robust routing protocols including IPFS, Tor, and VLESS proxy capabilities.

## System Architecture

The core runs on a containerized or native dual-layer architecture:

1. **Primary Layer (Native/Container):** Electron main process managing system resources, native integrations, and isolated webviews. Alternatively, operates via Node.js/Express in a containerized web environment.
2. **Secondary Layer (Renderer):** React-based interface providing the shell environment, proxy node management, and cryptographic password vaults utilizing standard hashing algorithms (Bcrypt) backed by localized SQLite clusters.

### Core Capabilities

* **Network Isolation:** Telemetry blocking logic combined with experimental WebContainer proxy implementations.
* **Decentralized Resolving:** Integrated support for `.onion` routing and `ipfs://` protocol resolving.
* **VLESS Proxy Runtime:** Real-time configuration and routing manipulation of VLESS / Xray proxy protocols.
* **Secure Vault:** Cryptographically isolated SQLite execution for sensitive credential storage.
* **Analytics Engine:** Real-time telemetry monitoring for inbound and outbound traffic routing metrics.

## CI/CD and Release Automation

The continuous integration and continuous deployment pipelines are fully automated via GitHub Actions.

The repository is configured to **automatically draft and publish releases**. By applying a semantic version tag (e.g., `v1.0.0`) and pushing it to the repository, the `build-desktop.yml` workflow will initiate. It automatically compiles binaries for Windows, macOS, and Linux platforms and attaches them to an official GitHub Release.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Containerization Lifecycle

The repository ships with Docker configuration files tailored for web-environment deployment and orchestration.

### Build and Initialization

```bash
# Compile and build the container image
docker-compose build

# Initialize detached instance
docker-compose up -d
```

## Technical Specifications

| Component | Technology | Version |
| :--- | :--- | :--- |
| Core Runtime | Node.js / Electron | >= 20.x |
| Rendering Engine | React (Vite Build System) | >= 18.x |
| Styling Framework | Tailwind CSS | >= 3.x |
| CD Pipeline Builder | action-electron-builder | v1.x |

## Local Compilation

### Prerequisites
Node.js 20.x or higher must be installed in your environment.

### Scripts Execution

```bash
# Initialize dependencies
npm install

# Compile standard web distribution
npm run build

# Execute cross-platform Electron build
npm run build:electron
```

---
<div align="center">
  <p><code>Copyright © Студия CRYTEAM. All rights reserved.</code></p>
</div>
