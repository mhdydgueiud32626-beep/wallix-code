import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Grid, 
  RotateCcw, 
  Check, 
  Sparkles, 
  LayoutTemplate, 
  Download, 
  Upload, 
  ChevronDown 
} from 'lucide-react';
import { DESKTOP_SKETCH_PRESETS, DesktopPresetItem } from '../../data/layoutPresets';

interface LayoutToolbarProps {
  isLocked: boolean;
  onToggleLock: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onResetLayout: () => void;
  activePresetId?: string | null;
  onSelectPreset?: (preset: DesktopPresetItem) => void;
  onExportPresetJson?: () => void;
  onImportPresetJson?: () => void;
  isSaved?: boolean;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  isLocked,
  onToggleLock,
  snapToGrid,
  onToggleSnap,
  onResetLayout,
  activePresetId,
  onSelectPreset,
  onExportPresetJson,
  onImportPresetJson,
  isSaved = true,
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  return (
    <div 
      id="wallix-layout-mode-toolbar"
      className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/85 backdrop-blur-2xl border border-cyan-400/40 shadow-2xl shadow-cyan-950/70 text-white select-none pointer-events-auto"
    >
      {/* Lock / Unlock Toggle Button */}
      <button
        onClick={onToggleLock}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
          isLocked
            ? 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10'
            : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/40 border border-cyan-300'
        }`}
        title={isLocked ? 'Unlock to drag and resize widgets' : 'Lock widgets in place'}
      >
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Widgets Locked</span>
          </>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5 text-cyan-200 animate-bounce" />
            <span>Edit Mode</span>
          </>
        )}
      </button>

      {/* Preset Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Switch between Preset 1 (Analog), Preset 2 (Digital & Dock)"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">
            {activePresetId === 'preset_1_analog_suite' 
              ? 'Preset 1 (Analog)' 
              : activePresetId === 'preset_2_minimal_digital_dock' 
                ? 'Preset 2 (Digital Dock)' 
                : 'Presets'}
          </span>
          <ChevronDown className="w-3 h-3 text-cyan-400" />
        </button>

        {isPresetMenuOpen && (
          <div 
            className="absolute left-0 top-full mt-2 w-64 p-1.5 bg-zinc-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={() => setIsPresetMenuOpen(false)}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 font-bold border-b border-white/10 mb-1">
              Select Preset Layout
            </div>

            {DESKTOP_SKETCH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset && onSelectPreset(preset)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 transition cursor-pointer mb-1 ${
                  activePresetId === preset.id
                    ? 'bg-cyan-500/20 text-white border border-cyan-400/50'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{preset.name}</span>
                  {activePresetId === preset.id && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{preset.subtitle}</span>
              </button>
            ))}

            <div className="pt-1 mt-1 border-t border-white/10 flex items-center justify-between px-1">
              {onExportPresetJson && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPresetMenuOpen(false);
                    onExportPresetJson();
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 cursor-pointer font-mono"
                  title="Export current preset layout as JSON"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
              )}

              {onImportPresetJson && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPresetMenuOpen(false);
                    onImportPresetJson();
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 cursor-pointer font-mono"
                  title="Import preset JSON"
                >
                  <Upload className="w-3 h-3 text-emerald-400" />
                  <span>Import</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* When in Edit Mode, show quick Snapping and Reset options */}
      {!isLocked && (
        <>
          {/* Snap to Grid Toggle */}
          <button
            onClick={onToggleSnap}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              snapToGrid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10'
            }`}
            title="Toggle 15px Grid-Snapping"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">15px Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset Layout to Defaults */}
          <button
            onClick={onResetLayout}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Reset all widgets to default desktop coordinates"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </>
      )}

      {/* Auto Saved Indicator */}
      <div className="px-2 py-1 flex items-center gap-1 text-[10px] font-mono text-emerald-400">
        <Check className="w-3 h-3" />
        <span className="hidden md:inline">Saved</span>
      </div>
    </div>
  );
};
