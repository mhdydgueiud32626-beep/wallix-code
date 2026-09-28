import { InstalledApp, DiscoveryStatus, LaunchAppPayload, BridgeStatusResponse } from '../../types/nativeApp';
import { AppNormalizer } from './AppNormalizer';

export type AppDiscoveryEventListener = (status: DiscoveryStatus, apps: InstalledApp[], error?: string) => void;

/**
 * Detect client host operating system based on user agent and navigator platform
 */
export function detectClientOS(): 'windows' | 'macos' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'macos';
  const ua = (navigator.userAgent || '').toLowerCase();
  const navPlatform = ((navigator as any).userAgentData?.platform || navigator.platform || '').toLowerCase();
  if (navPlatform.includes('win') || ua.includes('windows')) {
    return 'windows';
  }
  return 'macos';
}

export class AppDiscoveryService {
  private static instance: AppDiscoveryService;
  private cachedApps: InstalledApp[] = [];
  private currentStatus: DiscoveryStatus = 'connecting';
  private listeners: Set<AppDiscoveryEventListener> = new Set();
  private lastError: string | null = null;
  private platform: 'windows' | 'macos' = detectClientOS();

  private constructor() {
    // Discovery service maintains in-memory catalog during runtime
    // Sensitive OS application paths are strictly NOT persisted to browser localStorage
  }

  static getInstance(): AppDiscoveryService {
    if (!AppDiscoveryService.instance) {
      AppDiscoveryService.instance = new AppDiscoveryService();
    }
    return AppDiscoveryService.instance;
  }

  subscribe(listener: AppDiscoveryEventListener): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener(this.currentStatus, this.cachedApps, this.lastError || undefined);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentStatus, this.cachedApps, this.lastError || undefined);
    }
  }

  getStatus(): DiscoveryStatus {
    return this.currentStatus;
  }

  getApps(): InstalledApp[] {
    return this.cachedApps;
  }

  getPlatform(): 'windows' | 'macos' {
    return this.platform;
  }

  private setStatus(status: DiscoveryStatus, error?: string) {
    this.currentStatus = status;
    this.lastError = error || null;
    this.notify();
  }

  /**
   * Initializes startup sequence:
   * 1. Detects OS
   * 2. Connects to local native bridge
   * 3. Shows subtle "connecting" state
   * 4. Then performs application discovery
   */
  async initializeStartup(preferredPlatform?: 'windows' | 'macos'): Promise<InstalledApp[]> {
    this.platform = preferredPlatform || detectClientOS();
    this.setStatus('connecting');

    // Step 1: Probe local bridge connection
    const bridgeStatus = await this.checkBridgeStatus();
    if (!bridgeStatus || bridgeStatus.status === 'disconnected') {
      this.setStatus('unavailable', 'Local native bridge connector is currently offline.');
      return [];
    }

    if (bridgeStatus.status === 'permission_denied') {
      this.setStatus('permission_required', 'System permission required to discover native applications.');
      return [];
    }

    // Step 2: Bridge is connected, transition to scanning
    return this.scanApps(this.platform);
  }

  /**
   * Discovers installed applications from the native local bridge
   */
  async scanApps(targetPlatform?: 'windows' | 'macos'): Promise<InstalledApp[]> {
    const plat = targetPlatform || this.platform;
    this.setStatus(this.cachedApps.length > 0 ? 'refreshing' : 'scanning');

    try {
      const res = await fetch(`/api/connector/apps?platform=${plat}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        if (res.status === 403) {
          this.setStatus('permission_required', 'Permission required to access native application shortcuts.');
          return this.cachedApps;
        }
        throw new Error(`Bridge returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.apps)) {
        throw new Error(data.message || 'Invalid bridge response format');
      }

      const normalized = AppNormalizer.normalizeList(data.apps);
      this.cachedApps = normalized;
      this.platform = data.platform || plat;

      if (normalized.length === 0) {
        this.setStatus('empty');
      } else {
        this.setStatus('detected');
      }

      return normalized;
    } catch (err: any) {
      console.warn('[AppDiscoveryService] Bridge scan notification:', err.message);
      if (this.cachedApps.length > 0) {
        this.setStatus('detected');
        return this.cachedApps;
      }
      this.setStatus('unavailable', 'Local bridge connector is currently offline.');
      return [];
    }
  }

  /**
   * Refreshes applications with active status transition (single lightweight scan)
   */
  async refresh(targetPlatform?: 'windows' | 'macos'): Promise<InstalledApp[]> {
    return this.scanApps(targetPlatform || this.platform);
  }

  /**
   * Strict allowlist launch invocation:
   * Sends ONLY { type: "LAUNCH_APP", appId: string }
   * The frontend NEVER sends executable paths, shell commands, or arguments.
   */
  async launchApp(appId: string): Promise<{ success: boolean; message: string; unavailable?: boolean }> {
    const targetApp = this.cachedApps.find(a => a.id === appId);
    if (!targetApp) {
      return { success: false, message: `Application with ID '${appId}' is not in local catalog.` };
    }

    try {
      const payload: LaunchAppPayload = {
        type: 'LAUNCH_APP',
        appId
      };

      const res = await fetch('/api/connector/apps/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        if (result.unavailable) {
          targetApp.isAvailable = false;
          this.notify();
          return {
            success: false,
            unavailable: true,
            message: result.error || `${targetApp.name} is no longer available on this system.`
          };
        }
        throw new Error(result.error || 'Bridge rejected launch request');
      }

      return {
        success: true,
        message: result.message || `Launched ${targetApp.name}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || `Failed to launch ${targetApp.name}`
      };
    }
  }

  /**
   * Manually adds a validated application shortcut to the local bridge
   */
  async addManualApp(appData: { name: string; category?: string; icon?: string; launchTarget?: string }): Promise<InstalledApp | null> {
    try {
      const res = await fetch('/api/connector/apps/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      const data = await res.json();
      if (data.success && data.app) {
        const updated = AppNormalizer.normalizeList([data.app, ...this.cachedApps]);
        this.cachedApps = updated;
        this.setStatus('detected');
        return data.app;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Checks bridge health and status
   */
  async checkBridgeStatus(): Promise<BridgeStatusResponse | null> {
    try {
      const res = await fetch('/api/connector/apps/status');
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }
}
