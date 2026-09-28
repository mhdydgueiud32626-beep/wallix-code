import { HostAdapter } from './HostAdapter';
import { 
  HostMode, 
  CapabilityMap, 
  ActionResult, 
  HostCapabilityName, 
  ProviderEvent,
  HOST_BRIDGE_VERSION 
} from '../contracts';

export class WebOnlyHostAdapter implements HostAdapter {
  readonly mode: HostMode = 'WEB_ONLY';
  readonly version: string = HOST_BRIDGE_VERSION;

  private listeners: Map<string, Set<(event: ProviderEvent) => void>> = new Map();
  private onlineListener?: () => void;
  private offlineListener?: () => void;

  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      this.onlineListener = () => {
        this.emit('network.connection.changed', {
          online: true,
          status: 'connected',
        });
      };
      this.offlineListener = () => {
        this.emit('network.connection.changed', {
          online: false,
          status: 'disconnected',
        });
      };

      window.addEventListener('online', this.onlineListener);
      window.addEventListener('offline', this.offlineListener);
    }
  }

  async discoverCapabilities(): Promise<CapabilityMap> {
    const hasBatteryApi = typeof navigator !== 'undefined' && 'getBattery' in navigator;

    return {
      SEARCH_READ: {
        capability: 'SEARCH_READ',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Local Windows filesystem indexing requires Windows Host Bridge.',
        version: this.version,
      },
      APP_ENUMERATION: {
        capability: 'APP_ENUMERATION',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Native Windows installed app enumeration is unsupported in browser sandbox.',
        version: this.version,
      },
      APP_LAUNCH: {
        capability: 'APP_LAUNCH',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Native binary execution is restricted by the browser security sandbox.',
        version: this.version,
      },
      FILE_SEARCH: {
        capability: 'FILE_SEARCH',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Windows NTFS file search requires Host Bridge privileges.',
        version: this.version,
      },
      NETWORK_READ: {
        capability: 'NETWORK_READ',
        status: 'AVAILABLE',
        readSupported: true,
        writeSupported: false,
        eventSupported: true,
        reason: 'Standard browser navigator.onLine status is available.',
        version: this.version,
      },
      NETWORK_CONTROL: {
        capability: 'NETWORK_CONTROL',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Physical Wi-Fi adapter control and scanning are restricted in browser.',
        version: this.version,
      },
      AUDIO_READ: {
        capability: 'AUDIO_READ',
        status: 'AVAILABLE',
        readSupported: true,
        writeSupported: false,
        eventSupported: true,
        reason: 'Browser media audio state.',
        version: this.version,
      },
      AUDIO_CONTROL: {
        capability: 'AUDIO_CONTROL',
        status: 'AVAILABLE',
        readSupported: true,
        writeSupported: true,
        eventSupported: true,
        reason: 'Local browser presentation volume control.',
        version: this.version,
      },
      POWER_READ: {
        capability: 'POWER_READ',
        status: hasBatteryApi ? 'AVAILABLE' : 'UNAVAILABLE',
        readSupported: hasBatteryApi,
        writeSupported: false,
        eventSupported: hasBatteryApi,
        reason: hasBatteryApi ? 'Web Battery API available.' : 'Battery API not supported on this browser engine.',
        version: this.version,
      },
      NOTIFICATION_READ: {
        capability: 'NOTIFICATION_READ',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Windows Action Center toast reading is restricted in browser sandbox.',
        version: this.version,
      },
      NOTIFICATION_CONTROL: {
        capability: 'NOTIFICATION_CONTROL',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Windows Toast management requires Host Bridge.',
        version: this.version,
      },
      CALENDAR_READ: {
        capability: 'CALENDAR_READ',
        status: 'UNSUPPORTED',
        readSupported: false,
        writeSupported: false,
        eventSupported: false,
        reason: 'Native Windows Calendar integration requires authenticated bridge.',
        version: this.version,
      },
      SYSTEM_TIME_READ: {
        capability: 'SYSTEM_TIME_READ',
        status: 'AVAILABLE',
        readSupported: true,
        writeSupported: false,
        eventSupported: true,
        reason: 'Standard JavaScript Date engine clock.',
        version: this.version,
      },
    };
  }

  async executeAction<T = unknown>(
    action: string,
    payload?: unknown,
    requiredCapability?: HostCapabilityName
  ): Promise<ActionResult<T>> {
    const timestamp = Date.now();

    // Browser-safe supported actions
    if (action === 'AUDIO_SET_VOLUME' || action === 'AUDIO_SET_MUTE') {
      return {
        code: 'SUCCESS',
        success: true,
        data: payload as T,
        capabilityUsed: requiredCapability,
        timestamp,
        message: 'Presentation volume updated.',
      };
    }

    if (action === 'NETWORK_REFRESH') {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      return {
        code: 'SUCCESS',
        success: true,
        data: { online: isOnline, status: isOnline ? 'connected' : 'disconnected' } as T,
        capabilityUsed: 'NETWORK_READ',
        timestamp,
      };
    }

    // Explicitly reject native-only privileged actions
    return {
      code: 'UNSUPPORTED',
      success: false,
      capabilityUsed: requiredCapability,
      timestamp,
      message: `Action '${action}' requires Windows Host Bridge privileges and is UNSUPPORTED in WEB_ONLY mode.`,
      errorDetails: {
        code: 'ERR_WEB_SANDBOX_RESTRICTED',
        message: 'Native Windows execution is unavailable in standard browser sandbox.',
      },
    };
  }

  subscribe(
    eventType: string,
    handler: (event: ProviderEvent) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const handlers = this.listeners.get(eventType)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  private emit(eventType: string, payload: unknown) {
    const handlers = this.listeners.get(eventType);
    if (!handlers || handlers.size === 0) return;

    const event: ProviderEvent = {
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType,
      provider: eventType.split('.')[0] || 'system',
      timestamp: Date.now(),
      payload,
      source: 'HOST_BRIDGE',
    };

    handlers.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('[WebOnlyHostAdapter] Listener error:', err);
      }
    });
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
      if (this.offlineListener) window.removeEventListener('offline', this.offlineListener);
    }
    this.listeners.clear();
  }
}
