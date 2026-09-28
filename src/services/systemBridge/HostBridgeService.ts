import { 
  HostMode, 
  HostCapabilityName, 
  CapabilityMap, 
  CapabilityDescriptor, 
  ActionResult, 
  AuditLogEntry, 
  ProviderEvent,
  HOST_BRIDGE_VERSION 
} from './contracts';
import { HostAdapter } from './adapters/HostAdapter';
import { WebOnlyHostAdapter } from './adapters/WebOnlyHostAdapter';
import { WindowsHostBridgeAdapter } from './adapters/WindowsHostBridgeAdapter';
import { MockDevelopmentAdapter } from './adapters/MockDevelopmentAdapter';

export class HostBridgeService {
  private static instance: HostBridgeService | null = null;

  private adapter!: HostAdapter;
  private capabilities: CapabilityMap = {} as CapabilityMap;
  private auditLog: AuditLogEntry[] = [];
  private processedEvents: Set<string> = new Set();
  private isInitialized = false;

  private constructor() {
    this.selectAdapter();
  }

  public static getInstance(): HostBridgeService {
    if (!HostBridgeService.instance) {
      HostBridgeService.instance = new HostBridgeService();
    }
    return HostBridgeService.instance;
  }

  private selectAdapter(explicitMode?: HostMode): void {
    if (this.adapter) {
      this.adapter.dispose();
    }

    if (explicitMode === 'WEB_ONLY') {
      this.adapter = new WebOnlyHostAdapter();
    } else if (explicitMode === 'MOCK_DEVELOPMENT') {
      this.adapter = new MockDevelopmentAdapter();
    } else if (explicitMode === 'WINDOWS_HOST_BRIDGE') {
      this.adapter = new WindowsHostBridgeAdapter();
    } else {
      // Default: First try the real Windows host bridge adapter
      this.adapter = new WindowsHostBridgeAdapter();
    }
  }

  /**
   * Initializes bridge, discovers capabilities, and constructs capability map.
   */
  public async initialize(): Promise<CapabilityMap> {
    if (this.isInitialized) return this.capabilities;

    await this.adapter.initialize();

    // If WindowsHostBridgeAdapter was tried but no real native host was reachable,
    // fallback gracefully to MockDevelopmentAdapter in Studio dev environment
    if (this.adapter instanceof WindowsHostBridgeAdapter && !this.adapter.isHostConnected()) {
      console.warn('[HostBridgeService] No Windows Native Host detected on 127.0.0.1:49152 or WebView2. Activating MockDevelopmentAdapter with explicit MOCK source.');
      this.adapter.dispose();
      this.adapter = new MockDevelopmentAdapter();
      await this.adapter.initialize();
    }

    this.capabilities = await this.adapter.discoverCapabilities();
    this.isInitialized = true;

    console.log(`[HostBridgeService] Active Host Mode: ${this.adapter.mode} (v${HOST_BRIDGE_VERSION})`);
    return this.capabilities;
  }

  /**
   * Switch host mode at runtime (e.g. for testing Web Sandbox vs Windows Native Bridge).
   */
  public async setHostMode(mode: HostMode): Promise<CapabilityMap> {
    this.selectAdapter(mode);
    this.isInitialized = false;
    return this.initialize();
  }

  public getHostMode(): HostMode {
    return this.adapter.mode;
  }

  public getVersion(): string {
    return this.adapter.version;
  }

  public getCapabilities(): CapabilityMap {
    return this.capabilities;
  }

  public getCapability(name: HostCapabilityName): CapabilityDescriptor {
    return this.capabilities[name] || {
      capability: name,
      status: 'UNAVAILABLE',
      readSupported: false,
      writeSupported: false,
      eventSupported: false,
      reason: 'Capability not registered in current capability map.',
      version: HOST_BRIDGE_VERSION,
    };
  }

  public isCapabilityAvailable(name: HostCapabilityName): boolean {
    const desc = this.getCapability(name);
    return desc.status === 'AVAILABLE';
  }

  /**
   * ACTION AUTHORIZATION BOUNDARY
   * Validates capability, permission, input, and records auditable action logs.
   */
  public async executeAction<T = unknown>(
    action: string,
    payload?: unknown,
    requiredCapability?: HostCapabilityName,
    actor = 'WALLIX_UI'
  ): Promise<ActionResult<T>> {
    const timestamp = Date.now();

    // 1. Check capability availability if a capability is required
    if (requiredCapability) {
      const cap = this.getCapability(requiredCapability);
      if (cap.status !== 'AVAILABLE') {
        const failureResult: ActionResult<T> = {
          code: cap.status === 'PERMISSION_REQUIRED' ? 'PERMISSION_REQUIRED' : 
                cap.status === 'DENIED' ? 'DENIED' : 'UNSUPPORTED',
          success: false,
          capabilityUsed: requiredCapability,
          timestamp,
          message: cap.reason || `Capability '${requiredCapability}' is ${cap.status} in ${this.adapter.mode} mode.`,
          errorDetails: {
            code: `ERR_CAPABILITY_${cap.status}`,
            message: `Execution blocked at host boundary. Reason: ${cap.reason || cap.status}`,
          },
        };

        this.recordAuditLog(action, actor, failureResult.code, requiredCapability, payload);
        return failureResult;
      }
    }

    // 2. Input validation for known actions
    if (action === 'AUDIO_SET_VOLUME') {
      const vol = (payload as any)?.volume;
      if (typeof vol === 'number' && (vol < 0 || vol > 100)) {
        const invalidResult: ActionResult<T> = {
          code: 'INVALID_REQUEST',
          success: false,
          capabilityUsed: requiredCapability,
          timestamp,
          message: 'Volume value must be between 0 and 100.',
        };
        this.recordAuditLog(action, actor, 'INVALID_REQUEST', requiredCapability, payload);
        return invalidResult;
      }
    }

    // 3. Delegate to HostAdapter
    try {
      const result = await this.adapter.executeAction<T>(action, payload, requiredCapability);
      this.recordAuditLog(action, actor, result.code, requiredCapability, payload);
      return result;
    } catch (err: any) {
      const errorResult: ActionResult<T> = {
        code: 'ERROR',
        success: false,
        capabilityUsed: requiredCapability,
        timestamp,
        message: err?.message || 'Unexpected host bridge execution failure.',
      };
      this.recordAuditLog(action, actor, 'ERROR', requiredCapability, payload);
      return errorResult;
    }
  }

  /**
   * EVENT SUBSCRIPTION & IDEMPOTENCY BOUNDARY
   */
  public subscribe<T = unknown>(
    eventType: string,
    handler: (event: ProviderEvent<T>) => void
  ): () => void {
    return this.adapter.subscribe(eventType, (event: ProviderEvent) => {
      // Event Idempotency & Deduplication check
      if (this.processedEvents.has(event.eventId)) {
        return;
      }

      this.processedEvents.add(event.eventId);
      if (this.processedEvents.size > 200) {
        // Keep memory bounded
        const first = this.processedEvents.values().next().value;
        if (first) this.processedEvents.delete(first);
      }

      handler(event as ProviderEvent<T>);
    });
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  private recordAuditLog(
    action: string,
    actor: string,
    result: ActionResult['code'],
    capabilityUsed?: HostCapabilityName,
    details?: unknown
  ): void {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      provider: action.split('_')[0] || 'SYSTEM',
      actor,
      timestamp: Date.now(),
      result,
      capabilityUsed,
      details: typeof details === 'object' && details !== null ? (details as Record<string, unknown>) : undefined,
    };

    this.auditLog.unshift(entry);
    if (this.auditLog.length > 60) {
      this.auditLog.pop();
    }
  }

  public dispose(): void {
    if (this.adapter) {
      this.adapter.dispose();
    }
    this.processedEvents.clear();
  }
}
