import { HostAdapter } from './HostAdapter';
import { 
  HostMode, 
  CapabilityMap, 
  ActionResult, 
  HostCapabilityName, 
  ProviderEvent,
  HOST_BRIDGE_VERSION 
} from '../contracts';

export class MockDevelopmentAdapter implements HostAdapter {
  readonly mode: HostMode = 'MOCK_DEVELOPMENT';
  readonly version: string = HOST_BRIDGE_VERSION;

  private listeners: Map<string, Set<(event: ProviderEvent) => void>> = new Map();

  async initialize(): Promise<void> {
    console.log('[MockDevelopmentAdapter] Initialized in MOCK_DEVELOPMENT mode.');
  }

  async discoverCapabilities(): Promise<CapabilityMap> {
    return {
      SEARCH_READ: { capability: 'SEARCH_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Indexer', version: this.version },
      APP_ENUMERATION: { capability: 'APP_ENUMERATION', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Catalog', version: this.version },
      APP_LAUNCH: { capability: 'APP_LAUNCH', status: 'AVAILABLE', readSupported: false, writeSupported: true, eventSupported: true, reason: 'Development Mock Launcher', version: this.version },
      FILE_SEARCH: { capability: 'FILE_SEARCH', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: false, reason: 'Development Mock Files', version: this.version },
      NETWORK_READ: { capability: 'NETWORK_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Network Telemetry', version: this.version },
      NETWORK_CONTROL: { capability: 'NETWORK_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, reason: 'Development Mock Wi-Fi Adapter', version: this.version },
      AUDIO_READ: { capability: 'AUDIO_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Audio State', version: this.version },
      AUDIO_CONTROL: { capability: 'AUDIO_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, reason: 'Development Mock Audio Controller', version: this.version },
      POWER_READ: { capability: 'POWER_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Power Subsystem', version: this.version },
      NOTIFICATION_READ: { capability: 'NOTIFICATION_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Notifications', version: this.version },
      NOTIFICATION_CONTROL: { capability: 'NOTIFICATION_CONTROL', status: 'AVAILABLE', readSupported: true, writeSupported: true, eventSupported: true, reason: 'Development Mock Toast Manager', version: this.version },
      CALENDAR_READ: { capability: 'CALENDAR_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Mock Calendar Agenda', version: this.version },
      SYSTEM_TIME_READ: { capability: 'SYSTEM_TIME_READ', status: 'AVAILABLE', readSupported: true, writeSupported: false, eventSupported: true, reason: 'Development Local Clock', version: this.version },
    };
  }

  async executeAction<T = unknown>(
    action: string,
    payload?: unknown,
    requiredCapability?: HostCapabilityName
  ): Promise<ActionResult<T>> {
    const timestamp = Date.now();

    // Simulating slight realistic async latency
    await new Promise((res) => setTimeout(res, 40));

    // Emit matching state event for live reactivity
    if (action.startsWith('AUDIO_')) {
      this.emit('audio.volume.changed', payload);
    } else if (action.startsWith('WIFI_') || action.startsWith('NETWORK_')) {
      this.emit('network.connection.changed', payload);
    } else if (action.startsWith('NOTIFICATION_')) {
      this.emit('notification.updated', payload);
    }

    return {
      code: 'SUCCESS',
      success: true,
      data: payload as T,
      capabilityUsed: requiredCapability,
      timestamp,
      message: `[MOCK] Action '${action}' executed successfully.`,
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
      eventId: `mock-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventType,
      provider: eventType.split('.')[0] || 'system',
      timestamp: Date.now(),
      payload,
      source: 'MOCK',
    };

    handlers.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error('[MockDevelopmentAdapter] Listener error:', e);
      }
    });
  }

  dispose(): void {
    this.listeners.clear();
  }
}
