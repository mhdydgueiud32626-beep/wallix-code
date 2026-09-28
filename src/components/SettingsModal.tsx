import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  Trash2, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  favoritesCount?: number;
  onClearCache?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearCache,
}) => {
  // Local reactive states matching the UI controls
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);
  const [batterySaver, setBatterySaver] = useState<boolean>(false);
  const [ultraFps, setUltraFps] = useState<boolean>(true);
  const [autoMute, setAutoMute] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(75);
  const [downloadFormat, setDownloadFormat] = useState<'4K UHD' | '8K Ultra' | 'MP4 Video' | 'PNG Image'>('4K UHD');
  const [isCacheCleared, setIsCacheCleared] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleGpu = () => {
    const next = !gpuAcceleration;
    setGpuAcceleration(next);
    onUpdateSettings({ targetFPS: next ? 120 : 60 });
  };

  const handleToggleBattery = () => {
    const next = !batterySaver;
    setBatterySaver(next);
    if (next) {
      setUltraFps(false);
      onUpdateSettings({ targetFPS: 60, parallaxEnabled: false });
    } else {
      setUltraFps(true);
      onUpdateSettings({ targetFPS: 120, parallaxEnabled: true });
    }
  };

  const handleToggleUltraFps = () => {
    const next = !ultraFps;
    setUltraFps(next);
    onUpdateSettings({ targetFPS: next ? 120 : 60 });
  };

  const handleToggleAutoMute = () => {
    const next = !autoMute;
    setAutoMute(next);
    onUpdateSettings({ liveWallpaperAudioReactive: !next });
  };

  const handleClearAppCache = () => {
    try {
      sessionStorage.clear();
      if (onClearCache) onClearCache();
      setIsCacheCleared(true);
      setTimeout(() => setIsCacheCleared(false), 2500);
    } catch {}
  };

  return (
    <div 
      id="wallix-settings-drawer-backdrop"
      className="fixed inset-0 z-50 pointer-events-auto bg-black/20 backdrop-blur-[2px] flex justify-end p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="wallix-settings-drawer"
        style={{
          background: 'rgba(10, 15, 30, 0.45)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 0 25px rgba(6, 182, 212, 0.12)',
        }}
        className="relative w-full max-w-[360px] sm:max-w-[380px] h-fit max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar rounded-2xl p-5 sm:p-6 space-y-4 text-white animate-slideInRight select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* HEADER: TITLE + CLOSE (✕)                                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.09]">
          <h2 className="font-['Outfit'] font-black text-base sm:text-lg tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            SETTINGS
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer shadow-sm"
            title="Close Settings (Esc)"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PERFORMANCE MODE                                               */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-y-3">
          <h3 className="font-bold text-xs text-slate-200 tracking-wide drop-shadow-sm">
            Performance Mode
          </h3>

          <div className="space-y-2.5">
            {/* GPU Acceleration */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">GPU Acceleration</span>
              <button
                type="button"
                onClick={handleToggleGpu}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                  gpuAcceleration
                    ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-black/50 border border-white/15'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    gpuAcceleration ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                  }`}
                />
              </button>
            </div>

            {/* Battery Saver (Low Spec) */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">Battery Saver (Low Spec)</span>
              <button
                type="button"
                onClick={handleToggleBattery}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                  batterySaver
                    ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-black/50 border border-white/15'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    batterySaver ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                  }`}
                />
              </button>
            </div>

            {/* 60 FPS Ultra Shaders */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">60 FPS Ultra Shaders</span>
              <button
                type="button"
                onClick={handleToggleUltraFps}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                  ultraFps
                    ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-black/50 border border-white/15'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    ultraFps ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: AUDIO & MEDIA                                                  */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-y-3">
          <h3 className="font-bold text-xs text-slate-200 tracking-wide drop-shadow-sm">
            Audio & Media
          </h3>

          <div className="space-y-2.5">
            <span className="text-[11px] text-slate-300 block">
              Live video wallpapers with:
            </span>

            {/* Volume Slider Bar with Icon */}
            <div className="flex items-center gap-3">
              <div className="text-cyan-400">
                {autoMute || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_#38bdf8]" />
                )}
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={autoMute ? 0 : volume}
                disabled={autoMute}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none disabled:opacity-40 border border-white/10"
              />
            </div>

            {/* Auto-Mute Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-200 font-medium">Auto-Mute</span>
              <button
                type="button"
                onClick={handleToggleAutoMute}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                  autoMute
                    ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-black/50 border border-white/15'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    autoMute ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: DEFAULT DOWNLOAD FORMAT                                        */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-y-3">
          <h3 className="font-bold text-xs text-slate-200 tracking-wide drop-shadow-sm">
            Default Download Format
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {(['4K UHD', '8K Ultra', 'MP4 Video', 'PNG Image'] as const).map((fmt) => {
              const isSelected = downloadFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setDownloadFormat(fmt);
                    if (fmt === '4K UHD' || fmt === '8K Ultra') {
                      onUpdateSettings({ defaultResolution: fmt });
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.35)] font-bold'
                      : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: STORAGE                                                        */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-y-2">
          <h3 className="font-bold text-xs text-slate-200 tracking-wide drop-shadow-sm">
            Storage
          </h3>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-slate-200 font-mono">
              App Cache: 2.1 GB
            </span>

            <button
              type="button"
              onClick={handleClearAppCache}
              className={`py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isCacheCleared
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-cyan-950/30 text-cyan-300 border-cyan-400/80 hover:bg-cyan-500/25 hover:border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
              }`}
            >
              {isCacheCleared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                  <span>Cleared</span>
                </>
              ) : (
                <span>Clear Cache</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
