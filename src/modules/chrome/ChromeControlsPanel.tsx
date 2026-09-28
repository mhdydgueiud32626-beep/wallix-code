import React, { useState, useEffect } from 'react';
import { 
  ChromeNewTabSettings, 
  ChromeShortcut,
  SearchStyle,
  SearchSize,
  SearchPosition,
  ShortcutStyle,
  ShortcutSpacing,
  ThemeAccent,
  WallpaperFit,
  LayoutElementId,
  DEFAULT_LAYOUT_SETTINGS,
} from './types';
import { Wallpaper } from '../../types';
import { WALLPAPER_ADAPTIVE_PRESETS, adaptSettingsToWallpaper } from './wallpaperPresets';
import { 
  ImageIcon, 
  Search, 
  Zap, 
  Sparkles, 
  Palette, 
  Check, 
  Upload, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sliders,
  X,
  AlertCircle,
  Video,
  Layers,
  Wand2,
  LayoutGrid,
  Move,
  Compass,
  Grid,
  MousePointer,
  Pencil,
  Play
} from 'lucide-react';

export type ControlSection = 'background' | 'search' | 'dock' | 'layout' | 'effects' | 'theme';

interface ChromeControlsPanelProps {
  settings: ChromeNewTabSettings;
  shortcuts: ChromeShortcut[];
  wallpapers: Wallpaper[];
  hoveredSection?: ControlSection | null;
  isLayoutEditing?: boolean;
  onToggleLayoutEditing?: (editing: boolean) => void;
  selectedLayoutElement?: LayoutElementId | null;
  onSelectLayoutElement?: (element: LayoutElementId | null) => void;
  onUpdateSettings: (updater: (prev: ChromeNewTabSettings) => ChromeNewTabSettings) => void;
  onUpdateShortcuts: (updater: (prev: ChromeShortcut[]) => ChromeShortcut[]) => void;
  onSave: () => void;
  onApplyToChrome: () => void;
  onExportZip?: () => void;
  onResetDefaults: () => void;
  onSyncTopSites?: () => void;
  onNavigateGallery?: () => void;
  onNavigateLiveWallpapers?: () => void;
  isSaving?: boolean;
}

export const ChromeControlsPanel: React.FC<ChromeControlsPanelProps> = ({
  settings,
  shortcuts,
  wallpapers,
  hoveredSection,
  isLayoutEditing: externalIsLayoutEditing,
  onToggleLayoutEditing,
  selectedLayoutElement: externalSelectedLayoutElement,
  onSelectLayoutElement,
  onUpdateSettings,
  onUpdateShortcuts,
  onSave,
  onApplyToChrome,
  onExportZip,
  onResetDefaults,
  onSyncTopSites,
  onNavigateGallery,
  onNavigateLiveWallpapers,
  isSaving = false,
}) => {
  const [activeSection, setActiveSection] = useState<ControlSection>('background');
  const [newShortcutTitle, setNewShortcutTitle] = useState('');
  const [newShortcutUrl, setNewShortcutUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoReadability, setAutoReadability] = useState(true);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoInputUrl, setVideoInputUrl] = useState(settings.wallpaper.videoUrl || '');

  const [internalSelectedLayoutElement, setInternalSelectedLayoutElement] = useState<LayoutElementId | null>(null);
  const selectedLayoutElement = externalSelectedLayoutElement !== undefined ? externalSelectedLayoutElement : internalSelectedLayoutElement;
  const setSelectedLayoutElement = (elId: LayoutElementId | null) => {
    setInternalSelectedLayoutElement(elId);
    if (onSelectLayoutElement) {
      onSelectLayoutElement(elId);
    }
  };

  const [internalIsLayoutEditing, setInternalIsLayoutEditing] = useState(false);
  const isLayoutEditing = externalIsLayoutEditing !== undefined ? externalIsLayoutEditing : internalIsLayoutEditing;
  const setIsLayoutEditing = (editing: boolean) => {
    setInternalIsLayoutEditing(editing);
    if (onToggleLayoutEditing) {
      onToggleLayoutEditing(editing);
    }
  };

  // Sync activeSection when user hovers a preview element if not actively in layout editing
  useEffect(() => {
    if (hoveredSection && hoveredSection !== 'layout' && !isLayoutEditing) {
      setActiveSection(hoveredSection);
    }
  }, [hoveredSection, isLayoutEditing]);

  // When switching away from layout section, exit layout edit mode
  useEffect(() => {
    if (activeSection !== 'layout' && isLayoutEditing) {
      setIsLayoutEditing(false);
      setSelectedLayoutElement(null);
    }
  }, [activeSection, isLayoutEditing]);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // Layout Undo/Redo history stack
  const [layoutHistory, setLayoutHistory] = useState<Array<typeof DEFAULT_LAYOUT_SETTINGS>>([
    settings.layout || DEFAULT_LAYOUT_SETTINGS
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushLayoutHistory = (newLayout: typeof DEFAULT_LAYOUT_SETTINGS) => {
    setLayoutHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newLayout];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndoLayout = () => {
    if (historyIndex > 0) {
      const prevLayout = layoutHistory[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      onUpdateSettings((prev) => ({
        ...prev,
        layout: { ...prevLayout }
      }));
    }
  };

  const handleRedoLayout = () => {
    if (historyIndex < layoutHistory.length - 1) {
      const nextLayout = layoutHistory[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      onUpdateSettings((prev) => ({
        ...prev,
        layout: { ...nextLayout }
      }));
    }
  };

  // File upload for custom wallpaper with strict size & MIME validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Invalid format. Please upload JPG, PNG, WEBP, or SVG.');
      return;
    }

    // Limit image size to 3.5MB to fit safely into chrome.storage.local quota (max 10MB)
    const MAX_BYTES = 3.5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 3.5MB allowed for extension storage.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) return;
      onUpdateSettings((prev) => ({
        ...prev,
        wallpaper: {
          type: 'image',
          url: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutTitle.trim() || !newShortcutUrl.trim()) return;
    let url = newShortcutUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const newSc: ChromeShortcut = {
      id: `sc-${Date.now()}`,
      title: newShortcutTitle.trim(),
      url,
      initials: newShortcutTitle.trim().slice(0, 2).toUpperCase(),
      gradient: 'from-cyan-400 to-blue-600',
      glowColor: 'rgba(6, 182, 212, 0.4)'
    };
    onUpdateShortcuts((prev) => [...prev, newSc]);
    setNewShortcutTitle('');
    setNewShortcutUrl('');
    setShowAddModal(false);
  };

  const handleDeleteShortcut = (id: string) => {
    onUpdateShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  const sections: { id: ControlSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'background', label: 'Background', icon: ImageIcon },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'dock', label: 'Dock', icon: Zap },
    { id: 'layout', label: 'Layout', icon: LayoutGrid },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'theme', label: 'Theme', icon: Palette },
  ];

  return (
    <div className="w-full flex flex-col rounded-2xl bg-[#0e121d] border border-white/10 shadow-xl overflow-hidden h-full">
      {/* Top Header of Control Panel */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customization</h3>
          </div>
        </div>

        {/* Subtle Reset Action */}
        <button
          onClick={onResetDefaults}
          className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition text-xs flex items-center gap-1.5 cursor-pointer"
          title="Reset to recommended default settings"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span className="text-[11px]">Reset</span>
        </button>
      </div>

      {/* 6 Grouped Section Navigation Tabs */}
      <div className="grid grid-cols-6 p-1 gap-1 bg-black/40 border-b border-white/10 text-xs select-none">
        {sections.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          const isContextHovered = hoveredSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`py-1.5 px-0.5 sm:px-1 rounded-lg text-center transition-all duration-200 ease-out flex flex-col items-center gap-0.5 cursor-pointer relative group focus:outline-none focus:ring-1 focus:ring-cyan-400/40 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-semibold shadow-xs'
                  : isContextHovered
                  ? 'bg-white/10 text-white border border-cyan-400/60 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent hover:border-white/10 hover:shadow-sm'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-y-0.5" />
              <span className="text-[10px] sm:text-[10.5px] tracking-tight truncate max-w-full font-medium transition-colors duration-200">
                {tab.label}
              </span>
              {isContextHovered && (
                <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Controls Scroll Body - Vertically Compressed */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 no-scrollbar text-xs">
        {/* ========================================================================= */}
        {/* 1. BACKGROUND */}
        {/* ========================================================================= */}
        {activeSection === 'background' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Active Wallpaper Card */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Active Wallpaper</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] uppercase font-bold tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                    {settings.wallpaper.fit || 'cover'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-white/5 border border-white/10 text-slate-300 capitalize">
                    {settings.wallpaper.type}
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                {settings.wallpaper.type === 'video' && settings.wallpaper.videoUrl ? (
                  <div className="w-16 h-11 rounded-lg overflow-hidden shrink-0 border border-white/15 shadow-sm bg-black relative">
                    <video
                      src={settings.wallpaper.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-cyan-300">
                      <Play className="w-2 h-2 fill-current" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={settings.wallpaper.url}
                    alt={settings.wallpaper.title}
                    className="w-16 h-11 rounded-lg object-cover shrink-0 border border-white/15 shadow-sm"
                  />
                )}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div 
                    title={settings.wallpaper.title}
                    className="text-xs font-semibold text-white truncate max-w-full"
                  >
                    {settings.wallpaper.title}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">Adaptive UI sync active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WALLPAPER PRESETS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span>Wallpaper Presets</span>
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">Adaptive UI</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {WALLPAPER_ADAPTIVE_PRESETS.slice(0, 2).map((preset) => {
                  const isSelected = settings.wallpaper.type !== 'video' && (settings.wallpaper.url === preset.imageUrl || settings.wallpaper.title === preset.name);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings((prev) =>
                          adaptSettingsToWallpaper(prev, preset, prev.wallpaper.fit, autoReadability)
                        );
                      }}
                      className={`relative p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer group flex items-center gap-2.5 overflow-hidden focus:outline-none ${
                        isSelected
                          ? 'border-cyan-400/80 bg-cyan-950/40 ring-1 ring-cyan-400/50 shadow-sm'
                          : 'border-white/10 hover:border-cyan-400/30 bg-white/[0.02] hover:bg-white/[0.06]'
                      }`}
                    >
                      <img
                        src={preset.imageUrl}
                        alt={preset.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 group-hover:scale-105 transition duration-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate flex items-center justify-between">
                          <span className="truncate">{preset.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-300 shrink-0" />}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate uppercase font-mono mt-0.5">
                          {preset.themeAccent}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GALLERY NAVIGATION ACTION */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => onNavigateGallery?.()}
                className="w-full py-2 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/10 hover:border-cyan-400/40 text-[11px] font-semibold cursor-pointer transition-all duration-180 flex items-center justify-center gap-1.5 shadow-xs group focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
              >
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform duration-180" />
                <span className="truncate">Browse Wallpaper Gallery</span>
              </button>
            </div>

            {/* WALLPAPER FIT: Cover | Fill | Center */}
            <div className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Fit:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['cover', 'fill', 'center'] as WallpaperFit[]).map((fitOption) => {
                  const isActive = (settings.wallpaper.fit || 'cover') === fitOption;
                  return (
                    <button
                      key={fitOption}
                      type="button"
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          wallpaper: { ...prev.wallpaper, fit: fitOption },
                        }))
                      }
                      className={`py-1.5 rounded-lg text-center font-medium capitalize text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-xs'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 border border-white/5'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full border ${isActive ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
                      <span>{fitOption}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OVERLAY: Backdrop Dimming Slider */}
            <div className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Overlay:</span>
                <span className="text-cyan-400 font-mono font-medium">{settings.effects.backdropDim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={settings.effects.backdropDim}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    effects: { ...prev.effects, backdropDim: Number(e.target.value) },
                  }))
                }
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
            </div>

            {/* GLASS READABILITY: [ Auto ✓ ] */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Glass readability:
                </span>
                <span className="text-[10px] text-slate-400">
                  Dynamic contrast balancing over background
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !autoReadability;
                  setAutoReadability(nextVal);
                  if (nextVal) {
                    const preset = WALLPAPER_ADAPTIVE_PRESETS.find(
                      (p) => p.imageUrl === settings.wallpaper.url || p.title === settings.wallpaper.title
                    );
                    if (preset) {
                      onUpdateSettings((prev) =>
                        adaptSettingsToWallpaper(prev, preset, prev.wallpaper.fit, true)
                      );
                    }
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  autoReadability
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                <span>Auto</span>
                {autoReadability ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <span className="w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SEARCH */}
        {/* ========================================================================= */}
        {activeSection === 'search' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Shape & Corner Radius */}
            <div className="space-y-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Glass Shape & Corner Radius
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pill', 'rounded', 'minimal'] as SearchStyle[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateSettings((prev) => ({
                      ...prev,
                      search: { 
                        ...prev.search, 
                        style: st,
                        radius: st === 'pill' ? 36 : st === 'rounded' ? 16 : 8,
                      }
                    }))}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize transition cursor-pointer text-center ${
                      settings.search.style === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Fine Radius Slider */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400 text-[10.5px]">Corner Radius</span>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {settings.search.radius !== undefined 
                      ? `${settings.search.radius}px` 
                      : settings.search.style === 'pill' ? 'Pill (36px)' : settings.search.style === 'rounded' ? '16px' : '8px'}
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="36"
                  value={settings.search.radius ?? (settings.search.style === 'pill' ? 36 : settings.search.style === 'rounded' ? 16 : 8)}
                  onChange={(e) => {
                    const radius = Number(e.target.value);
                    onUpdateSettings((prev) => ({
                      ...prev,
                      search: { 
                        ...prev.search, 
                        radius,
                        style: radius >= 30 ? 'pill' : radius >= 12 ? 'rounded' : 'minimal'
                      }
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>
            </div>

            {/* Size, Width & Position */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">Size Preset</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['compact', 'standard', 'spacious'] as SearchSize[]).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          search: { 
                            ...prev.search, 
                            size: sz,
                            customWidth: sz === 'compact' ? 480 : sz === 'spacious' ? 680 : 580
                          }
                        }))}
                        className={`py-1 text-[10px] capitalize rounded-md transition cursor-pointer text-center ${
                          settings.search.size === sz
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                            : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {sz === 'compact' ? 'Small' : sz === 'standard' ? 'Med' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">Vertical Position</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['center', 'top'] as SearchPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          search: { ...prev.search, position: pos }
                        }))}
                        className={`py-1 text-[10px] capitalize rounded-md transition cursor-pointer text-center ${
                          settings.search.position === pos
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                            : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fine Width Slider */}
              <div className="pt-1 border-t border-white/5">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Custom Search Width</span>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {settings.search.customWidth ?? (settings.search.size === 'compact' ? 480 : settings.search.size === 'spacious' ? 680 : 580)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="380"
                  max="760"
                  step="10"
                  value={settings.search.customWidth ?? (settings.search.size === 'compact' ? 480 : settings.search.size === 'spacious' ? 680 : 580)}
                  onChange={(e) => {
                    const customWidth = Number(e.target.value);
                    const size: SearchSize = customWidth <= 500 ? 'compact' : customWidth >= 650 ? 'spacious' : 'standard';
                    onUpdateSettings((prev) => ({
                      ...prev,
                      search: { ...prev.search, customWidth, size }
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>
            </div>

            {/* Sliders: Blur, Opacity, Border */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Glass Transparency & Rim
              </span>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Frosted Blur</span>
                  <span className="text-cyan-400 font-mono">{settings.search.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.search.blur}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, blur: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Surface Opacity</span>
                  <span className="text-cyan-400 font-mono">{settings.search.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={settings.search.opacity}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, opacity: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Border Crispness</span>
                  <span className="text-cyan-400 font-mono">{settings.search.borderOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={settings.search.borderOpacity}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, borderOpacity: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.search.glow}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, glow: e.target.checked }
                  }))}
                  className="accent-cyan-400"
                />
                <span className="text-[10.5px] text-slate-300">Subtle Glow</span>
              </label>

              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.search.showAiMode}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, showAiMode: e.target.checked }
                  }))}
                  className="accent-cyan-400"
                />
                <span className="text-[10.5px] text-slate-300">AI Badge</span>
              </label>

              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.search.showLogo}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    search: { ...prev.search, showLogo: e.target.checked }
                  }))}
                  className="accent-cyan-400"
                />
                <span className="text-[10.5px] text-slate-300">Brand Logo</span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DOCK */}
        {/* ========================================================================= */}
        {activeSection === 'dock' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Dock Style */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Shortcut Shape & Style
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'glass-card' as ShortcutStyle, label: 'Frosted Card' },
                  { id: 'glass-pill' as ShortcutStyle, label: 'Circular Pill' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, style: st.id }
                    }))}
                    className={`py-1.5 text-xs rounded-lg transition cursor-pointer text-center ${
                      settings.shortcuts.style === st.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcut Dimensions: Icon Size & Label Size */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Shortcut Icon & Typography Sizing
              </span>

              {/* Icon Size */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Icon Button Size</span>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {settings.shortcuts.iconSize ?? 48}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="32"
                    max="64"
                    step="2"
                    value={settings.shortcuts.iconSize ?? 48}
                    onChange={(e) => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, iconSize: Number(e.target.value) }
                    }))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[36, 48, 56, 64].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          shortcuts: { ...prev.shortcuts, iconSize: sz }
                        }))}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                          (settings.shortcuts.iconSize ?? 48) === sz
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Label Size */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Label Font Size</span>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {(settings.shortcuts.labelSize ?? 11.5).toFixed(1)}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="9"
                    max="14"
                    step="0.5"
                    value={settings.shortcuts.labelSize ?? 11.5}
                    onChange={(e) => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, labelSize: Number(e.target.value) }
                    }))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[10, 11.5, 13].map((ls) => (
                      <button
                        key={ls}
                        type="button"
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          shortcuts: { ...prev.shortcuts, labelSize: ls }
                        }))}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                          (settings.shortcuts.labelSize ?? 11.5) === ls
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {ls}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing: Presets & Fine Slider */}
            <div className="space-y-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-300">Dock Shortcut Spacing</span>
                <span className="text-cyan-400 font-mono text-[10.5px]">
                  {settings.shortcuts.spacingPx ?? (settings.shortcuts.spacing === 'tight' ? 12 : settings.shortcuts.spacing === 'loose' ? 24 : 18)}px
                </span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  { sp: 'tight' as ShortcutSpacing, px: 12, label: 'Tight' },
                  { sp: 'normal' as ShortcutSpacing, px: 18, label: 'Normal' },
                  { sp: 'loose' as ShortcutSpacing, px: 24, label: 'Loose' },
                ].map(({ sp, px, label }) => (
                  <button
                    key={sp}
                    onClick={() => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, spacing: sp, spacingPx: px }
                    }))}
                    className={`py-1 text-[10px] capitalize rounded-md transition cursor-pointer text-center ${
                      settings.shortcuts.spacing === sp
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Continuous Spacing Slider */}
              <input
                type="range"
                min="8"
                max="36"
                step="2"
                value={settings.shortcuts.spacingPx ?? (settings.shortcuts.spacing === 'tight' ? 12 : settings.shortcuts.spacing === 'loose' ? 24 : 18)}
                onChange={(e) => {
                  const spacingPx = Number(e.target.value);
                  const spacing: ShortcutSpacing = spacingPx <= 13 ? 'tight' : spacingPx >= 22 ? 'loose' : 'normal';
                  onUpdateSettings((prev) => ({
                    ...prev,
                    shortcuts: { ...prev.shortcuts, spacingPx, spacing }
                  }));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg mt-1"
              />
            </div>

            {/* Sliders: Opacity, Blur, Border */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Shortcut Glass Appearance
              </span>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Dock Opacity</span>
                  <span className="text-cyan-400 font-mono">{settings.shortcuts.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={settings.shortcuts.opacity}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    shortcuts: { ...prev.shortcuts, opacity: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Dock Blur</span>
                  <span className="text-cyan-400 font-mono">{settings.shortcuts.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={settings.shortcuts.blur}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    shortcuts: { ...prev.shortcuts, blur: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Border Crispness</span>
                  <span className="text-cyan-400 font-mono">{settings.shortcuts.borderOpacity ?? 22}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={settings.shortcuts.borderOpacity ?? 22}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    shortcuts: { ...prev.shortcuts, borderOpacity: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>
            </div>

            {/* Shortcut Hover & Interaction */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Shortcut Hover Dynamics
              </span>

              {/* Hover Scale */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-300">Hover Scale</span>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {(settings.shortcuts.hoverScale ?? 1.08).toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="1.00"
                    max="1.25"
                    step="0.01"
                    value={settings.shortcuts.hoverScale ?? 1.08}
                    onChange={(e) => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, hoverScale: Number(e.target.value) }
                    }))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[1.00, 1.04, 1.08, 1.12].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          shortcuts: { ...prev.shortcuts, hoverScale: sc }
                        }))}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                          Math.abs((settings.shortcuts.hoverScale ?? 1.08) - sc) < 0.005
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sc.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover Lift */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-baseline text-[11px] mb-0.5">
                  <div>
                    <span className="text-slate-300 font-medium">Hover Lift</span>
                    <p className="text-[10px] text-slate-400/90 leading-tight">How far shortcuts rise on hover.</p>
                  </div>
                  <span className="text-cyan-400 font-mono text-[10.5px]">
                    {settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4}px
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="1"
                    value={settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        shortcuts: { ...prev.shortcuts, hoverLift: val, liftDistance: val }
                      }));
                    }}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[0, 4, 8, 12, 16].map((lift) => (
                      <button
                        key={lift}
                        type="button"
                        onClick={() => onUpdateSettings((prev) => ({
                          ...prev,
                          shortcuts: { ...prev.shortcuts, hoverLift: lift, liftDistance: lift }
                        }))}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                          (settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4) === lift
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lift}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Show Labels Toggle */}
              <div className="pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition">
                  <input
                    type="checkbox"
                    checked={settings.shortcuts.showLabels}
                    onChange={(e) => onUpdateSettings((prev) => ({
                      ...prev,
                      shortcuts: { ...prev.shortcuts, showLabels: e.target.checked }
                    }))}
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 select-none">Show Shortcut Labels</span>
                </label>
              </div>
            </div>

            {/* Shortcuts List & Inline Add Form */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Shortcuts ({shortcuts.length})</span>
                <div className="flex items-center gap-2">
                  {onSyncTopSites && (
                    <button
                      onClick={onSyncTopSites}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold cursor-pointer"
                      title="Sync Chrome Top Sites & browser history"
                    >
                      Sync Top Sites
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Site</span>
                  </button>
                </div>
              </div>

              {showAddModal && (
                <form onSubmit={handleAddShortcut} className="p-2.5 rounded-xl bg-white/[0.04] border border-cyan-400/30 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
                    <span>New Shortcut</span>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Name (e.g. Netflix)"
                    value={newShortcutTitle}
                    onChange={(e) => setNewShortcutTitle(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="URL (e.g. netflix.com)"
                    value={newShortcutUrl}
                    onChange={(e) => setNewShortcutUrl(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer"
                  >
                    Add to Dock
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
                {shortcuts.map((sc) => (
                  <div
                    key={sc.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-slate-300"
                  >
                    <span>{sc.title}</span>
                    <button
                      onClick={() => handleDeleteShortcut(sc.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove site"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. VISUAL DRAG & DROP LAYOUT EDITOR */}
        {/* ========================================================================= */}
        {activeSection === 'layout' && !isLayoutEditing && (
          <div className="space-y-4 animate-fadeIn">
            {/* Visual Intro Banner */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Layout Editor</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-slate-300">
                  Preview Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The preview is currently in normal view mode. Click below to start an interactive layout editing session.
              </p>
            </div>

            {/* Primary Action Button: [ ✎ Edit Layout ] */}
            <button
              id="btn-start-edit-layout"
              type="button"
              onClick={() => {
                setIsLayoutEditing(true);
                setSelectedLayoutElement(null);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Layout</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ACTIVE LAYOUT EDITING SESSION */}
        {/* ========================================================================= */}
        {activeSection === 'layout' && isLayoutEditing && (() => {
          const currentLayout = settings.layout || DEFAULT_LAYOUT_SETTINGS;
          const currentOffset = selectedLayoutElement ? (currentLayout[selectedLayoutElement] || { x: 0, y: 0 }) : { x: 0, y: 0 };

          const elementLabels: Record<LayoutElementId, { name: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
            search: { name: 'Search Bar', subtitle: 'Google / frosted glass bar', icon: Search },
            dock: { name: 'Shortcut Dock', subtitle: 'Speed dials & launch row', icon: Zap },
            weather: { name: 'Weather Widget', subtitle: 'Top-left live forecast', icon: Compass },
            topRight: { name: 'Top Right Controls', subtitle: 'Gmail, images & apps menu', icon: Grid },
          };

          const handleResetElement = () => {
            if (!selectedLayoutElement) return;
            const prevLayout = settings.layout || DEFAULT_LAYOUT_SETTINGS;
            const current = prevLayout[selectedLayoutElement] || { x: 0, y: 0 };
            const nextLayout = {
              ...prevLayout,
              preset: 'custom' as const,
              [selectedLayoutElement]: {
                ...current,
                x: 0,
                y: 0,
                scale: 1,
              },
            };
            pushLayoutHistory(nextLayout);
            onUpdateSettings((prev) => ({
              ...prev,
              layout: nextLayout,
            }));
          };

          const handleResetAllLayout = () => {
            pushLayoutHistory(DEFAULT_LAYOUT_SETTINGS);
            onUpdateSettings((prev) => ({
              ...prev,
              layout: { ...DEFAULT_LAYOUT_SETTINGS },
            }));
          };

          return (
            <div className="space-y-4 animate-fadeIn">
              {/* EDITING STATE HEADER BAR */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Editing Layout</span>
                </div>
                <button
                  type="button"
                  id="btn-done-layout-editing"
                  onClick={() => {
                    setIsLayoutEditing(false);
                    setSelectedLayoutElement(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-400/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>

              {/* Short Instruction */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 leading-relaxed">
                Click an element in the preview to move or resize it.
              </div>

              {/* Selected Element Card */}
              {selectedLayoutElement ? (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-cyan-400/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Selected Element</span>
                      <span className="text-sm font-bold text-white">{elementLabels[selectedLayoutElement].name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLayoutElement(null)}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10.5px] transition cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-black/30 border border-white/5 text-xs font-mono text-slate-300">
                    <span>Position: ({currentOffset.x >= 0 ? `+${currentOffset.x}` : currentOffset.x}px, {currentOffset.y >= 0 ? `+${currentOffset.y}` : currentOffset.y}px)</span>
                    {currentOffset.scale && currentOffset.scale !== 1 && (
                      <span className="text-cyan-400 font-bold">Scale: {currentOffset.scale}×</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetElement}
                    className="w-full py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Element</span>
                  </button>
                </div>
              ) : (
                /* Empty state when no element is selected */
                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/15 text-center space-y-2">
                  <MousePointer className="w-5 h-5 text-cyan-400/80 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">No element selected</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Click any element directly in the preview to select, drag, or resize it freely.
                  </p>
                </div>
              )}

              {/* Clean Bottom Recovery Action & Done */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetAllLayout}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset Layout</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLayoutEditing(false);
                    setSelectedLayoutElement(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 5. EFFECTS */}
        {/* ========================================================================= */}
        {activeSection === 'effects' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* MASTER GLASS INTENSITY & PROPERTIES */}
            <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-cyan-400/20 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Glass Intensity & Material Engine</span>
                </span>
                <span className="text-cyan-400 font-mono text-[11px] font-semibold">
                  {settings.effects.glassIntensity ?? 55}%
                </span>
              </div>

              {/* Glass Intensity Slider */}
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.effects.glassIntensity ?? 55}
                  onChange={(e) => {
                    const glassIntensity = Number(e.target.value);
                    onUpdateSettings((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, glassIntensity }
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>Subtle (0%)</span>
                  <span>Balanced (50%)</span>
                  <span>Vivid Liquid (100%)</span>
                </div>
              </div>

              {/* Master Glass Controls (Opacity, Blur, Border, Radius) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {/* Master Glass Opacity */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Glass Opacity</span>
                    <span className="text-cyan-400 font-mono text-[10.5px]">
                      {settings.effects.glassOpacity ?? settings.search.opacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={settings.effects.glassOpacity ?? settings.search.opacity}
                    onChange={(e) => {
                      const glassOpacity = Number(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassOpacity },
                        search: { ...prev.search, opacity: glassOpacity },
                        shortcuts: { ...prev.shortcuts, opacity: Math.max(10, glassOpacity) },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                </div>

                {/* Master Glass Blur */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Glass Blur</span>
                    <span className="text-cyan-400 font-mono text-[10.5px]">
                      {settings.effects.glassBlur ?? settings.search.blur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={settings.effects.glassBlur ?? settings.search.blur}
                    onChange={(e) => {
                      const glassBlur = Number(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassBlur },
                        search: { ...prev.search, blur: glassBlur },
                        shortcuts: { ...prev.shortcuts, blur: Math.min(30, glassBlur) },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                </div>

                {/* Master Glass Border */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Glass Border Crispness</span>
                    <span className="text-cyan-400 font-mono text-[10.5px]">
                      {settings.effects.glassBorder ?? settings.search.borderOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={settings.effects.glassBorder ?? settings.search.borderOpacity}
                    onChange={(e) => {
                      const glassBorder = Number(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassBorder },
                        search: { ...prev.search, borderOpacity: glassBorder },
                        shortcuts: { ...prev.shortcuts, borderOpacity: Math.min(60, glassBorder) },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                </div>

                {/* Master Glass Radius */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Glass Corner Radius</span>
                    <span className="text-cyan-400 font-mono text-[10.5px]">
                      {settings.effects.glassRadius ?? 20}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="36"
                    step="2"
                    value={settings.effects.glassRadius ?? 20}
                    onChange={(e) => {
                      const glassRadius = Number(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassRadius },
                        search: { 
                          ...prev.search, 
                          radius: glassRadius,
                          style: glassRadius >= 30 ? 'pill' : glassRadius >= 12 ? 'rounded' : 'minimal'
                        }
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex justify-between text-[9.5px] text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassRadius: 0 },
                        search: { ...prev.search, radius: 0, style: 'minimal' }
                      }))}
                      className="hover:text-cyan-400 transition cursor-pointer"
                    >
                      Sharp (0px)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassRadius: 16 },
                        search: { ...prev.search, radius: 16, style: 'rounded' }
                      }))}
                      className="hover:text-cyan-400 transition cursor-pointer"
                    >
                      Rounded (16px)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassRadius: 24 },
                        search: { ...prev.search, radius: 24, style: 'rounded' }
                      }))}
                      className="hover:text-cyan-400 transition cursor-pointer"
                    >
                      Smooth (24px)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, glassRadius: 36 },
                        search: { ...prev.search, radius: 36, style: 'pill' }
                      }))}
                      className="hover:text-cyan-400 transition cursor-pointer"
                    >
                      Pill (36px)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Backdrop Dim & Vignette */}
            <div className="space-y-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Backdrop Dim</span>
                  <span className="text-cyan-400 font-mono">{settings.effects.backdropDim}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={settings.effects.backdropDim}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    effects: { ...prev.effects, backdropDim: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Vignette Depth</span>
                  <span className="text-cyan-400 font-mono">{settings.effects.vignette}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.effects.vignette}
                  onChange={(e) => onUpdateSettings((prev) => ({
                    ...prev,
                    effects: { ...prev.effects, vignette: Number(e.target.value) }
                  }))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
              </div>
            </div>

            {/* Presets - Simplified and User Friendly */}
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Glass Presets
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    name: 'Liquid Crystal',
                    tagline: 'Soft, luminous frosted glass with glowing highlights',
                    action: () => onUpdateSettings((prev) => ({
                      ...prev,
                      search: { ...prev.search, blur: 24, opacity: 38, borderOpacity: 22, style: 'pill', radius: 36, glow: false },
                      shortcuts: { ...prev.shortcuts, blur: 20, opacity: 45, borderOpacity: 22, style: 'glass-card' },
                      effects: { ...prev.effects, glassIntensity: 65, glassOpacity: 38, glassBlur: 24, glassBorder: 22, glassRadius: 36 }
                    }))
                  },
                  {
                    name: 'Minimal Glass',
                    tagline: 'Clean, subtle crystal transparency',
                    action: () => onUpdateSettings((prev) => ({
                      ...prev,
                      search: { ...prev.search, blur: 14, opacity: 18, borderOpacity: 15, style: 'minimal', radius: 14, glow: false },
                      shortcuts: { ...prev.shortcuts, blur: 12, opacity: 20, borderOpacity: 15, style: 'glass-pill' },
                      effects: { ...prev.effects, glassIntensity: 30, glassOpacity: 18, glassBlur: 14, glassBorder: 15, glassRadius: 16 }
                    }))
                  },
                  {
                    name: 'Obsidian Glass',
                    tagline: 'Dark, dramatic frosted luxury depth',
                    action: () => onUpdateSettings((prev) => ({
                      ...prev,
                      search: { ...prev.search, blur: 32, opacity: 65, borderOpacity: 30, style: 'rounded', radius: 20, glow: true },
                      shortcuts: { ...prev.shortcuts, blur: 28, opacity: 60, borderOpacity: 30, style: 'glass-card' },
                      effects: { ...prev.effects, glassIntensity: 85, glassOpacity: 65, glassBlur: 32, glassBorder: 30, glassRadius: 20 }
                    }))
                  }
                ].map((pr, idx) => (
                  <button
                    key={idx}
                    onClick={pr.action}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-400/40 transition cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                        {pr.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pr.tagline}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">Apply</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. THEME */}
        {/* ========================================================================= */}
        {activeSection === 'theme' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Restrained Color Accent
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { id: 'cyan' as ThemeAccent, color: '#06b6d4', label: 'Cyan' },
                  { id: 'purple' as ThemeAccent, color: '#c084fc', label: 'Purple' },
                  { id: 'blue' as ThemeAccent, color: '#60a5fa', label: 'Blue' },
                  { id: 'emerald' as ThemeAccent, color: '#34d399', label: 'Emerald' },
                  { id: 'amber' as ThemeAccent, color: '#fbbf24', label: 'Amber' },
                  { id: 'rose' as ThemeAccent, color: '#f43f5e', label: 'Crimson' },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onUpdateSettings((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, themeAccent: acc.id }
                    }))}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 border transition cursor-pointer ${
                      settings.effects.themeAccent === acc.id
                        ? 'border-white bg-white/10 shadow-sm'
                        : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span className="text-[10px] text-slate-300">{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400/80 leading-relaxed pt-2 border-t border-white/10">
              The selected accent adds subtle specular tints to focus rings, active hover states, and frosted glass edges.
            </p>
          </div>
        )}
      </div>

      {/* Action Area: Single Clean Primary CTA */}
      <div className="p-3.5 border-t border-white/10 bg-[#090d16]">
        {/* PRIMARY CTA: Apply to Chrome */}
        <button
          id="btn-apply-to-chrome"
          onClick={onApplyToChrome}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Apply to Chrome</span>
        </button>
      </div>
    </div>
  );
};
