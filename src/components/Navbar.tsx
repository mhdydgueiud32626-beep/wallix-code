import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X,
  FileVideo,
  Search,
  Zap,
  ArrowRight,
  Tag,
  Monitor,
  Check
} from 'lucide-react';
import { WallixLogo3D } from './WallixLogo3D';
import { AnimatedSearchIcon } from './icons/AnimatedIcons';
import { Wallpaper } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface NavbarProps {
  onOpenLanding: () => void;
  onOpenSimulator?: () => void;
  onOpenStudio?: () => void;
  onOpenExtensionStudio?: () => void;
  userEmail?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isGpuSaverActive?: boolean;
  onToggleGpuSaver?: () => void;
  isSearchHighlighted?: boolean;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
  wallpapers?: Wallpaper[];
  onInspectWallpaper?: (w: Wallpaper) => void;
  onSelectTag?: (tag: string) => void;
  onNavigateSearch?: () => void;
  viewMode?: 'preview' | 'live-desktop';
  onToggleViewMode?: (mode: 'preview' | 'live-desktop') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLanding,
  onOpenSimulator,
  onOpenStudio,
  onOpenExtensionStudio,
  searchQuery = '',
  onSearchChange,
  isSearchHighlighted = false,
  wallpapers = [],
  onInspectWallpaper,
  onSelectTag,
  onNavigateSearch,
  viewMode = 'preview',
  onToggleViewMode,
}) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter wallpaper results based on debounced query
  const matchingWallpapers = React.useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1 || !wallpapers) return [];
    const q = debouncedQuery.toLowerCase();
    return wallpapers.filter((w) => {
      const titleMatch = (w.title || '').toLowerCase().includes(q);
      const catMatch = (w.category || '').toLowerCase().includes(q);
      const resMatch = (w.resolution || '').toLowerCase().includes(q) || (w.resolutionText || '').toLowerCase().includes(q);
      const tagMatch = Array.isArray(w.tags) && w.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || catMatch || resMatch || tagMatch;
    }).slice(0, 7); // Show top 7 instant matches
  }, [debouncedQuery, wallpapers]);

  const popularSuggestions = ['Cyberpunk', 'Live 60FPS', 'Anime', 'Dark AMOLED', 'Cosmic Nebula', 'Minimalist', '4K UHD', 'Nature'];

  return (
    <header 
      id="wallix-navbar" 
      className="w-full h-16 sticky top-0 z-50 glass-panel border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0E1017]/90 backdrop-blur-2xl"
    >
      {/* Far Top-Left (above sidebar): 3D 'W' Brand Logo + WALLIX APP + 3D PRO Badge */}
      <div className="flex items-center gap-6 min-w-[240px]">
        <div 
          onClick={onOpenLanding}
          className="flex items-center gap-3 cursor-pointer group select-none transition-transform duration-200 active:scale-98"
          title="WALLIX APP — Return to 3D Arc Landing"
        >
          <WallixLogo3D size={34} className="transition-transform duration-300 group-hover:scale-105" />
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-xl tracking-wider font-['Outfit'] group-hover:text-cyan-300 transition-colors drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
              WALLIX APP
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              3D PRO
            </span>
          </div>
        </div>
      </div>

      {/* Top-Right: Clean Contextual Actions & Mode Toggle */}
      <div className="flex items-center gap-2.5">
        {onToggleViewMode ? (
          <div className="flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/10 shadow-inner">
            <button
              id="nav-toggle-preview-btn"
              onClick={() => onToggleViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Wallpaper Preview & Gallery mode"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preview</span>
            </button>
            <button
              id="nav-toggle-live-desktop-btn"
              onClick={() => onToggleViewMode('live-desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'live-desktop'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Live Desktop mode"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Desktop</span>
            </button>
          </div>
        ) : onOpenSimulator ? (
          <button
            id="nav-desktop-sim-btn"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40 text-xs font-semibold transition cursor-pointer"
            title="Open Live Desktop Simulator"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Live Desktop</span>
          </button>
        ) : null}
      </div>
    </header>
  );
};



