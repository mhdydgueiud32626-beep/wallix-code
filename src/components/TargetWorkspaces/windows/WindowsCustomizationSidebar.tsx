import React from 'react';
import { 
  Eye, 
  Layers, 
  Folder, 
  Clock, 
  Sparkles, 
  Check, 
  Wifi, 
  Volume2, 
  Battery, 
  Flame, 
  Shield, 
  Grid, 
  Sliders, 
  Move,
  RotateCcw,
  HardDrive,
  FolderOpen,
  Network,
  Trash2,
  Settings,
  Cpu,
  Globe,
  Code,
  Laptop,
  Monitor,
  Camera,
  Sun,
  Maximize2,
  Bluetooth
} from 'lucide-react';
import { Wallpaper } from '../../../types';
import { WindowsEnvironmentConfig, DesktopIconKey, DEFAULT_DESKTOP_ICONS } from './types';

interface WindowsCustomizationSidebarProps {
  config: WindowsEnvironmentConfig;
  onChangeConfig: (newConfig: WindowsEnvironmentConfig) => void;
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  onSelectWallpaper: (w: Wallpaper) => void;
  selectedIconId: string | null;
  activeTab: 'wallpaper' | 'desktop' | 'icons' | 'taskbar' | 'system' | 'effects';
  onSelectTab: (tab: 'wallpaper' | 'desktop' | 'icons' | 'taskbar' | 'system' | 'effects') => void;
}

export const WindowsCustomizationSidebar: React.FC<WindowsCustomizationSidebarProps> = ({
  config,
  onChangeConfig,
  wallpapers,
  activeWallpaper,
  onSelectWallpaper,
  selectedIconId,
  activeTab,
  onSelectTab,
}) => {
  const selectedIcon = config.icons.items.find((i) => i.id === selectedIconId);

  const handleResetIconPositions = () => {
    onChangeConfig({
      ...config,
      icons: {
        ...config.icons,
        items: DEFAULT_DESKTOP_ICONS,
      },
    });
  };

  const handleToggleIconVisibility = (id: string) => {
    const updated = config.icons.items.map((i) =>
      i.id === id ? { ...i, visible: !i.visible } : i
    );
    onChangeConfig({
      ...config,
      icons: { ...config.icons, items: updated },
    });
  };

  const isLaptop = (config.device?.type || config.systemUI?.deviceType) === 'laptop';

  return (
    <div className="space-y-3">
      {/* 6 Clean Customization Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-white/10 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'wallpaper', label: 'Wallpaper', icon: <Eye className="w-3.5 h-3.5" /> },
          { id: 'desktop', label: 'Device', icon: <Monitor className="w-3.5 h-3.5" /> },
          { id: 'icons', label: 'Icons', icon: <Folder className="w-3.5 h-3.5" /> },
          { id: 'taskbar', label: 'Taskbar', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'system', label: 'System UI', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'effects', label: 'Effects', icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as any)}
            className={`flex-1 min-w-[64px] py-2 px-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. WALLPAPER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'wallpaper' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Desktop Wallpaper Engine</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 tracking-wide font-semibold">
              Live WYSIWYG
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-medium">Select Active Wallpaper</label>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {wallpapers.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWallpaper(w)}
                  className={`relative aspect-video rounded-xl overflow-hidden border cursor-pointer group transition ${
                    activeWallpaper.id === w.id
                      ? 'border-blue-400 ring-2 ring-blue-500/50 scale-[1.02]'
                      : 'border-white/10 hover:border-blue-400/40'
                  }`}
                >
                  <img
                    src={w.thumbnailUrl || w.imageUrl}
                    alt={w.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* Video / Live indicator */}
                  {(w.isVideo || w.isLive) && (
                    <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[7.5px] font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{w.isVideo ? 'VIDEO' : 'LIVE'}</span>
                    </div>
                  )}

                  {/* Resolution tag */}
                  <div className="absolute bottom-5 right-1 px-1 py-0.5 rounded bg-black/70 text-[7.5px] font-mono text-white/90">
                    {w.resolution?.split(' ')[0] || '4K'}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1">
                    <p className="text-[9px] text-white truncate font-medium px-0.5">{w.title}</p>
                  </div>
                  {activeWallpaper.id === w.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Background Fit */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="text-[11px] text-slate-400 font-medium">Wallpaper Scaling Fit</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cover', 'contain'] as const).map((fit) => (
                <button
                  key={fit}
                  onClick={() => onChangeConfig({
                    ...config,
                    wallpaper: { ...config.wallpaper, fit }
                  })}
                  className={`py-1.5 px-2 rounded-xl text-xs capitalize transition cursor-pointer text-center ${
                    config.wallpaper.fit === fit
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {fit === 'cover' ? 'Fill Screen (Cover)' : 'Fit Center (Contain)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DESKTOP & DEVICE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'desktop' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Simulated Device & Canvas Frame</span>
          </span>

          {/* Device Type Selection (Laptop vs Desktop) */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-medium">Device Profile</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig({
                  ...config,
                  device: { ...config.device, type: 'laptop' },
                  systemUI: { ...config.systemUI, deviceType: 'laptop' }
                })}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  isLaptop
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-400/60 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <Laptop className="w-4 h-4 text-blue-400" />
                <span>Laptop Mode</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeConfig({
                  ...config,
                  device: { ...config.device, type: 'desktop' },
                  systemUI: { ...config.systemUI, deviceType: 'desktop' }
                })}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  !isLaptop
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-400/60 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Desktop Mode</span>
              </button>
            </div>
          </div>

          {/* Frame Thickness & Radius */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Screen Brightness</span>
                </span>
                <span className="font-mono text-amber-400">{config.device?.brightness ?? 100}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={config.device?.brightness ?? 100}
                onChange={(e) => onChangeConfig({
                  ...config,
                  device: { ...config.device, brightness: parseInt(e.target.value) }
                })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Top Bar Toggle */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <p className="text-xs font-semibold text-white">Top System Bar</p>
                <p className="text-[10px] text-slate-400">Integrated software status & indicators</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  device: { ...config.device, showTopBar: !config.device?.showTopBar }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.device?.showTopBar ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.device?.showTopBar ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Desktop Canvas Toggles */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <p className="text-xs font-semibold text-white">Show Desktop Icons</p>
                <p className="text-[10px] text-slate-400">Toggles visibility of all desktop items</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  desktop: { ...config.desktop, showIcons: !config.desktop.showIcons }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.desktop.showIcons ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.desktop.showIcons ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <p className="text-xs font-semibold text-white">Snap to Grid</p>
                <p className="text-[10px] text-slate-400">Align dragged icons to invisible grid steps</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  desktop: { ...config.desktop, snapToGrid: !config.desktop.snapToGrid },
                  icons: { ...config.icons, snapToGrid: !config.desktop.snapToGrid }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.desktop.snapToGrid ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.desktop.snapToGrid ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <p className="text-xs font-semibold text-white">Show Icon Text Labels</p>
                <p className="text-[10px] text-slate-400">Displays names under icons</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  desktop: { ...config.desktop, showLabels: !config.desktop.showLabels },
                  icons: { ...config.icons, showLabels: !config.desktop.showLabels }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.desktop.showLabels ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.desktop.showLabels ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetIconPositions}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset All Icons to Default Positions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ICONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'icons' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Desktop Icons & Shortcuts</span>
            </span>
            <button
              onClick={handleResetIconPositions}
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Reset Layout
            </button>
          </div>

          {/* Size Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-medium">Icon Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onChangeConfig({
                    ...config,
                    icons: { ...config.icons, size: sz }
                  })}
                  className={`py-1.5 px-2 rounded-xl text-xs capitalize transition cursor-pointer text-center ${
                    config.icons.size === sz
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Spacing Slider */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Icon Spacing</span>
              <span className="font-mono text-blue-400">{config.icons.spacing}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              value={config.icons.spacing}
              onChange={(e) => onChangeConfig({
                ...config,
                icons: { ...config.icons, spacing: parseInt(e.target.value) }
              })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Individual Icon Visibility Toggles & Delete Controls */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-[11px] text-slate-400 font-medium">Default Desktop Items</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {config.icons.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl transition ${
                    selectedIconId === item.id ? 'bg-blue-600/20 border border-blue-500/40' : 'bg-white/[0.03]'
                  }`}
                >
                  <span className={`text-xs font-medium truncate pr-2 ${item.visible ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title={item.visible ? 'Hide icon from desktop' : 'Show icon on desktop'}
                      onClick={() => handleToggleIconVisibility(item.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        item.visible ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        item.visible ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                    <button
                      type="button"
                      title="Delete / Remove icon from desktop"
                      onClick={() => {
                        const updated = config.icons.items.map((i) =>
                          i.id === item.id ? { ...i, visible: false } : i
                        );
                        onChangeConfig({
                          ...config,
                          icons: { ...config.icons, items: updated },
                        });
                      }}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SELECTED ICON INSPECTOR */}
          {selectedIcon && (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-blue-400" />
                  <span>Selected Icon Inspector</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  X:{selectedIcon.x} Y:{selectedIcon.y}
                </span>
              </div>

              {/* Label Edit */}
              <div>
                <label className="text-[10px] text-slate-400">Rename Icon Label</label>
                <input
                  type="text"
                  value={selectedIcon.label}
                  onChange={(e) => {
                    const updated = config.icons.items.map((i) =>
                      i.id === selectedIcon.id ? { ...i, label: e.target.value } : i
                    );
                    onChangeConfig({
                      ...config,
                      icons: { ...config.icons, items: updated },
                    });
                  }}
                  className="w-full mt-1 bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Icon Type Picker */}
              <div>
                <label className="text-[10px] text-slate-400">Icon Graphic</label>
                <div className="grid grid-cols-5 gap-1.5 mt-1">
                  {[
                    { key: 'this-pc', icon: <HardDrive className="w-3.5 h-3.5" /> },
                    { key: 'projects', icon: <FolderOpen className="w-3.5 h-3.5" /> },
                    { key: 'network', icon: <Network className="w-3.5 h-3.5" /> },
                    { key: 'recycle-bin', icon: <Trash2 className="w-3.5 h-3.5" /> },
                    { key: 'control-panel', icon: <Settings className="w-3.5 h-3.5" /> },
                    { key: 'terminal', icon: <Cpu className="w-3.5 h-3.5" /> },
                    { key: 'browser', icon: <Globe className="w-3.5 h-3.5" /> },
                    { key: 'code', icon: <Code className="w-3.5 h-3.5" /> },
                    { key: 'folder', icon: <Folder className="w-3.5 h-3.5" /> },
                    { key: 'wallpapers', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  ].map((g) => (
                    <button
                      key={g.key}
                      onClick={() => {
                        const updated = config.icons.items.map((i) =>
                          i.id === selectedIcon.id ? { ...i, iconKey: g.key as DesktopIconKey } : i
                        );
                        onChangeConfig({
                          ...config,
                          icons: { ...config.icons, items: updated },
                        });
                      }}
                      className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${
                        selectedIcon.iconKey === g.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {g.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete Icon Button inside Inspector */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const updated = config.icons.items.map((i) =>
                      i.id === selectedIcon.id ? { ...i, visible: false } : i
                    );
                    onChangeConfig({
                      ...config,
                      icons: { ...config.icons, items: updated },
                    });
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete / Remove from Desktop</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TASKBAR / DOCK TAB */}
      {/* ========================================================================= */}
      {activeTab === 'taskbar' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Taskbar & Glass Dock Styling</span>
          </span>

          {/* Taskbar Material */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-medium">Glass / Surface Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'frosted', label: 'Frosted Glass' },
                { id: 'translucent', label: 'Translucent' },
                { id: 'solid', label: 'Solid Dark' },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => onChangeConfig({
                    ...config,
                    taskbar: { ...config.taskbar, style: tb.id as any }
                  })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                    config.taskbar.style === tb.id
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Taskbar Blur */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Blur Intensity</span>
              <span className="font-mono text-blue-400">{config.taskbar.blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="36"
              step="2"
              value={config.taskbar.blur}
              onChange={(e) => onChangeConfig({
                ...config,
                taskbar: { ...config.taskbar, blur: parseInt(e.target.value) }
              })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Taskbar Opacity */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Opacity</span>
              <span className="font-mono text-blue-400">{Math.round(config.taskbar.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={config.taskbar.opacity}
              onChange={(e) => onChangeConfig({
                ...config,
                taskbar: { ...config.taskbar, opacity: parseFloat(e.target.value) }
              })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Taskbar Height */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Dock Height</span>
              <span className="font-mono text-blue-400">{config.taskbar.height}px</span>
            </div>
            <input
              type="range"
              min="38"
              max="64"
              value={config.taskbar.height}
              onChange={(e) => onChangeConfig({
                ...config,
                taskbar: { ...config.taskbar, height: parseInt(e.target.value) }
              })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Alignment */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-[11px] text-slate-400 font-medium">Icon Alignment</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'center', label: 'Centered (Win 11 / Modern)' },
                { id: 'left', label: 'Left (Classic)' },
              ].map((al) => (
                <button
                  key={al.id}
                  onClick={() => onChangeConfig({
                    ...config,
                    taskbar: { ...config.taskbar, alignment: al.id as any }
                  })}
                  className={`py-1.5 px-2 rounded-xl text-xs transition cursor-pointer text-center ${
                    config.taskbar.alignment === al.id
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {al.label}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Pill Dock & Magnification & Auto Hide */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
              <div>
                <span className="text-xs text-slate-300 font-medium">Floating Glass Pill Dock</span>
                <p className="text-[9px] text-slate-400">Contained rounded glass dock</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  taskbar: {
                    ...config.taskbar,
                    roundedCorners: config.taskbar.roundedCorners > 0 ? 0 : 16
                  }
                })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.taskbar.roundedCorners > 0 ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.taskbar.roundedCorners > 0 ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
              <div>
                <span className="text-xs text-slate-300 font-medium">Icon Magnification on Hover</span>
                <p className="text-[9px] text-slate-400">Smooth zoom scale transition</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  taskbar: { ...config.taskbar, magnification: !config.taskbar.magnification }
                })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.taskbar.magnification ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.taskbar.magnification ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
              <div>
                <span className="text-xs text-slate-300 font-medium">Auto Hide Taskbar</span>
                <p className="text-[9px] text-slate-400">Slide out when inactive</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  taskbar: { ...config.taskbar, autoHide: !config.taskbar.autoHide }
                })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.taskbar.autoHide ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.taskbar.autoHide ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM UI TAB */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>System Status & Tray Controls</span>
          </span>

          {/* Device Profile Switcher */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Device Mode Indicator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                {isLaptop ? 'Laptop' : 'Desktop'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig({
                  ...config,
                  device: { ...config.device, type: 'laptop' },
                  systemUI: { ...config.systemUI, deviceType: 'laptop' }
                })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isLaptop ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({
                  ...config,
                  device: { ...config.device, type: 'desktop' },
                  systemUI: { ...config.systemUI, deviceType: 'desktop' }
                })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  !isLaptop ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { key: 'showWifi', label: 'Wi-Fi Network Indicator', icon: <Wifi className="w-3.5 h-3.5 text-blue-400" /> },
              { key: 'showBluetooth', label: 'Bluetooth Active Status', icon: <Bluetooth className="w-3.5 h-3.5 text-blue-400" /> },
              { key: 'showVolume', label: 'Master Volume Slider', icon: <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> },
              { key: 'showBattery', label: 'Battery / Power Meter (Laptop)', icon: <Battery className="w-3.5 h-3.5 text-emerald-400" /> },
              { key: 'showNetwork', label: 'Ethernet Activity (Desktop)', icon: <Network className="w-3.5 h-3.5 text-cyan-400" /> },
              { key: 'showClock', label: 'Clock & Calendar Widget', icon: <Clock className="w-3.5 h-3.5 text-indigo-400" /> },
            ].map((item) => {
              const isChecked = (config.systemUI as any)[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                  </div>
                  <button
                    onClick={() => onChangeConfig({
                      ...config,
                      systemUI: {
                        ...config.systemUI,
                        [item.key]: !isChecked
                      }
                    })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      isChecked ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      isChecked ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="text-[11px] text-slate-400 font-medium">Clock Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '12h', label: '12-Hour (AM/PM)' },
                { id: '24h', label: '24-Hour (23:59)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => onChangeConfig({
                    ...config,
                    systemUI: { ...config.systemUI, clockFormat: fmt.id as any }
                  })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-mono transition cursor-pointer text-center ${
                    config.systemUI.clockFormat === fmt.id
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <span className="text-xs text-slate-200 font-medium">Show Date</span>
              <p className="text-[9px] text-slate-400">Renders date under clock</p>
            </div>
            <button
              onClick={() => onChangeConfig({
                ...config,
                systemUI: { ...config.systemUI, showDate: !config.systemUI.showDate }
              })}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.systemUI.showDate ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                config.systemUI.showDate ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EFFECTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'effects' && (
        <div className="p-4 rounded-2xl bg-[#0e121e]/90 border border-white/10 space-y-4 shadow-xl animate-in fade-in duration-150">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Graphics & Rendering Effects</span>
          </span>

          <div className="space-y-3">
            {/* GPU Saver */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>GPU Saver (0% Lag Game Mode)</span>
                </h4>
                <p className="text-[10px] text-slate-400">Auto-throttles shader loop in background</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  effects: { ...config.effects, gpuSaver: !config.effects.gpuSaver }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.effects.gpuSaver ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.effects.gpuSaver ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Audio Reactive */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audio-Reactive Bass Pulse</span>
                </h4>
                <p className="text-[10px] text-slate-400">Syncs depth parallax with music beats</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  effects: { ...config.effects, audioReactive: !config.effects.audioReactive }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.effects.audioReactive ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.effects.audioReactive ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Desktop Vignette */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03]">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cinematic Vignette</span>
                </h4>
                <p className="text-[10px] text-slate-400">Deep edge shadow for contrast focus</p>
              </div>
              <button
                onClick={() => onChangeConfig({
                  ...config,
                  effects: { ...config.effects, vignette: !config.effects.vignette }
                })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  config.effects.vignette ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.effects.vignette ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Shadow Depth Slider */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Edge Shadow Intensity</span>
                <span className="font-mono text-blue-400">{config.effects.shadowDepth}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={config.effects.shadowDepth}
                onChange={(e) => onChangeConfig({
                  ...config,
                  effects: { ...config.effects, shadowDepth: parseInt(e.target.value) }
                })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
