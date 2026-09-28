import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WALLPAPERS_DATA, CATEGORIES_DATA } from './data/wallpapers';
import { Wallpaper, NavTab, PlatformOS, ResolutionType, AppSettings, DownloadHistoryItem, CollectionFolder, CommunityPreset, WallpaperSubTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { WallpaperGrid } from './components/WallpaperGrid';
import { WallpaperModal } from './components/WallpaperModal';
import { DesktopSimulatorModal } from './components/DesktopSimulatorModal';
import { AIStudioModal } from './components/AIStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { CategoriesView } from './components/CategoriesView';
import { LiveWallpapersView } from './components/LiveWallpapersView';
import { SearchView } from './components/SearchView';
import { DownloadsView } from './components/DownloadsView';
import { CollectionsView } from './components/CollectionsView';
import { AddToCollectionModal } from './components/AddToCollectionModal';
import { ArcCarouselLanding } from './components/ArcCarouselLanding';
import { PublishPresetModal } from './components/PublishPresetModal';
import { PresetApplyModal } from './components/PresetApplyModal';
import { ChromeExtensionModal } from './components/ChromeExtensionModal';
import { ChromeExtensionStudioView } from './components/ChromeExtensionStudioView';
import { HomeDashboardView } from './components/HomeDashboardView';
import { LiveWallpaperStudioView } from './components/LiveWallpaperStudioView';
import { WallpaperThemesView } from './components/WallpaperThemesView';
import { WallpaperSection } from './modules/wallpaper/WallpaperSection';
import { ChromeSection } from './modules/chrome/ChromeSection';
import { TargetSelectorView } from './components/TargetSelection/TargetSelectorView';
import { WindowsTargetWorkspace } from './components/TargetWorkspaces/WindowsTargetWorkspace';
import { MacTargetWorkspace } from './components/TargetWorkspaces/MacTargetWorkspace';
import { MobileTargetWorkspace } from './components/TargetWorkspaces/MobileTargetWorkspace';
import { WindowsDesktopCanvas } from './components/TargetWorkspaces/windows/WindowsDesktopCanvas';
import { DEFAULT_WINDOWS_CONFIG, WindowsEnvironmentConfig } from './components/TargetWorkspaces/windows/types';
import { ThemeConfig } from './types/theme';
import { ChromeSubTab } from './types/chrome';
import { DownloadHistoryModal } from './components/DownloadHistoryModal';
import { INITIAL_COMMUNITY_PRESETS } from './data/communityPresets';
import { THEME_PRESETS, ColorGradePreset } from './data/colorPresets';
import { DESKTOP_SKETCH_PRESETS, DesktopPresetItem } from './data/layoutPresets';
import { AdaptiveMaterialProvider } from './modules/desktop/adaptive';
import { WeatherProvider } from './services/weather';
import confetti from 'canvas-confetti';
import { sanitizeWallpaperTitle } from './utils/sanitizeTitle';
import { getMediaFile, deleteMediaFile } from './utils/mediaStorage';
import { 
  Check, 
  Download, 
  Heart, 
  Monitor, 
  Sparkles, 
  Search, 
  X, 
  Zap, 
  RotateCw, 
  Share2,
  Clock,
  FolderPlus,
  FolderHeart,
  Globe,
  Trash2
} from 'lucide-react';

const USER_DELETED_WALLPAPERS = new Set<string>([
  'custom-video-1788814319368',
  'custom-video-1788814317625',
  'custom-video-1787534283035',
  'silver-surfer-oled-cosmic-4k',
]);

export default function App() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(() => {
    try {
      const userDeletedList: string[] = JSON.parse(localStorage.getItem('wallix_user_deleted_ids') || '[]');
      userDeletedList.forEach((id) => USER_DELETED_WALLPAPERS.add(id));

      const saved = localStorage.getItem('wallix_custom_wallpapers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const cleanCustom: Wallpaper[] = [];

          parsed.forEach((item) => {
            if (!item || !item.id || USER_DELETED_WALLPAPERS.has(item.id)) return;
            const cleanTitle = sanitizeWallpaperTitle(item.title || '');
            const key = (item.videoUrl || item.imageUrl || cleanTitle).toLowerCase();
            if (!seen.has(key) && !seen.has(item.id)) {
              seen.add(key);
              seen.add(item.id);
              cleanCustom.push({
                ...item,
                title: cleanTitle,
              });
            }
          });

          try {
            localStorage.setItem('wallix_custom_wallpapers', JSON.stringify(cleanCustom));
          } catch {}

          // Add default catalog deduplicated
          const finalWallpapers = [...cleanCustom];
          WALLPAPERS_DATA.forEach((wp) => {
            if (USER_DELETED_WALLPAPERS.has(wp.id)) return;
            const cleanTitle = sanitizeWallpaperTitle(wp.title);
            const key = (wp.videoUrl || wp.imageUrl || cleanTitle).toLowerCase();
            if (!seen.has(key) && !seen.has(wp.id)) {
              seen.add(key);
              seen.add(wp.id);
              finalWallpapers.push({
                ...wp,
                title: cleanTitle,
              });
            }
          });

          return finalWallpapers;
        }
      }
    } catch {
      // fallback
    }

    // Default sanitized list
    return WALLPAPERS_DATA.filter((wp) => !USER_DELETED_WALLPAPERS.has(wp.id)).map((wp) => ({
      ...wp,
      title: sanitizeWallpaperTitle(wp.title),
    }));
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [viewMode, setViewMode] = useState<'preview' | 'live-desktop'>('preview');
  const [chromeSubTab, setChromeSubTab] = useState<ChromeSubTab>('new-tab');
  const [liveSubTab, setLiveSubTab] = useState<'browse' | 'upload'>('browse');
  const [wallpaperSubTab, setWallpaperSubTab] = useState<WallpaperSubTab>('gallery');
  const [activeThemeId, setActiveThemeId] = useState<string>('sakura-spirit');
  const [homeFilterTab, setHomeFilterTab] = useState<'All' | '3D' | 'Live' | '4K' | '8K' | 'Cyber' | 'Anime' | 'Nature' | 'Space'>('All');
  
  const [activeWallpaper, setActiveWallpaper] = useState<Wallpaper>(() => {
    try {
      const saved = localStorage.getItem('wallix_custom_wallpapers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((w) => w && w.id && !USER_DELETED_WALLPAPERS.has(w.id));
          if (valid.length > 0 && valid[0]) {
            return {
              ...valid[0],
              title: sanitizeWallpaperTitle(valid[0].title || ''),
            };
          }
        }
      }
    } catch {
      // fallback
    }
    const samurai = WALLPAPERS_DATA.find((w) => w.id === 'samurai-spider-lily-crimson-4k') || WALLPAPERS_DATA[0];
    return {
      ...samurai,
      title: 'Crimson Katana Vision',
    };
  });

  const [inspectedWallpaper, setInspectedWallpaper] = useState<Wallpaper | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_favs');
      return saved ? JSON.parse(saved) : ['wallix-synthwave-mountains', 'quantum-cosmic-nebula', 'wallix-cyberpunk-neon-city'];
    } catch {
      return ['wallix-synthwave-mountains', 'quantum-cosmic-nebula', 'wallix-cyberpunk-neon-city'];
    }
  });

  // Downloads History Local Storage State
  const [downloads, setDownloads] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_downloads_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    // Initial sample download history item for instant high-value demonstration
    return [
      {
        id: 'dl-sample-1',
        wallpaperId: 'wallix-synthwave-mountains',
        wallpaper: WALLPAPERS_DATA[0],
        resolution: '4K UHD (3840×2160)',
        downloadedAt: 'Aug 25, 2026, 12:45 PM',
        timestamp: Date.now() - 3600000,
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResolution, setSelectedResolution] = useState<ResolutionType | 'All'>('All');
  const [selectedDirectoryId, setSelectedDirectoryId] = useState('all');
  const [searchViewResolution, setSearchViewResolution] = useState('all');
  const [platformOS, setPlatformOS] = useState<PlatformOS>('macos');

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAIStudioOpen, setIsAIStudioOpen] = useState(false);
  const [isExtensionStudioOpen, setIsExtensionStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadHistoryModalOpen, setIsDownloadHistoryModalOpen] = useState(false);
  const [isGpuSaverActive, setIsGpuSaverActive] = useState(true);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const [isSelectingForExtension, setIsSelectingForExtension] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; icon?: React.ReactNode } | null>(null);

  const triggerSearchFocus = () => {
    setIsSearchHighlighted(true);
    setTimeout(() => {
      const inputEl = document.getElementById('top-wallpaper-search-input') as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 50);

    setTimeout(() => {
      setIsSearchHighlighted(false);
    }, 2200);
  };

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('wallix_settings');
      if (saved) {
        return { ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return {
      defaultResolution: '4K UHD',
      platformTheme: 'macos',
      colorScheme: 'obsidian',
      themeMode: 'obsidian',
      parallaxEnabled: true,
      parallaxStrength: 1.5,
      targetFPS: 120,
      liveWallpaperAudioReactive: true,
      autoSwitchWallpaper: false,
      autoSwitchIntervalMins: 30,
      showWatermark: false,
    };
  });

  // Custom Collections & Folders State
  const [collections, setCollections] = useState<CollectionFolder[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_custom_collections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    // Default initial curated theme collections
    return [
      {
        id: 'col-cyberpunk',
        name: 'Cyberpunk & Neon City',
        description: 'Vibrant futuristic neon lights, rain reflections, and retro synthwave aesthetic',
        wallpaperIds: ['wallix-cyberpunk-neon-city', 'wallix-neon-cyber-street'],
        color: 'cyan',
        createdAt: 'Aug 25, 2026',
      },
      {
        id: 'col-anime-lofi',
        name: 'Chill Anime & Lo-Fi',
        description: 'Calm sunsets, sakura trees, synthwave highways, and relaxing anime vistas',
        wallpaperIds: ['wallix-synthwave-mountains', 'wallix-anime-cherry-blossom', 'wallix-synthwave-highway'],
        color: 'purple',
        createdAt: 'Aug 25, 2026',
      },
      {
        id: 'col-deep-space',
        name: 'Cosmic & Deep Space',
        description: 'Deep cosmic nebulae, black holes, glowing star clusters, and deep space exploration',
        wallpaperIds: ['quantum-cosmic-nebula', 'wallix-celestial-black-hole', 'wallix-nebula-stargaze'],
        color: 'indigo',
        createdAt: 'Aug 25, 2026',
      },
    ];
  });

  // Collection target wallpaper for modal
  const [wallpaperForCollection, setWallpaperForCollection] = useState<Wallpaper | null>(null);

  // Community Marketplace Presets State & Storage
  const [communityPresets, setCommunityPresets] = useState<CommunityPreset[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_community_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_COMMUNITY_PRESETS;
  });

  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetToApply, setPresetToApply] = useState<DesktopPresetItem | null>(null);
  const [activeSketchPresetId, setActiveSketchPresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('wallix_active_preset_id');
      return saved || 'preset_1_analog_suite';
    } catch {
      return 'preset_1_analog_suite';
    }
  });
  const [publishActiveTheme, setPublishActiveTheme] = useState<ColorGradePreset>(THEME_PRESETS[1]); // Cyberpunk default
  const [publishIntensity, setPublishIntensity] = useState<number>(0.4);

  // Persist community presets
  useEffect(() => {
    try {
      localStorage.setItem('wallix_community_presets', JSON.stringify(communityPresets));
    } catch (e) {
      console.error(e);
    }
  }, [communityPresets]);

  // Restore custom video Blobs from IndexedDB into fresh Object URLs on startup
  useEffect(() => {
    let isMounted = true;
    const restoreCustomVideos = async () => {
      try {
        const saved = localStorage.getItem('wallix_custom_wallpapers');
        if (!saved) return;
        const parsed: Wallpaper[] = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        let hasUpdates = false;
        const updatedList = await Promise.all(
          parsed.map(async (wp) => {
            if (wp && wp.id && wp.id.startsWith('custom-video-')) {
              try {
                const blob = await getMediaFile(wp.id);
                if (blob) {
                  const freshUrl = URL.createObjectURL(blob);
                  hasUpdates = true;
                  return {
                    ...wp,
                    videoUrl: freshUrl,
                    ...(wp.imageUrl?.startsWith('blob:') ? { imageUrl: freshUrl } : {}),
                  };
                }
              } catch (e) {
                console.warn('Error reading media for', wp.id, e);
              }
            }
            return wp;
          })
        );

        if (hasUpdates && isMounted) {
          setWallpapers((prev) =>
            prev.map((w) => {
              const match = updatedList.find((u) => u.id === w.id);
              return match && match.videoUrl ? { ...w, videoUrl: match.videoUrl } : w;
            })
          );
        }
      } catch (err) {
        console.warn('Failed to restore custom videos from IndexedDB', err);
      }
    };

    restoreCustomVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply Theme to document root HTML attribute
  useEffect(() => {
    const theme = settings.themeMode || 'obsidian';
    document.documentElement.setAttribute('data-theme', theme);
  }, [settings.themeMode]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('wallix_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Persist collections to storage
  useEffect(() => {
    try {
      localStorage.setItem('wallix_custom_collections', JSON.stringify(collections));
    } catch (e) {
      console.error(e);
    }
  }, [collections]);

  // Persist favorites to storage
  useEffect(() => {
    try {
      localStorage.setItem('wallix_favs', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Persist downloads to storage
  useEffect(() => {
    try {
      localStorage.setItem('wallix_downloads_history', JSON.stringify(downloads));
    } catch (e) {
      console.error(e);
    }
  }, [downloads]);

  const showToast = useCallback(
    (
      titleOrObj: string | { title: string; subtitle?: string; icon?: React.ReactNode },
      subtitle?: string,
      icon?: React.ReactNode
    ) => {
      if (typeof titleOrObj === 'object' && titleOrObj !== null) {
        setToastMessage({
          title: titleOrObj.title || '',
          subtitle: titleOrObj.subtitle || '',
          icon: titleOrObj.icon
        });
      } else {
        setToastMessage({
          title: String(titleOrObj || ''),
          subtitle: subtitle || '',
          icon
        });
      }
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    },
    []
  );

  // =========================================================================
  // 1. AUTO-ROTATE WALLPAPERS ENGINE: Automatically cycles through favorited wallpapers
  // =========================================================================
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;
  const wallpapersRef = useRef(wallpapers);
  wallpapersRef.current = wallpapers;
  const activeWallpaperRef = useRef(activeWallpaper);
  activeWallpaperRef.current = activeWallpaper;

  const triggerNextRotation = useCallback(() => {
    const favList = wallpapersRef.current.filter((w) => favoritesRef.current.includes(w.id));
    if (favList.length === 0) {
      showToast(
        'Auto-Rotate Notice',
        'Add at least 2 wallpapers to your Favorites to cycle through them.',
        <RotateCw className="w-4 h-4 text-amber-400" />
      );
      return;
    }
    const curIndex = favList.findIndex((w) => w.id === activeWallpaperRef.current?.id);
    const nextIndex = curIndex === -1 ? 0 : (curIndex + 1) % favList.length;
    const nextWallpaper = favList[nextIndex];
    setActiveWallpaper(nextWallpaper);
    showToast(
      '🔄 Auto-Rotated Wallpaper',
      `Switched active desktop to "${nextWallpaper.title}" (${nextWallpaper.category})`,
      <RotateCw className="w-4 h-4 text-cyan-400" />
    );
  }, [showToast]);

  useEffect(() => {
    if (!settings.autoSwitchWallpaper) return;
    
    // Interval in milliseconds (15, 30, or 60 minutes)
    const intervalMs = (settings.autoSwitchIntervalMins || 30) * 60 * 1000;
    const intervalTimer = setInterval(() => {
      triggerNextRotation();
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [settings.autoSwitchWallpaper, settings.autoSwitchIntervalMins, triggerNextRotation]);

  // =========================================================================
  // 2. SHAREABLE LINK GENERATOR & DEEP-LINK CONSUMER: ?wallpaperId={id}
  // =========================================================================
  const handleShareWallpaper = useCallback((wallpaper: Wallpaper) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const shareUrl = `${origin}${pathname}?wallpaperId=${encodeURIComponent(wallpaper.id)}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch {
      // Fallback
    }

    showToast(
      'Link copied to clipboard!',
      `Direct link to "${wallpaper.title}" is ready to share`,
      <Share2 className="w-4 h-4 text-cyan-400" />
    );
  }, [showToast]);

  // Deep-Link Resolver on initial page mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sharedWallpaperId = searchParams.get('wallpaperId');
      if (sharedWallpaperId) {
        const target = wallpapers.find((w) => w.id === sharedWallpaperId);
        if (target) {
          setActiveWallpaper(target);
          setInspectedWallpaper(target);
          setCurrentTab('discover');
          showToast(
            '🔗 Shared Wallpaper Loaded',
            `Highlighting "${target.title}" [${target.resolution}]`,
            <Sparkles className="w-4 h-4 text-cyan-300" />
          );
        }
      }
    } catch (e) {
      console.warn('Deep link parse error', e);
    }
  }, [wallpapers, showToast]);

  // =========================================================================
  // 3. DOWNLOADS HISTORY TRACKER
  // =========================================================================
  const recordDownload = useCallback((wallpaper: Wallpaper, customRes?: string) => {
    const formattedDate = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const newItem: DownloadHistoryItem = {
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      wallpaperId: wallpaper.id,
      wallpaper,
      resolution: customRes || wallpaper.resolutionText || '4K UHD (3840×2160)',
      downloadedAt: formattedDate,
      timestamp: Date.now(),
    };

    setDownloads((prev) => {
      // Keep most recent download at top, deduplicate consecutive duplicate downloads
      const filtered = prev.filter((item) => item.wallpaperId !== wallpaper.id);
      return [newItem, ...filtered].slice(0, 60);
    });
  }, []);

  const handleQuickDownload = (wallpaper: Wallpaper) => {
    const a = document.createElement('a');
    a.href = wallpaper.imageUrl;
    a.download = `WALLIX_${wallpaper.title.replace(/\s+/g, '_')}_4K.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    recordDownload(wallpaper, '4K UHD (3840×2160)');

    showToast(
      'Download Started',
      `"${wallpaper.title}" [4K UHD Master] is downloading`,
      <Download className="w-4 h-4 text-cyan-400" />
    );
  };

  const handleReDownload = (item: DownloadHistoryItem) => {
    const a = document.createElement('a');
    a.href = item.wallpaper.imageUrl;
    a.download = `WALLIX_${item.wallpaper.title.replace(/\s+/g, '_')}_${item.resolution.replace(/\s+/g, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(
      'Re-downloading Wallpaper',
      `"${item.wallpaper.title}" [${item.resolution}] master file`,
      <Download className="w-4 h-4 text-cyan-400" />
    );
  };

  const handleRemoveDownloadItem = (id: string) => {
    setDownloads((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed from History', 'Download record removed from offline logs', <Check className="w-4 h-4 text-slate-400" />);
  };

  const handleClearDownloadsHistory = () => {
    setDownloads([]);
    try {
      localStorage.removeItem('wallix_downloads_history');
    } catch {}
    showToast('Download History Cleared', 'All offline download logs cleared', <Check className="w-4 h-4 text-rose-400" />);
  };

  const handleAddCustomWallpaper = useCallback((wp: Wallpaper) => {
    setWallpapers((prev) => [wp, ...prev]);
    setActiveWallpaper(wp);
    try {
      const saved = localStorage.getItem('wallix_custom_wallpapers');
      const parsed = saved ? JSON.parse(saved) : [];
      localStorage.setItem('wallix_custom_wallpapers', JSON.stringify([wp, ...parsed]));
    } catch {}
    showToast(
      'Live Wallpaper Saved',
      `"${wp.title}" added to your live gallery and ready to use.`,
      <Sparkles className="w-4 h-4 text-cyan-400" />
    );
  }, []);

  const handleApplyTheme = useCallback((theme: ThemeConfig) => {
    setActiveThemeId(theme.id);
    const existingWp = wallpapers.find((w) => w.imageUrl === theme.background);
    if (existingWp) {
      setActiveWallpaper(existingWp);
    }
  }, [wallpapers]);

  // =========================================================================
  // 4. CUSTOM COLLECTIONS & FOLDERS MANAGEMENT
  // =========================================================================
  const handleCreateCollection = (name: string, description?: string, color: CollectionFolder['color'] = 'cyan') => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newFolder: CollectionFolder = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      description,
      wallpaperIds: [],
      color,
      createdAt: formattedDate,
    };

    setCollections((prev) => [newFolder, ...prev]);
    showToast(
      '📁 Collection Created',
      `"${name}" folder added to your library`,
      <FolderHeart className="w-4 h-4 text-cyan-400" />
    );
    return newFolder;
  };

  const handleUpdateCollection = (id: string, updates: Partial<CollectionFolder>) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Folder Updated', 'Collection details saved', <Check className="w-4 h-4 text-cyan-400" />);
  };

  const handleDeleteCollection = (id: string) => {
    const target = collections.find((c) => c.id === id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    showToast(
      'Folder Deleted',
      target ? `"${target.name}" removed from library` : 'Collection deleted',
      <Check className="w-4 h-4 text-rose-400" />
    );
  };

  const handleToggleWallpaperInCollection = (collectionId: string, wallpaperId: string) => {
    const folder = collections.find((c) => c.id === collectionId);
    const wall = wallpapers.find((w) => w.id === wallpaperId);
    if (!folder) return;

    const isInside = folder.wallpaperIds.includes(wallpaperId);
    const updatedIds = isInside
      ? folder.wallpaperIds.filter((id) => id !== wallpaperId)
      : [...folder.wallpaperIds, wallpaperId];

    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, wallpaperIds: updatedIds } : c))
    );

    if (isInside) {
      showToast(
        'Removed from Collection',
        `Removed "${wall?.title || 'wallpaper'}" from "${folder.name}"`,
        <Check className="w-4 h-4 text-slate-400" />
      );
    } else {
      showToast(
        'Added to Collection',
        `"${wall?.title || 'wallpaper'}" saved to "${folder.name}"`,
        <FolderHeart className="w-4 h-4 text-cyan-300" />
      );
    }
  };

  const handleRemoveFromCollection = (collectionId: string, wallpaperId: string) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, wallpaperIds: c.wallpaperIds.filter((id) => id !== wallpaperId) }
          : c
      )
    );
    showToast('Removed from Folder', 'Wallpaper removed from this collection', <Check className="w-4 h-4 text-slate-400" />);
  };

  const handleOpenAddToCollection = (wallpaper: Wallpaper) => {
    setWallpaperForCollection(wallpaper);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((f) => f !== id) : [...prev, id];
      const target = wallpapers.find((w) => w.id === id);
      if (!exists && target) {
        showToast('Added to Favorites', target.title, <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />);
      }
      return updated;
    });
  };

  const handleApplyDesktop = (wallpaper: Wallpaper) => {
    setActiveWallpaper(wallpaper);
    const mediaUrl = wallpaper.videoUrl || wallpaper.imageUrl || wallpaper.thumbnail || '';
    try {
      localStorage.setItem('current_wallpaper', mediaUrl);
      localStorage.setItem('wallix_extension_live_wallpaper', JSON.stringify(wallpaper));
      if (wallpaper.videoUrl) {
        localStorage.setItem('wallix_bg_type', 'video');
        localStorage.setItem('wallix_bg_video_url', wallpaper.videoUrl);
      } else if (wallpaper.imageUrl || wallpaper.thumbnail) {
        localStorage.setItem('wallix_bg_type', 'image');
        localStorage.setItem('wallix_bg_data', wallpaper.imageUrl || wallpaper.thumbnail);
      }
    } catch (e) {
      console.warn('Could not save to extension storage', e);
    }

    if (isSelectingForExtension) {
      setIsSelectingForExtension(false);
      setIsExtensionStudioOpen(true);
      showToast(
        '🌐 Google Chrome Wallpaper Set!',
        `"${wallpaper.title}" is now your active Chrome New Tab background`,
        <Sparkles className="w-4 h-4 text-cyan-300" />
      );
    } else {
      showToast(
        'Applied to Desktop Engine',
        `${wallpaper.title} (${wallpaper.resolution}) active on ${platformOS === 'macos' ? 'macOS' : 'Windows 11'}`,
        <Check className="w-4 h-4 text-emerald-400" />
      );
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366F1', '#06B6D4', '#8B5CF6']
    });
  };

  const handleInspectWallpaper = (wallpaper: Wallpaper) => {
    setActiveWallpaper(wallpaper);
    const mediaUrl = wallpaper.videoUrl || wallpaper.imageUrl || wallpaper.thumbnail || '';
    try {
      localStorage.setItem('current_wallpaper', mediaUrl);
    } catch (e) {
      console.warn('Could not save current_wallpaper', e);
    }

    if (isSelectingForExtension) {
      try {
        localStorage.setItem('wallix_extension_live_wallpaper', JSON.stringify(wallpaper));
        if (wallpaper.videoUrl) {
          localStorage.setItem('wallix_bg_type', 'video');
          localStorage.setItem('wallix_bg_video_url', wallpaper.videoUrl);
        } else if (wallpaper.imageUrl || wallpaper.thumbnail) {
          localStorage.setItem('wallix_bg_type', 'image');
          localStorage.setItem('wallix_bg_data', wallpaper.imageUrl || wallpaper.thumbnail);
        }
      } catch (e) {
        console.warn('Could not save to extension storage', e);
      }
      setIsSelectingForExtension(false);
      setIsExtensionStudioOpen(true);
      showToast(
        '🌐 Google Chrome Wallpaper Set!',
        `"${wallpaper.title}" is now applied to your Chrome New Tab`,
        <Sparkles className="w-4 h-4 text-cyan-300" />
      );
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06B6D4', '#38BDF8', '#818CF8']
      });
    } else {
      setInspectedWallpaper(wallpaper);
    }
  };

  const handleSaveCustomWallpaper = (customWall: Wallpaper) => {
    const cleanWall: Wallpaper = {
      ...customWall,
      title: sanitizeWallpaperTitle(customWall.title),
    };
    setWallpapers((prev) => {
      const filtered = prev.filter((p) => p.id !== cleanWall.id && p.videoUrl !== cleanWall.videoUrl);
      return [cleanWall, ...filtered];
    });
    setActiveWallpaper(cleanWall);
    try {
      const existing = localStorage.getItem('wallix_custom_wallpapers');
      const parsed: Wallpaper[] = existing ? JSON.parse(existing) : [];
      const cleanParsed = parsed.filter((p) => p.id !== cleanWall.id && p.videoUrl !== cleanWall.videoUrl);
      localStorage.setItem('wallix_custom_wallpapers', JSON.stringify([cleanWall, ...cleanParsed].slice(0, 8)));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
    showToast('Live Wallpaper Added', `${cleanWall.title} is now active at Position #1`, <Sparkles className="w-4 h-4 text-cyan-300" />);
  };

  const handleDeleteCustomWallpaper = useCallback((id: string) => {
    USER_DELETED_WALLPAPERS.add(id);
    setWallpapers((prev) => {
      const target = prev.find((w) => w.id === id);
      showToast('Wallpaper Removed', target ? `"${target.title}" was removed` : 'Wallpaper removed', <Trash2 className="w-4 h-4 text-rose-400" />);
      return prev.filter((w) => w.id !== id);
    });
    if (activeWallpaper?.id === id) {
      setActiveWallpaper(WALLPAPERS_DATA.find((w) => !USER_DELETED_WALLPAPERS.has(w.id)) || WALLPAPERS_DATA[0]);
    }
    if (inspectedWallpaper?.id === id) {
      setInspectedWallpaper(null);
    }
    try {
      const userDeletedList: string[] = JSON.parse(localStorage.getItem('wallix_user_deleted_ids') || '[]');
      if (!userDeletedList.includes(id)) {
        userDeletedList.push(id);
        localStorage.setItem('wallix_user_deleted_ids', JSON.stringify(userDeletedList));
      }
      const existing = localStorage.getItem('wallix_custom_wallpapers');
      if (existing) {
        const parsed: Wallpaper[] = JSON.parse(existing);
        const cleanParsed = parsed.filter((p) => p.id !== id);
        localStorage.setItem('wallix_custom_wallpapers', JSON.stringify(cleanParsed));
      }
      deleteMediaFile(id);
    } catch (e) {
      console.warn('LocalStorage delete error', e);
    }
  }, [activeWallpaper, inspectedWallpaper, showToast]);

  const handleToggleGpuSaver = () => {
    setIsGpuSaverActive((prev) => {
      const next = !prev;
      if (next) {
        showToast(
          '⚡ Smart GPU Saver: Enabled',
          '0% Lag Mode active. 3D rendering auto-pauses when gaming or running heavy apps.',
          <Zap className="w-4 h-4 text-emerald-400" />
        );
      } else {
        showToast(
          'Smart GPU Saver: Disabled',
          'Continuous maximum frame rate mode enabled.',
          <Zap className="w-4 h-4 text-slate-400" />
        );
      }
      return next;
    });
  };

  const handleOpenDesktopSimWithWallpaper = (wallpaper: Wallpaper) => {
    setActiveWallpaper(wallpaper);
    setIsSimulatorOpen(true);
    showToast(
      '👁️ 1-Click Desktop Preview Active',
      `Simulating "${wallpaper.title}" live behind desktop taskbar and icons.`,
      <Sparkles className="w-4 h-4 text-cyan-300" />
    );
  };

  // =========================================================================
  // COMMUNITY HUB PRESET 1-CLICK APPLY ENGINE
  // =========================================================================
  const handleApplyCommunityPreset = (preset: CommunityPreset) => {
    // 1. Find or create matching wallpaper
    let targetWall = wallpapers.find((w) => w.id === preset.wallpaperId);
    if (!targetWall) {
      targetWall = {
        id: preset.wallpaperId,
        title: preset.wallpaperTitle,
        category: preset.category,
        tags: [preset.category, '4K', 'Community'],
        resolution: '4K UHD',
        resolutionText: '3840 × 2160',
        imageUrl: preset.previewImage,
        thumbnailUrl: preset.previewImage,
        thumbnail: preset.previewImage,
        isVideo: preset.isVideo,
        is3D: preset.is3D,
        isLive: false,
        author: {
          name: preset.author?.name || 'WALLIX Community',
          avatar: preset.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          badge: 'PRO'
        },
        downloads: preset.downloadsCount || 120,
        likes: preset.likesCount || 45,
        aspectRatio: '16:9',
        description: preset.description || 'Community customized wallpaper preset.',
        colors: ['#6366f1', '#0f172a'],
        fileSize: '12.4 MB'
      };
    }

    // 2. Set active wallpaper
    setActiveWallpaper(targetWall);
    setActivePresetId(preset.id);

    // 3. Persist and apply the matching Color LUT
    const lutPreset = THEME_PRESETS.find((p) => p.id === preset.colorGrade.presetId) || THEME_PRESETS[0];
    try {
      localStorage.setItem(
        'wallix_active_lut',
        JSON.stringify({
          id: lutPreset.id,
          name: lutPreset.name,
          intensity: preset.colorGrade.intensity,
        })
      );
    } catch (e) {
      console.warn(e);
    }

    // 4. Dispatch custom event for low-latency live listeners
    window.dispatchEvent(
      new CustomEvent('wallix:apply-lut', {
        detail: {
          id: lutPreset.id,
          name: lutPreset.name,
          intensity: preset.colorGrade.intensity,
        },
      })
    );

    // 5. Update and persist Widget visibility
    try {
      localStorage.setItem(
        'wallix_widget_visibility_sonoma',
        JSON.stringify({
          clock: preset.widgets.clock,
          calendar: preset.widgets.calendar,
          music: preset.widgets.music,
          weather: preset.widgets.weather,
        })
      );
    } catch (e) {
      console.warn(e);
    }

    // 6. Confetti & Rich Toast Feedback
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.75 },
      colors: ['#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#10b981'],
    });

    showToast(
      '✨ Preset Applied: ' + preset.title,
      `Loaded "${preset.colorGrade.name}" Color LUT (${Math.round(preset.colorGrade.intensity * 100)}%) & macOS Sonoma Widgets by ${preset.author.handle}`,
      <Globe className="w-4 h-4 text-cyan-400" />
    );
  };

  const handleOpenPublishModalFromDrawer = (colorTheme?: ColorGradePreset, intensity?: number) => {
    if (colorTheme) setPublishActiveTheme(colorTheme);
    if (typeof intensity === 'number') setPublishIntensity(intensity);
    setIsPublishModalOpen(true);
  };

  const handlePublishPresetSuccess = (newPreset: CommunityPreset) => {
    setCommunityPresets((prev) => [newPreset, ...prev]);
    showToast(
      '🎉 Setup Published to Community Hub',
      `"${newPreset.title}" is now available for creators worldwide!`,
      <Globe className="w-4 h-4 text-emerald-400" />
    );
  };

  const handleConfirmApplyPreset = (preset: DesktopPresetItem) => {
    setActiveSketchPresetId(preset.id);
    try {
      localStorage.setItem('wallix_active_preset_id', preset.id);
      localStorage.setItem('wallix_clock_mode', preset.clockMode);
      localStorage.setItem(
        'wallix_widget_visibility_sonoma',
        JSON.stringify(preset.widgetsVisibility)
      );
    } catch (e) {
      console.warn(e);
    }

    // Close confirmation modal & launch desktop simulator
    setPresetToApply(null);
    setIsSimulatorOpen(true);

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#6366f1', '#a855f7', '#10b981'],
    });

    showToast(
      `🚀 ${preset.name} Desktop Active`,
      'Press Ctrl+Shift+W or click System Tray in top-right to return to app.',
      <Sparkles className="w-4 h-4 text-cyan-300" />
    );
  };


  // Tag filter handler for clickable tags across inspection modal & search
  const handleSelectTag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    setSearchQuery(cleanTag);
    setSelectedCategory('all');
    setCurrentTab('discover');
    showToast(
      `Theme Filter: #${cleanTag}`,
      'Filtered 4K/8K wallpaper catalog by selected tag',
      <Sparkles className="w-4 h-4 text-cyan-300" />
    );
  };

  // Cache clear handler
  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      showToast(
        'Cache & Temp Logs Cleared',
        'Optimized system memory and purged browser cache',
        <Check className="w-4 h-4 text-emerald-400" />
      );
    } catch {
      // fallback
    }
  };

  // Random wallpaper shuffle handler
  const handleRandomWallpaper = () => {
    if (wallpapers.length === 0) return;
    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    const randomWp = wallpapers[randomIndex];
    setActiveWallpaper(randomWp);
    setInspectedWallpaper(randomWp);
    showToast(
      'Random 4K Master Loaded',
      sanitizeWallpaperTitle(randomWp.title),
      <Sparkles className="w-4 h-4 text-purple-300" />
    );
  };

  // Switch tab handlers
  const handleSelectTab = (tab: NavTab) => {
    setViewMode('preview');
    if (tab === 'desktopsim') {
      setViewMode('live-desktop');
      return;
    }
    if (tab === 'generator') {
      setIsAIStudioOpen(true);
      return;
    }
    if (tab === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    if (tab === 'search') {
      setCurrentTab('search');
      triggerSearchFocus();
      return;
    }
    if (tab === 'chrome-extension') {
      setCurrentTab('chrome-extension');
      setIsExtensionStudioOpen(false);
      return;
    }
    if (tab === 'wallpapers' || tab === 'discover') {
      setCurrentTab('home');
      setHomeFilterTab('All');
      setSelectedCategory('all');
      setTimeout(() => {
        document.getElementById('main-wallpaper-gallery')?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
      return;
    }
    if (tab === 'home') {
      setCurrentTab('home');
      setHomeFilterTab('All');
      return;
    }
    setCurrentTab(tab);
  };

  const handleSelectHomeFilter = (filter: 'All' | '3D' | 'Live' | '4K' | '8K' | 'Cyber' | 'Anime' | 'Nature' | 'Space') => {
    setCurrentTab('home');
    setHomeFilterTab(filter);
    setTimeout(() => {
      document.getElementById('main-wallpaper-gallery')?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  const [windowsConfig, setWindowsConfig] = useState<WindowsEnvironmentConfig>(DEFAULT_WINDOWS_CONFIG);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  return (
    <AdaptiveMaterialProvider 
      wallpaper={activeWallpaper}
      activeWallpaperUrl={activeWallpaper?.imageUrl || activeWallpaper?.thumbnail || activeWallpaper?.videoUrl}
      activeWallpaperId={activeWallpaper?.id}
    >
      <WeatherProvider>
        <div className="h-screen w-screen max-h-screen max-w-screen overflow-hidden fixed inset-0 bg-[#07090E] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* 1. TOP GLOBAL APPLICATION NAVBAR */}
      <Navbar
        onOpenLanding={() => {
          setViewMode('preview');
          setCurrentTab('home');
        }}
        onOpenSimulator={() => setViewMode('live-desktop')}
        onOpenStudio={() => setIsAIStudioOpen(true)}
        onOpenExtensionStudio={() => setIsExtensionStudioOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isGpuSaverActive={isGpuSaverActive}
        onToggleGpuSaver={handleToggleGpuSaver}
        isSearchHighlighted={isSearchHighlighted}
        onShowToast={(msg) => showToast(msg.title, msg.subtitle, msg.icon)}
        wallpapers={wallpapers}
        onInspectWallpaper={handleInspectWallpaper}
        onSelectTag={handleSelectTag}
        onNavigateSearch={() => {
          setViewMode('preview');
          setCurrentTab('search');
          triggerSearchFocus();
        }}
        viewMode={viewMode}
        onToggleViewMode={(mode) => setViewMode(mode)}
      />

      {/* 2. MAIN APPLICATION WORKSPACE (Sidebar + Content Viewport) */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          chromeSubTab={chromeSubTab}
          onSelectChromeSubTab={setChromeSubTab}
          liveSubTab={liveSubTab}
          onSelectLiveSubTab={setLiveSubTab}
          wallpaperSubTab={wallpaperSubTab}
          onSelectWallpaperSubTab={setWallpaperSubTab}
          favoritesCount={favorites.length}
          downloadsCount={downloads.length}
          collectionsCount={collections.length}
          activeWallpaper={activeWallpaper}
          platformOS={platformOS}
          isGpuSaverActive={isGpuSaverActive}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setViewMode('preview');
            setCurrentTab('home');
          }}
          wallpapers={wallpapers}
          selectedDirectoryId={selectedDirectoryId}
          onSelectDirectoryId={setSelectedDirectoryId}
          selectedResolution={searchViewResolution}
          onSelectResolution={setSearchViewResolution}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
        />

        <main
          id="wallix-main-content-viewport"
          className="flex-1 min-h-0 min-w-0 h-full overflow-hidden relative flex flex-col bg-[#0A0C13]"
        >
          {viewMode === 'live-desktop' ? (
            /* Dedicated Live Desktop View embedded in main content */
            <div className="relative w-full h-full min-h-0 min-w-0 overflow-hidden flex-1">
              <WindowsDesktopCanvas
                config={windowsConfig}
                onChangeConfig={setWindowsConfig}
                activeWallpaper={activeWallpaper}
                wallpapers={wallpapers}
                onSelectWallpaper={setActiveWallpaper}
                selectedIconId={selectedIconId}
                onSelectIcon={setSelectedIconId}
                onOpenSettingsTab={() => setIsSettingsOpen(true)}
              />
            </div>
          ) : (
            /* Standard WALLIX Software Dashboard & Workspaces */
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 custom-scrollbar">
              {currentTab === 'home' && (
                <HomeDashboardView
                  wallpapers={wallpapers}
                  favorites={favorites}
                  activeWallpaper={activeWallpaper}
                  activeWallpaperId={activeWallpaper?.id}
                  onToggleFavorite={handleToggleFavorite}
                  onInspect={handleInspectWallpaper}
                  onApplyDesktop={handleApplyDesktop}
                  onQuickDownload={handleQuickDownload}
                  onOpenDesktopSim={() => setViewMode('live-desktop')}
                  onShare={handleShareWallpaper}
                  onOpenAddToCollection={(wp) => setWallpaperForCollection(wp)}
                  onDelete={handleDeleteCustomWallpaper}
                  enableTilt={settings.parallaxEnabled}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  selectedResolution={selectedResolution}
                  searchQuery={searchQuery}
                  activeFilterTab={homeFilterTab}
                  onFilterTabChange={handleSelectHomeFilter}
                />
              )}

              {currentTab === 'search' && (
                <SearchView
                  wallpapers={wallpapers}
                  favorites={favorites}
                  activeWallpaperId={activeWallpaper?.id}
                  onToggleFavorite={handleToggleFavorite}
                  onInspect={handleInspectWallpaper}
                  onApplyDesktop={handleApplyDesktop}
                  onQuickDownload={handleQuickDownload}
                  onOpenDesktopSim={() => setViewMode('live-desktop')}
                  onShare={handleShareWallpaper}
                  onDelete={handleDeleteCustomWallpaper}
                  enableTilt={settings.parallaxEnabled}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  selectedDirectoryId={selectedCategory}
                  onSelectDirectoryId={setSelectedCategory}
                  selectedResolution={selectedResolution}
                  onSelectResolution={(res: string) => setSelectedResolution(res as ResolutionType | 'All')}
                />
              )}

              {currentTab === 'customize' && (
                <TargetSelectorView
                  onSelectTarget={(targetId) => {
                    if (targetId === 'windows') setCurrentTab('windows');
                    else if (targetId === 'macos') setCurrentTab('macos');
                    else if (targetId === 'mobile') setCurrentTab('mobile');
                    else if (targetId === 'chrome') setCurrentTab('chrome-extension');
                  }}
                  onNavigateHomeWallpapers={() => setCurrentTab('home')}
                />
              )}

              {currentTab === 'windows' && (
                <WindowsTargetWorkspace
                  wallpapers={wallpapers}
                  activeWallpaper={activeWallpaper}
                  onBackToTargets={() => setCurrentTab('customize')}
                  onOpenFullSimulator={() => setViewMode('live-desktop')}
                  onSelectWallpaper={setActiveWallpaper}
                  onShowToast={(msg) => showToast(msg.title, msg.subtitle, msg.icon)}
                />
              )}

              {currentTab === 'macos' && (
                <MacTargetWorkspace
                  wallpapers={wallpapers}
                  activeWallpaper={activeWallpaper}
                  onBackToTargets={() => setCurrentTab('customize')}
                  onOpenFullSimulator={() => setIsSimulatorOpen(true)}
                  onSelectWallpaper={setActiveWallpaper}
                  onShowToast={(msg) => showToast(msg.title, msg.subtitle, msg.icon)}
                />
              )}

              {currentTab === 'mobile' && (
                <MobileTargetWorkspace
                  wallpapers={wallpapers}
                  activeWallpaper={activeWallpaper}
                  onBackToTargets={() => setCurrentTab('customize')}
                  onSelectWallpaper={setActiveWallpaper}
                  onShowToast={(msg) => showToast(msg.title, msg.subtitle, msg.icon)}
                />
              )}

              {currentTab === 'chrome-extension' && (
                <ChromeSection
                  wallpapers={wallpapers}
                  activeWallpaper={activeWallpaper}
                  activeSubTab={chromeSubTab}
                  onSubTabChange={setChromeSubTab}
                  onSelectWallpaper={setActiveWallpaper}
                  onNavigateHome={() => setCurrentTab('home')}
                  onNavigateGallery={() => setCurrentTab('home')}
                  onNavigateLiveWallpapers={() => setCurrentTab('live')}
                  onBackToTargets={() => setCurrentTab('customize')}
                  onShowToast={(msg) => showToast(msg.title, msg.subtitle, msg.icon)}
                />
              )}

              {currentTab === 'live' && (
                <LiveWallpapersView
                  wallpapers={wallpapers}
                  favorites={favorites}
                  activeWallpaperId={activeWallpaper?.id}
                  onToggleFavorite={handleToggleFavorite}
                  onInspect={handleInspectWallpaper}
                  onApplyDesktop={handleApplyDesktop}
                  onQuickDownload={handleQuickDownload}
                  onOpenDesktopSim={() => setViewMode('live-desktop')}
                  onShare={handleShareWallpaper}
                  onDelete={handleDeleteCustomWallpaper}
                  enableTilt={settings.parallaxEnabled}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  selectedDirectoryId={selectedCategory}
                  onSelectDirectoryId={setSelectedCategory}
                  selectedResolution={selectedResolution}
                  onSelectResolution={(res: string) => setSelectedResolution(res as ResolutionType | 'All')}
                />
              )}

              {currentTab === 'favorites' && (
                <div className="space-y-6 pb-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white tracking-tight">Favorite Wallpapers</h1>
                      <p className="text-xs text-slate-400 mt-1">Saved wallpapers in your personal collection</p>
                    </div>
                  </div>
                  <WallpaperGrid
                    wallpapers={wallpapers.filter((w) => favorites.includes(w.id))}
                    favorites={favorites}
                    activeWallpaperId={activeWallpaper?.id}
                    onToggleFavorite={handleToggleFavorite}
                    onInspect={handleInspectWallpaper}
                    onApplyDesktop={handleApplyDesktop}
                    onQuickDownload={handleQuickDownload}
                    onOpenDesktopSim={() => setViewMode('live-desktop')}
                    onShare={handleShareWallpaper}
                    onOpenAddToCollection={(wp) => setWallpaperForCollection(wp)}
                    onDelete={handleDeleteCustomWallpaper}
                    enableTilt={settings.parallaxEnabled}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    selectedResolution={selectedResolution}
                    searchQuery=""
                  />
                </div>
              )}

              {currentTab === 'downloads' && (
                <DownloadsView
                  downloads={downloads}
                  activeWallpaperId={activeWallpaper?.id}
                  onClearHistory={() => {
                    setDownloads([]);
                    localStorage.removeItem('wallix_downloads_history');
                  }}
                  onRemoveItem={(id) => {
                    setDownloads((prev) => {
                      const filtered = prev.filter((d) => d.id !== id);
                      localStorage.setItem('wallix_downloads_history', JSON.stringify(filtered));
                      return filtered;
                    });
                  }}
                  onReDownload={(item) => {
                    handleQuickDownload(item.wallpaper);
                  }}
                  onApplyDesktop={handleApplyDesktop}
                  onInspect={handleInspectWallpaper}
                  onShare={handleShareWallpaper}
                  onNavigateDiscover={() => setCurrentTab('home')}
                />
              )}

              {currentTab === 'collections' && (
                <CollectionsView
                  collections={collections}
                  wallpapers={wallpapers}
                  favorites={favorites}
                  activeWallpaperId={activeWallpaper?.id}
                  onToggleFavorite={handleToggleFavorite}
                  onInspect={handleInspectWallpaper}
                  onApplyDesktop={handleApplyDesktop}
                  onQuickDownload={handleQuickDownload}
                  onOpenDesktopSim={() => setViewMode('live-desktop')}
                  onShare={handleShareWallpaper}
                  onOpenAddToCollection={(wp) => setWallpaperForCollection(wp)}
                  onCreateCollection={(name, description, color) => {
                    const newCol: CollectionFolder = {
                      id: `col-${Date.now()}`,
                      name,
                      description: description || '',
                      wallpaperIds: [],
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      color: color || 'cyan',
                    };
                    setCollections((prev) => [newCol, ...prev]);
                    return newCol;
                  }}
                  onUpdateCollection={(id, updates) => {
                    setCollections((prev) =>
                      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c))
                    );
                  }}
                  onDeleteCollection={(id) => {
                    setCollections((prev) => prev.filter((c) => c.id !== id));
                  }}
                  onRemoveFromCollection={(collectionId, wallpaperId) => {
                    setCollections((prev) =>
                      prev.map((c) =>
                        c.id === collectionId
                          ? { ...c, wallpaperIds: c.wallpaperIds.filter((wid) => wid !== wallpaperId) }
                          : c
                      )
                    );
                  }}
                  onDelete={handleDeleteCustomWallpaper}
                  enableTilt={settings.parallaxEnabled}
                  onNavigateDiscover={() => setCurrentTab('home')}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {inspectedWallpaper && (
        <WallpaperModal
          wallpaper={inspectedWallpaper}
          isOpen={!!inspectedWallpaper}
          onClose={() => setInspectedWallpaper(null)}
          isFavorite={favorites.includes(inspectedWallpaper.id)}
          isApplied={inspectedWallpaper.id === activeWallpaper?.id}
          onToggleFavorite={handleToggleFavorite}
          onApplyDesktop={handleApplyDesktop}
          onOpenDesktopSim={() => {
            handleOpenDesktopSimWithWallpaper(inspectedWallpaper);
          }}
          onShare={handleShareWallpaper}
          onOpenAddToCollection={(wp) => setWallpaperForCollection(wp)}
          onSelectTag={handleSelectTag}
          onDelete={handleDeleteCustomWallpaper}
        />
      )}

      <DesktopSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        wallpaper={activeWallpaper}
        platformOS={platformOS}
        onTogglePlatformOS={() => setPlatformOS(platformOS === 'macos' ? 'windows' : 'macos')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPublishModal={handleOpenPublishModalFromDrawer}
        initialPresetId={activeSketchPresetId}
      />

      <AIStudioModal
        isOpen={isAIStudioOpen}
        onClose={() => setIsAIStudioOpen(false)}
        onSaveCustomWallpaper={(wp) => {
          handleSaveCustomWallpaper(wp);
          setIsAIStudioOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onClearCache={handleClearCache}
        onUpdateSettings={(newSettings: Partial<AppSettings>) => {
          setSettings((prev) => {
            const updated: AppSettings = { ...prev, ...newSettings };
            try {
              localStorage.setItem('wallix_settings', JSON.stringify(updated));
            } catch (e) {
              console.warn(e);
            }
            return updated;
          });
        }}
        favoritesCount={favorites.length}
      />

      {wallpaperForCollection && (
        <AddToCollectionModal
          isOpen={!!wallpaperForCollection}
          onClose={() => setWallpaperForCollection(null)}
          wallpaper={wallpaperForCollection}
          collections={collections}
          onToggleWallpaperInCollection={(collectionId, wallpaperId) => {
            setCollections((prev) => {
              const updated = prev.map((c) => {
                if (c.id === collectionId) {
                  const exists = c.wallpaperIds.includes(wallpaperId);
                  const newIds = exists
                    ? c.wallpaperIds.filter((id) => id !== wallpaperId)
                    : [...c.wallpaperIds, wallpaperId];
                  return { ...c, wallpaperIds: newIds, updatedAt: Date.now() };
                }
                return c;
              });
              try {
                localStorage.setItem('wallix_custom_collections', JSON.stringify(updated));
              } catch (e) {
                console.warn(e);
              }
              return updated;
            });
          }}
          onCreateCollection={(name, description, color) => {
            const newCol: CollectionFolder = {
              id: `col-${Date.now()}`,
              name,
              description: description || '',
              wallpaperIds: wallpaperForCollection ? [wallpaperForCollection.id] : [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              color: color || 'cyan',
            };
            setCollections((prev) => {
              const updated = [newCol, ...prev];
              try {
                localStorage.setItem('wallix_custom_collections', JSON.stringify(updated));
              } catch (e) {
                console.warn(e);
              }
              return updated;
            });
            return newCol;
          }}
        />
      )}

      <DownloadHistoryModal
        isOpen={isDownloadHistoryModalOpen}
        onClose={() => setIsDownloadHistoryModalOpen(false)}
        downloads={downloads}
        activeWallpaperId={activeWallpaper?.id}
        onClearHistory={() => {
          setDownloads([]);
          localStorage.removeItem('wallix_downloads_history');
        }}
        onRemoveItem={(id) => {
          setDownloads((prev) => {
            const filtered = prev.filter((d) => d.id !== id);
            localStorage.setItem('wallix_downloads_history', JSON.stringify(filtered));
            return filtered;
          });
        }}
        onReDownload={(item) => {
          handleQuickDownload(item.wallpaper);
        }}
        onApplyDesktop={handleApplyDesktop}
        onInspect={handleInspectWallpaper}
        onShare={handleShareWallpaper}
      />

      <PublishPresetModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        activeWallpaper={activeWallpaper}
        activeColorTheme={publishActiveTheme}
        colorIntensity={publishIntensity}
        onPublishSuccess={handlePublishPresetSuccess}
      />

      {presetToApply && (
        <PresetApplyModal
          isOpen={!!presetToApply}
          preset={presetToApply}
          onClose={() => setPresetToApply(null)}
          onConfirmApplyToDesktop={handleConfirmApplyPreset}
        />
      )}

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0D101C]/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-white animate-slideUp">
            {toastMessage.icon}
            <div>
              <div className="text-xs font-bold text-white">{toastMessage.title}</div>
              <div className="text-[11px] text-slate-400">{toastMessage.subtitle}</div>
            </div>
          </div>
        )}
        </div>
      </WeatherProvider>
    </AdaptiveMaterialProvider>
  );
}

