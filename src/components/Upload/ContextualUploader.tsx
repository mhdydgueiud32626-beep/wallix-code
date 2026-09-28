import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileVideo, 
  ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UploadSuccessPayload {
  name: string;
  url: string;
  type: 'video' | 'image';
  sizeFormatted: string;
  dimensions?: string;
  duration?: number;
}

interface ContextualUploaderProps {
  mediaType: 'video' | 'image';
  title?: string;
  description?: string;
  maxSizeMB?: number;
  onUploadComplete: (payload: UploadSuccessPayload) => void;
  accentColor?: string;
  className?: string;
}

export const ContextualUploader: React.FC<ContextualUploaderProps> = ({
  mediaType,
  title,
  description,
  maxSizeMB = mediaType === 'video' ? 120 : 25,
  onUploadComplete,
  accentColor = mediaType === 'video' ? 'cyan' : 'purple',
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<UploadSuccessPayload | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const defaultTitle = mediaType === 'video' 
    ? 'Upload 60 FPS Live Wallpaper Video' 
    : 'Upload Custom Chrome Background Image';

  const defaultDesc = mediaType === 'video'
    ? 'Supports MP4, WebM, or MOV up to 120MB. Hardware accelerated.'
    : 'Supports 4K JPG, PNG, or WebP up to 25MB. Crystal clear clarity.';

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validate and Process File
  const handleProcessFile = useCallback((file: File) => {
    setErrorMsg(null);
    setSuccessItem(null);

    // 1. Validate MIME Type
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

    const isValid = mediaType === 'video' 
      ? validVideoTypes.includes(file.type) || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
      : validImageTypes.includes(file.type) || /\.(jpe?g|png|webp|avif)$/i.test(file.name);

    if (!isValid) {
      setErrorMsg(
        mediaType === 'video'
          ? `Unsupported format "${file.name}". Please upload MP4, WebM, or MOV video files.`
          : `Unsupported format "${file.name}". Please upload JPG, PNG, or WebP image files.`
      );
      return;
    }

    // 2. Validate Size Limit
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`File exceeds ${maxSizeMB}MB limit (${formatBytes(file.size)}). Please choose a smaller file.`);
      return;
    }

    // 3. Initiate Simulated Progress Indicator
    setUploadProgress(0);
    const totalSteps = 10;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const percent = Math.min(Math.round((currentStep / totalSteps) * 100), 95);
      setUploadProgress(percent);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        // Enter Processing Stage
        setUploadProgress(100);
        setProcessing(true);

        setTimeout(() => {
          const blobUrl = URL.createObjectURL(file);
          const payload: UploadSuccessPayload = {
            name: file.name.replace(/\.[^/.]+$/, ''),
            url: blobUrl,
            type: mediaType,
            sizeFormatted: formatBytes(file.size)
          };

          setProcessing(false);
          setUploadProgress(null);
          setSuccessItem(payload);
          onUploadComplete(payload);
        }, 600);
      }
    }, 90);
  }, [mediaType, maxSizeMB, onUploadComplete]);

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    setSuccessItem(null);
    setErrorMsg(null);
    setUploadProgress(null);
    setProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. INITIAL DRAG & DROP ZONE */}
      {!uploadProgress && !processing && !successItem && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group backdrop-blur-xl ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_35px_rgba(6,182,212,0.3)] scale-[1.01]'
              : 'border-white/15 hover:border-cyan-400/60 bg-gradient-to-b from-white/[0.04] to-transparent hover:bg-white/[0.07]'
          }`}
        >
          {/* Animated Glow Icon */}
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-transform duration-300">
            {mediaType === 'video' ? (
              <FileVideo className="w-8 h-8 text-cyan-400 animate-pulse" />
            ) : (
              <ImageIcon className="w-8 h-8 text-purple-400 animate-pulse" />
            )}
          </div>

          <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition">
            {title || defaultTitle}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            {description || defaultDesc}
          </p>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition shadow-sm flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Browse Local Files</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">or drag file here</span>
          </div>
        </div>
      )}

      {/* 2. PROGRESS / PROCESSING STATE */}
      {(uploadProgress !== null || processing) && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] backdrop-blur-2xl text-center space-y-4 animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">
              {processing ? 'Processing & Optimizing Media...' : `Uploading ${mediaType === 'video' ? 'Video' : 'Image'} (${uploadProgress}%)`}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {processing ? 'Applying hardware acceleration and generating preview buffer' : 'Streaming local asset into memory cache'}
            </p>
          </div>

          {/* Progress Track */}
          <div className="w-full max-w-md mx-auto h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10 p-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress || 100}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>
        </div>
      )}

      {/* 3. ERROR ALERT STATE */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.2)] flex items-start justify-between gap-3 text-white backdrop-blur-xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-200">Upload Validation Error</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={resetUploader}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 transition"
            title="Dismiss & Try Again"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. SUCCESS & PREVIEW STATE */}
      {successItem && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-2xl space-y-4 animate-in fade-in zoom-in-95">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{successItem.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                    {successItem.sizeFormatted}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-400/80">Asset active and ready to apply</p>
              </div>
            </div>

            <button
              onClick={resetUploader}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          {/* Inline Media Preview Canvas */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 group">
            {mediaType === 'video' ? (
              <>
                <video
                  ref={videoPreviewRef}
                  src={successItem.url}
                  autoPlay
                  loop
                  muted={previewMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Video Controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 opacity-90 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      if (!videoPreviewRef.current) return;
                      if (previewPlaying) {
                        videoPreviewRef.current.pause();
                        setPreviewPlaying(false);
                      } else {
                        videoPreviewRef.current.play();
                        setPreviewPlaying(true);
                      }
                    }}
                    className="p-1 hover:text-cyan-300 text-white transition"
                    title={previewPlaying ? 'Pause' : 'Play'}
                  >
                    {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setPreviewMuted(!previewMuted)}
                    className="p-1 hover:text-cyan-300 text-white transition"
                    title={previewMuted ? 'Unmute' : 'Mute'}
                  >
                    {previewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">60 FPS LIVE</span>
                </div>
              </>
            ) : (
              <img
                src={successItem.url}
                alt={successItem.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
