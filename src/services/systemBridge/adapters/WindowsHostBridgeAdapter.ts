import { HostAdapter } from './HostAdapter';
import { 
  HostMode, 
  CapabilityMap, 
  ActionResult, 
  HostCapabilityName, 
  ProviderEvent,
  HOST_BRIDGE_VERSION 
} from '../contracts';

declare global {
  interface Window {
    __WALLIX_NATIVE__?: {
      version: string;
      mode?: HostMode;
      getCapabilities?: () => Promise<Partial<CapabilityMap>>;
      invokeAction?: (action: string, payload?: unknown) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      addEventListener?: (eventType: string, callback: (payload: unknown) => void) => () => void;
    };
  }
}

const LOCAL_HOST_DAEMON_URL = 'http://127.0.0.1:49152';

export class WindowsHostBridgeAdapter implements HostAdapter {
  readonly mode: HostMode = 'WINDOWS_HOST_BRIDGE';
  readonly version: string = HOST_BRIDGE_VERSION;

  private isConnected = false;
  private connectionType: 'INJECTED_BRIDGE' | 'LOCAL_DAEMON' | 'NONE' = 'NONE';
  private unsubscribers: Map<string, () => void> = new Map();

  async initialize(): Promise<void> {
    // 1. Check if window.__WALLIX_NATIVE__ is injected (WebView2 / Win32 App SDK / Tauri)
    if (typeof window !== 'undefined' && window.__WALLIX_NATIVE__) {
      this.connectionType = 'INJECTED_BRIDGE';
      this.isConnected = true;
      console.log(`[WindowsHostBridgeAdapter] Connected via Injected Host Bridge (v${this.version})`);
      return;
    }

    // 2. Check if Localhost Native Daemon is running on 127.0.0.1:49152
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms probe timeout

      const res = await fetch(`${LOCAL_HOST_DAEMON_URL}/api/bridge/handshake`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.connectionType = 'LOCAL_DAEMON';
        this.isConnected = true;
        console.log(`[WindowsHostBridgeAdapter] Connected to Local Windows Host Daemon (v${data.version || this.version})`);
        return;
      }
    } catch {
      // Host daemon is not running on localhost
    }

    this.connectionType = 'NONE';
    this.isConnected = false;
  }

  public isHostConnected(): boolean {
    return this.isConnected;
  }

  async discoverCapabilities(): Promise<CapabilityMap> {
    const defaultMap: CapabilityMap = {
      SEARCH_READ: { capability: 'SEARCH_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      APP_ENUMERATION: { capability: 'APP_ENUMERATION', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      APP_LAUNCH: { capability: 'APP_LAUNCH', status: 'AVAILABLE', readSupported: false, writeSupported: true, eventSupported: true, version: this.version },
      FILE_SEARCH: { capability: 'FILE_SEARCH', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: false, version: this.version },
      NETWORK_READ: { capability: 'NETWORK_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      NETWORK_CONTROL: { capability: 'NETWORK_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, version: this.version },
      AUDIO_READ: { capability: 'AUDIO_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      AUDIO_CONTROL: { capability: 'AUDIO_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, version: this.version },
      POWER_READ: { capability: 'POWER_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      NOTIFICATION_READ: { capability: 'NOTIFICATION_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      NOTIFICATION_CONTROL: { capability: 'NOTIFICATION_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, version: this.version },
      CALENDAR_READ: { capability: 'CALENDAR_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
      SYSTEM_TIME_READ: { capability: 'SYSTEM_TIME_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, version: this.version },
    };

    if (!this.isConnected) {
      // Mark all as UNAVAILABLE if host process is not running
      const unavailableMap: CapabilityMap = {} as CapabilityMap;
      Object.keys(defaultMap).forEach((k) => {
        const key = k as HostCapabilityName;
        unavailableMap[key] = {
          ...defaultMap[key],
          status: 'UNAVAILABLE',
          reason: 'Native Windows Host daemon is not connected on localhost:49152 or WebView2 bridge.',
        };
      });
      return unavailableMap;
    }

    if (this.connectionType === 'INJECTED_BRIDGE' && window.__WALLIX_NATIVE__?.getCapabilities) {
      try {
        const nativeMap = await window.__WALLIX_NATIVE__.getCapabilities();
        return { ...defaultMap, ...nativeMap };
      } catch (e) {
        console.warn('[WindowsHostBridgeAdapter] Failed to fetch dynamic capabilities:', e);
      }
    }

    return defaultMap;
  }

  async executeAction<T = unknown>(
    action: string,
    payload?: unknown,
    requiredCapability?: HostCapabilityName
  ): Promise<ActionResult<T>> {
    const timestamp = Date.now();

    if (!this.isConnected) {
      return {
        code: 'UNAVAILABLE',
        success: false,
        capabilityUsed: requiredCapability,
        timestamp,
        message: 'Windows Native Host is not connected.',
        errorDetails: {
          code: 'ERR_HOST_DISCONNECTED',
          message: 'Run native-host/wallix-native-daemon.js or wallix-windows-host.ps1 to start the Windows native host.',
        },
      };
    }

    // 1. Injected Bridge IPC
    if (this.connectionType === 'INJECTED_BRIDGE' && window.__WALLIX_NATIVE__?.invokeAction) {
      try {
        const res = await window.__WALLIX_NATIVE__.invokeAction(action, payload);
        return {
          code: res.success ? 'SUCCESS' : 'ERROR',
          success: res.success,
          data: res.data as T,
          message: res.error,
          capabilityUsed: requiredCapability,
          timestamp,
        };
      } catch (err: any) {
        return {
          code: 'ERROR',
          success: false,
          message: err?.message || 'Injected bridge IPC call failed.',
          capabilityUsed: requiredCapability,
          timestamp,
        };
      }
    }

    // 2. Localhost Daemon JSON-RPC HTTP / WebSocket
    if (this.connectionType === 'LOCAL_DAEMON') {
      try {
        const res = await fetch(`${LOCAL_HOST_DAEMON_URL}/api/bridge/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            code: data.success ? 'SUCCESS' : 'ERROR',
            success: Boolean(data.success),
            data: data.data as T,
            message: data.error,
            capabilityUsed: requiredCapability,
            timestamp,
          };
        }

        return {
          code: 'ERROR',
          success: false,
          message: `Host daemon returned HTTP status ${res.status}`,
          capabilityUsed: requiredCapability,
          timestamp,
        };
      } catch (err: any) {
        return {
          code: 'ERROR',
          success: false,
          message: err?.message || 'Local host daemon communication error.',
          capabilityUsed: requiredCapability,
          timestamp,
        };
      }
    }

    return {
      code: 'UNSUPPORTED',
      success: false,
      message: 'No active native transport mechanism.',
      capabilityUsed: requiredCapability,
      timestamp,
    };
  }

  subscribe(
    eventType: string,
    handler: (event: ProviderEvent) => void
  ): () => void {
    if (this.connectionType === 'INJECTED_BRIDGE' && window.__WALLIX_NATIVE__?.addEventListener) {
      const unsub = window.__WALLIX_NATIVE__.addEventListener(eventType, (nativePayload: unknown) => {
        handler({
          eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          eventType,
          provider: eventType.split('.')[0] || 'system',
          timestamp: Date.now(),
          payload: nativePayload,
          source: 'REAL_WINDOWS',
        });
      });
      return unsub;
    }

    return () => {};
  }

  dispose(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers.clear();
    this.isConnected = false;
  }
}
