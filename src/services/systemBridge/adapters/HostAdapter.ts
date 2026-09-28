import { 
  HostMode, 
  CapabilityMap, 
  ActionResult, 
  HostCapabilityName, 
  ProviderEvent 
} from '../contracts';

export interface HostAdapter {
  readonly mode: HostMode;
  readonly version: string;

  /**
   * Initializes the adapter and probes the underlying environment.
   */
  initialize(): Promise<void>;

  /**
   * Discovers all available capabilities and their support descriptors.
   */
  discoverCapabilities(): Promise<CapabilityMap>;

  /**
   * Executes a strongly typed, allowlisted action across the boundary.
   */
  executeAction<T = unknown>(
    action: string,
    payload?: unknown,
    requiredCapability?: HostCapabilityName
  ): Promise<ActionResult<T>>;

  /**
   * Subscribes to host events for a specific provider/domain.
   * Returns a cleanup unsubscription function.
   */
  subscribe(
    eventType: string,
    handler: (event: ProviderEvent) => void
  ): () => void;

  /**
   * Cleans up resources, event listeners, and timers.
   */
  dispose(): void;
}
