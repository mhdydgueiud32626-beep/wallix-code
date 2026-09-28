/**
 * Computer Vision & Multi-Color Visual Intelligence Pipeline for Wallpapers
 * Extracts semantic color roles, spatial distribution, regional profiles, and texture metrics.
 */
import { 
  WallpaperVisualProfile, 
  ColorCluster, 
  PaletteEntry, 
  WarmCoolEstimate,
  WallpaperRegionKey,
  RegionalVisualProfile,
  SpatialDistribution,
  SemanticColorRole
} from './wallpaperAnalysisTypes';
import { 
  hexToRgb, 
  rgbToHex, 
  rgbToHsl, 
  hslToRgb,
  getRelativeLuminance, 
  calculateWarmCoolBalance, 
  sanitizeAdaptiveAccent,
  blendColors,
  colorDistance
} from './adaptiveMaterialUtils';
import { WallpaperAnalysisCache } from './WallpaperAnalysisCache';

const ANALYSIS_VERSION = 'v3.0';

/**
 * Creates default fallback profile when analysis is impossible
 */
export function createDefaultWallpaperVisualProfile(): WallpaperVisualProfile {
  const defaultClusters: ColorCluster[] = [
    { 
      center: [12, 18, 30], 
      color: '#0c121e',
      hex: '#0c121e', 
      weight: 0.65, 
      share: 0.65, 
      hue: 215, 
      saturation: 0.43, 
      sat: 0.43, 
      luminance: 0.08, 
      lum: 0.08,
      spatialDistribution: {
        global: 0.65,
        topLeft: 0.68,
        topCenter: 0.65,
        topRight: 0.62,
        center: 0.65,
        bottomLeft: 0.66,
        bottomCenter: 0.64,
        bottomRight: 0.63,
        rightStrip: 0.63,
      },
      confidence: 0.95
    },
    { 
      center: [0, 120, 215], 
      color: '#0078D7',
      hex: '#0078D7', 
      weight: 0.25, 
      share: 0.25, 
      hue: 206, 
      saturation: 1.0, 
      sat: 1.0, 
      luminance: 0.42, 
      lum: 0.42,
      spatialDistribution: {
        global: 0.25,
        topLeft: 0.22,
        topCenter: 0.25,
        topRight: 0.28,
        center: 0.25,
        bottomLeft: 0.24,
        bottomCenter: 0.26,
        bottomRight: 0.27,
        rightStrip: 0.27,
      },
      confidence: 0.95
    },
    { 
      center: [96, 205, 255], 
      color: '#60cdff',
      hex: '#60cdff', 
      weight: 0.10, 
      share: 0.10, 
      hue: 198, 
      saturation: 1.0, 
      sat: 1.0, 
      luminance: 0.68, 
      lum: 0.68,
      spatialDistribution: {
        global: 0.10,
        topLeft: 0.10,
        topCenter: 0.10,
        topRight: 0.10,
        center: 0.10,
        bottomLeft: 0.10,
        bottomCenter: 0.10,
        bottomRight: 0.10,
        rightStrip: 0.10,
      },
      confidence: 0.90
    },
  ];

  const defaultPalette: PaletteEntry[] = [
    { color: '#0c121e', rgb: [12, 18, 30], weight: 0.65, hue: 215, sat: 0.43, lum: 0.08, role: 'dominant' },
    { color: '#0078D7', rgb: [0, 120, 215], weight: 0.25, hue: 206, sat: 1.0, lum: 0.42, role: 'accent' },
    { color: '#60cdff', rgb: [96, 205, 255], weight: 0.10, hue: 198, sat: 1.0, lum: 0.68, role: 'highlight' },
  ];

  const defaultRegional: Record<WallpaperRegionKey, RegionalVisualProfile> = {
    'global': { region: 'global', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'top-left': { region: 'top-left', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'top-center': { region: 'top-center', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'top-right': { region: 'top-right', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.48, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.18)' },
    'center': { region: 'center', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'bottom-left': { region: 'bottom-left', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'bottom-center': { region: 'bottom-center', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.45, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.15)' },
    'bottom-right': { region: 'bottom-right', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.48, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.18)' },
    'right-strip': { region: 'right-strip', dominantColor: '#0c121e', secondaryColor: '#0078D7', accentCandidate: '#0078D7', averageLuminance: 0.35, averageSaturation: 0.48, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: -0.35, temperature: 'cool', tintColor: 'rgba(0, 120, 215, 0.18)' },
  };

  return {
    dominantColor: '#0c121e',
    secondaryColor: '#0078D7',
    tertiaryColor: '#60cdff',
    accentCandidate: '#0078D7',
    highlightColor: '#60cdff',
    shadowColor: '#070b13',
    neutralColor: '#1e293b',
    darkAnchorColor: '#070b13',
    lightAnchorColor: '#f1f5f9',
    warmColor: '#f97316',
    coolColor: '#0078D7',
    dominantHue: 215,
    secondaryHue: 206,
    tertiaryHue: 198,
    averageSaturation: 0.45,
    colorfulness: 0.40,
    grayscaleTendency: 0.15,
    averageLuminance: 0.35,
    luminanceRange: { min: 0.05, max: 0.85, stdDev: 0.22 },
    darkRatio: 0.35,
    darkPixelRatio: 0.35,
    brightRatio: 0.10,
    brightPixelRatio: 0.10,
    contrast: 0.65,
    temperature: 'cool',
    warmth: -0.35,
    warmCoolBalance: -0.35,
    complexity: 0.50,
    edgeDensity: 0.45,
    textureStrength: 0.45,
    highFrequencyEnergy: 0.40,
    colorClusters: defaultClusters,
    dominantClusters: defaultClusters,
    palette: defaultPalette,
    regionalProfiles: defaultRegional,
    confidence: 0.85,
    timestamp: Date.now(),
    analysisVersion: ANALYSIS_VERSION,
  };
}

/**
 * Creates a WallpaperVisualProfile from an array of hex colors (e.g. from Wallpaper metadata)
 * Evaluates semantic roles and generates spatial regional estimates.
 */
export function createProfileFromPalette(colors: string[], title: string = 'Wallpaper'): WallpaperVisualProfile {
  if (!colors || colors.length === 0) {
    return createDefaultWallpaperVisualProfile();
  }

  const validHexes = colors.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c) || /^#[0-9A-Fa-f]{3}$/.test(c));
  if (validHexes.length === 0) {
    return createDefaultWallpaperVisualProfile();
  }

  // Parse all colors with colorimetric data
  const parsed = validHexes.map((hex, idx) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const lum = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
    const warmCool = calculateWarmCoolBalance(rgb[0], rgb[1], rgb[2]);
    return { hex, rgb, hsl, lum, warmCool, idx };
  });

  // 1. Dominant Field Color:
  // First color or largest neutral/dark background mass if first color is dark
  const dominant = parsed[0];

  // 2. Accent Candidate:
  // Prioritize high saturation and comfortable mid-luminance (0.35 - 0.70)
  const candidateAccents = [...parsed].sort((a, b) => {
    const scoreA = a.hsl.s * 2.0 - Math.abs(a.lum - 0.50) * 1.5;
    const scoreB = b.hsl.s * 2.0 - Math.abs(b.lum - 0.50) * 1.5;
    return scoreB - scoreA;
  });
  const bestAccent = candidateAccents.find(c => c.hsl.s > 0.25 && c.lum > 0.20 && c.lum < 0.85) || parsed[1] || dominant;
  const sanitizedAccent = sanitizeAdaptiveAccent(bestAccent.hex);

  // 3. Secondary & Tertiary
  const secondary = parsed.find(p => p.hex !== dominant.hex && p.hex !== bestAccent.hex) || parsed[1] || dominant;
  const tertiary = parsed.find(p => p.hex !== dominant.hex && p.hex !== secondary.hex && p.hex !== bestAccent.hex) || parsed[2] || secondary;

  // 4. Highlight & Shadow
  const sortedByLum = [...parsed].sort((a, b) => a.lum - b.lum);
  const shadow = sortedByLum[0];
  const highlight = sortedByLum[sortedByLum.length - 1];

  // 5. Neutral Anchor
  const neutral = parsed.find(p => p.hsl.s < 0.25) || {
    hex: '#1e293b',
    rgb: [30, 41, 59] as [number, number, number],
    hsl: { h: 215, s: 0.32, l: 0.17 },
    lum: 0.10,
    warmCool: -0.2,
    idx: -1
  };

  // 6. Warm & Cool
  const warmColor = parsed.find(p => (p.hsl.h < 60 || p.hsl.h > 320) && p.hsl.s > 0.20)?.hex || '#f97316';
  const coolColor = parsed.find(p => (p.hsl.h >= 170 && p.hsl.h <= 260) && p.hsl.s > 0.20)?.hex || '#0078D7';

  // Aggregate stats
  const avgLum = parsed.reduce((sum, p) => sum + p.lum, 0) / parsed.length;
  const avgSat = parsed.reduce((sum, p) => sum + p.hsl.s, 0) / parsed.length;
  const warmCool = parsed.reduce((sum, p) => sum + p.warmCool, 0) / parsed.length;

  let temperature: WarmCoolEstimate = 'neutral';
  if (warmCool > 0.12) temperature = 'warm';
  else if (warmCool < -0.12) temperature = 'cool';

  const clusters: ColorCluster[] = parsed.map((p, i) => {
    const weight = i === 0 ? 0.45 : i === 1 ? 0.30 : 0.25 / Math.max(1, parsed.length - 2);
    return {
      center: p.rgb,
      color: p.hex,
      hex: p.hex,
      weight,
      share: weight,
      hue: p.hsl.h,
      saturation: p.hsl.s,
      sat: p.hsl.s,
      luminance: p.lum,
      lum: p.lum,
      spatialDistribution: {
        global: weight,
        topLeft: i === 0 ? 0.50 : 0.25,
        topCenter: i === 0 ? 0.45 : 0.25,
        topRight: i === 1 ? 0.45 : 0.25,
        center: i === 0 ? 0.40 : 0.30,
        bottomLeft: i === 0 ? 0.50 : 0.25,
        bottomCenter: i === 0 ? 0.45 : 0.25,
        bottomRight: i === 1 ? 0.45 : 0.25,
        rightStrip: i === 1 ? 0.40 : 0.30,
      },
      confidence: 0.95
    };
  });

  const palette: PaletteEntry[] = parsed.map((p, i) => {
    let role: SemanticColorRole = 'neutral';
    if (p.hex === dominant.hex) role = 'dominant';
    else if (p.hex === bestAccent.hex) role = 'accent';
    else if (p.hex === secondary.hex) role = 'secondary';
    else if (p.hex === tertiary.hex) role = 'tertiary';
    else if (p.hex === highlight.hex) role = 'highlight';
    else if (p.hex === shadow.hex) role = 'shadow';

    return {
      color: p.hex,
      rgb: p.rgb,
      weight: clusters[i]?.weight || 0.10,
      hue: p.hsl.h,
      sat: p.hsl.s,
      lum: p.lum,
      role,
    };
  });

  // Regional profiles map
  const regionalProfiles: Record<WallpaperRegionKey, RegionalVisualProfile> = {
    'global': { region: 'global', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'top-left': { region: 'top-left', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'top-center': { region: 'top-center', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'top-right': { region: 'top-right', dominantColor: secondary.hex, secondaryColor: dominant.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: secondary.lum, averageSaturation: secondary.hsl.s, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: secondary.warmCool, temperature, tintColor: `rgba(${secondary.rgb[0]}, ${secondary.rgb[1]}, ${secondary.rgb[2]}, 0.20)` },
    'center': { region: 'center', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'bottom-left': { region: 'bottom-left', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'bottom-center': { region: 'bottom-center', dominantColor: dominant.hex, secondaryColor: secondary.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: avgLum, averageSaturation: avgSat, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: warmCool, temperature, tintColor: `rgba(${dominant.rgb[0]}, ${dominant.rgb[1]}, ${dominant.rgb[2]}, 0.16)` },
    'bottom-right': { region: 'bottom-right', dominantColor: secondary.hex, secondaryColor: dominant.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: secondary.lum, averageSaturation: secondary.hsl.s, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: secondary.warmCool, temperature, tintColor: `rgba(${secondary.rgb[0]}, ${secondary.rgb[1]}, ${secondary.rgb[2]}, 0.20)` },
    'right-strip': { region: 'right-strip', dominantColor: secondary.hex, secondaryColor: dominant.hex, accentCandidate: sanitizedAccent.accent, averageLuminance: secondary.lum, averageSaturation: secondary.hsl.s, contrast: 0.65, textureStrength: 0.45, complexity: 0.50, warmth: secondary.warmCool, temperature, tintColor: `rgba(${secondary.rgb[0]}, ${secondary.rgb[1]}, ${secondary.rgb[2]}, 0.20)` },
  };

  return {
    dominantColor: dominant.hex,
    secondaryColor: secondary.hex,
    tertiaryColor: tertiary.hex,
    accentCandidate: sanitizedAccent.accent,
    highlightColor: highlight.hex,
    shadowColor: shadow.hex,
    neutralColor: neutral.hex,
    darkAnchorColor: shadow.lum < 0.2 ? shadow.hex : '#080d16',
    lightAnchorColor: highlight.lum > 0.8 ? highlight.hex : '#f8fafc',
    warmColor,
    coolColor,
    dominantHue: dominant.hsl.h,
    secondaryHue: secondary.hsl.h,
    tertiaryHue: tertiary.hsl.h,
    averageSaturation: avgSat,
    colorfulness: Math.min(1.0, avgSat * 1.4),
    grayscaleTendency: Math.max(0, 1.0 - avgSat * 2.5),
    averageLuminance: avgLum,
    luminanceRange: {
      min: Math.min(...parsed.map(p => p.lum)),
      max: Math.max(...parsed.map(p => p.lum)),
      stdDev: 0.20,
    },
    darkRatio: parsed.filter(p => p.lum < 0.25).length / parsed.length,
    darkPixelRatio: parsed.filter(p => p.lum < 0.25).length / parsed.length,
    brightRatio: parsed.filter(p => p.lum > 0.75).length / parsed.length,
    brightPixelRatio: parsed.filter(p => p.lum > 0.75).length / parsed.length,
    contrast: 0.65,
    temperature,
    warmth: warmCool,
    warmCoolBalance: warmCool,
    complexity: 0.48,
    edgeDensity: 0.42,
    textureStrength: 0.45,
    highFrequencyEnergy: 0.40,
    colorClusters: clusters,
    dominantClusters: clusters,
    palette,
    regionalProfiles,
    confidence: 0.94,
    timestamp: Date.now(),
    analysisVersion: ANALYSIS_VERSION,
  };
}

export class WallpaperAnalyzer {
  private static instance: WallpaperAnalyzer;

  private constructor() {}

  public static getInstance(): WallpaperAnalyzer {
    if (!WallpaperAnalyzer.instance) {
      WallpaperAnalyzer.instance = new WallpaperAnalyzer();
    }
    return WallpaperAnalyzer.instance;
  }

  /**
   * Analyzes an image URL or Blob, with caching and downsampling.
   * If curated metadata paletteHint is provided, enriches it instantly.
   */
  public async analyzeWallpaper(
    sourceUrlOrId: string,
    imageUrl?: string,
    paletteHint?: string[]
  ): Promise<WallpaperVisualProfile> {
    const cacheKey = sourceUrlOrId;
    const cached = WallpaperAnalysisCache.get(cacheKey, ANALYSIS_VERSION);
    if (cached) {
      console.log(`[WallpaperAnalyzer] Cache hit for ${sourceUrlOrId}: dominant=${cached.dominantColor}, accent=${cached.accentCandidate}`);
      return cached;
    }

    console.log(`[WallpaperAnalyzer] Analysis started: source=${sourceUrlOrId}, hint=${paletteHint?.join(',')}`);
    const urlToLoad = imageUrl || sourceUrlOrId;

    // 1. If curated paletteHint is available (from WALLIX wallpaper metadata), use it for instantaneous, zero-latency profile
    if (paletteHint && paletteHint.length > 0) {
      const validColors = paletteHint.filter(c => /^#[0-9A-Fa-f]{3,8}$/.test(c));
      if (validColors.length > 0) {
        console.log(`[WallpaperAnalyzer] Prioritizing curated palette hint for instant reactivity:`, validColors);
        const profile = createProfileFromPalette(validColors);
        WallpaperAnalysisCache.set(cacheKey, profile, ANALYSIS_VERSION);
        return profile;
      }
    }

    // 2. If this is a video URL (ends in .mp4, .webm, or contains /videos/)
    const isVideo = urlToLoad.endsWith('.mp4') || urlToLoad.endsWith('.webm') || urlToLoad.includes('/videos/');
    if (isVideo) {
      if (paletteHint && paletteHint.length > 0) {
        const profile = createProfileFromPalette(paletteHint);
        WallpaperAnalysisCache.set(cacheKey, profile, ANALYSIS_VERSION);
        return profile;
      }
      return createDefaultWallpaperVisualProfile();
    }

    // 3. Try loading image and sampling via HTML5 Canvas
    try {
      const img = await this.loadImage(urlToLoad);
      const profile = this.analyzeImageElement(img);
      WallpaperAnalysisCache.set(cacheKey, profile, ANALYSIS_VERSION);
      console.log(`[WallpaperAnalyzer] Canvas analysis complete: dominant=${profile.dominantColor}, accent=${profile.accentCandidate}, texture=${profile.textureStrength.toFixed(2)}, lum=${profile.averageLuminance.toFixed(2)}, temp=${profile.temperature}`);
      return profile;
    } catch (err) {
      console.warn('[WallpaperAnalyzer] Image canvas analysis failed (CORS / network):', err);
      
      // 4. Fallback to paletteHint if available
      if (paletteHint && paletteHint.length > 0) {
        const profile = createProfileFromPalette(paletteHint);
        WallpaperAnalysisCache.set(cacheKey, profile, ANALYSIS_VERSION);
        console.log(`[WallpaperAnalyzer] Resolved via palette hint: dominant=${profile.dominantColor}, accent=${profile.accentCandidate}`);
        return profile;
      }

      const fallback = createDefaultWallpaperVisualProfile();
      return fallback;
    }
  }

  /**
   * Analyzes an active HTMLImageElement or HTMLVideoElement.
   * Performs spatial color clustering, texture energy filtering, and regional sector profiling.
   */
  public analyzeImageElement(
    mediaElement: HTMLImageElement | HTMLVideoElement
  ): WallpaperVisualProfile {
    const sampleWidth = 64;
    const sampleHeight = 36;
    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      return createDefaultWallpaperVisualProfile();
    }

    ctx.drawImage(mediaElement, 0, 0, sampleWidth, sampleHeight);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;

    // 1. Accumulators for Statistical Metrics
    let totalLuminance = 0;
    let totalSaturation = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    let totalWarmCool = 0;
    const luminances: number[] = [];

    // Spatial gradient and Laplacian accumulators for texture & high frequency energy
    let totalGradientDiff = 0;
    let totalLaplacianEnergy = 0;

    // Regional sector accumulators
    interface SectorData {
      pixelCount: number;
      rSum: number;
      gSum: number;
      bSum: number;
      lumSum: number;
      satSum: number;
      warmCoolSum: number;
      colors: Map<string, number>;
    }

    const createSector = (): SectorData => ({
      pixelCount: 0,
      rSum: 0,
      gSum: 0,
      bSum: 0,
      lumSum: 0,
      satSum: 0,
      warmCoolSum: 0,
      colors: new Map()
    });

    const sectors: Record<WallpaperRegionKey, SectorData> = {
      'global': createSector(),
      'top-left': createSector(),
      'top-center': createSector(),
      'top-right': createSector(),
      'center': createSector(),
      'bottom-left': createSector(),
      'bottom-center': createSector(),
      'bottom-right': createSector(),
      'right-strip': createSector(),
    };

    // Color Quantization Bins (pre-quantized to 32-value buckets for clustering)
    interface RawColorBin {
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
      regionalCounts: Record<WallpaperRegionKey, number>;
    }

    const colorBins = new Map<string, RawColorBin>();

    // Helper to get pixel index
    const getIdx = (x: number, y: number) => (y * sampleWidth + x) * 4;

    for (let y = 0; y < sampleHeight; y++) {
      for (let x = 0; x < sampleWidth; x++) {
        const idx = getIdx(x, y);
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 128) continue; // Ignore transparent pixels

        // Relative Luminance
        const lum = getRelativeLuminance(r, g, b);
        luminances.push(lum);
        totalLuminance += lum;

        if (lum < 0.22) darkPixels++;
        if (lum > 0.78) brightPixels++;

        // HSL Saturation
        const hsl = rgbToHsl(r, g, b);
        totalSaturation += hsl.s;

        // Warm/Cool
        const warmCool = calculateWarmCoolBalance(r, g, b);
        totalWarmCool += warmCool;

        // --- Texture Analysis ---
        // 1. First-order gradient magnitude (horizontal and vertical differences)
        if (x > 0 && y > 0) {
          const leftIdx = getIdx(x - 1, y);
          const topIdx = getIdx(x, y - 1);
          const diffH = Math.abs(r - data[leftIdx]) + Math.abs(g - data[leftIdx + 1]) + Math.abs(b - data[leftIdx + 2]);
          const diffV = Math.abs(r - data[topIdx]) + Math.abs(g - data[topIdx + 1]) + Math.abs(b - data[topIdx + 2]);
          totalGradientDiff += (diffH + diffV) / 2;
        }

        // 2. Second-order Laplacian high-frequency energy
        if (x > 0 && x < sampleWidth - 1 && y > 0 && y < sampleHeight - 1) {
          const lIdx = getIdx(x - 1, y);
          const rIdx = getIdx(x + 1, y);
          const uIdx = getIdx(x, y - 1);
          const dIdx = getIdx(x, y + 1);

          const lapR = Math.abs(4 * r - data[lIdx] - data[rIdx] - data[uIdx] - data[dIdx]);
          const lapG = Math.abs(4 * g - data[lIdx + 1] - data[rIdx + 1] - data[uIdx + 1] - data[dIdx + 1]);
          const lapB = Math.abs(4 * b - data[lIdx + 2] - data[rIdx + 2] - data[uIdx + 2] - data[dIdx + 2]);
          totalLaplacianEnergy += (lapR + lapG + lapB) / 3;
        }

        // --- Spatial Classification ---
        const activeRegions: WallpaperRegionKey[] = ['global'];

        // 3x2 Grid
        const isTop = y < Math.floor(sampleHeight / 2);
        const isLeft = x < Math.floor(sampleWidth / 3);
        const isCenterCol = x >= Math.floor(sampleWidth / 3) && x < Math.floor((sampleWidth * 2) / 3);
        const isRight = x >= Math.floor((sampleWidth * 2) / 3);

        if (isTop) {
          if (isLeft) activeRegions.push('top-left');
          else if (isCenterCol) activeRegions.push('top-center');
          else if (isRight) activeRegions.push('top-right');
        } else {
          if (isLeft) activeRegions.push('bottom-left');
          else if (isCenterCol) activeRegions.push('bottom-center');
          else if (isRight) activeRegions.push('bottom-right');
        }

        // Center focal box (middle 50% width and height)
        if (
          x >= Math.floor(sampleWidth * 0.25) &&
          x < Math.floor(sampleWidth * 0.75) &&
          y >= Math.floor(sampleHeight * 0.25) &&
          y < Math.floor(sampleHeight * 0.75)
        ) {
          activeRegions.push('center');
        }

        // Right docked strip (rightmost 30% from top to bottom)
        if (x >= Math.floor(sampleWidth * 0.70)) {
          activeRegions.push('right-strip');
        }

        // Quantized 5-bit color key
        const qr = Math.floor(r / 24) * 24;
        const qg = Math.floor(g / 24) * 24;
        const qb = Math.floor(b / 24) * 24;
        const binKey = `${qr},${qg},${qb}`;

        let bin = colorBins.get(binKey);
        if (!bin) {
          bin = {
            rSum: 0,
            gSum: 0,
            bSum: 0,
            count: 0,
            regionalCounts: {
              'global': 0,
              'top-left': 0,
              'top-center': 0,
              'top-right': 0,
              'center': 0,
              'bottom-left': 0,
              'bottom-center': 0,
              'bottom-right': 0,
              'right-strip': 0,
            }
          };
          colorBins.set(binKey, bin);
        }

        bin.rSum += r;
        bin.gSum += g;
        bin.bSum += b;
        bin.count++;

        // Add to active regions
        for (const reg of activeRegions) {
          bin.regionalCounts[reg]++;
          const sec = sectors[reg];
          sec.pixelCount++;
          sec.rSum += r;
          sec.gSum += g;
          sec.bSum += b;
          sec.lumSum += lum;
          sec.satSum += hsl.s;
          sec.warmCoolSum += warmCool;
          sec.colors.set(binKey, (sec.colors.get(binKey) || 0) + 1);
        }
      }
    }

    const validCount = luminances.length || 1;
    const avgLum = totalLuminance / validCount;
    const avgSat = totalSaturation / validCount;
    const darkRatio = darkPixels / validCount;
    const brightRatio = brightPixels / validCount;
    const warmCoolBal = totalWarmCool / validCount;

    // Luminance standard deviation (contrast measure)
    let varianceSum = 0;
    let minLum = 1;
    let maxLum = 0;
    for (const lum of luminances) {
      varianceSum += (lum - avgLum) ** 2;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
    const stdDev = Math.sqrt(varianceSum / validCount);
    const contrast = Math.min(1.0, stdDev * 2.8 + (maxLum - minLum) * 0.3);

    // Texture Metrics Normalization
    const maxPossibleDiff = (sampleWidth - 1) * (sampleHeight - 1) * 3 * 255;
    const edgeDensity = Math.min(1.0, (totalGradientDiff / maxPossibleDiff) * 5.0);
    const highFrequencyEnergy = Math.min(1.0, (totalLaplacianEnergy / maxPossibleDiff) * 4.2);
    const textureStrength = Math.min(1.0, edgeDensity * 0.6 + highFrequencyEnergy * 0.4);
    const complexity = Math.min(1.0, textureStrength * 0.7 + (colorBins.size / 64) * 0.3);

    // Temperature classification
    let temperature: WarmCoolEstimate = 'neutral';
    if (warmCoolBal > 0.12) temperature = 'warm';
    else if (warmCoolBal < -0.12) temperature = 'cool';

    // 2. Perform Quantized Clustering (Merge visually proximate bins into 4-8 distinct clusters)
    interface InterimCluster {
      center: [number, number, number];
      count: number;
      regionalCounts: Record<WallpaperRegionKey, number>;
    }

    const sortedBins = Array.from(colorBins.values()).sort((a, b) => b.count - a.count);
    const mergedClusters: InterimCluster[] = [];

    for (const bin of sortedBins) {
      const bColor: [number, number, number] = [
        Math.round(bin.rSum / bin.count),
        Math.round(bin.gSum / bin.count),
        Math.round(bin.bSum / bin.count),
      ];

      // Check if this bin is close to an existing cluster (Euclidean distance < 38)
      let matchedCluster: InterimCluster | null = null;
      for (const cl of mergedClusters) {
        if (colorDistance(bColor, cl.center) < 38) {
          matchedCluster = cl;
          break;
        }
      }

      if (matchedCluster) {
        // Merge into existing cluster
        const totalCount = matchedCluster.count + bin.count;
        matchedCluster.center[0] = Math.round((matchedCluster.center[0] * matchedCluster.count + bColor[0] * bin.count) / totalCount);
        matchedCluster.center[1] = Math.round((matchedCluster.center[1] * matchedCluster.count + bColor[1] * bin.count) / totalCount);
        matchedCluster.center[2] = Math.round((matchedCluster.center[2] * matchedCluster.count + bColor[2] * bin.count) / totalCount);
        matchedCluster.count = totalCount;
        for (const reg of Object.keys(bin.regionalCounts) as WallpaperRegionKey[]) {
          matchedCluster.regionalCounts[reg] = (matchedCluster.regionalCounts[reg] || 0) + bin.regionalCounts[reg];
        }
      } else if (mergedClusters.length < 8) {
        // Create new cluster
        mergedClusters.push({
          center: bColor,
          count: bin.count,
          regionalCounts: { ...bin.regionalCounts }
        });
      }
    }

    // Convert to ColorCluster instances with full spatial distributions
    const clusters: ColorCluster[] = mergedClusters.map((mc) => {
      const hex = rgbToHex(mc.center[0], mc.center[1], mc.center[2]);
      const hsl = rgbToHsl(mc.center[0], mc.center[1], mc.center[2]);
      const lum = getRelativeLuminance(mc.center[0], mc.center[1], mc.center[2]);
      const weight = mc.count / validCount;

      const sp: SpatialDistribution = {
        global: weight,
        topLeft: (mc.regionalCounts['top-left'] || 0) / (sectors['top-left'].pixelCount || 1),
        topCenter: (mc.regionalCounts['top-center'] || 0) / (sectors['top-center'].pixelCount || 1),
        topRight: (mc.regionalCounts['top-right'] || 0) / (sectors['top-right'].pixelCount || 1),
        center: (mc.regionalCounts['center'] || 0) / (sectors['center'].pixelCount || 1),
        bottomLeft: (mc.regionalCounts['bottom-left'] || 0) / (sectors['bottom-left'].pixelCount || 1),
        bottomCenter: (mc.regionalCounts['bottom-center'] || 0) / (sectors['bottom-center'].pixelCount || 1),
        bottomRight: (mc.regionalCounts['bottom-right'] || 0) / (sectors['bottom-right'].pixelCount || 1),
        rightStrip: (mc.regionalCounts['right-strip'] || 0) / (sectors['right-strip'].pixelCount || 1),
      };

      return {
        center: mc.center,
        color: hex,
        hex,
        weight,
        share: weight,
        hue: hsl.h,
        saturation: hsl.s,
        sat: hsl.s,
        luminance: lum,
        lum,
        spatialDistribution: sp,
        confidence: 0.95,
      };
    }).sort((a, b) => b.weight - a.weight);

    // 3. Multi-Color Semantic Role Resolution
    // RULE: Dominant Field Color is the background visual mass (largest weight).
    const dominantCluster = clusters[0] || {
      center: [12, 18, 30] as [number, number, number],
      color: '#0c121e',
      hex: '#0c121e',
      weight: 1.0,
      share: 1.0,
      hue: 215,
      saturation: 0.43,
      sat: 0.43,
      luminance: 0.08,
      lum: 0.08,
      spatialDistribution: { global: 1, topLeft: 1, topCenter: 1, topRight: 1, center: 1, bottomLeft: 1, bottomCenter: 1, bottomRight: 1, rightStrip: 1 },
      confidence: 0.95
    };

    // RULE: Visual Accent Color is the chromatic salient color, NOT necessarily the largest mass!
    // Compute salience score for each cluster
    const scoredAccents = [...clusters].map((cl) => {
      const isDominant = cl === dominantCluster;
      const hueDist = Math.abs(cl.hue - dominantCluster.hue);
      const chromaticSeparation = isDominant ? 0.0 : (hueDist > 30 || dominantCluster.sat < 0.2) ? 0.40 : 0.15;
      
      // Salience balances saturation, comfortable middle luminance (0.35 - 0.70), and separation from dominant background
      const lumPenalty = Math.abs(cl.lum - 0.52) * 1.5;
      const satReward = cl.sat * 2.2;
      const massFactor = Math.min(0.35, cl.weight) + 0.1;

      const salience = satReward - lumPenalty + chromaticSeparation + massFactor;
      return { cluster: cl, salience };
    }).sort((a, b) => b.salience - a.salience);

    // Pick top salient candidate with sat > 0.25 and lum between 0.18 and 0.82
    const bestAccentCluster = scoredAccents.find(sa => sa.cluster.sat > 0.25 && sa.cluster.lum > 0.18 && sa.cluster.lum < 0.82)?.cluster 
      || scoredAccents[0]?.cluster 
      || dominantCluster;

    const sanitizedAccent = sanitizeAdaptiveAccent(bestAccentCluster.hex);

    // Secondary & Tertiary selection
    const secondaryCluster = clusters.find(c => c !== dominantCluster && c !== bestAccentCluster) || clusters[1] || dominantCluster;
    const tertiaryCluster = clusters.find(c => c !== dominantCluster && c !== secondaryCluster && c !== bestAccentCluster) || clusters[2] || secondaryCluster;

    // Highlight & Shadow selection
    const sortedByLum = [...clusters].sort((a, b) => a.lum - b.lum);
    const shadowCluster = sortedByLum[0];
    const highlightCluster = sortedByLum[sortedByLum.length - 1];

    // Neutral mid-tone anchor
    const neutralCluster = clusters.find(c => c.sat < 0.25 && c.lum > 0.12 && c.lum < 0.55) || {
      hex: '#1e293b',
      center: [30, 41, 59] as [number, number, number],
      lum: 0.10,
      sat: 0.32,
      hue: 215,
      color: '#1e293b',
      weight: 0.1,
      share: 0.1,
      luminance: 0.10,
      saturation: 0.32,
      spatialDistribution: dominantCluster.spatialDistribution,
      confidence: 0.8
    };

    // Warm & Cool accents
    const warmCl = clusters.find(c => (c.hue < 60 || c.hue > 320) && c.sat > 0.22);
    const coolCl = clusters.find(c => (c.hue >= 170 && c.hue <= 260) && c.sat > 0.22);

    // 4. Assemble Palette
    const palette: PaletteEntry[] = clusters.slice(0, 6).map((c) => {
      let role: SemanticColorRole = 'neutral';
      if (c === dominantCluster) role = 'dominant';
      else if (c === bestAccentCluster) role = 'accent';
      else if (c === secondaryCluster) role = 'secondary';
      else if (c === tertiaryCluster) role = 'tertiary';
      else if (c === highlightCluster) role = 'highlight';
      else if (c === shadowCluster) role = 'shadow';

      return {
        color: c.hex,
        rgb: c.center,
        weight: c.weight,
        hue: c.hue,
        sat: c.sat,
        lum: c.lum,
        role,
      };
    });

    // 5. Derive Regional Profiles for all Shell Surfaces
    const regionalProfiles: Record<WallpaperRegionKey, RegionalVisualProfile> = {} as Record<WallpaperRegionKey, RegionalVisualProfile>;
    const regionKeys: WallpaperRegionKey[] = [
      'global', 'top-left', 'top-center', 'top-right', 'center',
      'bottom-left', 'bottom-center', 'bottom-right', 'right-strip'
    ];

    for (const rk of regionKeys) {
      const sec = sectors[rk];
      const pCount = sec.pixelCount || 1;
      const regAvgLum = sec.lumSum / pCount;
      const regAvgSat = sec.satSum / pCount;
      const regWarmCool = sec.warmCoolSum / pCount;
      const regTemp: WarmCoolEstimate = regWarmCool > 0.12 ? 'warm' : regWarmCool < -0.12 ? 'cool' : 'neutral';

      // Find top color in this region
      let topRegionBinKey = '';
      let topRegionCount = 0;
      for (const [bKey, count] of sec.colors.entries()) {
        if (count > topRegionCount) {
          topRegionCount = count;
          topRegionBinKey = bKey;
        }
      }

      let regDominant = dominantCluster.hex;
      if (topRegionBinKey) {
        const [qr, qg, qb] = topRegionBinKey.split(',').map(Number);
        regDominant = rgbToHex(qr, qg, qb);
      }

      // Check if region has high local saturation or accent
      const localAccentCluster = clusters.find(cl => cl.spatialDistribution[rk === 'right-strip' ? 'rightStrip' : (rk === 'top-left' ? 'topLeft' : rk === 'top-center' ? 'topCenter' : rk === 'top-right' ? 'topRight' : rk === 'bottom-left' ? 'bottomLeft' : rk === 'bottom-center' ? 'bottomCenter' : rk === 'bottom-right' ? 'bottomRight' : 'center')] > 0.20 && cl.sat > 0.30) || bestAccentCluster;

      const regRgb = hexToRgb(regDominant);
      const tintAlpha = Math.min(0.28, 0.14 + regAvgSat * 0.18);

      regionalProfiles[rk] = {
        region: rk,
        dominantColor: regDominant,
        secondaryColor: secondaryCluster.hex,
        accentCandidate: sanitizeAdaptiveAccent(localAccentCluster.hex).accent,
        averageLuminance: regAvgLum,
        averageSaturation: regAvgSat,
        contrast,
        textureStrength,
        complexity,
        warmth: regWarmCool,
        temperature: regTemp,
        tintColor: `rgba(${regRgb[0]}, ${regRgb[1]}, ${regRgb[2]}, ${tintAlpha.toFixed(2)})`
      };
    }

    return {
      dominantColor: dominantCluster.hex,
      secondaryColor: secondaryCluster.hex,
      tertiaryColor: tertiaryCluster.hex,
      accentCandidate: sanitizedAccent.accent,
      highlightColor: highlightCluster.hex,
      shadowColor: shadowCluster.hex,
      neutralColor: neutralCluster.hex,
      darkAnchorColor: shadowCluster.lum < 0.20 ? shadowCluster.hex : '#070b13',
      lightAnchorColor: highlightCluster.lum > 0.80 ? highlightCluster.hex : '#f8fafc',
      warmColor: warmCl?.hex || '#f97316',
      coolColor: coolCl?.hex || '#0078D7',
      dominantHue: dominantCluster.hue,
      secondaryHue: secondaryCluster.hue,
      tertiaryHue: tertiaryCluster.hue,
      averageSaturation: avgSat,
      colorfulness: Math.min(1.0, avgSat * 1.3 + (1 - Math.abs(warmCoolBal)) * 0.1),
      grayscaleTendency: Math.max(0, 1.0 - avgSat * 2.2),
      averageLuminance: avgLum,
      luminanceRange: { min: minLum, max: maxLum, stdDev },
      darkRatio,
      darkPixelRatio: darkRatio,
      brightRatio,
      brightPixelRatio: brightRatio,
      contrast,
      temperature,
      warmth: warmCoolBal,
      warmCoolBalance: warmCoolBal,
      complexity,
      edgeDensity,
      textureStrength,
      highFrequencyEnergy,
      colorClusters: clusters,
      dominantClusters: clusters,
      palette,
      regionalProfiles,
      confidence: 0.95,
      timestamp: Date.now(),
      analysisVersion: ANALYSIS_VERSION,
    };
  }

  /**
   * Local wallpaper region analysis request
   * Allows extracting a contextual profile for any arbitrary bounding box [x, y, width, height] (0.0 to 1.0)
   */
  public analyzeRegion(
    profile: WallpaperVisualProfile,
    x: number,
    y: number,
    width: number,
    height: number
  ): RegionalVisualProfile {
    // Map normalized coordinates to closest cached regional sector
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    let targetRegion: WallpaperRegionKey = 'center';

    if (x >= 0.70 || (centerX >= 0.75 && height > 0.6)) {
      targetRegion = 'right-strip';
    } else if (centerY < 0.45) {
      if (centerX < 0.33) targetRegion = 'top-left';
      else if (centerX > 0.66) targetRegion = 'top-right';
      else targetRegion = 'top-center';
    } else if (centerY > 0.65) {
      if (centerX < 0.33) targetRegion = 'bottom-left';
      else if (centerX > 0.66) targetRegion = 'bottom-right';
      else targetRegion = 'bottom-center';
    }

    if (profile.regionalProfiles && profile.regionalProfiles[targetRegion]) {
      return profile.regionalProfiles[targetRegion];
    }

    // Default fallback
    return {
      region: targetRegion,
      dominantColor: profile.dominantColor,
      secondaryColor: profile.secondaryColor,
      accentCandidate: profile.accentCandidate,
      averageLuminance: profile.averageLuminance,
      averageSaturation: profile.averageSaturation,
      contrast: profile.contrast,
      textureStrength: profile.textureStrength,
      complexity: profile.complexity,
      warmth: profile.warmth,
      temperature: profile.temperature,
      tintColor: `rgba(0, 120, 215, 0.15)`
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error(`Image load timed out for ${src}`));
      }, 2000);

      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!timedOut) {
          clearTimeout(timeoutId);
          resolve(img);
        }
      };
      img.onerror = (e) => {
        if (!timedOut) {
          clearTimeout(timeoutId);
          reject(e);
        }
      };
      img.src = src;
    });
  }
}

export const wallpaperAnalyzer = WallpaperAnalyzer.getInstance();
export default wallpaperAnalyzer;
