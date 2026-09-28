import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Globe, 
  Code, 
  Gamepad2, 
  Terminal, 
  ImageIcon, 
  MessageSquare, 
  Sparkles, 
  Settings, 
  Cpu, 
  FileText,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { 
  useAdaptiveMaterial, 
  hexToRgb, 
  blendColors, 
  sanitizeAdaptiveAccent 
} from '../../modules/desktop/adaptive';

export interface DrawerApp {
  id: string;
  name: string;
  category: 'Gaming' | 'Development' | 'Media & Video' | 'Productivity' | 'System Tools' | 'Settings';
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  description?: string;
}

const DEFAULT_DRAWER_APPS: DrawerApp[] = [
  { id: 'steam', name: 'Steam', category: 'Gaming', icon: Gamepad2, gradient: 'from-blue-600 via-indigo-700 to-blue-900', description: 'Gaming client & library' },
  { id: 'vscode', name: 'VS Code', category: 'Development', icon: Code, gradient: 'from-sky-500 via-blue-600 to-indigo-700', description: 'Code editor' },
  { id: 'blender', name: 'Blender', category: 'Media & Video', icon: ImageIcon, gradient: 'from-orange-500 via-amber-600 to-yellow-600', description: '3D creation suite' },
  { id: 'discord', name: 'Discord', category: 'Productivity', icon: MessageSquare, gradient: 'from-indigo-600 via-purple-600 to-indigo-800', description: 'Chat & community' },
  { id: 'chrome', name: 'Chrome', category: 'Productivity', icon: Globe, gradient: 'from-blue-500 via-emerald-500 to-amber-500', description: 'Web browser' },
  { id: 'terminal', name: 'Terminal', category: 'Development', icon: Terminal, gradient: 'from-zinc-800 via-zinc-900 to-black', description: 'Command line interface' },
  { id: 'appstore', name: 'App Store', category: 'System Tools', icon: Sparkles, gradient: 'from-sky-400 via-blue-500 to-indigo-600', description: 'Applications marketplace' },
  { id: 'firefox', name: 'Firefox', category: 'Productivity', icon: Globe, gradient: 'from-amber-600 via-orange-600 to-rose-600', description: 'Web browser' },
  { id: 'photoshop', name: 'Photoshop', category: 'Media & Video', icon: ImageIcon, gradient: 'from-blue-950 via-blue-800 to-indigo-900', description: 'Image editing' },
  { id: 'stock', name: 'Stock', category: 'Productivity', icon: FileText, gradient: 'from-emerald-500 via-teal-600 to-cyan-700', description: 'Financial markets' },
  { id: 'sokts', name: 'Sokts', category: 'Development', icon: Cpu, gradient: 'from-amber-500 via-orange-600 to-red-600', description: 'Network diagnostics' },
  { id: 'ratm', name: 'Ratm Only', category: 'Gaming', icon: Gamepad2, gradient: 'from-rose-600 via-red-700 to-rose-900', description: 'Arcade platform' },
  { id: 'dribbble', name: 'Dribbble', category: 'Media & Video', icon: ImageIcon, gradient: 'from-pink-500 via-rose-600 to-pink-700', description: 'Design inspiration' },
  { id: 'slack', name: 'Slack', category: 'Productivity', icon: MessageSquare, gradient: 'from-purple-600 via-fuchsia-600 to-pink-600', description: 'Team collaboration' },
  { id: 'settings', name: 'Settings', category: 'Settings', icon: Settings, gradient: 'from-slate-600 via-slate-700 to-zinc-800', description: 'System preferences' }
];

const CATEGORIES = [
  "All Apps", 
  "Gaming", 
  "Development", 
  "Media & Video", 
  "Productivity", 
  "System Tools", 
  "Settings"
] as const;

export interface AppDrawerLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp?: (app: DrawerApp) => void;
}

export const AppDrawerLauncher: React.FC<AppDrawerLauncherProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>("All Apps");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDevDiagnostic, setShowDevDiagnostic] = useState(false);

  // Consume Centralized Wallpaper Material Intelligence
  const { profile, tokens, getTokensForRegion } = useAdaptiveMaterial();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key dismiss & Shift+Alt+D dev diagnostic toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.shiftKey && e.altKey && (e.key === 'D' || e.key === 'd')) {
        setShowDevDiagnostic((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derive Liquid Glass Adaptive Material Profile from Centralized Wallpaper Intelligence
  const material = useMemo(() => {
    // 1. Regional context: center focal zone
    const centerProfile = profile?.regionalProfiles?.['center'];
    const centerTokens = getTokensForRegion ? getTokensForRegion('center') : tokens;

    // 2. Semantic Color Roles Extraction
    const dominantHex = profile?.dominantColor || '#121a28';
    const secondaryHex = profile?.secondaryColor || '#1e293b';
    const tertiaryHex = profile?.tertiaryColor || '#334155';
    const rawAccentCandidate = centerProfile?.accentCandidate || profile?.accentCandidate || '#0078D7';
    const highlightHex = profile?.highlightColor || '#FFFFFF';
    const shadowHex = profile?.shadowColor || '#070b13';
    const neutralHex = profile?.neutralColor || '#94a3b8';

    const lum = profile?.averageLuminance ?? 0.3;
    const sat = profile?.averageSaturation ?? 0.5;
    const contrastVal = profile?.contrast ?? 0.5;
    const complexityVal = profile?.complexity ?? 0.4;
    const texture = profile?.textureStrength ?? 0.4;
    const temp = profile?.temperature || 'cool';

    // 3. Adaptive Low-Alpha Substrate (0.12 - 0.24, normal target ~0.16)
    // Wallpaper remains clearly recognizable and diffuses fluidly
    const baseOpacity = 0.14 + texture * 0.04 + (lum > 0.65 ? 0.05 : 0);
    const glassOpacity = Math.max(0.12, Math.min(0.24, Number(baseOpacity.toFixed(2))));

    const neutralDarkRgb: [number, number, number] = [10, 14, 22];
    const domRgb = hexToRgb(dominantHex);
    // Subtle 8% chromatic substrate influence preserves wallpaper visual mass without muddying
    const substrateRgb = blendColors(neutralDarkRgb, domRgb, 0.08);
    const glassBg = `rgba(${substrateRgb[0]}, ${substrateRgb[1]}, ${substrateRgb[2]}, ${glassOpacity})`;

    // 4. Optical Blur & Saturation (44px - 54px blur, 180% - 210% saturation)
    const blurPx = Math.max(44, Math.min(54, Math.round(44 + complexityVal * 10)));
    const satPercent = Math.max(180, Math.min(210, Math.round(180 + sat * 25)));

    // 5. Specular Rim Highlight (Razor physical glass edge, mostly neutral white with micro-bias)
    const hlRgb = hexToRgb(highlightHex);
    const specularColor = temp === 'warm'
      ? `rgba(${Math.min(255, hlRgb[0])}, ${Math.min(255, hlRgb[1] - 6)}, ${Math.min(255, hlRgb[2] - 12)}, 0.45)`
      : `rgba(${Math.min(255, hlRgb[0] - 6)}, ${Math.min(255, hlRgb[1] - 4)}, ${Math.min(255, hlRgb[2])}, 0.45)`;

    const borderAlpha = Math.max(0.16, Math.min(0.25, 0.18 + (lum > 0.6 ? 0.04 : 0)));
    const glassBorder = `rgba(255, 255, 255, ${borderAlpha})`;

    // 6. Liquid Aura (Soft, diffused, atmospheric halo derived from wallpaper)
    const localChroma = centerProfile?.accentCandidate || centerProfile?.dominantColor || rawAccentCandidate;
    const auraRgb = hexToRgb(localChroma);
    const secAuraRgb = hexToRgb(secondaryHex);
    const auraAlpha = Math.min(0.18, Math.max(0.08, 0.10 + sat * 0.10));
    const auraPrimary = `rgba(${auraRgb[0]}, ${auraRgb[1]}, ${auraRgb[2]}, ${auraAlpha.toFixed(3)})`;
    const auraSecondary = `rgba(${secAuraRgb[0]}, ${secAuraRgb[1]}, ${secAuraRgb[2]}, ${(auraAlpha * 0.70).toFixed(3)})`;

    // 7. Adaptive Accent Tokens (Accessible, contrast-safe control state)
    const sanitized = sanitizeAdaptiveAccent(rawAccentCandidate);
    const activeAccent = sanitized.accent;
    const activeAccentStrong = sanitized.strong;
    const activeAccentSoft = sanitized.soft; // 15-24% alpha version
    const borderStrong = `${sanitized.accent}cc`;

    // 8. Typography Tokens
    const textPrimary = '#FFFFFF';
    const textSecondary = 'rgba(255, 255, 255, 0.75)';
    const textMuted = 'rgba(255, 255, 255, 0.45)';

    // 9. Centralized CSS Custom Properties Map
    const cssVariables = {
      '--aura-primary': auraPrimary,
      '--aura-secondary': auraSecondary,
      '--aura-accent': activeAccent,
      '--aura-highlight': specularColor,
      '--aura-shadow': shadowHex,
      '--aura-glass-bg': glassBg,
      '--aura-glass-opacity': String(glassOpacity),
      '--aura-glass-blur': `${blurPx}px`,
      '--aura-glass-saturation': `${satPercent}%`,
      '--aura-border': glassBorder,
      '--aura-border-strong': borderStrong,
      '--aura-active': activeAccent,
      '--aura-active-soft': activeAccentSoft,
      '--aura-active-strong': activeAccentStrong,
      '--aura-hover': 'rgba(255, 255, 255, 0.08)',
      '--aura-text-primary': textPrimary,
      '--aura-text-secondary': textSecondary,
      '--aura-text-muted': textMuted,
    } as React.CSSProperties;

    return {
      cssVariables,
      dominantHex,
      secondaryHex,
      tertiaryHex,
      accentHex: activeAccent,
      glassOpacity,
      blurPx,
      satPercent,
      substrateRgb,
      glassBorder,
      specularColor,
      shadowHex,
      lum,
      sat,
      temp,
      complexityVal,
      edgeDensity: profile?.edgeDensity ?? 0.3,
      confidence: profile?.confidence ?? 0.9,
    };
  }, [profile, tokens, getTokensForRegion]);

  const filteredApps = useMemo(() => {
    return DEFAULT_DRAWER_APPS.filter(app => {
      const matchesCategory = selectedCategory === "All Apps" || app.category === selectedCategory;
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!mounted || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="app-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/15 backdrop-blur-[2px]"
          onClick={onClose}
        >
          {/* Main Hero Liquid Glass Window */}
          <motion.div
            key="app-drawer-window"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...material.cssVariables,
              backgroundColor: 'var(--aura-glass-bg)',
              backdropFilter: `blur(var(--aura-glass-blur)) saturate(var(--aura-glass-saturation))`,
              WebkitBackdropFilter: `blur(var(--aura-glass-blur)) saturate(var(--aura-glass-saturation))`,
              borderColor: 'var(--aura-border)',
              boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.75), 0 16px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
            className="relative w-[860px] max-w-[95vw] h-[520px] rounded-3xl overflow-hidden flex border text-white select-none z-10 transition-colors duration-500 ease-out"
          >
            {/* 1. Top Specular Rim Lighting Highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-20"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, var(--aura-highlight) 50%, transparent 100%)',
              }}
            />

            {/* 2. Delicate Glass Micro-Grain Texture (0.015 - 0.025 effective opacity) */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" 
              style={{ 
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', 
                backgroundSize: '16px 16px' 
              }} 
            />

            {/* 3. Soft Atmospheric Liquid Aura (Wallpaper-derived diffusion) */}
            <div 
              className="absolute -top-36 -left-36 w-[440px] h-[440px] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ease-out"
              style={{ backgroundColor: 'var(--aura-primary)' }}
            />
            <div 
              className="absolute -bottom-36 -right-36 w-[440px] h-[440px] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ease-out"
              style={{ backgroundColor: 'var(--aura-secondary)' }}
            />

            {/* 4. Left Category Sidebar (Secondary Glass) */}
            <div 
              className="w-[220px] p-4 flex flex-col gap-1 border-r shrink-0 z-10 backdrop-blur-md"
              style={{ 
                borderColor: 'var(--aura-border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div className="px-3 py-2 mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-[var(--aura-text-muted)] uppercase font-['Outfit']">Launchpad</h2>
                
                {/* Dev Diagnostic Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowDevDiagnostic(prev => !prev)}
                  title="Toggle Adaptive Material Inspector (Shift+Alt+D)"
                  className="p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={isActive ? {
                      backgroundColor: 'var(--aura-active-soft)',
                      borderColor: 'var(--aura-border-strong)',
                      color: 'var(--aura-text-primary)',
                      boxShadow: '0 0 16px var(--aura-active-soft)',
                    } : undefined}
                    className={`w-full text-left rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-between border ${
                      isActive
                        ? ''
                        : 'border-transparent text-[var(--aura-text-secondary)] hover:text-white hover:bg-[var(--aura-hover)]'
                    }`}
                  >
                    <span>{cat}</span>
                    {isActive && (
                      <div 
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{ 
                          backgroundColor: 'var(--aura-active)', 
                          boxShadow: '0 0 8px var(--aura-active)' 
                        }} 
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 5. Right App Grid & Search Header */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent z-10">
              {/* Frosted Search Header (Secondary Glass) */}
              <div 
                className="p-5 border-b flex items-center gap-3"
                style={{ borderColor: 'var(--aura-border)' }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    style={{
                      borderColor: isSearchFocused ? 'var(--aura-active)' : 'var(--aura-border)',
                      boxShadow: isSearchFocused ? '0 0 14px var(--aura-active-soft)' : 'none',
                    }}
                    className="w-full bg-white/[0.06] border rounded-full pl-10 pr-4 py-2 text-sm text-[var(--aura-text-primary)] placeholder-[var(--aura-text-muted)] focus:outline-none focus:bg-white/10 transition-all duration-200 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* App Grid & Restrained Glass Tiles */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {filteredApps.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--aura-text-muted)] gap-2">
                    <Sparkles className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No applications found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-y-6 gap-x-4">
                    {filteredApps.map((app) => {
                      const IconComp = app.icon;
                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            onLaunchApp?.(app);
                            onClose();
                          }}
                          className="flex flex-col items-center group cursor-pointer"
                        >
                          {/* Desktop-grade restrained app squircle tile */}
                          <div 
                            className={`relative w-14 h-14 rounded-2xl p-2.5 flex items-center justify-center bg-gradient-to-br ${app.gradient} shadow-lg group-hover:scale-105 group-hover:brightness-110 active:scale-95 transition-all duration-200 border border-white/20`}
                            style={{
                              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.4)',
                            }}
                          >
                            {/* Specular bevel / highlight on top edge of app icons */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-black/25 pointer-events-none" />
                            <IconComp className="w-7 h-7 text-white drop-shadow-md relative z-10" />
                          </div>
                          <span className="truncate text-[var(--aura-text-primary)] mt-1.5 text-xs font-medium tracking-tight text-center w-full px-1 group-hover:text-white transition-colors">
                            {app.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Development Diagnostic Inspector (Section 39) */}
            <AnimatePresence>
              {showDevDiagnostic && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-y-0 right-0 w-80 bg-slate-950/90 backdrop-blur-2xl border-l border-white/15 p-4 z-50 overflow-y-auto text-xs font-mono select-text"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <span className="font-semibold text-white tracking-wide">Adaptive Material Inspector</span>
                    <button 
                      onClick={() => setShowDevDiagnostic(false)}
                      className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-sans font-semibold">Wallpaper Profile</div>
                      <div className="space-y-1 text-white/80">
                        <div className="flex items-center justify-between">
                          <span>Dominant:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: material.dominantHex }} />
                            <span>{material.dominantHex}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Secondary:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: material.secondaryHex }} />
                            <span>{material.secondaryHex}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Accent:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: material.accentHex }} />
                            <span>{material.accentHex}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Luminance:</span>
                          <span>{material.lum.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Saturation:</span>
                          <span>{material.sat.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Temperature:</span>
                          <span className="capitalize">{material.temp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Complexity:</span>
                          <span>{material.complexityVal.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Edge Density:</span>
                          <span>{material.edgeDensity.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Confidence:</span>
                          <span>{(material.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-sans font-semibold">Launcher Material</div>
                      <div className="space-y-1 text-white/80">
                        <div className="flex items-center justify-between">
                          <span>Glass Opacity:</span>
                          <span>{material.glassOpacity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Backdrop Blur:</span>
                          <span>{material.blurPx}px</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Saturation:</span>
                          <span>{material.satPercent}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Substrate Tint:</span>
                          <span>rgb({material.substrateRgb.join(',')})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Specular:</span>
                          <span>{material.specularColor.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Shadow:</span>
                          <span>{material.shadowHex}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AppDrawerLauncher;
