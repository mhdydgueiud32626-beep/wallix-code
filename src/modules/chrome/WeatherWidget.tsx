import React, { useState } from 'react';
import { Sun, CloudSun, ArrowUp, ArrowDown, Calendar, MapPin } from 'lucide-react';
import { GlassSurface } from './GlassSurface';

export interface WeatherWidgetProps {
  variant?: 'full' | 'card';
  accent?: 'none' | 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
  opacity?: number;
  blur?: number | 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  borderOpacity?: number;
  className?: string;
}

interface DayForecast {
  day: string;
  tempC: number;
  isToday?: boolean;
}

const WEEKDAYS: DayForecast[] = [
  { day: 'MON', tempC: 27 },
  { day: 'TUE', tempC: 26 },
  { day: 'WED', tempC: 28 },
  { day: 'THU', tempC: 28, isToday: true },
  { day: 'FRI', tempC: 27 },
  { day: 'SAT', tempC: 26 },
  { day: 'SUN', tempC: 25 },
];

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  variant = 'full',
  accent = 'none',
  opacity = 24,
  blur = 24,
  borderOpacity = 20,
  className = '',
}) => {
  const [isCelsius, setIsCelsius] = useState(true);

  // DEMO / SAMPLE DATA: Curated representative weather telemetry for instant offline/preview rendering
  const tempC = 28;
  const feelsLikeC = 26;
  const highC = 28;
  const lowC = 23;
  const locationName = 'New Delhi';

  const tempDisplay = isCelsius ? `${tempC}` : `${Math.round(tempC * 1.8 + 32)}`;
  const unit = isCelsius ? '°C' : '°F';
  const feelsLikeDisplay = isCelsius ? `${feelsLikeC}°` : `${Math.round(feelsLikeC * 1.8 + 32)}°`;
  const highDisplay = isCelsius ? `${highC}°` : `${Math.round(highC * 1.8 + 32)}°`;
  const lowDisplay = isCelsius ? `${lowC}°` : `${Math.round(lowC * 1.8 + 32)}°`;

  // Refined theme styling mapping for active day pill and accents
  const themeStyles = {
    cyan: {
      activePill: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.25)]',
      iconColor: 'text-cyan-400',
      tempHover: 'group-hover/temp:text-cyan-300',
      ambientGlow: 'from-cyan-500/6 via-transparent to-transparent',
    },
    purple: {
      activePill: 'bg-purple-500/20 border-purple-400/40 text-purple-100 shadow-[0_0_10px_rgba(192,132,252,0.25)]',
      iconColor: 'text-purple-400',
      tempHover: 'group-hover/temp:text-purple-300',
      ambientGlow: 'from-purple-500/6 via-transparent to-transparent',
    },
    blue: {
      activePill: 'bg-blue-500/20 border-blue-400/40 text-blue-100 shadow-[0_0_10px_rgba(96,165,250,0.25)]',
      iconColor: 'text-blue-400',
      tempHover: 'group-hover/temp:text-blue-300',
      ambientGlow: 'from-blue-500/6 via-transparent to-transparent',
    },
    emerald: {
      activePill: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.25)]',
      iconColor: 'text-emerald-400',
      tempHover: 'group-hover/temp:text-emerald-300',
      ambientGlow: 'from-emerald-500/6 via-transparent to-transparent',
    },
    amber: {
      activePill: 'bg-amber-500/20 border-amber-400/40 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.25)]',
      iconColor: 'text-amber-400',
      tempHover: 'group-hover/temp:text-amber-300',
      ambientGlow: 'from-amber-500/6 via-transparent to-transparent',
    },
    rose: {
      activePill: 'bg-rose-500/20 border-rose-400/40 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
      iconColor: 'text-rose-400',
      tempHover: 'group-hover/temp:text-rose-300',
      ambientGlow: 'from-rose-500/6 via-transparent to-transparent',
    },
    none: {
      activePill: 'bg-white/15 border-white/30 text-white shadow-[0_0_8px_rgba(255,255,255,0.18)]',
      iconColor: 'text-cyan-400',
      tempHover: 'group-hover/temp:text-cyan-300',
      ambientGlow: 'from-white/4 via-transparent to-transparent',
    },
  }[accent || 'none'] || {
    activePill: 'bg-white/15 border-white/30 text-white shadow-[0_0_8px_rgba(255,255,255,0.18)]',
    iconColor: 'text-cyan-400',
    tempHover: 'group-hover/temp:text-cyan-300',
    ambientGlow: 'from-white/4 via-transparent to-transparent',
  };

  // =========================================================================
  // 1. MINIATURE SIMPLIFIED BADGE FOR ENVIRONMENT CARD (variant="card")
  // =========================================================================
  if (variant === 'card') {
    return (
      <GlassSurface
        radius="full"
        opacity={opacity}
        blur={16}
        borderOpacity={borderOpacity}
        shadow="subtle"
        className={`px-2.5 py-1 flex items-center gap-1.5 text-slate-200 select-none shadow-sm ${className}`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-300/90 flex-shrink-0 animate-sun-glow" />
        <span className="font-medium text-[10.5px] tracking-tight">{tempC}°C</span>
        <span className="text-[9.5px] text-slate-300/80 font-normal">{locationName}</span>
      </GlassSurface>
    );
  }

  // =========================================================================
  // 2. FULL FROSTED GLASS WIDGET FOR CHROME WORKSPACE (variant="full")
  // Designed in WALLIX Glass Language: translucent frosted glass with
  // subtle light sweep, high contrast, clean typography, and zero wallpaper obstruction.
  // =========================================================================
  return (
    <GlassSurface
      radius="2xl"
      opacity={opacity}
      blur={blur}
      borderOpacity={borderOpacity}
      shadow="medium"
      accent={accent}
      frostedHighlight={true}
      className={`relative overflow-hidden w-[clamp(220px,18vw,290px)] min-h-[clamp(110px,10vw,150px)] p-[clamp(10px,1vw,14px)] text-white select-none transition-all duration-300 group/weather hover:border-white/25 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      {/* Layer 1 & 2: Ambient Accent Gradient & Glass Highlight */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themeStyles.ambientGlow} pointer-events-none rounded-[inherit]`} />

      {/* Layer 3: Real Glass Light Shimmer (Whisper-Soft, Restrained Sweep) */}
      <div className="animate-glass-light-sweep" aria-hidden="true" />

      {/* TOP ROW: Date as Secondary Supporting Information */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 pb-1.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3 h-3 text-slate-400/80 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
          <span className="text-[10px] sm:text-[10.5px] font-normal text-slate-400/85 tracking-tight truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            Sunday, 12 Apr 2026
          </span>
        </div>

        {/* Ambient Sun Icon Indicator */}
        <div 
          title="Clear / Partly Sunny"
          className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-300/20 flex items-center justify-center text-amber-300/85 shadow-[0_0_8px_rgba(251,191,36,0.15)] flex-shrink-0 transition-transform duration-300 group-hover/weather:scale-105"
        >
          <Sun className="w-2.5 h-2.5 text-amber-300/90 animate-sun-glow" />
        </div>
      </div>

      {/* MIDDLE SECTION: Primary Temperature & Secondary Weather Telemetry */}
      <div className="relative z-10 flex items-center justify-between gap-2 py-2 my-0.5">
        {/* Priority 1: Temperature as the Primary Visual Hero */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <Sun className="w-6 h-6 text-amber-300/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)] animate-sun-glow" />
            <CloudSun className="w-4 h-4 text-slate-200/90 absolute -bottom-1 -right-1 animate-cloud-float drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </div>

          <button
            type="button"
            onClick={() => setIsCelsius(!isCelsius)}
            title="Click to toggle °C / °F"
            aria-label="Toggle Celsius and Fahrenheit"
            className="flex items-baseline cursor-pointer group/temp bg-transparent border-0 p-0 text-left transition-transform active:scale-95 outline-none"
          >
            <span className="text-3xl sm:text-[34px] font-light tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-none font-sans">
              {tempDisplay}
            </span>
            <span className={`text-xs sm:text-sm font-light text-slate-300/80 ml-0.5 tracking-tight transition-colors ${themeStyles.tempHover}`}>
              {unit}
            </span>
          </button>
        </div>

        {/* Priority 2, 3, 4: Condition/Location -> Feels-Like -> High/Low Pills */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Priority 2: Current condition / location */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[10.5px] text-slate-200/90 font-medium tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <MapPin className={`w-2.5 h-2.5 ${themeStyles.iconColor} flex-shrink-0`} />
            <span className="truncate max-w-[85px]">{locationName}</span>
            <span className="text-slate-400/80">·</span>
            <span>{feelsLikeDisplay}</span>
          </div>

          {/* Priority 3: Feels Like */}
          <div className="text-[9px] text-slate-400/90 font-normal tracking-tight">
            Feels like {feelsLikeDisplay}
          </div>

          {/* Priority 4: High / Low Pills */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div 
              title={`High: ${highDisplay}`}
              className="px-1.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 backdrop-blur-md flex items-center gap-1 text-[9px] sm:text-[9.5px] font-medium text-slate-200 shadow-xs transition-colors"
            >
              <ArrowUp className="w-2 h-2 text-rose-400 stroke-[2.5]" />
              <span>{highDisplay}</span>
            </div>
            <div 
              title={`Low: ${lowDisplay}`}
              className="px-1.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 backdrop-blur-md flex items-center gap-1 text-[9px] sm:text-[9.5px] font-medium text-slate-200 shadow-xs transition-colors"
            >
              <ArrowDown className="w-2 h-2 text-cyan-400 stroke-[2.5]" />
              <span>{lowDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 7-Day Forecast Grid with Frosted Themed Active Day Pill */}
      <div className="relative z-10 pt-2 border-t border-white/[0.08] grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => {
          const dayTemp = isCelsius ? `${d.tempC}°` : `${Math.round(d.tempC * 1.8 + 32)}°`;
          
          if (d.isToday) {
            return (
              <div
                key={d.day}
                title="Today"
                className={`py-1 px-0.5 rounded-lg border flex flex-col items-center justify-center transition-all duration-200 ${themeStyles.activePill}`}
              >
                <span className="text-[8.5px] font-bold tracking-wider leading-tight">
                  {d.day}
                </span>
                <span className="text-[8px] font-extrabold leading-tight mt-0.5">
                  {dayTemp}
                </span>
              </div>
            );
          }

          return (
            <div
              key={d.day}
              className="py-1 px-0.5 rounded-lg flex flex-col items-center justify-center text-slate-300/75 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
            >
              <span className="text-[8.5px] font-medium tracking-wider leading-tight">
                {d.day}
              </span>
              <span className="text-[8px] text-slate-400/80 font-normal leading-tight mt-0.5">
                {dayTemp}
              </span>
            </div>
          );
        })}
      </div>
    </GlassSurface>
  );
};

