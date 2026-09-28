import React, { useState } from 'react';
import { Wallpaper } from '../../types';
import { 
  Smartphone, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Download, 
  Sliders, 
  Zap, 
  Clock, 
  Battery, 
  Wifi, 
  Eye,
  RotateCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MobileTargetWorkspaceProps {
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  onBackToTargets: () => void;
  onSelectWallpaper: (w: Wallpaper) => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const MobileTargetWorkspace: React.FC<MobileTargetWorkspaceProps> = ({
  wallpapers,
  activeWallpaper,
  onBackToTargets,
  onSelectWallpaper,
  onShowToast,
}) => {
  const [cropAlign, setCropAlign] = useState<'center' | 'top' | 'subject'>('center');
  const [amoledTrueBlack, setAmoledTrueBlack] = useState<boolean>(true);
  const [gyroParallax, setGyroParallax] = useState<'mild' | 'standard' | 'off'>('standard');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportMobile = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#06b6d4']
      });
      // trigger download
      const link = document.createElement('a');
      link.href = activeWallpaper.imageUrl;
      link.download = `WALLIX-Mobile-9x16-${activeWallpaper.title.replace(/\s+/g, '-')}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onShowToast) {
        onShowToast({
          title: '9:16 Mobile UHD Wallpaper Saved',
          subtitle: 'Ready for iOS Lock Screen & Android AMOLED',
          icon: <Smartphone className="w-4 h-4 text-emerald-400" />
        });
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/30 border border-emerald-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            id="mobile-back-btn"
            onClick={onBackToTargets}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-emerald-400" />
            <span>All Targets</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Mobile & OLED Screen Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Target Isolated
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                9:16 Vertical Portrait UHD & AMOLED True-Black Optimization
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportMobile}
          disabled={isExporting}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer shadow-emerald-900/40"
        >
          {isExporting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Save 9:16 Vertical UHD</span>
        </button>
      </div>

      {/* 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>9:16 Vertical Crop Focal Alignment</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'center', label: 'Center Focus' },
                { id: 'top', label: 'Top Header' },
                { id: 'subject', label: 'Subject Lock' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCropAlign(c.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                    cropAlign === c.id
                      ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">AMOLED True Black Mode</h4>
                <p className="text-[11px] text-slate-400">Deepens shadow pixels to #000000 to save battery on OLED</p>
              </div>
              <button
                onClick={() => setAmoledTrueBlack(!amoledTrueBlack)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  amoledTrueBlack ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  amoledTrueBlack ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Quick Wallpaper Switcher */}
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Active Mobile Artwork</span>
            </span>

            <div className="grid grid-cols-4 gap-2">
              {wallpapers.slice(0, 8).map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWallpaper(w)}
                  className={`relative aspect-[9/16] rounded-lg overflow-hidden border cursor-pointer group ${
                    activeWallpaper.id === w.id
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50'
                      : 'border-white/10 hover:border-emerald-400/40'
                  }`}
                >
                  <img
                    src={w.thumbnailUrl || w.imageUrl}
                    alt={w.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {activeWallpaper.id === w.id && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-black" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Phone Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-64 aspect-[9/19] rounded-[42px] p-3 bg-black border-4 border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Dynamic Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-end px-2">
              <div className="w-2 h-2 rounded-full bg-blue-900/60" />
            </div>

            {/* Mobile Wallpaper Image */}
            <img
              src={activeWallpaper.imageUrl}
              alt={activeWallpaper.title}
              className={`absolute inset-0 w-full h-full object-cover ${
                cropAlign === 'top' ? 'object-top' : 'object-center'
              } ${amoledTrueBlack ? 'contrast-110 brightness-95' : ''}`}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Top Status */}
            <div className="relative z-20 flex items-center justify-between px-3 pt-2 text-[10px] text-white font-mono">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Center Lock Screen Clock */}
            <div className="relative z-20 text-center space-y-1 my-auto">
              <span className="text-4xl font-bold font-['Outfit'] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block">
                09:41
              </span>
              <span className="text-xs text-slate-200 font-medium drop-shadow block">
                Sunday, September 7
              </span>
            </div>

            {/* Bottom Home Indicator */}
            <div className="relative z-20 pb-2 flex flex-col items-center gap-2">
              <span className="text-[9px] text-slate-300 font-mono tracking-widest uppercase">
                Swipe up to unlock
              </span>
              <div className="w-28 h-1 bg-white/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
