/**
 * Adaptive Material Engine (Singleton Orchestrator)
 * Connects Computer Vision Analysis -> Profile -> Tokens -> Dynamic CSS Ingestion.
 */
import { WallpaperVisualProfile, WallpaperRegionKey } from './wallpaperAnalysisTypes';
import { AdaptiveDesignTokens } from './adaptiveMaterialTypes';
import { WallpaperAnalyzer, createDefaultWallpaperVisualProfile } from './WallpaperAnalyzer';
import { 
  generateAdaptiveTokens, 
  generateRegionalTokensMap, 
  createDefaultAdaptiveTokens 
} from './adaptiveMaterialTokens';

export class AdaptiveMaterialEngine {
  private static instance: AdaptiveMaterialEngine;
  private currentProfile: WallpaperVisualProfile = createDefaultWallpaperVisualProfile();
  private currentTokens: AdaptiveDesignTokens = createDefaultAdaptiveTokens();
  private currentRegionalTokens: Record<WallpaperRegionKey, AdaptiveDesignTokens> = generateRegionalTokensMap(createDefaultWallpaperVisualProfile());
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): AdaptiveMaterialEngine {
    if (!AdaptiveMaterialEngine.instance) {
      AdaptiveMaterialEngine.instance = new AdaptiveMaterialEngine();
    }
    return AdaptiveMaterialEngine.instance;
  }

  public getProfile(): WallpaperVisualProfile {
    return this.currentProfile;
  }

  public getTokens(): AdaptiveDesignTokens {
    return this.currentTokens;
  }

  public getRegionalTokens(region: WallpaperRegionKey): AdaptiveDesignTokens {
    return this.currentRegionalTokens[region] || this.currentTokens;
  }

  public getAllRegionalTokens(): Record<WallpaperRegionKey, AdaptiveDesignTokens> {
    return this.currentRegionalTokens;
  }

  private activeRequestCounter: number = 0;

  /**
   * Main entry point: Processes wallpaper asset and derives smoothed tokens
   */
  public async processWallpaper(
    sourceId: string,
    imageUrl?: string,
    paletteHint?: string[]
  ): Promise<{ 
    profile: WallpaperVisualProfile; 
    tokens: AdaptiveDesignTokens;
    regionalTokens: Record<WallpaperRegionKey, AdaptiveDesignTokens>;
  }> {
    const requestId = ++this.activeRequestCounter;
    this.isProcessing = true;
    try {
      const analyzer = WallpaperAnalyzer.getInstance();
      const profile = await analyzer.analyzeWallpaper(sourceId, imageUrl, paletteHint);
      const targetTokens = generateAdaptiveTokens(profile);
      const regionalMap = generateRegionalTokensMap(profile);

      // Only apply if this is still the most recent request
      if (requestId === this.activeRequestCounter) {
        this.currentProfile = profile;
        this.currentTokens = targetTokens;
        this.currentRegionalTokens = regionalMap;
        console.log(`[AdaptiveMaterialEngine] Visual Profile & Tokens updated: dominant=${profile.dominantColor}, accent=${targetTokens.accent.activeAccent}, bg=${targetTokens.heroGlass.background}`);
      }

      return { profile, tokens: targetTokens, regionalTokens: regionalMap };
    } catch (err) {
      console.warn('[AdaptiveMaterialEngine] Process error, retaining fallback:', err);
      return { 
        profile: this.currentProfile, 
        tokens: this.currentTokens,
        regionalTokens: this.currentRegionalTokens
      };
    } finally {
      if (requestId === this.activeRequestCounter) {
        this.isProcessing = false;
      }
    }
  }

  /**
   * Developer Diagnostics Inspector Dump
   */
  public getDiagnostics() {
    return {
      dominantColor: this.currentProfile.dominantColor,
      secondaryColor: this.currentProfile.secondaryColor,
      tertiaryColor: this.currentProfile.tertiaryColor,
      accentCandidate: this.currentProfile.accentCandidate,
      highlightColor: this.currentProfile.highlightColor,
      shadowColor: this.currentProfile.shadowColor,
      averageLuminance: this.currentProfile.averageLuminance.toFixed(3),
      contrast: this.currentProfile.contrast.toFixed(3),
      averageSaturation: this.currentProfile.averageSaturation.toFixed(3),
      temperature: this.currentProfile.temperature,
      warmth: this.currentProfile.warmth.toFixed(3),
      textureStrength: this.currentProfile.textureStrength.toFixed(3),
      complexity: this.currentProfile.complexity.toFixed(3),
      darkRatio: this.currentProfile.darkRatio.toFixed(3),
      glassOpacity: this.currentTokens.heroGlass.opacity,
      glassBlur: `${this.currentTokens.heroGlass.blurPx}px`,
      glassSaturation: `${this.currentTokens.heroGlass.saturationPercent}%`,
      activeAccent: this.currentTokens.accent.activeAccent,
      confidence: this.currentProfile.confidence,
    };
  }
}

export const adaptiveMaterialEngine = AdaptiveMaterialEngine.getInstance();
export default adaptiveMaterialEngine;
