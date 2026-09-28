import React, { useState, useRef } from 'react';
import { ArrowLeftIcon } from "@animateicons/react/lucide";
import { 
  X, 
  Download, 
  Monitor, 
  Check, 
  Sparkles, 
  Sliders, 
  Layers, 
  Cpu,
  Activity,
  Tag,
  Hash,
  Zap
} from 'lucide-react';
import { Wallpaper } from '../types';
import { ThreeLiveWallpaper } from './LiveShaders/ThreeLiveWallpaper';
import { Model3DViewer } from './LiveShaders/Model3DViewer';
import confetti from 'canvas-confetti';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface WallpaperModalProps {
  wallpaper: Wallpaper | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  isApplied: boolean;
  onToggleFavorite: (id: string) => void;
  onApplyDesktop: (wallpaper: Wallpaper) => void;
  onOpenDesktopSim: () => void;
  onShare?: (wallpaper: Wallpaper) => void;
  onDownloadRecord?: (wallpaper: Wallpaper, resolution: string) => void;
  onOpenAddToCollection?: (wallpaper: Wallpaper) => void;
  onSelectTag?: (tag: string) => void;
  onDelete?: (id: string) => void;
}

const cleanWallpaperTitle = sanitizeWallpaperTitle;

// SVG Icon Components for Bottom Actions
const ChromeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C7.38 2 3.48 5.14 2.34 9.4L6.87 14.52C7.45 9.77 11.45 6.1 16.29 6.1H21.26C19.04 3.58 15.74 2 12 2Z" fill="#EA4335" />
    <path d="M21.26 6.1C21.74 7.93 22 9.88 22 12C22 16.91 18.47 21 13.8 21.84L9.85 16.71C11.75 17.5 13.98 17.06 15.42 15.62C16.86 14.18 17.3 11.95 16.51 10.05L21.26 6.1Z" fill="#FBBC05" />
    <path d="M13.8 21.84C8.94 21.84 4.88 18.06 4.14 13.25L9.36 10.23C9.4 12.3 10.74 14.15 12.72 14.77L13.8 21.84Z" fill="#34A853" />
    <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="3.8" fill="#4285F4" />
  </svg>
);

const WindowsLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.45L10.4 4.4V11.3H3V5.45ZM10.4 12.7V19.6L3 18.55V12.7H10.4ZM11.7 4.2L21 2.9V11.3H11.7V4.2ZM21 12.7V21.1L11.7 19.8V12.7H21Z" />
  </svg>
);

const GlowingDiamondStar: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 1 C16 9.28 22.72 16 31 16 C22.72 16 16 22.72 16 31 C16 22.72 9.28 16 1 16 C9.28 16 16 9.28 16 1 Z"
      fill="url(#sparkleDiamondGrad)"
    />
    <defs>
      <linearGradient id="sparkleDiamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#A5F3FC" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
    </defs>
  </svg>
);

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  wallpaper,
  isOpen,
  onClose,
  isFavorite,
  isApplied,
  onToggleFavorite,
  onApplyDesktop,
  onOpenDesktopSim,
  onShare,
  onDownloadRecord,
  onOpenAddToCollection,
  onSelectTag,
  onDelete,
}) => {
  const [selectedRes, setSelectedRes] = useState<string>('4K UHD (3840×2160)');
  const [smoothProfile, setSmoothProfile] = useState<'low' | 'balanced' | 'ultra'>('balanced');
  const [parallaxPower, setParallaxPower] = useState(1.5);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const previewBoxRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !wallpaper) return null;

  const displayTitle = cleanWallpaperTitle(wallpaper.title);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    // Canvas generator for high-res real download
    const canvas = document.createElement('canvas');
    let targetWidth = 3840;
    let targetHeight = 2160;

    if (selectedRes.includes('8K')) {
      targetWidth = 7680;
      targetHeight = 4320;
    } else if (selectedRes.includes('Ultrawide')) {
      targetWidth = 3440;
      targetHeight = 1440;
    } else if (selectedRes.includes('Mobile')) {
      targetWidth = 1170;
      targetHeight = 2532;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = wallpaper.imageUrl;

      img.onload = () => {
        // Draw filtered image
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to download blob
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `WALLIX_${displayTitle.replace(/\s+/g, '_')}_${targetWidth}x${targetHeight}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsDownloading(false);
          if (onDownloadRecord) {
            onDownloadRecord(wallpaper, selectedRes);
          }
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366F1', '#06B6D4', '#8B5CF6']
          });
        }, 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        // Fallback standard direct download
        const a = document.createElement('a');
        a.href = wallpaper.imageUrl;
        a.download = `${displayTitle}.jpg`;
        a.target = '_blank';
        a.click();
        if (onDownloadRecord) {
          onDownloadRecord(wallpaper, selectedRes);
        }
        setIsDownloading(false);
      };
    } else {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(wallpaper);
    } else {
      const shareUrl = `${window.location.origin}${window.location.pathname}?wallpaperId=${encodeURIComponent(wallpaper.id)}`;
      try {
        navigator.clipboard.writeText(shareUrl);
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const resolutions = [
    { label: '4K UHD (3840×2160)', tag: 'Desktop Standard' },
    { label: '8K Ultra (7680×4320)', tag: 'Studio Master' },
    { label: 'Ultrawide 21:9 (3440×1440)', tag: 'Gaming Monitor' },
    { label: 'Mobile HDR (1170×2532)', tag: 'Phone Lockscreen' },
  ];

  return (
    <div 
      id="wallpaper-inspection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] glass-panel-glow rounded-3xl border border-white/15 overflow-hidden flex flex-col lg:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Left Back Button with Animated ArrowLeftIcon */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-50 p-2 sm:p-2.5 rounded-2xl bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-xl transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center group"
          title="Back to Gallery"
          aria-label="Back"
        >
          <ArrowLeftIcon
            size={24}
            duration={1}
            color="#ffffff"
          />
        </button>

        {/* Left Side: 3D Interactive Parallax Stage */}
        <div 
          ref={previewBoxRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 min-h-[380px] lg:min-h-[560px] bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
        >
          {/* Active 3D Render / Image */}
          <div 
            className="w-full h-full relative transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 20 * parallaxPower}px, ${mousePos.y * 20 * parallaxPower}px, 0) scale(1.05)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`,
            }}
          >
            {wallpaper.isModel3D && wallpaper.modelUrl ? (
              <Model3DViewer modelUrl={wallpaper.modelUrl} autoRotate={true} className="w-full h-full" />
            ) : wallpaper.videoUrl ? (
              <video
                key={wallpaper.videoUrl}
                src={wallpaper.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                poster={wallpaper.imageUrl || wallpaper.thumbnail || wallpaper.thumbnailUrl}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : wallpaper.isLive && wallpaper.shaderType ? (
              <ThreeLiveWallpaper shaderType={wallpaper.shaderType} interactive={true} className="w-full h-full" />
            ) : (
              <img
                src={wallpaper.imageUrl}
                alt={displayTitle}
                className="w-full h-full object-cover pointer-events-none"
              />
            )}
          </div>

          {/* Interactive Parallax HUD Indicator */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Move cursor to test 3D Depth Parallax</span>
          </div>
        </div>

        {/* Right Side: Controls, Color Matrix & Custom Export */}
        <div className="relative w-full lg:w-[410px] p-6 flex flex-col justify-between overflow-y-auto max-h-[88vh] bg-[#0A0E17]/95 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/10 space-y-4 shadow-2xl">
          
          <div className="space-y-3.5">
            {/* Title with safety right padding against close button */}
            <div className="pr-10">
              <h2 
                className="text-xl sm:text-2xl font-black text-white font-['Outfit'] line-clamp-2 overflow-hidden text-ellipsis leading-snug tracking-tight"
                title={displayTitle}
              >
                {displayTitle}
              </h2>

              {/* Clickable Theme & Style Tags */}
              {wallpaper.tags && wallpaper.tags.length > 0 && (
                <div className="pt-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1.5">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>THEMES & TAGS</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Click to filter grid)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wallpaper.tags.map((tag, idx) => {
                      const cleanTagName = tag.replace(/^#/, '');
                      return (
                        <button
                          key={`${tag}-${idx}`}
                          onClick={() => {
                            if (onSelectTag) {
                              onClose();
                              onSelectTag(cleanTagName);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-cyan-500/25 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/50 shadow-sm transition-all duration-200 flex items-center gap-1 cursor-pointer transform hover:-translate-y-0.5"
                          title={`Filter catalog by #${cleanTagName}`}
                        >
                          <Hash className="w-3 h-3 text-cyan-400 opacity-75" />
                          <span>{cleanTagName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 0: AUTO-SMOOTH ENGINE (Low Spec / Balanced / Max Ultra) */}
            <div className="industrial-glass-card p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Auto-Smooth Engine 2.0</span>
                </span>
                <span className="text-[10px] font-mono font-extrabold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/30 shadow-sm flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  {smoothProfile === 'low' ? '30 FPS ECO' : '144 FPS UNLOCKED'}
                </span>
              </div>
              
              <div className="segment-control-wrapper">
                <button
                  onClick={() => setSmoothProfile('low')}
                  className={`segment-btn ${smoothProfile === 'low' ? 'active' : ''}`}
                  title="Low Spec mode (Downscale, 30 FPS cap, minimal GPU RAM)"
                >
                  <span>Low Spec</span>
                </button>
                <button
                  onClick={() => setSmoothProfile('ultra')}
                  className={`segment-btn ${smoothProfile === 'ultra' ? 'active' : ''}`}
                  title="Max Ultra mode (Full resolution textures, high fidelity WebGL)"
                >
                  <span>Max Ultra</span>
                </button>
              </div>
            </div>


            {/* Card 2: Live Color Grading Glass Card with Tactile Sliders */}
            <div className="industrial-glass-card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Color Tuning</span>
                </span>
              </div>

              <div className="space-y-2">
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">Brightness</span>
                    <strong className="font-mono text-cyan-400 font-bold">{brightness}%</strong>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="140"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="tactile-slider"
                    title="Adjust Brightness"
                  />
                </div>

                {/* Vibrance / Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">Vibrance / Saturation</span>
                    <strong className="font-mono text-cyan-400 font-bold">{saturate}%</strong>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="180"
                    value={saturate}
                    onChange={(e) => setSaturate(parseInt(e.target.value))}
                    className="tactile-slider"
                    title="Adjust Vibrance and Saturation"
                  />
                </div>
              </div>
            </div>

            {/* Resolution Selector Cards with Notion / Spotify Accent Style & Check Icon */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export / Apply Resolution</span>
              </label>
              <div className="space-y-1.5">
                {resolutions.map((r) => {
                  const isActive = selectedRes === r.label;
                  return (
                    <button
                      key={r.label}
                      onClick={() => setSelectedRes(r.label)}
                      className={`res-card-premium w-full text-left cursor-pointer ${isActive ? 'active' : ''}`}
                    >
                      <div className="flex flex-col pl-1">
                        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {r.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.label.includes('8K') ? '7680×4320 Studio Master' : r.label.includes('4K') ? '3840×2160 Desktop Standard' : r.label.includes('Ultrawide') ? '3440×1440 Gaming Monitor' : '1170×2532 Phone Lockscreen'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                          isActive 
                            ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(56,189,248,0.3)]' 
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}>
                          {r.tag}
                        </span>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-[0_0_10px_#38bdf8]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION CONTROLS - 2 ROW LAYOUT */}
          <div className="space-y-2.5 pt-3 border-t border-white/10">
            {/* ROW 1: Split 50/50 Dual Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Button 1 (Left): Apply to Browser */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDesktopSim();
                }}
                className="py-2.5 px-3 rounded-xl bg-[#0e1626]/90 hover:bg-[#142036] border border-cyan-500/35 hover:border-cyan-400/70 text-slate-100 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_16px_rgba(6,182,212,0.3)] active:scale-95 group"
                title="Launch Browser-based Desktop Preview Simulation"
              >
                <ChromeIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">Apply to Browser</span>
              </button>

              {/* Button 2 (Right): Apply to Windows */}
              <button
                type="button"
                onClick={() => onApplyDesktop(wallpaper)}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 group ${
                  isApplied
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-emerald-400/80 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                    : 'bg-[#0e1626]/90 hover:bg-[#142036] border-cyan-500/35 hover:border-cyan-400/70 text-slate-100 hover:text-white hover:shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                }`}
                title="Apply wallpaper directly as active desktop wallpaper"
              >
                <WindowsLogo className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isApplied ? 'text-emerald-300' : 'text-cyan-400'}`} />
                <span className="truncate">{isApplied ? 'Applied to Windows' : 'Apply to Windows'}</span>
              </button>
            </div>

            {/* ROW 2: Full-Width Main Action Button - Download Asset (Video / Image) */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full relative overflow-hidden py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#173854]/95 via-[#184e62]/90 to-[#146678]/95 hover:from-[#1e486c] hover:via-[#1e5f77] hover:to-[#1a778c] border border-cyan-400/50 hover:border-cyan-300 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-[0_0_22px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 cursor-pointer active:scale-98 group disabled:opacity-75"
              title="Download full master resolution file"
            >
              {/* Soft radial glowing aura on the far right where the star sits */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-400/25 rounded-full blur-xl pointer-events-none transition-all duration-300 group-hover:bg-cyan-300/35" />

              {/* Centered Content with Download Arrow */}
              <div className="flex items-center gap-2 z-10">
                <span>{isDownloading ? 'Rendering Master Stream...' : 'Download Asset (Video / Image)'}</span>
                <Download className={`w-4 h-4 text-cyan-200 transition-transform group-hover:translate-y-0.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              </div>

              {/* Bright glowing diamond star on the far right edge */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
                <GlowingDiamondStar className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
              </div>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

