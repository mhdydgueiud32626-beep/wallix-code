import React from 'react';
import { motion } from 'motion/react';
import { 
  Wifi, 
  Bluetooth, 
  Moon, 
  SunMedium, 
  Sun, 
  Volume2, 
  Cast, 
  Share2, 
  Smartphone, 
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { useQuickSettings, useNetworkStatus, useAudioOutput, FocusAssistMode, ProjectDisplayMode } from '../../../services/systemBridge';

interface ControlCenterMenuProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  volume?: number;
  setVolume?: (vol: number | ((prev: number) => number)) => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean | ((prev: boolean) => boolean)) => void;
}

export const ControlCenterMenu: React.FC<ControlCenterMenuProps> = ({ 
  onClose,
  onOpenSettings,
}) => {
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
      case 'priority_only': return 'Priority Only';
      case 'alarms_only': return 'Alarms Only';
      default: return 'Off';
    }
  };

  const getProjectLabel = (mode: ProjectDisplayMode) => {
    switch (mode) {
      case 'duplicate': return 'Duplicate';
      case 'extend': return 'Extend Display';
      case 'second_screen_only': return 'Second Screen';
      default: return 'PC Screen Only';
    }
  };

  const connectedBtDevice = quickSettings.bluetoothDevices.find((d) => d.connected);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="w-[336px] bg-slate-900/85 dark:bg-black/80 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-3.5 text-white select-none z-50 pointer-events-auto space-y-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Primary Quick Action 2-Column Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Wi-Fi Tile */}
        <button
          onClick={() => setWifiEnabled(!wifiEnabled)}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            wifiEnabled
              ? 'bg-blue-500/25 border-blue-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            wifiEnabled ? 'bg-blue-500 text-white shadow-md' : 'bg-white/15 text-white/60'
          }`}>
            <Wifi className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Wi-Fi</div>
            <div className="text-[10px] text-white/50 truncate">
              {wifiEnabled ? (currentSsid || 'Connected') : 'Off'}
            </div>
          </div>
        </button>

        {/* Bluetooth Tile */}
        <button
          onClick={() => toggleQuickSetting('bluetooth')}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            quickSettings.bluetooth
              ? 'bg-blue-500/25 border-blue-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            quickSettings.bluetooth ? 'bg-blue-500 text-white shadow-md' : 'bg-white/15 text-white/60'
          }`}>
            <Bluetooth className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Bluetooth</div>
            <div className="text-[10px] text-white/50 truncate">
              {quickSettings.bluetooth ? (connectedBtDevice?.name || 'On') : 'Off'}
            </div>
          </div>
        </button>

        {/* Focus Assist (Do Not Disturb) Tile */}
        <button
          onClick={cycleFocusAssist}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            quickSettings.focusAssist !== 'off'
              ? 'bg-indigo-500/25 border-indigo-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            quickSettings.focusAssist !== 'off' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/15 text-white/60'
          }`}>
            <Moon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Focus Assist</div>
            <div className="text-[10px] text-white/50 truncate">
              {getFocusAssistLabel(quickSettings.focusAssist)}
            </div>
          </div>
        </button>

        {/* Night Light (Warm screen tint) Tile */}
        <button
          onClick={() => toggleQuickSetting('nightLight')}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            quickSettings.nightLight
              ? 'bg-amber-500/25 border-amber-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            quickSettings.nightLight ? 'bg-amber-500 text-white shadow-md' : 'bg-white/15 text-white/60'
          }`}>
            <SunMedium className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Night Light</div>
            <div className="text-[10px] text-white/50 truncate">
              {quickSettings.nightLight ? 'Warm Tint On' : 'Off'}
            </div>
          </div>
        </button>

        {/* Project / Screen Cast Tile */}
        <button
          onClick={cycleProjectMode}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            quickSettings.projectMode !== 'pc_screen_only'
              ? 'bg-blue-500/25 border-blue-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            quickSettings.projectMode !== 'pc_screen_only' ? 'bg-blue-500 text-white' : 'bg-white/15 text-white/60'
          }`}>
            <Cast className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Project</div>
            <div className="text-[10px] text-white/50 truncate">
              {getProjectLabel(quickSettings.projectMode)}
            </div>
          </div>
        </button>

        {/* Mobile Hotspot Tile */}
        <button
          onClick={() => toggleQuickSetting('mobileHotspot')}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
            quickSettings.mobileHotspot
              ? 'bg-emerald-500/25 border-emerald-400/40 text-white'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            quickSettings.mobileHotspot ? 'bg-emerald-500 text-white shadow-md' : 'bg-white/15 text-white/60'
          }`}>
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">Mobile Hotspot</div>
            <div className="text-[10px] text-white/50 truncate">
              {quickSettings.mobileHotspot ? 'Sharing On' : 'Off'}
            </div>
          </div>
        </button>
      </div>

      {/* 2. Display Brightness Slider */}
      <div className="bg-white/10 border border-white/12 rounded-xl p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-white px-0.5">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span>Display Brightness</span>
          </div>
          <span className="text-[11px] font-mono text-white/60">{quickSettings.screenBrightness}%</span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          value={quickSettings.screenBrightness}
          onChange={(e) => setScreenBrightness(Number(e.target.value))}
          className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 overflow-hidden"
          style={{
            background: `linear-gradient(to right, #fbbf24 ${quickSettings.screenBrightness}%, rgba(255, 255, 255, 0.2) ${quickSettings.screenBrightness}%)`,
          }}
        />
      </div>

      {/* 3. Audio Volume Slider */}
      <div className="bg-white/10 border border-white/12 rounded-xl p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-white px-0.5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Sound Volume</span>
          </div>
          <span className="text-[11px] font-mono text-white/60">{isMuted ? 'Muted' : `${volume}%`}</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 overflow-hidden"
          style={{
            background: `linear-gradient(to right, #38bdf8 ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.2) ${isMuted ? 0 : volume}%)`,
          }}
        />
      </div>

      {/* 4. Windows All Settings Footer */}
      <div className="pt-1">
        <button
          onClick={() => {
            onOpenSettings?.();
            onClose?.();
          }}
          className="w-full py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-medium text-white text-center transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-white/70" />
          <span>All Windows Settings</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ControlCenterMenu;
