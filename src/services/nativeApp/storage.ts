import { NativeAppPreferences, EnvironmentAppearanceMode } from '../../types/nativeApp';

const STORAGE_KEY = 'wallix_native_app_prefs_v1';

export const DEFAULT_NATIVE_PREFERENCES: NativeAppPreferences = {
  pinnedAppIds: [],
  hiddenAppIds: [],
  recentAppIds: [],
  dockOrder: [],
  appearanceMode: 'mac-inspired',
  dockSize: 52,
  dockBlur: 32,
  dockOpacity: 45,
  showTooltips: false,
  dockMagnification: true
};

export class NativeAppStorage {
  static loadPreferences(): NativeAppPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_NATIVE_PREFERENCES;
      const parsed = JSON.parse(data);
      // Strictly extract ONLY known user preference properties (no sensitive OS data)
      return {
        pinnedAppIds: Array.isArray(parsed.pinnedAppIds) ? parsed.pinnedAppIds.filter((x: any) => typeof x === 'string') : [],
        hiddenAppIds: Array.isArray(parsed.hiddenAppIds) ? parsed.hiddenAppIds.filter((x: any) => typeof x === 'string') : [],
        recentAppIds: Array.isArray(parsed.recentAppIds) ? parsed.recentAppIds.filter((x: any) => typeof x === 'string') : [],
        dockOrder: Array.isArray(parsed.dockOrder) ? parsed.dockOrder.filter((x: any) => typeof x === 'string') : (Array.isArray(parsed.pinnedAppIds) ? parsed.pinnedAppIds : []),
        appearanceMode: ['mac-inspired', 'windows-inspired', 'custom'].includes(parsed.appearanceMode) ? parsed.appearanceMode : 'mac-inspired',
        dockSize: typeof parsed.dockSize === 'number' ? Math.min(Math.max(parsed.dockSize, 36), 72) : 52,
        dockBlur: typeof parsed.dockBlur === 'number' ? Math.min(Math.max(parsed.dockBlur, 0), 64) : 32,
        dockOpacity: typeof parsed.dockOpacity === 'number' ? Math.min(Math.max(parsed.dockOpacity, 10), 100) : 45,
        showTooltips: Boolean(parsed.showTooltips),
        dockMagnification: parsed.dockMagnification !== false
      };
    } catch {
      return DEFAULT_NATIVE_PREFERENCES;
    }
  }

  static savePreferences(prefs: Partial<NativeAppPreferences>): NativeAppPreferences {
    try {
      const current = this.loadPreferences();
      const updated: NativeAppPreferences = {
        pinnedAppIds: prefs.pinnedAppIds !== undefined ? prefs.pinnedAppIds : current.pinnedAppIds,
        hiddenAppIds: prefs.hiddenAppIds !== undefined ? prefs.hiddenAppIds : current.hiddenAppIds,
        recentAppIds: prefs.recentAppIds !== undefined ? prefs.recentAppIds : current.recentAppIds,
        dockOrder: prefs.dockOrder !== undefined ? prefs.dockOrder : current.dockOrder,
        appearanceMode: prefs.appearanceMode !== undefined ? prefs.appearanceMode : current.appearanceMode,
        dockSize: prefs.dockSize !== undefined ? prefs.dockSize : current.dockSize,
        dockBlur: prefs.dockBlur !== undefined ? prefs.dockBlur : current.dockBlur,
        dockOpacity: prefs.dockOpacity !== undefined ? prefs.dockOpacity : current.dockOpacity,
        showTooltips: prefs.showTooltips !== undefined ? prefs.showTooltips : current.showTooltips,
        dockMagnification: prefs.dockMagnification !== undefined ? prefs.dockMagnification : current.dockMagnification
      };
      // Persist strictly preferences only
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return { ...DEFAULT_NATIVE_PREFERENCES, ...prefs };
    }
  }

  static setDockOrder(order: string[]): string[] {
    const prefs = this.loadPreferences();
    this.savePreferences({ dockOrder: order });
    return order;
  }

  static togglePinned(appId: string): string[] {
    const prefs = this.loadPreferences();
    const exists = prefs.pinnedAppIds.includes(appId);
    const updatedPinned = exists
      ? prefs.pinnedAppIds.filter(id => id !== appId)
      : [...prefs.pinnedAppIds, appId];
    
    // Update dockOrder as well
    const updatedDockOrder = exists
      ? prefs.dockOrder.filter(id => id !== appId)
      : [...prefs.dockOrder, appId];

    this.savePreferences({ pinnedAppIds: updatedPinned, dockOrder: updatedDockOrder });
    return updatedPinned;
  }

  static toggleHidden(appId: string): string[] {
    const prefs = this.loadPreferences();
    const exists = prefs.hiddenAppIds.includes(appId);
    const updatedHidden = exists
      ? prefs.hiddenAppIds.filter(id => id !== appId)
      : [...prefs.hiddenAppIds, appId];
    this.savePreferences({ hiddenAppIds: updatedHidden });
    return updatedHidden;
  }

  static addRecent(appId: string): string[] {
    const prefs = this.loadPreferences();
    const filtered = prefs.recentAppIds.filter(id => id !== appId);
    const updatedRecent = [appId, ...filtered].slice(0, 5);
    this.savePreferences({ recentAppIds: updatedRecent });
    return updatedRecent;
  }

  static setAppearanceMode(mode: EnvironmentAppearanceMode): void {
    this.savePreferences({ appearanceMode: mode });
  }
}
