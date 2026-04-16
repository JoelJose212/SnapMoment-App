import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Camera, CalendarDays, BarChart2, User, LogOut, ArrowRight, AlertTriangle, UserCheck, Menu, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import MissionControl from '../../components/photographer/MissionControl'
import { useState } from 'react'

const NAV = [
  { to: '/photographer/events', icon: CalendarDays, label: 'My Events' },
  { to: '/photographer/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/photographer/vips', icon: UserCheck, label: 'VIP Monitor' },
  { to: '/photographer/profile', icon: User, label: 'Profile' },
]

export default function PhotographerLayout() {
  const { fullName, logout, subscriptionActive } = useAuthStore()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen aurora-bg overflow-hidden text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col p-6 z-20">
        <div className="glass-elite h-full rounded-[2.5rem] flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className="p-8 pb-10 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary shadow-[0_0_20px_var(--primary-glow)]">
                <Camera size={20} color="white" />
              </div>
              <div>
                <span className="text-xl font-black block leading-none tracking-tighter">SnapMoment</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-primary mt-1 block">Elite Edition</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 py-8 space-y-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                    isActive ? 'text-white' : 'text-muted hover:text-foreground hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="nav-active" className="absolute inset-0 rounded-2xl bg-primary shadow-[0_0_30px_var(--primary-glow)]" />
                    )}
                    <Icon size={18} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-6 mt-auto">
            <button
              onClick={() => { logout(); navigate('/') }}
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors w-full py-4"
            >
              <LogOut size={14} />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Content */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-background/95 backdrop-blur-3xl z-[101] p-8 lg:hidden border-r border-white/5 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Camera size={24} color="white" />
              </div>
              <span className="text-2xl font-black">SnapMoment</span>
            </div>
            
            <nav className="space-y-4">
               {NAV.map(({ to, icon: Icon, label }) => (
                 <NavLink 
                   key={to} to={to} 
                   onClick={() => setIsSidebarOpen(false)}
                   className="flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-muted hover:text-white hover:bg-white/5"
                 >
                   <Icon size={20} /> {label}
                 </NavLink>
               ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Mobile Top Bar - Only visible on specific paths or overall */}
        <div className="lg:hidden flex items-center justify-between p-6 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-xl glass-elite flex items-center justify-center">
            <Menu size={20} />
          </button>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Elite Hub</span>
             <span className="text-sm font-black">Mission Control</span>
          </div>
          <button className="w-10 h-10 rounded-xl glass-elite flex items-center justify-center relative">
            <Bell size={20} className="text-muted" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-auto p-4 lg:p-10 hide-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {!subscriptionActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle size={24} />
                  <div>
                    <div className="font-black uppercase text-xs tracking-widest">Protocol Restriction</div>
                    <p className="text-xs opacity-70 mt-1">Subscription expired. Reactivate to resume neural operations.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/onboarding')} className="px-6 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 transition-all">Reactivate</button>
              </motion.div>
            )}

            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
