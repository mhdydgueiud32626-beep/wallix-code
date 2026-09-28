import React from 'react';

export type ShellSurfaceId = 
  | 'wifi' 
  | 'volume' 
  | 'battery' 
  | 'quickSettings' 
  | 'search' 
  | 'calendar' 
  | 'notifications';

export type ShellFidelityProfile = 
  | 'WIN10_ACTION_CENTER' 
  | 'WIN11_QUICK_SETTINGS'
  | 'WIN11_NOTIFICATION_CALENDAR'
  | 'WINDOWS_NETWORK_SHELL'
  | 'WINDOWS_AUDIO_SHELL'
  | 'WINDOWS_POWER_SHELL'
  | 'WINDOWS_SEARCH_SHELL'
  | 'WINDOWS_CALENDAR_SHELL';

export interface ShellAnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ShellSurfaceConfig {
  id: ShellSurfaceId;
  title: string;
  profile: ShellFidelityProfile;
  width: number;
  isRightDocked?: boolean;
}

export interface DesktopShellControllerContextType {
  activeSurface: ShellSurfaceId | null;
  anchorRect: ShellAnchorRect | null;
  isOpen: boolean;
  openSurface: (surfaceId: ShellSurfaceId, triggerElement?: HTMLElement | null) => void;
  closeSurface: () => void;
  toggleSurface: (surfaceId: ShellSurfaceId, triggerElement?: HTMLElement | null) => void;
  isSurfaceOpen: (surfaceId: ShellSurfaceId) => boolean;
}
