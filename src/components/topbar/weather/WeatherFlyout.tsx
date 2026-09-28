import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Droplets, 
  Wind, 
  MapPin, 
  ShieldCheck, 
  Sun
} from 'lucide-react';
import { useWeather } from '../../../services/weather';
import { WeatherIcon } from './WeatherIcon';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';

export interface WeatherFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const WeatherFlyout: React.FC<WeatherFlyoutProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const {
    temperature,
    feelsLike,
    condition,
    conditionCode,
    isDay,
    city,
    country,
    humidity,
    windSpeed,
    uvIndex,
    airQuality,
    hourlyForecast,
    unit,
    setUnit,
  } = useWeather();

  const { tokens, getTokensForRegion } = useAdaptiveMaterial();
  const regionalTokens = useMemo(() => {
    if (getTokensForRegion) {
      return getTokensForRegion('top-left');
    }
    return tokens;
  }, [tokens, getTokensForRegion]);

  const { heroGlass, internalSurface, typography, accent } = regionalTokens;
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Global Outside Click and Escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (flyoutRef.current && !flyoutRef.current.contains(target)) {
        if (!target.closest('[data-weather-trigger="true"]')) {
          onClose();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const convertTemp = (t: number) => {
    return unit === 'fahrenheit' ? Math.round((t * 9) / 5 + 32) : t;
  };
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  // Compute UV Index label
  const uvValue = uvIndex ?? (isDay ? 3 : 0);
  const uvLabel = uvValue <= 2 ? 'Low' : uvValue <= 5 ? 'Moderate' : uvValue <= 7 ? 'High' : 'Very High';

  // Air Quality label
  const aqiValue = airQuality?.aqi ?? 52;
  const aqiLabel = airQuality?.label ?? (aqiValue <= 50 ? 'Good' : 'Moderate');

  if (!isOpen) return null;

  return (
    <motion.div
      ref={flyoutRef}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      style={{
        background: heroGlass.background,
        backdropFilter: `blur(${heroGlass.blurPx}px) saturate(${heroGlass.saturationPercent}%)`,
        WebkitBackdropFilter: `blur(${heroGlass.blurPx}px) saturate(${heroGlass.saturationPercent}%)`,
        border: `1px solid ${heroGlass.border}`,
        boxShadow: `${heroGlass.outerShadow}, 0 0 32px ${heroGlass.ambientGlow}, inset 0 1px 1px ${heroGlass.specularColor}`,
      }}
      className={`w-[320px] p-4 rounded-2xl shadow-2xl text-white select-none relative overflow-hidden font-sans ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Subtle Atmospheric Ambient Liquid Aura */}
      <div 
        className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-[70px] pointer-events-none transition-colors duration-700 ease-out"
        style={{ backgroundColor: heroGlass.ambientGlow }}
      />

      {/* 2. Top Specular Glass Rim Highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${heroGlass.specularColor}, transparent)`
        }}
      />

      {/* 3. Header Section: City name, condition label & big temperature readout */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col min-w-0 pr-2">
          {/* City & Country */}
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: typography.textSecondary }}>
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent.activeAccent }} />
            <span className="truncate">{city}{country ? `, ${country}` : ''}</span>
          </div>

          {/* Big Temperature Readout */}
          <div className="flex items-baseline gap-2 mt-1">
            <span 
              className="text-3xl font-bold tracking-tight tabular-nums drop-shadow-sm font-['Outfit']"
              style={{ color: typography.textPrimary }}
            >
              {convertTemp(temperature)}{unitSymbol}
            </span>
            <span className="text-sm font-medium" style={{ color: accent.activeAccent }}>
              {condition}
            </span>
          </div>

          {/* Feels-like subtitle */}
          <div className="text-xs mt-0.5" style={{ color: typography.textMuted }}>
            Feels like {convertTemp(feelsLike)}{unitSymbol}
          </div>
        </div>

        {/* Right Header Badges: Icon + Unit Toggle */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div 
            style={{
              background: internalSurface.cardBackground,
              borderColor: internalSurface.cardBorder,
              boxShadow: `0 0 16px ${accent.activeAccentGlow}`,
            }}
            className="p-2.5 rounded-2xl border shadow-sm flex items-center justify-center"
          >
            <WeatherIcon
              conditionCode={conditionCode}
              condition={condition}
              isDay={isDay}
              size={26}
            />
          </div>

          {/* Unit Toggle Buttons */}
          <div 
            style={{
              background: internalSurface.cardBackground,
              borderColor: internalSurface.cardBorder,
            }}
            className="flex items-center rounded-full border p-0.5 text-[10px] font-semibold"
          >
            <button
              type="button"
              onClick={() => setUnit('celsius')}
              style={{
                backgroundColor: unit === 'celsius' ? accent.activeAccentSoft : 'transparent',
                color: unit === 'celsius' ? typography.textPrimary : typography.textMuted,
              }}
              className="px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setUnit('fahrenheit')}
              style={{
                backgroundColor: unit === 'fahrenheit' ? accent.activeAccentSoft : 'transparent',
                color: unit === 'fahrenheit' ? typography.textPrimary : typography.textMuted,
              }}
              className="px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              °F
            </button>
          </div>
        </div>
      </div>

      {/* 4. Hourly Forecast Strip: Horizontal Scrollable Cards */}
      <div 
        className="mt-3.5 pt-3 relative z-10"
        style={{ borderTop: `1px solid ${internalSurface.cardBorder}` }}
      >
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span 
            className="text-[10.5px] font-semibold uppercase tracking-wider font-['Outfit']"
            style={{ color: typography.textSecondary }}
          >
            Hourly Forecast
          </span>
          <span className="text-[10px]" style={{ color: typography.textMuted }}>Next 12 Hours</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar select-none">
          {hourlyForecast && hourlyForecast.length > 0 ? (
            hourlyForecast.slice(0, 12).map((item, idx) => (
              <div
                key={`${item.time}-${idx}`}
                style={{
                  background: idx === 0 ? internalSurface.selectedBackground : internalSurface.cardBackground,
                  borderColor: idx === 0 ? internalSurface.selectedBorder : internalSurface.cardBorder,
                  boxShadow: idx === 0 ? `0 0 14px ${accent.activeAccentGlow}` : 'none',
                }}
                className={`flex flex-col items-center min-w-[50px] p-2 rounded-xl border transition-all ${
                  idx === 0 ? 'font-bold' : ''
                }`}
              >
                <span 
                  className="text-[10px] font-medium mb-1"
                  style={{ color: idx === 0 ? typography.textPrimary : typography.textMuted }}
                >
                  {item.time}
                </span>
                <WeatherIcon
                  conditionCode={item.conditionCode}
                  condition={item.condition}
                  isDay={item.isDay}
                  size={16}
                />
                <span 
                  className="text-xs font-semibold tabular-nums mt-1.5"
                  style={{ color: idx === 0 ? typography.textPrimary : typography.textSecondary }}
                >
                  {convertTemp(item.temp)}°
                </span>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-2 text-xs" style={{ color: typography.textMuted }}>
              Synchronizing hourly data...
            </div>
          )}
        </div>
      </div>

      {/* 5. Essential Metrics Grid (2x2): Humidity, Wind, AQI, UV Index */}
      <div 
        className="mt-3 pt-3 grid grid-cols-2 gap-2 relative z-10"
        style={{ borderTop: `1px solid ${internalSurface.cardBorder}` }}
      >
        {/* Metric 1: Humidity */}
        <div 
          style={{
            background: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="flex items-center gap-2.5 p-2 rounded-xl border transition-colors"
        >
          <div 
            style={{
              backgroundColor: accent.activeAccentSoft,
              borderColor: internalSurface.selectedBorder,
              color: accent.activeAccent,
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
          >
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium leading-none" style={{ color: typography.textMuted }}>Humidity</span>
            <span className="text-xs font-semibold tabular-nums mt-0.5 leading-none" style={{ color: typography.textPrimary }}>
              {humidity}%
            </span>
          </div>
        </div>

        {/* Metric 2: Wind Speed */}
        <div 
          style={{
            background: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="flex items-center gap-2.5 p-2 rounded-xl border transition-colors"
        >
          <div 
            style={{
              backgroundColor: accent.activeAccentSoft,
              borderColor: internalSurface.selectedBorder,
              color: accent.activeAccent,
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
          >
            <Wind className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium leading-none" style={{ color: typography.textMuted }}>Wind Speed</span>
            <span className="text-xs font-semibold tabular-nums mt-0.5 leading-none truncate" style={{ color: typography.textPrimary }}>
              {windSpeed} km/h
            </span>
          </div>
        </div>

        {/* Metric 3: Air Quality Index */}
        <div 
          style={{
            background: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="flex items-center gap-2.5 p-2 rounded-xl border transition-colors"
        >
          <div 
            style={{
              backgroundColor: accent.activeAccentSoft,
              borderColor: internalSurface.selectedBorder,
              color: accent.activeAccent,
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium leading-none" style={{ color: typography.textMuted }}>Air Quality</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold tabular-nums leading-none" style={{ color: typography.textPrimary }}>
                {aqiValue}
              </span>
              <span className="text-[10px] truncate leading-none" style={{ color: typography.textMuted }}>
                · {aqiLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: UV Index */}
        <div 
          style={{
            background: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="flex items-center gap-2.5 p-2 rounded-xl border transition-colors"
        >
          <div 
            style={{
              backgroundColor: accent.activeAccentSoft,
              borderColor: internalSurface.selectedBorder,
              color: accent.activeAccent,
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
          >
            <Sun className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium leading-none" style={{ color: typography.textMuted }}>UV Index</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold tabular-nums leading-none" style={{ color: typography.textPrimary }}>
                {uvValue}
              </span>
              <span className="text-[10px] truncate leading-none" style={{ color: typography.textMuted }}>
                · {uvLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherFlyout;
