/**
 * High-Performance In-Memory & LRU Cache for Wallpaper Visual Analysis Profiles
 */
import { WallpaperVisualProfile } from './wallpaperAnalysisTypes';

class WallpaperAnalysisCacheStore {
  private cache = new Map<string, { profile: WallpaperVisualProfile; cachedAt: number }>();
  private readonly MAX_ENTRIES = 50;

  private generateKey(sourceId: string, version: string = 'v1'): string {
    return `${sourceId}::${version}`;
  }

  public get(sourceId: string, version: string = 'v1'): WallpaperVisualProfile | null {
    if (!sourceId) return null;
    const key = this.generateKey(sourceId, version);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Refresh entry position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.profile;
  }

  public set(sourceId: string, profile: WallpaperVisualProfile, version: string = 'v1'): void {
    if (!sourceId || !profile) return;
    const key = this.generateKey(sourceId, version);

    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      profile,
      cachedAt: Date.now(),
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public invalidate(sourceId: string): void {
    const prefix = `${sourceId}::`;
    for (const k of Array.from(this.cache.keys())) {
      if (k.startsWith(prefix)) {
        this.cache.delete(k);
      }
    }
  }
}

export const WallpaperAnalysisCache = new WallpaperAnalysisCacheStore();
export default WallpaperAnalysisCache;
