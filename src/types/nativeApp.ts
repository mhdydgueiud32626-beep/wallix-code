export type InstalledApp = {
  id: string;
  name: string;
  icon?: string;
  launchTarget: string;
  category?: string;
  platform: 'windows' | 'macos';
  source?: string;
  description?: string;
  version?: string;
  installedAt?: string;
  isAvailable?: boolean;
};

export type DiscoveryStatus =
  | 'connecting'
  | 'scanning'
  | 'detected'
  | 'empty'
  | 'unavailable'
  | 'permission_required'
  | 'error'
  | 'refreshing';

export type EnvironmentAppearanceMode = 'mac-inspired' | 'windows-inspired' | 'custom';

export type NativeAppPreferences = {
  pinnedAppIds: string[];
  hiddenAppIds: string[];
  recentAppIds: string[];
  dockOrder: string[];
  appearanceMode: EnvironmentAppearanceMode;
  dockSize: number; // in pixels (e.g. 48)
  dockBlur: number; // in px (e.g. 24)
  dockOpacity: number; // in % (e.g. 40)
  showTooltips: boolean;
  dockMagnification: boolean;
};

export type LaunchAppPayload = {
  type: 'LAUNCH_APP';
  appId: string;
};

export type BridgeStatusResponse = {
  status: 'connected' | 'disconnected' | 'permission_denied';
  platform: 'windows' | 'macos' | 'linux';
  hostname: string;
  version: string;
  appsDiscoveredCount: number;
  lastScanTimestamp: string | null;
  securityMode: 'ALLOWLIST_VALIDATED';
};

export type AppScanResponse = {
  success: boolean;
  apps: InstalledApp[];
  platform: 'windows' | 'macos';
  scanDurationMs: number;
  source: 'native_bridge' | 'cache' | 'local_fallback';
  message?: string;
};
