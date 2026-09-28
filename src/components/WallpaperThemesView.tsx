import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Layers, 
  Sliders, 
  Eye, 
  ArrowRight,
  Monitor,
  Flame,
  Zap
} from 'lucide-react';
import { ThemeConfig, WALLIX_THEME_PRESETS } from '../types/theme';
import { Wallpaper } from '../types';
import confetti from 'canvas-confetti';

interface WallpaperThemesViewProps {
  activeThemeId?: string;
  onApplyTheme: (theme: ThemeConfig) => void;
  onNavigateChromeWithTheme?: (themeId: string) => void;
  activeWallpaper?: Wallpaper;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const WallpaperThemesView: React.FC<WallpaperThemesViewProps> = ({
  activeThemeId = 'sakura-spirit',
  onApplyTheme,
  onNavigateChromeWithTheme,
  activeWallpaper,
  onShowToast
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(activeThemeId);

  const currentTheme = WALLIX_THEME_PRESETS.find(t => t.id === selectedThemeId) || WALLIX_THEME_PRESETS[0];

  const handleApply = (theme: ThemeConfig) => {
    setSelectedThemeId(theme.id);
    onApplyTheme(theme);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: [theme.accent, '#38bdf8', '#ffffff']
    });
    if (onShowToast) {
      onShowToast({
        title: `Theme Applied: ${theme.name}`,
        subtitle: 'Color grade, search styling, and visual atmosphere updated',
        icon: <Palette className="w-4 h-4 text-cyan-400" />
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-400/30 text-pink-300 text-xs font-mono font-bold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>VISUAL ATMOSPHERE & COLOR GRADES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            WALLIX Themes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Complete visual configurations combining background art, neon accents, frosted search styles, and dock layouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {WALLIX_THEME_PRESETS.length} Curated Presets
          </span>
        </div>
      </div>

      {/* Hero Showcase of Current Selected Theme */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl">
        <div className="relative aspect-[21/9] min-h-[260px] max-h-[380px] w-full overflow-hidden">
          <img
            src={currentTheme.background}
            alt={currentTheme.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090C16] via-[#090C16]/60 to-transparent" />

          {/* Theme Meta Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border"
                  style={{ 
                    color: currentTheme.accent, 
                    borderColor: `${currentTheme.accent}60`,
                    backgroundColor: `${currentTheme.accent}20` 
                  }}
                >
                  {currentTheme.badge || 'SIGNATURE THEME'}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Search: <strong className="text-white capitalize">{currentTheme.searchStyle}</strong>
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white font-['Outfit']">
                {currentTheme.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300">
                {currentTheme.tagline}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleApply(currentTheme)}
                className="px-5 py-2.5 rounded-xl text-black font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: currentTheme.accent,
                  boxShadow: `0 0 25px ${currentTheme.accent}80`
                }}
              >
                <Check className="w-4 h-4" />
                <span>Apply Theme</span>
              </button>

              {onNavigateChromeWithTheme && (
                <button
                  onClick={() => onNavigateChromeWithTheme(currentTheme.id)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xl"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Use in Chrome</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of All Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {WALLIX_THEME_PRESETS.map((theme) => {
          const isSelected = selectedThemeId === theme.id;

          return (
            <div
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className={`group rounded-2xl p-3.5 border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 bg-[#0c101d] ${
                isSelected 
                  ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]' 
                  : 'border-white/10 hover:border-white/30 hover:bg-[#101526]'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img
                  src={theme.background}
                  alt={theme.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span 
                    className="w-3 h-3 rounded-full inline-block shadow-md"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-cyan-400 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">{theme.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{theme.searchStyle}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {theme.tagline}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply(theme);
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <span>{isSelected ? 'Applied' : 'Select Theme'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
