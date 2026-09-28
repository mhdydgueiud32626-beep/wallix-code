import React from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Moon, 
  SunMedium, 
  Sun, 
  Volume2, 
  VolumeX,
  Cast, 
  Smartphone, 
  Plane,
  Leaf,
  Sliders,
  Settings,
  BatteryCharging,
  BatteryMedium,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { 
  useQuickSettings, 
  useNetworkStatus, 
  useAudioOutput, 
  usePowerStatus,
  FocusAssistMode, 
  ProjectDisplayMode 
} from '../../../services/systemBridge';
import { shellFlyoutMotion } from './shellMotion';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from './LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../adaptive';

interface WindowsQuickSettingsShellSurfaceProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  onOpenWifiShell?: () => void;
}

export const WindowsQuickSettingsShellSurface: React.FC<WindowsQuickSettingsShellSurfaceProps> = ({
  onClose,
  onOpenSettings,
  onOpenWifiShell,
}) => {
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;
  const textAccent = tokens.typography.textAccent;
  const {
    quickSettings,
    toggleQuickSetting,
    setScreenBrightness,
    setFocusAssist,
    setProjectMode,
  } = useQuickSettings();

  const {
    enabled: wifiEnabled,
    currentSsid,
    setWifiEnabled,
  } = useNetworkStatus();

  const {
    volume,
    isMuted,
    setVolume,
    toggleMute,
  } = useAudioOutput();

  const {
    batteryLevel,
    isCharging,
    batterySaverActive,
    setBatterySaver,
  } = usePowerStatus();

  const cycleFocusAssist = () => {
    const modes: FocusAssistMode[] = ['off', 'priority_only', 'alarms_only'];
    const nextIndex = (modes.indexOf(quickSettings.focusAssist) + 1) % modes.length;
    setFocusAssist(modes[nextIndex]);
  };

  const cycleProjectMode = () => {
    const modes: ProjectDisplayMode[] = ['pc_screen_only', 'duplicate', 'extend', 'second_screen_only'];
    const nextIndex = (modes.indexOf(quickSettings.projectMode) + 1) % modes.length;
    setProjectMode(modes[nextIndex]);
  };

  const getFocusAssistLabel = (mode: FocusAssistMode) => {
    switch (mode) {
      case 'priority_only': return 'Priority only';
      case 'alarms_only': return 'Alarms only';
      default: return 'Off';
    }
  };

  const getProjectLabel = (mode: ProjectDisplayMode) => {
    switch (mode) {
      case 'duplicate': return 'Duplicate';
      case 'extend': return 'Extend';
      case 'second_screen_only': return 'Second screen';
      default: return 'PC screen only';
    }
  };

  const connectedBtDevice = quickSettings.bluetoothDevices.find((d) => d.connected);

  return (
    <LiquidGlassSurface
      variant="flyout"
      {...shellFlyoutMotion}
      className="w-[360px] rounded-xl p-3.5 space-y-3 font-sans text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Windows 11 Quick Action 2-Column Split Pill Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wi-Fi Action Tile with Split Arrow */}
        <div className="flex flex-col">
          <div
            onClick={() => setWifiEnabled(!wifiEnabled)}
            className={`h-11 rounded-lg flex items-center justify-between px-3 transition-all cursor-pointer border ${
              wifiEnabled
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <Wifi className="w-4 h-4" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWifiShell?.();
              }}
              className="p-1 -mr-1 rounded hover:bg-black/25 text-white/80 transition-colors"
              title="Open Wi-Fi list"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Wi-Fi</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {wifiEnabled ? (currentSsid || 'Connected') : 'Off'}
            </div>
          </div>
        </div>

        {/* Bluetooth Action Tile */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleQuickSetting('bluetooth')}
            className={`h-11 rounded-lg flex items-center justify-center px-3 transition-all cursor-pointer border ${
              quickSettings.bluetooth
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <Bluetooth className="w-4 h-4" />
          </button>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Bluetooth</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {quickSettings.bluetooth ? (connectedBtDevice?.name || 'On') : 'Off'}
            </div>
          </div>
        </div>

        {/* Airplane Mode Tile */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleQuickSetting('airplaneMode')}
            className={`h-11 rounded-lg flex items-center justify-center px-3 transition-all cursor-pointer border ${
              quickSettings.airplaneMode
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <Plane className="w-4 h-4" />
          </button>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Airplane mode</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {quickSettings.airplaneMode ? 'On' : 'Off'}
            </div>
          </div>
        </div>

        {/* Battery Saver Tile */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setBatterySaver(!batterySaverActive)}
            className={`h-11 rounded-lg flex items-center justify-center px-3 transition-all cursor-pointer border ${
              batterySaverActive
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <Leaf className="w-4 h-4" />
          </button>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Battery saver</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {batterySaverActive ? 'On' : 'Off'}
            </div>
          </div>
        </div>

        {/* Night Light Tile */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleQuickSetting('nightLight')}
            className={`h-11 rounded-lg flex items-center justify-center px-3 transition-all cursor-pointer border ${
              quickSettings.nightLight
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <SunMedium className="w-4 h-4" />
          </button>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Night light</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {quickSettings.nightLight ? 'On' : 'Off'}
            </div>
          </div>
        </div>

        {/* Project / Screen Cast Tile */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={cycleProjectMode}
            className={`h-11 rounded-lg flex items-center justify-center px-3 transition-all cursor-pointer border ${
              quickSettings.projectMode !== 'pc_screen_only'
                ? LIQUID_GLASS_TOKENS.tileActive
                : LIQUID_GLASS_TOKENS.tileInactive
            }`}
          >
            <Cast className="w-4 h-4" />
          </button>
          <div className="mt-1 text-center min-w-0">
            <div className="text-[11px] font-medium truncate">Project</div>
            <div className="text-[9.5px] text-white/50 truncate">
              {getProjectLabel(quickSettings.projectMode)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Display Brightness Slider */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <Sun className="w-4 h-4 text-amber-300 shrink-0" />
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="10"
            max="100"
            value={quickSettings.screenBrightness}
            onChange={(e) => setScreenBrightness(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer overflow-hidden"
            style={{
              accentColor: activeAccent,
              background: `linear-gradient(to right, ${activeAccent} ${quickSettings.screenBrightness}%, rgba(255, 255, 255, 0.18) ${quickSettings.screenBrightness}%)`,
            }}
          />
        </div>
        <span className="text-[10.5px] font-mono text-white/60 w-7 text-right">
          {quickSettings.screenBrightness}%
        </span>
      </div>

      {/* 3. Audio Volume Slider */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <button
          type="button"
          onClick={toggleMute}
          className="text-white/80 hover:text-white transition shrink-0 cursor-pointer"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4" style={{ color: textAccent }} />
          )}
        </button>
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer overflow-hidden"
            style={{
              accentColor: activeAccent,
              background: `linear-gradient(to right, ${activeAccent} ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.18) ${isMuted ? 0 : volume}%)`,
            }}
          />
        </div>
        <span className="text-[10.5px] font-mono text-white/60 w-7 text-right">
          {isMuted ? '0%' : `${volume}%`}
        </span>
      </div>

      {/* 4. Windows 11 Bottom Status & Settings Bar */}
      <div className="pt-2 border-t border-white/[0.09] flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[11px] text-white/80">
          {isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <BatteryMedium className="w-3.5 h-3.5 text-white/60" />
          )}
          <span>{batteryLevel}%</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onOpenSettings?.();
              onClose?.();
            }}
            className="p-1.5 rounded-md hover:bg-white/10 active:bg-white/15 text-white/70 hover:text-white transition cursor-pointer"
            title="All Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </LiquidGlassSurface>
  );
};

export default WindowsQuickSettingsShellSurface;

