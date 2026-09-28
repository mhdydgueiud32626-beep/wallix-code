import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useWeather } from '../../../services/weather';
import { WeatherIcon } from './WeatherIcon';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';

export interface WeatherStatusPillProps {
  isOpen?: boolean;
  onClick?: () => void;
  placement?: 'companion' | 'integrated';
  className?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const WeatherStatusPill: React.FC<WeatherStatusPillProps> = ({
  isOpen = false,
  onClick,
  placement = 'companion',
  className = '',
  buttonRef,
}) => {
  const { 
    temperature, 
    city, 
    condition, 
    conditionCode, 
    isDay, 
    loading, 
    status,
    unit
  } = useWeather();

  const [isHovered, setIsHovered] = useState(false);
  const { tokens } = useAdaptiveMaterial();

  const displayTemp = unit === 'fahrenheit' 
    ? Math.round((temperature * 9) / 5 + 32)
    : temperature;
  const tempUnitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  // Companion Mode vs Integrated Mode
  const isCompanion = placement === 'companion';

  const accessibleLabel = status === 'ready'
    ? `Weather: ${displayTemp}${tempUnitSymbol} in ${city}, ${condition}. Click to view 5-day forecast and details`
    : loading 
    ? 'Weather: Loading current forecast' 
    : 'Weather: Conditions unavailable';

  return (
    <motion.button
      ref={buttonRef as any}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.96 }}
      aria-label={accessibleLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      style={{
        boxShadow: isOpen 
          ? `0 0 16px ${tokens.accent.activeAccentSoft}, 0 8px 24px -4px rgba(0, 0, 0, 0.45)` 
          : '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
      }}
      className={`
        inline-flex items-center h-9 px-3 gap-2 rounded-full
        select-none cursor-pointer text-white font-medium
        transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
        ${isCompanion 
          ? `backdrop-blur-xl border ${
              isOpen 
                ? 'bg-white/22 dark:bg-black/55 border-cyan-400/60 shadow-lg' 
                : 'bg-white/10 dark:bg-black/35 border-white/15 hover:bg-white/16 hover:border-white/25 shadow-lg shadow-black/30'
            }` 
          : `hover:bg-white/10 ${isOpen ? 'bg-white/20' : ''}`
        }
        ${className}
      `}
    >
      {/* LOADING STATE */}
      {status === 'loading' && loading && (
        <div className="flex items-center gap-1.5 animate-pulse">
          <div className="w-4 h-4 rounded-full bg-white/25" />
          <div className="w-6 h-3.5 rounded-sm bg-white/20" />
          <div className="w-12 h-3.5 rounded-sm bg-white/15 hidden sm:block" />
        </div>
      )}

      {/* READY STATE */}
      {status === 'ready' && (
        <>
          <WeatherIcon
            conditionCode={conditionCode}
            condition={condition}
            isDay={isDay}
            size={16}
            isHovered={isHovered}
          />
          <span className="text-xs font-semibold text-white tracking-tight tabular-nums drop-shadow-xs">
            {displayTemp}{tempUnitSymbol}
          </span>
          <span className="text-xs text-white/70 font-normal truncate max-w-[85px] sm:max-w-[125px] drop-shadow-xs">
            {city}
          </span>
        </>
      )}

      {/* ERROR / UNAVAILABLE STATE */}
      {(status === 'error' || status === 'unavailable') && (
        <div className="flex items-center gap-1.5 text-white/60">
          <WeatherIcon condition="cloud" size={15} isHovered={isHovered} color="#94a3b8" />
          <span className="text-xs text-white/70 font-normal">Weather</span>
        </div>
      )}

      {/* Integrated subtle separator */}
      {!isCompanion && (
        <div className="h-4 w-[1px] bg-white/20 ml-1 shrink-0 rounded-full" />
      )}
    </motion.button>
  );
};

export default WeatherStatusPill;
