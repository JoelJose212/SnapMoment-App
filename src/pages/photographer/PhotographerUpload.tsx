import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, Brain, CheckCircle, Image, X, Sparkles, CloudUpload, Zap, FolderSync, Play, Pause, Scan } from 'lucide-react'
import toast from 'react-hot-toast'
import { photosApi } from '../../lib/api'
import { scanImage } from '../../lib/ai'

const SUPPORTED_EXTS = ['.jpeg', '.jpg', '.jpe', '.raw', '.cr3', '.webp', '.avif']

export default function PhotographerUpload() {
  const { id: eventId } = useParams()
  const qc = useQueryClient()
  
  const [isProcessingLocal, setIsProcessingLocal] = useState(false)
  const [currentFileName, setCurrentFileName] = useState('')
  const [processedCount, setProcessedCount] = useState(0)
  const [totalBatchSize, setTotalBatchSize] = useState(0)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [processStatus, setProcessStatus] = useState<any>(null)

  // Tethering State
  const [isTethering, setIsTethering] = useState(false)
  const [tetherFolder, setTetherFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const seenFilesRef = useRef<Set<string>>(new Set())

  const { data: photos = [] } = useQuery({
    queryKey: ['event-photos', eventId],
    queryFn: () => photosApi.list(eventId!).then((r) => r.data),
  })

  // ── AI-Powered Ingestion Pipeline ─────────────────────────────────
  const processAndUploadFiles = async (files: File[]) => {
    setTotalBatchSize(files.length)
    setProcessedCount(0)
    setIsProcessingLocal(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFileName(file.name)
      
      try {
        // 1. On-Device AI Scan (BlazeFace/DeepFace logic)
        const { vectors } = await scanImage(file)
        
        // 2. Transmit to Server with Vectors
        setUploading(true)
        const formData = new FormData()
        formData.append('files', file)
        
        await photosApi.upload(eventId!, formData, setUploadProgress, vectors)
        
        setProcessedCount(prev => prev + 1)
      } catch (err) {
        console.error(`AI Pipeline Failure for ${file.name}:`, err)
        toast.error(`Ingestion error: ${file.name}`)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
    
    setIsProcessingLocal(false)
    toast.success(`Neural Ingestion Complete: ${files.length} frames optimized.`)
    qc.invalidateQueries({ queryKey: ['event-photos', eventId] })
  }

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
          processAndUploadFiles(newFiles)
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
      toast.success('Neural Live Tethering Active!')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to access local folder')
      }
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const checkStatus = async () => {
      try {
        const res = await photosApi.processStatus(eventId!)
        setProcessStatus(res.data)
        setProcessing(res.data.status === 'processing' || res.data.status === 'queued')
      } catch {}
    }
    checkStatus()
    interval = setInterval(checkStatus, 3000)
    return () => { if (interval) clearInterval(interval) }
  }, [eventId])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    processAndUploadFiles(acceptedFiles)
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
            <Scan size={14} className="animate-pulse" /> On-Device Neural Scan
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: '"Plus Jakarta Sans"' }}>Upload Photos</h1>
          <p className="text-muted font-medium mt-2">Local AI vectorization active</p>
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
              {isTethering ? 'Neural Tether Active' : 'Enable Neural Sync'}
            </div>
            <div className="text-[10px] font-bold opacity-60">
              Watching folder...
            </div>
          </div>
        </motion.button>
      </header>

      {/* Neural Processing Overlay */}
      <AnimatePresence>
        {isProcessingLocal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-32 h-32 rounded-full aurora-bg flex items-center justify-center text-white shadow-2xl mb-8 relative">
              <Brain size={64} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-2">Neural Scan in Progress</h2>
            <p className="text-primary font-black text-xs uppercase tracking-[0.3em] mb-8">
              Calculating Face Character Vectors ({processedCount + 1}/{totalBatchSize})
            </p>
            
            <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted truncate w-48 text-left">
                  Scanning: {currentFileName}
                </span>
                <span className="text-xl font-black text-foreground">
                  {Math.round(((processedCount) / totalBatchSize) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-border overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(processedCount / totalBatchSize) * 100}%` }}
                   className="h-full rounded-full aurora-bg"
                />
              </div>
              
              {uploading && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <CloudUpload size={16} className="text-primary animate-bounce" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Syncing Vector to Studio Grid...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div
          {...getRootProps()}
          className={`relative group border-2 border-dashed rounded-[3rem] p-16 text-center cursor-pointer transition-all overflow-hidden ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-white/30 dark:bg-black/20'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="relative z-0">
            <div className="w-20 h-20 rounded-[2rem] glass border-white/40 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:aurora-bg group-hover:text-white transition-all">
              <Upload size={32} />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Initiate Neural Capture</h3>
            <p className="text-muted mt-2 text-sm">Drag frames here for on-device AI vectorization</p>
          </div>
        </div>
      </section>

      {/* Gallery View */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            AI-Enhanced Gallery <span className="text-sm font-medium text-muted">({photos.length})</span>
          </h3>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white/20 dark:bg-black/10 rounded-[2.5rem] border border-border border-dashed">
            <Image size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-muted font-medium italic">Neural network is waiting for input</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo: any) => (
              <motion.div 
                key={photo.id} 
                layout
                whileHover={{ scale: 1.02 }}
                className="relative group rounded-[2rem] overflow-hidden aspect-square glass border-white/20"
              >
                <img src={photo.thumbnail_url || photo.s3_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black bg-primary/90 text-white px-2 py-1 rounded-lg backdrop-blur-sm uppercase tracking-widest">
                      Processed
                    </span>
                    <button
                      onClick={() => { if (confirm('Delete this frame?')) deleteMutation.mutate(photo.id) }}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 size={14} />
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
