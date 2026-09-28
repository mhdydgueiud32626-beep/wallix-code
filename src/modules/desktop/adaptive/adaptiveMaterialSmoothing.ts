/**
 * Temporal Smoothing & Exponential Interpolation for Adaptive Design Tokens
 * Ensures smooth, flicker-free transitions when switching wallpapers or sampling live frames.
 */
import { AdaptiveDesignTokens } from './adaptiveMaterialTypes';

/**
 * Parses rgba(r, g, b, a) string into numbers
 */
function parseRgba(str: string): [number, number, number, number] {
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return [12, 18, 30, 0.75];
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] !== undefined ? Number(match[4]) : 1,
  ];
}

/**
 * Formats RGBA numbers to string
 */
function formatRgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

/**
 * Linear interpolation between two numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolates two RGBA strings
 */
function interpolateRgba(str1: string, str2: string, t: number): string {
  const [r1, g1, b1, a1] = parseRgba(str1);
  const [r2, g2, b2, a2] = parseRgba(str2);
  return formatRgba(
    lerp(r1, r2, t),
    lerp(g1, g2, t),
    lerp(b1, b2, t),
    lerp(a1, a2, t)
  );
}

/**
 * Smooths current tokens toward target tokens by step factor t (e.g. t = 0.25)
 */
export function smoothAdaptiveTokens(
  current: AdaptiveDesignTokens,
  target: AdaptiveDesignTokens,
  t: number = 0.25
): AdaptiveDesignTokens {
  const clampedT = Math.max(0, Math.min(1, t));

  // If t == 1, instant snap
  if (clampedT === 1) return target;

  const smoothHeroBg = interpolateRgba(current.heroGlass.background, target.heroGlass.background, clampedT);
  const smoothDarkHeroBg = interpolateRgba(current.heroGlass.darkBackground, target.heroGlass.darkBackground, clampedT);
  const smoothOpacity = lerp(current.heroGlass.opacity, target.heroGlass.opacity, clampedT);
  const smoothBlur = Math.round(lerp(current.heroGlass.blurPx, target.heroGlass.blurPx, clampedT));
  const smoothSat = Math.round(lerp(current.heroGlass.saturationPercent, target.heroGlass.saturationPercent, clampedT));
  const smoothGlow = interpolateRgba(current.heroGlass.ambientGlow, target.heroGlass.ambientGlow, clampedT);
  const smoothBottomBg = interpolateRgba(current.bottomSurface.background, target.bottomSurface.background, clampedT);

  return {
    ...target,
    heroGlass: {
      ...target.heroGlass,
      background: smoothHeroBg,
      darkBackground: smoothDarkHeroBg,
      opacity: smoothOpacity,
      blurPx: smoothBlur,
      saturationPercent: smoothSat,
      ambientGlow: smoothGlow,
    },
    bottomSurface: {
      ...target.bottomSurface,
      background: smoothBottomBg,
    },
    cssVariables: {
      ...target.cssVariables,
      '--wallix-hero-glass-bg': smoothHeroBg,
      '--wallix-hero-glass-blur': `${smoothBlur}px`,
      '--wallix-hero-glass-sat': `${smoothSat}%`,
      '--wallix-ambient-glow': smoothGlow,
      '--wallix-bottom-strip-bg': smoothBottomBg,
    },
  };
}
