import React, { useState } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Plane, 
  Volume2, 
  Sun, 
  Battery 
} from 'lucide-react';
import { STATUS_GLASS_TOKENS } from './statusTokens';
import { ControlCenterState } from './statusTypes';

interface ControlCenterPanelProps {
  onClose?: () => void;
}

export const ControlCenterPanel: React.FC<ControlCenterPanelProps> = () => {
  const [state, setState] = useState<ControlCenterState>({
    wifi: true,
    bluetooth: true,
    airplaneMode: false,
    volume: 72,
    brightness: 80,
    darkMode: true,
    focusMode: false,
    batteryLevel: 89,
  });

  return (
    <div className="w-full min-w-0 space-y-4 select-none box-border">
      {/* 1. CONNECTIVITY SECTION */}
      <div className="space-y-1.5">
        <span className={STATUS_GLASS_TOKENS.sectionHeader}>Connectivity</span>
        
        <div className="space-y-1 bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
          {/* Wi-Fi Row */}
          <button
            type="button"
            onClick={() => setState(prev => ({ ...prev, wifi: !prev.wifi }))}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
              state.wifi ? 'text-slate-900 dark:text-white' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                state.wifi ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
              }`}>
                <Wifi className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Wi-Fi</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {state.wifi ? 'Connected' : 'Off'}
            </span>
          </button>

          {/* Bluetooth Row */}
          <button
            type="button"
            onClick={() => setState(prev => ({ ...prev, bluetooth: !prev.bluetooth }))}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
              state.bluetooth ? 'text-slate-900 dark:text-white' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                state.bluetooth ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
              }`}>
                <Bluetooth className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Bluetooth</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {state.bluetooth ? 'On' : 'Off'}
            </span>
          </button>

          {/* Airplane Mode Row */}
          <button
            type="button"
            onClick={() => setState(prev => ({ ...prev, airplaneMode: !prev.airplaneMode }))}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
              state.airplaneMode ? 'text-slate-900 dark:text-white' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                state.airplaneMode ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
              }`}>
                <Plane className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Airplane</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {state.airplaneMode ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. AUDIO SECTION */}
      <div className="space-y-1.5">
        <span className={STATUS_GLASS_TOKENS.sectionHeader}>Audio</span>
        <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={state.volume}
            onChange={(e) => setState(prev => ({ ...prev, volume: parseInt(e.target.value, 10) }))}
            className="flex-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 w-8 text-right font-medium">
            {state.volume}%
          </span>
        </div>
      </div>

      {/* 3. DISPLAY SECTION */}
      <div className="space-y-1.5">
        <span className={STATUS_GLASS_TOKENS.sectionHeader}>Display</span>
        <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2.5">
          <Sun className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="range"
            min="10"
            max="100"
            value={state.brightness}
            onChange={(e) => setState(prev => ({ ...prev, brightness: parseInt(e.target.value, 10) }))}
            className="flex-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 w-8 text-right font-medium">
            {state.brightness}%
          </span>
        </div>
      </div>

      {/* 4. BATTERY SECTION */}
      <div className="space-y-1.5 pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
        <span className={STATUS_GLASS_TOKENS.sectionHeader}>Battery</span>
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {state.batteryLevel}%
          </span>
          <div className="w-7 h-3.5 rounded-[4px] border border-slate-700 dark:border-white/70 p-[1px] relative flex items-center">
            <div className="h-full w-[89%] bg-emerald-500 rounded-[2px]" />
            <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-slate-700 dark:bg-white/70 rounded-r-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
