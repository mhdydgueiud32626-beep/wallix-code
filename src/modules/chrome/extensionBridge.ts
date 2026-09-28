import JSZip from 'jszip';
import { 
  ChromeNewTabSettings, 
  ChromeShortcut, 
  SCHEMA_VERSION, 
  DEFAULT_LAYOUT_SETTINGS,
  sanitizeChromeSettings, 
  sanitizeChromeShortcuts 
} from './types';

export const STORAGE_KEY = 'wallix_chrome_newtab_settings';
export const SHORTCUTS_KEY = 'wallix_chrome_newtab_shortcuts';

export interface ExtensionBridgeStatus {
  isExtensionDetected: boolean;
  isStorageSaved: boolean;
  lastSyncTime: string | null;
  storageBackend: 'chrome.storage.local' | 'localStorage';
}

function getSafeOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return '*';
}

/**
 * Save settings to both chrome.storage.local (if running within an extension)
 * and localStorage (for web app preview continuity).
 */
export async function saveChromeSettings(
  settings: ChromeNewTabSettings,
  shortcuts: ChromeShortcut[]
): Promise<boolean> {
  try {
    const cleanSettings = sanitizeChromeSettings(settings);
    const cleanShortcuts = sanitizeChromeShortcuts(shortcuts);

    const payload = {
      version: SCHEMA_VERSION,
      wallpaper: cleanSettings.wallpaper,
      search: cleanSettings.search,
      shortcuts: cleanSettings.shortcuts,
      effects: cleanSettings.effects,
      theme: cleanSettings.theme,
      layout: cleanSettings.layout,
      shortcutsList: cleanShortcuts,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to localStorage for web app continuity (Web App Persistence)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSettings));
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(cleanShortcuts));
    localStorage.setItem('wallix_chrome_last_synced', payload.updatedAt);

    // 2. If Chrome Extension API is directly present (e.g. running inside extension page or side panel)
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      await (window as any).chrome.storage.local.set({
        [STORAGE_KEY]: payload,
        wallix_extension_active: true,
        wallix_last_synced: payload.updatedAt,
      });
    }

    // 3. Dispatch window postMessage for Chrome extension content script listener with validated targetOrigin
    if (typeof window !== 'undefined') {
      const targetOrigin = getSafeOrigin();
      window.postMessage({
        type: 'WALLIX_SYNC_SETTINGS',
        payload,
      }, targetOrigin);

      // Dispatch custom DOM event for intra-app reactivity
      window.dispatchEvent(new CustomEvent('wallix:settings-updated', {
        detail: payload
      }));
    }

    return true;
  } catch (err) {
    console.error('Failed to save Chrome settings', err);
    return false;
  }
}

/**
 * Load settings from storage with canonical schema sanitization
 */
export function loadSavedChromeSettings(): {
  settings: ChromeNewTabSettings | null;
  shortcuts: ChromeShortcut[] | null;
} {
  try {
    const rawSettings = localStorage.getItem(STORAGE_KEY);
    const rawShortcuts = localStorage.getItem(SHORTCUTS_KEY);
    return {
      settings: rawSettings ? sanitizeChromeSettings(JSON.parse(rawSettings)) : null,
      shortcuts: rawShortcuts ? sanitizeChromeShortcuts(JSON.parse(rawShortcuts)) : null,
    };
  } catch {
    return { settings: null, shortcuts: null };
  }
}

/**
 * Listen for extension presence & save acknowledgement from content script with origin validation
 */
export function initExtensionConnectionListener(
  onStatusChange: (status: Partial<ExtensionBridgeStatus>) => void
): () => void {
  const safeOrigin = getSafeOrigin();

  const handler = (event: MessageEvent) => {
    // Reject unknown origin if origin is defined
    if (safeOrigin !== '*' && event.origin !== safeOrigin) return;
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'WALLIX_EXTENSION_READY') {
      onStatusChange({
        isExtensionDetected: true,
        storageBackend: 'chrome.storage.local',
        lastSyncTime: event.data.timestamp || new Date().toISOString(),
      });
    } else if (event.data.type === 'WALLIX_EXTENSION_SAVED_ACK') {
      onStatusChange({
        isExtensionDetected: true,
        isStorageSaved: true,
        lastSyncTime: event.data.timestamp || new Date().toISOString(),
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handler);

    // Probe if extension content script is already injected
    window.postMessage({ type: 'WALLIX_PING_EXTENSION' }, safeOrigin);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handler);
    }
  };
}

/**
 * Theme Accent CSS Variable Mapping
 */
export function resolveSafeWallpaperUrl(url?: string): string {
  const FALLBACK_4K = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';

  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_4K;
  }

  const clean = url.trim();

  // If already a valid absolute remote URL (Unsplash, Pexels, direct CDN) or data: / blob:
  if (/^(data:image\/|blob:)/i.test(clean)) {
    return clean;
  }

  // Builtin 4K CDN mappings for all catalog and preset wallpapers
  const BUILTIN_CDN_FALLBACKS: Record<string, string> = {
    '/samurai_spider_lily.jpg': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85',
    'samurai_spider_lily.jpg': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85',
    'samurai-spider-lily': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85',

    '/anime_train_wallpaper.jpg': 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=85',
    'anime_train_wallpaper.jpg': 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=85',
    'anime-train-spring': 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=85',

    '/porsche_wall_street.jpg': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85',
    'porsche_wall_street.jpg': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85',
    'porsche-wall-street': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85',

    '/silver_surfer_oled.jpg': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=85',
    'silver_surfer_oled.jpg': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=85',
    'silver-surfer-oled': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=85',

    '/toji_fushiguro_emerald.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',
    'toji_fushiguro_emerald.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',
    'toji-fushiguro': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',

    '/images/azure_butterfly_maiden.jpg': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=85',
    'images/azure_butterfly_maiden.jpg': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=85',
    'azure-reverie-butterfly-maiden-4k': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=85',

    '/images/gojo_six_eyes_awakening.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',
    'images/gojo_six_eyes_awakening.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',
    'gojo-satoru-limitless-void-4k': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=85',
  };

  // Strip path prefix for mapping check
  const filename = clean.split('/').pop() || clean;
  if (BUILTIN_CDN_FALLBACKS[clean]) return BUILTIN_CDN_FALLBACKS[clean];
  if (BUILTIN_CDN_FALLBACKS[filename]) return BUILTIN_CDN_FALLBACKS[filename];

  // If http/https remote URL
  if (/^https?:\/\//i.test(clean)) {
    // If it points to a local server asset (e.g. http://localhost:3000/samurai_spider_lily.jpg)
    try {
      const parsed = new URL(clean);
      const pathOnly = parsed.pathname;
      const fileOnly = pathOnly.split('/').pop() || '';
      if (BUILTIN_CDN_FALLBACKS[pathOnly]) return BUILTIN_CDN_FALLBACKS[pathOnly];
      if (BUILTIN_CDN_FALLBACKS[fileOnly]) return BUILTIN_CDN_FALLBACKS[fileOnly];
      return clean;
    } catch {
      return clean;
    }
  }

  // If in browser and valid non-null origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('null') && /^https?:\/\//i.test(origin)) {
      try {
        return new URL(clean.replace(/^\.?\//, '/'), origin).href;
      } catch {}
    }
  }

  return FALLBACK_4K;
}

function getThemeAccentValues(accent: string) {
  switch (accent) {
    case 'purple':
      return {
        color: '#c084fc',
        glow: 'rgba(192, 132, 252, 0.45)',
        ring: 'rgba(192, 132, 252, 0.6)',
        bgTint: 'rgba(28, 18, 48, 0.4)',
        weatherAmbient: 'rgba(192, 132, 252, 0.08)',
        weatherPillBg: 'rgba(192, 132, 252, 0.20)',
        weatherPillBorder: 'rgba(192, 132, 252, 0.40)',
        weatherPillText: '#f3e8ff',
      };
    case 'blue':
      return {
        color: '#60a5fa',
        glow: 'rgba(96, 165, 250, 0.45)',
        ring: 'rgba(96, 165, 250, 0.6)',
        bgTint: 'rgba(15, 28, 56, 0.4)',
        weatherAmbient: 'rgba(96, 165, 250, 0.08)',
        weatherPillBg: 'rgba(96, 165, 250, 0.20)',
        weatherPillBorder: 'rgba(96, 165, 250, 0.40)',
        weatherPillText: '#dbeafe',
      };
    case 'emerald':
      return {
        color: '#34d399',
        glow: 'rgba(52, 211, 153, 0.45)',
        ring: 'rgba(52, 211, 153, 0.6)',
        bgTint: 'rgba(6, 40, 32, 0.4)',
        weatherAmbient: 'rgba(52, 211, 153, 0.08)',
        weatherPillBg: 'rgba(52, 211, 153, 0.20)',
        weatherPillBorder: 'rgba(52, 211, 153, 0.40)',
        weatherPillText: '#d1fae5',
      };
    case 'amber':
      return {
        color: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.45)',
        ring: 'rgba(251, 191, 36, 0.6)',
        bgTint: 'rgba(45, 28, 10, 0.4)',
        weatherAmbient: 'rgba(251, 191, 36, 0.08)',
        weatherPillBg: 'rgba(251, 191, 36, 0.20)',
        weatherPillBorder: 'rgba(251, 191, 36, 0.40)',
        weatherPillText: '#fef3c7',
      };
    case 'rose':
      return {
        color: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.45)',
        ring: 'rgba(244, 63, 94, 0.6)',
        bgTint: 'rgba(48, 15, 22, 0.4)',
        weatherAmbient: 'rgba(244, 63, 94, 0.08)',
        weatherPillBg: 'rgba(244, 63, 94, 0.20)',
        weatherPillBorder: 'rgba(244, 63, 94, 0.40)',
        weatherPillText: '#ffe4e6',
      };
    case 'cyan':
    default:
      return {
        color: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.45)',
        ring: 'rgba(6, 182, 212, 0.6)',
        bgTint: 'rgba(6, 35, 52, 0.4)',
        weatherAmbient: 'rgba(6, 182, 212, 0.08)',
        weatherPillBg: 'rgba(6, 182, 212, 0.20)',
        weatherPillBorder: 'rgba(34, 211, 238, 0.40)',
        weatherPillText: '#cffafe',
      };
  }
}

/**
 * Generates production Manifest V3 ZIP package
 * Includes Toolbar action, Side Panel, Content Bridge, and New Tab override
 */
export async function generateManifestV3Package(
  settings: ChromeNewTabSettings,
  shortcuts: ChromeShortcut[]
): Promise<Blob> {
  const zip = new JSZip();
  const accent = getThemeAccentValues(settings.effects.themeAccent);

  // 1. Manifest V3 JSON (Minimal Privileges: No unnecessary host_permissions)
  const manifest = {
    manifest_version: 3,
    name: "WALLIX - Glass Chrome New Tab & Side Panel",
    version: "3.5.0",
    description: "Custom frosted glass Google New Tab with live wallpapers and dock shortcuts",
    permissions: [
      "storage",
      "sidePanel"
    ],
    content_scripts: [
      {
        matches: ["https://*/*", "http://*/*"],
        js: ["content.js"],
        run_at: "document_start"
      }
    ],
    action: {
      default_title: "WALLIX Customizer",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    side_panel: {
      default_path: "sidepanel.html"
    },
    chrome_url_overrides: {
      newtab: "newtab.html"
    },
    background: {
      service_worker: "background.js"
    }
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. content.js (Extension Bridge: Origin validated & schema verified sync to chrome.storage.local)
  const contentJs = `// WALLIX Chrome Extension Content Script (Production Hardened)
// Bridges the WALLIX Web Customizer with chrome.storage.local with strict origin & payload validation

function sanitizePayload(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const clamp = (val, min, max, fallback) => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.min(Math.max(num, min), max);
  };

  const wp = raw.wallpaper || {};
  const search = raw.search || {};
  const shortcuts = raw.shortcuts || {};
  const effects = raw.effects || {};

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    wallpaper: {
      type: wp.type === 'video' ? 'video' : 'image',
      url: typeof wp.url === 'string' && wp.url ? wp.url.slice(0, 5000000) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85',
      title: typeof wp.title === 'string' ? wp.title.slice(0, 80) : 'WALLIX Wallpaper',
      ...(wp.videoUrl && typeof wp.videoUrl === 'string' ? { videoUrl: wp.videoUrl.slice(0, 2048) } : {})
    },
    search: {
      style: ['pill', 'rounded', 'minimal'].includes(search.style) ? search.style : 'pill',
      size: ['compact', 'standard', 'spacious'].includes(search.size) ? search.size : 'standard',
      position: ['center', 'top'].includes(search.position) ? search.position : 'center',
      blur: clamp(search.blur, 0, 40, 24),
      opacity: clamp(search.opacity, 5, 90, 38),
      borderOpacity: clamp(search.borderOpacity, 5, 60, 22),
      glow: Boolean(search.glow),
      engine: ['google', 'gemini', 'duckduckgo', 'bing'].includes(search.engine) ? search.engine : 'google',
      showAiMode: search.showAiMode !== false,
      isAiMode: search.isAiMode !== false,
      showLogo: Boolean(search.showLogo)
    },
    shortcuts: {
      style: ['glass-card', 'glass-pill', 'minimal-icon', 'solid'].includes(shortcuts.style) ? shortcuts.style : 'glass-pill',
      spacing: ['tight', 'normal', 'loose'].includes(shortcuts.spacing) ? shortcuts.spacing : 'normal',
      spacingPx: clamp(shortcuts.spacingPx, 8, 36, 18),
      iconSize: clamp(shortcuts.iconSize, 32, 64, 48),
      labelSize: clamp(shortcuts.labelSize, 9, 14, 11.5),
      opacity: clamp(shortcuts.opacity, 10, 95, 30),
      blur: clamp(shortcuts.blur, 0, 40, 16),
      borderOpacity: clamp(shortcuts.borderOpacity, 0, 60, 22),
      showLabels: shortcuts.showLabels !== false,
      scaleOnHover: shortcuts.scaleOnHover !== false,
      hoverScale: clamp(shortcuts.hoverScale, 1.0, 1.25, 1.08),
      hoverLift: clamp(shortcuts.hoverLift ?? shortcuts.liftDistance, 0, 16, 4),
      liftDistance: clamp(shortcuts.hoverLift ?? shortcuts.liftDistance, 0, 16, 4)
    },
    effects: {
      vignette: clamp(effects.vignette, 0, 100, 40),
      backdropDim: clamp(effects.backdropDim, 0, 70, 25),
      themeAccent: ['cyan', 'purple', 'blue', 'emerald', 'amber', 'rose'].includes(effects.themeAccent) ? effects.themeAccent : 'cyan'
    },
    theme: typeof raw.theme === 'string' ? raw.theme.slice(0, 50) : 'cyber-cyan',
    shortcutsList: Array.isArray(raw.shortcutsList) ? raw.shortcutsList.slice(0, 32).map((s, idx) => ({
      id: String(s?.id || 'sc-' + idx).slice(0, 36),
      title: String(s?.title || 'Link').slice(0, 40),
      url: /^https?:\\/\\//i.test(String(s?.url || '')) ? String(s.url).slice(0, 2048) : 'https://www.google.com',
      initials: String(s?.initials || s?.title?.slice(0, 2) || 'L').slice(0, 3).toUpperCase(),
      gradient: typeof s?.gradient === 'string' ? s.gradient : 'from-cyan-400 to-blue-600',
      glowColor: typeof s?.glowColor === 'string' ? s.glowColor : 'rgba(6, 182, 212, 0.4)',
      isDefault: Boolean(s?.isDefault)
    })) : [],
    updatedAt: new Date().toISOString()
  };
}

window.addEventListener("message", (event) => {
  // 1. Strict Origin & Source Validation (Blocks cross-origin script spoofing)
  if (event.source !== window) return;
  if (!event.origin || event.origin !== window.location.origin) return;
  if (!event.data || typeof event.data !== "object") return;

  // 2. Handle sync command from WALLIX Editor
  if (event.data.type === "WALLIX_SYNC_SETTINGS") {
    const raw = event.data.payload;
    const sanitized = sanitizePayload(raw);

    if (!sanitized) {
      console.warn("[WALLIX Extension] Malformed settings payload rejected by bridge.");
      return;
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({
        wallix_chrome_newtab_settings: sanitized,
        wallix_extension_active: true,
        wallix_last_synced: sanitized.updatedAt
      }, () => {
        console.log("[WALLIX Extension] Verified & Synchronized settings to chrome.storage.local");
        window.postMessage({
          type: "WALLIX_EXTENSION_SAVED_ACK",
          status: "success",
          timestamp: new Date().toISOString()
        }, event.origin);
      });
    }
  }

  // 3. Handle probe ping from WALLIX Editor
  if (event.data.type === "WALLIX_PING_EXTENSION") {
    window.postMessage({
      type: "WALLIX_EXTENSION_READY",
      installed: true,
      version: "3.5.0",
      schemaVersion: 1,
      timestamp: new Date().toISOString()
    }, event.origin);
  }
});

// Announce presence when page loads
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get(["wallix_chrome_newtab_settings"], (result) => {
    window.postMessage({
      type: "WALLIX_EXTENSION_READY",
      installed: true,
      version: "3.5.0",
      schemaVersion: 1,
      hasSavedSettings: !!result.wallix_chrome_newtab_settings,
      timestamp: new Date().toISOString()
    }, window.location.origin);
  });
}
`;
  zip.file("content.js", contentJs);

  // 3. background.js (Side Panel opening on toolbar action)
  const backgroundJs = `// WALLIX Chrome Extension Background Service Worker (Manifest V3)
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.warn("Side panel behavior notice:", error));
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("WALLIX Glass New Tab & Side Panel Extension active.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "WALLIX_OPEN_CUSTOMIZE_PANEL") {
    const windowId = sender.tab?.windowId;
    if (windowId !== undefined) {
      chrome.sidePanel.open({ windowId }).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        console.warn("[WALLIX] sidePanel.open with sender windowId failed, trying current window:", err);
        openOnCurrentWindow(sendResponse);
      });
    } else {
      openOnCurrentWindow(sendResponse);
    }
    return true;
  }
});

function openOnCurrentWindow(sendResponse) {
  chrome.windows.getCurrent((window) => {
    if (window?.id !== undefined && chrome.sidePanel?.open) {
      chrome.sidePanel.open({ windowId: window.id }).then(() => {
        if (sendResponse) sendResponse({ success: true });
      }).catch((err) => {
        console.error("[WALLIX] Failed to open side panel:", err);
        if (sendResponse) sendResponse({ success: false, error: String(err) });
      });
    } else {
      if (sendResponse) sendResponse({ success: false, error: "No window ID or sidePanel API" });
    }
  });
}
`;
  zip.file("background.js", backgroundJs);

  // 4. newtab.html
  const newtabHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="newtab.css">
</head>
<body>
  <!-- BACKGROUND WALLPAPER LAYER -->
  <div class="wallpaper-layer">
    <video id="bg-video" autoplay loop muted playsinline class="bg-media" style="display: none;"></video>
    <img id="bg-img" class="bg-media" alt="Wallpaper">
    <div id="vignette-overlay" class="vignette-overlay"></div>
  </div>

  <!-- CHROME NEW TAB UI LAYER -->
  <main class="ui-layer">
    <!-- Top Nav -->
    <header class="top-nav">
      <!-- Top Left: Weather Widget with True WALLIX Frosted Glass Parity -->
      <div id="weather-widget" class="weather-widget glass-surface">
        <!-- Internal ambient glow and real glass shimmer layers -->
        <div class="weather-ambient-glow" aria-hidden="true"></div>
        <div class="animate-glass-light-sweep" aria-hidden="true"></div>

        <!-- Top row: Live Date & Ambient Sun Badge -->
        <div class="weather-top">
          <div class="weather-date-wrap">
            <svg class="weather-cal-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="weather-date-text" id="weather-date-display">Sunday, 12 Apr 2026</span>
          </div>
          <div class="weather-top-sun-badge" title="Ambient Lighting Active">
            <svg class="sun-micro-icon animate-sun-glow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
            </svg>
          </div>
        </div>

        <!-- Middle section: Layered Sun/Cloud Art, Hero Temp (°C/°F toggle) & Telemetry -->
        <div class="weather-mid">
          <div class="weather-temp-group">
            <!-- Layered animated Sun + Floating Cloud Icons -->
            <div class="weather-layered-icons" aria-hidden="true">
              <svg class="weather-sun-primary animate-sun-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
              </svg>
              <svg class="weather-cloud-secondary animate-cloud-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
            </div>

            <!-- Clickable Interactive Temperature Hero -->
            <button type="button" class="weather-temp-btn" id="weather-temp-toggle" title="Click to toggle °C / °F">
              <span class="weather-temp-val" id="temp-deg">28</span>
              <span class="weather-unit-val" id="temp-unit">°C</span>
            </button>
          </div>

          <!-- Telemetry Column: Location, Feels Like, High/Low Glass Pills -->
          <div class="weather-telemetry-col">
            <div class="weather-loc-row">
              <svg class="weather-map-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="weather-loc-name">New Delhi</span>
              <span class="weather-loc-dot">·</span>
              <span id="feels-like-val">26°</span>
            </div>
            <div class="weather-feels-sub" id="weather-feels-sub-text">Feels like 26°</div>
            <div class="weather-pills-row">
              <div class="weather-hi-pill" title="High">
                <svg class="hi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                </svg>
                <span id="hi-temp">28°</span>
              </div>
              <div class="weather-lo-pill" title="Low">
                <svg class="lo-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m19 12-7 7-7-7"/><path d="M12 5v14"/>
                </svg>
                <span id="lo-temp">23°</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom row: 7-Day Forecast Grid -->
        <div class="weather-bottom-forecast">
          <div class="forecast-pill"><span class="forecast-day">MON</span><span class="forecast-temp" id="fc-mon">27°</span></div>
          <div class="forecast-pill"><span class="forecast-day">TUE</span><span class="forecast-temp" id="fc-tue">26°</span></div>
          <div class="forecast-pill"><span class="forecast-day">WED</span><span class="forecast-temp" id="fc-wed">28°</span></div>
          <div class="forecast-pill active-today"><span class="forecast-day">THU</span><span class="forecast-temp" id="fc-thu">28°</span></div>
          <div class="forecast-pill"><span class="forecast-day">FRI</span><span class="forecast-temp" id="fc-fri">27°</span></div>
          <div class="forecast-pill"><span class="forecast-day">SAT</span><span class="forecast-temp" id="fc-sat">26°</span></div>
          <div class="forecast-pill"><span class="forecast-day">SUN</span><span class="forecast-temp" id="fc-sun">25°</span></div>
        </div>
      </div>

      <!-- Top Right Controls -->
      <div id="top-right-controls" class="top-services">
        <a href="https://mail.google.com" target="_blank" rel="noreferrer" class="nav-link">Gmail</a>
        <a href="https://www.google.com/imghp" target="_blank" rel="noreferrer" class="nav-link">Images</a>
        
        <!-- 9-dot Google Apps Grid -->
        <div class="popover-wrapper">
          <button type="button" id="apps-btn" class="glass-icon-btn apps-btn" title="Google apps">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="5" r="2.2"/><circle cx="12" cy="5" r="2.2"/><circle cx="19" cy="5" r="2.2"/>
              <circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/>
              <circle cx="5" cy="19" r="2.2"/><circle cx="12" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/>
            </svg>
          </button>
          <div id="apps-popover" class="glass-popover apps-popover" style="display:none">
            <div class="popover-header">Google Apps</div>
            <div class="apps-grid">
              <a href="https://www.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#4285F4">🔍</div><span>Search</span></a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#EA4335">▶</div><span>YouTube</span></a>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#34A853">📍</div><span>Maps</span></a>
              <a href="https://drive.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#FBBC05">📁</div><span>Drive</span></a>
              <a href="https://mail.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#EA4335">✉</div><span>Gmail</span></a>
              <a href="https://photos.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#4285F4">🖼</div><span>Photos</span></a>
              <a href="https://docs.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#4285F4">📄</div><span>Docs</span></a>
              <a href="https://sheets.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#34A853">📊</div><span>Sheets</span></a>
              <a href="https://meet.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#00897B">📹</div><span>Meet</span></a>
              <a href="https://calendar.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#1976D2">📅</div><span>Calendar</span></a>
              <a href="https://gemini.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#8E24AA">✦</div><span>Gemini</span></a>
              <a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background:#00ACC1">🌐</div><span>Store</span></a>
            </div>
          </div>
        </div>

        <!-- User Profile Avatar -->
        <div class="popover-wrapper">
          <button type="button" id="profile-btn" class="glass-icon-btn user-btn" title="Google Account">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <div id="profile-popover" class="glass-popover profile-popover" style="display:none">
            <div class="profile-card">
              <div class="profile-avatar">G</div>
              <div class="profile-info">
                <div class="profile-name">Google Account</div>
                <div class="profile-email">Chrome Profile</div>
              </div>
            </div>
            <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" class="profile-link">Manage your Google Account</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Center Google Area -->
    <section id="center-content" class="center-content">
      <!-- Google Brand -->
      <div id="google-brand" class="google-brand">
        <div class="google-logo">
          <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
        </div>
        <span class="brand-tag">Enhanced by WALLIX</span>
      </div>

      <!-- Frosted Search Bar -->
      <form id="search-form" action="https://www.google.com/search" method="get" class="search-form glass-surface">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input id="search-input" type="text" name="q" placeholder="Search Google or type a URL" autocomplete="off" autofocus>
        
        <div class="search-tools">
          <button type="button" id="mic-btn" class="tool-btn" title="Search by voice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <button type="button" id="lens-btn" class="tool-btn" title="Search by image">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <div id="ai-badge" class="ai-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            <span>AI</span>
          </div>
        </div>
      </form>

      <!-- Glass Shortcut Dock -->
      <nav id="shortcut-dock" class="shortcut-dock">
        <!-- Dynamically rendered by newtab.js from chrome.storage.local -->
      </nav>
    </section>

    <!-- Bottom Controls -->
    <footer class="bottom-bar">
      <div class="wallpaper-info" id="wallpaper-title">Ambient Glass</div>
      <button id="customize-btn" class="customize-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Customize WALLIX</span>
      </button>
    </footer>
  </main>

  <!-- Add / Edit Shortcut Modal -->
  <div id="shortcut-modal" class="modal-overlay" style="display:none">
    <div class="modal-box">
      <div class="modal-header">
        <h3 id="modal-title">Add shortcut</h3>
        <button type="button" id="modal-close-btn" class="modal-close">&times;</button>
      </div>
      <form id="shortcut-form">
        <div class="form-group">
          <label for="shortcut-name">Name</label>
          <input type="text" id="shortcut-name" placeholder="e.g. GitHub" required>
        </div>
        <div class="form-group">
          <label for="shortcut-url">URL</label>
          <input type="text" id="shortcut-url" placeholder="e.g. github.com" required>
        </div>
        <div id="modal-error" class="modal-error" style="display:none"></div>
        <div class="modal-actions">
          <button type="button" id="modal-cancel-btn" class="btn-cancel">Cancel</button>
          <button type="submit" id="modal-submit-btn" class="btn-save">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script src="newtab.js"></script>
</body>
</html>`;
  zip.file("newtab.html", newtabHtml);

  // 5. newtab.css
  const newtabCss = `:root {
  --accent-color: ${accent.color};
  --accent-glow: ${accent.glow};
  --accent-ring: ${accent.ring};
  --accent-tint: ${accent.bgTint};
  --weather-ambient: ${accent.weatherAmbient || 'rgba(6, 182, 212, 0.08)'};
  --weather-active-pill-bg: ${accent.weatherPillBg || 'rgba(6, 182, 212, 0.20)'};
  --weather-active-pill-border: ${accent.weatherPillBorder || 'rgba(34, 211, 238, 0.40)'};
  --weather-active-pill-text: ${accent.weatherPillText || '#cffafe'};
  --search-blur: ${settings.search.blur}px;
  --search-opacity: ${settings.search.opacity / 100};
  --search-border: ${settings.search.borderOpacity / 100};
  --shortcut-blur: ${settings.shortcuts.blur}px;
  --shortcut-opacity: ${settings.shortcuts.opacity / 100};
  --dock-icon-size: ${settings.shortcuts.iconSize ? `${settings.shortcuts.iconSize}px` : 'clamp(38px, 3vw, 48px)'};
  --dock-label-size: ${settings.shortcuts.labelSize ? `${settings.shortcuts.labelSize}px` : 'clamp(11px, 0.9vw, 13px)'};
  --dock-spacing: ${settings.shortcuts.spacingPx ? `${settings.shortcuts.spacingPx}px` : settings.shortcuts.spacing === 'tight' ? 'clamp(8px, 1vw, 12px)' : settings.shortcuts.spacing === 'loose' ? 'clamp(16px, 1.8vw, 24px)' : 'clamp(10px, 1.2vw, 18px)'};
  --dock-opacity: ${(settings.shortcuts.opacity ?? 30) / 100};
  --dock-blur: ${settings.shortcuts.blur ?? 16}px;
  --dock-border-opacity: ${(settings.shortcuts.borderOpacity ?? 22) / 100};
  --dock-hover-scale: ${settings.shortcuts.hoverScale ?? 1.08};
  --dock-hover-lift: ${settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4}px;
}

* { margin:0; padding:0; box-sizing:border-box; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { width: 100vw; height: 100vh; overflow: hidden; background: #000; color: #fff; user-select: none; }

.wallpaper-layer { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
.bg-media { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.5s ease; }
.vignette-overlay { position: absolute; inset: 0; pointer-events: none; transition: all 0.3s ease; }

.ui-layer { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 48px); }

/* WALLIX GLASS LIGHT SWEEP & WEATHER KEYFRAME ANIMATIONS */
@keyframes glassLightSweep {
  0% {
    transform: translateX(-160%) skewX(-20deg);
    opacity: 0;
  }
  15% {
    opacity: 0.12;
  }
  45% {
    transform: translateX(160%) skewX(-20deg);
    opacity: 0.06;
  }
  46%, 100% {
    transform: translateX(160%) skewX(-20deg);
    opacity: 0;
  }
}

.animate-glass-light-sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
  z-index: 1;
}

.animate-glass-light-sweep::after {
  content: '';
  position: absolute;
  top: -50%;
  bottom: -50%;
  left: -20%;
  width: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.01) 20%,
    rgba(255, 255, 255, 0.09) 50%,
    rgba(255, 255, 255, 0.01) 80%,
    transparent 100%
  );
  animation: glassLightSweep 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes sunGlowPulse {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.2));
    transform: rotate(0deg) scale(1);
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.35));
    transform: rotate(180deg) scale(1.02);
  }
}

@keyframes cloudGentleFloat {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(1px, -1px);
  }
}

.animate-sun-glow {
  animation: sunGlowPulse 24s linear infinite;
}

.animate-cloud-float {
  animation: cloudGentleFloat 6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-glass-light-sweep::after,
  .animate-sun-glow,
  .animate-cloud-float {
    animation: none !important;
  }
}

/* TOP NAVIGATION */
.top-nav { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: clamp(12px, 1.5vw, 24px); }

/* TOP WEATHER WIDGET - TRUE WALLIX FROSTED GLASS SURFACE */
.weather-widget {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: clamp(220px, 18vw, 290px);
  min-height: clamp(110px, 10vw, 150px);
  padding: clamp(10px, 1vw, 14px);
  border-radius: 20px;
  background: rgba(15, 23, 42, var(--search-opacity, 0.24));
  backdrop-filter: blur(var(--search-blur, 24px)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--search-blur, 24px)) saturate(160%);
  border: 1px solid rgba(255, 255, 255, var(--search-border, 0.20));
  box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.27), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.24);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  color: #ffffff;
}

.weather-widget:hover {
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35);
}

#weather-widget {
  transform: translate(${settings.layout?.weather?.x || 0}px, ${settings.layout?.weather?.y || 0}px) scale(${settings.layout?.weather?.scale || 1});
  transform-origin: top left;
  ${settings.layout?.weather?.zIndex ? `z-index: ${settings.layout.weather.zIndex};` : ''}
}

.weather-ambient-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(circle at top left, var(--weather-ambient, rgba(6, 182, 212, 0.08)), transparent 70%);
}

.weather-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.weather-date-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.weather-cal-icon {
  stroke: rgba(148, 163, 184, 0.85);
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.weather-date-text {
  font-size: clamp(10px, 0.85vw, 11px);
  font-weight: 400;
  color: rgba(203, 213, 225, 0.85);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.weather-top-sun-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.10);
  border: 1px solid rgba(251, 191, 36, 0.20);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(253, 224, 71, 0.85);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.15);
  flex-shrink: 0;
  transition: transform 0.3s;
}

.weather-widget:hover .weather-top-sun-badge {
  transform: scale(1.06);
}

.sun-micro-icon {
  width: 11px;
  height: 11px;
  color: rgba(253, 224, 71, 0.9);
}

.weather-mid {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 0;
}

.weather-temp-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-layered-icons {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
}

.weather-sun-primary {
  width: 24px;
  height: 24px;
  color: rgba(253, 224, 71, 0.9);
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.35));
}

.weather-cloud-secondary {
  width: 16px;
  height: 16px;
  color: rgba(226, 232, 240, 0.9);
  position: absolute;
  bottom: -2px;
  right: -4px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

.weather-temp-btn {
  display: flex;
  align-items: baseline;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s;
  font-family: inherit;
}

.weather-temp-btn:active {
  transform: scale(0.95);
}

.weather-temp-val {
  font-size: clamp(28px, 2.5vw, 34px);
  font-weight: 300;
  letter-spacing: -0.03em;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
  line-height: 1;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

.weather-unit-val {
  font-size: clamp(12px, 1vw, 13.5px);
  font-weight: 300;
  color: rgba(203, 213, 225, 0.8);
  margin-left: 2px;
  letter-spacing: -0.01em;
  transition: color 0.15s;
}

.weather-temp-btn:hover .weather-unit-val {
  color: var(--accent-color, #22d3ee);
}

.weather-telemetry-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.weather-loc-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: clamp(10px, 0.85vw, 10.5px);
  font-weight: 500;
  color: rgba(226, 232, 240, 0.9);
  letter-spacing: -0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.weather-map-pin {
  width: 10px;
  height: 10px;
  color: var(--accent-color, #22d3ee);
  flex-shrink: 0;
}

.weather-loc-name {
  max-width: 85px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weather-loc-dot {
  color: rgba(148, 163, 184, 0.8);
}

.weather-feels-sub {
  font-size: clamp(9px, 0.75vw, 9.5px);
  color: rgba(148, 163, 184, 0.9);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.weather-pills-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.weather-hi-pill, .weather-lo-pill {
  padding: 2px 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: clamp(9px, 0.75vw, 9.5px);
  font-weight: 500;
  color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: background 0.15s;
}

.weather-hi-pill:hover, .weather-lo-pill:hover {
  background: rgba(255, 255, 255, 0.12);
}

.hi-arrow {
  width: 8px;
  height: 8px;
  color: #fb7185;
  stroke-width: 2.5;
}

.lo-arrow {
  width: 8px;
  height: 8px;
  color: #38bdf8;
  stroke-width: 2.5;
}

.weather-bottom-forecast {
  position: relative;
  z-index: 10;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  text-align: center;
}

.forecast-pill {
  padding: 4px 1px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(203, 213, 225, 0.75);
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.forecast-pill:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.forecast-day {
  font-size: clamp(8.5px, 0.7vw, 9px);
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 1.1;
}

.forecast-temp {
  font-size: clamp(8px, 0.65vw, 8.5px);
  color: rgba(148, 163, 184, 0.8);
  font-weight: 400;
  line-height: 1.1;
  margin-top: 2px;
}

.forecast-pill.active-today {
  background: var(--weather-active-pill-bg, rgba(6, 182, 212, 0.20));
  border: 1px solid var(--weather-active-pill-border, rgba(34, 211, 238, 0.40));
  color: var(--weather-active-pill-text, #cffafe);
  box-shadow: 0 0 10px var(--accent-glow, rgba(6, 182, 212, 0.25));
}

.forecast-pill.active-today .forecast-day {
  font-weight: 700;
}

.forecast-pill.active-today .forecast-temp {
  font-weight: 800;
  color: inherit;
}

/* TOP SERVICES */
.top-services { display: flex; align-items: center; gap: clamp(8px, 0.8vw, 12px); margin-left: auto; }
#top-right-controls {
  transform: translate(${settings.layout?.topRight?.x || 0}px, ${settings.layout?.topRight?.y || 0}px) scale(${settings.layout?.topRight?.scale || 1});
  transform-origin: top right;
  ${settings.layout?.topRight?.zIndex ? `z-index: ${settings.layout.topRight.zIndex};` : ''}
}
.nav-link { color: #e2e8f0; text-decoration: none; padding: clamp(6px, 0.6vw, 9px) clamp(12px, 1.2vw, 18px); border-radius: 9999px; background: rgba(255, 255, 255, 0.09); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.2); transition: background 0.15s, transform 0.15s, color 0.15s; font-size: clamp(12.5px, 0.95vw, 14px); text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
.nav-link:hover { background: rgba(255, 255, 255, 0.18); color: #fff; transform: translateY(-1px); }

.glass-icon-btn { display: flex; align-items: center; justify-content: center; width: clamp(34px, 2.5vw, 42px); height: clamp(34px, 2.5vw, 42px); border-radius: 50%; background: rgba(255, 255, 255, 0.09); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.2); color: #cbd5e1; text-decoration: none; transition: transform 0.15s, background 0.15s, color 0.15s; }
.glass-icon-btn:hover { transform: scale(1.06); background: rgba(255, 255, 255, 0.18); color: #fff; }

.center-content { display: flex; flex-direction: column; align-items: center; margin: auto; width: 100%; max-width: clamp(520px, 60vw, 900px); gap: clamp(16px, 2vw, 28px); transition: margin 0.3s ease; }
.center-content.position-top { margin: clamp(16px, 3vh, 36px) auto auto auto; }

.google-brand { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 2px; }
.google-logo { font-size: clamp(48px, 4.5vw, 72px); font-weight: 600; letter-spacing: -2px; font-family: "Product Sans", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif; user-select: none; }
.g-blue { color: #4285f4; text-shadow: 0 2px 14px rgba(66, 133, 244, 0.5); } .g-red { color: #ea4335; text-shadow: 0 2px 14px rgba(234, 67, 53, 0.5); } .g-yellow { color: #fbbc05; text-shadow: 0 2px 14px rgba(251, 188, 5, 0.5); } .g-green { color: #34a853; text-shadow: 0 2px 14px rgba(52, 168, 83, 0.5); }
.brand-tag { font-size: clamp(10px, 0.8vw, 11.5px); font-family: monospace; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(226, 232, 240, 0.75); }

/* RESPONSIVE SEARCH BAR */
.search-form { display: flex; align-items: center; width: 100%; max-width: ${settings.search.customWidth ? `${settings.search.customWidth}px` : settings.search.size === 'compact' ? 'clamp(400px, 36vw, 540px)' : settings.search.size === 'spacious' ? 'clamp(480px, 48vw, 780px)' : 'clamp(420px, 40vw, 680px)'}; min-height: clamp(46px, 4vw, 56px); padding: ${settings.search.size === 'compact' ? 'clamp(8px, 0.9vw, 12px) clamp(14px, 1.4vw, 20px)' : settings.search.size === 'spacious' ? 'clamp(14px, 1.4vw, 18px) clamp(22px, 2.2vw, 32px)' : 'clamp(10px, 1.1vw, 15px) clamp(18px, 1.8vw, 26px)'}; gap: clamp(10px, 1.2vw, 16px); background: rgba(10, 16, 30, var(--search-opacity)); backdrop-filter: blur(var(--search-blur)) saturate(160%); -webkit-backdrop-filter: blur(var(--search-blur)) saturate(160%); border: 1px solid rgba(255, 255, 255, var(--search-border)); border-radius: 9999px; box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
#search-form {
  transform: translate(${settings.layout?.search?.x || 0}px, ${settings.layout?.search?.y || 0}px) scale(${settings.layout?.search?.scale || 1});
  transform-origin: center center;
  ${settings.layout?.search?.zIndex ? `z-index: ${settings.layout.search.zIndex};` : ''}
}
.search-form.size-compact { max-width: clamp(400px, 36vw, 540px); min-height: clamp(42px, 3.5vw, 48px); }
.search-form.size-spacious { max-width: clamp(480px, 48vw, 780px); min-height: clamp(52px, 4.5vw, 62px); }
.search-form.radius-rounded { border-radius: 20px; }
.search-form.radius-minimal { border-radius: 14px; }
.search-form.glow-active { box-shadow: 0 10px 35px -5px rgba(0,0,0,0.5), 0 0 25px var(--accent-glow); }
.search-form:focus-within { background: rgba(12, 18, 34, 0.62); border-color: var(--accent-color); box-shadow: 0 12px 38px -4px rgba(0,0,0,0.6), 0 0 24px var(--accent-glow), inset 0 1px 1px 0 rgba(255,255,255,0.2); outline: none; transform: translateY(-1px); }

.search-icon { stroke: rgba(255, 255, 255, 0.75); flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6)); width: clamp(17px, 1.4vw, 21px); height: clamp(17px, 1.4vw, 21px); }
.search-form input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: clamp(14px, 1.15vw, 16.5px); text-shadow: 0 1px 2px rgba(0,0,0,0.7); }
.search-form input::placeholder { color: rgba(226, 232, 240, 0.75); }

.search-tools { display: flex; align-items: center; gap: clamp(8px, 0.8vw, 12px); flex-shrink: 0; }
.tool-btn { background: transparent; border: none; outline: none; color: #cbd5e1; padding: clamp(5px, 0.5vw, 8px); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s, background 0.15s; }
.tool-btn:hover { color: #fff; background: rgba(255,255,255,0.15); }
.tool-btn svg { width: clamp(15px, 1.2vw, 18px); height: clamp(15px, 1.2vw, 18px); }

.ai-badge { display: flex; align-items: center; gap: 5px; padding: clamp(3px, 0.35vw, 5px) clamp(8px, 0.8vw, 12px); border-radius: 9999px; background: var(--accent-tint); border: 1px solid var(--accent-color); color: var(--accent-color); font-size: clamp(10.5px, 0.85vw, 12px); font-family: monospace; font-weight: 700; cursor: pointer; box-shadow: 0 0 14px var(--accent-glow); transition: all 0.15s; }
.ai-badge:hover { transform: scale(1.05); box-shadow: 0 0 18px var(--accent-glow); }

/* RESPONSIVE SHORTCUTS DOCK */
.shortcut-dock { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--dock-spacing, clamp(10px, 1.2vw, 18px)); max-width: clamp(520px, 60vw, 900px); padding: clamp(12px, 1.5vw, 20px) 16px 8px 16px; transition: gap 0.2s ease; overflow: visible; }
#shortcut-dock {
  transform: translate(${settings.layout?.dock?.x || 0}px, ${settings.layout?.dock?.y || 0}px) scale(${settings.layout?.dock?.scale || 1});
  transform-origin: center center;
  ${settings.layout?.dock?.zIndex ? `z-index: ${settings.layout.dock.zIndex};` : ''}
}
.shortcut-dock.spacing-tight { gap: clamp(8px, 1vw, 12px); }
.shortcut-dock.spacing-loose { gap: clamp(16px, 1.8vw, 24px); }

.shortcut-item { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 0.6vw, 10px); text-decoration: none; color: rgba(226, 232, 240, 0.85); font-size: var(--dock-label-size, clamp(11px, 0.9vw, 13px)); font-weight: 500; transition: transform 0.18s cubic-bezier(0.2, 0, 0.2, 1), color 0.18s ease; cursor: pointer; position: relative; text-shadow: 0 1px 2px rgba(0,0,0,0.85); overflow: visible; z-index: 1; will-change: transform; }
@media (hover: hover) and (pointer: fine) {
  .shortcut-item:hover, .shortcut-item.scale-hover:hover { transform: translateY(calc(var(--dock-hover-lift, 4px) * -1)) scale(var(--dock-hover-scale, 1.08)); color: #fff; z-index: 20; }
  .shortcut-item:hover .shortcut-glass-card, .shortcut-item.scale-hover:hover .shortcut-glass-card { border-color: rgba(255, 255, 255, 0.45); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 18px var(--accent-glow); }
}

.shortcut-glass-card { width: var(--dock-icon-size, clamp(38px, 3vw, 48px)); height: var(--dock-icon-size, clamp(38px, 3vw, 48px)); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, var(--dock-opacity, 0.3)); backdrop-filter: blur(var(--dock-blur, 16px)) saturate(160%); -webkit-backdrop-filter: blur(var(--dock-blur, 16px)) saturate(160%); border: 1px solid rgba(255, 255, 255, var(--dock-border-opacity, 0.22)); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.38); transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; overflow: visible; }
.shortcut-glass-card.style-pill { border-radius: 9999px; }

.shortcut-inner-icon { width: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.72); height: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.72); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.28); box-shadow: 0 2px 8px rgba(0,0,0,0.35); overflow: hidden; }
.shortcut-label { font-size: var(--dock-label-size, clamp(11px, 0.9vw, 13px)); font-weight: 500; max-width: clamp(68px, 5vw, 96px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color 0.15s; color: rgba(226, 232, 240, 0.85); pointer-events: none; }
.shortcut-item:hover .shortcut-label { color: #fff; }

.bottom-bar { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: rgba(226, 232, 240, 0.8); }
.wallpaper-info { opacity: 0.7; font-family: monospace; }
.customize-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background: rgba(255, 255, 255, 0.09); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.2); color: #cbd5e1; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
.customize-btn:hover { background: rgba(255, 255, 255, 0.18); color: #fff; border-color: var(--accent-color); transform: translateY(-1px); }

.popover-wrapper { position: relative; }
.glass-popover { position: absolute; right: 0; top: calc(100% + 8px); z-index: 100; border-radius: 18px; background: rgba(10, 14, 26, 0.90); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.22); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7); animation: fadeIn 0.15s ease-out; }
.apps-popover { width: 290px; padding: 16px; }
.popover-header { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.apps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.app-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 4px; border-radius: 12px; text-decoration: none; color: #cbd5e1; font-size: 11.5px; font-weight: 500; transition: all 0.15s; }
.app-item:hover { background: rgba(255, 255, 255, 0.14); color: #fff; transform: translateY(-2px); }
.app-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); }

.profile-popover { width: 260px; padding: 16px; }
.profile-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.profile-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; color: #fff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); }
.profile-info { overflow: hidden; }
.profile-name { font-size: 13px; font-weight: 600; color: #fff; }
.profile-email { font-size: 11.5px; color: #94a3b8; }
.profile-link { display: block; width: 100%; text-align: center; padding: 9px 12px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #fff; text-decoration: none; font-size: 12px; font-weight: 500; transition: background 0.2s; }
.profile-link:hover { background: rgba(255,255,255,0.18); }

.shortcut-add-card { border: 1px solid rgba(255,255,255,0.24) !important; color: #cbd5e1; }
.shortcut-add-inner { width: calc(var(--dock-icon-size, 48px) * 0.72); height: calc(var(--dock-icon-size, 48px) * 0.72); border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.15s; }
.shortcut-item:hover .shortcut-add-card { border-color: rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.15); }
.shortcut-item:hover .shortcut-add-inner { background: rgba(255,255,255,0.22); color: #fff; }
.shortcut-menu-btn { display: none !important; }
.shortcut-dropdown { position: absolute; top: 24px; right: -8px; z-index: 50; background: rgba(10,14,26,0.92); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 4px; box-shadow: 0 12px 30px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 2px; min-width: 105px; }
.menu-action { background: none; border: none; padding: 6px 10px; border-radius: 8px; color: #cbd5e1; font-size: 11.5px; cursor: pointer; text-align: left; transition: background 0.15s, color 0.15s; }
.menu-action:hover { background: rgba(255,255,255,0.15); color: #fff; }
.menu-action.delete-action:hover { background: rgba(239,68,68,0.2); color: #f87171; }

.modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.65); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-box { width: 100%; max-width: 360px; background: rgba(14, 18, 29, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.7); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { font-size: 14px; font-weight: 700; color: #fff; }
.modal-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; line-height: 1; }
.modal-close:hover { color: #fff; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
.form-group input { width: 100%; padding: 8px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none; }
.form-group input:focus { border-color: var(--accent-color); }
.modal-error { color: #f87171; font-size: 11px; margin-bottom: 12px; padding: 6px 10px; background: rgba(239,68,68,0.15); border-radius: 6px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.btn-cancel { padding: 6px 14px; border-radius: 8px; background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; font-size: 12px; cursor: pointer; }
.btn-cancel:hover { background: rgba(255,255,255,0.18); color: #fff; }
.btn-save { padding: 6px 16px; border-radius: 8px; background: var(--accent-color); border: none; color: #000; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-save:hover { opacity: 0.9; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
`;
  zip.file("newtab.css", newtabCss);

  // 6. newtab.js (Dynamic runtime engine: loads from chrome.storage.local & live reacts to changes)
  const safeDefaultWallpaperUrl = resolveSafeWallpaperUrl(settings.wallpaper.url);
  const newtabJs = `// WALLIX Production Runtime Engine for Chrome New Tab
// Fully dynamic: pulls configuration from chrome.storage.local and listens to live updates

const DEFAULT_CONFIG = ${JSON.stringify({
  version: SCHEMA_VERSION,
  wallpaper: {
    ...settings.wallpaper,
    url: safeDefaultWallpaperUrl,
  },
  search: settings.search,
  shortcuts: settings.shortcuts,
  effects: settings.effects,
  theme: settings.theme,
  layout: settings.layout || DEFAULT_LAYOUT_SETTINGS,
  shortcutsList: shortcuts
}, null, 2)};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function safeUrl(url) {
  const s = String(url || '').trim();
  if (/^https?:\\/\\//i.test(s)) return s;
  return 'https://' + s;
}

// Apply full design parameters to DOM
function applyDesign(rawConfig) {
  if (!rawConfig) return;

  const config = typeof rawConfig === 'object' ? rawConfig : DEFAULT_CONFIG;
  const root = document.documentElement;
  const effects = config.effects || DEFAULT_CONFIG.effects;
  const search = config.search || DEFAULT_CONFIG.search;
  const shortcutsConfig = config.shortcuts || DEFAULT_CONFIG.shortcuts;
  const wallpaper = config.wallpaper || DEFAULT_CONFIG.wallpaper;
  const shortcuts = Array.isArray(config.shortcutsList) ? config.shortcutsList : DEFAULT_CONFIG.shortcutsList;

  // 1. Accent color variables
  const accentKey = effects.themeAccent || 'cyan';
  let accentColor = '#06b6d4';
  let accentGlow = 'rgba(6, 182, 212, 0.45)';
  let accentRing = 'rgba(6, 182, 212, 0.6)';
  let bgTint = 'rgba(6, 35, 52, 0.4)';
  let weatherAmbient = 'rgba(6, 182, 212, 0.08)';
  let weatherPillBg = 'rgba(6, 182, 212, 0.20)';
  let weatherPillBorder = 'rgba(34, 211, 238, 0.40)';
  let weatherPillText = '#cffafe';

  if (accentKey === 'purple') {
    accentColor = '#c084fc';
    accentGlow = 'rgba(192, 132, 252, 0.45)';
    accentRing = 'rgba(192, 132, 252, 0.6)';
    bgTint = 'rgba(28, 18, 48, 0.4)';
    weatherAmbient = 'rgba(192, 132, 252, 0.08)';
    weatherPillBg = 'rgba(192, 132, 252, 0.20)';
    weatherPillBorder = 'rgba(192, 132, 252, 0.40)';
    weatherPillText = '#f3e8ff';
  } else if (accentKey === 'blue') {
    accentColor = '#60a5fa';
    accentGlow = 'rgba(96, 165, 250, 0.45)';
    accentRing = 'rgba(96, 165, 250, 0.6)';
    bgTint = 'rgba(15, 28, 56, 0.4)';
    weatherAmbient = 'rgba(96, 165, 250, 0.08)';
    weatherPillBg = 'rgba(96, 165, 250, 0.20)';
    weatherPillBorder = 'rgba(96, 165, 250, 0.40)';
    weatherPillText = '#dbeafe';
  } else if (accentKey === 'emerald') {
    accentColor = '#34d399';
    accentGlow = 'rgba(52, 211, 153, 0.45)';
    accentRing = 'rgba(52, 211, 153, 0.6)';
    bgTint = 'rgba(6, 40, 32, 0.4)';
    weatherAmbient = 'rgba(52, 211, 153, 0.08)';
    weatherPillBg = 'rgba(52, 211, 153, 0.20)';
    weatherPillBorder = 'rgba(52, 211, 153, 0.40)';
    weatherPillText = '#d1fae5';
  } else if (accentKey === 'amber') {
    accentColor = '#fbbf24';
    accentGlow = 'rgba(251, 191, 36, 0.45)';
    accentRing = 'rgba(251, 191, 36, 0.6)';
    bgTint = 'rgba(45, 28, 10, 0.4)';
    weatherAmbient = 'rgba(251, 191, 36, 0.08)';
    weatherPillBg = 'rgba(251, 191, 36, 0.20)';
    weatherPillBorder = 'rgba(251, 191, 36, 0.40)';
    weatherPillText = '#fef3c7';
  } else if (accentKey === 'rose') {
    accentColor = '#f43f5e';
    accentGlow = 'rgba(244, 63, 94, 0.45)';
    accentRing = 'rgba(244, 63, 94, 0.6)';
    bgTint = 'rgba(48, 15, 22, 0.4)';
    weatherAmbient = 'rgba(244, 63, 94, 0.08)';
    weatherPillBg = 'rgba(244, 63, 94, 0.20)';
    weatherPillBorder = 'rgba(244, 63, 94, 0.40)';
    weatherPillText = '#ffe4e6';
  }

  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--accent-glow', accentGlow);
  root.style.setProperty('--accent-ring', accentRing);
  root.style.setProperty('--accent-tint', bgTint);
  root.style.setProperty('--weather-ambient', weatherAmbient);
  root.style.setProperty('--weather-active-pill-bg', weatherPillBg);
  root.style.setProperty('--weather-active-pill-border', weatherPillBorder);
  root.style.setProperty('--weather-active-pill-text', weatherPillText);

  // Search glass variables
  root.style.setProperty('--search-blur', (search.blur ?? 24) + 'px');
  root.style.setProperty('--search-opacity', ((search.opacity ?? 38) / 100));
  root.style.setProperty('--search-border', ((search.borderOpacity ?? 22) / 100));

  // Shortcuts variables
  const iconSize = shortcutsConfig.iconSize ?? 48;
  const labelSize = shortcutsConfig.labelSize ?? 11.5;
  const spacingPx = shortcutsConfig.spacingPx ?? (shortcutsConfig.spacing === 'tight' ? 12 : shortcutsConfig.spacing === 'loose' ? 24 : 18);
  const opacity = (shortcutsConfig.opacity ?? 30) / 100;
  const blur = shortcutsConfig.blur ?? 16;
  const borderOpacity = (shortcutsConfig.borderOpacity ?? 22) / 100;
  const hoverScale = shortcutsConfig.hoverScale ?? 1.08;
  const hoverLift = shortcutsConfig.hoverLift ?? shortcutsConfig.liftDistance ?? 4;

  root.style.setProperty('--shortcut-blur', blur + 'px');
  root.style.setProperty('--shortcut-opacity', opacity);
  root.style.setProperty('--dock-icon-size', iconSize + 'px');
  root.style.setProperty('--dock-label-size', labelSize + 'px');
  root.style.setProperty('--dock-spacing', spacingPx + 'px');
  root.style.setProperty('--dock-opacity', opacity);
  root.style.setProperty('--dock-blur', blur + 'px');
  root.style.setProperty('--dock-border-opacity', borderOpacity);
  root.style.setProperty('--dock-hover-scale', hoverScale);
  root.style.setProperty('--dock-hover-lift', hoverLift + 'px');

  // 2. Wallpaper media
  const videoEl = document.getElementById('bg-video');
  const imgEl = document.getElementById('bg-img');
  const wallpaperTitleEl = document.getElementById('wallpaper-title');

  if (wallpaperTitleEl) {
    wallpaperTitleEl.textContent = wallpaper.title || 'WALLIX Ambient';
  }

  if (wallpaper.type === 'video' && wallpaper.videoUrl) {
    if (imgEl) imgEl.style.display = 'none';
    if (videoEl) {
      videoEl.style.display = 'block';
      if (videoEl.src !== wallpaper.videoUrl) {
        videoEl.src = safeUrl(wallpaper.videoUrl);
      }
      videoEl.play().catch(() => {});
    }
  } else {
    if (videoEl) videoEl.style.display = 'none';
    if (imgEl) {
      imgEl.style.display = 'block';
      let safeImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';
      if (wallpaper && typeof wallpaper.url === 'string' && wallpaper.url.trim()) {
        const u = wallpaper.url.trim();
        if (/^(https?:\\/\\/|data:image\\/|blob:)/i.test(u)) {
          safeImg = u;
        }
      }
      imgEl.onerror = function() {
        if (!this.dataset.errored) {
          this.dataset.errored = '1';
          this.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';
        }
      };
      if (imgEl.src !== safeImg) {
        imgEl.src = safeImg;
      }
    }
  }

  // 3. Vignette & Backdrop Dim
  const vignetteOverlay = document.getElementById('vignette-overlay');
  if (vignetteOverlay) {
    const dim = (effects.backdropDim ?? 25) / 100;
    const vignette = effects.vignette ?? 40;
    vignetteOverlay.style.backgroundColor = \`rgba(0, 0, 0, \${dim})\`;
    vignetteOverlay.style.boxShadow = \`inset 0 0 \${vignette * 2}px rgba(0, 0, 0, \${vignette / 100})\`;
  }

  // 4. Search Bar styling & positioning
  const centerContent = document.getElementById('center-content');
  if (centerContent) {
    if (search.position === 'top') {
      centerContent.classList.add('position-top');
    } else {
      centerContent.classList.remove('position-top');
    }
  }

  const googleBrand = document.getElementById('google-brand');
  if (googleBrand) {
    googleBrand.style.display = search.showLogo === false ? 'none' : 'flex';
  }

  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    // Shape
    searchForm.classList.remove('radius-rounded', 'radius-minimal');
    if (search.style === 'rounded') searchForm.classList.add('radius-rounded');
    else if (search.style === 'minimal') searchForm.classList.add('radius-minimal');

    // Size
    searchForm.classList.remove('size-compact', 'size-spacious');
    if (search.size === 'compact') searchForm.classList.add('size-compact');
    else if (search.size === 'spacious') searchForm.classList.add('size-spacious');

    // Glow
    if (search.glow) searchForm.classList.add('glow-active');
    else searchForm.classList.remove('glow-active');

    // Engine action
    if (search.engine === 'duckduckgo') {
      searchForm.action = 'https://duckduckgo.com/';
    } else if (search.engine === 'bing') {
      searchForm.action = 'https://www.bing.com/search';
    } else {
      searchForm.action = 'https://www.google.com/search';
    }
  }

  // 4b. Canvas Positioning Engine for Search Form
  const layoutConfig = config.layout || DEFAULT_CONFIG.layout || {};
  if (searchForm && layoutConfig.search) {
    const sx = layoutConfig.search.x || 0;
    const sy = layoutConfig.search.y || 0;
    const sScale = layoutConfig.search.scale || 1;
    searchForm.style.transform = 'translate(' + sx + 'px, ' + sy + 'px) scale(' + sScale + ')';
    searchForm.style.transformOrigin = 'center center';
    if (layoutConfig.search.width) {
      searchForm.style.maxWidth = layoutConfig.search.width + 'px';
    }
    if (layoutConfig.search.zIndex) {
      searchForm.style.zIndex = layoutConfig.search.zIndex;
    }
  }

  // AI Badge
  const aiBadge = document.getElementById('ai-badge');
  if (aiBadge) {
    aiBadge.style.display = search.showAiMode === false ? 'none' : 'flex';
    aiBadge.onclick = (e) => {
      e.preventDefault();
      const input = document.getElementById('search-input');
      const val = input && input.value ? encodeURIComponent(input.value.trim()) : '';
      if (val) {
        window.open('https://www.google.com/search?q=' + val + '+%28ai%29', '_blank');
      } else {
        window.open('https://gemini.google.com', '_blank');
      }
    };
  }

  // 5. Shortcut Dock rendering (Strictly Escaped with + Add Shortcut Button & Context Actions)
  const dock = document.getElementById('shortcut-dock');
  if (dock) {
    dock.className = 'shortcut-dock';
    if (shortcutsConfig.spacing === 'tight') dock.classList.add('spacing-tight');
    else if (shortcutsConfig.spacing === 'loose') dock.classList.add('spacing-loose');

    // Canvas Positioning Engine for Shortcut Dock
    if (layoutConfig.dock) {
      const dx = layoutConfig.dock.x || 0;
      const dy = layoutConfig.dock.y || 0;
      const dScale = layoutConfig.dock.scale || 1;
      dock.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + dScale + ')';
      dock.style.transformOrigin = 'center center';
      if (layoutConfig.dock.zIndex) {
        dock.style.zIndex = layoutConfig.dock.zIndex;
      }
    }

    const cardClass = shortcutsConfig.style === 'glass-pill' ? 'shortcut-glass-card style-pill' : 'shortcut-glass-card';
    const scaleClass = shortcutsConfig.scaleOnHover !== false ? 'shortcut-item scale-hover' : 'shortcut-item';
    const showLabels = shortcutsConfig.showLabels !== false;

    let html = shortcuts.map((s, idx) => {
      const cleanTitle = escapeHtml(s.title || 'Link');
      const cleanUrl = safeUrl(s.url);
      let domain = 'google.com';
      try {
        const parsed = new URL(cleanUrl);
        domain = parsed.hostname;
      } catch {
        domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0] || 'google.com';
      }
      const faviconUrl = \`https://www.google.com/s2/favicons?domain=\${domain}&sz=128\`;
      const id = escapeHtml(s.id || 'sc-' + idx);

      return \`
        <div class="\${scaleClass}" data-id="\${id}" \${showLabels ? '' : 'title="' + cleanTitle + '"'}>
          <a href="\${cleanUrl}" target="_self" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center; gap:6px;">
            <div class="\${cardClass}">
              <div class="shortcut-inner-icon" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="\${faviconUrl}" alt="\${cleanTitle}" style="width: 60%; height: 60%; object-fit: contain;" onerror="this.style.display='none';" />
              </div>
            </div>
            \${showLabels ? \`<span class="shortcut-label">\${cleanTitle}</span>\` : ''}
          </a>
        </div>
      \`;
    }).join('');

    // Append dedicated + Add Shortcut Button
    html += \`
      <div class="shortcut-item scale-hover" id="add-shortcut-btn" title="Add shortcut" style="cursor:pointer;">
        <div class="\${cardClass} shortcut-add-card">
          <span style="font-size:22px; font-weight:300; line-height:1;">+</span>
        </div>
        \${showLabels ? '<span class="shortcut-label">Add shortcut</span>' : ''}
      </div>
    \`;

    dock.innerHTML = html;

    // Attach listener for Add button
    document.getElementById('add-shortcut-btn')?.addEventListener('click', () => {
      openShortcutModal('add');
    });

    // Attach contextmenu (right-click) listeners for clean Edit/Remove without hover clutter
    document.querySelectorAll('.shortcut-item[data-id]').forEach(item => {
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = item.getAttribute('data-id');
        const targetShortcut = shortcuts.find(s => s.id === id);
        if (!targetShortcut) return;

        if (confirm('Edit shortcut "' + targetShortcut.title + '"? Click OK to Edit, or Cancel to Delete.')) {
          openShortcutModal('edit', targetShortcut);
        } else if (confirm('Remove shortcut "' + targetShortcut.title + '"?')) {
          deleteShortcut(id);
        }
      });
    });
  }

  // 6. Dynamic GPU Layout Transforms (Search, Dock, Weather, TopRight)
  const layout = config.layout || {};
  const searchEl = document.getElementById('search-form');
  if (searchEl) {
    const sOff = layout.search || { x: 0, y: 0 };
    const scaleStr = sOff.scale && sOff.scale !== 1 ? ' scale(' + sOff.scale + ')' : '';
    searchEl.style.transform = \`translate(\${sOff.x || 0}px, \${sOff.y || 0}px)\` + scaleStr;
    searchEl.style.transformOrigin = 'center center';
    searchEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    if (sOff.zIndex) searchEl.style.zIndex = sOff.zIndex;
    if (sOff.width) {
      searchEl.style.maxWidth = sOff.width + 'px';
      const searchSurface = searchEl.querySelector('.glass-surface, .search-surface');
      if (searchSurface) searchSurface.style.maxWidth = sOff.width + 'px';
    }
  }
  const dockEl = document.getElementById('shortcut-dock');
  if (dockEl) {
    const dOff = layout.dock || { x: 0, y: 0 };
    const scaleStr = dOff.scale && dOff.scale !== 1 ? ' scale(' + dOff.scale + ')' : '';
    dockEl.style.transform = \`translate(\${dOff.x || 0}px, \${dOff.y || 0}px)\` + scaleStr;
    dockEl.style.transformOrigin = 'center center';
    dockEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    if (dOff.zIndex) dockEl.style.zIndex = dOff.zIndex;
  }
  const weatherEl = document.getElementById('weather-widget');
  if (weatherEl) {
    const wOff = layout.weather || { x: 0, y: 0 };
    const scaleStr = wOff.scale && wOff.scale !== 1 ? ' scale(' + wOff.scale + ')' : '';
    weatherEl.style.transform = \`translate(\${wOff.x || 0}px, \${wOff.y || 0}px)\` + scaleStr;
    weatherEl.style.transformOrigin = 'center center';
    weatherEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    if (wOff.zIndex) weatherEl.style.zIndex = wOff.zIndex;
  }
  const topRightEl = document.getElementById('top-right-controls');
  if (topRightEl) {
    const trOff = layout.topRight || { x: 0, y: 0 };
    const scaleStr = trOff.scale && trOff.scale !== 1 ? ' scale(' + trOff.scale + ')' : '';
    topRightEl.style.transform = \`translate(\${trOff.x || 0}px, \${trOff.y || 0}px)\` + scaleStr;
    topRightEl.style.transformOrigin = 'center center';
    topRightEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    if (trOff.zIndex) topRightEl.style.zIndex = trOff.zIndex;
  }
}

let activeConfig = DEFAULT_CONFIG;
let modalMode = 'add';
let editingId = null;

function openShortcutModal(mode, shortcut) {
  modalMode = mode;
  editingId = shortcut ? shortcut.id : null;
  const modal = document.getElementById('shortcut-modal');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('shortcut-name');
  const urlInput = document.getElementById('shortcut-url');
  const err = document.getElementById('modal-error');

  if (err) err.style.display = 'none';
  if (title) title.textContent = mode === 'add' ? 'Add shortcut' : 'Edit shortcut';
  if (nameInput) nameInput.value = shortcut ? shortcut.title : '';
  if (urlInput) urlInput.value = shortcut ? shortcut.url : '';
  if (modal) modal.style.display = 'flex';
  nameInput?.focus();
}

function closeShortcutModal() {
  const modal = document.getElementById('shortcut-modal');
  if (modal) modal.style.display = 'none';
}

function saveConfigToStorage(newCfg) {
  activeConfig = newCfg;
  applyDesign(activeConfig);

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({
      wallix_chrome_newtab_settings: newCfg,
      wallix_last_synced: new Date().toISOString()
    });
  } else {
    try {
      localStorage.setItem('wallix_chrome_newtab_settings', JSON.stringify(newCfg));
    } catch {}
  }
}

function deleteShortcut(id) {
  const list = (activeConfig.shortcutsList || []).filter(s => s.id !== id);
  const updated = Object.assign({}, activeConfig, { shortcutsList: list });
  saveConfigToStorage(updated);
}

// Initial storage read & subscription
function init() {
  // Modal listeners
  document.getElementById('modal-close-btn')?.addEventListener('click', closeShortcutModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeShortcutModal);
  document.getElementById('shortcut-modal')?.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'shortcut-modal') closeShortcutModal();
  });

  document.getElementById('shortcut-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('shortcut-name');
    const urlInput = document.getElementById('shortcut-url');
    const err = document.getElementById('modal-error');

    const cleanName = (nameInput?.value || '').trim();
    let cleanUrl = (urlInput?.value || '').trim();

    if (!cleanName || !cleanUrl) {
      if (err) { err.textContent = 'Please fill out all fields.'; err.style.display = 'block'; }
      return;
    }

    if (/^(javascript:|data:|file:)/i.test(cleanUrl)) {
      if (err) { err.textContent = 'Invalid protocol. Only http/https allowed.'; err.style.display = 'block'; }
      return;
    }

    if (!/^https?:\\/\\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let list = Array.isArray(activeConfig.shortcutsList) ? activeConfig.shortcutsList.slice() : [];

    if (modalMode === 'add') {
      list.push({
        id: 'sc-' + Date.now(),
        title: cleanName,
        url: cleanUrl,
        initials: cleanName.slice(0, 2).toUpperCase(),
        gradient: 'from-purple-500 to-indigo-600',
        glowColor: 'rgba(168, 85, 247, 0.5)',
        isDefault: false
      });
    } else if (modalMode === 'edit' && editingId) {
      list = list.map(s => {
        if (s.id === editingId) {
          return Object.assign({}, s, {
            title: cleanName,
            url: cleanUrl,
            initials: cleanName.slice(0, 2).toUpperCase()
          });
        }
        return s;
      });
    }

    const updated = Object.assign({}, activeConfig, { shortcutsList: list });
    saveConfigToStorage(updated);
    closeShortcutModal();
  });

  // Top Nav Popovers Toggle
  const appsBtn = document.getElementById('apps-btn');
  const appsPopover = document.getElementById('apps-popover');
  const profileBtn = document.getElementById('profile-btn');
  const profilePopover = document.getElementById('profile-popover');

  if (appsBtn && appsPopover) {
    appsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = appsPopover.style.display === 'block';
      appsPopover.style.display = isOpen ? 'none' : 'block';
      if (profilePopover) profilePopover.style.display = 'none';
    });
  }

  if (profileBtn && profilePopover) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profilePopover.style.display === 'block';
      profilePopover.style.display = isOpen ? 'none' : 'block';
      if (appsPopover) appsPopover.style.display = 'none';
    });
  }

  document.addEventListener('click', (e) => {
    if (appsPopover && !appsPopover.contains(e.target) && e.target !== appsBtn) {
      appsPopover.style.display = 'none';
    }
    if (profilePopover && !profilePopover.contains(e.target) && e.target !== profileBtn) {
      profilePopover.style.display = 'none';
    }
  });

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get("wallix_chrome_newtab_settings", (data) => {
      if (data && data.wallix_chrome_newtab_settings) {
        activeConfig = data.wallix_chrome_newtab_settings;
        applyDesign(activeConfig);
      } else {
        activeConfig = DEFAULT_CONFIG;
        applyDesign(DEFAULT_CONFIG);
      }
    });

    // Listen for real-time changes saved from the WALLIX Web Editor!
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.wallix_chrome_newtab_settings) {
        console.log("[WALLIX New Tab] Real-time settings update applied!");
        activeConfig = changes.wallix_chrome_newtab_settings.newValue;
        applyDesign(activeConfig);
      }
    });
  } else {
    // Fallback for standalone preview
    try {
      const local = localStorage.getItem("wallix_chrome_newtab_settings");
      activeConfig = local ? JSON.parse(local) : DEFAULT_CONFIG;
      applyDesign(activeConfig);
    } catch {
      activeConfig = DEFAULT_CONFIG;
      applyDesign(DEFAULT_CONFIG);
    }
  }

  // Voice Search handler
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const input = document.getElementById('search-input');
          if (input) {
            input.value = transcript;
            document.getElementById('search-form')?.submit();
          }
        };
        recognition.start();
      } else {
        window.open('https://www.google.com/search?q=&source=voice', '_blank');
      }
    });
  }

  // Lens / Image Search handler
  const lensBtn = document.getElementById('lens-btn');
  if (lensBtn) {
    lensBtn.addEventListener('click', () => {
      window.open("https://lens.google.com/", "_blank");
    });
  }

  // Weather Date and Unit Toggle handler
  let isCelsius = false;
  const tempToggleBtn = document.getElementById('weather-temp-toggle');
  const tempDegEl = document.getElementById('temp-deg');
  const tempUnitEl = document.getElementById('temp-unit');
  const feelsLikeEl = document.getElementById('feels-like-val');
  const hiTempEl = document.getElementById('hi-temp');
  const loTempEl = document.getElementById('lo-temp');
  const liveDateEl = document.getElementById('live-date-text');

  if (liveDateEl) {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    liveDateEl.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
  }

  // Set today's forecast pill active
  const dayIdx = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const dayPillIds = ['fc-sun', 'fc-mon', 'fc-tue', 'fc-wed', 'fc-thu', 'fc-fri', 'fc-sat'];
  const todayId = dayPillIds[dayIdx];
  dayPillIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === todayId) {
        el.classList.add('active-today');
      } else {
        el.classList.remove('active-today');
      }
    }
  });

  const fcTempsF = [69, 68, 70, 71, 72, 74, 73];
  const fcTempsC = [21, 20, 21, 22, 22, 23, 23];

  function updateTempDisplay() {
    if (tempDegEl) tempDegEl.textContent = isCelsius ? '22' : '72';
    if (tempUnitEl) tempUnitEl.textContent = isCelsius ? '°C' : '°F';
    if (feelsLikeEl) feelsLikeEl.textContent = isCelsius ? '21°' : '70°';
    if (hiTempEl) hiTempEl.textContent = isCelsius ? '23°' : '74°';
    if (loTempEl) loTempEl.textContent = isCelsius ? '14°' : '58°';

    dayPillIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        const valSpan = el.querySelector('.fc-val');
        if (valSpan) {
          valSpan.textContent = (isCelsius ? fcTempsC[i] : fcTempsF[i]) + '°';
        }
      }
    });
  }

  if (tempToggleBtn) {
    tempToggleBtn.addEventListener('click', () => {
      isCelsius = !isCelsius;
      updateTempDisplay();
    });
  }

  // Customize button handler (opens Side Panel or launches full editor)
  const customizeBtn = document.getElementById('customize-btn');
  if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
      console.log("[WALLIX] Customize button clicked");
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'WALLIX_OPEN_CUSTOMIZE_PANEL' }, (res) => {
          if (chrome.runtime.lastError) {
            console.warn('[WALLIX] Runtime message error:', chrome.runtime.lastError);
            window.open(window.location.origin, '_blank');
          } else {
            console.log('[WALLIX] Side panel request response:', res);
          }
        });
      } else {
        window.open(window.location.origin, '_blank');
      }
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
`;
  zip.file("newtab.js", newtabJs);

  // 7. sidepanel.html (Companion side panel)
  const sidepanelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WALLIX Customizer Side Panel</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { padding: 18px; background: #0B0C10; color: #fff; min-height: 100vh; }
    h2 { font-size: 16px; font-weight: 700; color: ${accent.color}; margin-bottom: 6px; }
    p { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
    .status-card { padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 16px; }
    .status-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #38bdf8; margin-bottom: 4px; }
    .status-desc { font-size: 12px; color: #cbd5e1; }
    .btn { width: 100%; padding: 10px 14px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; margin-top: 8px; }
    .btn-primary { background: ${accent.color}; color: #000; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); }
    .btn-secondary:hover { background: rgba(255,255,255,0.15); }
  </style>
</head>
<body>
  <h2>WALLIX Ambient Studio</h2>
  <p>Your frosted glass Google New Tab is connected via <code>chrome.storage.local</code>.</p>
  
  <div class="status-card">
    <div class="status-title">Active Preset</div>
    <div class="status-desc">${settings.theme} (${settings.effects.themeAccent.toUpperCase()} accent)</div>
  </div>

  <button class="btn btn-primary" id="open-studio-btn">Launch Full Studio</button>
  <button class="btn btn-secondary" id="refresh-btn">Re-sync Current Tab</button>

  <script>
    document.getElementById("open-studio-btn").addEventListener("click", () => {
      chrome.tabs.create({ url: "${typeof window !== 'undefined' ? window.location.origin : 'https://aistudio.google.com'}" });
    });
    document.getElementById("refresh-btn").addEventListener("click", () => {
      chrome.tabs.reload();
    });
  </script>
</body>
</html>`;
  zip.file("sidepanel.html", sidepanelHtml);

  // 8. Icons
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="60" fill="${accent.color}"/><text x="64" y="80" font-size="52" font-weight="900" fill="#000" text-anchor="middle" font-family="sans-serif">W</text></svg>`;
  zip.file("icons/icon128.png", iconSvg);
  zip.file("icons/icon48.png", iconSvg);
  zip.file("icons/icon16.png", iconSvg);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates standalone HTML document for immediate instant testing in iframe/popup
 */
export function generateStandaloneNewTabHtml(
  settings: ChromeNewTabSettings,
  shortcuts: ChromeShortcut[]
): string {
  const accent = getThemeAccentValues(settings.effects.themeAccent);
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${days[now.getDay()]} ${now.getDate()}, ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Ensure wallpaper URL is resolved
  const bgUrl = resolveSafeWallpaperUrl(settings.wallpaper.url);
  const bgVideoUrl = settings.wallpaper.videoUrl ? resolveSafeWallpaperUrl(settings.wallpaper.videoUrl) : undefined;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent-color: ${accent.color};
      --accent-glow: ${accent.glow};
      --accent-ring: ${accent.ring};
      --accent-tint: ${accent.bgTint};
      --weather-ambient: ${accent.weatherAmbient || 'rgba(6, 182, 212, 0.08)'};
      --weather-active-pill-bg: ${accent.weatherPillBg || 'rgba(6, 182, 212, 0.20)'};
      --weather-active-pill-border: ${accent.weatherPillBorder || 'rgba(34, 211, 238, 0.40)'};
      --weather-active-pill-text: ${accent.weatherPillText || '#cffafe'};
      --search-blur: ${settings.search.blur}px;
      --search-opacity: ${settings.search.opacity / 100};
      --search-border: ${settings.search.borderOpacity / 100};
      --shortcut-blur: ${settings.shortcuts.blur}px;
      --shortcut-opacity: ${settings.shortcuts.opacity / 100};
      --dock-icon-size: ${settings.shortcuts.iconSize ? `${settings.shortcuts.iconSize}px` : 'clamp(38px, 3vw, 48px)'};
      --dock-label-size: ${settings.shortcuts.labelSize ? `${settings.shortcuts.labelSize}px` : 'clamp(11px, 0.9vw, 13px)'};
      --dock-spacing: ${settings.shortcuts.spacingPx ? `${settings.shortcuts.spacingPx}px` : settings.shortcuts.spacing === 'tight' ? 'clamp(8px, 1vw, 12px)' : settings.shortcuts.spacing === 'loose' ? 'clamp(16px, 1.8vw, 24px)' : 'clamp(10px, 1.2vw, 18px)'};
      --dock-opacity: ${(settings.shortcuts.opacity ?? 30) / 100};
      --dock-blur: ${settings.shortcuts.blur ?? 16}px;
      --dock-border-opacity: ${(settings.shortcuts.borderOpacity ?? 22) / 100};
      --dock-hover-scale: ${settings.shortcuts.hoverScale ?? 1.08};
      --dock-hover-lift: ${settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4}px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { width: 100vw; height: 100vh; overflow: hidden; background: #000; color: #fff; user-select: none; }
    
    .wallpaper-layer { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
    .bg-media { width: 100%; height: 100%; object-fit: cover; }
    .vignette-overlay { position: absolute; inset: 0; pointer-events: none; background-color: rgba(0, 0, 0, ${settings.effects.backdropDim / 100}); box-shadow: inset 0 0 ${settings.effects.vignette * 2.5}px rgba(0, 0, 0, ${settings.effects.vignette / 100}); }
    
    .ui-layer { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 48px); }

    /* WALLIX GLASS LIGHT SWEEP & WEATHER KEYFRAME ANIMATIONS */
    @keyframes glassLightSweep {
      0% {
        transform: translateX(-160%) skewX(-20deg);
        opacity: 0;
      }
      15% {
        opacity: 0.12;
      }
      45% {
        transform: translateX(160%) skewX(-20deg);
        opacity: 0.06;
      }
      46%, 100% {
        transform: translateX(160%) skewX(-20deg);
        opacity: 0;
      }
    }

    .animate-glass-light-sweep {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: inherit;
      z-index: 1;
    }

    .animate-glass-light-sweep::after {
      content: '';
      position: absolute;
      top: -50%;
      bottom: -50%;
      left: -20%;
      width: 50%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.01) 20%,
        rgba(255, 255, 255, 0.09) 50%,
        rgba(255, 255, 255, 0.01) 80%,
        transparent 100%
      );
      animation: glassLightSweep 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes sunGlowPulse {
      0%, 100% {
        filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.2));
        transform: rotate(0deg) scale(1);
      }
      50% {
        filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.35));
        transform: rotate(180deg) scale(1.02);
      }
    }

    @keyframes cloudGentleFloat {
      0%, 100% {
        transform: translate(0, 0);
      }
      50% {
        transform: translate(1px, -1px);
      }
    }

    .animate-sun-glow {
      animation: sunGlowPulse 24s linear infinite;
    }

    .animate-cloud-float {
      animation: cloudGentleFloat 6s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-glass-light-sweep::after,
      .animate-sun-glow,
      .animate-cloud-float {
        animation: none !important;
      }
    }
    
    /* TOP NAVIGATION */
    .top-nav { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: clamp(12px, 1.5vw, 24px); }

    /* WEATHER WIDGET */
    .weather-widget {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: clamp(220px, 18vw, 290px);
      min-height: clamp(110px, 10vw, 150px);
      padding: clamp(10px, 1vw, 14px);
      border-radius: 20px;
      background: rgba(15, 23, 42, var(--search-opacity, 0.24));
      backdrop-filter: blur(var(--search-blur, 24px)) saturate(160%);
      -webkit-backdrop-filter: blur(var(--search-blur, 24px)) saturate(160%);
      border: 1px solid rgba(255, 255, 255, var(--search-border, 0.20));
      box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.27), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.24);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      color: #ffffff;
    }

    .weather-widget:hover {
      border-color: rgba(255, 255, 255, 0.32);
      transform: translateY(-2px);
      box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35);
    }

    #weather-widget {
      transform: translate(${settings.layout?.weather?.x || 0}px, ${settings.layout?.weather?.y || 0}px) scale(${settings.layout?.weather?.scale || 1});
      transform-origin: top left;
      ${settings.layout?.weather?.zIndex ? `z-index: ${settings.layout.weather.zIndex};` : ''}
    }

    .weather-ambient-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      background: radial-gradient(circle at top left, var(--weather-ambient, rgba(6, 182, 212, 0.08)), transparent 70%);
    }

    .weather-top {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .weather-date-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .weather-cal-icon {
      stroke: rgba(148, 163, 184, 0.85);
      flex-shrink: 0;
      width: 12px;
      height: 12px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
    }

    .weather-date-text {
      font-size: clamp(10px, 0.85vw, 11px);
      font-weight: 400;
      color: rgba(203, 213, 225, 0.85);
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    }

    .weather-top-sun-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(251, 191, 36, 0.10);
      border: 1px solid rgba(251, 191, 36, 0.20);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(253, 224, 71, 0.85);
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.15);
      flex-shrink: 0;
      transition: transform 0.3s;
    }

    .weather-widget:hover .weather-top-sun-badge {
      transform: scale(1.06);
    }

    .sun-micro-icon {
      width: 11px;
      height: 11px;
      color: rgba(253, 224, 71, 0.9);
    }

    .weather-mid {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 0;
    }

    .weather-temp-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .weather-layered-icons {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 26px;
      height: 26px;
    }

    .weather-sun-primary {
      width: 24px;
      height: 24px;
      color: rgba(253, 224, 71, 0.9);
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.35));
    }

    .weather-cloud-secondary {
      width: 16px;
      height: 16px;
      color: rgba(226, 232, 240, 0.9);
      position: absolute;
      bottom: -2px;
      right: -4px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
    }

    .weather-temp-btn {
      display: flex;
      align-items: baseline;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      outline: none;
      transition: transform 0.15s;
      font-family: inherit;
    }

    .weather-temp-btn:active {
      transform: scale(0.95);
    }

    .weather-temp-val {
      font-size: clamp(28px, 2.5vw, 34px);
      font-weight: 300;
      letter-spacing: -0.03em;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
      line-height: 1;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }

    .weather-unit-val {
      font-size: clamp(12px, 1vw, 13.5px);
      font-weight: 300;
      color: rgba(203, 213, 225, 0.8);
      margin-left: 2px;
      letter-spacing: -0.01em;
      transition: color 0.15s;
    }

    .weather-temp-btn:hover .weather-unit-val {
      color: var(--accent-color, #22d3ee);
    }

    .weather-telemetry-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      flex-shrink: 0;
    }

    .weather-loc-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: clamp(10px, 0.85vw, 10.5px);
      font-weight: 500;
      color: rgba(226, 232, 240, 0.9);
      letter-spacing: -0.01em;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    .weather-map-pin {
      width: 10px;
      height: 10px;
      color: var(--accent-color, #22d3ee);
      flex-shrink: 0;
    }

    .weather-loc-name {
      max-width: 85px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .weather-loc-dot {
      color: rgba(148, 163, 184, 0.8);
    }

    .weather-feels-sub {
      font-size: clamp(9px, 0.75vw, 9.5px);
      color: rgba(148, 163, 184, 0.9);
      font-weight: 400;
      letter-spacing: -0.01em;
    }

    .weather-pills-row {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }

    .weather-hi-pill, .weather-lo-pill {
      padding: 2px 6px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: clamp(9px, 0.75vw, 9.5px);
      font-weight: 500;
      color: #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: background 0.15s;
    }

    .weather-hi-pill:hover, .weather-lo-pill:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .hi-arrow {
      width: 8px;
      height: 8px;
      color: #fb7185;
      stroke-width: 2.5;
    }

    .lo-arrow {
      width: 8px;
      height: 8px;
      color: #38bdf8;
      stroke-width: 2.5;
    }

    .weather-bottom-forecast {
      position: relative;
      z-index: 10;
      padding-top: 7px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 3px;
      text-align: center;
    }

    .forecast-pill {
      padding: 4px 1px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(203, 213, 225, 0.75);
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .forecast-pill:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .forecast-day {
      font-size: clamp(8.5px, 0.7vw, 9px);
      font-weight: 500;
      letter-spacing: 0.05em;
      line-height: 1.1;
    }

    .forecast-temp {
      font-size: clamp(8px, 0.65vw, 8.5px);
      color: rgba(148, 163, 184, 0.8);
      font-weight: 400;
      line-height: 1.1;
      margin-top: 2px;
    }

    .forecast-pill.active-today {
      background: var(--weather-active-pill-bg, rgba(6, 182, 212, 0.20));
      border: 1px solid var(--weather-active-pill-border, rgba(34, 211, 238, 0.40));
      color: var(--weather-active-pill-text, #cffafe);
      box-shadow: 0 0 10px var(--accent-glow, rgba(6, 182, 212, 0.25));
    }

    .forecast-pill.active-today .forecast-day {
      font-weight: 700;
    }

    .forecast-pill.active-today .forecast-temp {
      font-weight: 800;
      color: inherit;
    }

    /* TOP SERVICES */
    .top-services { display: flex; align-items: center; gap: clamp(8px, 0.8vw, 12px); margin-left: auto; }
    #top-right-controls {
      transform: translate(${settings.layout?.topRight?.x || 0}px, ${settings.layout?.topRight?.y || 0}px) scale(${settings.layout?.topRight?.scale || 1});
      transform-origin: top right;
      ${settings.layout?.topRight?.zIndex ? `z-index: ${settings.layout.topRight.zIndex};` : ''}
    }
    .nav-link { color: #E2E8F0; text-decoration: none; padding: clamp(6px, 0.6vw, 9px) clamp(12px, 1.2vw, 18px); border-radius: 9999px; background: rgba(255, 255, 255, 0.09); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.2); font-size: clamp(12.5px, 0.95vw, 14px); font-weight: 500; transition: all 0.15s ease; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6); }
    .nav-link:hover { background: rgba(255, 255, 255, 0.18); color: #FFFFFF; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45); }
    .glass-icon-btn { width: clamp(34px, 2.5vw, 42px); height: clamp(34px, 2.5vw, 42px); border-radius: 50%; background: rgba(255, 255, 255, 0.09); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.2); color: #E2E8F0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); outline: none; }
    .glass-icon-btn:hover { background: rgba(255, 255, 255, 0.18); color: #FFFFFF; transform: translateY(-1px) scale(1.05); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45); }
    .profile-btn { color: #D8B4FE; }
    
    .popover-wrapper { position: relative; }
    .glass-popover { position: absolute; top: calc(100% + 8px); right: 0; z-index: 100; border-radius: 18px; background: rgba(10, 14, 26, 0.90); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.22); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7); animation: popoverFadeIn 0.18s ease-out; }
    @keyframes popoverFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .apps-popover { width: 290px; padding: 16px; }
    .popover-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; font-weight: 600; color: #FFFFFF; }
    .apps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .app-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 4px; border-radius: 12px; text-decoration: none; color: #CBD5E1; font-size: 11.5px; font-weight: 500; transition: all 0.15s ease; }
    .app-item:hover { background: rgba(255, 255, 255, 0.14); color: #FFFFFF; transform: translateY(-2px); }
    .app-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #FFFFFF; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35); }
    .profile-popover { width: 260px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .profile-card { display: flex; align-items: center; gap: 12px; }
    .profile-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #A855F7, #6366F1); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #FFFFFF; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); }
    .profile-name { font-size: 13px; font-weight: 600; color: #FFFFFF; }
    .profile-email { font-size: 11.5px; color: #94A3B8; }
    .profile-action-btn { display: block; width: 100%; padding: 9px 12px; border-radius: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 500; text-align: center; }

    /* CENTER SECTION */
    .center-content { width: 100%; max-width: clamp(520px, 60vw, 900px); margin: ${settings.search.position === 'top' ? 'clamp(16px, 3vh, 36px) auto auto auto' : 'auto'}; display: flex; flex-direction: column; align-items: center; gap: clamp(16px, 2vw, 28px); }
    .google-brand { display: ${settings.search.showLogo ? 'flex' : 'none'}; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 2px; }
    .google-logo { font-size: clamp(48px, 4.5vw, 72px); font-weight: 600; letter-spacing: -2px; }
    .g-blue { color: #4285F4; text-shadow: 0 2px 14px rgba(66, 133, 244, 0.5); }
    .g-red { color: #EA4335; text-shadow: 0 2px 14px rgba(234, 67, 53, 0.5); }
    .g-yellow { color: #FBBC05; text-shadow: 0 2px 14px rgba(251, 188, 5, 0.5); }
    .g-green { color: #34A853; text-shadow: 0 2px 14px rgba(52, 168, 83, 0.5); }
    .brand-tag { font-size: clamp(10px, 0.8vw, 11.5px); font-family: monospace; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(226, 232, 240, 0.75); }

    /* FROSTED SEARCH BAR */
    .search-form { display: flex; align-items: center; width: 100%; max-width: ${settings.search.customWidth ? `${settings.search.customWidth}px` : settings.search.size === 'compact' ? 'clamp(400px, 36vw, 540px)' : settings.search.size === 'spacious' ? 'clamp(480px, 48vw, 780px)' : 'clamp(420px, 40vw, 680px)'}; min-height: clamp(46px, 4vw, 56px); padding: ${settings.search.size === 'compact' ? 'clamp(8px, 0.9vw, 12px) clamp(14px, 1.4vw, 20px)' : settings.search.size === 'spacious' ? 'clamp(14px, 1.4vw, 18px) clamp(22px, 2.2vw, 32px)' : 'clamp(10px, 1.1vw, 15px) clamp(18px, 1.8vw, 26px)'}; gap: clamp(10px, 1.2vw, 16px); background: rgba(10, 16, 30, var(--search-opacity)); backdrop-filter: blur(var(--search-blur)) saturate(160%); -webkit-backdrop-filter: blur(var(--search-blur)) saturate(160%); border: 1px solid rgba(255, 255, 255, var(--search-border)); border-radius: ${settings.search.style === 'pill' ? '9999px' : settings.search.style === 'rounded' ? '20px' : '14px'}; box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    #search-form {
      transform: translate(${settings.layout?.search?.x || 0}px, ${settings.layout?.search?.y || 0}px) scale(${settings.layout?.search?.scale || 1});
      transform-origin: center center;
      ${settings.layout?.search?.zIndex ? `z-index: ${settings.layout.search.zIndex};` : ''}
    }
    .search-form:hover { border-color: rgba(255, 255, 255, 0.45); background: rgba(15, 23, 42, 0.55); }
    .search-form:focus-within { background: rgba(12, 18, 34, 0.62); border-color: var(--accent-color); box-shadow: 0 12px 38px -4px rgba(0, 0, 0, 0.6), 0 0 24px var(--accent-glow), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
    .search-g-icon { flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6)); width: clamp(17px, 1.4vw, 21px); height: clamp(17px, 1.4vw, 21px); }
    .search-form input { flex: 1; background: transparent; border: none; outline: none; color: #FFFFFF; font-size: clamp(14px, 1.15vw, 16.5px); font-weight: 400; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7); }
    .search-form input::placeholder { color: rgba(226, 232, 240, 0.75); }
    .search-tools { display: flex; align-items: center; gap: clamp(8px, 0.8vw, 12px); flex-shrink: 0; }
    .tool-btn { background: transparent; border: none; outline: none; color: #CBD5E1; padding: clamp(5px, 0.5vw, 8px); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .tool-btn:hover { color: #FFFFFF; background: rgba(255, 255, 255, 0.15); }
    .tool-btn svg { width: clamp(15px, 1.2vw, 18px); height: clamp(15px, 1.2vw, 18px); }
    .ai-badge { display: ${settings.search.showAiMode !== false ? 'flex' : 'none'}; align-items: center; gap: 5px; padding: clamp(3px, 0.35vw, 5px) clamp(8px, 0.8vw, 12px); border-radius: 9999px; background: var(--accent-tint); border: 1px solid var(--accent-color); color: var(--accent-color); font-size: clamp(10.5px, 0.85vw, 12px); font-family: monospace; font-weight: 700; cursor: pointer; box-shadow: 0 0 14px var(--accent-glow); transition: all 0.15s; }
    .ai-badge:hover { transform: scale(1.05); box-shadow: 0 0 18px var(--accent-glow); }

    /* SHORTCUTS DOCK */
    .shortcut-dock { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--dock-spacing, clamp(10px, 1.2vw, 18px)); max-width: clamp(520px, 60vw, 900px); padding: clamp(12px, 1.5vw, 20px) 16px 8px 16px; overflow: visible; }
    #standalone-dock {
      transform: translate(${settings.layout?.dock?.x || 0}px, ${settings.layout?.dock?.y || 0}px) scale(${settings.layout?.dock?.scale || 1});
      transform-origin: center center;
      ${settings.layout?.dock?.zIndex ? `z-index: ${settings.layout.dock.zIndex};` : ''}
    }
    .shortcut-dock.spacing-tight { gap: clamp(8px, 1vw, 12px); }
    .shortcut-dock.spacing-loose { gap: clamp(16px, 1.8vw, 24px); }
    .shortcut-item { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 0.6vw, 10px); text-decoration: none; color: rgba(226, 232, 240, 0.85); font-size: var(--dock-label-size, clamp(11px, 0.9vw, 13px)); font-weight: 500; cursor: pointer; position: relative; transition: transform 0.18s cubic-bezier(0.2, 0, 0.2, 1), color 0.18s ease; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85); overflow: visible; z-index: 1; will-change: transform; }
    @media (hover: hover) and (pointer: fine) {
      .shortcut-item:hover { transform: translateY(calc(var(--dock-hover-lift, 4px) * -1)) scale(var(--dock-hover-scale, 1.08)); color: #FFFFFF; z-index: 20; }
      .shortcut-item:hover .shortcut-glass-card { border-color: rgba(255, 255, 255, 0.45); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 18px var(--accent-glow); }
    }
    .shortcut-glass-card { width: var(--dock-icon-size, clamp(38px, 3vw, 48px)); height: var(--dock-icon-size, clamp(38px, 3vw, 48px)); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, var(--dock-opacity, 0.3)); backdrop-filter: blur(var(--dock-blur, 16px)) saturate(160%); -webkit-backdrop-filter: blur(var(--dock-blur, 16px)) saturate(160%); border: 1px solid rgba(255, 255, 255, var(--dock-border-opacity, 0.22)); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.38); transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; overflow: visible; }
    .shortcut-glass-card.style-pill { border-radius: 9999px; }
    .shortcut-inner-icon { width: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.72); height: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.72); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 700; font-size: calc(var(--dock-icon-size, clamp(38px, 3vw, 48px)) * 0.28); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); overflow: hidden; }
    .shortcut-label { font-size: var(--dock-label-size, clamp(11px, 0.9vw, 13px)); font-weight: 500; max-width: clamp(68px, 5vw, 96px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color 0.15s; color: rgba(226, 232, 240, 0.85); pointer-events: none; }
    .shortcut-item:hover .shortcut-label { color: #FFFFFF; }
    .shortcut-add-card { border: 1px solid rgba(255, 255, 255, 0.24) !important; color: #CBD5E1; }
    .shortcut-add-inner { width: calc(var(--dock-icon-size, 48px) * 0.72); height: calc(var(--dock-icon-size, 48px) * 0.72); border-radius: 50%; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.15s; }
    .shortcut-item:hover .shortcut-add-card { border-color: rgba(255, 255, 255, 0.5) !important; background: rgba(255, 255, 255, 0.15); }
    .shortcut-item:hover .shortcut-add-inner { background: rgba(255, 255, 255, 0.22); color: #FFFFFF; }

    /* BOTTOM BAR & FLOATING CUSTOMIZE BUTTON */
    .bottom-bar { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: rgba(226, 232, 240, 0.8); width: 100%; max-width: 820px; padding: 0 12px; }
    .wallpaper-info { opacity: 0.7; font-family: monospace; }
    .customize-btn { position: fixed; right: 20px; bottom: 20px; z-index: 50; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 9999px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.22); color: #E2E8F0; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); outline: none; }
    .customize-btn:hover { background: rgba(255, 255, 255, 0.18); color: #FFFFFF; border-color: rgba(255, 255, 255, 0.4); transform: translateY(-1.5px) scale(1.02); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); }
    .customize-btn:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
  </style>
</head>
<body>
  <!-- LAYER 1: FULLSCREEN WALLPAPER -->
  <div class="wallpaper-layer">
    ${settings.wallpaper.type === 'video' && bgVideoUrl ? `
      <video src="${bgVideoUrl}" autoplay loop muted playsinline class="bg-media" onerror="this.style.display='none'; document.getElementById('bg-img-fallback').style.display='block';"></video>
      <img id="bg-img-fallback" src="${bgUrl}" class="bg-media" style="display:none;" alt="Wallpaper Background" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';}">
    ` : `
      <img src="${bgUrl}" class="bg-media" alt="Wallpaper Background" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';}">
    `}
    <div class="vignette-overlay"></div>
  </div>

  <!-- LAYER 2: UI WORKSPACE -->
  <main class="ui-layer">
    <!-- TOP BAR -->
    <header class="top-nav">
      <!-- Weather Widget: 1:1 Parity with WALLIX Studio Frosted Glass Widget -->
      <div id="weather-widget" class="weather-widget">
        <!-- Ambient Lighting Glow Backdrop -->
        <div class="weather-ambient-glow" aria-hidden="true"></div>
        <!-- Light Sweep Shimmer Animation Layer -->
        <div class="animate-glass-light-sweep" aria-hidden="true"></div>

        <!-- Top row: Calendar Icon + Live Date + Sun Accent Badge -->
        <div class="weather-top">
          <div class="weather-date-wrap">
            <svg class="weather-cal-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="weather-date-text" id="weather-date-display">Sunday, 12 Apr 2026</span>
          </div>
          <div class="weather-top-sun-badge" title="Ambient Lighting Active">
            <svg class="sun-micro-icon animate-sun-glow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
            </svg>
          </div>
        </div>

        <!-- Middle section: Layered Sun/Cloud Art, Hero Temp (°C/°F toggle) & Telemetry -->
        <div class="weather-mid">
          <div class="weather-temp-group">
            <!-- Layered animated Sun + Floating Cloud Icons -->
            <div class="weather-layered-icons" aria-hidden="true">
              <svg class="weather-sun-primary animate-sun-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
              </svg>
              <svg class="weather-cloud-secondary animate-cloud-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
            </div>

            <!-- Clickable Interactive Temperature Hero -->
            <button type="button" class="weather-temp-btn" id="weather-temp-toggle" title="Click to toggle °C / °F">
              <span class="weather-temp-val" id="temp-deg">28</span>
              <span class="weather-unit-val" id="temp-unit">°C</span>
            </button>
          </div>

          <!-- Telemetry Column: Location, Feels Like, High/Low Glass Pills -->
          <div class="weather-telemetry-col">
            <div class="weather-loc-row">
              <svg class="weather-map-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="weather-loc-name">New Delhi</span>
              <span class="weather-loc-dot">·</span>
              <span id="feels-like-val">26°</span>
            </div>
            <div class="weather-feels-sub" id="weather-feels-sub-text">Feels like 26°</div>
            <div class="weather-pills-row">
              <div class="weather-hi-pill" title="High">
                <svg class="hi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                </svg>
                <span id="hi-temp">28°</span>
              </div>
              <div class="weather-lo-pill" title="Low">
                <svg class="lo-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m19 12-7 7-7-7"/><path d="M12 5v14"/>
                </svg>
                <span id="lo-temp">23°</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom row: 7-Day Forecast Grid -->
        <div class="weather-bottom-forecast">
          <div class="forecast-pill"><span class="forecast-day">MON</span><span class="forecast-temp" id="fc-mon">27°</span></div>
          <div class="forecast-pill"><span class="forecast-day">TUE</span><span class="forecast-temp" id="fc-tue">26°</span></div>
          <div class="forecast-pill"><span class="forecast-day">WED</span><span class="forecast-temp" id="fc-wed">28°</span></div>
          <div class="forecast-pill active-today"><span class="forecast-day">THU</span><span class="forecast-temp" id="fc-thu">28°</span></div>
          <div class="forecast-pill"><span class="forecast-day">FRI</span><span class="forecast-temp" id="fc-fri">27°</span></div>
          <div class="forecast-pill"><span class="forecast-day">SAT</span><span class="forecast-temp" id="fc-sat">26°</span></div>
          <div class="forecast-pill"><span class="forecast-day">SUN</span><span class="forecast-temp" id="fc-sun">25°</span></div>
        </div>
      </div>

      <!-- Top Right Google Services -->
      <div id="top-right-controls" class="top-services">
        <a href="https://mail.google.com" target="_blank" rel="noreferrer" class="nav-link">Gmail</a>
        <a href="https://www.google.com/imghp" target="_blank" rel="noreferrer" class="nav-link">Images</a>

        <!-- 3x3 Google Apps Launcher -->
        <div class="popover-wrapper">
          <button type="button" id="apps-btn" class="glass-icon-btn" title="Google Apps">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="5" r="2.2"/><circle cx="12" cy="5" r="2.2"/><circle cx="19" cy="5" r="2.2"/>
              <circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/>
              <circle cx="5" cy="19" r="2.2"/><circle cx="12" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/>
            </svg>
          </button>
          
          <div id="apps-popover" class="glass-popover apps-popover" style="display: none;">
            <div class="popover-header">
              <span>Google Apps</span>
            </div>
            <div class="apps-grid">
              <a href="https://www.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #4285F4, #3B82F6);">🔍</div><span>Search</span></a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #EA4335, #DC2626);">▶</div><span>YouTube</span></a>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #34A853, #16A34A);">📍</div><span>Maps</span></a>
              <a href="https://drive.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #FBBC05, #EAB308);">📁</div><span>Drive</span></a>
              <a href="https://mail.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #EA4335, #F43F5E);">✉</div><span>Gmail</span></a>
              <a href="https://photos.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #4285F4, #06B6D4);">🖼</div><span>Photos</span></a>
              <a href="https://docs.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #4285F4, #2563EB);">📄</div><span>Docs</span></a>
              <a href="https://sheets.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #34A853, #059669);">📊</div><span>Sheets</span></a>
              <a href="https://meet.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #00897B, #0D9488);">📹</div><span>Meet</span></a>
              <a href="https://calendar.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #1976D2, #0284C7);">📅</div><span>Calendar</span></a>
              <a href="https://gemini.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #8E24AA, #9333EA);">✦</div><span>Gemini</span></a>
              <a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" class="app-item"><div class="app-icon" style="background: linear-gradient(135deg, #00ACC1, #0891B2);">🌐</div><span>Store</span></a>
            </div>
          </div>
        </div>

        <!-- Google Profile Avatar -->
        <div class="popover-wrapper">
          <button type="button" id="profile-btn" class="glass-icon-btn profile-btn" title="Google Account">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          <div id="profile-popover" class="glass-popover profile-popover" style="display: none;">
            <div class="profile-card">
              <div class="profile-avatar">G</div>
              <div class="profile-info">
                <div class="profile-name">Google Account</div>
                <div class="profile-email">Default Chrome Profile</div>
              </div>
            </div>
            <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" class="profile-action-btn">Manage your Google Account</a>
          </div>
        </div>
      </div>
    </header>

    <!-- CENTER AREA -->
    <section class="center-content">
      <div class="google-brand">
        <div class="google-logo">
          <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
        </div>
        <span class="brand-tag">Enhanced by WALLIX</span>
      </div>

      <!-- Frosted Search Bar -->
      <form id="search-form" action="${settings.search.engine === 'duckduckgo' ? 'https://duckduckgo.com/' : settings.search.engine === 'bing' ? 'https://www.bing.com/search' : 'https://www.google.com/search'}" method="get" target="_blank" class="search-form">
        <!-- Search G SVG Icon -->
        <svg class="search-g-icon" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>

        <input id="search-input" type="text" name="q" placeholder="Search Google or enter a web address..." autocomplete="off" autofocus>
        
        <div class="search-tools">
          <button type="button" id="mic-btn" class="tool-btn" title="Search by voice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          
          <button type="button" id="lens-btn" class="tool-btn" title="Search by image">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          
          <div id="ai-badge" class="ai-badge" title="Ask Google AI / Gemini">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            <span>AI</span>
          </div>
        </div>
      </form>

      <!-- SHORTCUT DOCK -->
      <nav class="shortcut-dock" id="standalone-dock">
        ${shortcuts.map(s => {
          const title = String(s.title || 'Link').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
          const rawUrl = String(s.url || '');
          const safeUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
          let domain = 'google.com';
          try {
            const parsed = new URL(safeUrl);
            domain = parsed.hostname;
          } catch {
            domain = safeUrl.replace(/^https?:\/\//, '').split('/')[0] || 'google.com';
          }
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

          return `
          <a href="${safeUrl}" target="_blank" rel="noreferrer" class="shortcut-item" ${settings.shortcuts.showLabels ? '' : `title="${title}"`}>
            <div class="shortcut-glass-card">
              <div class="shortcut-inner-icon" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${faviconUrl}" alt="${title}" style="width: 60%; height: 60%; object-fit: contain;" onerror="this.style.display='none';" />
              </div>
            </div>
            ${settings.shortcuts.showLabels ? `<span class="shortcut-label">${title}</span>` : ''}
          </a>
        `;
        }).join('')}
        
        <div class="shortcut-item" id="add-btn" title="Add shortcut" role="button">
          <div class="shortcut-glass-card shortcut-add-card">
            <div class="shortcut-add-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
          </div>
          ${settings.shortcuts.showLabels ? `<span class="shortcut-label">Add shortcut</span>` : ''}
        </div>
      </nav>
    </section>

    <!-- BOTTOM BAR -->
    <footer class="bottom-bar">
      <div class="wallpaper-info">${settings.wallpaper.title || 'Samurai: Crimson Lily'}</div>
      <button type="button" id="customize-btn" class="customize-btn" title="Customize Chrome" aria-label="Customize Chrome with WALLIX">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
        <span>Customize Chrome</span>
      </button>
    </footer>
  </main>

  <script>
    // Live date and weather unit toggle
    try {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', options);
      const dateEl = document.getElementById('weather-date-display');
      if (dateEl) dateEl.textContent = dateStr;

      const dayIdx = now.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDayCode = dayMap[dayIdx];
      const forecastPills = document.querySelectorAll('.weather-bottom-forecast .forecast-pill');
      forecastPills.forEach(pill => pill.classList.remove('active-today'));
      const todayTempEl = document.getElementById('fc-' + currentDayCode);
      if (todayTempEl && todayTempEl.parentElement) {
        todayTempEl.parentElement.classList.add('active-today');
      }
    } catch (e) {
      console.error(e);
    }

    let isFahrenheit = false;
    const tempDegEl = document.getElementById('temp-deg');
    const tempUnitEl = document.getElementById('temp-unit');
    const feelsLikeEl = document.getElementById('feels-like-val');
    const feelsSubEl = document.getElementById('weather-feels-sub-text');
    const hiTempEl = document.getElementById('hi-temp');
    const loTempEl = document.getElementById('lo-temp');
    const fcMonEl = document.getElementById('fc-mon');
    const fcTueEl = document.getElementById('fc-tue');
    const fcWedEl = document.getElementById('fc-wed');
    const fcThuEl = document.getElementById('fc-thu');
    const fcFriEl = document.getElementById('fc-fri');
    const fcSatEl = document.getElementById('fc-sat');
    const fcSunEl = document.getElementById('fc-sun');

    document.getElementById('weather-temp-toggle')?.addEventListener('click', () => {
      isFahrenheit = !isFahrenheit;
      if (isFahrenheit) {
        if (tempDegEl) tempDegEl.textContent = '82';
        if (tempUnitEl) tempUnitEl.textContent = '°F';
        if (feelsLikeEl) feelsLikeEl.textContent = '79°';
        if (feelsSubEl) feelsSubEl.textContent = 'Feels like 79°';
        if (hiTempEl) hiTempEl.textContent = '84°';
        if (loTempEl) loTempEl.textContent = '73°';
        if (fcMonEl) fcMonEl.textContent = '81°';
        if (fcTueEl) fcTueEl.textContent = '79°';
        if (fcWedEl) fcWedEl.textContent = '82°';
        if (fcThuEl) fcThuEl.textContent = '82°';
        if (fcFriEl) fcFriEl.textContent = '81°';
        if (fcSatEl) fcSatEl.textContent = '79°';
        if (fcSunEl) fcSunEl.textContent = '77°';
      } else {
        if (tempDegEl) tempDegEl.textContent = '28';
        if (tempUnitEl) tempUnitEl.textContent = '°C';
        if (feelsLikeEl) feelsLikeEl.textContent = '26°';
        if (feelsSubEl) feelsSubEl.textContent = 'Feels like 26°';
        if (hiTempEl) hiTempEl.textContent = '28°';
        if (loTempEl) loTempEl.textContent = '23°';
        if (fcMonEl) fcMonEl.textContent = '27°';
        if (fcTueEl) fcTueEl.textContent = '26°';
        if (fcWedEl) fcWedEl.textContent = '28°';
        if (fcThuEl) fcThuEl.textContent = '28°';
        if (fcFriEl) fcFriEl.textContent = '27°';
        if (fcSatEl) fcSatEl.textContent = '26°';
        if (fcSunEl) fcSunEl.textContent = '25°';
      }
    });

    const appsBtn = document.getElementById('apps-btn');
    const appsPopover = document.getElementById('apps-popover');
    const profileBtn = document.getElementById('profile-btn');
    const profilePopover = document.getElementById('profile-popover');

    appsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      appsPopover.style.display = appsPopover.style.display === 'block' ? 'none' : 'block';
      if (profilePopover) profilePopover.style.display = 'none';
    });
    profileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePopover.style.display = profilePopover.style.display === 'block' ? 'none' : 'block';
      if (appsPopover) appsPopover.style.display = 'none';
    });
    document.addEventListener('click', () => {
      if (appsPopover) appsPopover.style.display = 'none';
      if (profilePopover) profilePopover.style.display = 'none';
    });

    document.getElementById('ai-badge')?.addEventListener('click', () => {
      const val = document.getElementById('search-input')?.value?.trim();
      if (val) window.open('https://www.google.com/search?q=' + encodeURIComponent(val) + '+%28ai%29', '_blank');
      else window.open('https://gemini.google.com', '_blank');
    });
    document.getElementById('lens-btn')?.addEventListener('click', () => {
      window.open('https://lens.google.com', '_blank');
    });
    document.getElementById('mic-btn')?.addEventListener('click', () => {
      window.open('https://www.google.com/search?q=&source=voice', '_blank');
    });
    document.getElementById('add-btn')?.addEventListener('click', () => {
      const name = prompt('Shortcut Name:');
      if (!name) return;
      let url = prompt('Shortcut URL:');
      if (!url) return;
      if (!/^https?:\\/\\//i.test(url)) url = 'https://' + url;
      window.open(url, '_blank');
    });
  </script>
</body>
</html>`;
}
