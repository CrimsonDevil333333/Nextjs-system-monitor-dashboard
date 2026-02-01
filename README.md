# Next.js System Monitor Dashboard

A modern, real-time system monitoring dashboard built with **Next.js**, **Material UI**, and **Node.js**. Designed for Raspberry Pi and Linux servers to provide a beautiful, responsive interface for tracking system resources, Docker containers, and processes.

![Dashboard Preview](https://i.imgur.com/your-preview-image.png)

## 🚀 Features

- **Real-Time Monitoring**: Live tracking of CPU usage, Memory, Temperature, and Network Traffic.
- **Docker Integration**: 
  - View running/stopped containers.
  - Real-time CPU & Memory usage per container.
  - **Live Logs** viewer for containers.
  - Start/Stop status indicators.
  - Search and Sort capabilities.
- **Process Manager**: Top 5 CPU consumers on dashboard + dedicated full process list.
- **Visual History**: Interactive area graphs for CPU and Memory history.
- **Storage Analysis**: Monitor physical drives and virtual mounts (RAM disks, etc.).
- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop.
- **Dark/Light Mode**: Toggleable themes saved to local storage.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **System Info**: [systeminformation](https://www.npmjs.com/package/systeminformation)
- **Backend**: Node.js API Routes (Next.js)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/CrimsonDevil333333/Nextjs-system-monitor-dashboard.git
    cd Nextjs-system-monitor-dashboard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev -- -p 9123
    ```
    Access at `http://localhost:9123`

4.  **Build for Production**
    ```bash
    npm run build
    npm start -- -p 9123
    ```

## 🐳 Docker Support

To allow the dashboard to read Docker stats and logs, the user running the Node.js process must have permissions to access the Docker socket.

```bash
sudo usermod -aG docker $USER
# You may need to restart your session or reboot
```

## 📱 Screenshots

| Dashboard | Docker Logs | Mobile View |
|-----------|-------------|-------------|
| *(Add screenshots here)* | *(Add screenshots here)* | *(Add screenshots here)* |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
