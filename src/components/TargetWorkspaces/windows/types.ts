import { ResolutionType } from '../../../types';

export type DesktopIconKey = 
  | 'this-pc' 
  | 'projects' 
  | 'network' 
  | 'recycle-bin' 
  | 'control-panel' 
  | 'terminal' 
  | 'wallpapers' 
  | 'folder' 
  | 'browser'
  | 'code';

export interface DesktopIconItem {
  id: string;
  label: string;
  iconKey: DesktopIconKey;
  x: number;
  y: number;
  visible: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface DeviceConfig {
  type: 'laptop' | 'desktop';
  frameThickness: number; // 8 to 24px
  frameRadius: number; // 12 to 32px
  topBarHeight: number; // 24 to 36px
  cameraNotch: boolean;
  brightness: number; // 50 to 100
  showTopBar: boolean;
  shadowDepth: number; // 0 to 100
  aspectRatio: '16:9' | '16:10';
}

export interface WindowsEnvironmentConfig {
  device: DeviceConfig;
  wallpaper: {
    id: string;
    fit: 'cover' | 'contain';
    resolution: ResolutionType;
  };
  desktop: {
    showIcons: boolean;
    showLabels: boolean;
    snapToGrid: boolean;
    gridSize: number;
    vignette: boolean;
  };
  icons: {
    size: 'small' | 'medium' | 'large';
    spacing: number;
    showLabels: boolean;
    snapToGrid: boolean;
    items: DesktopIconItem[];
  };
  taskbar: {
    style: 'frosted' | 'translucent' | 'solid';
    blur: number;
    opacity: number;
    height: number;
    iconSize: 'small' | 'medium' | 'large';
    spacing: number;
    alignment: 'center' | 'left';
    roundedCorners: number; // 0 to 24px
    autoHide: boolean;
    magnification: boolean;
  };
  systemUI: {
    deviceType: 'laptop' | 'desktop';
    showWifi: boolean;
    showVolume: boolean;
    showBattery: boolean;
    showBluetooth: boolean;
    showNetwork: boolean;
    showClock: boolean;
    clockFormat: '12h' | '24h';
    showDate: boolean;
  };
  effects: {
    glassIntensity: number; // 0 to 100
    vignette: boolean;
    shadowDepth: number; // 0 to 100
    gpuSaver: boolean;
    audioReactive: boolean;
    motionEffects: boolean;
  };
}

export const DEFAULT_DESKTOP_ICONS: DesktopIconItem[] = [
  { id: 'this-pc', label: 'This PC', iconKey: 'this-pc', x: 24, y: 24, visible: true },
  { id: 'projects', label: 'Projects', iconKey: 'projects', x: 24, y: 116, visible: true },
  { id: 'network', label: 'Network', iconKey: 'network', x: 24, y: 208, visible: true },
  { id: 'recycle-bin', label: 'Recycle Bin', iconKey: 'recycle-bin', x: 24, y: 300, visible: true },
  { id: 'control-panel', label: 'Control Panel', iconKey: 'control-panel', x: 24, y: 392, visible: true },
  { id: 'terminal', label: 'Terminal', iconKey: 'terminal', x: 116, y: 24, visible: false },
  { id: 'wallpapers', label: 'Wallpapers', iconKey: 'wallpapers', x: 116, y: 116, visible: false },
];

export const DEFAULT_WINDOWS_CONFIG: WindowsEnvironmentConfig = {
  device: {
    type: 'laptop',
    frameThickness: 0,
    frameRadius: 20,
    topBarHeight: 28,
    cameraNotch: false,
    brightness: 100,
    showTopBar: true,
    shadowDepth: 75,
    aspectRatio: '16:9',
  },
  wallpaper: {
    id: '',
    fit: 'cover',
    resolution: '4K UHD',
  },
  desktop: {
    showIcons: true,
    showLabels: true,
    snapToGrid: true,
    gridSize: 20,
    vignette: true,
  },
  icons: {
    size: 'medium',
    spacing: 12,
    showLabels: true,
    snapToGrid: true,
    items: DEFAULT_DESKTOP_ICONS,
  },
  taskbar: {
    style: 'frosted',
    blur: 20,
    opacity: 0.85,
    height: 48,
    iconSize: 'medium',
    spacing: 8,
    alignment: 'center',
    roundedCorners: 16,
    autoHide: false,
    magnification: true,
  },
  systemUI: {
    deviceType: 'laptop',
    showWifi: true,
    showVolume: true,
    showBattery: true,
    showBluetooth: true,
    showNetwork: true,
    showClock: true,
    clockFormat: '12h',
    showDate: true,
  },
  effects: {
    glassIntensity: 75,
    vignette: true,
    shadowDepth: 60,
    gpuSaver: true,
    audioReactive: false,
    motionEffects: true,
  },
};
