# Next.js System Monitor Dashboard 🚀

A modern, high-performance, real-time system monitoring dashboard built with **Next.js 14+**, **Material UI**, and **Node.js**. Specifically optimized for Raspberry Pi 5 and professional Linux server environments.

![Dashboard Preview](public/screenshots/dashboard-dark.jpg)

## ✨ New & Updated Features

- **🎨 Modernized Auth UI**: Sleek glassmorphism login interface with improved validation, backdrop blur effects, and responsive design.
- **🔐 Secure Session Management**: Integrated **Logout** functionality and persistent "Remember Me" support via JWT.
- **⚡ Pi5 Performance Optimization**: 
  - **Standalone Build Mode**: Uses Next.js standalone output to reduce the production footprint from **2GB to ~96MB**.
  - **RAM Disk Friendly**: Designed to run efficiently in volatile high-speed storage environments.
- **📊 Real-Time Monitoring**: Live tracking of CPU usage, Memory pressure, Temperature, and Network I/O.
- **🐳 Container \u0026 Process Management**: 
  - Full Docker integration (Start/Stop/Logs/Stats).
  - Advanced Process Manager with termination capabilities.
- **🛠️ Integrated Tools**: Built-in Network tools (Ping/DNS), Storage Manager (File browser/editor), and a secure Command Runner.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router \u0026 Turbopack)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **System Info**: [systeminformation](https://www.npmjs.com/package/systeminformation)
- **Runtime**: Node.js 20+

## 📦 Quick Start (Production Mode)

1.  **Clone \u0026 Install**
    ```bash
    git clone https://github.com/CrimsonDevil333333/Nextjs-system-monitor-dashboard.git
    cd Nextjs-system-monitor-dashboard
    npm install
    ```

2.  **Build Optimized Standalone**
    ```bash
    npm run build
    ```

3.  **Run Production Server**
    ```bash
    PORT=9123 node .next/standalone/server.js
    ```

## 🤝 Contributing

This project is actively maintained. Contributions, issue reports, and feature requests are welcome!

---
*Maintained by Satyaa \u0026 Clawdy 🦞*
