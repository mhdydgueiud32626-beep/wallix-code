import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Monitor, 
  Globe, 
  Check, 
  Zap, 
  Rocket, 
  Download, 
  Eye, 
  Heart, 
  FolderPlus 
} from 'lucide-react';

export interface PlatformSuiteProps {
  wallpaper: { id: string; title: string; imageUrl?: string };
  isApplied: boolean;
  isFavorite: boolean;
  isDownloading: boolean;
  onApplyDesktop: (wallpaper: any) => void;
  onDownloadMaster: () => void;
  onOpenBrowserPreview: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenFolder?: (wallpaper: any) => void;
}

export const PlatformSystemSuite: React.FC<PlatformSuiteProps> = ({
  wallpaper,
  isApplied,
  isFavorite,
  isDownloading,
  onApplyDesktop,
  onDownloadMaster,
  onOpenBrowserPreview,
  onToggleFavorite,
  onOpenFolder,
}) => {
  // State
  const [platform, setPlatform] = useState<'windows' | 'browser'>('windows');
  const [windowsVersion, setWindowsVersion] = useState<
    'Windows 11' | 'Windows 10' | 'Windows 7/Legacy' | 'Windows Arm64'
  >('Windows 11');
  const [autoFitRes, setAutoFitRes] = useState<boolean>(true);
  const [detectedDisplay, setDetectedDisplay] = useState({ width: 1920, height: 1080, dpr: 1 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDetectedDisplay({
        width: window.screen?.width || window.innerWidth || 1920,
        height: window.screen?.height || window.innerHeight || 1080,
        dpr: window.devicePixelRatio || 1,
      });
    }
  }, []);

  return (
    <div className="space-y-3 pt-3 border-t border-white/10">
      {/* 1. Main Section Title */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          <span>PLATFORM & SYSTEM SUITE</span>
        </span>
        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          {platform === 'windows' ? windowsVersion : 'Web Browser'}
        </span>
      </div>

      {/* 2. First Layer: Two Primary Selector Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Button 1: Windows OS */}
        <button
          type="button"
          onClick={() => setPlatform('windows')}
          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            platform === 'windows'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
        >
          <Monitor className={`w-4 h-4 ${platform === 'windows' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>Windows OS</span>
        </button>

        {/* Button 2: Web Browser */}
        <button
          type="button"
          onClick={() => {
            setPlatform('browser');
            onOpenBrowserPreview();
          }}
          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            platform === 'browser'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
        >
          <Globe className={`w-4 h-4 ${platform === 'browser' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>Web Browser</span>
        </button>
      </div>

      {/* 3. Windows OS Sub-Selection Menu */}
      {platform === 'windows' ? (
        <div className="space-y-3 pt-1">
          {/* Sub-Selection: Select Windows Version */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Select Windows Version</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Supported OS</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Windows 11', 'Windows 10', 'Windows 7/Legacy', 'Windows Arm64'] as const).map((ver) => {
                const isVerActive = windowsVersion === ver;
                return (
                  <button
                    key={ver}
                    type="button"
                    onClick={() => setWindowsVersion(ver)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-left flex items-center justify-between border transition cursor-pointer ${
                      isVerActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{ver}</span>
                    {isVerActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Action Controls: Toggle Switch Auto-Fit Resolution */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Fit Resolution</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {autoFitRes
                  ? `Auto-detected: ${detectedDisplay.width}×${detectedDisplay.height} (${detectedDisplay.dpr}x DPR)`
                  : 'Custom display mode active'}
              </span>
            </div>

            {/* Tactile Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={autoFitRes}
              onClick={() => setAutoFitRes(!autoFitRes)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer border ${
                autoFitRes
                  ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800 border-white/15'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoFitRes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. Main and Secondary Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => onApplyDesktop(wallpaper)}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition cursor-pointer shadow-xl ${
                isApplied
                  ? 'btn-applied-emerald'
                  : 'btn-primary-shimmer text-white hover:scale-[1.01] active:scale-95'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Active Desktop Wallpaper ({windowsVersion})</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-white animate-pulse" />
                  <span>Apply Desktop Wallpaper</span>
                </>
              )}
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={onDownloadMaster}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-tertiary-glass font-bold text-xs text-slate-200 hover:text-white border border-white/15 hover:border-cyan-400/40 transition cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 text-cyan-400 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Rendering Master Stream...' : 'Download Master (4K)'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Web Browser Preview View */
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Globe className="w-4 h-4" />
              <span>Web Browser Wallpaper Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Preview interactive shaders, WebGL particle physics, and live 3D depth directly inside the browser viewport.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenBrowserPreview}
              className="btn-primary-shimmer w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition cursor-pointer shadow-xl"
            >
              <Eye className="w-4 h-4 text-white" />
              <span>Launch Browser Preview</span>
            </button>

            <button
              type="button"
              onClick={onDownloadMaster}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-tertiary-glass font-bold text-xs text-slate-200 hover:text-white border border-white/15 hover:border-cyan-400/40 transition cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 text-cyan-400 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>Download Master (4K)</span>
            </button>
          </div>
        </div>
      )}

      {/* Accessory Utilities: Favorite & Folder */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
        <button
          type="button"
          onClick={() => onToggleFavorite(wallpaper.id)}
          className={`flex-1 py-2 px-2.5 rounded-xl btn-tertiary-glass flex items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
            isFavorite
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-400' : ''}`} />
          <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
        </button>

        {onOpenFolder && (
          <button
            type="button"
            onClick={() => onOpenFolder(wallpaper)}
            className="flex-1 py-2 px-3 rounded-xl btn-tertiary-glass text-slate-300 hover:text-cyan-300 flex items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Folder</span>
          </button>
        )}
      </div>
    </div>
  );
};
