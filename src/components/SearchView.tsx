import React, { useMemo, useRef } from 'react';
import { Wallpaper } from '../types';
import { WallpaperCard } from './WallpaperCard';
import { getDynamicDirectoryItems, matchesDirectoryItem } from '../data/directory';
import { SearchIcon, type SearchIconHandle } from '@animateicons/react/lucide';
import { 
  X, 
  Tag,
  Hash
} from 'lucide-react';

interface SearchViewProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop: (w: Wallpaper) => void;
  onQuickDownload: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedDirectoryId: string;
  onSelectDirectoryId: (id: string) => void;
  selectedResolution: string;
  onSelectResolution: (res: string) => void;
}

const POPULAR_TAGS = [
  'Cyberpunk',
  'Live 60FPS',
  'Anime',
  'Dark AMOLED',
  'Cosmic Nebula',
  'Minimalist',
  'Cars',
  'Nature',
  '4K UHD',
  'Abstract 3D'
];

export const SearchView: React.FC<SearchViewProps> = ({
  wallpapers,
  favorites,
  activeWallpaperId,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  onDelete,
  enableTilt = true,
  searchQuery,
  onSearchQueryChange,
  selectedDirectoryId,
  onSelectDirectoryId,
  selectedResolution,
  onSelectResolution,
}) => {
  const searchIconRef = useRef<SearchIconHandle>(null);

  const dynamicDirectoryItems = useMemo(() => {
    return getDynamicDirectoryItems(wallpapers);
  }, [wallpapers]);

  // Filter Wallpapers based on Search Query, Left Directory selection, and Resolution
  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((w) => {
      // 1. Search Query filter (searches title, category, tags, author, description, resolution)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesCategory = w.category.toLowerCase().includes(q);
        const matchesTags = Array.isArray(w.tags) && w.tags.some(tag => tag.toLowerCase().includes(q));
        const matchesAuthor = w.author?.name ? w.author.name.toLowerCase().includes(q) : false;
        const matchesDesc = w.description ? w.description.toLowerCase().includes(q) : false;
        const matchesResolution = (w.resolution || '').toLowerCase().includes(q) || (w.resolutionText || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesTags && !matchesAuthor && !matchesDesc && !matchesResolution) {
          return false;
        }
      }

      // 2. Left Directory category filter (Dynamic Real-Time Detector)
      if (selectedDirectoryId !== 'all') {
        const item = dynamicDirectoryItems.find(d => d.id === selectedDirectoryId);
        if (item && !matchesDirectoryItem(w, item)) {
          return false;
        }
      }

      // 3. Resolution filter
      if (selectedResolution !== 'all') {
        if (selectedResolution === '4K' && !w.resolution.includes('4K')) return false;
        if (selectedResolution === '8K' && !w.resolution.includes('8K')) return false;
        if (selectedResolution === 'Live' && !w.isLive && !w.videoUrl) return false;
        if (selectedResolution === '3D' && !w.is3D && !w.isModel3D) return false;
      }

      return true;
    });
  }, [wallpapers, searchQuery, selectedDirectoryId, selectedResolution, dynamicDirectoryItems]);

  const activeDirectoryItem = dynamicDirectoryItems.find(d => d.id === selectedDirectoryId);

  const handleTagClick = (tag: string) => {
    const clean = tag.replace(/^#/, '');
    onSearchQueryChange(clean);
  };

  return (
    <div id="wallix-search-view" className="w-full max-w-none space-y-5 pb-12 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ========================================================================= */}
      {/* 1. TOP SEARCH & CORE VAULT MASTER HEADER                                  */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#121629] via-[#0E1222] to-[#0A0D18] border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
        
        {/* ROW 1: Clean, full-width search input with integrated animated search icon */}
        <div className="relative w-full">
          <div 
            className="relative flex items-center group w-full"
            onMouseEnter={() => searchIconRef.current?.startAnimation()}
            onMouseLeave={() => searchIconRef.current?.stopAnimation()}
          >
            <div 
              className="absolute left-3.5 z-10 text-cyan-400 flex items-center justify-center transition-transform group-focus-within:scale-105 pointer-events-auto cursor-pointer"
              onClick={() => {
                searchIconRef.current?.startAnimation();
                document.getElementById('search-view-debounced-input')?.focus();
              }}
              onMouseEnter={() => searchIconRef.current?.startAnimation()}
              onMouseLeave={() => searchIconRef.current?.stopAnimation()}
            >
              <SearchIcon
                ref={searchIconRef}
                size={22}
                duration={1}
                color="#38bdf8"
                className="text-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] cursor-pointer"
              />
            </div>
            <input
              id="search-view-debounced-input"
              type="text"
              value={searchQuery}
              onFocus={() => searchIconRef.current?.startAnimation()}
              onBlur={() => searchIconRef.current?.stopAnimation()}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                } else if (e.key === 'Escape') {
                  onSearchQueryChange('');
                }
              }}
              placeholder="Search 4K/8K, 3D Wallpapers, Shaders, Anime, Cyberpunk..."
              className="w-full bg-[#15192C]/95 hover:bg-[#191F37] focus:bg-[#191F37] text-sm text-white placeholder-slate-400/70 pl-11 pr-10 py-3.5 rounded-2xl border border-white/15 focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-500/20 shadow-inner backdrop-blur-md focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Sleek, premium stylized title badge/header: "WALLIX CORE VAULT" */}
        <div className="flex items-center gap-2 px-1 pt-0.5 pb-1 border-b border-white/[0.07]">
          <h1 className="text-base sm:text-lg font-black tracking-wider uppercase font-['Outfit'] bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            WALLIX CORE VAULT
          </h1>
          <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
            8K ULTRA
          </span>
        </div>

        {/* ROW 3: Popular Themes / Quick Chips cleanly aligned underneath */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0 mr-1 select-none">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>POPULAR THEMES:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {POPULAR_TAGS.map((tag) => {
              const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/10 hover:border-cyan-400/30'
                  }`}
                >
                  <Hash className="w-3 h-3 text-cyan-400/70" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RESPONSIVE 3-4 COLUMN WALLPAPER MEDIA GRID */}
      {/* ========================================================================= */}
      {filteredWallpapers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
          {filteredWallpapers.map((wallpaper) => (
            <WallpaperCard
              key={wallpaper.id}
              wallpaper={wallpaper}
              isFavorite={favorites.includes(wallpaper.id)}
              isApplied={activeWallpaperId === wallpaper.id}
              onToggleFavorite={onToggleFavorite}
              onInspect={onInspect}
              onApplyDesktop={onApplyDesktop}
              onQuickDownload={onQuickDownload}
              onOpenDesktopSim={onOpenDesktopSim}
              onShare={onShare}
              onDelete={onDelete}
              enableTilt={enableTilt}
            />
          ))}
        </div>
      ) : (
        <div className="w-full p-16 rounded-3xl bg-[#0D0F18]/80 border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <SearchIcon size={32} duration={1} color="#38bdf8" />
          </div>
          <h3 className="text-lg font-black text-white font-['Outfit']">No Matching Wallpapers Found</h3>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                onSearchQueryChange('');
                onSelectDirectoryId('all');
                onSelectResolution('all');
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              Clear Search & Reset Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};


