import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock as ClockIcon, 
  CloudSun, 
  Music, 
  Calendar as CalendarIcon, 
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Palette,
  Sliders,
  Compass,
  Folder,
  Terminal,
  Settings as SettingsIcon,
  Trash2,
  Check,
  Zap,
  Share2,
  Sun,
  Moon,
  Bot,
  LayoutGrid,
  Lock,
  Unlock,
  Grid,
  RotateCcw,
  Move,
  LayoutTemplate,
  Download,
  Upload
} from 'lucide-react';
import { WidgetId, WidgetLayoutState, WidgetLayoutItem, AlignmentGuide } from '../../desktop/types';
import { ColorGradePreset, THEME_PRESETS, getTimeBasedLutPreset } from '../../data/colorPresets';
import { DESKTOP_SKETCH_PRESETS, DesktopPresetItem, ClockDisplayMode } from '../../data/layoutPresets';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';
import { MusicWidget } from './MusicWidget';
import { CalendarWidget } from './CalendarWidget';
import { AICompanionWidget } from './AICompanionWidget';
import { MacAppDock } from './MacAppDock';
import { DraggableWidgetWrapper } from './DraggableWidgetWrapper';
import { AlignmentGuides } from './AlignmentGuides';
import { LayoutToolbar } from './LayoutToolbar';
import { downloadFile } from '../../desktop/backgroundEngine';

interface FloatingWidgetOverlayProps {
  containerRef?: React.RefObject<HTMLDivElement>;
  depthInterleavedClockOnly?: boolean;
  onToggleDepthCutout?: () => void;
  isDepthCutoutActive?: boolean;
  activeColorTheme?: ColorGradePreset;
  colorIntensity?: number;
  onSelectColorTheme?: (preset: ColorGradePreset) => void;
  onChangeColorIntensity?: (intensity: number) => void;
  onOpenPublishModal?: () => void;
  isAutoTimeSync?: boolean;
  onToggleAutoTimeSync?: () => void;
}

const DEFAULT_VISIBILITY: Record<WidgetId, boolean> = {
  clock: true,
  calendar: true,
  music: true,
  weather: true,
  companion: true,
  dock: true,
};

const getDefaultWidgetLayout = (): WidgetLayoutState => {
  const isBrowser = typeof window !== 'undefined';
  const vw = isBrowser ? window.innerWidth : 1440;
  const vh = isBrowser ? window.innerHeight : 900;

  return DESKTOP_SKETCH_PRESETS[0].getLayouts(vw, vh);
};

export const FloatingWidgetOverlay: React.FC<FloatingWidgetOverlayProps> = ({
  containerRef,
  depthInterleavedClockOnly = false,
  onToggleDepthCutout,
  isDepthCutoutActive = false,
  activeColorTheme = THEME_PRESETS[0],
  colorIntensity = 0.4,
  onSelectColorTheme,
  onChangeColorIntensity,
  onOpenPublishModal,
  isAutoTimeSync = false,
  onToggleAutoTimeSync,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Preset ID State (preset_1_analog_suite vs preset_2_minimal_digital_dock)
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('wallix_active_preset_id');
      if (saved) return saved;
    } catch {}
    return 'preset_1_analog_suite';
  });

  // Clock Display Mode (analog dial vs digital 01:21:25)
  const [clockMode, setClockMode] = useState<ClockDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('wallix_clock_mode');
      if (saved === 'analog' || saved === 'digital') return saved;
    } catch {}
    return 'analog';
  });

  // Widget Visibility State
  const [visibility, setVisibility] = useState<Record<WidgetId, boolean>>(() => {
    try {
      const saved = localStorage.getItem('wallix_widget_visibility_sonoma');
      if (saved) {
        return { ...DEFAULT_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_VISIBILITY;
  });

  // Widget Layouts (Positions, Sizes, Z-Indices)
  const [layouts, setLayouts] = useState<WidgetLayoutState>(() => {
    try {
      const saved = localStorage.getItem('wallix_widget_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = getDefaultWidgetLayout();
        return {
          ...defaults,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Failed to parse widget layout storage', e);
    }
    return getDefaultWidgetLayout();
  });

  // Lock / Unlock Mode State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wallix_widgets_locked');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return false;
  });

  // 15px Grid-Snapping State
  const [snapToGrid, setSnapToGrid] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wallix_grid_snap');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  // Dynamic Alignment Guide Lines
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Drawer Open State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Save Layout Helper
  const saveLayouts = (updated: WidgetLayoutState) => {
    setLayouts(updated);
    try {
      localStorage.setItem('wallix_widget_positions', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Switch Preset Handler
  const handleSelectPreset = (preset: DesktopPresetItem) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    
    const newLayouts = preset.getLayouts(vw, vh);
    saveLayouts(newLayouts);
    
    setVisibility(preset.widgetsVisibility);
    try {
      localStorage.setItem('wallix_widget_visibility_sonoma', JSON.stringify(preset.widgetsVisibility));
      localStorage.setItem('wallix_active_preset_id', preset.id);
      localStorage.setItem('wallix_clock_mode', preset.clockMode);
    } catch {}

    setActivePresetId(preset.id);
    setClockMode(preset.clockMode);

    if (preset.colorThemeId && onSelectColorTheme) {
      const themeMatch = THEME_PRESETS.find((t) => t.id === preset.colorThemeId);
      if (themeMatch) {
        onSelectColorTheme(themeMatch);
        if (onChangeColorIntensity && preset.colorIntensity) {
          onChangeColorIntensity(preset.colorIntensity);
        }
      }
    }
  };

  // Export current layout config to JSON
  const handleExportPresetJson = () => {
    const exportConfig = {
      presetId: activePresetId,
      clockMode,
      visibility,
      layouts,
      colorTheme: activeColorTheme.id,
      colorIntensity,
      exportedAt: new Date().toISOString(),
    };

    downloadFile(
      JSON.stringify(exportConfig, null, 2),
      `wallix_desktop_preset_${activePresetId}.json`,
      'application/json'
    );
  };

  // Import JSON preset config
  const handleImportPresetJson = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.layouts) {
          saveLayouts(parsed.layouts);
        }
        if (parsed.visibility) {
          setVisibility(parsed.visibility);
          try {
            localStorage.setItem('wallix_widget_visibility_sonoma', JSON.stringify(parsed.visibility));
          } catch {}
        }
        if (parsed.clockMode) {
          setClockMode(parsed.clockMode);
          try {
            localStorage.setItem('wallix_clock_mode', parsed.clockMode);
          } catch {}
        }
        if (parsed.presetId) {
          setActivePresetId(parsed.presetId);
          try {
            localStorage.setItem('wallix_active_preset_id', parsed.presetId);
          } catch {}
        }
        if (parsed.colorTheme && onSelectColorTheme) {
          const match = THEME_PRESETS.find((t) => t.id === parsed.colorTheme);
          if (match) onSelectColorTheme(match);
        }
      } catch (err) {
        console.error('Failed to parse preset JSON file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Toggle Widget Visibility
  const toggleWidget = (id: WidgetId) => {
    setVisibility((prev) => {
      const updated = {
        ...prev,
        [id]: !prev[id],
      };
      try {
        localStorage.setItem('wallix_widget_visibility_sonoma', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Toggle Lock Mode
  const handleToggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wallix_widgets_locked', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Toggle Snap to Grid
  const handleToggleSnap = () => {
    setSnapToGrid((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wallix_grid_snap', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Reset Layouts to Defaults
  const handleResetLayout = () => {
    const fresh = getDefaultWidgetLayout();
    saveLayouts(fresh);
    setAlignmentGuides([]);
  };

  // Drag Position Change Handler
  const handlePositionChange = (id: WidgetId, x: number, y: number) => {
    setLayouts((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const updated = {
        ...prev,
        [id]: {
          ...item,
          x,
          y,
        },
      };
      try {
        localStorage.setItem('wallix_widget_positions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Resize Size Change Handler
  const handleSizeChange = (id: WidgetId, w: number, h: number) => {
    setLayouts((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const updated = {
        ...prev,
        [id]: {
          ...item,
          w,
          h,
        },
      };
      try {
        localStorage.setItem('wallix_widget_positions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Bring to Front Handler
  const handleBringToFront = (id: WidgetId) => {
    setLayouts((prev) => {
      const maxZ = Math.max(...(Object.values(prev) as WidgetLayoutItem[]).map((i) => i.zIndex || 10), 10);
      const item = prev[id];
      if (!item || item.zIndex === maxZ) return prev;
      const updated = {
        ...prev,
        [id]: {
          ...item,
          zIndex: maxZ + 1,
        },
      };
      try {
        localStorage.setItem('wallix_widget_positions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const autoTimeStatus = getTimeBasedLutPreset();

  // If this instance is purely the interleaved middle-layer clock behind subject cutout
  if (depthInterleavedClockOnly) {
    if (!visibility.clock) return null;
    const clockLayout = layouts.clock;
    return (
      <div 
        className="absolute z-10 pointer-events-none transition-transform duration-300"
        style={{
          transform: `translate3d(${clockLayout.x}px, ${clockLayout.y}px, 0)`,
          width: `${clockLayout.w}px`,
          height: `${clockLayout.h}px`,
        }}
      >
        <ClockWidget depthInterleaved={true} initialMode={clockMode} />
      </div>
    );
  }

  const quickLaunchers = [
    { key: 'F', label: 'Finder', icon: Folder, color: 'hover:border-blue-400 hover:text-blue-300' },
    { key: 'S', label: 'Safari', icon: Compass, color: 'hover:border-cyan-400 hover:text-cyan-300' },
    { key: 'T', label: 'Terminal', icon: Terminal, color: 'hover:border-emerald-400 hover:text-emerald-300' },
    { key: 'M', label: 'Music', icon: Music, color: 'hover:border-pink-400 hover:text-pink-300' },
    { key: 'W', label: 'WALLIX Engine', icon: Sparkles, color: 'hover:border-indigo-400 hover:text-indigo-300' },
    { key: 'S', label: 'Settings', icon: SettingsIcon, color: 'hover:border-slate-300 hover:text-slate-200' },
    { key: 'T', label: 'Trash', icon: Trash2, color: 'hover:border-rose-400 hover:text-rose-300' },
  ];

  const allLayoutItems = Object.values(layouts);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      
      {/* Hidden File Input for JSON preset import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* ========================================================================= */}
      {/* 0. DYNAMIC CYAN ALIGNMENT GUIDES (While Dragging/Resizing) */}
      {/* ========================================================================= */}
      <AlignmentGuides guides={alignmentGuides} />

      {/* ========================================================================= */}
      {/* 3. COLLAPSIBLE DOCK DRAWER & GLOBAL COLOR GRADING THEME OVERLAY */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-40 flex flex-col items-center">
        
        {/* EXPANDABLE FLOATING GLASS DRAWER PANEL */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mb-3 w-[94vw] max-w-xl max-h-[80vh] overflow-y-auto scrollbar-none rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl shadow-cyan-950/70 text-white space-y-3.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Customization & Color LUTs</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Live filters and time sync</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Hide Drawer
                </button>
              </div>

              {/* SECTION: GLOBAL COLOR GRADING, 0-100% SCRUB SLIDER & AUTO TIME-SYNC */}
              {onSelectColorTheme && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Color Grading & Live LUT Filters</span>
                    </label>

                    {/* Auto Time-Sync LUT Toggle Switch */}
                    {onToggleAutoTimeSync && (
                      <button
                        onClick={onToggleAutoTimeSync}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                          isAutoTimeSync
                            ? 'bg-gradient-to-r from-amber-500/30 to-indigo-500/30 border-amber-400/50 text-amber-200 shadow-md shadow-amber-500/20'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Auto Shift: 6AM-6PM Warm Vintage (20%) | 6PM-6AM Cool OLED Blue (40%)"
                      >
                        {autoTimeStatus.isDaytime ? (
                          <Sun className={`w-3 h-3 ${isAutoTimeSync ? 'text-amber-400 animate-spin-slow' : 'text-slate-400'}`} />
                        ) : (
                          <Moon className={`w-3 h-3 ${isAutoTimeSync ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                        )}
                        <span>Auto Time-Sync: {isAutoTimeSync ? 'ON' : 'OFF'}</span>
                      </button>
                    )}
                  </div>

                  {/* Auto Time Status Banner if active */}
                  {isAutoTimeSync && (
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between text-[10px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {autoTimeStatus.isDaytime ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span className="font-semibold text-white">{autoTimeStatus.timeLabel}</span>
                      </div>
                      <span className="font-mono text-cyan-300 font-bold">
                        Auto LUT: {autoTimeStatus.preset.name} ({Math.round(autoTimeStatus.intensity * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Color Preset Selector Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = activeColorTheme.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onSelectColorTheme(preset);
                            if (onChangeColorIntensity) {
                              onChangeColorIntensity(preset.defaultOpacity);
                            }
                          }}
                          className={`p-2 rounded-xl border flex flex-col items-start gap-1 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30 scale-102 border-cyan-300'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`w-3.5 h-3.5 rounded-full ${preset.previewGradient} shadow-sm border border-white/20`} />
                            {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] font-bold truncate max-w-full ${isSelected ? 'text-slate-950' : 'text-slate-200'}`}>
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive 0-100% Range Scrub Slider */}
                  {onChangeColorIntensity && (
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Filter Intensity / Blend Opacity:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={colorIntensity}
                          onChange={(e) => onChangeColorIntensity(parseFloat(e.target.value))}
                          className="w-28 sm:w-40 accent-cyan-400 cursor-pointer h-2 bg-white/20 rounded-lg"
                        />
                        <span className="text-[11px] font-mono font-bold text-cyan-300 min-w-[40px] text-right">
                          {Math.round(colorIntensity * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: PUBLISH / SHARE TO COMMUNITY MARKETPLACE */}
              {onOpenPublishModal && (
                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenPublishModal();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:via-indigo-500/30 hover:to-purple-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer group shadow-lg"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                    <span>Publish Setup to Community Hub</span>
                  </button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* MACOS SONOMA BOTTOM-CENTER HORIZONTAL APP LAUNCH DOCK WITH MAGNIFICATION */}
        <AnimatePresence>
          {visibility.dock && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mb-2"
            >
              <MacAppDock />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SINGLE MINIMALIST GLASS TRIGGER BUTTON */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-2xl border border-cyan-400/40 hover:border-cyan-400 shadow-2xl shadow-cyan-950/60 text-white flex items-center gap-2 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Toggle Dock Customization Drawer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">⚡ Customization & Presets Drawer</span>
          {isDrawerOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-cyan-300" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
          )}
        </button>
      </div>

    </div>
  );
};
