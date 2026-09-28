// WALLIX Storage Management for Chrome Extension & Web Continuity
const STORAGE_KEY = 'wallix_chrome_newtab_settings';
const SHORTCUTS_KEY = 'wallix_chrome_newtab_shortcuts';

export const DEFAULT_SETTINGS = {
  version: 1,
  wallpaper: {
    type: 'image',
    url: 'samurai_spider_lily.jpg',
    title: 'Samurai: Crimson Lily'
  },
  search: {
    style: 'pill',
    size: 'standard',
    customWidth: 580,
    position: 'center',
    blur: 14,
    opacity: 18,
    borderOpacity: 25,
    radius: 28,
    glow: false,
    engine: 'google',
    showAiMode: true,
    isAiMode: true,
    showLogo: false
  },
  shortcuts: {
    style: 'glass-card',
    spacing: 'normal',
    spacingPx: 18,
    iconSize: 48,
    labelSize: 11.5,
    opacity: 30,
    blur: 16,
    borderOpacity: 22,
    showLabels: true,
    scaleOnHover: true,
    hoverScale: 1.04
  },
  effects: {
    vignette: 15,
    backdropDim: 6,
    themeAccent: 'purple',
    glassIntensity: 55,
    glassOpacity: 35,
    glassBlur: 20,
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
  theme: 'cyber-cyan'
};

export const DEFAULT_SHORTCUTS = [
  { id: '1', title: 'Google', url: 'https://www.google.com', initials: 'G', gradient: 'linear-gradient(135deg, #3B82F6, #4F46E5)', glowColor: 'rgba(59,130,246,0.5)', isDefault: true },
  { id: '2', title: 'YouTube', url: 'https://www.youtube.com', initials: 'YT', gradient: 'linear-gradient(135deg, #DC2626, #E11D48)', glowColor: 'rgba(239,68,68,0.5)', isDefault: true },
  { id: '3', title: 'GitHub', url: 'https://www.github.com', initials: 'GH', gradient: 'linear-gradient(135deg, #334155, #09090B)', glowColor: 'rgba(148,163,184,0.3)', isDefault: true },
  { id: '4', title: 'AI Studio', url: 'https://aistudio.google.com', initials: 'AI', gradient: 'linear-gradient(135deg, #06B6D4, #2563EB)', glowColor: 'rgba(6,182,212,0.5)', isDefault: true },
  { id: '5', title: 'Reddit', url: 'https://www.reddit.com', initials: 'R', gradient: 'linear-gradient(135deg, #F97316, #DC2626)', glowColor: 'rgba(249,115,22,0.5)', isDefault: true },
  { id: '6', title: 'Figma', url: 'https://www.figma.com', initials: 'F', gradient: 'linear-gradient(135deg, #A855F7, #DB2777)', glowColor: 'rgba(168,85,247,0.5)', isDefault: true }
];

export async function getSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY, SHORTCUTS_KEY, 'wallix_chrome_settings'], (result) => {
        const raw = result[STORAGE_KEY] || result['wallix_chrome_settings'];
        const shortcuts = result[SHORTCUTS_KEY] || raw?.shortcutsList || DEFAULT_SHORTCUTS;
        resolve({
          settings: raw ? { ...DEFAULT_SETTINGS, ...raw } : DEFAULT_SETTINGS,
          shortcuts: Array.isArray(shortcuts) ? shortcuts : DEFAULT_SHORTCUTS
        });
      });
    });
  }

  try {
    const rawSettings = localStorage.getItem(STORAGE_KEY);
    const rawShortcuts = localStorage.getItem(SHORTCUTS_KEY);
    return {
      settings: rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS,
      shortcuts: rawShortcuts ? JSON.parse(rawShortcuts) : DEFAULT_SHORTCUTS
    };
  } catch (e) {
    return { settings: DEFAULT_SETTINGS, shortcuts: DEFAULT_SHORTCUTS };
  }
}

export async function saveSettings(settings, shortcuts) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [STORAGE_KEY]: settings,
        [SHORTCUTS_KEY]: shortcuts,
        wallix_extension_active: true,
        wallix_last_synced: new Date().toISOString()
      }, resolve);
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}
