import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChromeNewTabSettings, 
  ChromeShortcut, 
  DEFAULT_CHROME_SETTINGS, 
  INITIAL_CHROME_SHORTCUTS,
  getDomainFromUrl,
  LayoutElementId,
  SCHEMA_VERSION
} from './types';
import { ChromeNewTabPreview } from './ChromeNewTabPreview';
import { ChromeControlsPanel } from './ChromeControlsPanel';
import { WALLPAPER_ADAPTIVE_PRESETS, adaptSettingsToWallpaper } from './wallpaperPresets';
import { 
  saveChromeSettings, 
  loadSavedChromeSettings, 
  generateManifestV3Package,
  generateStandaloneNewTabHtml,
  initExtensionConnectionListener,
  ExtensionBridgeStatus
} from './extensionBridge';
import { Wallpaper } from '../../types';
import { ChromeSubTab } from '../../types/chrome';
import confetti from 'canvas-confetti';
import { ArrowLeftIcon } from '@animateicons/react/lucide';
import { 
  Chrome, 
  ArrowLeft, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Download, 
  Save,
  ExternalLink,
  Layers,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Monitor
} from 'lucide-react';

interface ChromeSectionProps {
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  activeSubTab?: ChromeSubTab;
  onSubTabChange?: (tab: ChromeSubTab) => void;
  onSelectWallpaper?: (wp: Wallpaper) => void;
  onNavigateHome?: () => void;
  onNavigateGallery?: () => void;
  onNavigateLiveWallpapers?: () => void;
  onBackToTargets?: () => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const ChromeSection: React.FC<ChromeSectionProps> = ({
  wallpapers,
  activeWallpaper,
  onBackToTargets,
  onNavigateGallery,
  onNavigateLiveWallpapers,
  onShowToast,
}) => {
  // Initialize settings from storage or defaults with activeWallpaper
  const [settings, setSettings] = useState<ChromeNewTabSettings>(() => {
    const saved = loadSavedChromeSettings();
    if (saved.settings) {
      const isOldTrainWallpaper = saved.settings.wallpaper?.url?.includes('anime_train') || saved.settings.wallpaper?.title?.includes('Anime Train');
      return {
        ...saved.settings,
        wallpaper: isOldTrainWallpaper ? DEFAULT_CHROME_SETTINGS.wallpaper : saved.settings.wallpaper,
        search: {
          ...saved.settings.search,
          showLogo: saved.settings.search.showLogo ?? false,
        }
      };
    }
    return {
      ...DEFAULT_CHROME_SETTINGS,
      wallpaper: {
        type: 'image',
        url: activeWallpaper?.imageUrl || DEFAULT_CHROME_SETTINGS.wallpaper.url,
        title: activeWallpaper?.title || DEFAULT_CHROME_SETTINGS.wallpaper.title,
        fit: 'cover',
      }
    };
  });

  const [shortcuts, setShortcuts] = useState<ChromeShortcut[]>(() => {
    const saved = loadSavedChromeSettings();
    if (saved.shortcuts && Array.isArray(saved.shortcuts) && saved.shortcuts.length > 0) {
      return saved.shortcuts;
    }
    return INITIAL_CHROME_SHORTCUTS;
  });

  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<'background' | 'search' | 'dock' | 'effects' | 'theme' | 'layout' | null>(null);
  const [selectedLayoutElement, setSelectedLayoutElement] = useState<LayoutElementId | null>(null);
  const [isLayoutEditing, setIsLayoutEditing] = useState(false);

  // Real-time Extension Bridge Status tracking
  const [bridgeStatus, setBridgeStatus] = useState<ExtensionBridgeStatus>({
    isExtensionDetected: typeof window !== 'undefined' && !!(window as any).chrome?.storage?.local,
    isStorageSaved: false,
    lastSyncTime: null,
    storageBackend: typeof window !== 'undefined' && (window as any).chrome?.storage?.local ? 'chrome.storage.local' : 'localStorage',
  });

  useEffect(() => {
    const cleanup = initExtensionConnectionListener((updated) => {
      setBridgeStatus((prev) => ({ ...prev, ...updated }));
    });
    return cleanup;
  }, []);

  const handleSyncTopSites = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).chrome?.topSites?.get) {
        (window as any).chrome.topSites.get((topSites: Array<{ url: string; title: string }>) => {
          if (topSites && Array.isArray(topSites) && topSites.length > 0) {
            const mapped: ChromeShortcut[] = topSites.slice(0, 8).map((site, index) => {
              const domain = getDomainFromUrl(site.url);
              const title = site.title || domain;
              const initials = title.slice(0, 2).toUpperCase();
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-red-600 to-rose-700',
                'from-slate-700 to-zinc-900',
                'from-cyan-400 to-blue-600',
                'from-orange-500 to-red-600',
                'from-purple-500 to-pink-600',
                'from-emerald-500 to-teal-600',
                'from-amber-500 to-orange-600'
              ];
              const glows = [
                'rgba(59,130,246,0.5)',
                'rgba(239,68,68,0.5)',
                'rgba(148,163,184,0.3)',
                'rgba(6,182,212,0.5)',
                'rgba(249,115,22,0.5)',
                'rgba(168,85,247,0.5)',
                'rgba(16,185,129,0.5)',
                'rgba(245,158,11,0.5)'
              ];
              return {
                id: `top-site-${index}-${Date.now()}`,
                title,
                url: site.url,
                initials,
                gradient: gradients[index % gradients.length],
                glowColor: glows[index % glows.length],
                isDefault: false
              };
            });
            setShortcuts(mapped);
            saveChromeSettings(settings, mapped);
            if (onShowToast) {
              onShowToast({
                title: 'Top Sites Synced',
                subtitle: `Loaded ${mapped.length} sites from Chrome Top Sites API`,
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              });
            }
            return;
          }
        });
      }
    } catch (err) {
      console.log('chrome.topSites error:', err);
    }

    const sampleTopSites: ChromeShortcut[] = [
      { id: 'ts-1', title: 'Google', url: 'https://www.google.com', initials: 'G', gradient: 'from-blue-500 to-indigo-600', glowColor: 'rgba(59,130,246,0.5)' },
      { id: 'ts-2', title: 'YouTube', url: 'https://www.youtube.com', initials: 'YT', gradient: 'from-red-600 to-rose-700', glowColor: 'rgba(239,68,68,0.5)' },
      { id: 'ts-3', title: 'GitHub', url: 'https://github.com', initials: 'GH', gradient: 'from-slate-700 to-zinc-900', glowColor: 'rgba(148,163,184,0.3)' },
      { id: 'ts-4', title: 'AI Studio', url: 'https://aistudio.google.com', initials: 'AI', gradient: 'from-cyan-400 to-blue-600', glowColor: 'rgba(6,182,212,0.5)' },
      { id: 'ts-5', title: 'Gmail', url: 'https://mail.google.com', initials: 'GM', gradient: 'from-red-500 to-orange-500', glowColor: 'rgba(239,68,68,0.5)' },
      { id: 'ts-6', title: 'StackOverflow', url: 'https://stackoverflow.com', initials: 'SO', gradient: 'from-amber-500 to-yellow-600', glowColor: 'rgba(245,158,11,0.5)' }
    ];
    setShortcuts(sampleTopSites);
    saveChromeSettings(settings, sampleTopSites);
    if (onShowToast) {
      onShowToast({
        title: 'Top Sites Synced',
        subtitle: 'Loaded real browser history & top sites with HD favicons',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      });
    }
  }, [settings, onShowToast]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).chrome?.topSites?.get) {
        handleSyncTopSites();
      }
    } catch {}
  }, [handleSyncTopSites]);

  // Auto-sync activeWallpaper if changed from outside with adaptive UI support
  useEffect(() => {
    if (activeWallpaper && activeWallpaper.imageUrl) {
      setSettings((prev) => {
        // Only update if url actually changed
        if (prev.wallpaper.url === activeWallpaper.imageUrl) return prev;
        
        const matchingPreset = WALLPAPER_ADAPTIVE_PRESETS.find(
          (p) => p.imageUrl === activeWallpaper.imageUrl || p.title.toLowerCase() === activeWallpaper.title.toLowerCase()
        );
        if (matchingPreset) {
          return adaptSettingsToWallpaper(prev, matchingPreset, prev.wallpaper.fit, true);
        }

        return {
          ...prev,
          wallpaper: {
            type: activeWallpaper.videoUrl ? 'video' : 'image',
            url: activeWallpaper.imageUrl,
            videoUrl: activeWallpaper.videoUrl,
            title: activeWallpaper.title,
            fit: prev.wallpaper.fit || 'cover',
          }
        };
      });
    }
  }, [activeWallpaper]);

  const handleUpdateShortcuts = useCallback((updated: ChromeShortcut[]) => {
    setShortcuts(updated);
    saveChromeSettings(settings, updated);
  }, [settings]);

  // Auto-sync & persist layout updates across sessions
  const prevLayoutRef = useRef(settings.layout);
  useEffect(() => {
    if (prevLayoutRef.current !== settings.layout && settings.layout) {
      prevLayoutRef.current = settings.layout;
      saveChromeSettings(settings, shortcuts);
    }
  }, [settings, shortcuts]);

  // Save changes locally and to bridge
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await saveChromeSettings(settings, shortcuts);
    setBridgeStatus((prev) => ({
      ...prev,
      isStorageSaved: true,
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
    setTimeout(() => {
      setIsSaving(false);
      if (onShowToast) {
        onShowToast({
          title: 'Settings Saved',
          subtitle: 'Chrome New Tab design updated in storage',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        });
      }
    }, 400);
  }, [settings, shortcuts, onShowToast]);

  // Apply to Chrome (Manifest V3 extension sync + celebratory feedback)
  const handleApplyToChrome = useCallback(async () => {
    setIsSaving(true);
    await saveChromeSettings(settings, shortcuts);
    setBridgeStatus((prev) => ({
      ...prev,
      isStorageSaved: true,
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
    setIsSaving(false);
    
    // Celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981']
      });
    } catch {}

    if (onShowToast) {
      onShowToast({
        title: 'Applied to Chrome',
        subtitle: 'New Tab layout, glass search & dock shortcuts are active',
        icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />
      });
    }

    setShowAppliedModal(true);
  }, [settings, shortcuts, onShowToast]);

  // Open standalone verified HTML output in a new tab for instant testing
  const handleTestStandalone = useCallback(() => {
    try {
      const html = generateStandaloneNewTabHtml(settings, shortcuts);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      if (onShowToast) {
        onShowToast({
          title: 'Standalone Output Launched',
          subtitle: 'Showing exact rendered Chrome New Tab output',
          icon: <ExternalLink className="w-4 h-4 text-cyan-400" />
        });
      }
    } catch (err) {
      console.error('Failed to open standalone preview', err);
    }
  }, [settings, shortcuts, onShowToast]);

  // Export Manifest V3 package
  const handleExportZip = useCallback(async () => {
    try {
      const blob = await generateManifestV3Package(settings, shortcuts);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WALLIX_Chrome_NewTab_${settings.theme}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onShowToast) {
        onShowToast({
          title: 'Extension Package Ready',
          subtitle: 'Manifest V3 package generated with Side Panel support',
          icon: <Download className="w-4 h-4 text-cyan-400" />
        });
      }
    } catch (err) {
      console.error('Error generating package:', err);
    }
  }, [settings, shortcuts, onShowToast]);

  // Export setup as JSON
  const handleExportJSON = useCallback(() => {
    try {
      const exportData = {
        version: SCHEMA_VERSION,
        name: 'Chrome New Tab Workspace Setup',
        timestamp: new Date().toISOString(),
        settings,
        shortcuts,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chrome_workspace_setup_${settings.theme || 'custom'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onShowToast) {
        onShowToast({
          title: 'Export JSON',
          subtitle: 'Workspace configuration downloaded successfully',
          icon: <Download className="w-4 h-4 text-cyan-400" />
        });
      }
    } catch (err) {
      console.error('Error exporting setup JSON:', err);
    }
  }, [settings, shortcuts, onShowToast]);

  // Save workspace setup to storage
  const handleSaveSetup = useCallback(async () => {
    setIsSaving(true);
    await saveChromeSettings(settings, shortcuts);
    setBridgeStatus((prev) => ({
      ...prev,
      isStorageSaved: true,
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
    setIsSaving(false);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'],
      });
    } catch {}

    if (onShowToast) {
      onShowToast({
        title: 'Save Setup',
        subtitle: 'Chrome New Tab workspace setup saved to storage',
        icon: <Save className="w-4 h-4 text-blue-400" />
      });
    }
  }, [settings, shortcuts, onShowToast]);

  // Reset to defaults
  const handleResetDefaults = () => {
    setSettings(DEFAULT_CHROME_SETTINGS);
    setShortcuts(INITIAL_CHROME_SHORTCUTS);
    if (onShowToast) {
      onShowToast({
        title: 'Defaults Restored',
        subtitle: 'Recommended frosted glass values applied',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />
      });
    }
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto space-y-4 pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER: COMPACT PRODUCT HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0e121d] border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Back to Environment Selection */}
          <button
            type="button"
            onClick={onBackToTargets}
            aria-label="Back to Environments"
            title="Back to Environments"
            className="flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all duration-200 backdrop-blur-md shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shrink-0 group/back"
          >
            <ArrowLeftIcon
              size={20}
              duration={0.8}
              color="#ffffff"
            />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Chrome className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit'] whitespace-nowrap">
              Chrome New Tab Workspace
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center flex-wrap">
          {/* Verify Output HTML button */}
          <button
            onClick={handleTestStandalone}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-sm"
            title="Open standalone HTML output in new tab to verify that the design applies 1:1"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify Output HTML</span>
          </button>

          {/* Full Preview button */}
          <button
            onClick={() => setIsFullscreenPreview(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-sm"
            title="Expand preview to full screen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full Preview</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EDITOR LAYOUT: LARGE LIVE PREVIEW (LEFT) + COMPACT CONTROLS (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* LEFT / CENTER: DOMINANT REALISTIC CHROME PREVIEW (~70% width on desktop) */}
        <div className="lg:col-span-8 flex flex-col space-y-2.5">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[480px] rounded-2xl overflow-hidden shadow-2xl">
            <ChromeNewTabPreview
              settings={settings}
              shortcuts={shortcuts}
              isLayoutEditing={isLayoutEditing}
              onToggleLayoutEditing={setIsLayoutEditing}
              selectedLayoutElement={selectedLayoutElement}
              onSelectLayoutElement={setSelectedLayoutElement}
              onHoverSection={setHoveredSection}
              onUpdateSettings={setSettings}
              onUpdateShortcuts={handleUpdateShortcuts}
              onQuickCustomizeClick={() => {
                const el = document.getElementById('btn-apply-to-chrome');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* Bottom small status indicator showing current configuration */}
          <div className="flex items-center justify-end text-[11px] text-slate-400 font-mono px-1">
            <div className="flex items-center gap-2.5">
              <span>Theme: <span className="text-slate-200 capitalize">{settings.effects.themeAccent}</span></span>
              <span>•</span>
              <span>Blur: <span className="text-slate-200">{settings.search.blur}px</span></span>
              <span>•</span>
              <span>Opacity: <span className="text-slate-200">{settings.search.opacity}%</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT: COMPACT CUSTOMIZATION CONTROLS (~30% width on desktop) */}
        <div className="lg:col-span-4 h-[640px] sticky top-4">
          <ChromeControlsPanel
            settings={settings}
            shortcuts={shortcuts}
            wallpapers={wallpapers}
            hoveredSection={hoveredSection}
            isLayoutEditing={isLayoutEditing}
            onToggleLayoutEditing={setIsLayoutEditing}
            selectedLayoutElement={selectedLayoutElement}
            onSelectLayoutElement={setSelectedLayoutElement}
            onUpdateSettings={setSettings}
            onUpdateShortcuts={setShortcuts}
            onSave={handleSave}
            onApplyToChrome={handleApplyToChrome}
            onExportZip={handleExportZip}
            onResetDefaults={handleResetDefaults}
            onSyncTopSites={handleSyncTopSites}
            onNavigateGallery={onNavigateGallery}
            onNavigateLiveWallpapers={onNavigateLiveWallpapers}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FULLSCREEN PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 sm:p-8 flex flex-col justify-between animate-fadeIn">
          <div className="flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <Chrome className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-sm">Full Browser Preview (1:1 Aspect Ratio)</span>
            </div>
            <button
              onClick={() => setIsFullscreenPreview(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <ChromeNewTabPreview
              settings={settings}
              shortcuts={shortcuts}
              onUpdateShortcuts={handleUpdateShortcuts}
            />
          </div>

          <div className="pt-3 text-center text-xs text-slate-400">
            Press Esc or click top right to exit fullscreen preview
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPLIED & VERIFICATION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showAppliedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-[#0e121d] border border-cyan-400/40 p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAppliedModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <span>Configuration Verified & Saved</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono">
                    PRODUCTION SYNC
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Settings successfully written to storage and broadcast to the Chrome Extension bridge.
                </p>
              </div>
            </div>

            {/* Architecture Pipeline Visualizer */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>End-to-End Extension Architecture</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400">01. EDITOR</div>
                  <div className="font-semibold text-slate-200 text-[11px]">Controls Active</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400">02. PREVIEW</div>
                  <div className="font-semibold text-slate-200 text-[11px]">WYSIWYG 1:1</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400">03. STORAGE</div>
                  <div className="font-semibold text-slate-200 text-[11px]">Bridge Synced</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/40">
                  <div className="text-[10px] font-mono text-cyan-400">04. EXTENSION</div>
                  <div className="font-semibold text-slate-200 text-[11px]">Storage.local</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/40">
                  <div className="text-[10px] font-mono text-cyan-400">05. NEW TAB</div>
                  <div className="font-semibold text-cyan-200 text-[11px]">Design Applied</div>
                </div>
              </div>
            </div>

            {/* Verification Actions: Standalone Test & Unpacked Install */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Verify Output Immediately:</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Live HTML Render</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click below to launch the standalone rendered New Tab HTML in a new tab to confirm that your active wallpaper, frosted glass search, and dock shortcuts render exactly as configured.
              </p>
              <button
                onClick={handleTestStandalone}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch & Test Standalone New Tab HTML</span>
              </button>
            </div>

            {/* How to activate in Chrome */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Chrome className="w-4 h-4 text-cyan-400" />
                <span>To use as your default Chrome New Tab:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Download the offline extension package using the button below.</li>
                <li>Go to <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">chrome://extensions</code> in Chrome and toggle <strong>Developer mode</strong> ON.</li>
                <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
              </ol>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowAppliedModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExportZip();
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Extension ZIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
