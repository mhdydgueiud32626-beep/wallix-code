/**
 * Typed Definitions for Adaptive Design Tokens & Material System
 */
import { WallpaperVisualProfile, WallpaperRegionKey } from './wallpaperAnalysisTypes';

export interface HeroGlassTokens {
  background: string; // e.g. "rgba(12, 18, 30, 0.76)"
  darkBackground: string; // e.g. "rgba(8, 13, 23, 0.82)"
  opacity: number; // 0.50 - 0.84
  blurPx: number; // 40 - 72px
  saturationPercent: number; // 150 - 230%
  tintColor: string; // Subtle wallpaper diffusion tint rgba
  tintStrength: number; // 0.0 - 0.35
  border: string; // e.g. "rgba(255, 255, 255, 0.18)"
  borderOpacity: number; // 0.12 - 0.24
  specularColor: string; // 1px razor rim lighting (primarily neutral white with micro-bias)
  specularOpacity: number; // 0.30 - 0.50
  innerHighlight: string; // Inset perimeter highlight
  innerHighlightOpacity: number;
  ambientGlow: string; // Radial interior ambient volumetric illumination
  ambientGlowOpacity: number; // 0.03 - 0.08
  outerShadow: string; // Multi-tier elevation shadow
  noiseOpacity: number; // 0.025 - 0.045
}

export interface InternalControlTokens {
  cardBackground: string; // Restrained Level 2 neutral fill e.g. "rgba(255, 255, 255, 0.04)"
  cardHover: string;
  cardActive: string;
  cardBorder: string; // e.g. "rgba(255, 255, 255, 0.07)"
  cardBorderHover: string;
  selectedBackground: string; // Accessible selection
  selectedBorder: string;
}

export interface QuickActionTokens {
  tileInactive: string;
  tileInactiveHover: string;
  tileInactiveBorder: string;
  tileActiveGradient: string; // Accessible luminescent Windows accent
  tileActiveBorder: string;
  tileActiveShadow: string;
  tileActiveText: string;
}

export interface BottomSurfaceTokens {
  background: string; // e.g. "rgba(0, 0, 0, 0.35)"
  borderTop: string; // e.g. "rgba(255, 255, 255, 0.10)"
  blurPx: number; // 12 - 20px
}

export interface TypographyTokens {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
}

export interface AccentTokens {
  activeAccent: string; // Primary accessible accent (e.g. #0078D7 or harmonic variant)
  activeAccentStrong: string;
  activeAccentSoft: string; // 15-25% alpha version
  activeAccentGlow: string;
  isHarmonicVariant: boolean;
}

export interface AdaptiveDesignTokens {
  heroGlass: HeroGlassTokens;
  internalSurface: InternalControlTokens;
  quickAction: QuickActionTokens;
  bottomSurface: BottomSurfaceTokens;
  typography: TypographyTokens;
  accent: AccentTokens;
  cssVariables: Record<string, string>;
}

export interface AdaptiveMaterialContextState {
  profile: WallpaperVisualProfile;
  tokens: AdaptiveDesignTokens;
  rawTokens: AdaptiveDesignTokens;
  regionalTokens?: Record<WallpaperRegionKey, AdaptiveDesignTokens>;
  getTokensForRegion?: (region: WallpaperRegionKey) => AdaptiveDesignTokens;
  isAnalyzing: boolean;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  confidence: number;
  lastUpdated: number;
  wallpaperSource: string;
  reanalyze: () => Promise<void>;
}
