import React, { useState, useMemo } from 'react';
import { NavTab, PlatformOS, Wallpaper, ChromeSubTab, WallpaperSubTab } from '../types';
import { getDynamicDirectoryItems, getDynamicFormatCounts } from '../data/directory';
import { 
  Menu,
  Home, 
  Search, 
  Monitor, 
  Heart, 
  Settings,
  ArrowLeft, 
  Globe
} from 'lucide-react';
import { SidebarNavigation, NavRailItem } from './SidebarNavigation';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  wallpapers?: Wallpaper[];
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
  chromeSubTab?: ChromeSubTab;
  onSelectChromeSubTab?: (subTab: ChromeSubTab) => void;
  liveSubTab?: 'browse' | 'upload';
  onSelectLiveSubTab?: (subTab: 'browse' | 'upload') => void;
  wallpaperSubTab?: WallpaperSubTab;
  onSelectWallpaperSubTab?: (subTab: WallpaperSubTab) => void;
  favoritesCount?: number;
  downloadsCount?: number;
  collectionsCount?: number;
  activeWallpaper?: Wallpaper | null;
  platformOS?: PlatformOS;
  isGpuSaverActive?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onDisconnectDesktop?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSimulator?: () => void;
  onOpenExtensionStudio?: () => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
  selectedDirectoryId?: string;
  onSelectDirectoryId?: (id: string) => void;
  selectedResolution?: string;
  onSelectResolution?: (res: string) => void;
  homeFilterTab?: string;
  onSelectHomeFilter?: (filter: 'All' | '3D' | 'Live' | '4K' | '8K' | 'Cyber' | 'Anime' | 'Nature' | 'Space') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  wallpapers = [],
  isSettingsOpen = false,
  onToggleSettings,
  favoritesCount = 0,
  isGpuSaverActive = true,
  onSelectCategory,
  selectedDirectoryId = 'all',
  onSelectDirectoryId,
  selectedResolution = 'all',
  onSelectResolution,
  onSelectHomeFilter,
}) => {
  // Collapsible state (default: false / collapsed icon-only rail)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Dynamic real-time calculation of directory categories and format counts
  const dynamicDirectoryItems = useMemo(() => {
    return getDynamicDirectoryItems(wallpapers);
  }, [wallpapers]);

  const dynamicFormatCounts = useMemo(() => {
    return getDynamicFormatCounts(wallpapers, selectedResolution);
  }, [wallpapers, selectedResolution]);

  const isHome = currentTab === 'home';
  const isSearch = currentTab === 'search';
  const isCustomize = currentTab === 'customize';
  const isChrome = currentTab === 'chrome' || currentTab === 'chrome-extension';
  const isWindows = currentTab === 'windows';
  const isMac = currentTab === 'macos';
  const isMobile = currentTab === 'mobile';
  const isFavorites = currentTab === 'favorites';
  const isSettings = currentTab === 'settings';

  const navItems: NavRailItem[] = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      tooltip: 'Home',
      badge: 'Main',
      icon: Home,
      isActive: isHome,
      onClick: () => {
        onSelectTab('home');
        if (onSelectHomeFilter) onSelectHomeFilter('All');
        if (onSelectCategory) onSelectCategory('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'search' as NavTab,
      label: 'Search',
      tooltip: 'Search Catalog',
      badge: 'Quick',
      icon: Search,
      isActive: isSearch,
      onClick: () => onSelectTab('search'),
    },
    isChrome
      ? {
          id: 'chrome' as NavTab,
          label: 'Chrome Studio',
          badge: 'Active',
          icon: Globe,
          isActive: true,
          tooltip: 'Chrome Studio / Extensions',
          onClick: () => onSelectTab('chrome'),
        }
      : {
          id: 'customize' as NavTab,
          label: 'Environments',
          tooltip: 'Environments / Workspace',
          icon: Monitor,
          isActive: isCustomize || isWindows || isMac || isMobile,
          onClick: () => onSelectTab('customize'),
        },
    {
      id: 'favorites' as NavTab,
      label: 'Favorites',
      tooltip: 'Saved Favorites',
      badge: favoritesCount > 0 ? `${favoritesCount}` : undefined,
      icon: Heart,
      isActive: isFavorites,
      onClick: () => onSelectTab('favorites'),
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      tooltip: 'Settings & Preferences',
      icon: Settings,
      isActive: isSettingsOpen || isSettings,
      onClick: () => {
        if (onToggleSettings) {
          onToggleSettings();
        } else {
          onSelectTab('settings');
        }
      },
    },
  ];

  const isDirectoryMode = currentTab === 'search';

  return (
    <aside 
      id="wallix-sidebar" 
      className={`relative flex-shrink-0 sticky top-0 h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-2.5 z-40 bg-[#0A0C13]/95 backdrop-blur-2xl border-r border-cyan-500/30 select-none overflow-y-auto no-scrollbar shadow-[2px_0_20px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-64 md:w-72' : 'w-[72px]'
      }`}
    >
      {/* Subtle glowing neon right border accent */}
      <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/60 via-cyan-500/20 to-indigo-500/40 pointer-events-none" />

      <div className="space-y-4">
        
        {/* ========================================================================= */}
        {/* 1. TOP TOGGLE BUTTON (HAMBURGER / COLLAPSE)                               */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center w-full pb-1">
          <button
            id="sidebar-toggle-button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`w-full flex items-center justify-center p-2.5 rounded-2xl transition-all duration-300 cursor-pointer group active:scale-95 ${
              isSidebarOpen
                ? 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-500/25'
                : 'bg-[#0E1526]/90 hover:bg-[#131F38] border border-cyan-400/40 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
            }`}
            title={isSidebarOpen ? 'Collapse Navigation (Rail Mode)' : 'Expand Navigation'}
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5 text-cyan-300 stroke-[2.4] transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
            
            {isSidebarOpen && (
              <span className="ml-2.5 font-['Outfit'] font-black text-xs uppercase tracking-wider text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] whitespace-nowrap overflow-hidden transition-all duration-300">
                Wallix Rail
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. DYNAMIC MODE: DIRECTORY VIEW (When user on Search page and expanded)    */}
        {/* ========================================================================= */}
        {isDirectoryMode && isSidebarOpen ? (
          <div className="space-y-2.5 animate-fadeIn">
            
            {/* Top 'Back to Home' Button */}
            <button
              id="sidebar-back-to-home-btn"
              onClick={() => onSelectTab('home')}
              className="w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 transition-all duration-200 group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-white/5 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:-translate-x-0.5 transition-transform">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span>Back to Home</span>
              </div>
            </button>

            {/* NAME DIRECTORY HEADER (Real-time category count) */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-white/10">
              <span className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase">
                Name Directory
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 shadow-inner">
                {dynamicDirectoryItems.length} Categories
              </span>
            </div>

            {/* DIRECTORY CATEGORY LIST (Real-time Dynamic Detected Categories & Counts) */}
            <div className="space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1 no-scrollbar">
              {dynamicDirectoryItems.map((item) => {
                const isSelected = selectedDirectoryId === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-dir-item-${item.id}`}
                    onClick={() => {
                      if (onSelectDirectoryId) {
                        onSelectDirectoryId(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group text-left cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_14px_rgba(6,182,212,0.25)] font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10'
                    }`}
                  >
                    <span className="truncate">
                      {item.name}
                    </span>

                    {/* Exact Real-Time Count Badge */}
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                      isSelected 
                        ? 'text-cyan-200 bg-cyan-950/80 font-bold border border-cyan-500/40 shadow-sm' 
                        : 'text-slate-400 group-hover:text-slate-200 bg-white/[0.04]'
                    }`}>
                      {item.countDisplay}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Format Filter Buttons with Live Asset Counters */}
            <div className="pt-2.5 border-t border-white/10">
              <div className="grid grid-cols-2 gap-1.5 px-0.5">
                {dynamicFormatCounts.map((format) => (
                  <button
                    key={format.id}
                    disabled={format.isDisabled}
                    onClick={() => {
                      if (onSelectResolution) onSelectResolution(format.id);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-mono transition-all duration-200 text-center flex items-center justify-between cursor-pointer active:scale-95 ${
                      format.isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-white/[0.01] text-slate-600 border border-transparent'
                        : format.isActive
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className="truncate">{format.label}</span>
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      format.isActive ? 'bg-cyan-400/30 text-cyan-100' : 'bg-white/5 text-slate-500'
                    }`}>
                      {format.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* 3. MAIN NAVIGATION ICONS (VERTICAL GOOEYNAV RAIL & EXPANDED MODES)        */
          /* ========================================================================= */
          <SidebarNavigation items={navItems} isSidebarOpen={isSidebarOpen} />
        )}

      </div>

    </aside>
  );
};
