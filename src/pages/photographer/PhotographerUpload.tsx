import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, Brain, CheckCircle, Image, X, Sparkles, CloudUpload, Zap, FolderSync, Play, Pause, Scan, Cpu, Terminal, Printer } from 'lucide-react'
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
  const [totalBatchSize, setTotalBatchSize] = useState(0)
  
  const [syncingCount, setSyncingCount] = useState(0)

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
        const { vectors } = await scanImage(file)
        await addToQueue({
          file,
          eventId: eventId!,
          vectors,
          fileName: file.name
        })
        setProcessedCount(prev => prev + 1)
      } catch (err) {
        console.error(`Neural Ingestion Failure:`, err)
        toast.error(`Ingestion error: ${file.name}`)
      }
    }
    
    setIsProcessingLocal(false)
    toast.success(`Neural Ingestion Complete. Syncing in background.`)
    startSync(setSyncingCount)
  }

  useEffect(() => {
    if (syncingCount === 0) {
      qc.invalidateQueries({ queryKey: ['event-photos', eventId] })
    }
  }, [syncingCount, eventId, qc])

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
      if ((err as Error).name !== 'AbortError') toast.error('Folder access denied')
    }
  }

  const handlePrint = (photo: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    // We create a dedicated print document for the specific photo
    printWindow.document.write(`
      <html>
        <head>
          <title>SnapMoment Print Station</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #FFF; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print {
              img { width: 100%; height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${photo.s3_url}" onload="window.print();window.close();" />
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length) processAndQueueFiles(acceptedFiles)
  }, [eventId, qc])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: true })

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => photosApi.delete(eventId!, photoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['event-photos', eventId] }); toast.success('Deleted') },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
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
            isTethering ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' : 'border-white/10 bg-white/5 text-subtle hover:text-foreground'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isTethering ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>
            {isTethering ? <FolderSync className="animate-spin-slow" size={20} /> : <Play size={20} />}
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-black uppercase tracking-widest">{isTethering ? 'Elite Tether Active' : 'Enable Neural Sync'}</div>
            <div className="text-[10px] font-bold opacity-60 italic">Auto-scanning...</div>
          </div>
        </motion.button>
      </header>

      {/* Ingestion Overlay */}
      <AnimatePresence>
        {isProcessingLocal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/90 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-40 h-40 rounded-full aurora-bg flex items-center justify-center text-white shadow-2xl mb-8 relative">
              <Brain size={80} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
            </div>
            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-2">Neural Scan Pipeline</h2>
            <div className="w-full max-w-xl bg-card border border-white/10 rounded-[3rem] p-10">
               <div className="flex justify-between items-end mb-6">
                 <span className="text-sm font-bold truncate block w-64 text-left">{currentFileName}</span>
                 <span className="text-4xl font-black tabular-nums">{Math.round((processedCount / totalBatchSize) * 100)}%</span>
               </div>
               <div className="w-full h-4 rounded-full bg-border overflow-hidden">
                 <motion.div animate={{ width: `${(processedCount / totalBatchSize) * 100}%` }} className="h-full aurora-bg" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div {...getRootProps()} className="border-2 border-dashed rounded-[4rem] p-24 text-center cursor-pointer hover:bg-primary/5 transition-all">
          <input {...getInputProps()} />
          <div className="w-24 h-24 rounded-[2.5rem] glass flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Scan size={40} />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight">Initiate elite Ingestion</h3>
          <p className="text-muted mt-4 font-medium italic">Automatic face recognition active</p>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8 px-4">
          <h3 className="text-2xl font-black uppercase tracking-tight">Sync Grid</h3>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-32 bg-white/20 rounded-[4rem] border border-dashed border-border opacity-50">
            <Image size={64} className="mx-auto mb-6" />
            <p className="text-xs font-black uppercase tracking-widest text-muted">Awaiting Frames...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {photos.map((photo: any) => (
              <motion.div key={photo.id} whileHover={{ scale: 1.05 }} className="relative group rounded-[2.5rem] overflow-hidden aspect-[4/5] glass border-white/20 shadow-lg">
                <img src={photo.thumbnail_url || photo.s3_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-primary uppercase">Synced</span>
                      <span className="text-[8px] font-bold text-white/60 truncate w-16">Neural Match</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePrint(photo)} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10"><Printer size={16} /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(photo.id) }} className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center"><Trash2 size={16} /></button>
                    </div>
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
