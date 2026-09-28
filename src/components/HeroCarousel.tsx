import React, { useState, useRef } from 'react';
import { 
  Download, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Monitor,
  Sparkles,
  Share2
} from 'lucide-react';
import { Wallpaper } from '../types';
import { ThreeLiveWallpaper } from './LiveShaders/ThreeLiveWallpaper';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface HeroCarouselProps {
  wallpapers: Wallpaper[];
  selectedWallpaper?: Wallpaper | null;
  onInspect: (wallpaper: Wallpaper) => void;
  onApplyDesktop: (wallpaper: Wallpaper) => void;
  onQuickDownload: (wallpaper: Wallpaper) => void;
  onOpenDesktopSim?: (wallpaper: Wallpaper) => void;
  onShare?: (wallpaper: Wallpaper) => void;
  activeWallpaperId?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  wallpapers,
  selectedWallpaper,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  activeWallpaperId
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const featuredList = wallpapers.filter((w) => w.featured || w.isLive);
  const current = selectedWallpaper || featuredList[currentIndex] || wallpapers[0];

  React.useEffect(() => {
    if (selectedWallpaper) {
      const idx = featuredList.findIndex(w => w.id === selectedWallpaper.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [selectedWallpaper, featuredList]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredList.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const isApplied = activeWallpaperId === current.id;

  return (
    <section 
      id="wallix-hero-carousel" 
      className="relative w-full rounded-3xl overflow-hidden glass-panel-glow border border-white/10 p-1 md:p-2 mb-8 group"
    >
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-full min-h-[360px] md:min-h-[440px] rounded-2xl overflow-hidden flex flex-col justify-end p-6 md:p-10 cursor-pointer select-none"
      >
        {/* Parallax Background / Three.js Live Shader */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out scale-105"
          style={{
            transform: `translate3d(${mousePos.x * 16}px, ${mousePos.y * 16}px, 0) scale(${isHovered ? 1.04 : 1.02})`,
          }}
        >
          {current.videoUrl ? (
            <video
              key={current.videoUrl}
              src={current.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              poster={current.imageUrl || current.thumbnail || current.thumbnailUrl}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : current.isLive && current.shaderType ? (
            <ThreeLiveWallpaper shaderType={current.shaderType} interactive={true} className="w-full h-full" />
          ) : (
            <img 
              src={current.imageUrl || current.thumbnail || current.thumbnailUrl} 
              alt={current.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Cinematic lighting overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1016] via-[#0F1016]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1016]/80 via-transparent to-transparent" />
          <div 
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${(mousePos.x + 1) * 50}% ${(mousePos.y + 1) * 50}%, rgba(99, 102, 241, 0.45) 0%, transparent 60%)`
            }}
          />
        </div>

        {/* Carousel Content & Actions */}
        <div className="relative z-10 max-w-2xl space-y-2.5">
          {/* Clean Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-2">
            {sanitizeWallpaperTitle(current.title)}
          </h2>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {/* PROMINENT 1-CLICK DESKTOP SIMULATOR */}
            <button
              id="hero-1click-desktop-preview-btn"
              onClick={() => onOpenDesktopSim ? onOpenDesktopSim(current) : onInspect(current)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 btn-primary-glow text-white cursor-pointer group/btn"
              title="👁️ 1-Click Desktop Preview: Instantly simulate live wallpaper behind Windows taskbars and icons"
            >
              <div className="p-1 rounded-lg bg-white/20 text-white group-hover/btn:scale-110 transition-transform">
                <Eye className="w-4 h-4 text-cyan-200" />
              </div>
              <span className="tracking-wide">1-Click Desktop Preview</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-400/30">
                LIVE
              </span>
            </button>

            {/* Apply to Desktop */}
            <button
              id="hero-apply-btn"
              onClick={() => onApplyDesktop(current)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
                isApplied
                  ? 'btn-applied-emerald'
                  : 'btn-tertiary-glass text-slate-100 hover:text-white'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 text-slate-300" />
                  <span>Apply Engine</span>
                </>
              )}
            </button>

            {/* Shareable Link Button */}
            <button
              id="hero-share-btn"
              onClick={() => {
                if (onShare) {
                  onShare(current);
                } else {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?wallpaperId=${encodeURIComponent(current.id)}`;
                  navigator.clipboard?.writeText(shareUrl);
                }
                setCopiedRecently(true);
                setTimeout(() => setCopiedRecently(false), 2000);
              }}
              className={`p-3 rounded-xl btn-tertiary-glass transition cursor-pointer ${
                copiedRecently
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-500/30'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
              title="Share Wallpaper Link (?wallpaperId=)"
            >
              {copiedRecently ? <Check className="w-4 h-4 text-cyan-300" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Carousel Nav Buttons */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition"
            aria-label="Previous Featured Wallpaper"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            {featuredList.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition"
            aria-label="Next Featured Wallpaper"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
