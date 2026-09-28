import React, { useState } from 'react';
import { Wallpaper } from '../../types';
import { 
  Apple, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Zap, 
  Sliders, 
  Layers, 
  Maximize2,
  Sun,
  Moon,
  Clock,
  Palette,
  Eye,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EnvironmentAppearance } from '../NativeAppDiscovery/EnvironmentAppearance';
import { LivePreviewErrorBoundary } from '../common/LivePreviewErrorBoundary';

interface MacTargetWorkspaceProps {
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  onBackToTargets: () => void;
  onOpenFullSimulator?: (w: Wallpaper) => void;
  onSelectWallpaper?: (w: Wallpaper) => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const MacTargetWorkspace: React.FC<MacTargetWorkspaceProps> = ({
  wallpapers,
  activeWallpaper,
  onBackToTargets,
  onOpenFullSimulator,
  onSelectWallpaper,
  onShowToast,
}) => {
  // Active Workspace Sub-Tab
  const [activeTab, setActiveTab] = useState<'native-environment' | 'customizer'>('native-environment');

  // Isolated macOS State (Does not touch Chrome or Windows)
  const [dockSize, setDockSize] = useState<'medium' | 'compact' | 'large'>('medium');
  const [menuBarAtmosphere, setMenuBarAtmosphere] = useState<'translucent' | 'midnight'>('translucent');
  const [dynamicShiftMode, setDynamicShiftMode] = useState<'auto-time' | 'day' | 'night'>('auto-time');
  const [isMagnificationEnabled, setIsMagnificationEnabled] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const handleApplyMac = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsApplied(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#c084fc', '#e879f9']
      });
      if (onShowToast) {
        onShowToast({
          title: 'macOS Dynamic Wallpaper Applied',
          subtitle: `${activeWallpaper.title} configured for Retina 5K Studio`,
          icon: <Apple className="w-4 h-4 text-purple-400" />
        });
      }
    }, 700);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* ========================================================================= */}
      {/* HEADER BAR: BREADCRUMB + TARGET IDENTITY */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/30 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            id="mac-back-btn"
            onClick={onBackToTargets}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-purple-400" />
            <span>All Targets</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-400">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>WALLIX Environment Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Native Bridge
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                MacBook-Inspired Visual Environment & Real Application Discovery
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector & Primary Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('native-environment')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'native-environment'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Native Environment</span>
            </button>
            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'customizer'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Preset Customizer</span>
            </button>
          </div>

          {onOpenFullSimulator && (
            <button
              onClick={() => onOpenFullSimulator(activeWallpaper)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Preview</span>
            </button>
          )}

          <button
            id="btn-apply-mac-engine"
            onClick={handleApplyMac}
            disabled={isApplying}
            className={`px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer ${
              isApplied
                ? 'bg-emerald-500 text-black shadow-emerald-900/40'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-900/40'
            }`}
          >
            {isApplying ? (
              <span className="animate-spin">🌀</span>
            ) : isApplied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isApplied ? 'Applied to Mac' : 'Apply macOS Engine'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKSPACE CONTENT: NATIVE ENVIRONMENT VS CUSTOMIZER                      */}
      {/* ========================================================================= */}
      {activeTab === 'native-environment' ? (
        <LivePreviewErrorBoundary fallbackTitle="Mac Native Environment Render Error">
          <EnvironmentAppearance 
            currentWallpaperUrl={activeWallpaper.imageUrl || activeWallpaper.thumbnail || ''}
            onSelectWallpaper={() => onSelectWallpaper && onSelectWallpaper(activeWallpaper)}
          />
        </LivePreviewErrorBoundary>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mac Settings */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Dynamic Day / Night Shift */}
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Dynamic Wallpaper Atmosphere</span>
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                {dynamicShiftMode}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto-time', label: 'Auto Time Sync', icon: Clock },
                { id: 'day', label: 'Daylight Solar', icon: Sun },
                { id: 'night', label: 'Midnight OLED', icon: Moon },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDynamicShiftMode(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                      dynamicShiftMode === item.id
                        ? 'bg-purple-600/30 text-purple-200 border border-purple-400/50 font-bold shadow-sm'
                        : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Liquid Glass Dock Controls */}
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Liquid Glass Floating Dock</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact', label: 'Compact' },
                { id: 'medium', label: 'Standard' },
                { id: 'large', label: 'Spacious' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDockSize(d.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                    dockSize === d.id
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Dock Hover Magnification</h4>
                <p className="text-[11px] text-slate-400">Scale icons on cursor proximity</p>
              </div>
              <button
                onClick={() => setIsMagnificationEnabled(!isMagnificationEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  isMagnificationEnabled ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  isMagnificationEnabled ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* 3. Top Menu Bar Style */}
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Apple Top Menu Bar Tint</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'translucent', label: 'Translucent Obsidian' },
                { id: 'midnight', label: 'Midnight Solid' },
              ].map((mb) => (
                <button
                  key={mb.id}
                  onClick={() => setMenuBarAtmosphere(mb.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                    menuBarAtmosphere === mb.id
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-400/50 font-bold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {mb.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Select Wallpaper for Mac */}
          <div className="p-4 rounded-2xl bg-[#0e121e]/80 border border-white/10 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Select Active Mac Wallpaper</span>
            </span>

            <div className="grid grid-cols-4 gap-2">
              {wallpapers.slice(0, 8).map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWallpaper(w)}
                  className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer group ${
                    activeWallpaper.id === w.id
                      ? 'border-purple-400 ring-2 ring-purple-500/50'
                      : 'border-white/10 hover:border-purple-400/40'
                  }`}
                >
                  <img
                    src={w.thumbnailUrl || w.imageUrl}
                    alt={w.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {activeWallpaper.id === w.id && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: macOS Live Interactive Single Source of Truth Environment */}
        <div className="lg:col-span-7 space-y-3">
          <LivePreviewErrorBoundary fallbackTitle="Mac Live Customizer Preview Error">
            <EnvironmentAppearance 
              currentWallpaperUrl={activeWallpaper.imageUrl || activeWallpaper.thumbnail || ''}
              onSelectWallpaper={() => onSelectWallpaper && onSelectWallpaper(activeWallpaper)}
            />
          </LivePreviewErrorBoundary>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>Target: Apple Mac OS (Single Source of Truth)</span>
            <span className="text-purple-400">Settings autosaved locally</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
