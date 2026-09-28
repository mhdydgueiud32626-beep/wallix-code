import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  BatteryCharging, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Sliders, 
  Gauge,
  Leaf,
  ShieldAlert
} from 'lucide-react';
import { usePowerStatus, useHostEnvironment, PowerPlanMode } from '../../../services/systemBridge';
import { shellFlyoutMotion } from './shellMotion';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from './LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../adaptive';

interface WindowsPowerShellSurfaceProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export const WindowsPowerShellSurface: React.FC<WindowsPowerShellSurfaceProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;
  const textAccent = tokens.typography.textAccent;
  const {
    batteryLevel,
    isCharging,
    powerPlan,
    batterySaverActive,
    healthPercentage,
    cycleCount,
    temperatureDisplay,
    estimatedTimeLeft,
    setIsCharging,
    setPowerPlan,
    setBatterySaver,
  } = usePowerStatus();

  const { isWebOnly } = useHostEnvironment();

  const powerPlans: Array<{ id: PowerPlanMode; label: string; desc: string }> = [
    { id: 'power_saver', label: 'Best power efficiency', desc: 'Saves battery by reducing system performance' },
    { id: 'balanced', label: 'Balanced', desc: 'Automatically balances performance with energy consumption' },
    { id: 'best_performance', label: 'Best performance', desc: 'Favors performance over battery life' },
  ];

  return (
    <LiquidGlassSurface
      variant="flyout"
      {...shellFlyoutMotion}
      className="w-[330px] rounded-xl p-3.5 space-y-3 font-sans text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Battery Status & Graphical Level */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.09]">
        <div className="flex items-center gap-3">
          {/* Windows Battery Meter Symbol with Glass Inner Glow */}
          <div className="w-14 h-7 rounded border-2 border-white/80 p-[2px] relative flex items-center bg-black/40 shadow-inner">
            <div
              className={`h-full rounded-xs transition-all duration-300 ${
                isCharging
                  ? 'bg-gradient-to-r from-[#107c41] to-[#1ac266] shadow-[0_0_10px_rgba(26,194,102,0.8)]'
                  : batteryLevel <= 20
                  ? 'bg-gradient-to-r from-[#e81123] to-[#ff4353] shadow-[0_0_8px_rgba(232,17,35,0.7)]'
                  : 'bg-gradient-to-r from-[#107c41] to-[#15a356]'
              }`}
              style={{ width: `${Math.max(8, Math.min(100, batteryLevel))}%` }}
            />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/80 rounded-r-xs" />
            {isCharging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-white drop-shadow-[0_0_4px_rgba(0,0,0,0.9)] animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <div className="text-base font-bold font-mono text-white leading-tight">
              {batteryLevel}%
            </div>
            <div className={`text-[11px] font-medium ${isCharging ? 'text-emerald-400' : 'text-white/65'}`}>
              {isCharging ? 'Plugged in, charging' : estimatedTimeLeft || 'On battery'}
            </div>
          </div>
        </div>

        {/* AC Charger Simulation Switch */}
        <button
          type="button"
          onClick={() => setIsCharging((prev) => !prev)}
          className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium border transition cursor-pointer flex items-center gap-1 ${
            isCharging
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-white/[0.05] text-white/60 border-white/[0.09] hover:text-white/80 hover:bg-white/[0.09]'
          }`}
          title="Simulate Power Adapter plug / unplug"
        >
          <BatteryCharging className="w-3 h-3" />
          <span>{isCharging ? 'AC On' : 'AC Off'}</span>
        </button>
      </div>

      {/* 2. Windows Power Mode Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-white/60 uppercase tracking-wider px-0.5">
          <span>Power mode</span>
          <Gauge className="w-3.5 h-3.5" style={{ color: textAccent }} />
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-black/30 border border-white/[0.08] rounded-lg backdrop-blur-sm">
          {powerPlans.map((plan) => {
            const isSelected = powerPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setPowerPlan(plan.id)}
                style={
                  isSelected
                    ? {
                        backgroundColor: activeAccent,
                        borderColor: tokens.internalSurface.selectedBorder,
                        boxShadow: `0 0 10px ${tokens.accent.activeAccentSoft}`,
                      }
                    : undefined
                }
                className={`py-1.5 px-1 rounded text-[10px] font-medium transition cursor-pointer text-center leading-tight truncate border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent'
                }`}
                title={plan.desc}
              >
                {plan.id === 'power_saver' ? 'Eco Efficiency' : plan.id === 'balanced' ? 'Balanced' : 'Performance'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Battery Saver Toggle */}
      <div className="flex items-center justify-between px-2.5 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          <Leaf className={`w-3.5 h-3.5 ${batterySaverActive ? 'text-emerald-400' : 'text-white/50'}`} />
          <div>
            <div className="text-xs font-medium text-white">Battery saver</div>
            <div className="text-[10px] text-white/45">Throttles background apps</div>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={batterySaverActive}
          onClick={() => setBatterySaver(!batterySaverActive)}
          style={
            batterySaverActive 
              ? {
                  backgroundColor: activeAccent,
                  borderColor: tokens.internalSurface.selectedBorder,
                  boxShadow: `0 0 8px ${tokens.accent.activeAccentSoft}`,
                }
              : undefined
          }
          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center border ${
            batterySaverActive 
              ? 'justify-end' 
              : 'bg-white/20 border-white/10 justify-start'
          }`}
        >
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white shadow-xs"
          />
        </button>
      </div>

      {/* 4. Telemetry Details */}
      <div className="bg-black/30 border border-white/[0.07] rounded-lg p-2.5 space-y-1.5 text-[10.5px] backdrop-blur-xs">
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Battery health</span>
          </span>
          <span className="text-emerald-400 font-semibold">{healthPercentage}% (Good)</span>
        </div>
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#60cdff]" />
            <span>Cycle count</span>
          </span>
          <span className="text-white/80 font-mono">{cycleCount}</span>
        </div>
        <div className="flex justify-between items-center text-white/60">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Thermal state</span>
          </span>
          <span className="text-white/80">{temperatureDisplay}</span>
        </div>
      </div>

      {/* Web-only capability notice */}
      {isWebOnly && (
        <div className="px-2 py-1 bg-amber-500/15 border border-amber-500/25 rounded text-[10px] text-amber-300/90 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 shrink-0 text-amber-400" />
          <span>Browser presentation mode: Host bridge active</span>
        </div>
      )}

      {/* 5. Windows Settings Link */}
      <div className="pt-0.5 border-t border-white/[0.09]">
        <button
          type="button"
          onClick={() => {
            onOpenSettings?.();
            onClose?.();
          }}
          className="w-full py-1.5 bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.09] rounded-lg text-xs font-medium text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-white/70" />
          <span>Battery & power settings</span>
        </button>
      </div>
    </LiquidGlassSurface>
  );
};

export default WindowsPowerShellSurface;

