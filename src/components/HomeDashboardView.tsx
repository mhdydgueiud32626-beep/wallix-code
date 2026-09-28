import React from 'react';
import { Wallpaper, ResolutionType } from '../types';
import { HeroCarousel } from './HeroCarousel';
import { WallpaperGrid } from './WallpaperGrid';

export interface HomeDashboardViewProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaper: Wallpaper;
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
  activeFilterTab?: 'All' | '3D' | 'Live' | '4K' | '8K' | 'Cyber' | 'Anime' | 'Nature' | 'Space';
  onFilterTabChange?: (tab: 'All' | '3D' | 'Live' | '4K' | '8K' | 'Cyber' | 'Anime' | 'Nature' | 'Space') => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  wallpapers,
  favorites,
  activeWallpaper,
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
  activeFilterTab = 'All',
  onFilterTabChange,
}) => {
  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* 1. Large Immersive Featured Wallpaper Hero */}
      <HeroCarousel
        wallpapers={wallpapers}
        selectedWallpaper={activeWallpaper}
        onInspect={onInspect}
        onApplyDesktop={onApplyDesktop}
        onQuickDownload={onQuickDownload}
        onOpenDesktopSim={onOpenDesktopSim}
        onShare={onShare}
        activeWallpaperId={activeWallpaperId || activeWallpaper?.id}
      />

      {/* 2. Category Selector & Responsive Wallpaper Gallery Grid */}
      <WallpaperGrid
        wallpapers={wallpapers}
        favorites={favorites}
        activeWallpaperId={activeWallpaperId || activeWallpaper?.id}
        onToggleFavorite={onToggleFavorite}
        onInspect={onInspect}
        onApplyDesktop={onApplyDesktop}
        onQuickDownload={onQuickDownload}
        onOpenDesktopSim={onOpenDesktopSim}
        onShare={onShare}
        onOpenAddToCollection={onOpenAddToCollection}
        onDelete={onDelete}
        enableTilt={enableTilt}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        selectedResolution={selectedResolution}
        searchQuery={searchQuery}
        activeFilterTab={activeFilterTab}
        onFilterTabChange={onFilterTabChange}
      />
    </div>
  );
};
