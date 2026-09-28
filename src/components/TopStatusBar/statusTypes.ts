export type StatusPanel =
  | 'wifi'
  | 'volume'
  | 'battery'
  | 'search'
  | 'control-center'
  | 'toggles'
  | 'notifications'
  | 'datetime'
  | null;

export interface WifiNetwork {
  id: string;
  ssid: string;
  signalStrength: 'strong' | 'medium' | 'weak';
  isSecured: boolean;
  isConnected: boolean;
  type?: 'wifi' | 'cellular';
}

export interface AudioOutputDevice {
  id: string;
  name: string;
  type: 'built-in' | 'bluetooth' | 'hdmi';
  isActive: boolean;
}

export interface StatusNotification {
  id: string;
  appName: string;
  appIconUrl?: string;
  appType: 'chrome' | 'messages' | 'wallix' | 'system';
  message: string;
  timeAgo: string;
  isRead: boolean;
}

export interface BatteryState {
  level: number;
  isCharging: boolean;
  powerSource: 'Battery' | 'Power Adapter';
  powerMode: 'Optimized' | 'High Performance' | 'Low Power';
  remainingText: string;
  health: string;
  energySaver: boolean;
}

export interface ControlCenterState {
  wifi: boolean;
  bluetooth: boolean;
  airplaneMode: boolean;
  volume: number;
  brightness: number;
  darkMode: boolean;
  focusMode: boolean;
  batteryLevel: number;
}
