/**
 * Pure Mathematical & Colorimetric Utilities for Wallpaper Adaptive Materials
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 1
  l: number; // 0 - 1
}

/**
 * Converts Hex string to [r, g, b] array
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [12, 18, 30]; // default dark fallback
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts [r, g, b] to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts [r, g, b] to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      case bn:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s, l };
}

/**
 * Converts HSL to [r, g, b]
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/**
 * Relative Luminance according to ITU-R BT.709 with standard sRGB linearization
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG 2.1 Contrast Ratio between two relative luminances (1.0 to 21.0)
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Calculates Warm/Cool Balance from RGB:
 * Returns -1.0 (Cool/Blue/Cyan) to +1.0 (Warm/Red/Amber)
 */
export function calculateWarmCoolBalance(r: number, g: number, b: number): number {
  const redWeight = r / 255;
  const blueWeight = b / 255;
  const greenWeight = g / 255;

  // Red + half green contributes to warmth; blue + half green to coolness
  const warmScore = redWeight + greenWeight * 0.2;
  const coolScore = blueWeight + greenWeight * 0.4;
  const diff = warmScore - coolScore;

  return Math.max(-1, Math.min(1, diff));
}

/**
 * Ensures an Accent Candidate is accessible, readable, and visually stable in Windows Shell.
 * Clamps overly extreme hue saturation or muddy darkness.
 */
export function sanitizeAdaptiveAccent(
  candidateHex: string,
  fallbackHex: string = '#0078D7'
): { accent: string; strong: string; soft: string; isHarmonic: boolean } {
  const [r, g, b] = hexToRgb(candidateHex);
  const hsl = rgbToHsl(r, g, b);

  // If candidate is nearly grayscale or extremely low luminance, fallback to Windows Blue
  if (hsl.s < 0.15 || hsl.l < 0.15 || hsl.l > 0.88) {
    return {
      accent: fallbackHex,
      strong: '#0063B1',
      soft: 'rgba(0, 120, 215, 0.22)',
      isHarmonic: false,
    };
  }

  // Safe harmonic adjustment: keep saturation vibrant (0.65 - 0.95) and luminance bounded (0.42 - 0.58)
  const safeSat = Math.max(0.65, Math.min(0.95, hsl.s));
  const safeLum = Math.max(0.42, Math.min(0.56, hsl.l));

  const [ar, ag, ab] = hslToRgb(hsl.h, safeSat, safeLum);
  const [sr, sg, sb] = hslToRgb(hsl.h, safeSat, Math.max(0.32, safeLum - 0.10));

  const accentHex = rgbToHex(ar, ag, ab);
  const strongHex = rgbToHex(sr, sg, sb);
  const softRgba = `rgba(${ar}, ${ag}, ${ab}, 0.24)`;

  return {
    accent: accentHex,
    strong: strongHex,
    soft: softRgba,
    isHarmonic: true,
  };
}

/**
 * Blend two colors linearly
 */
export function blendColors(
  c1: [number, number, number],
  c2: [number, number, number],
  weight: number
): [number, number, number] {
  const w = Math.max(0, Math.min(1, weight));
  return [
    Math.round(c1[0] * (1 - w) + c2[0] * w),
    Math.round(c1[1] * (1 - w) + c2[1] * w),
    Math.round(c1[2] * (1 - w) + c2[2] * w),
  ];
}

/**
 * Weighted Euclidean color distance in perceptual RGB space
 */
export function colorDistance(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  const rmean = (c1[0] + c2[0]) / 2;
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
    4 * dg * dg +
    (((767 - rmean) * db * db) >> 8)
  );
}

/**
 * WCAG AA Contrast validator: returns foreground color guaranteed to have >= 4.5:1 ratio
 */
export function getAccessibleTextColor(
  bgRgb: [number, number, number],
  preferWhite: boolean = true
): string {
  const bgLum = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  const whiteLum = 1.0;
  const darkLum = getRelativeLuminance(15, 23, 42); // slate-900

  const whiteContrast = getContrastRatio(whiteLum, bgLum);
  const darkContrast = getContrastRatio(darkLum, bgLum);

  if (preferWhite && whiteContrast >= 4.5) {
    return '#FFFFFF';
  }
  if (!preferWhite && darkContrast >= 4.5) {
    return '#0f172a';
  }
  return whiteContrast >= darkContrast ? '#FFFFFF' : '#0f172a';
}

