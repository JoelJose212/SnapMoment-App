import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CustomCursor from './components/shared/CustomCursor'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { isNative } from './lib/platform'

// Pages
import HomePage from './pages/HomePage'
import DemoPage from './pages/DemoPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import PricingPage from './pages/PricingPage'

// Guest flow
import EventLandingPage from './pages/guest/EventLandingPage'
import OTPPage from './pages/guest/OTPPage'
import SelfiePage from './pages/guest/SelfiePage'
import GalleryPage from './pages/guest/GalleryPage'

// Photographer
import PhotographerLayout from './pages/photographer/PhotographerLayout'
import PhotographerEvents from './pages/photographer/PhotographerEvents'
import PhotographerUpload from './pages/photographer/PhotographerUpload'
import PhotographerQR from './pages/photographer/PhotographerQR'
import PhotographerAnalytics from './pages/photographer/PhotographerAnalytics'
import PhotographerProfile from './pages/photographer/PhotographerProfile'
import OnboardingWizard from './pages/photographer/OnboardingWizard'
import VIPMonitor from './pages/photographer/VIPMonitor'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPhotographers from './pages/admin/AdminPhotographers'
import AdminEvents from './pages/admin/AdminEvents'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminMessages from './pages/admin/AdminMessages'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminSettings from './pages/admin/AdminSettings'
import { ThemeProvider } from './components/shared/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <CustomCursor />
      <Routes>
        {/* Public & Redirect Logic */}
        <Route path="/" element={isNative ? <Navigate to="/login" replace /> : <HomePage />} />
        <Route path="/demo" element={isNative ? <Navigate to="/login" replace /> : <DemoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={isNative ? <Navigate to="/login" replace /> : <SignupPage />} />
        <Route path="/about" element={isNative ? <Navigate to="/login" replace /> : <AboutPage />} />
        <Route path="/contact" element={isNative ? <Navigate to="/login" replace /> : <ContactPage />} />
        <Route path="/pricing" element={isNative ? <Navigate to="/login" replace /> : <PricingPage />} />

        {/* Guest flow */}
        <Route path="/event/:token" element={<EventLandingPage />} />
        <Route path="/event/:token/otp" element={<OTPPage />} />
        <Route path="/event/:token/selfie" element={<SelfiePage />} />
        <Route path="/event/:token/gallery" element={<GalleryPage />} />

        {/* Onboarding - protected but not dashboard */}
        <Route path="/onboarding" element={<ProtectedRoute requiredRole="photographer"><OnboardingWizard /></ProtectedRoute>} />

        {/* Photographer - protected */}
        <Route path="/photographer" element={<ProtectedRoute requiredRole="photographer"><PhotographerLayout /></ProtectedRoute>}>
          <Route index element={<PhotographerEvents />} />
          <Route path="events" element={<PhotographerEvents />} />
          <Route path="events/:id/upload" element={<PhotographerUpload />} />
          <Route path="events/:id/qr" element={<PhotographerQR />} />
          <Route path="events/:id/vips" element={<VIPMonitor />} />
          <Route path="analytics" element={<PhotographerAnalytics />} />
          <Route path="profile" element={<PhotographerProfile />} />
        </Route>

        {/* Admin - protected */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="photographers" element={<AdminPhotographers />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
