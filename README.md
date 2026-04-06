# Linux System Monitor Dashboard

A modern, real-time system monitoring dashboard built with **Next.js**, **Material UI**, and **Node.js**. Works on any Linux distribution.

![Dashboard](public/screenshots/dashboard-dark-new.jpg)

## Features

- **Real-Time Monitoring**: Live CPU, Memory, Temperature, Network I/O via WebSocket
- **Docker Management**: View containers, stats, logs; start/stop containers
- **Process Manager**: Full process list with search, sort, kill capability
- **Storage Manager**: Browse filesystems, view usage, edit text files
- **Network Tools**: Ping and DNS lookup
- **Cron Manager**: View, add, edit, delete cron jobs
- **Terminal**: Secure command runner with rate limiting
- **Packages**: System package management
- **Services**: Systemd services management
- **Logs**: System logs viewer
- **Historical Data**: SQLite-backed metrics (1h, 6h, 24h, 7d)
- **Authentication**: System credentials (same as SSH login)
- **Dark/Light Mode**: Toggleable themes

## Quick Start

### Prerequisites
- Node.js 20+
- npm
- Linux system with user accounts

### Installation

```bash
git clone https://github.com/your-repo/linux-system-monitor.git
cd linux-system-monitor
npm install
```

### Run

```bash
# Development
npm run dev

# Access at http://localhost:3000
# Login with your Linux username and password (same as SSH)
```

### Production

```bash
npm run build
PORT=3000 JWT_SECRET=$(openssl rand -hex 32) node .next/standalone/server.js
```

## Docker

```bash
docker compose up -d --build
```

## Authentication

The dashboard uses your Linux system credentials - the same username/password you use for SSH.

### How it works:
1. Enter your Linux username (e.g., `pi`, `admin`)
2. Enter your Linux password
3. The dashboard uses `su` command to verify your credentials

### Permissions

The verification script needs root access to verify passwords:

```bash
# Make sure verify_su.sh is executable
chmod +x verify_su.sh
```

For Docker, ensure the container runs with appropriate privileges or mount `/etc/shadow` readable.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT secret (REQUIRED in production) | Auto-generated |
| `DEV_AUTH` | Dev auth `user:pass` | Disabled |
| `VERIFY_SCRIPT` | Password verification script | `./verify_su.sh` |
| `DB_PATH` | SQLite database path | `./data/metrics.db` |

## Menu Items

- **Overview** - Dashboard with system stats
- **Processes** - Running processes
- **Docker** - Container management
- **Terminal** - Command runner
- **Cron** - Cron job manager
- **Packages** - Package management
- **Services** - Systemd services
- **Storage** - Filesystem browser
- **Network** - Network tools
- **Logs** - System logs
- **Settings** - Dashboard settings
- **Help** - Documentation

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: Material UI
- **Charts**: Recharts
- **System Info**: systeminformation
- **Database**: SQLite
- **WebSocket**: ws
- **Auth**: jose

## Supported Systems

- Raspberry Pi OS
- Ubuntu/Debian
- CentOS/RHEL
- Any Linux with glibc

## License

MIT
