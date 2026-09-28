import { 
  HostMode, 
  HostCapabilityName, 
  CapabilityMap, 
  CapabilityDescriptor, 
  ProviderSource, 
  ActionResult, 
  AuditLogEntry 
} from './contracts';

export * from './contracts';

export type WifiConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'configuring';
export type SignalLevel = 'high' | 'medium' | 'low';
export type PowerPlanMode = 'power_saver' | 'balanced' | 'high_performance' | 'best_performance';
export type FocusAssistMode = 'off' | 'priority_only' | 'alarms_only';
export type ProjectDisplayMode = 'pc_screen_only' | 'duplicate' | 'extend' | 'second_screen_only';

export interface NearbyNetworkItem {
  id: string;
  ssid: string;
  is5G: boolean;
  isLocked: boolean;
  signal: SignalLevel;
  security: string;
  channel?: number;
  frequency?: string;
  macAddress?: string;
}

export interface NetworkState {
  enabled: boolean;
  status: WifiConnectionStatus;
  currentSsid: string;
  signalStrength: SignalLevel;
  isMetered: boolean;
  ipAddress: string;
  gateway: string;
  dns: string;
  adapterName: string;
  macAddress: string;
  networks: NearbyNetworkItem[];
  isScanning: boolean;
}

export interface AudioDeviceItem {
  id: string;
  name: string;
  type: 'speakers' | 'headphones' | 'bluetooth' | 'hdmi';
  isDefault: boolean;
  sampleRate?: string;
  bitDepth?: string;
}

export interface AudioState {
  volume: number;
  isMuted: boolean;
  activeDeviceId: string;
  devices: AudioDeviceItem[];
  spatialAudio: boolean;
  soundEnhancements: boolean;
}

export interface PowerState {
  batteryLevel: number;
  isCharging: boolean;
  chargingTimeRemaining: number | null;
  dischargingTimeRemaining: number | null;
  powerPlan: PowerPlanMode;
  batterySaverActive: boolean;
  healthPercentage: number;
  cycleCount: number;
  temperatureDisplay: string;
  estimatedTimeLeft: string;
}

export interface BluetoothDeviceItem {
  id: string;
  name: string;
  connected: boolean;
  type: 'audio' | 'input' | 'phone' | 'peripheral';
  batteryPercentage?: number;
}

export interface QuickSettingsState {
  wifi: boolean;
  bluetooth: boolean;
  bluetoothDevices: BluetoothDeviceItem[];
  nightLight: boolean;
  nightLightIntensity: number;
  focusAssist: FocusAssistMode;
  airplaneMode: boolean;
  mobileHotspot: boolean;
  nearbySharing: boolean;
  projectMode: ProjectDisplayMode;
  screenBrightness: number;
  keyboardBacklight: boolean;
  trueTone: boolean;
  darkMode: boolean;
  liveSyncHealth: 'optimal' | 'syncing' | 'offline';
}

export interface NotificationAction {
  id: string;
  label: string;
  actionType?: 'reply' | 'dismiss' | 'open' | 'custom';
}

export interface NotificationItem {
  id: string;
  appId: string;
  appName: string;
  appIconCategory: 'messages' | 'calendar' | 'reminders' | 'system' | 'mail' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
  priority?: 'low' | 'normal' | 'high';
  avatarUrl?: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  time: string;
  endTime?: string;
  location?: string;
  category: 'work' | 'personal' | 'meeting' | 'reminder';
  color: string;
}

export interface SystemSearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'app' | 'file' | 'setting' | 'web';
  iconName?: string;
  targetAppId?: string;
}

/**
 * Main System Bridge Context Contract
 */
export interface SystemBridgeContextType {
  // Host & Capability State
  hostMode: HostMode;
  bridgeVersion: string;
  capabilities: CapabilityMap;
  providerSource: ProviderSource;
  auditLogs: AuditLogEntry[];
  setHostMode: (mode: HostMode) => Promise<void>;
  getCapability: (name: HostCapabilityName) => CapabilityDescriptor;
  isCapabilityAvailable: (name: HostCapabilityName) => boolean;

  // Domain States
  network: NetworkState;
  audio: AudioState;
  power: PowerState;
  quickSettings: QuickSettingsState;
  notifications: NotificationItem[];
  calendarEvents: CalendarEventItem[];
  unreadNotificationCount: number;
  isNativeBridgeConnected: boolean;

  // Action Dispatches (Passing through the Host-Capability Boundary)
  setWifiEnabled: (enabled: boolean) => Promise<ActionResult>;
  connectToNetwork: (ssid: string, password?: string) => Promise<ActionResult>;
  disconnectNetwork: () => Promise<ActionResult>;
  scanNetworks: () => Promise<ActionResult>;

  setVolume: (vol: number | ((prev: number) => number)) => Promise<ActionResult>;
  setIsMuted: (muted: boolean | ((prev: boolean) => boolean)) => Promise<ActionResult>;
  toggleMute: () => Promise<ActionResult>;
  setActiveAudioDevice: (deviceId: string) => Promise<ActionResult>;
  toggleSpatialAudio: () => void;

  setBatteryLevel: (level: number | ((prev: number) => number)) => void;
  setIsCharging: (charging: boolean | ((prev: boolean) => boolean)) => void;
  setPowerPlan: (plan: PowerPlanMode) => Promise<ActionResult>;
  setBatterySaver: (active: boolean) => Promise<ActionResult>;

  toggleQuickSetting: (key: keyof QuickSettingsState) => void;
  setQuickSettingValue: <K extends keyof QuickSettingsState>(key: K, value: QuickSettingsState[K]) => void;
  setScreenBrightness: (brightness: number) => void;
  setFocusAssist: (mode: FocusAssistMode) => void;
  setProjectMode: (mode: ProjectDisplayMode) => void;

  dismissNotification: (id: string) => Promise<ActionResult>;
  clearAllNotifications: () => Promise<ActionResult>;
  markNotificationAsRead: (id: string) => void;
  sendNotificationReply: (id: string, text: string) => Promise<ActionResult>;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  addCalendarEvent: (event: Omit<CalendarEventItem, 'id'>) => Promise<ActionResult>;
  deleteCalendarEvent: (id: string) => Promise<ActionResult>;

  openWindowsSettings: (subpage?: string) => Promise<ActionResult>;
}
