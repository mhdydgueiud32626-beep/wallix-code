import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  Monitor, 
  Download, 
  Info,
  CheckCircle2,
  Sparkles,
  MousePointer,
  HelpCircle,
  FolderOpen,
  ExternalLink,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Wallpaper } from '../../types';
import { 
  WindowsEnvironmentConfig, 
  DEFAULT_WINDOWS_CONFIG 
} from './windows/types';
import { WindowsDesktopCanvas } from './windows/WindowsDesktopCanvas';
import { WindowsCustomizationSidebar } from './windows/WindowsCustomizationSidebar';

// Re-export types for external consumers
export * from './windows/types';

interface WindowsTargetWorkspaceProps {
  wallpapers: Wallpaper[];
  activeWallpaper?: Wallpaper | null;
  onBackToTargets: () => void;
  onOpenFullSimulator?: (w: Wallpaper) => void;
  onSelectWallpaper?: (w: Wallpaper) => void;
  onShowToast?: (msg: any, type?: string) => void;
}

const STORAGE_KEY = 'wallix_windows_environment_config';

export const WindowsTargetWorkspace: React.FC<WindowsTargetWorkspaceProps> = ({
  wallpapers,
  activeWallpaper: propActiveWallpaper,
  onBackToTargets,
  onOpenFullSimulator,
  onSelectWallpaper,
  onShowToast,
}) => {
  // Find Crimson Katana Vision (or first wallpaper) as standard default
  const defaultSamuraiWallpaper = wallpapers.find(
    (w) => w.id === 'samurai-spider-lily-crimson-4k' || w.title?.toLowerCase().includes('crimson')
  ) || wallpapers[0];

  // Local active wallpaper fallback
  const [internalActiveWallpaper, setInternalActiveWallpaper] = useState<Wallpaper>(
    propActiveWallpaper || defaultSamuraiWallpaper
  );

  useEffect(() => {
    if (propActiveWallpaper) {
      setInternalActiveWallpaper(propActiveWallpaper);
    }
  }, [propActiveWallpaper]);

  const currentWallpaper = propActiveWallpaper || internalActiveWallpaper;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Single Canonical Windows Environment State
  const [windowsConfig, setWindowsConfig] = useState<WindowsEnvironmentConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_WINDOWS_CONFIG,
          ...parsed,
          wallpaper: {
            ...DEFAULT_WINDOWS_CONFIG.wallpaper,
            ...(parsed.wallpaper || {}),
          },
          desktop: {
            ...DEFAULT_WINDOWS_CONFIG.desktop,
            ...(parsed.desktop || {}),
          },
          icons: {
            ...DEFAULT_WINDOWS_CONFIG.icons,
            ...(parsed.icons || {}),
            items: parsed.icons?.items || DEFAULT_WINDOWS_CONFIG.icons.items,
          },
          taskbar: {
            ...DEFAULT_WINDOWS_CONFIG.taskbar,
            ...(parsed.taskbar || {}),
          },
          systemUI: {
            ...DEFAULT_WINDOWS_CONFIG.systemUI,
            ...(parsed.systemUI || {}),
          },
          effects: {
            ...DEFAULT_WINDOWS_CONFIG.effects,
            ...(parsed.effects || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved windows environment config', e);
    }
    return DEFAULT_WINDOWS_CONFIG;
  });

  // Selected icon on desktop for Inspector
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Active customization tab
  const [activeTab, setActiveTab] = useState<
    'wallpaper' | 'desktop' | 'icons' | 'taskbar' | 'system' | 'effects'
  >('wallpaper');

  // Handle wallpaper change
  const handleSelectWallpaper = (w: Wallpaper) => {
    setInternalActiveWallpaper(w);
    if (onSelectWallpaper) {
      onSelectWallpaper(w);
    }
    setWindowsConfig((prev) => ({
      ...prev,
      wallpaper: {
        ...prev.wallpaper,
        id: w.id,
      },
    }));
  };

  // Save Configuration to LocalStorage
  const handleSaveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(windowsConfig));
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      if (onShowToast) {
        onShowToast(
          typeof onShowToast === 'function'
            ? {
                title: 'Windows 11 Preset Saved',
                subtitle: 'Active customization saved to local browser storage.',
              }
            : 'Configuration saved successfully!'
        );
      }
    } catch (err) {
      console.error('Failed to save config', err);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setWindowsConfig(DEFAULT_WINDOWS_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (onShowToast) {
      onShowToast(
        typeof onShowToast === 'function'
          ? {
              title: 'Defaults Restored',
              subtitle: 'Windows 11 desktop layout reset to standard profile.',
            }
          : 'Restored default settings'
      );
    }
  };

  // Verify Output HTML (Standalone HTML output)
  const handleVerifyOutputHtml = () => {
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Windows 11 Desktop Studio - Verified Output</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #000;
      position: relative;
    }
    .wallpaper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: ${windowsConfig.wallpaper.fit === 'contain' ? 'contain' : 'cover'};
      z-index: 1;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 28px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
      z-index: 100;
    }
    .menu-items {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .status-items {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
    }
    .dock-container {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .dock-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .dock-icon:hover {
      transform: scale(1.25) translateY(-8px);
    }
    .dock-divider {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.25);
      margin: 0 4px;
      align-self: center;
    }
    .badge {
      position: absolute;
      top: 40px;
      right: 20px;
      background: rgba(14, 165, 233, 0.25);
      border: 1px solid rgba(14, 165, 233, 0.5);
      color: #38bdf8;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-family: monospace;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="menu-items">
      <span style="font-weight: 700;"></span>
      <span style="font-weight: 600;">Finder</span>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span>Go</span>
      <span>Window</span>
      <span>Help</span>
    </div>
    <div class="status-items">
      <span>89% 🔋</span>
      <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>
  <img class="wallpaper" src="${currentWallpaper.imageUrl || currentWallpaper.thumbnailUrl}" alt="${currentWallpaper.title}" />
  <div class="badge">1:1 WYSIWYG VERIFIED OUTPUT</div>
  <div class="dock-container">
    <div class="dock-icon" style="background: linear-gradient(135deg, #34d148, #1bb82e);">💬</div>
    <div class="dock-icon" style="background: linear-gradient(135deg, #2ca4fc, #044eb4);">🧭</div>
    <div class="dock-icon" style="background: linear-gradient(135deg, #ff3c69, #db0f37);">🎵</div>
    <div class="dock-icon" style="background: linear-gradient(135deg, #3ba2ff, #0c62ce);">✉️</div>
    <div class="dock-icon" style="background: #fff; color: #111; font-weight: bold; flex-direction: column; font-size: 11px;"><span>${new Date().getDate()}</span><span>${new Date().toLocaleDateString('en-US', { weekday: 'short' })}</span></div>
    <div class="dock-icon" style="background: #fff;">🌸</div>
    <div class="dock-icon" style="background: #fff;">📝</div>
    <div class="dock-icon" style="background: #fff; font-size: 18px;">⏰</div>
    <div class="dock-icon" style="background: #e60023; color: white;">📌</div>
    <div class="dock-icon" style="background: #000; color: white;">🤖</div>
    <div class="dock-divider"></div>
    <div class="dock-icon" style="background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.3); font-size: 16px;">⊞</div>
  </div>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      if (onShowToast) {
        onShowToast(
          typeof onShowToast === 'function'
            ? {
                title: 'Standalone Output Launched',
                subtitle: 'Showing 1:1 rendered desktop environment',
              }
            : 'Standalone HTML opened in new tab'
        );
      }
    } catch (err) {
      console.error('Failed to open standalone preview', err);
    }
  };

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
      {/* ========================================================================= */}
      {/* TOP WORKSPACE NAVIGATION & CONTROLS HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTargets}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Back to Target Workspaces"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Windows 11 Desktop Studio
            </h1>
          </div>
        </div>

        {/* Global Toolbar Actions: Verify Output HTML & Full Preview */}
        <div className="flex items-center gap-2 sm:gap-2.5 self-start md:self-auto flex-wrap">
          {/* Verify Output HTML button */}
          <button
            onClick={handleVerifyOutputHtml}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-sm"
            title="Open standalone HTML output in new tab to verify that the desktop design applies 1:1"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify Output HTML</span>
          </button>

          {/* Full Preview button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-sm"
            title="Expand desktop preview to full screen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full Preview</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-AREA STRUCTURAL LAYOUT:                                                */}
      {/* LEFT/CENTER: DOMINANT REALISTIC WINDOWS DESKTOP DEVICE MOCKUP            */}
      {/* RIGHT: CUSTOMIZATION / SETTINGS PANEL                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start gap-5 xl:gap-6 w-full">
        {/* ======================================================================= */}
        {/* CENTER WORKSPACE: DEVICE MOCKUP CANVAS (PRIMARY WORKSPACE)               */}
        {/* Contains: Elegant device frame, top header bar, live desktop canvas      */}
        {/* ======================================================================= */}
        <main 
          id="windows-desktop-display-area"
          className="flex-1 min-w-0 w-full lg:w-[62%] xl:w-[65%] 2xl:w-[68%] flex flex-col space-y-2.5"
        >
          {/* ELEGANT DEVICE FRAME / MONITOR PREVIEW MOCKUP CONTAINER */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] xl:min-h-[580px] max-w-5xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#0A0C12] shadow-2xl shadow-black/80 overflow-hidden flex flex-col group/device ring-1 ring-white/10 backdrop-blur-xl">
            {/* SLEEK TOP FRAME HEADER BAR */}
            <div className="relative z-30 flex items-center justify-between px-3.5 py-2.5 bg-black/60 backdrop-blur-xl border-b border-white/10 text-xs select-none">
              {/* Left: Window Traffic Light Dots & Window Tab Badge */}
              <div className="flex items-center gap-3">
                {/* Mac/Modern style traffic light dots */}
                <div className="flex items-center gap-1.5 pr-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[0_0_6px_rgba(255,95,86,0.4)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[0_0_6px_rgba(255,189,46,0.4)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[0_0_6px_rgba(39,201,63,0.4)]" />
                </div>

                {/* Active Window / Tab Badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.08] backdrop-blur-md border border-white/15 text-[11px] font-medium text-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="font-semibold text-white tracking-wide">Windows 11 Live Desktop</span>
                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/30">
                    WYSIWYG
                  </span>
                </div>
              </div>

              {/* Right: Quick Mockup Action Badges */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[200px]">{currentWallpaper?.title || 'Active Wallpaper'}</span>
                </span>
                <button
                  onClick={() => onOpenFullSimulator && currentWallpaper ? onOpenFullSimulator(currentWallpaper) : setIsFullscreen(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* LIVE DESKTOP CANVAS CONTAINER INSIDE THE DEVICE FRAME */}
            <div className="relative flex-1 w-full min-h-0 min-w-0 overflow-hidden bg-black">
              {!isFullscreen && (
                <WindowsDesktopCanvas
                  config={windowsConfig}
                  onChangeConfig={setWindowsConfig}
                  activeWallpaper={currentWallpaper}
                  wallpapers={wallpapers}
                  onSelectWallpaper={handleSelectWallpaper}
                  selectedIconId={selectedIconId}
                  onSelectIcon={setSelectedIconId}
                  onOpenSettingsTab={(tabId) => setActiveTab(tabId as any)}
                />
              )}
            </div>
          </div>

          {/* Bottom small status indicator showing current configuration */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Interactive Desktop Studio Active</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span>Fit: <span className="text-slate-200 capitalize">{windowsConfig.wallpaper.fit || 'Cover'}</span></span>
              <span>•</span>
              <span>Taskbar Blur: <span className="text-slate-200">{windowsConfig.taskbar.blur || 0}px</span></span>
              <span>•</span>
              <span>Vignette: <span className="text-slate-200">{windowsConfig.effects.vignette ? 'ON' : 'OFF'}</span></span>
            </div>
          </div>
        </main>

        {/* ======================================================================= */}
        {/* RIGHT SIDE: CUSTOMIZATION / SETTINGS PANEL (SECONDARY WORKSPACE)         */}
        {/* Contains: Wallpaper, Desktop, Icons, Taskbar, System UI, Effects        */}
        {/* ======================================================================= */}
        <aside 
          id="windows-settings-panel"
          className="w-full lg:w-[360px] xl:w-[400px] 2xl:w-[440px] shrink-0 space-y-3 lg:sticky lg:top-4 self-start"
        >
          <WindowsCustomizationSidebar
            config={windowsConfig}
            onChangeConfig={setWindowsConfig}
            wallpapers={wallpapers}
            activeWallpaper={currentWallpaper}
            onSelectWallpaper={handleSelectWallpaper}
            selectedIconId={selectedIconId}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        </aside>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col justify-between animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 text-white border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                <Monitor className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">
                Windows 11 Desktop Studio — Fullscreen Live WYSIWYG
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </div>
          <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center p-2">
            <div className="relative w-full aspect-[16/9] min-h-[500px] max-h-[85vh] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
              <WindowsDesktopCanvas
                config={windowsConfig}
                onChangeConfig={setWindowsConfig}
                activeWallpaper={currentWallpaper}
                wallpapers={wallpapers}
                onSelectWallpaper={handleSelectWallpaper}
                selectedIconId={selectedIconId}
                onSelectIcon={setSelectedIconId}
                onOpenSettingsTab={(tabId) => setActiveTab(tabId as any)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
