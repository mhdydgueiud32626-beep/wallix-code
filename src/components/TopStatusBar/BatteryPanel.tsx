import React, { useState } from 'react';
import { STATUS_GLASS_TOKENS } from './statusTokens';
import { BatteryState } from './statusTypes';

interface BatteryPanelProps {
  onClose?: () => void;
}

export const BatteryPanel: React.FC<BatteryPanelProps> = () => {
  const [battery] = useState<BatteryState>({
    level: 89,
    isCharging: false,
    powerSource: 'Battery',
    powerMode: 'Optimized',
    remainingText: 'Approximately 4 hr 32 min',
    health: 'Normal',
    energySaver: false,
  });

  const [energySaver, setEnergySaver] = useState(false);

  return (
    <div className="w-full min-w-0 space-y-3.5 select-none box-border">
      {/* Header */}
      <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Battery</h3>

      {/* Large 89% Display & Battery Icon */}
      <div className="flex items-start justify-between py-1">
        <div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono leading-none">
            {battery.level}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Battery level</p>
        </div>

        {/* Scaled Battery Glyph matching Reference 4 */}
        <div className="w-12 h-6 rounded-[6px] border-2 border-slate-700 dark:border-white/80 p-0.5 relative flex items-center mt-1 flex-shrink-0">
          <div 
            className="h-full bg-emerald-500 rounded-[3px] transition-all"
            style={{ width: `${battery.level}%` }}
          />
          <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-slate-700 dark:bg-white/80 rounded-r-[2px]" />
        </div>
      </div>

      {/* Information Rows */}
      <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">Power Source:</span>
          <span className="font-medium text-slate-900 dark:text-white flex-shrink-0">On {battery.powerSource}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">Power Mode:</span>
          <span className="font-medium text-slate-900 dark:text-white flex-shrink-0">{battery.powerMode}</span>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">Remaining:</span>
            <span className="font-medium text-slate-900 dark:text-white text-[11px] text-right flex-shrink-0">{battery.remainingText}</span>
          </div>
          {/* Subtle horizontal progress bar */}
          <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.1] rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 dark:bg-slate-300 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">Battery usage:</span>
          <span className="font-medium text-slate-900 dark:text-white flex-shrink-0">{battery.health}</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">Energy Saver:</span>
          <button
            type="button"
            role="switch"
            aria-checked={energySaver}
            onClick={() => setEnergySaver(!energySaver)}
            className={`text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition flex-shrink-0 ${
              energySaver 
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {energySaver ? 'On' : 'Off'}
          </button>
        </div>
      </div>
    </div>
  );
};
