export const SCHEMA_VERSION = 1;

export type SearchStyle = 'pill' | 'rounded' | 'minimal';
export type SearchSize = 'compact' | 'standard' | 'spacious';
export type SearchPosition = 'center' | 'top';
export type SearchEngine = 'google' | 'gemini' | 'duckduckgo' | 'bing';
export type ShortcutStyle = 'glass-card' | 'glass-pill' | 'minimal-icon' | 'solid';
export type ShortcutSpacing = 'tight' | 'normal' | 'loose';
export type ThemeAccent = 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';

export interface ChromeShortcut {
  id: string;
  title: string;
  url: string;
  initials: string;
  icon?: string;
  gradient?: string;
  glowColor?: string;
  isDefault?: boolean;
}

export type WallpaperFit = 'cover' | 'fill' | 'center';

export interface ChromeNewTabSettings {
  version: number;
  wallpaper: {
    type: 'image' | 'video';
    url: string;
    title: string;
    videoUrl?: string;
    fit?: WallpaperFit;
  };
  search: {
    style: SearchStyle;
    size: SearchSize;
    customWidth?: number; // 400 to 760 px
    position: SearchPosition;
    blur: number; // 0 to 50 px
    opacity: number; // 5 to 95 %
    borderOpacity: number; // 0 to 80 %
    radius?: number; // 4 to 36 px
    glow: boolean;
    engine: SearchEngine;
    showAiMode: boolean;
    isAiMode: boolean;
    showLogo?: boolean;
  };
  shortcuts: {
    style: ShortcutStyle;
    spacing: ShortcutSpacing;
    spacingPx?: number; // 8 to 36 px
    iconSize?: number; // 32 to 64 px
    labelSize?: number; // 9 to 14 px
    opacity: number; // 10 to 95 %
    blur: number; // 0 to 40 px
    borderOpacity?: number; // 0 to 60 %
    showLabels: boolean;
    scaleOnHover: boolean;
    hoverScale?: number; // 1.0 to 1.25
    hoverLift?: number; // 0 to 20 px - canonical hover lift
    liftDistance?: number; // 0 to 20 px - alias for backwards compatibility
  };
  effects: {
    vignette: number; // 0 to 100 %
    backdropDim: number; // 0 to 70 %
    themeAccent: ThemeAccent;
    glassIntensity?: number; // 0 to 100 %
    glassOpacity?: number; // 5 to 95 %
    glassBlur?: number; // 0 to 50 px
    glassBorder?: number; // 0 to 80 %
    glassRadius?: number; // 0 to 36 px
  };
  layout?: ChromeLayoutSettings;
  theme: string;
}

export type LayoutPreset = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'custom';

export type LayoutElementId = 'search' | 'dock' | 'weather' | 'topRight';

export interface ElementLayout {
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
  zIndex?: number;
}

export type ElementPosition = ElementLayout; // Backward compatibility alias

export interface ChromeLayoutSettings {
  preset?: LayoutPreset;
  search: ElementLayout;
  dock: ElementLayout;
  weather: ElementLayout;
  topRight: ElementLayout;
}

export const LAYOUT_ELEMENT_METAS: Record<LayoutElementId, { label: string; minWidth: number; minHeight: number; defaultWidth?: number }> = {
  search: { label: 'Search Bar', minWidth: 200, minHeight: 36, defaultWidth: 580 },
  dock: { label: 'Shortcut Dock', minWidth: 160, minHeight: 48, defaultWidth: 600 },
  weather: { label: 'Weather Widget', minWidth: 120, minHeight: 40 },
  topRight: { label: 'Top Right Controls', minWidth: 140, minHeight: 36 },
};

// Canonical layout bounds with full display canvas freedom
export const LAYOUT_SAFE_BOUNDS: Record<LayoutElementId, { minX: number; maxX: number; minY: number; maxY: number; label: string }> = {
  search: { minX: -2500, maxX: 2500, minY: -2500, maxY: 2500, label: 'Search Bar' },
  dock: { minX: -2500, maxX: 2500, minY: -2500, maxY: 2500, label: 'Shortcut Dock' },
  weather: { minX: -2500, maxX: 2500, minY: -2500, maxY: 2500, label: 'Weather' },
  topRight: { minX: -2500, maxX: 2500, minY: -2500, maxY: 2500, label: 'Top Right Controls' },
};

export const DEFAULT_LAYOUT_SETTINGS: ChromeLayoutSettings = {
  preset: 'center',
  search: { x: 0, y: 0, zIndex: 10 },
  dock: { x: 0, y: 0, zIndex: 10 },
  weather: { x: 0, y: 0, zIndex: 10 },
  topRight: { x: 0, y: 0, zIndex: 10 },
};

export const DEFAULT_CHROME_SETTINGS: ChromeNewTabSettings = {
  version: SCHEMA_VERSION,
  wallpaper: {
    type: 'image',
    url: '/images/azure_butterfly_maiden.jpg',
    title: 'Azure Reverie: Butterfly Meadow',
    fit: 'cover'
  },
  search: {
    style: 'pill',
    size: 'standard',
    customWidth: 580,
    position: 'center',
    blur: 16,
    opacity: 22,
    borderOpacity: 28,
    radius: 28,
    glow: true,
    engine: 'google',
    showAiMode: true,
    isAiMode: true,
    showLogo: false
  },
  shortcuts: {
    style: 'glass-pill',
    spacing: 'normal',
    spacingPx: 18,
    iconSize: 48,
    labelSize: 11.5,
    opacity: 34,
    blur: 16,
    borderOpacity: 22,
    showLabels: true,
    scaleOnHover: true,
    hoverScale: 1.08,
    hoverLift: 4,
    liftDistance: 4
  },
  effects: {
    vignette: 18,
    backdropDim: 8,
    themeAccent: 'cyan',
    glassIntensity: 55,
    glassOpacity: 22,
    glassBlur: 16,
    glassBorder: 24,
    glassRadius: 20
  },
  layout: {
    preset: 'center',
    search: { x: 0, y: 0 },
    dock: { x: 0, y: 0 },
    weather: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
  },
  theme: 'azure-reverie'
};

/**
 * Clamp a number to a min/max boundary
 */
export function clamp(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.min(Math.max(val, min), max);
}

/**
 * Validates and sanitizes raw input against the canonical ChromeNewTabSettings schema.
 * Recovers safely from missing fields, old versions, corrupted values, and invalid types.
 */
export function sanitizeChromeSettings(raw: any): ChromeNewTabSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CHROME_SETTINGS };
  }

  // 1. Wallpaper validation
  const rawWp = raw.wallpaper && typeof raw.wallpaper === 'object' ? raw.wallpaper : {};
  const wpType = rawWp.type === 'video' ? 'video' : 'image';
  const wpUrl = typeof rawWp.url === 'string' && rawWp.url.trim() ? rawWp.url.trim() : DEFAULT_CHROME_SETTINGS.wallpaper.url;
  const wpTitle = typeof rawWp.title === 'string' && rawWp.title.trim() ? rawWp.title.trim().slice(0, 100) : DEFAULT_CHROME_SETTINGS.wallpaper.title;
  const wpVideoUrl = typeof rawWp.videoUrl === 'string' && rawWp.videoUrl.trim() ? rawWp.videoUrl.trim() : undefined;
  const wpFit: 'cover' | 'fill' | 'center' = ['cover', 'fill', 'center'].includes(rawWp.fit) ? rawWp.fit : 'cover';

  // 2. Search validation
  const rawSearch = raw.search && typeof raw.search === 'object' ? raw.search : {};
  const searchStyle: SearchStyle = ['pill', 'rounded', 'minimal'].includes(rawSearch.style) ? rawSearch.style : 'pill';
  const searchSize: SearchSize = ['compact', 'standard', 'spacious'].includes(rawSearch.size) ? rawSearch.size : 'standard';
  const defaultWidth = searchSize === 'compact' ? 480 : searchSize === 'spacious' ? 680 : 580;
  const defaultRadius = searchStyle === 'pill' ? 28 : searchStyle === 'minimal' ? 12 : 18;
  const searchPosition: SearchPosition = ['center', 'top'].includes(rawSearch.position) ? rawSearch.position : 'center';
  const searchEngine: SearchEngine = ['google', 'gemini', 'duckduckgo', 'bing'].includes(rawSearch.engine) ? rawSearch.engine : 'google';

  // 3. Shortcuts validation
  const rawSc = raw.shortcuts && typeof raw.shortcuts === 'object' ? raw.shortcuts : {};
  const scStyle: ShortcutStyle = ['glass-card', 'glass-pill', 'minimal-icon', 'solid'].includes(rawSc.style) ? rawSc.style : 'glass-card';
  const scSpacing: ShortcutSpacing = ['tight', 'normal', 'loose'].includes(rawSc.spacing) ? rawSc.spacing : 'normal';
  const defaultSpacingPx = scSpacing === 'tight' ? 12 : scSpacing === 'loose' ? 24 : 18;

  // 4. Effects validation
  const rawEff = raw.effects && typeof raw.effects === 'object' ? raw.effects : {};
  const themeAccent: ThemeAccent = ['cyan', 'purple', 'blue', 'emerald', 'amber', 'rose'].includes(rawEff.themeAccent) ? rawEff.themeAccent : 'cyan';

    // 5. Layout validation
  const rawLayout = raw.layout && typeof raw.layout === 'object' ? raw.layout : {};
  const validPresets: LayoutPreset[] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'custom'
  ];
  const preset: LayoutPreset = validPresets.includes(rawLayout.preset) ? rawLayout.preset : 'center';

  const rawSearchPos = rawLayout.search && typeof rawLayout.search === 'object' ? rawLayout.search : {};
  const rawDockPos = rawLayout.dock && typeof rawLayout.dock === 'object' ? rawLayout.dock : {};
  const rawWeatherPos = rawLayout.weather && typeof rawLayout.weather === 'object' ? rawLayout.weather : {};
  const rawTopRightPos = rawLayout.topRight && typeof rawLayout.topRight === 'object' ? rawLayout.topRight : {};

  const layout: ChromeLayoutSettings = {
    preset,
    search: {
      x: clamp(rawSearchPos.x, LAYOUT_SAFE_BOUNDS.search.minX, LAYOUT_SAFE_BOUNDS.search.maxX, 0),
      y: clamp(rawSearchPos.y, LAYOUT_SAFE_BOUNDS.search.minY, LAYOUT_SAFE_BOUNDS.search.maxY, 0),
      width: typeof rawSearchPos.width === 'number' ? rawSearchPos.width : undefined,
      height: typeof rawSearchPos.height === 'number' ? rawSearchPos.height : undefined,
      scale: typeof rawSearchPos.scale === 'number' ? rawSearchPos.scale : undefined,
      zIndex: typeof rawSearchPos.zIndex === 'number' ? rawSearchPos.zIndex : 10,
    },
    dock: {
      x: clamp(rawDockPos.x, LAYOUT_SAFE_BOUNDS.dock.minX, LAYOUT_SAFE_BOUNDS.dock.maxX, 0),
      y: clamp(rawDockPos.y, LAYOUT_SAFE_BOUNDS.dock.minY, LAYOUT_SAFE_BOUNDS.dock.maxY, 0),
      width: typeof rawDockPos.width === 'number' ? rawDockPos.width : undefined,
      height: typeof rawDockPos.height === 'number' ? rawDockPos.height : undefined,
      scale: typeof rawDockPos.scale === 'number' ? rawDockPos.scale : undefined,
      zIndex: typeof rawDockPos.zIndex === 'number' ? rawDockPos.zIndex : 10,
    },
    weather: {
      x: clamp(rawWeatherPos.x, LAYOUT_SAFE_BOUNDS.weather.minX, LAYOUT_SAFE_BOUNDS.weather.maxX, 0),
      y: clamp(rawWeatherPos.y, LAYOUT_SAFE_BOUNDS.weather.minY, LAYOUT_SAFE_BOUNDS.weather.maxY, 0),
      width: typeof rawWeatherPos.width === 'number' ? rawWeatherPos.width : undefined,
      height: typeof rawWeatherPos.height === 'number' ? rawWeatherPos.height : undefined,
      scale: typeof rawWeatherPos.scale === 'number' ? rawWeatherPos.scale : undefined,
      zIndex: typeof rawWeatherPos.zIndex === 'number' ? rawWeatherPos.zIndex : 10,
    },
    topRight: {
      x: clamp(rawTopRightPos.x, LAYOUT_SAFE_BOUNDS.topRight.minX, LAYOUT_SAFE_BOUNDS.topRight.maxX, 0),
      y: clamp(rawTopRightPos.y, LAYOUT_SAFE_BOUNDS.topRight.minY, LAYOUT_SAFE_BOUNDS.topRight.maxY, 0),
      width: typeof rawTopRightPos.width === 'number' ? rawTopRightPos.width : undefined,
      height: typeof rawTopRightPos.height === 'number' ? rawTopRightPos.height : undefined,
      scale: typeof rawTopRightPos.scale === 'number' ? rawTopRightPos.scale : undefined,
      zIndex: typeof rawTopRightPos.zIndex === 'number' ? rawTopRightPos.zIndex : 10,
    },
  };

  return {
    version: SCHEMA_VERSION,
    wallpaper: {
      type: wpType,
      url: wpUrl,
      title: wpTitle,
      fit: wpFit,
      ...(wpVideoUrl ? { videoUrl: wpVideoUrl } : {})
    },
    search: {
      style: searchStyle,
      size: searchSize,
      customWidth: clamp(rawSearch.customWidth, 380, 760, defaultWidth),
      position: searchPosition,
      blur: clamp(rawSearch.blur, 0, 50, 24),
      opacity: clamp(rawSearch.opacity, 5, 95, 38),
      borderOpacity: clamp(rawSearch.borderOpacity, 0, 80, 25),
      radius: clamp(rawSearch.radius, 4, 36, defaultRadius),
      glow: Boolean(rawSearch.glow),
      engine: searchEngine,
      showAiMode: rawSearch.showAiMode !== false,
      isAiMode: rawSearch.isAiMode !== false,
      showLogo: Boolean(rawSearch.showLogo)
    },
    shortcuts: {
      style: scStyle,
      spacing: scSpacing,
      spacingPx: clamp(rawSc.spacingPx, 8, 36, defaultSpacingPx),
      iconSize: clamp(rawSc.iconSize, 32, 64, 48),
      labelSize: clamp(rawSc.labelSize, 9, 14, 11.5),
      opacity: clamp(rawSc.opacity, 10, 95, 45),
      blur: clamp(rawSc.blur, 0, 40, 20),
      borderOpacity: clamp(rawSc.borderOpacity, 0, 60, 22),
      showLabels: rawSc.showLabels !== false,
      scaleOnHover: rawSc.scaleOnHover !== false,
      hoverScale: clamp(rawSc.hoverScale, 1.0, 1.25, 1.08),
      hoverLift: clamp(rawSc.hoverLift ?? rawSc.liftDistance, 0, 16, 4),
      liftDistance: clamp(rawSc.hoverLift ?? rawSc.liftDistance, 0, 16, 4)
    },
    effects: {
      vignette: clamp(rawEff.vignette, 0, 100, 40),
      backdropDim: clamp(rawEff.backdropDim, 0, 70, 25),
      themeAccent,
      glassIntensity: clamp(rawEff.glassIntensity, 0, 100, 55),
      glassOpacity: clamp(rawEff.glassOpacity, 5, 95, 35),
      glassBlur: clamp(rawEff.glassBlur, 0, 50, 20),
      glassBorder: clamp(rawEff.glassBorder, 0, 80, 24),
      glassRadius: clamp(rawEff.glassRadius, 0, 36, 20)
    },
    layout,
    theme: typeof raw.theme === 'string' && raw.theme.trim() ? raw.theme.trim().slice(0, 50) : DEFAULT_CHROME_SETTINGS.theme
  };
}

/**
 * Validates and sanitizes raw shortcut array
 */
export function sanitizeChromeShortcuts(rawList: any): ChromeShortcut[] {
  if (!Array.isArray(rawList)) return [...INITIAL_CHROME_SHORTCUTS];

  const sanitized = rawList.map((item, idx) => {
    if (!item || typeof item !== 'object') return null;
    const id = typeof item.id === 'string' && item.id ? item.id : `sc-${Date.now()}-${idx}`;
    const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 40) : 'Shortcut';
    let url = typeof item.url === 'string' && item.url.trim() ? item.url.trim() : 'https://www.google.com';
    // Ensure safe protocol (http/https only)
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    const initials = typeof item.initials === 'string' && item.initials.trim() ? item.initials.trim().slice(0, 3) : title.slice(0, 2).toUpperCase();

    return {
      id,
      title,
      url,
      initials,
      gradient: typeof item.gradient === 'string' ? item.gradient : 'from-cyan-400 to-blue-600',
      glowColor: typeof item.glowColor === 'string' ? item.glowColor : 'rgba(6, 182, 212, 0.4)',
      isDefault: Boolean(item.isDefault)
    } as ChromeShortcut;
  }).filter(Boolean) as ChromeShortcut[];

  return sanitized.length > 0 ? sanitized : [...INITIAL_CHROME_SHORTCUTS];
}

export const INITIAL_CHROME_SHORTCUTS: ChromeShortcut[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com', initials: 'G', gradient: 'from-blue-500 to-indigo-600', glowColor: 'rgba(59,130,246,0.5)', isDefault: true },
  { id: '2', title: 'YouTube', url: 'https://www.youtube.com', initials: 'YT', gradient: 'from-red-600 to-rose-700', glowColor: 'rgba(239,68,68,0.5)', isDefault: true },
  { id: '3', title: 'GitHub', url: 'https://www.github.com', initials: 'GH', gradient: 'from-slate-700 to-zinc-900', glowColor: 'rgba(148,163,184,0.3)', isDefault: true },
  { id: '4', title: 'AI Studio', url: 'https://aistudio.google.com', initials: 'AI', gradient: 'from-cyan-400 to-blue-600', glowColor: 'rgba(6,182,212,0.5)', isDefault: true },
  { id: '5', title: 'Reddit', url: 'https://www.reddit.com', initials: 'R', gradient: 'from-orange-500 to-red-600', glowColor: 'rgba(249,115,22,0.5)', isDefault: true },
  { id: '6', title: 'Figma', url: 'https://www.figma.com', initials: 'F', gradient: 'from-purple-500 to-pink-600', glowColor: 'rgba(168,85,247,0.5)', isDefault: true }
];

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || 'google.com';
  }
}

export function getFaviconUrl(url: string): string {
  const domain = getDomainFromUrl(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
