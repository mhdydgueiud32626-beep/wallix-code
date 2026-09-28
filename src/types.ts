export type ResolutionType = '4K UHD' | '8K Ultra' | 'Ultrawide 21:9' | 'Dual 4K' | 'FHD 1080p';

export type LiveShaderType = 
  | 'synthwave-sunset'
  | 'cosmic-nebula'
  | 'cyber-torus'
  | 'fluid-hologram'
  | 'quantum-matrix'
  | 'crystal-poly'
  | 'aurora-waves';

export interface Wallpaper {
  id: string;
  name?: string;
  title: string;
  category: string;
  tags: string[];
  resolution: ResolutionType;
  resolutionText: string;
  is3D: boolean;
  isLive: boolean;
  isVideo?: boolean;
  videoUrl?: string;
  isModel3D?: boolean;
  modelUrl?: string;
  shaderType?: LiveShaderType;
  image?: string;
  imageUrl: string;
  thumbnailUrl: string;
  thumbnail?: string;
  author: {
    name: string;
    avatar: string;
    badge?: string;
  };
  downloads: number;
  likes: number;
  featured?: boolean;
  aspectRatio: string;
  depthIntensity?: number;
  description: string;
  colors: string[];
  fileSize: string;
  fps?: number;
  badge?: 'TRENDING' | 'EXCLUSIVE' | 'NEW' | 'STAFF PICK';
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  gradient: string;
  bannerImage: string;
}

export type PlatformOS = 'macos' | 'windows';

export interface DesktopSimulatorState {
  isOpen: boolean;
  os: PlatformOS;
  wallpaper: Wallpaper | null;
  activeApp: 'none' | 'terminal' | 'music' | 'browser' | 'settings';
  showDock: boolean;
  isFullScreen: boolean;
  showWidgets: boolean;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'orange';
  wallpaperIds: string[];
  createdAt: string | number;
  updatedAt?: number;
}

export interface AppSettings {
  defaultResolution: ResolutionType;
  platformTheme: PlatformOS;
  colorScheme: 'obsidian' | 'cyber' | 'indigo' | 'amoled';
  themeMode: 'obsidian' | 'light';
  parallaxEnabled: boolean;
  parallaxStrength: number;
  targetFPS: 60 | 120 | 144;
  liveWallpaperAudioReactive: boolean;
  autoSwitchWallpaper: boolean;
  autoSwitchIntervalMins: number;
  showWatermark: boolean;
}

export interface DownloadHistoryItem {
  id: string;
  wallpaperId: string;
  wallpaper: Wallpaper;
  downloadedAt: string;
  timestamp: number;
  resolution: string;
}

export interface CommunityPreset {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: 'Cyberpunk' | 'Anime' | 'Minimal' | 'OLED Dark' | 'Synthwave' | '3D Live' | 'Nature';
  author: {
    name: string;
    handle: string;
    avatar: string;
    badge?: string;
    verified?: boolean;
  };
  wallpaperId: string;
  wallpaperTitle: string;
  previewImage: string;
  isVideo?: boolean;
  is3D?: boolean;
  colorGrade: {
    presetId: 'none' | 'cyberpunk' | 'warm' | 'cool' | 'matrix';
    name: string;
    intensity: number;
  };
  widgets: {
    clock: boolean;
    calendar: boolean;
    music: boolean;
    weather: boolean;
    depth3D?: boolean;
  };
  downloadsCount: number;
  likesCount: number;
  createdAt: string;
  isCustomUserUpload?: boolean;
}

export type NavTab = 
  | 'home'
  | 'customize'
  | 'windows'
  | 'macos'
  | 'mobile'
  | 'wallpapers'
  | 'live'
  | 'themes'
  | 'chrome'
  | 'downloads'
  | 'favorites'
  | 'settings'
  | 'landing'
  | 'discover'
  | 'search'
  | 'live3d'
  | 'categories'
  | 'collections'
  | 'community'
  | 'desktopsim'
  | 'generator'
  | 'chrome-extension';

export * from './types/target';

export type ChromeSubTab = 
  | 'new-tab' 
  | 'background' 
  | 'video' 
  | 'search' 
  | 'shortcuts' 
  | 'themes' 
  | 'extension';

export type WallpaperSubTab = 'gallery' | 'static' | 'live' | 'upload';

