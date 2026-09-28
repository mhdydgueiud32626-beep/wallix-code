import React, { useState, useMemo } from 'react';
import { 
  Tag,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Shield,
  X
} from 'lucide-react';
import { Wallpaper, ResolutionType } from '../types';
import { WallpaperCard } from './WallpaperCard';
import { WallpaperCategoryBar, DEFAULT_WALLPAPER_CATEGORIES } from './WallpaperCategoryBar';
import { TagsBar } from './TagsBar';

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop: (w: Wallpaper) => void;
  onQuickDownload: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onOpenAddToCollection?: (w: Wallpaper) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedResolution: ResolutionType | 'All';
  searchQuery: string;
  activeFilterTab?: string;
  onFilterTabChange?: (tab: any) => void;
}

export const WallpaperGrid: React.FC<WallpaperGridProps> = ({
  wallpapers,
  favorites,
  activeWallpaperId,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  onOpenAddToCollection,
  onDelete,
  enableTilt = true,
  selectedCategory,
  onSelectCategory,
  selectedResolution,
  searchQuery,
  activeFilterTab: controlledFilterTab,
  onFilterTabChange,
}) => {
  const [internalFilterTab, setInternalFilterTab] = useState<string>('all');
  const activeFilterTab = controlledFilterTab !== undefined ? controlledFilterTab : internalFilterTab;
  
  const handleCategorySelect = (categoryId: string) => {
    setInternalFilterTab(categoryId);
    if (onFilterTabChange) onFilterTabChange(categoryId);
  };

  // Strict single-selection tag state
  const [activeTag, setActiveTag] = useState<string>("All");

  // Dynamically derive available tags from wallpapers with frequency
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    wallpapers.forEach((w) => {
      if (!Array.isArray(w.tags)) return;
      w.tags.forEach((rawTag) => {
        const clean = rawTag.replace(/^#/, '').trim().toLowerCase();
        if (
          clean &&
          clean.length >= 3 &&
          !['4k uhd', '8k ultra', 'video 60fps', 'exclusive', 'trending', 'makoto shinkai'].includes(clean)
        ) {
          counts.set(clean, (counts.get(clean) || 0) + 1);
        }
      });
    });

    // Sort by count descending, then alphabetical
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [wallpapers]);

  const tagsList = useMemo(() => {
    return [
      "All",
      ...availableTags.map((t) => `#${t.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`)
    ];
  }, [availableTags]);

  // Filtering Logic
  const filteredWallpapers = useMemo(() => {
    return wallpapers
      .filter((w) => {
        // Strict single-selection tag filter
        if (activeTag && activeTag !== "All") {
          const cleanActive = activeTag.replace(/^#/, '').trim().toLowerCase();
          const matchesTag = w.tags?.some((t) => t.replace(/^#/, '').trim().toLowerCase() === cleanActive);
          if (!matchesTag) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = w.title.toLowerCase().includes(q);
          const matchesCategory = w.category.toLowerCase().includes(q);
          const matchesTags = w.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesCategory && !matchesTags) return false;
        }

        // Category filter from sidebar
        if (selectedCategory !== 'all' && w.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Resolution filter from navbar
        if (selectedResolution !== 'All' && !w.resolution.includes(selectedResolution)) {
          return false;
        }

        // Active horizontal category filter tab
        const cat = (activeFilterTab || 'all').toLowerCase();
        if (cat === '4k' && !w.resolution.includes('4K')) return false;
        if ((cat === '8k' || cat === '8k-ultra') && !w.resolution.includes('8K')) return false;
        
        if (cat === 'anime') {
          const isAnime = w.category.toLowerCase().includes('anime') || w.tags?.some((t) => t.toLowerCase().includes('anime'));
          if (!isAnime) return false;
        }
        
        if (cat === 'nature') {
          const isNature = w.category.toLowerCase().includes('nature') || w.category.toLowerCase().includes('landscape') || w.tags?.some((t) => t.toLowerCase().includes('nature') || t.toLowerCase().includes('landscape') || t.toLowerCase().includes('mist'));
          if (!isNature) return false;
        }

        if (cat === 'space') {
          const isSpace = w.category.toLowerCase().includes('space') || w.category.toLowerCase().includes('nebula') || w.tags?.some((t) => t.toLowerCase().includes('space') || t.toLowerCase().includes('nebula') || t.toLowerCase().includes('abyss'));
          if (!isSpace) return false;
        }

        if (cat === 'shaders' || cat === 'live') {
          const isShader = w.isLive || w.isVideo || w.tags?.some((t) => t.toLowerCase().includes('live') || t.toLowerCase().includes('shader') || t.toLowerCase().includes('60fps'));
          if (!isShader) return false;
        }

        if (cat === 'gaming') {
          const isGaming = w.category.toLowerCase().includes('gaming') || w.tags?.some((t) => t.toLowerCase().includes('gaming') || t.toLowerCase().includes('controller') || t.toLowerCase().includes('cyberpunk'));
          if (!isGaming) return false;
        }

        if (cat === 'cars') {
          const isCars = w.category.toLowerCase().includes('car') || w.category.toLowerCase().includes('auto') || w.tags?.some((t) => t.toLowerCase().includes('car') || t.toLowerCase().includes('speed') || t.toLowerCase().includes('vehicle'));
          if (!isCars) return false;
        }

        if (cat === '3d' && !w.is3D) return false;
        if (cat === 'cyberpunk' && !w.category.toLowerCase().includes('cyberpunk') && !w.tags?.some((t) => t.toLowerCase().includes('cyberpunk'))) return false;
        if (cat === 'amoled' && !w.category.toLowerCase().includes('amoled') && !w.category.toLowerCase().includes('void')) return false;
        if (cat === 'minimalist' && !w.category.toLowerCase().includes('minimal') && !w.tags?.some((t) => t.toLowerCase().includes('minimal'))) return false;

        return true;
      });
  }, [wallpapers, searchQuery, selectedCategory, selectedResolution, activeFilterTab, activeTag]);

  return (
    <div id="main-wallpaper-gallery" className="space-y-4 scroll-mt-24">
      
      {/* 1. Single Authoritative Horizontal Category Bar (Progressive 10-by-10 Category Rail) */}
      <div className="relative py-1">
        <WallpaperCategoryBar
          categories={DEFAULT_WALLPAPER_CATEGORIES}
          activeCategory={activeFilterTab}
          onCategoryChange={handleCategorySelect}
        />
      </div>

      {/* 2. Strict Single-Selection Tags Bar with Spring Active Glow */}
      {tagsList.length > 0 && (
        <TagsBar
          tags={tagsList}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          className="px-1"
        />
      )}

      {/* 3. Wallpaper Grid: Responsive 3 to 4 Column Grid */}
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
              onOpenAddToCollection={onOpenAddToCollection}
              onDelete={onDelete}
              enableTilt={enableTilt}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-panel rounded-3xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Wallpapers Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-4">
            Try adjusting your search query, filter tabs, or resolution options.
          </p>
          <button
            onClick={() => {
              handleCategorySelect('all');
              onSelectCategory('all');
              setActiveTag("All");
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
};
