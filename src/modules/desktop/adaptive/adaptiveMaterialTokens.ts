/**
 * Adaptive Design Token Generator
 * Translates WallpaperVisualProfile into bounded, accessible, and high-fidelity design tokens.
 * Supports contextual regional token derivation for spatial shell surfaces.
 */
import { WallpaperVisualProfile, WallpaperRegionKey, RegionalVisualProfile } from './wallpaperAnalysisTypes';
import { AdaptiveDesignTokens } from './adaptiveMaterialTypes';
import { 
  hexToRgb, 
  sanitizeAdaptiveAccent, 
  blendColors, 
  getRelativeLuminance, 
  getContrastRatio, 
  getAccessibleTextColor 
} from './adaptiveMaterialUtils';

/**
 * Creates static baseline default tokens (fallback)
 */
export function createDefaultAdaptiveTokens(): AdaptiveDesignTokens {
  return {
    heroGlass: {
      background: 'rgba(12, 18, 30, 0.18)',
      darkBackground: 'rgba(8, 13, 23, 0.22)',
      opacity: 0.18,
      blurPx: 48,
      saturationPercent: 195,
      tintColor: 'rgba(0, 120, 215, 0.05)',
      tintStrength: 0.05,
      border: 'rgba(255, 255, 255, 0.22)',
      borderOpacity: 0.22,
      specularColor: 'rgba(255, 255, 255, 0.24)',
      specularOpacity: 0.24,
      innerHighlight: 'rgba(255, 255, 255, 0.05)',
      innerHighlightOpacity: 0.05,
      ambientGlow: 'rgba(0, 120, 215, 0.08)',
      ambientGlowOpacity: 0.08,
      outerShadow: '0 24px 48px -12px rgba(0,0,0,0.55), 0 12px 24px -8px rgba(0,0,0,0.35)',
      noiseOpacity: 0.02,
    },
    internalSurface: {
      cardBackground: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
      cardActive: 'rgba(255, 255, 255, 0.09)',
      cardBorder: 'rgba(255, 255, 255, 0.06)',
      cardBorderHover: 'rgba(255, 255, 255, 0.12)',
      selectedBackground: 'rgba(0, 120, 215, 0.15)',
      selectedBorder: 'rgba(0, 120, 215, 0.60)',
    },
    quickAction: {
      tileInactive: 'rgba(255, 255, 255, 0.04)',
      tileInactiveHover: 'rgba(255, 255, 255, 0.08)',
      tileInactiveBorder: 'rgba(255, 255, 255, 0.07)',
      tileActiveGradient: 'linear-gradient(to bottom, rgba(0, 120, 215, 0.75), rgba(0, 99, 177, 0.85))',
      tileActiveBorder: 'rgba(85, 170, 255, 0.70)',
      tileActiveShadow: '0 2px 10px rgba(0, 120, 215, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
      tileActiveText: '#FFFFFF',
    },
    bottomSurface: {
      background: 'rgba(0, 0, 0, 0.16)',
      borderTop: 'rgba(255, 255, 255, 0.08)',
      blurPx: 14,
    },
    typography: {
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.85)',
      textMuted: 'rgba(255, 255, 255, 0.55)',
      textAccent: '#60cdff',
    },
    accent: {
      activeAccent: '#0078D7',
      activeAccentStrong: '#0063B1',
      activeAccentSoft: 'rgba(0, 120, 215, 0.24)',
      activeAccentGlow: 'rgba(0, 120, 215, 0.50)',
      isHarmonicVariant: false,
    },
    cssVariables: {
      '--wallix-hero-glass-bg': 'rgba(12, 18, 30, 0.75)',
      '--wallix-hero-glass-blur': '64px',
      '--wallix-hero-glass-sat': '210%',
      '--wallix-hero-glass-border': 'rgba(255, 255, 255, 0.18)',
      '--wallix-specular-color': 'rgba(255, 255, 255, 0.45)',
      '--wallix-ambient-glow': 'rgba(0, 120, 215, 0.12)',
      '--wallix-active-accent': '#0078D7',
      '--wallix-active-accent-strong': '#0063B1',
      '--wallix-active-accent-soft': 'rgba(0, 120, 215, 0.24)',
      '--wallix-active-accent-border': 'rgba(85, 170, 255, 0.80)',
      '--wallix-active-accent-gradient': 'linear-gradient(to bottom, #0078D7, #0063B1)',
      '--wallix-active-accent-shadow': '0 2px 14px rgba(0, 120, 215, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.40)',
      '--wallix-text-accent': '#60cdff',
      '--wallix-bottom-strip-bg': 'rgba(0, 0, 0, 0.38)',
    },
  };
}

/**
 * Generates AdaptiveDesignTokens from WallpaperVisualProfile.
 * Optionally contextualizes tokens to a specific spatial wallpaper region.
 */
export function generateAdaptiveTokens(
  profile: WallpaperVisualProfile,
  regionKey?: WallpaperRegionKey
): AdaptiveDesignTokens {
  const {
    dominantColor,
    averageLuminance,
    averageSaturation,
    contrast,
    complexity,
    temperature,
    warmth,
    accentCandidate,
    highlightColor,
    textureStrength = 0.45,
  } = profile;

  // Check if regional context should be resolved
  const regional: RegionalVisualProfile | undefined = 
    regionKey && profile.regionalProfiles ? profile.regionalProfiles[regionKey] : undefined;

  const targetDominant = regional ? regional.dominantColor : dominantColor;
  const targetAccent = regional ? regional.accentCandidate : accentCandidate;
  const targetLum = regional ? regional.averageLuminance : averageLuminance;
  const targetSat = regional ? regional.averageSaturation : averageSaturation;
  const targetTexture = regional ? regional.textureStrength : textureStrength;
  const targetTemp = regional ? regional.temperature : temperature;
  const targetWarmth = regional ? regional.warmth : (profile.warmth ?? profile.warmCoolBalance ?? 0);

  // 1. Texture-Aware Bounded Blur (40px - 56px)
  // Higher texture/noise warrants higher blur to diffuse visual clutter behind text
  const baseBlur = 40 + targetTexture * 12 + (complexity || 0.45) * 6;
  const blurPx = Math.max(40, Math.min(56, Math.round(baseBlur)));

  // 2. Texture-Aware Bounded Opacity (0.10 - 0.28)
  // Higher texture or brighter background increases glass density to protect contrast
  const lumFactor = Math.max(0, Math.min(1, targetLum));
  const baseOpacity = 0.14 + targetTexture * 0.08 + lumFactor * 0.06;
  const glassOpacity = Math.max(0.10, Math.min(0.28, Number(baseOpacity.toFixed(2))));

  // 3. Bounded Backdrop Saturation (175% - 225%)
  const baseSat = 185 + targetSat * 35 + (1 - Math.abs(targetWarmth)) * 5;
  const saturationPercent = Math.max(175, Math.min(225, Math.round(baseSat)));

  // 4. Semantic Field Chroma Substrate Tinting (Subtle 0.03 - 0.10 weight)
  const neutralDark: [number, number, number] = [12, 18, 30];
  const dominantRgb = hexToRgb(targetDominant);
  
  const effectiveDominantRgb: [number, number, number] = targetLum > 0.65 
    ? blendColors(dominantRgb, [20, 30, 48], 0.65)
    : dominantRgb;

  const tintWeight = Math.min(0.10, 0.03 + targetSat * 0.07);
  const tintedRgb = blendColors(neutralDark, effectiveDominantRgb, tintWeight);

  const glassBackground = `rgba(${tintedRgb[0]}, ${tintedRgb[1]}, ${tintedRgb[2]}, ${glassOpacity})`;
  const darkTintedRgb = blendColors([8, 13, 23], effectiveDominantRgb, tintWeight * 0.90);
  const darkGlassBackground = `rgba(${darkTintedRgb[0]}, ${darkTintedRgb[1]}, ${darkTintedRgb[2]}, ${Math.min(0.32, glassOpacity + 0.04)})`;

  // 5. Specular Top Rim Highlight (Influenced by highlightColor & temperature)
  const highlightRgb = hexToRgb(highlightColor || '#FFFFFF');
  let specularColor = 'rgba(255, 255, 255, 0.48)';
  if (targetTemp === 'warm') {
    specularColor = `rgba(${Math.min(255, highlightRgb[0])}, ${Math.min(255, highlightRgb[1] - 8)}, ${Math.min(255, highlightRgb[2] - 16)}, 0.52)`;
  } else if (targetTemp === 'cool') {
    specularColor = `rgba(${Math.min(255, highlightRgb[0] - 8)}, ${Math.min(255, highlightRgb[1] - 4)}, ${Math.min(255, highlightRgb[2])}, 0.52)`;
  }

  // 6. Ambient Volumetric Glow (Derived from regional/accent chroma)
  const accentRgb = hexToRgb(targetAccent);
  const glowAlpha = Math.min(0.24, 0.10 + targetSat * 0.15);
  const ambientGlow = `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${glowAlpha.toFixed(3)})`;

  // 7. Adaptive Accent Tokens (Accessible, safe Windows shell accent)
  const sanitizedAccent = sanitizeAdaptiveAccent(targetAccent);
  const activeAccentRgb = hexToRgb(sanitizedAccent.accent);

  // 8. Contrast Validation (WCAG AA Compliance)
  // Ensure active tile text has >= 4.5:1 contrast against accent gradient
  const activeTileTextColor = getAccessibleTextColor(activeAccentRgb, true);

  // Ensure primary text on glass background has >= 4.5:1 contrast
  const primaryTextColor = getAccessibleTextColor(tintedRgb, true);

  // 9. Bottom Surface Acrylic Strip
  const bottomDarkRgb = blendColors([0, 0, 0], effectiveDominantRgb, 0.15);
  const bottomBg = `rgba(${bottomDarkRgb[0]}, ${bottomDarkRgb[1]}, ${bottomDarkRgb[2]}, 0.28)`;

  // Specular Border reflecting delicate chroma
  const heroGlassBorder = `rgba(${Math.min(255, 210 + Math.round(effectiveDominantRgb[0] * 0.16))}, ${Math.min(255, 210 + Math.round(effectiveDominantRgb[1] * 0.16))}, ${Math.min(255, 210 + Math.round(effectiveDominantRgb[2] * 0.16))}, 0.22)`;

  // 10. Assemble CSS Custom Properties Map
  const cssVariables: Record<string, string> = {
    '--wallix-hero-glass-bg': glassBackground,
    '--wallix-hero-glass-blur': `${blurPx}px`,
    '--wallix-hero-glass-sat': `${saturationPercent}%`,
    '--wallix-hero-glass-border': heroGlassBorder,
    '--wallix-specular-color': specularColor,
    '--wallix-ambient-glow': ambientGlow,
    '--wallix-active-accent': sanitizedAccent.accent,
    '--wallix-active-accent-strong': sanitizedAccent.strong,
    '--wallix-active-accent-soft': sanitizedAccent.soft,
    '--wallix-active-accent-border': `${sanitizedAccent.accent}cc`,
    '--wallix-active-accent-gradient': `linear-gradient(to bottom, ${sanitizedAccent.accent}, ${sanitizedAccent.strong})`,
    '--wallix-active-accent-shadow': `0 2px 14px ${sanitizedAccent.soft.replace('0.24', '0.50')}, inset 0 1px 0 rgba(255, 255, 255, 0.40)`,
    '--wallix-text-accent': sanitizedAccent.accent,
    '--wallix-bottom-strip-bg': bottomBg,
  };

  return {
    heroGlass: {
      background: glassBackground,
      darkBackground: darkGlassBackground,
      opacity: glassOpacity,
      blurPx,
      saturationPercent,
      tintColor: `rgba(${effectiveDominantRgb[0]}, ${effectiveDominantRgb[1]}, ${effectiveDominantRgb[2]}, 0.15)`,
      tintStrength: tintWeight,
      border: heroGlassBorder,
      borderOpacity: 0.22,
      specularColor,
      specularOpacity: 0.48,
      innerHighlight: 'rgba(255, 255, 255, 0.28)',
      innerHighlightOpacity: 0.28,
      ambientGlow,
      ambientGlowOpacity: glowAlpha,
      outerShadow: '0 28px 64px -12px rgba(0,0,0,0.85), 0 14px 28px -8px rgba(0,0,0,0.65)',
      noiseOpacity: 0.035,
    },
    internalSurface: {
      cardBackground: 'rgba(255, 255, 255, 0.04)',
      cardHover: 'rgba(255, 255, 255, 0.08)',
      cardActive: 'rgba(255, 255, 255, 0.12)',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderHover: 'rgba(255, 255, 255, 0.14)',
      selectedBackground: sanitizedAccent.soft,
      selectedBorder: `${sanitizedAccent.accent}b3`,
    },
    quickAction: {
      tileInactive: 'rgba(255, 255, 255, 0.05)',
      tileInactiveHover: 'rgba(255, 255, 255, 0.10)',
      tileInactiveBorder: 'rgba(255, 255, 255, 0.08)',
      tileActiveGradient: `linear-gradient(to bottom, ${sanitizedAccent.accent}, ${sanitizedAccent.strong})`,
      tileActiveBorder: `${sanitizedAccent.accent}cc`,
      tileActiveShadow: `0 2px 14px ${sanitizedAccent.soft.replace('0.24', '0.50')}, inset 0 1px 0 rgba(255, 255, 255, 0.40)`,
      tileActiveText: activeTileTextColor,
    },
    bottomSurface: {
      background: bottomBg,
      borderTop: 'rgba(255, 255, 255, 0.10)',
      blurPx: 16,
    },
    typography: {
      textPrimary: primaryTextColor,
      textSecondary: 'rgba(255, 255, 255, 0.85)',
      textMuted: 'rgba(255, 255, 255, 0.55)',
      textAccent: sanitizedAccent.accent,
    },
    accent: {
      activeAccent: sanitizedAccent.accent,
      activeAccentStrong: sanitizedAccent.strong,
      activeAccentSoft: sanitizedAccent.soft,
      activeAccentGlow: sanitizedAccent.soft.replace('0.24', '0.50'),
      isHarmonicVariant: sanitizedAccent.isHarmonic,
    },
    cssVariables,
  };
}

/**
 * Precomputes regional tokens for all spatial sectors
 */
export function generateRegionalTokensMap(
  profile: WallpaperVisualProfile
): Record<WallpaperRegionKey, AdaptiveDesignTokens> {
  const regions: WallpaperRegionKey[] = [
    'global', 'top-left', 'top-center', 'top-right', 'center',
    'bottom-left', 'bottom-center', 'bottom-right', 'right-strip'
  ];

  const map: Record<WallpaperRegionKey, AdaptiveDesignTokens> = {} as Record<WallpaperRegionKey, AdaptiveDesignTokens>;
  for (const rk of regions) {
    map[rk] = generateAdaptiveTokens(profile, rk);
  }
  return map;
}
