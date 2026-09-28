/**
 * WALLIX HOST-CAPABILITY IMPLEMENTATION BOUNDARY
 * Core Contracts, Capability Descriptors, Action & Event Schemas
 */

export const HOST_BRIDGE_VERSION = '1.2.0';

/**
 * Execution Environments / Host Modes
 */
export type HostMode = 
  | 'WEB_ONLY'
  | 'WINDOWS_HOST_BRIDGE'
  | 'WINDOWS_NATIVE_DESKTOP'
  | 'MOCK_DEVELOPMENT';

/**
 * Explicit Named Allowlisted Capabilities
 */
export type HostCapabilityName =
  | 'SEARCH_READ'
  | 'APP_ENUMERATION'
  | 'APP_LAUNCH'
  | 'FILE_SEARCH'
  | 'NETWORK_READ'
  | 'NETWORK_CONTROL'
  | 'AUDIO_READ'
  | 'AUDIO_CONTROL'
  | 'POWER_READ'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_CONTROL'
  | 'CALENDAR_READ'
  | 'SYSTEM_TIME_READ';

/**
 * Capability Status
 */
export type CapabilityStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'UNSUPPORTED'
  | 'PERMISSION_REQUIRED'
  | 'DENIED'
  | 'ERROR';

/**
 * Capability Descriptor
 */
export interface CapabilityDescriptor {
  capability: HostCapabilityName;
  status: CapabilityStatus;
  readSupported: boolean;
  writeSupported: boolean;
  eventSupported: boolean;
  reason?: string;
  version: string;
}

export type CapabilityMap = Record<HostCapabilityName, CapabilityDescriptor>;

/**
 * Provider Source Attribution
 */
export type ProviderSource =
  | 'REAL_WINDOWS'
  | 'HOST_BRIDGE'
  | 'MOCK'
  | 'UNAVAILABLE';

/**
 * Normalized Provider State Envelope
 */
export interface ProviderState<T> {
  data: T;
  status: 'IDLE' | 'LOADING' | 'READY' | 'UNAVAILABLE' | 'ERROR';
  capabilities: Partial<Record<HostCapabilityName, CapabilityDescriptor>>;
  lastUpdated: number;
  error: string | null;
  source: ProviderSource;
}

/**
 * Action Result Contracts
 */
export type ActionResultCode =
  | 'SUCCESS'
  | 'DENIED'
  | 'UNSUPPORTED'
  | 'UNAVAILABLE'
  | 'PERMISSION_REQUIRED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'ERROR';

export interface ActionResult<T = unknown> {
  code: ActionResultCode;
  success: boolean;
  data?: T;
  message?: string;
  capabilityUsed?: HostCapabilityName;
  timestamp: number;
  errorDetails?: {
    code: string;
    message: string;
  };
}

/**
 * Auditable State-Changing Action Log
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  provider: string;
  actor: string;
  timestamp: number;
  result: ActionResultCode;
  capabilityUsed?: HostCapabilityName;
  details?: Record<string, unknown>;
}

/**
 * Normalized Event Envelope with Idempotency Support
 */
export interface ProviderEvent<T = unknown> {
  eventId: string;
  eventType: string;
  provider: string;
  timestamp: number;
  payload: T;
  source: ProviderSource;
}

/**
 * Action Payloads
 */
export interface SearchQueryPayload {
  query: string;
  category?: 'all' | 'apps' | 'documents' | 'settings' | 'web';
  limit?: number;
}

export interface SearchOpenResultPayload {
  resultId: string;
  targetAppId?: string;
  path?: string;
}

export interface WifiConnectPayload {
  networkId: string;
  ssid: string;
  password?: string;
}

export interface AudioSetVolumePayload {
  volume: number; // 0-100 validated
}

export interface AudioSelectOutputPayload {
  deviceId: string;
}

export interface NotificationDismissPayload {
  notificationId: string;
}

export interface CalendarSelectDatePayload {
  dateIso: string;
}
