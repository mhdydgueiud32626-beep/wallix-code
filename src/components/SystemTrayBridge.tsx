import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Settings, 
  Power, 
  LayoutTemplate, 
  Keyboard, 
  ChevronDown, 
  Activity, 
  Check,
  Zap
} from 'lucide-react';
import { DESKTOP_SKETCH_PRESETS, DesktopPresetItem } from '../data/layoutPresets';

interface SystemTrayBridgeProps {
  onBackToApp: () => void;
  activePresetId?: string;
  onSelectPreset?: (preset: DesktopPresetItem) => void;
  isPaused?: boolean;
}

export const SystemTrayBridge: React.FC<SystemTrayBridgeProps> = ({
  onBackToApp,
  activePresetId = 'preset_1_analog_suite',
  onSelectPreset,
  isPaused = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(true);

  // Global hotkey listener (Ctrl+Shift+W or Cmd+Shift+W or Esc to return to app)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'W' || e.key === 'w')) {
        e.preventDefault();
        onBackToApp();
      } else if (e.key === 'Escape' && !isMenuOpen) {
        onBackToApp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToApp, isMenuOpen]);

  // Hide the initial notification toast after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const activePreset = DESKTOP_SKETCH_PRESETS.find((p) => p.id === activePresetId) || DESKTOP_SKETCH_PRESETS[0];

  return (
    <>
      {/* Toast Notification on Enter Desktop Mode */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 text-white max-w-sm">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{activePreset.name} Active</span>
              </p>
              <p className="text-[11px] text-slate-300">
                Press <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[10px] font-mono text-cyan-300">Ctrl+Shift+W</kbd> or Tray to return.
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating System Tray Hub in Top-Right Corner */}
      <div className="fixed top-4 right-4 z-40 pointer-events-auto">
        <div className="relative">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/85 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 text-white">
            
            {/* Back to App Primary Button */}
            <button
              id="system-tray-back-to-app-btn"
              onClick={onBackToApp}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95"
              title="Return to WALLIX Main Marketplace Dashboard (Ctrl+Shift+W)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-[9px] font-mono text-cyan-200">
                Ctrl+Shift+W
              </kbd>
            </button>

            {/* Tray Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="System Tray Settings & Presets"
            >
              <ChevronDown className={`w-3.5 h-3.5 text-cyan-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded System Tray Dropdown Menu */}
          {isMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-72 p-2 bg-zinc-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              {/* Header Status */}
              <div className="px-3 py-2 border-b border-white/10 mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>WALLIX Background Engine</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isPaused ? '0% CPU (Paused)' : '60 FPS'}
                </span>
              </div>

              {/* Preset Switcher Section */}
              <div className="p-1 space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Switch Sketch Layout Preset
                </div>

                {DESKTOP_SKETCH_PRESETS.map((p) => {
                  const isSelected = activePresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPreset && onSelectPreset(p)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-white border border-cyan-400/50'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.sketchLabel}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
                <button
                  onClick={onBackToApp}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Main Dashboard</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Esc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
