import { useEffect, useState } from 'react'
import { Device } from '@capacitor/device'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MoreHorizontal, Battery, Wifi, UserCheck, AlertCircle } from 'lucide-react'
import { useVIPStore } from '../../store/vipStore'
import { getQueue } from '../../lib/queue'

export default function MissionControl() {
  const [battery, setBattery] = useState<{ level?: number; isCharging?: boolean }>({})
  const [queueCount, setQueueCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { vips } = useVIPStore()

  useEffect(() => {
    const updateStats = async () => {
      try {
        const b = await Device.getBatteryInfo()
        setBattery({ level: b.batteryLevel, isCharging: b.isCharging })
        const q = await getQueue()
        setQueueCount(q.length)
      } catch (e) {
        setBattery({ level: 0.85, isCharging: false }) // Fallback for simulation
      }
    }
    const interval = setInterval(updateStats, 5000)
    updateStats()

    const handleConn = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleConn)
    window.addEventListener('offline', handleConn)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleConn)
      window.removeEventListener('offline', handleConn)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto pb-10">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 pt-2">
        <button className="w-10 h-10 rounded-xl glass-elite flex items-center justify-center">
          <MoreHorizontal className="text-muted" size={20} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Mission Control</h1>
        <button className="w-10 h-10 rounded-xl glass-elite flex items-center justify-center relative">
          <Bell className="text-muted" size={20} />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        </button>
      </div>

      {/* ── Neural Link Component ────────────────────────────────────────── */}
      <div className="glass-elite rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Neural Link</span>
          <MoreHorizontal className="text-muted opacity-40" size={16} />
        </div>

        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          {/* Animated Rings */}
          <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 border-t-2 border-primary rounded-full opacity-40"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 border-r-2 border-[#6366F1] rounded-full opacity-60"
          />
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-10 border-2 border-primary/20 rounded-full"
          />
          
          <div className="text-center z-10">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1">Hashing</span>
            <div className="text-3xl font-black text-foreground tabular-nums">512</div>
            <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Vector Sync</span>
          </div>

          {/* Glowing Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_var(--primary)]" />
        </div>
      </div>

      {/* ── Hardware Telemetry Pill ─────────────────────────────────────── */}
      <div className="px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 block px-1">Hardware Telemetry</span>
        <div className="glass-elite rounded-full p-1.5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-3 border border-white/5 shadow-inner">
            <div className="relative w-8 h-4 border border-primary/40 rounded-[4px] p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(battery.level ?? 0.85) * 100}%` }}
                className={`h-full rounded-[1px] ${ (battery.level ?? 1) > 0.2 ? 'bg-primary' : 'bg-red-500' }`}
              />
              <div className="absolute top-1 -right-1.5 w-1 h-2 bg-primary/40 rounded-r-sm" />
            </div>
            <span className="text-sm font-black tabular-nums">{Math.round((battery.level ?? 0.85) * 100)}%</span>
          </div>

          <div className="flex items-center gap-4 px-6">
            <div className="flex items-end gap-[2px] h-3">
              {[0.4, 0.6, 0.8, 1].map((h, i) => (
                <div key={i} className={`w-[3px] rounded-full ${isOnline ? 'bg-primary' : 'bg-muted/30'}`} style={{ height: `${h * 100}%` }} />
              ))}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${isOnline ? 'text-foreground' : 'text-muted'}`}>5G</span>
          </div>
        </div>
      </div>

      {/* ── VIP Monitor Grid ────────────────────────────────────────────── */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">VIP Monitor</span>
          <MoreHorizontal className="text-muted opacity-40" size={16} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {vips.slice(0, 4).map((vip) => (
            <motion.div 
              key={vip.id}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group shadow-2xl"
            >
              <img src={vip.referenceImageUrl} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              
              {/* Border logic based on capture status */}
              <div className={`absolute inset-0 border-2 rounded-[2rem] pointer-events-none ${
                (vip.lastSeenAt && Date.now() - vip.lastSeenAt < 30 * 60 * 1000) ? 'border-primary/50' : 'border-red-500/30'
              }`} />

              <div className="absolute bottom-4 inset-x-4">
                <div className={`w-full py-2 px-1 rounded-xl glass-elite text-center border-white/20`}>
                   <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                      (vip.lastSeenAt && Date.now() - vip.lastSeenAt < 30 * 60 * 1000) ? 'text-primary' : 'text-red-400'
                   }`}>
                      {(vip.lastSeenAt && Date.now() - vip.lastSeenAt < 30 * 60 * 1000) ? 'Captured' : 'Missing'}
                   </span>
                </div>
              </div>
            </motion.div>
          ))}

          {vips.length === 0 && (
            <div className="col-span-full py-10 glass-elite rounded-[2rem] flex flex-col items-center justify-center opacity-40 italic">
               <UserCheck size={32} className="mb-2" />
               <span className="text-[10px] uppercase font-black tracking-widest">Awaiting Targets...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
