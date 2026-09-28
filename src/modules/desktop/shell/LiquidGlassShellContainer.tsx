import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { useAdaptiveMaterial, WallpaperRegionKey } from '../adaptive';

/**
 * High-performance inline SVG Noise Texture Data URI
 * Mimics authentic Microsoft Fluent Acrylic material texture and light grain
 */
export const FLUENT_ACRYLIC_NOISE_SVG = `data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E`;

/**
 * Shared Liquid Glass Material CSS Classes & Tokens
 * Implements 3-Level Material Hierarchy:
 * LEVEL 1: MAIN FLYOUT (Hero Liquid Glass, maximum diffusion & specular rim)
 * LEVEL 2: INTERNAL CONTROLS (Restrained native Windows shell surfaces)
 * LEVEL 3: BOTTOM REGION (Visually separate subtle glass strip)
 */
export const LIQUID_GLASS_TOKENS = {
  // LEVEL 1: Main Flyout Shell Glass Container
  flyoutContainer: 
    'relative overflow-hidden backdrop-blur-3xl backdrop-saturate-[210%] ' +
    'border border-white/[0.18] ' +
    'shadow-[0_28px_64px_-12px_rgba(0,0,0,0.85),0_14px_28px_-8px_rgba(0,0,0,0.65),inset_0_1px_1.5px_0_rgba(255,255,255,0.28),inset_0_0_24px_0_rgba(255,255,255,0.02)] ' +
    'text-white select-none pointer-events-auto font-sans',

  // LEVEL 1: Right-Docked Action Center Panel Glass
  sideDockContainer:
    'relative overflow-hidden backdrop-blur-3xl backdrop-saturate-[210%] ' +
    'border-l border-white/[0.18] ' +
    'shadow-[-20px_0_48px_rgba(0,0,0,0.9),inset_1px_0_1.5px_0_rgba(255,255,255,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.18)] ' +
    'text-white select-none pointer-events-auto font-sans',

  // LEVEL 1: Search Modal Glass
  searchModalContainer:
    'relative overflow-hidden backdrop-blur-3xl backdrop-saturate-[220%] ' +
    'border border-white/[0.2] ' +
    'shadow-[0_36px_72px_-16px_rgba(0,0,0,0.92),0_18px_36px_-8px_rgba(0,0,0,0.75),inset_0_1px_1.5px_0_rgba(255,255,255,0.3)] ' +
    'text-white select-none pointer-events-auto font-sans',

  // LEVEL 2: Restrained Internal Windows Control Surfaces (Clean, no nested heavy blur)
  card: 
    'bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] ' +
    'border border-white/[0.07] hover:border-white/[0.14] ' +
    'transition-colors duration-150',

  // LEVEL 3: Bottom Control & Slider Region (Visually separate subtle glass strip)
  bottomStrip: 
    'bg-[color:var(--wallix-bottom-strip-bg,rgba(0,0,0,0.38))] border-t border-white/[0.10] backdrop-blur-md',

  // Sub-Panel Surface (e.g. settings footer, header sections)
  subPanel: 
    'bg-black/25 border-t border-white/[0.08]',

  // Quick Action Tile Inactive (Restrained secondary surface)
  tileInactive: 
    'bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.15] ' +
    'border border-white/[0.08] hover:border-white/[0.16] ' +
    'text-white/85 transition-colors duration-150 shadow-xs',

  // Quick Action Tile Active (Wallpaper-aware luminescent Windows Fluent Accent with specular glow)
  tileActive: 
    'bg-[image:var(--wallix-active-accent-gradient,linear-gradient(to_bottom,#0078D7,#0063B1))] ' +
    'border border-[color:var(--wallix-active-accent-border,rgba(85,170,255,0.80))] text-white ' +
    'shadow-[var(--wallix-active-accent-shadow,0_2px_14px_rgba(0,120,215,0.50))] ' +
    'hover:brightness-110 active:brightness-95 transition-all duration-150',

  // Glass Slider Track
  sliderTrack:
    'bg-white/20 hover:bg-white/25 transition-colors',

  // Glass Input Field
  input:
    'bg-black/35 border border-white/[0.14] text-white placeholder-white/40 ' +
    'focus:border-[color:var(--wallix-active-accent,#0078D7)] focus:ring-1 focus:ring-[color:var(--wallix-active-accent-soft,rgba(0,120,215,0.60))] ' +
    'rounded transition-all duration-150',
};

export interface LiquidGlassSurfaceProps extends HTMLMotionProps<'div'> {
  variant?: 'flyout' | 'sideDock' | 'searchModal' | 'card';
  region?: WallpaperRegionKey;
  className?: string;
  children: React.ReactNode;
  showNoise?: boolean;
}

/**
 * Shared Liquid Glass Material Container
 * Wraps Windows Shell Surfaces with multi-tier glass physics, specular highlights, and acrylic noise.
 * Subscribes to adaptive wallpaper material tokens and contextual regional profiles.
 */
export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  variant = 'flyout',
  region,
  className = '',
  children,
  showNoise = true,
  ...motionProps
}) => {
  const { tokens, getTokensForRegion } = useAdaptiveMaterial();

  // Inferred contextual region if not explicitly provided
  const resolvedRegion: WallpaperRegionKey = region || (
    variant === 'sideDock' ? 'right-strip' :
    variant === 'searchModal' ? 'center' :
    'top-right'
  );

  const surfaceTokens = getTokensForRegion ? getTokensForRegion(resolvedRegion) : tokens;

  const getVariantClasses = () => {
    switch (variant) {
      case 'sideDock':
        return LIQUID_GLASS_TOKENS.sideDockContainer;
      case 'searchModal':
        return LIQUID_GLASS_TOKENS.searchModalContainer;
      case 'card':
        return LIQUID_GLASS_TOKENS.card;
      case 'flyout':
      default:
        return LIQUID_GLASS_TOKENS.flyoutContainer;
    }
  };

  const isCard = variant === 'card';
  const isSideDock = variant === 'sideDock';
  const isSearchModal = variant === 'searchModal';

  const baseBackground = isSideDock 
    ? surfaceTokens.heroGlass.darkBackground 
    : isSearchModal 
    ? surfaceTokens.heroGlass.darkBackground 
    : surfaceTokens.heroGlass.background;

  const dynamicStyles: HTMLMotionProps<'div'>['style'] = {
    ...motionProps.style,
    ...(isCard ? {} : {
      backgroundColor: baseBackground,
      backdropFilter: `blur(${surfaceTokens.heroGlass.blurPx}px) saturate(${surfaceTokens.heroGlass.saturationPercent}%)`,
      WebkitBackdropFilter: `blur(${surfaceTokens.heroGlass.blurPx}px) saturate(${surfaceTokens.heroGlass.saturationPercent}%)`,
      borderColor: surfaceTokens.heroGlass.border,
      boxShadow: isSideDock
        ? `-20px 0 48px rgba(0,0,0,0.9), inset 1px 0 1.5px 0 ${surfaceTokens.heroGlass.innerHighlight}`
        : `${surfaceTokens.heroGlass.outerShadow}, inset 0 1px 1.5px 0 ${surfaceTokens.heroGlass.innerHighlight}`,
    }),
  };

  return (
    <motion.div
      {...motionProps}
      style={dynamicStyles}
      className={`${getVariantClasses()} ${className}`}
    >
      {/* 1. Specular Top Rim Lighting Overlay (1px sharp light from top edge) */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-10" 
        style={{
          background: `linear-gradient(to right, transparent, ${surfaceTokens.heroGlass.specularColor}, transparent)`
        }}
      />

      {/* 2. Soft Inner Radial Ambient Luminescence (Wallpaper-aware volumetric glow) */}
      <div 
        className="absolute inset-x-0 top-0 h-48 pointer-events-none z-0 overflow-hidden" 
        style={{
          background: `radial-gradient(ellipse 90% 100% at 50% 0%, ${surfaceTokens.heroGlass.ambientGlow} 0%, transparent 80%)`
        }}
      />

      {/* 3. Authentic Fluent Acrylic Texture Grain */}
      {showNoise && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay"
          style={{ 
            backgroundImage: `url("${FLUENT_ACRYLIC_NOISE_SVG}")`,
            opacity: surfaceTokens.heroGlass.noiseOpacity || 0.035
          }}
        />
      )}

      {/* 4. Surface Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

export default LiquidGlassSurface;
