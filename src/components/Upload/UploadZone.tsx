import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Film, 
  Check, 
  AlertCircle, 
  X, 
  Play, 
  Sparkles, 
  FileVideo, 
  RefreshCw,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { extractVideoThumbnail } from '../../utils/mediaStorage';

export interface UploadZoneProps {
  mediaType?: 'video' | 'image';
  acceptedTypes?: string[]; // e.g. ['video/mp4', 'video/webm', 'video/quicktime'] or ['.mp4', '.webm', '.mov']
  maxSizeMB?: number;
  title?: string;
  subtitle?: string;
  onSuccess: (fileData: { file: File; objectUrl: string; name: string; sizeFormatted: string; thumbnailDataUrl?: string }) => void;
  onApply?: (fileData: { file: File; objectUrl: string; name: string; thumbnailDataUrl?: string }) => void;
  initialPreviewUrl?: string;
  actionLabel?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  mediaType = 'video',
  acceptedTypes = ['.mp4', '.webm', '.mov', 'video/mp4', 'video/webm', 'video/quicktime'],
  maxSizeMB = 150,
  title,
  subtitle,
  onSuccess,
  onApply,
  initialPreviewUrl,
  actionLabel = 'Apply Background'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; objectUrl: string; name: string; sizeFormatted: string; thumbnailDataUrl?: string } | null>(null);
  const [previewActive, setPreviewActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateAndProcessFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAcceptedExt = acceptedTypes.some(t => t.toLowerCase() === ext || t.toLowerCase() === file.type.toLowerCase());
    const isVideoType = file.type.startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);
    const isImageType = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

    const validCategory = mediaType === 'video' ? isVideoType : isImageType;

    if (!isAcceptedExt && !validCategory) {
      setErrorMessage(`Unsupported file format. Please upload ${mediaType === 'video' ? 'MP4, WebM, or MOV' : 'PNG, JPG, or WebP'}.`);
      setUploadStatus('error');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setErrorMessage(`File is larger than the allowed size (${fileSizeMB.toFixed(1)}MB > ${maxSizeMB}MB).`);
      setUploadStatus('error');
      return;
    }

    setErrorMessage(null);
    setUploadStatus('uploading');
    setProgress(15);

    // Simulated progress with realistic smooth easing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          setUploadStatus('processing');
          (async () => {
            const objectUrl = URL.createObjectURL(file);
            let thumbnailDataUrl = '';
            if (mediaType === 'video' || file.type.startsWith('video/')) {
              try {
                thumbnailDataUrl = await extractVideoThumbnail(file);
              } catch (e) {
                console.warn('Thumbnail extraction error:', e);
              }
            }
            const data = {
              file,
              objectUrl,
              name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              sizeFormatted: formatFileSize(file.size),
              thumbnailDataUrl: thumbnailDataUrl || undefined,
            };
            setUploadedFile(data);
            setProgress(100);
            setUploadStatus('success');
            onSuccess(data);
          })();
          return 90;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 120);
  };

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
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setUploadStatus('idle');
    setProgress(0);
    setUploadedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {uploadStatus === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative group rounded-3xl p-8 md:p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_35px_rgba(6,182,212,0.3)] scale-[1.01]' 
                : 'border-white/15 hover:border-cyan-400/50 bg-[#0E121E]/80 hover:bg-[#121728]'
            }`}
          >
            {/* Subtle background gradient glow */}
            <div className="absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-950/40">
              {mediaType === 'video' ? (
                <FileVideo className="w-8 h-8 text-cyan-300" />
              ) : (
                <ImageIcon className="w-8 h-8 text-cyan-300" />
              )}
            </div>

            <h4 className="text-base md:text-lg font-black text-white tracking-wide mb-1.5 font-['Outfit']">
              {title || (mediaType === 'video' ? 'Drag & Drop Video' : 'Drag & Drop Image')}
            </h4>

            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {subtitle || (mediaType === 'video' 
                ? 'Choose an ultra HD animated video or 60 FPS loop from your PC' 
                : 'Upload a custom high-resolution wallpaper image')}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <Upload className="w-4 h-4" />
                <span>{mediaType === 'video' ? 'Choose Video File' : 'Choose Image File'}</span>
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>Supported:</span>
              <span className="text-cyan-300 font-bold">
                {mediaType === 'video' ? 'MP4 • WebM • MOV' : 'PNG • JPG • WEBP'}
              </span>
              <span>• Max {maxSizeMB}MB</span>
            </div>
          </motion.div>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="rounded-3xl p-8 border border-cyan-500/30 bg-[#0E121E]/95 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-300" />
            </div>

            <div>
              <p className="text-sm font-black text-white font-['Outfit']">
                {uploadStatus === 'uploading' ? 'Uploading Media...' : 'Processing & Validating Playback...'}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {uploadStatus === 'uploading' ? `${progress}% Completed` : 'Preparing high-fps hardware canvas'}
              </p>
            </div>

            {/* Custom Glowing Progress Bar */}
            <div className="w-full max-w-md bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}

        {uploadStatus === 'success' && uploadedFile && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-b from-[#0e1724] to-[#0A0D16] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-300 tracking-wide">
                    ✓ Media Ready & Validated
                  </p>
                  <p className="text-xs text-white font-bold capitalize truncate max-w-xs">
                    {uploadedFile.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                  {uploadedFile.sizeFormatted}
                </span>
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                  title="Upload another file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video/Image Live Preview Box */}
            <div className="relative aspect-video max-h-64 rounded-2xl overflow-hidden border border-white/15 bg-black/80 flex items-center justify-center group shadow-inner">
              {mediaType === 'video' ? (
                <video
                  src={uploadedFile.objectUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={uploadedFile.objectUrl}
                  alt={uploadedFile.name}
                  className="w-full h-full object-cover"
                />
              )}

              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-cyan-300">
                {mediaType === 'video' ? '60 FPS Live Loop' : 'Ultra HD'}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Choose Different File</span>
              </button>

              {onApply && (
                <button
                  type="button"
                  onClick={() => onApply(uploadedFile)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-black text-xs shadow-lg shadow-cyan-900/40 hover:shadow-[0_0_24px_rgba(6,182,212,0.6)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{actionLabel}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {uploadStatus === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-3xl p-6 border border-rose-500/40 bg-rose-950/20 backdrop-blur-xl text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-black text-rose-300 font-['Outfit']">
                Upload Validation Failed
              </p>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                {errorMessage || 'Unsupported file format or size exceeded.'}
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
