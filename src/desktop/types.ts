export type WidgetId = 'clock' | 'weather' | 'music' | 'calendar' | 'companion' | 'dock';

export type ColorOverlayMode = 'normal' | 'cyberpunk' | 'vintage' | 'oled';

export interface WidgetPosition {
  x: number;
  y: number;
  visible: boolean;
}

export type WidgetLayoutConfig = Record<WidgetId, WidgetPosition>;

export interface WidgetLayoutItem {
  id: WidgetId;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
}

export type WidgetLayoutState = Record<WidgetId, WidgetLayoutItem>;

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number; // x for vertical, y for horizontal
  start?: number;
  end?: number;
  label?: string;
}

export interface CutoutSubject {
  id: string;
  name: string;
  category: string;
  cutoutUrl: string;
  scale?: number;
  offsetY?: number;
  offsetX?: number;
  description: string;
}

export interface DesktopEngineConfig {
  nativeBridgeEnabled: boolean;
  autoPauseOnBattery: boolean;
  autoPauseOnMaximizedApp: boolean;
  fpsLimitOnBattery: 30 | 60;
  hardwareAcceleration: boolean;
  workerWHookActive: boolean;
}
