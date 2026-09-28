/**
 * React Context Provider for Wallpaper-Aware Adaptive Materials
 * Distributes dynamic design tokens, multi-color visual profile, and regional tokens
 * to the entire desktop shell hierarchy.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WallpaperVisualProfile, WallpaperRegionKey } from './wallpaperAnalysisTypes';
import { AdaptiveDesignTokens, AdaptiveMaterialContextState } from './adaptiveMaterialTypes';
import { AdaptiveMaterialEngine } from './AdaptiveMaterialEngine';
import { createDefaultWallpaperVisualProfile } from './WallpaperAnalyzer';
import { createDefaultAdaptiveTokens, generateRegionalTokensMap } from './adaptiveMaterialTokens';

const AdaptiveMaterialContext = createContext<AdaptiveMaterialContextState | null>(null);

export const useAdaptiveMaterial = (): AdaptiveMaterialContextState => {
  const context = useContext(AdaptiveMaterialContext);
  if (!context) {
    const defaultProfile = createDefaultWallpaperVisualProfile();
    const defaultTokens = createDefaultAdaptiveTokens();
    const defaultRegional = generateRegionalTokensMap(defaultProfile);
    return {
      profile: defaultProfile,
      tokens: defaultTokens,
      rawTokens: defaultTokens,
      regionalTokens: defaultRegional,
      getTokensForRegion: (region: WallpaperRegionKey) => defaultRegional[region] || defaultTokens,
      isAnalyzing: false,
      status: 'idle',
      confidence: 1.0,
      lastUpdated: Date.now(),
      wallpaperSource: '',
      reanalyze: async () => {},
    };
  }
  return context;
};

interface AdaptiveMaterialProviderProps {
  children: React.ReactNode;
  wallpaper?: {
    id: string;
    imageUrl?: string;
    thumbnail?: string;
    videoUrl?: string;
    colors?: string[];
    title?: string;
  } | null;
  activeWallpaperUrl?: string;
  activeWallpaperId?: string;
}

export const AdaptiveMaterialProvider: React.FC<AdaptiveMaterialProviderProps> = ({
  children,
  wallpaper,
  activeWallpaperUrl = '',
  activeWallpaperId = '',
}) => {
  const [profile, setProfile] = useState<WallpaperVisualProfile>(() => createDefaultWallpaperVisualProfile());
  const [tokens, setTokens] = useState<AdaptiveDesignTokens>(() => createDefaultAdaptiveTokens());
  const [regionalTokens, setRegionalTokens] = useState<Record<WallpaperRegionKey, AdaptiveDesignTokens>>(() => 
    generateRegionalTokensMap(createDefaultWallpaperVisualProfile())
  );
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle');
  const [confidence, setConfidence] = useState<number>(0.9);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const engine = useRef(AdaptiveMaterialEngine.getInstance());
  const currentSourceRef = useRef<string>('');

  const effectiveId = wallpaper?.id || activeWallpaperId;
  const effectiveUrl = wallpaper?.imageUrl || wallpaper?.thumbnail || wallpaper?.videoUrl || activeWallpaperUrl;
  const paletteHint = wallpaper?.colors;

  const triggerAnalysis = useCallback(async (sourceUrl: string, id: string, hint?: string[]) => {
    if (!sourceUrl && !id && (!hint || hint.length === 0)) return;
    const sourceKey = id || sourceUrl;
    if (currentSourceRef.current === sourceKey && status === 'ready' && !hint) {
      return;
    }

    currentSourceRef.current = sourceKey;
    setStatus('analyzing');

    try {
      const result = await engine.current.processWallpaper(sourceKey, sourceUrl, hint);
      setProfile(result.profile);
      setTokens(result.tokens);
      setRegionalTokens(result.regionalTokens);
      setConfidence(result.profile.confidence);
      setLastUpdated(Date.now());
      setStatus('ready');

      // Inject onto document.documentElement (:root) so all fixed, simulated, and portaled elements inherit them
      const root = document.documentElement;
      Object.entries(result.tokens.cssVariables).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    } catch (e) {
      console.warn('[AdaptiveMaterialProvider] Analysis error:', e);
      setStatus('error');
    }
  }, [status]);

  // Initial root CSS injection
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(tokens.cssVariables).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, []);

  // Trigger analysis when active wallpaper changes
  const paletteKey = paletteHint ? paletteHint.join(',') : '';
  useEffect(() => {
    if (effectiveUrl || effectiveId || (paletteHint && paletteHint.length > 0)) {
      triggerAnalysis(effectiveUrl, effectiveId, paletteHint);
    }
  }, [effectiveUrl, effectiveId, paletteKey, triggerAnalysis]);

  const handleReanalyze = useCallback(async () => {
    currentSourceRef.current = '';
    await triggerAnalysis(effectiveUrl, effectiveId, paletteHint);
  }, [effectiveUrl, effectiveId, paletteHint, triggerAnalysis]);

  const getTokensForRegion = useCallback((region: WallpaperRegionKey): AdaptiveDesignTokens => {
    return regionalTokens[region] || tokens;
  }, [regionalTokens, tokens]);

  const value: AdaptiveMaterialContextState = {
    profile,
    tokens,
    rawTokens: tokens,
    regionalTokens,
    getTokensForRegion,
    isAnalyzing: status === 'analyzing',
    status,
    confidence,
    lastUpdated,
    wallpaperSource: activeWallpaperUrl || activeWallpaperId,
    reanalyze: handleReanalyze,
  };

  return (
    <AdaptiveMaterialContext.Provider value={value}>
      <div 
        id="wallix-adaptive-material-root" 
        className="w-full h-full"
        style={tokens.cssVariables as React.CSSProperties}
      >
        {children}
      </div>
    </AdaptiveMaterialContext.Provider>
  );
};

export default AdaptiveMaterialProvider;
