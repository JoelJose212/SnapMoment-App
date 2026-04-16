import { Battery, Zap, HardDrive, Wifi, WifiOff, Activity, Cpu, UserCheck, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getQueue, startSync } from '../../lib/queue'
import { useVIPStore } from '../../store/vipStore'

export default function MissionControl() {
  const [battery, setBattery] = useState<{ level?: number; isCharging?: boolean }>({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueCount, setQueueCount] = useState(0)
  const { vips } = useVIPStore()

  const missingVips = vips.filter(v => {
    if (!v.lastSeenAt) return true
    return (Date.now() - v.lastSeenAt) > (30 * 60 * 1000)
  })

  useEffect(() => {
    const updateStats = async () => {
      try {
        // Battery
        const b = await Device.getBatteryInfo()
        setBattery({ level: b.batteryLevel, isCharging: b.isCharging })

        // Storage (Android/iOS only typically, fallback for web)
        try {
          // This API might vary by platform, but Capacitor Filesystem provides basic info
          // We simulate/estimate for now if not available
        } catch {}

        // Queue
        const q = await getQueue()
        setQueueCount(q.length)
        if (q.length > 0 && navigator.onLine) {
          startSync(setQueueCount)
        }
      } catch (e) {
        console.warn('Mission Control: Some hardware telemetry unavailable')
      }
    }

    const interval = setInterval(updateStats, 5000)
    updateStats()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const batteryColor = (battery.level ?? 1) > 0.2 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 mb-6 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-primary/5 animate-pulse -z-10" />
      
      {/* Neural Link Status */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
        <Activity size={16} className="text-primary animate-spin-slow" />
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted block leading-none">Neural Link</span>
          <span className="text-xs font-bold text-foreground">Active Hub v4.0</span>
        </div>
      </div>

      {/* Connection */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
        {isOnline ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted block leading-none">Network</span>
          <span className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOnline ? 'Direct Grid' : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Battery */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
        <div className="relative">
          <Battery size={16} className={batteryColor} />
          {battery.isCharging && <Zap size={8} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />}
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted block leading-none">Power</span>
          <span className={`text-xs font-bold ${batteryColor}`}>
            {battery.level !== undefined ? `${Math.round(battery.level * 100)}%` : 'DC Input'}
          </span>
        </div>
      </div>

      {/* Neural Queue (Crucial for Offline Support) */}
      <AnimatePresence>
        {queueCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10"
          >
            <Cpu size={16} className="text-primary animate-pulse" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block leading-none">Sync Queue</span>
              <span className="text-xs font-black text-foreground">
                {queueCount} Frames Pending
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIP Status */}
      <AnimatePresence>
        {vips.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
              missingVips.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            {missingVips.length > 0 ? (
              <AlertCircle size={16} className="text-red-400 animate-pulse" />
            ) : (
              <UserCheck size={16} className="text-emerald-400" />
            )}
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest block leading-none ${
                missingVips.length > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                VIP Status
              </span>
              <span className="text-xs font-bold text-foreground">
                {missingVips.length > 0 ? `${missingVips.length} Missing Target(s)` : 'All Targets Captured'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branding / Motto */}
      <div className="ml-auto hidden md:flex items-center gap-2 opacity-30 pr-2 grayscale">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground">Mission Critical Operations</span>
      </div>
    </div>
  )
}
