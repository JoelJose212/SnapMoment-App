import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Eye, EyeOff, Globe, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { isNative, getWebUrl } from '../lib/platform'
import { Browser } from '@capacitor/browser'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'photographer' | 'admin'>('photographer')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please enter your credentials')
      return
    }
    setLoading(true)
    try {
      const res = role === 'admin'
        ? await authApi.adminLogin(form)
        : await authApi.login(form)
      
      const { access_token, role: userRole, user_id, full_name, onboarding_step, subscription_active } = res.data
      setAuth(access_token, userRole, user_id, full_name, onboarding_step, subscription_active)
      
      toast.success(`Welcome back, ${full_name}!`)
      navigate(userRole === 'admin' ? '/admin' : '/photographer/events')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupRedirect = async () => {
    if (isNative) {
      // In native app, photographers must complete signup on the web
      await Browser.open({ url: `${getWebUrl()}/signup` })
    } else {
      navigate('/signup')
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 aurora-bg opacity-20 blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-0 left-0 w-full h-full noise-overlay opacity-[0.03] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 z-10"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-[2rem] aurora-bg flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Camera size={32} color="white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground" style={{ fontFamily: '"Plus Jakarta Sans"' }}>
            SnapMoment
          </h1>
          <p className="text-muted font-medium mt-2">Professional Imaging Suite</p>
        </div>

        {/* Role Selector */}
        <div className="flex p-1.5 rounded-2xl bg-card border border-border/50">
          {(['photographer', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest ${
                role === r ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-muted hover:text-foreground'
              }`}
            >
              {r === 'admin' ? <Shield size={16} /> : <Camera size={16} />}
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Terminal ID (Email)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-border/40 bg-card text-foreground focus:border-primary outline-none transition-all shadow-sm focus:shadow-md"
              placeholder={role === 'admin' ? 'admin@snapmoment.app' : 'operator@studio.com'}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Access Key</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-border/40 bg-card text-foreground focus:border-primary outline-none transition-all shadow-sm focus:shadow-md pr-14"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPw(!showPw)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-2"
              >
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] text-white aurora-bg transition-all hover:shadow-2xl hover:shadow-primary/40 disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-background px-4 text-muted font-bold">New Operators</span></div>
          </div>
          
          <button
            onClick={handleSignupRedirect}
            className="w-full py-4 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all group"
          >
            {isNative ? <Globe size={18} /> : null}
            {isNative ? 'Join Platform via Website' : 'Create Photographer Account'}
          </button>
        </div>

        {role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center"
          >
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Station Status</p>
            <p className="text-xs font-semibold text-primary">Standard Admin Credentials Required</p>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Branding */}
      <footer className="mt-auto pt-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted/30">
        &copy; 2024 SnapMoment &bull; Global Operations
      </footer>
    </div>
  )
}
