import React, { useState } from 'react';
import { 
  MapPin, 
  Battery, 
  Bluetooth, 
  SunMedium, 
  Smartphone, 
  Plane, 
  Share2, 
  Settings, 
  Wifi, 
  Cast, 
  Monitor, 
  Moon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WindowsQuickActionTile } from './WindowsQuickActionTile';
import { 
  useQuickSettings, 
  usePowerStatus, 
  useNetworkStatus,
  FocusAssistMode,
  ProjectDisplayMode
} from '../../../services/systemBridge';

export interface WindowsQuickActionGridProps {
  onOpenSettings?: () => void;
  onOpenNetworkFlyout?: () => void;
}

export const WindowsQuickActionGrid: React.FC<WindowsQuickActionGridProps> = ({
  onOpenSettings,
  onOpenNetworkFlyout,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // System Bridge hooks
  const {
    quickSettings,
    toggleQuickSetting,
    setFocusAssist,
    setProjectMode,
  } = useQuickSettings();

  const {
    batterySaverActive,
    setBatterySaver,
  } = usePowerStatus();

  const {
    enabled: wifiEnabled,
    currentSsid,
    setWifiEnabled,
  } = useNetworkStatus();

  // Local state for features without direct hardware hook
  const [locationActive, setLocationActive] = useState(true);
  const [connectActive, setConnectActive] = useState(false);

  const cycleFocusAssist = () => {
    const modes: FocusAssistMode[] = ['off', 'priority_only', 'alarms_only'];
    const nextIndex = (modes.indexOf(quickSettings.focusAssist) + 1) % modes.length;
    setFocusAssist(modes[nextIndex]);
  };

  const getFocusAssistLabel = (mode: FocusAssistMode) => {
    switch (mode) {
      case 'priority_only': return 'Priority only';
      case 'alarms_only': return 'Alarms only';
      default: return 'Off';
    }
  };

  const cycleProjectMode = () => {
    const modes: ProjectDisplayMode[] = ['pc_screen_only', 'duplicate', 'extend', 'second_screen_only'];
    const nextIndex = (modes.indexOf(quickSettings.projectMode) + 1) % modes.length;
    setProjectMode(modes[nextIndex]);
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
    <div className="w-full space-y-1.5 font-sans select-none">
      {/* Collapse / Expand Control Header */}
      <div className="flex items-center justify-start pb-0.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11.5px] font-normal text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/70" /> : <ChevronUp className="w-3.5 h-3.5 text-white/70" />}
        </button>
      </div>

      {/* 4-Column Action Tile Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* ROW 1 */}
        {/* 1. Location */}
        <WindowsQuickActionTile
          id="location"
          icon={<MapPin className="w-4 h-4" />}
          label="Location"
          stateLabel={locationActive ? 'On' : 'Off'}
          isActive={locationActive}
          onClick={() => setLocationActive(!locationActive)}
        />

        {/* 2. Battery Saver */}
        <WindowsQuickActionTile
          id="battery_saver"
          icon={<Battery className="w-4 h-4" />}
          label="Battery saver"
          stateLabel={batterySaverActive ? 'On' : 'Off'}
          isActive={batterySaverActive}
          onClick={() => setBatterySaver(!batterySaverActive)}
        />

        {/* 3. Bluetooth */}
        <WindowsQuickActionTile
          id="bluetooth"
          icon={<Bluetooth className="w-4 h-4" />}
          label="Bluetooth"
          stateLabel={quickSettings.bluetooth ? (connectedBtDevice ? 'Connected' : 'On') : 'Off'}
          isActive={quickSettings.bluetooth}
          onClick={() => toggleQuickSetting('bluetooth')}
        />

        {/* 4. Night Light */}
        <WindowsQuickActionTile
          id="night_light"
          icon={<SunMedium className="w-4 h-4" />}
          label="Night light"
          stateLabel={quickSettings.nightLight ? 'On' : 'Off'}
          isActive={quickSettings.nightLight}
          onClick={() => toggleQuickSetting('nightLight')}
        />

        {/* EXPANDED ROWS (ROW 2 & 3) */}
        {isExpanded && (
          <>
            {/* ROW 2 */}
            {/* 5. Mobile Hotspot */}
            <WindowsQuickActionTile
              id="mobile_hotspot"
              icon={<Smartphone className="w-4 h-4" />}
              label="Mobile hotspot"
              stateLabel={quickSettings.mobileHotspot ? 'On' : 'Off'}
              isActive={quickSettings.mobileHotspot}
              onClick={() => toggleQuickSetting('mobileHotspot')}
            />

            {/* 6. Airplane Mode */}
            <WindowsQuickActionTile
              id="airplane_mode"
              icon={<Plane className="w-4 h-4" />}
              label="Airplane mode"
              stateLabel={quickSettings.airplaneMode ? 'On' : 'Off'}
              isActive={quickSettings.airplaneMode}
              onClick={() => toggleQuickSetting('airplaneMode')}
            />

            {/* 7. Nearby Sharing */}
            <WindowsQuickActionTile
              id="nearby_sharing"
              icon={<Share2 className="w-4 h-4" />}
              label="Nearby sharing"
              stateLabel={quickSettings.nearbySharing ? 'On' : 'Off'}
              isActive={quickSettings.nearbySharing}
              onClick={() => toggleQuickSetting('nearbySharing')}
            />

            {/* 8. All Settings */}
            <WindowsQuickActionTile
              id="all_settings"
              icon={<Settings className="w-4 h-4" />}
              label="All settings"
              isActive={false}
              onClick={() => onOpenSettings?.()}
            />

            {/* ROW 3 */}
            {/* 9. Network */}
            <WindowsQuickActionTile
              id="network"
              icon={<Wifi className="w-4 h-4" />}
              label="Network"
              stateLabel={wifiEnabled ? (currentSsid || 'Connected') : 'Disconnected'}
              isActive={wifiEnabled}
              onClick={() => {
                if (onOpenNetworkFlyout) {
                  onOpenNetworkFlyout();
                } else {
                  setWifiEnabled(!wifiEnabled);
                }
              }}
            />

            {/* 10. Connect */}
            <WindowsQuickActionTile
              id="connect"
              icon={<Cast className="w-4 h-4" />}
              label="Connect"
              stateLabel={connectActive ? 'Searching...' : 'Not connected'}
              isActive={connectActive}
              onClick={() => setConnectActive(!connectActive)}
            />

            {/* 11. Project */}
            <WindowsQuickActionTile
              id="project"
              icon={<Monitor className="w-4 h-4" />}
              label="Project"
              stateLabel={getProjectLabel(quickSettings.projectMode)}
              isActive={quickSettings.projectMode !== 'pc_screen_only'}
              onClick={cycleProjectMode}
            />

            {/* 12. Focus Assist */}
            <WindowsQuickActionTile
              id="focus_assist"
              icon={<Moon className="w-4 h-4" />}
              label="Focus assist"
              stateLabel={getFocusAssistLabel(quickSettings.focusAssist)}
              isActive={quickSettings.focusAssist !== 'off'}
              onClick={cycleFocusAssist}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default WindowsQuickActionGrid;
