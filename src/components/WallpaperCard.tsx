import React, { useState, useRef } from 'react';
import { 
  Heart, 
  Check, 
  RotateCcw,
  Sparkles,
  Layers,
  Trash2
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Wallpaper } from '../types';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  isFavorite: boolean;
  isApplied?: boolean;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop?: (w: Wallpaper) => void;
  onQuickDownload?: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onOpenAddToCollection?: (w: Wallpaper) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  isFavorite,
  isApplied = false,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onDelete,
  enableTilt = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Subtle 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 28, stiffness: 280, mass: 0.4 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const cleanTitle = sanitizeWallpaperTitle(wallpaper.title);

  const imageUrl = wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl;

  // Safe detection for hover capabilities to avoid unwanted sticky hover on mobile touch
  const canHover = typeof window !== 'undefined' && (
    window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true
  );

  return (
    <motion.div
      id={`wallpaper-card-${wallpaper.id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onInspect(wallpaper)}
      title={cleanTitle}
      className={`group relative rounded-2xl overflow-hidden bg-[#0c0f17] border ${
        isApplied
          ? 'border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_24px_rgba(6,182,212,0.4)]'
          : 'border-white/10 hover:border-cyan-400/50 shadow-lg hover:shadow-xl hover:shadow-cyan-950/40'
      } transition-colors duration-200 cursor-pointer select-none flex flex-col will-change-transform`}
      style={{
        perspective: 1000,
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
      }}
      whileHover={canHover ? { scale: 1.03 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ======================================================================= */}
      {/* 1. WALLPAPER IMAGE STAGE (Hero of the Card - 16:10 Cinematic Crop)     */}
      {/* ======================================================================= */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#080a10]">
        
        {/* Soft Dark Skeleton Surface with Subtle Shimmer */}
        {!loaded && !hasError && (
          <div className="absolute inset-0 bg-[#0e111a] flex items-center justify-center z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400/60 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error Fallback State (Preview Unavailable with Retry and Delete) */}
        {hasError ? (
          <div className="absolute inset-0 bg-[#0d1017] flex flex-col items-center justify-center p-4 text-center z-10 space-y-2">
            <Layers className="w-6 h-6 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">Preview unavailable</span>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasError(false);
                  setVideoError(false);
                  setLoaded(false);
                  setRetryCount(prev => prev + 1);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-slate-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              {onDelete && (
                <button
                  id={`delete-btn-${wallpaper.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(wallpaper.id);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] text-rose-300 transition cursor-pointer"
                  title="Delete wallpaper"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        ) : wallpaper.videoUrl && !videoError ? (
          /* Native Video Wallpaper */
          <video
            key={`${wallpaper.videoUrl}-${retryCount}`}
            src={wallpaper.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            poster={wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl}
            onLoadedData={() => setLoaded(true)}
            onError={() => {
              if (imageUrl && imageUrl !== wallpaper.videoUrl) {
                setVideoError(true);
              } else {
                setHasError(true);
              }
            }}
            className={`w-full h-full object-cover pointer-events-none transition-transform duration-200 ease-out ${
              isHovered ? 'scale-[1.03]' : 'scale-100'
            }`}
          />
        ) : (
          /* Primary Wallpaper Image */
          <img
            key={`${imageUrl}-${retryCount}`}
            src={imageUrl}
            alt={cleanTitle}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-all duration-200 ease-out ${
              isHovered ? 'scale-[1.03] brightness-[1.03]' : 'scale-100'
            } ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Subtle Ambient Vignette Overlay on Hover */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none transition-opacity duration-200"
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Floating Top-Right Action Button (Heart / Favorite Only) */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto">
          <button
            id={`fav-btn-${wallpaper.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(wallpaper.id);
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-xl backdrop-blur-md border transition-all duration-150 cursor-pointer shadow-md ${
              isFavorite
                ? 'bg-rose-500/35 text-rose-400 border-rose-500/50 shadow-rose-500/20'
                : 'bg-black/45 text-slate-300 hover:text-white border-white/15 hover:border-white/30 hover:bg-black/70'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-3.5 h-3.5 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:scale-105'}`} />
          </button>
        </div>

        {/* Applied Badge Indicator */}
        {isApplied && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold backdrop-blur-md shadow-sm">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Active</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
