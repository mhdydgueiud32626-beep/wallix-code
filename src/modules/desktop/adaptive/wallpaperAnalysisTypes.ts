/**
 * Typed Definitions for Wallpaper Computer Vision & Visual Profile Analysis
 */

export interface SpatialDistribution {
  global: number;       // Overall image weight 0.0 - 1.0
  topLeft: number;      // Top-left sector weight 0.0 - 1.0
  topCenter: number;    // Top-center sector weight 0.0 - 1.0
  topRight: number;     // Top-right sector weight 0.0 - 1.0
  center: number;       // Center focal sector weight 0.0 - 1.0
  bottomLeft: number;   // Bottom-left sector weight 0.0 - 1.0
  bottomCenter: number; // Bottom-center sector weight 0.0 - 1.0
  bottomRight: number;  // Bottom-right sector weight 0.0 - 1.0
  rightStrip?: number;  // Full right dock strip (x: 0.70-1.0, y: 0.0-1.0)
}

export interface ColorCluster {
  center: [number, number, number]; // [r, g, b] 0-255
  color: string; // hex string e.g. '#2b3a4a'
  hex: string;   // alias for backwards-compatibility
  weight: number; // 0.0 - 1.0 (proportion of visual mass)
  share: number;  // alias for backwards-compatibility
  luminance: number; // 0.0 - 1.0
  lum: number;       // alias
  saturation: number;// 0.0 - 1.0
  sat: number;       // alias
  hue: number;       // 0 - 360
  spatialDistribution: SpatialDistribution;
  confidence: number; // 0.0 - 1.0
}

export type SemanticColorRole = 
  | 'dominant' 
  | 'secondary' 
  | 'tertiary' 
  | 'accent' 
  | 'highlight' 
  | 'shadow' 
  | 'neutral' 
  | 'muted';

export interface PaletteEntry {
  color: string;
  rgb: [number, number, number];
  weight: number;
  hue: number;
  sat: number;
  lum: number;
  role: SemanticColorRole;
}

export type WarmCoolEstimate = 'warm' | 'cool' | 'neutral';

export type WallpaperRegionKey = 
  | 'global'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'right-strip';

export interface RegionalVisualProfile {
  region: WallpaperRegionKey;
  dominantColor: string;
  secondaryColor: string;
  accentCandidate: string;
  averageLuminance: number;
  averageSaturation: number;
  contrast: number;
  textureStrength: number;
  complexity: number;
  warmth: number;
  temperature: WarmCoolEstimate;
  tintColor: string;
}

export interface WallpaperVisualProfile {
  // 1. Semantic Palette Roles
  dominantColor: string;     // Background visual field mass (e.g. '#121a28')
  secondaryColor: string;    // Second prominent field color
  tertiaryColor: string;     // Third supporting color in composition
  accentCandidate: string;   // Visually salient chromatic color for active controls
  highlightColor: string;    // Lightest specular/accent highlight (e.g. '#eaf2ff')
  shadowColor: string;       // Deepest shadow / neutral base (e.g. '#070b13')
  neutralColor: string;      // Balanced desaturated anchor for inactive cards
  darkAnchorColor: string;   // Deepest dark anchor reflecting wallpaper temperature
  lightAnchorColor: string;  // Lightest anchor reflecting wallpaper temperature
  warmColor: string;         // Most distinct warm chroma if present
  coolColor: string;         // Most distinct cool chroma if present

  // 2. Color Space Characteristics
  dominantHue: number;       // 0 - 360
  secondaryHue: number;      // 0 - 360
  tertiaryHue: number;       // 0 - 360
  averageSaturation: number; // 0.0 - 1.0
  colorfulness: number;      // 0.0 - 1.0
  grayscaleTendency: number; // 0.0 (vibrant) - 1.0 (pure monochrome)

  // 3. Luminance & Contrast Metrics
  averageLuminance: number;  // 0.0 (black) - 1.0 (white)
  luminanceRange: {
    min: number;
    max: number;
    stdDev: number;
  };
  darkRatio: number;         // Ratio of pixels with lum < 0.25
  darkPixelRatio: number;    // Backwards-compat alias for darkRatio
  brightRatio: number;       // Ratio of pixels with lum > 0.75
  brightPixelRatio: number;  // Backwards-compat alias for brightRatio
  contrast: number;          // Contrast score 0.0 - 1.0

  // 4. Temperature & Harmony
  temperature: WarmCoolEstimate;
  warmth: number;            // -1.0 (cool cyan/blue) to +1.0 (warm amber/red)
  warmCoolBalance: number;   // Backwards-compat alias for warmth

  // 5. Texture & Spatial High-Frequency Energy
  complexity: number;        // Visual entropy / detail 0.0 - 1.0
  edgeDensity: number;       // Edge energy 0.0 - 1.0
  textureStrength: number;   // Combined high-frequency texture strength 0.0 - 1.0
  highFrequencyEnergy: number; // Laplacian 2nd-derivative energy 0.0 - 1.0

  // 6. Cluster Palette & Semantic Breakdown
  colorClusters: ColorCluster[];
  dominantClusters: ColorCluster[]; // Backwards-compat alias
  palette: PaletteEntry[];

  // 7. Contextual Regional Profiles (Spatial intelligence)
  regionalProfiles?: Record<WallpaperRegionKey, RegionalVisualProfile>;

  // 8. Metadata & Tracking
  confidence: number;        // 0.0 - 1.0
  timestamp: number;
  analysisVersion: string;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface WallpaperAnalysisResult {
  profile: WallpaperVisualProfile;
  status: AnalysisStatus;
  error?: string;
  isCached?: boolean;
}
