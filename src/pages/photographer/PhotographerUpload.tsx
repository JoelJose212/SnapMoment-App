import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, Brain, CheckCircle, Image, X, Sparkles, CloudUpload, Zap, FolderSync, Play, Pause, Scan, Cpu, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'
import { photosApi } from '../../lib/api'
import { scanImage } from '../../lib/ai'
import { addToQueue, startSync } from '../../lib/queue'

const SUPPORTED_EXTS = ['.jpeg', '.jpg', '.jpe', '.raw', '.cr3', '.webp', '.avif']

export default function PhotographerUpload() {
  const { id: eventId } = useParams()
  const qc = useQueryClient()
  
  const [isProcessingLocal, setIsProcessingLocal] = useState(false)
  const [currentFileName, setCurrentFileName] = useState('')
  const [processedCount, setProcessedCount] = useState(0)
  const [totalBatchSize, setTotalBatchSize] = useState(TotalBatchSize(0))
  
  const [syncingCount, setSyncingCount] = useState(0)
  const [processing, setProcessing] = useState(false)

  // Tethering State
  const [isTethering, setIsTethering] = useState(false)
  const [tetherFolder, setTetherFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const seenFilesRef = useRef<Set<string>>(new Set())

  const { data: photos = [] } = useQuery({
    queryKey: ['event-photos', eventId],
    queryFn: () => photosApi.list(eventId!).then((r) => r.data),
  })

  // ── Elite Neural Ingestion Pipeline ─────────────────────────────────
  const processAndQueueFiles = async (files: File[]) => {
    setTotalBatchSize(files.length)
    setProcessedCount(0)
    setIsProcessingLocal(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFileName(file.name)
      
      try {
        // 1. On-Device AI Scan (BlazeFace/DeepFace logic)
        const { vectors } = await scanImage(file)
        
        // 2. Add to Local Offline Queue (Persistent)
        await addToQueue({
          file,
          eventId: eventId!,
          vectors,
          fileName: file.name
        })
        
        setProcessedCount(prev => prev + 1)
      } catch (err) {
        console.error(`Neural Ingestion Failure for ${file.name}:`, err)
        toast.error(`Ingestion error: ${file.name}`)
      }
    }
    
    setIsProcessingLocal(false)
    toast.success(`Neural Ingestion Complete: ${files.length} frames queued for background sync.`)
    
    // Trigger Sync immediately
    startSync(setSyncingCount)
  }

  // Hook into background sync to refresh the gallery when items finish
  useEffect(() => {
    if (syncingCount === 0) {
      qc.invalidateQueries({ queryKey: ['event-photos', eventId] })
    }
  }, [syncingCount, eventId, qc])

  // Sync loop for Tethering
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    
    const syncFolder = async () => {
      if (!tetherFolder || !isTethering || isProcessingLocal) return

      try {
        const newFiles: File[] = []
        for await (const entry of (tetherFolder as any).values()) {
          if (entry.kind === 'file') {
            const name = entry.name.toLowerCase()
            const match = SUPPORTED_EXTS.some(ext => name.endsWith(ext))
            
            if (match && !seenFilesRef.current.has(entry.name)) {
              const file = await entry.getFile()
              newFiles.push(file)
              seenFilesRef.current.add(entry.name)
            }
          }
        }

        if (newFiles.length > 0) {
          processAndQueueFiles(newFiles)
        }
      } catch (err) {
        setIsTethering(false)
        toast.error('Tethering interrupted. Please re-connect.')
      }
    }

    if (isTethering) {
      interval = setInterval(syncFolder, 4000)
    }

    return () => { if (interval) clearInterval(interval) }
  }, [isTethering, tetherFolder, eventId, qc, isProcessingLocal])

  const handleTetherToggle = async () => {
    if (isTethering) {
      setIsTethering(false)
      return
    }

    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker()
      setTetherFolder(handle)
      setIsTethering(true)
      seenFilesRef.current.clear()
      toast.success('Elite Live Tethering Active!')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to access local folder')
      }
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    processAndQueueFiles(acceptedFiles)
  }, [eventId, qc])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: true })

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => photosApi.delete(eventId!, photoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['event-photos', eventId] }); toast.success('Frame deleted') },
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="px-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Terminal size={14} className="animate-pulse" /> Elite Protocol Ingestion
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: '"Plus Jakarta Sans"' }}>Upload Photos</h1>
          <p className="text-muted font-medium mt-2">Local Neural Scan & Persistent Queue</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTetherToggle}
          className={`relative overflow-hidden flex items-center gap-4 px-8 py-5 rounded-[2rem] border-2 transition-all shadow-2xl ${
            isTethering 
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' 
              : 'border-white/10 bg-white/5 text-subtle hover:text-foreground'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isTethering ? 'bg-emerald-500 text-white shadow-emerald-xl' : 'bg-white/10'}`}>
            {isTethering ? <FolderSync className="animate-spin-slow" size={20} /> : <Play size={20} />}
          </div>
          <div className="text-left">
            <div className="text-sm font-black uppercase tracking-widest">
              {isTethering ? 'Elite Tether Active' : 'Enable Neural Sync'}
            </div>
            <div className="text-[10px] font-bold opacity-60">
              Auto-scanning local directory...
            </div>
          </div>
        </motion.button>
      </header>

      {/* Neural Ingestion Overlay */}
      <AnimatePresence>
        {isProcessingLocal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-40 h-40 rounded-full aurora-bg flex items-center justify-center text-white shadow-[0_0_100px_rgba(255,110,108,0.4)] mb-8 relative">
              <Brain size={80} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '4s' }} />
            </div>
            
            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-2">Neural Scan Pipeline</h2>
            <p className="text-primary font-black text-sm uppercase tracking-[0.4em] mb-12">
              Processing Frame {processedCount + 1} of {totalBatchSize}
            </p>
            
            <div className="w-full max-w-xl bg-card/60 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-end mb-6">
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Current Signature</span>
                  <span className="text-sm font-bold text-foreground truncate block w-64">{currentFileName}</span>
                </div>
                <span className="text-4xl font-black text-foreground tabular-nums">
                  {Math.round((processedCount / totalBatchSize) * 100)}%
                </span>
              </div>
              <div className="w-full h-4 rounded-full bg-border/50 overflow-hidden relative">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(processedCount / totalBatchSize) * 100}%` }}
                   className="h-full rounded-full aurora-bg"
                />
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-4">
                <Cpu size={20} className="text-primary animate-spin-slow" />
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Hashing Neural Vectors to Local Cache...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div
          {...getRootProps()}
          className={`relative group border-2 border-dashed rounded-[4rem] p-24 text-center cursor-pointer transition-all overflow-hidden ${
            isDragActive ? 'border-primary bg-primary/10 scale-[0.98]' : 'border-border bg-white/30 dark:bg-black/20'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] glass border-white/40 flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 group-hover:aurora-bg group-hover:text-white transition-all duration-500">
              <Scan size={40} />
            </div>
            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Initiate elite Ingestion</h3>
            <p className="text-muted mt-4 text-base font-medium">Automatic face recognition & background sync enabled</p>
          </div>
          
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
      </section>

      {/* Gallery View */}
      <section>
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Sync Grid</h3>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
              {photos.length} Optimized Frames
            </span>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-32 bg-white/20 dark:bg-black/10 rounded-[4rem] border border-border border-dashed relative overflow-hidden">
            <div className="absolute inset-0 aurora-bg opacity-5 blur-[100px]" />
            <Image size={64} className="mx-auto mb-6 opacity-10" />
            <p className="text-muted font-bold tracking-widest uppercase text-xs">Waiting for Neural Ingestion...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {photos.map((photo: any) => (
              <motion.div 
                key={photo.id} 
                layout
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group rounded-[2.5rem] overflow-hidden aspect-[4/5] glass border-white/20 shadow-lg"
              >
                <img src={photo.thumbnail_url || photo.s3_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Synced</span>
                      <span className="text-[8px] font-bold text-white/60 truncate w-24">Neural Match v4</span>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this frame?')) deleteMutation.mutate(photo.id) }}
                      className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}

function TotalBatchSize(arg0: number): any {
  return arg0;
}
