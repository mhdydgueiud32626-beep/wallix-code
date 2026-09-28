import React, { useMemo } from 'react';
import { CustomizationTarget } from '../../types/target';
import { 
  Chrome, 
  Monitor, 
  Apple, 
  Smartphone, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { ChromeNewTabPreview } from '../../modules/chrome/ChromeNewTabPreview';
import { 
  ChromeNewTabSettings, 
  ChromeShortcut, 
  DEFAULT_CHROME_SETTINGS, 
  INITIAL_CHROME_SHORTCUTS 
} from '../../modules/chrome/types';
import { loadSavedChromeSettings } from '../../modules/chrome/extensionBridge';

interface TargetCardProps {
  target: CustomizationTarget;
  isSelected?: boolean;
  onSelect: (targetId: CustomizationTarget['id']) => void;
  chromeSettings?: ChromeNewTabSettings;
  chromeShortcuts?: ChromeShortcut[];
}

export const TargetCard: React.FC<TargetCardProps> = ({
  target,
  isSelected = false,
  onSelect,
  chromeSettings: customChromeSettings,
  chromeShortcuts: customChromeShortcuts,
}) => {
  const resolvedChromeData = useMemo(() => {
    if (target.id !== 'chrome') return null;
    if (customChromeSettings && customChromeShortcuts) {
      return { settings: customChromeSettings, shortcuts: customChromeShortcuts };
    }
    const saved = loadSavedChromeSettings();
    return {
      settings: saved.settings || DEFAULT_CHROME_SETTINGS,
      shortcuts: saved.shortcuts || INITIAL_CHROME_SHORTCUTS,
    };
  }, [target.id, customChromeSettings, customChromeShortcuts]);

  const getIcon = () => {
    switch (target.iconType) {
      case 'chrome':
        return <Chrome className="w-4 h-4 text-cyan-400" />;
      case 'windows':
        return <Monitor className="w-4 h-4 text-blue-400" />;
      case 'apple':
        return <Apple className="w-4 h-4 text-purple-300" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      id={`target-card-${target.id}`}
      onClick={() => onSelect(target.id)}
      className={`group flex flex-col rounded-xl sm:rounded-2xl bg-[#0e121d] border transition-all duration-300 overflow-hidden cursor-pointer relative shadow-lg ${
        isSelected
          ? 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          : 'border-white/10 hover:border-white/20 hover:shadow-xl'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. LARGE ENVIRONMENT PREVIEW (Dominant visual area) */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950 border-b border-white/10">
        {target.id === 'chrome' && resolvedChromeData ? (
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <ChromeNewTabPreview
              variant="card"
              settings={resolvedChromeData.settings}
              shortcuts={resolvedChromeData.shortcuts}
            />
          </div>
        ) : (
          <>
            {/* Environment Background Wallpaper */}
            <img
              src={target.previewImage}
              alt={target.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 brightness-[0.88] group-hover:brightness-95"
            />

            {/* Subtle Vignette Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e121d] via-transparent to-black/40 pointer-events-none" />
          </>
        )}

        {/* Windows 11 Mockup */}
        {target.id === 'windows' && (
          <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
            {/* Centered Taskbar */}
            <div className="w-full px-3 py-1.5 bg-black/70 backdrop-blur-lg border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
              <div className="w-12" />
              {/* Centered Start & App icons */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5 p-0.5 bg-blue-500/20 rounded-sm border border-blue-400/40">
                  <div className="bg-blue-400 rounded-[1px]" />
                  <div className="bg-blue-400 rounded-[1px]" />
                  <div className="bg-blue-400 rounded-[1px]" />
                  <div className="bg-blue-400 rounded-[1px]" />
                </div>
                <div className="w-3.5 h-3.5 rounded bg-white/15" />
                <div className="w-3.5 h-3.5 rounded bg-white/15" />
                <div className="w-3.5 h-3.5 rounded bg-white/15" />
              </div>
              {/* Right System Tray */}
              <div className="text-[9px] font-mono text-slate-400">
                12:45 PM
              </div>
            </div>
          </div>
        )}

        {/* macOS Mockup */}
        {target.id === 'macos' && (
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
            {/* Top Menu Bar */}
            <div className="w-full px-3 py-0.5 bg-black/50 backdrop-blur-md rounded-md border border-white/10 flex items-center justify-between text-[9px] text-slate-300">
              <div className="flex items-center gap-3">
                <Apple className="w-2.5 h-2.5 text-white" />
                <span className="font-semibold text-white">Finder</span>
                <span className="hidden sm:inline text-slate-400">File</span>
                <span className="hidden sm:inline text-slate-400">Edit</span>
                <span className="hidden sm:inline text-slate-400">View</span>
              </div>
              <div className="font-mono text-[9px] text-slate-300">
                Tue 9:41 AM
              </div>
            </div>

            {/* Floating Glass Dock */}
            <div className="mx-auto px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-1.5 shadow-2xl">
              {['Finder', 'Safari', 'Music', 'Terminal', 'System'].map((app, i) => (
                <div key={i} className="w-5 h-5 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">
                  {app[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Mockup */}
        {target.id === 'mobile' && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-3 pointer-events-none">
            {/* Dynamic Island & Status */}
            <div className="flex items-center justify-between w-full max-w-[180px] px-2 text-[9px] font-mono text-slate-200">
              <span>9:41</span>
              <div className="w-12 h-3 rounded-full bg-black/80 border border-white/20" />
              <span>100%</span>
            </div>

            {/* Lock Screen Clock */}
            <div className="text-center space-y-0.5">
              <span className="text-2xl font-light font-mono text-white tracking-wider block drop-shadow-md">
                09:41
              </span>
              <span className="text-[9px] text-slate-200 font-medium block drop-shadow-sm">
                Tuesday, September 8
              </span>
            </div>

            {/* Bottom Home Bar */}
            <div className="w-16 h-1 rounded-full bg-white/60" />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LOWER SECTION: INFORMATION, CAPABILITIES & PRIMARY ACTION */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3.5 bg-[#0e121d]">
        <div className="space-y-2">
          {/* Header Row: Icon + Environment Name + Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/10 transition-colors">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors font-['Outfit']">
                {target.name}
              </h3>
              <p className="text-xs text-slate-400">
                {target.type}
              </p>
            </div>
          </div>

          {/* Short Description (1-2 lines) */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {target.description}
          </p>

          {/* Capabilities: Background · Search · Shortcuts · Themes */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-slate-400 font-medium">Capabilities:</span>
            <span className="text-slate-200 font-medium">
              {target.capabilities.join(' · ')}
            </span>
          </div>
        </div>

        {/* Primary Action Button: ONE single button */}
        <div className="pt-1">
          <button
            id={`btn-customize-target-${target.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(target.id);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-cyan-500 text-slate-200 hover:text-black font-semibold text-xs border border-white/10 hover:border-cyan-400 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs group-hover:border-cyan-400/50"
          >
            <span>{target.primaryActionText}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
