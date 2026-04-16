# 📸 SnapMoment: Elite Edition

**The World's Most Intelligent AI Event Photography Operating System.**

SnapMoment is a professional-grade, "Intelligence-First" event photography platform designed for high-stakes operational reliability. Unlike standard gallery apps, SnapMoment targets the hardware monitoring and real-time AI processing required by professional photographers at weddings, corporate galas, and global events.

---

## 🚀 Elite Operational Features

### 🛡️ VIP Neural Guard (Missing Guest AI)
**Never miss a critical moment.** Our on-device AI monitors coverage for your most important guests in real-time.
-   **Neural Registration**: Snaps a reference photo of VIPs (Bride, Groom, VIPs) to calculate unique 512-dim face vectors.
-   **Coverage Mapping**: Every captured frame is cross-referenced against your VIP list on the fly.
-   **Intelligence Alerts**: Active background monitoring alerts the photographer via local device notifications if a VIP hasn't been captured in over 30 minutes.

### 🌪️ Neural Offline Queue
**High-speed ingestion without network bottlenecks.**
-   **Persistent Local Cache**: Uses **IndexedDB** to store image blobs and AI vectors locally when the "Grid" is offline.
-   **Background Auto-Sync**: Ingest photos instantly and move on; the app intelligently synchronizes data to the cloud in the background with automatic retry logic.
-   **Reliability First**: Photos persist even if the device restarts or the app is closed mid-sync.

### 🕹️ Mission Control Dashboard
**Real-time telemetry for professional peace-of-mind.**
-   **Hardware Health**: Live monitoring of battery levels, charging status, and network strength (Direct Grid vs. Offline Mode).
-   **Sync Pulse**: A visual telemetry indicator showing the depth of your neural sync queue.
-   **VIP Status Indicator**: At-a-glance health check of your VIP coverage targets.

### 🖨️ Wireless Print Station
**Instant physical distribution directly from your mobile hub.**
-   **One-Tap Printing**: Send high-res, watermarked photos to any connected wireless printer (AirPrint/Mopria) directly from the sync grid.
-   **Guest Print Requests**: (Beta) Enable guests to request physical commemorative prints from the web gallery.

---

## 🛠 Tech Stack

### Elite Edge Computing
-   **On-Device AI:** [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) (BlazeFace / Face Detection)
-   **Face Embedding:** Custom on-device 512-dimension vector calculation.
-   **Local Database:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb`) for persistent queueing.

### Native Mobile Bridge
-   **Core:** [Capacitor 8](https://capacitorjs.com/)
-   **Hardware Access:** `@capacitor/device` (Power/Health), `@capacitor/filesystem` (Local storage), `@capacitor/local-notifications` (Intelligence alerts).
-   **UI Engine:** [React 18](https://reactjs.org/) + [Framer Motion](https://www.framer.com/motion/) (Glassmorphic HUD aesthetic).

### Infrastructure
-   **State Management:** [Zustand](https://github.com/pmndrs/zustand) with persistence.
-   **Data Sync:** [TanStack Query](https://tanstack.com/query/latest) + Custom Neural Queue logic.
-   **Billing:** Stripe & Razorpay (Managed via Web Dashboard).

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (for native mobile builds)
- [idb](https://www.npmjs.com/package/idb) for data persistence.

### Setup Protocol

1. **Clone & Initialize:**
   ```bash
   git clone https://github.com/JoelJose212/SnapMoment-App.git
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file for your machine's local IP (for mobile synchronization):
   ```env
   VITE_API_URL=http://your-machine-ip:8000
   ```

3. **Elite Build Sync:**
   To synchronize the web build with your Android/iOS devices:
   ```bash
   npm run cap:build
   ```

4. **Launch Mission Control:**
   ```bash
   npm run dev
   ```

---

## 📂 Elite Directory Mapping

```text
src/
├── components/
│   └── photographer/ # Mission Control components
├── lib/
│   ├── ai.ts        # On-device Neural Engine
│   └── queue.ts     # Persistent Sync Queue logic
├── store/           # Zustand Stores (VIP, Auth, Health)
├── pages/
│   └── photographer/
│       ├── PhotographerUpload.ts # Elite Ingestion Pipeline
│       └── VIPMonitor.ts         # Neural Guard Dashboard
└── App.tsx          # Platform-aware Routing
```

---

## 📜 Standard Operating Procedures (Scripts)

- `npm run dev`: Boot local development environment.
- `npm run cap:build`: Full sync of web artifacts to native mobile platforms.
- `npm run android:open`: Deploy to Android Studio for hardware testing.

---

Built for the **next generation** of professional photographers.
