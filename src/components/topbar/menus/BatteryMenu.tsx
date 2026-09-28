import React from 'react';
import { motion } from 'motion/react';
import { 
  Sliders, 
  ShieldCheck,
  Zap,
  BatteryCharging,
  BatteryMedium,
  Sparkles,
  Flame,
  Activity,
  Gauge
} from 'lucide-react';
import { usePowerStatus, PowerPlanMode } from '../../../services/systemBridge';

interface BatteryMenuProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  batteryLevel?: number;
  setBatteryLevel?: (level: number | ((prev: number) => number)) => void;
  isCharging?: boolean;
  setIsCharging?: (charging: boolean | ((prev: boolean) => boolean)) => void;
}

export const BatteryMenu: React.FC<BatteryMenuProps> = ({ 
  onClose,
  onOpenSettings,
  batteryLevel: externalBatteryLevel,
  setBatteryLevel: externalSetBatteryLevel,
  isCharging: externalIsCharging,
  setIsCharging: externalSetIsCharging
}) => {
  const {
    batteryLevel: bridgeBatteryLevel,
    isCharging: bridgeIsCharging,
    powerPlan,
    batterySaverActive,
    healthPercentage,
    cycleCount,
    temperatureDisplay,
    estimatedTimeLeft,
    setBatteryLevel: bridgeSetBatteryLevel,
    setIsCharging: bridgeSetIsCharging,
    setPowerPlan,
    setBatterySaver,
  } = usePowerStatus();

  const batteryLevel = externalBatteryLevel !== undefined ? externalBatteryLevel : bridgeBatteryLevel;
  const setBatteryLevel = externalSetBatteryLevel || bridgeSetBatteryLevel;
  const isCharging = externalIsCharging !== undefined ? externalIsCharging : bridgeIsCharging;
  const setIsCharging = externalSetIsCharging || bridgeSetIsCharging;

  const powerPlans: Array<{ id: PowerPlanMode; label: string; desc: string }> = [
    { id: 'power_saver', label: 'Best Power Efficiency', desc: 'Throttles background tasks to maximize battery life' },
    { id: 'balanced', label: 'Balanced (Recommended)', desc: 'Automatically balances performance with energy consumption' },
    { id: 'best_performance', label: 'Best Performance', desc: 'Maximum CPU clocks & screen responsiveness' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="w-[320px] bg-slate-900/85 dark:bg-black/80 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-4 text-white select-none z-50 pointer-events-auto space-y-3.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. High-Glow Battery Graphic with Live Level & Status */}
      <div className="flex flex-col items-center justify-center py-1">
        <div className="flex items-center gap-3.5">
          <div className="w-20 h-8 rounded-lg border-2 border-white/80 p-[2px] relative flex items-center bg-black/40 shadow-inner">
            <div 
              className={`h-full rounded-sm transition-all duration-500 ${
                isCharging
                  ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]'
                  : batteryLevel <= 20
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
              }`}
              style={{ width: `${Math.max(6, Math.min(100, batteryLevel))}%` }}
            />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-white/80 rounded-r-xs" />
            {isCharging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]" />
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono text-white leading-tight">{batteryLevel}%</div>
            <div className={`text-[10.5px] font-medium ${isCharging ? 'text-emerald-400' : 'text-white/60'}`}>
              {isCharging ? 'Power Adapter (Charging)' : estimatedTimeLeft}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-white/10 my-1" />

      {/* 2. Power Source Simulation Toggle */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
            isCharging ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/60'
          }`}>
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Power Source</div>
            <div className="text-[10px] text-white/50">{isCharging ? 'Fast Charging Connected' : 'Simulate AC Charger'}</div>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isCharging}
          onClick={() => setIsCharging((prev) => !prev)}
          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
            isCharging ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
          }`}
        >
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4.5 h-4.5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>

      {/* 3. Windows Power Mode Slider / Profile Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
          <span>Windows Power Mode</span>
          <Gauge className="w-3 h-3 text-cyan-400" />
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {powerPlans.map((plan) => {
            const isSelected = powerPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setPowerPlan(plan.id)}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition cursor-pointer text-center leading-tight truncate ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={plan.desc}
              >
                {plan.id === 'power_saver' ? 'Eco Saver' : plan.id === 'balanced' ? 'Balanced' : 'Performance'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Windows Battery Telemetry & Health */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1.5 text-[10.5px]">
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Battery Health Condition</span>
          </span>
          <span className="text-emerald-400 font-semibold">{healthPercentage}% (Normal)</span>
        </div>
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Cycle Count</span>
          </span>
          <span className="text-white/80 font-mono">{cycleCount} cycles</span>
        </div>
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Battery Thermal State</span>
          </span>
          <span className="text-white/80">{temperatureDisplay}</span>
        </div>
      </div>

      {/* 5. Windows Power & Battery Settings Link */}
      <div className="pt-0.5">
        <button
          onClick={() => {
            onOpenSettings?.();
            onClose?.();
          }}
          className="w-full py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-medium text-white text-center transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-white/70" />
          <span>Battery & Power Settings</span>
        </button>
      </div>
    </motion.div>
  );
};

export default BatteryMenu;
