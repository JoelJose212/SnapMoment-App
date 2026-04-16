import { useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Camera, Trash2, Clock, UserCheck, AlertCircle, Scan, ShieldCheck } from 'lucide-react'
import { useVIPStore } from '../../store/vipStore'
import { scanImage } from '../../lib/ai'
import toast from 'react-hot-toast'

export default function VIPMonitor() {
  const { id: eventId } = useParams()
  const { vips, addVIP, removeVIP, getVIPsByEvent } = useVIPStore()
  
  const [registering, setRegistering] = useState(false)
  const [vipName, setVipName] = useState('')
  const [capturing, setCapturing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const eventVips = getVIPsByEvent(eventId!)

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = s
      if (videoRef.current) videoRef.current.srcObject = s
      setCapturing(true)
    } catch {
      toast.error('Camera access denied')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setCapturing(false)
  }

  const handleRegister = async () => {
    if (!vipName) return toast.error('Enter VIP name')
    
    const video = videoRef.current!
    const canvas = canvasRef.current!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9))
    
    const tid = toast.loading('Calculated Face Vector...')
    try {
      const { vectors } = await scanImage(blob)
      if (vectors.length === 0) throw new Error('No face detected. Try again.')
      
      addVIP({
        id: crypto.randomUUID(),
        name: vipName,
        vector: vectors[0],
        eventId: eventId!,
        referenceImageUrl: canvas.toDataURL('image/jpeg', 0.5),
        lastSeenAt: Date.now()
      })
      
      toast.success(`${vipName} registered for Neural Tracking!`, { id: tid })
      setVipName('')
      setRegistering(false)
      stopCamera()
    } catch (e: any) {
      toast.error(e.message, { id: tid })
    }
  }

  const getStatus = (lastSeen?: number) => {
    if (!lastSeen) return { label: 'Missing', color: 'text-red-400', bg: 'bg-red-400/10' }
    const diff = (Date.now() - lastSeen) / 1000 / 60
    if (diff < 30) return { label: 'Captured', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
    if (diff < 60) return { label: 'Low Exp', color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
    return { label: 'Missing', color: 'text-red-400', bg: 'bg-red-400/10' }
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <ShieldCheck size={14} className="animate-pulse" /> VIP Neural Guard
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: '"Plus Jakarta Sans"' }}>Guest Monitor</h1>
          <p className="text-muted font-medium mt-1">AI-driven coverage intelligence</p>
        </div>

        <button 
          onClick={() => { setRegistering(true); startCamera() }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl aurora-bg text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <UserPlus size={16} /> Register VIP
        </button>
      </header>

      {/* VIP Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventVips.map((vip) => (
          <motion.div 
            key={vip.id}
            layout
            className="glass rounded-[2rem] p-6 border-white/20 relative overflow-hidden group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                <img src={vip.referenceImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-foreground">{vip.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-muted" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Last: {vip.lastSeenAt ? new Date(vip.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {(() => {
                  const s = getStatus(vip.lastSeenAt)
                  return (
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.bg} ${s.color}`}>
                      {s.label}
                    </span>
                  )
                })()}
                <button 
                  onClick={() => removeVIP(vip.id)}
                  className="p-2 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Status Progress Bar */}
            <div className="mt-6 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
               <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ 
                    width: vip.lastSeenAt ? `${Math.max(0, 100 - (Date.now() - vip.lastSeenAt) / (60 * 60 * 1000) * 100)}%` : '0%'
                  }}
                  className={`h-full rounded-full ${getStatus(vip.lastSeenAt).color === 'text-emerald-400' ? 'bg-emerald-400' : 'bg-red-400'}`}
               />
            </div>
          </motion.div>
        ))}

        {eventVips.length === 0 && (
          <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-10">
            <Scan size={48} className="text-white/10 mb-4" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">No VIPs Registered</h3>
            <p className="text-xs text-muted mt-2 max-w-xs">Register important people to start tracking coverage intelligence during the event.</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {registering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-8"
          >
            <div className="w-full max-w-sm space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Register Target</h2>
                <p className="text-xs text-muted font-bold tracking-widest mt-2 uppercase">Neural Link v4.0 Active</p>
              </div>

              <div className="aspect-square rounded-[3rem] overflow-hidden bg-black/40 border-2 border-primary/30 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-48 h-64 border-2 border-white/20 rounded-[5rem] animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="VIP NAME (e.g. Groom)"
                  value={vipName}
                  onChange={(e) => setVipName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-card border border-white/10 text-foreground text-sm font-bold uppercase tracking-widest focus:border-primary outline-none"
                />
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setRegistering(false); stopCamera() }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-muted font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRegister}
                    className="flex-1 py-4 rounded-2xl aurora-bg text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                  >
                    Finalize Vector
                  </button>
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
        <AlertCircle className="text-primary flex-shrink-0" size={20} />
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Intelligence Advisory</h4>
          <p className="text-[11px] font-medium text-primary/70 leading-relaxed">
            Register the Bride, Groom, and immediate family members immediately upon arrival. The system will alert you via local device vibration and sound if any VIP hasn't been captured for more than 30 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}
