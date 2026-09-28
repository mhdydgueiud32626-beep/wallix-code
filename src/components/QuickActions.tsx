import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  History, 
  Shuffle, 
  Sparkles, 
  Check, 
  Layers,
  ChevronUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface QuickActionsProps {
  onOpenDownloadHistory: () => void;
  onClearCache: () => void;
  onRandomWallpaper?: () => void;
  onToggleParallax?: () => void;
  parallaxEnabled?: boolean;
  downloadsCount?: number;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenDownloadHistory,
  onClearCache,
  onRandomWallpaper,
  onToggleParallax,
  parallaxEnabled = true,
  downloadsCount = 0,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Monitor native full-screen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Full-screen toggle handler
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        if (onShowToast) {
          onShowToast({
            title: 'Fullscreen Mode Activated',
            subtitle: 'Press ESC anytime to exit fullscreen',
            icon: <Maximize2 className="w-4 h-4 text-cyan-300" />
          });
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        if (onShowToast) {
          onShowToast({
            title: 'Exited Fullscreen Mode',
            subtitle: 'Standard window layout restored',
            icon: <Minimize2 className="w-4 h-4 text-slate-300" />
          });
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed or restricted:', err);
    }
    setIsOpen(false);
  };

  // Clear cache handler
  const handleClearCacheClick = () => {
    setClearingCache(true);
    try {
      // Clear temporary search caches and session flags
      sessionStorage.clear();
      localStorage.removeItem('wallix_search_cache');
      localStorage.removeItem('wallix_recent_queries');
      
      onClearCache();

      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: 0.1, y: 0.9 },
        colors: ['#06b6d4', '#38bdf8', '#818cf8', '#ffffff']
      });

      if (onShowToast) {
        onShowToast({
          title: 'Cache & Session Cleaned',
          subtitle: 'Temporary search and render caches cleared successfully',
          icon: <Check className="w-4 h-4 text-emerald-400" />
        });
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setClearingCache(false);
      setIsOpen(false);
    }, 400);
  };

  return (
    <div 
      id="wallix-quick-actions-container" 
      ref={menuRef} 
      className="fixed bottom-6 left-6 z-40 select-none font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Expanded Quick Actions Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-16 left-0 w-72 rounded-3xl bg-[#0F1322]/95 backdrop-blur-2xl border border-white/15 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(6,182,212,0.2)] space-y-1.5 z-50 overflow-hidden"
          >
            {/* Header / Title */}
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                  Quick Actions
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 1: Open Download History */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDownloadHistory();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-400/30 text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                    Open Download History
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Offline master logs & files
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-cyan-300 border border-white/10">
                {downloadsCount}
              </span>
            </button>

            {/* Action 2: Toggle Full-screen Mode */}
            <button
              onClick={handleToggleFullscreen}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-400/30 text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {isFullscreen ? 'Exit Full-screen' : 'Toggle Full-screen Mode'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isFullscreen ? 'Restore standard view' : 'Immersive canvas experience'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300">
                {isFullscreen ? 'ON' : 'F11'}
              </span>
            </button>

            {/* Action 3: Clear Cache */}
            <button
              onClick={handleClearCacheClick}
              disabled={clearingCache}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-rose-200 transition-colors">
                    {clearingCache ? 'Cleaning Cache...' : 'Clear Cache'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Purge temporary assets & session
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-rose-300">
                Purge
              </span>
            </button>

            {/* Action 4: Random Wallpaper Shuffle */}
            {onRandomWallpaper && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onRandomWallpaper();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors">
                      Shuffle Wallpaper
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Pick a random 4K master
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-300">
                  🎲
                </span>
              </button>
            )}

            {/* Action 5: Toggle 3D Parallax Tilt */}
            {onToggleParallax && (
              <button
                onClick={() => {
                  onToggleParallax();
                  if (onShowToast) {
                    onShowToast({
                      title: !parallaxEnabled ? '3D Parallax Enabled' : '3D Parallax Paused',
                      subtitle: !parallaxEnabled ? 'Hover over wallpaper cards to experience depth' : 'Flat card mode active',
                      icon: <Layers className="w-4 h-4 text-cyan-300" />
                    });
                  }
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-400/30 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                      3D Depth Parallax
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Card tilt & depth physics
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  parallaxEnabled 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' 
                    : 'bg-white/10 text-slate-400'
                }`}>
                  {parallaxEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Main Button Trigger */}
      <motion.button
        id="quick-actions-fab-btn"
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full border transition-all duration-300 shadow-2xl cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
            : 'bg-[#121526]/90 hover:bg-[#181d33] text-slate-200 hover:text-white border-white/20 hover:border-cyan-400/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.25)]'
        }`}
        title="Quick Actions (Clear Cache, Fullscreen, Download History)"
      >
        {/* Animated Glow Ring */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-30 group-hover:opacity-75 blur-sm transition-opacity duration-300 pointer-events-none -z-10" />

        <div className="relative flex items-center justify-center">
          <Zap className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90 text-white' : 'text-cyan-400 group-hover:rotate-12'}`} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>

        <span className="text-xs font-black tracking-wide font-['Outfit']">
          Quick Actions
        </span>

        <ChevronUp className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </motion.button>
    </div>
  );
};
