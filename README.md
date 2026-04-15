# 📸 SnapMoment

**Elevate Your Event Photography with AI-Powered Magic**

SnapMoment is a professional-grade, full-stack event photography platform designed to transform how photographers deliver photos and how guests experience memories. Leveraging cutting-edge AI for facial recognition and seamless mobile integration, SnapMoment ensures that every guest finds their perfect shot instantly.

---

## 🚀 Key Features

### 🤖 AI-Powered Facial Recognition
- **Instant Matching:** Guests can find all photos they appear in by simply uploading a selfie or using the live capture UI.
- **MediaPipe Integration:** High-performance, client-side vision tasks for robust and private face matching.

### 📸 Professional Photographer Suite
- **Live RAW Tethering:** Real-time photo syncing from professional cameras directly to the platform.
- **Sequential Batch Uploads:** Optimized handling for large event datasets (6GB+) with full system stability.
- **Event Dashboard:** Comprehensive management of galleries, uploads, and event-specific settings.

### 💳 Business & Billing
- **Automated Invoicing:** Integrated with Stripe and Razorpay for seamless photographer onboarding and subscription management.
- **Subscription Tiers:** Flexible plans (Free, Pro, Studio) tailored to photographers of all scales.
- **SMTP Integration:** Automated delivery of professional invoices via Gmail.

### 📱 Premium Mobile Experience
- **Capacitor-Powered:** Cross-platform performance (Android/iOS) with native camera and filesystem access.
- **Glassmorphic UI:** A modern, high-end design aesthetic that provides a premium feel for both photographers and guests.
- **Event Access Kit:** Print-ready QR codes and digital access kits for easy guest onboarding.

---

## 🛠 Tech Stack

### Frontend & Mobile
- **Core:** [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Mobile Bridge:** [Capacitor](https://capacitorjs.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### State & Logic
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Form Validation:** [Zod](https://zod.dev/)
- **API Client:** [Axios](https://axios-http.com/)

### AI & Infrastructure
- **Vision Tasks:** [@mediapipe/tasks-vision](https://developers.google.com/mediapipe)
- **Payments:** [Stripe](https://stripe.com/) / [Razorpay](https://razorpay.com/)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JoelJose212/SnapMoment-App.git
   cd SnapMoment-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and configure your API URL:
   ```env
   VITE_API_URL=http://your-machine-ip:8000
   ```
   *Note: Use `10.0.2.2` if testing on an Android Emulator.*

4. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 📱 Mobile Development

### Build and Sync
To synchronize your web build with the native platforms:
```bash
npm run cap:build
```

### Run on Android
Open the project in Android Studio:
```bash
npm run android:open
```

---

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Library initializations (axios, stripe)
├── pages/          # Feature-specific views
│   ├── admin/      # Platform management
│   ├── guest/      # Guest photo discovery
│   └── photographer/ # Dashboard and event management
├── store/          # Zustand global state
├── App.tsx         # Main routing and layout
└── main.tsx        # Application entry point
```

---

## 📜 Available Scripts

- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run cap:build`: Build and sync with Capacitor.
- `npm run android:open`: Open Android Studio project.

---

Built with ❤️ for photographers and memory-makers.
