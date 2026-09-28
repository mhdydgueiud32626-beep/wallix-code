import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wind, 
  Droplets, 
  MapPin, 
  Moon, 
  Sun, 
  ShieldCheck, 
  CloudSun
} from 'lucide-react';
import { useAdaptiveMaterial } from '../../modules/desktop/adaptive/useAdaptiveMaterial';
import { WallpaperRegionKey } from '../../modules/desktop/adaptive/wallpaperAnalysisTypes';

interface WeatherData {
  name: string;
  country?: string;
  tempC: number;
  feelsLikeC: number;
  condition: string;
  humidity: string;
  wind: string;
  airQuality: string;
  uvIndex: string;
  weatherCode: number;
  isLive?: boolean;
}

interface HourlyForecastItem {
  time: string;
  tempC: number;
  icon: 'moon' | 'sun' | 'cloud-sun';
  isActive?: boolean;
}

const DEFAULT_HOURLY_FORECAST: HourlyForecastItem[] = [
  { time: 'Now', tempC: 23, icon: 'moon', isActive: true },
  { time: '1 AM', tempC: 23, icon: 'moon' },
  { time: '2 AM', tempC: 22, icon: 'moon' },
  { time: '3 AM', tempC: 22, icon: 'moon' },
  { time: '4 AM', tempC: 23, icon: 'moon' },
  { time: '5 AM', tempC: 23, icon: 'moon' },
  { time: '6 AM', tempC: 23, icon: 'sun' },
  { time: '7 AM', tempC: 24, icon: 'sun' },
  { time: '8 AM', tempC: 26, icon: 'sun' },
  { time: '9 AM', tempC: 28, icon: 'sun' },
  { time: '10 AM', tempC: 30, icon: 'sun' },
  { time: '11 AM', tempC: 31, icon: 'sun' },
];

const DEFAULT_CITIES: WeatherData[] = [
  { 
    name: 'Jaipur', 
    country: 'India', 
    tempC: 23, 
    feelsLikeC: 27, 
    condition: 'Clear', 
    humidity: '93%', 
    wind: '4 km/h', 
    airQuality: '100 • Moderate', 
    uvIndex: '0 • Low',
    weatherCode: 0 
  },
  { 
    name: 'Tokyo', 
    country: 'Japan', 
    tempC: 22, 
    feelsLikeC: 24, 
    condition: 'Clear Sky', 
    humidity: '58%', 
    wind: '14 km/h', 
    airQuality: '42 • Good', 
    uvIndex: '1 • Low',
    weatherCode: 0 
  },
  { 
    name: 'San Francisco', 
    country: 'USA', 
    tempC: 17, 
    feelsLikeC: 16, 
    condition: 'Ocean Fog', 
    humidity: '72%', 
    wind: '18 km/h', 
    airQuality: '28 • Good', 
    uvIndex: '3 • Moderate',
    weatherCode: 45 
  },
  { 
    name: 'London', 
    country: 'UK', 
    tempC: 15, 
    feelsLikeC: 14, 
    condition: 'Light Drizzle', 
    humidity: '76%', 
    wind: '10 km/h', 
    airQuality: '35 • Good', 
    uvIndex: '2 • Low',
    weatherCode: 51 
  }
];

export interface WeatherWidgetProps {
  compact?: boolean;
  className?: string;
  region?: WallpaperRegionKey;
  accentColor?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  compact = false,
  className = '',
  region = 'bottom-left',
  accentColor: customAccentColor,
}) => {
  const [cityIndex, setCityIndex] = useState(0);
  const [isCelsius, setIsCelsius] = useState(true);
  const [selectedForecastIndex, setSelectedForecastIndex] = useState(0);
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  // Scroll ref and drag/wheel state for smooth horizontal scrolling with strict click separation
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.pageX;
    if (scrollRef.current) {
      scrollLeftRef.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 4) {
      hasMovedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - dx * 1.5;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasMovedRef.current = false;
    }
  };

  // =========================================================================
  // CONSUME EXISTING WALLPAPER ADAPTIVE MATERIAL SYSTEM & SEMANTIC ROLES
  // =========================================================================
  const { tokens: globalTokens, getTokensForRegion } = useAdaptiveMaterial();

  const adaptiveTokens = useMemo(() => {
    if (getTokensForRegion && region) {
      return getTokensForRegion(region);
    }
    return globalTokens;
  }, [globalTokens, getTokensForRegion, region]);

  const { heroGlass, internalSurface, typography, accent } = adaptiveTokens;

  // Resolved dynamic accent with accessibility protection
  const activeAccent = customAccentColor || accent.activeAccent;
  const activeAccentSoft = accent.activeAccentSoft;
  const activeAccentGlow = accent.activeAccentGlow;

  const fetchLiveWeatherByCoords = async (latitude: number, longitude: number, locationName?: string) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&timezone=auto`
      );
      if (!res.ok) throw new Error('Weather API fetch failed');
      const data = await res.json();
      const current = data.current;
      
      let condition = 'Clear';
      if (current.weather_code === 0) condition = 'Clear';
      else if (current.weather_code <= 3) condition = 'Partly Cloudy';
      else if (current.weather_code <= 48) condition = 'Fog & Mist';
      else if (current.weather_code <= 67) condition = 'Rain Showers';
      else if (current.weather_code <= 82) condition = 'Heavy Rain';
      else if (current.weather_code <= 99) condition = 'Thunderstorm';

      const resolvedName = locationName || (data.timezone ? data.timezone.split('/')[1]?.replace('_', ' ') || 'Jaipur' : 'Jaipur');
      const resolvedCountry = data.timezone ? data.timezone.split('/')[0] || 'India' : 'India';

      setLiveWeather({
        name: resolvedName,
        country: resolvedCountry,
        tempC: Math.round(current.temperature_2m),
        feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m + 2),
        condition,
        humidity: `${Math.round(current.relative_humidity_2m)}%`,
        wind: `${Math.round(current.wind_speed_10m)} km/h`,
        airQuality: '45 • Good',
        uvIndex: `${Math.round(current.uv_index ?? 0)} • Low`,
        weatherCode: current.weather_code,
        isLive: true
      });
    } catch (err) {
      console.warn('[WeatherWidget] Live weather fetch fallback:', err);
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLiveWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const current: WeatherData = liveWeather || DEFAULT_CITIES[cityIndex];
  const tempVal = isCelsius ? current.tempC : Math.round((current.tempC * 9) / 5 + 32);
  const feelsLikeVal = isCelsius ? current.feelsLikeC : Math.round((current.feelsLikeC * 9) / 5 + 32);

  const handleNextCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCityIndex((cityIndex + 1) % DEFAULT_CITIES.length);
  };

  // =========================================================================
  // DYNAMIC STYLING DERIVED FROM EXISTING ADAPTIVE MATERIAL ENGINE
  // =========================================================================
  const outerSurfaceStyle: React.CSSProperties = {
    background: heroGlass.background,
    backdropFilter: `blur(${heroGlass.blurPx}px) saturate(${heroGlass.saturationPercent}%)`,
    WebkitBackdropFilter: `blur(${heroGlass.blurPx}px) saturate(${heroGlass.saturationPercent}%)`,
    border: `1px solid ${heroGlass.border}`,
    boxShadow: `${heroGlass.outerShadow}, 0 0 32px ${heroGlass.ambientGlow}, inset 0 1px 1px ${heroGlass.specularColor}`,
  };

  return (
    <div 
      id="wallix-weather-widget"
      style={outerSurfaceStyle}
      className={`select-none p-5 rounded-3xl text-white transition-all duration-300 w-full max-w-sm flex flex-col justify-between space-y-4 shadow-2xl relative overflow-hidden group ${className}`}
    >
      {/* Dynamic Atmospheric Ambient Glow Layer (Pointer Events None) */}
      <div 
        className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[60px] pointer-events-none transition-colors duration-700 ease-out"
        style={{ backgroundColor: heroGlass.ambientGlow }}
      />

      {/* Specular Razor Rim Lighting (Pointer Events None) */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${heroGlass.specularColor}, transparent)`
        }}
      />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: LOCATION, TEMP, CONDITION, MOON/SUN ICON & UNIT TOGGLE     */}
      {/* ========================================================================= */}
      <div className="flex items-start justify-between gap-3 relative z-20 pointer-events-auto">
        
        {/* Left Side: Location + Temp + Condition */}
        <div className="space-y-1">
          {/* Location Pin */}
          <button
            type="button"
            onClick={handleNextCity}
            className="flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer group/loc pointer-events-auto"
            style={{ color: typography.textSecondary }}
            title="Cycle Location"
          >
            <MapPin 
              className="w-3.5 h-3.5 transition-transform group-hover/loc:scale-110" 
              style={{ color: activeAccent }} 
            />
            <span className="tracking-wide">{current.name}{current.country ? `, ${current.country}` : ''}</span>
          </button>

          {/* Large Temperature & Condition */}
          <div className="flex items-baseline gap-2.5 pt-0.5">
            <span 
              className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-['Outfit']"
              style={{ color: typography.textPrimary }}
            >
              {tempVal}°{isCelsius ? 'C' : 'F'}
            </span>
            <span 
              className="text-sm font-bold tracking-wide drop-shadow-sm transition-colors"
              style={{ color: activeAccent }}
            >
              {current.condition}
            </span>
          </div>

          {/* Feels Like Subtext */}
          <div 
            className="text-[11px] font-medium"
            style={{ color: typography.textMuted }}
          >
            Feels like {feelsLikeVal}°{isCelsius ? 'C' : 'F'}
          </div>
        </div>

        {/* Right Side: Big Weather Condition Icon + Unit Switcher */}
        <div className="flex flex-col items-end gap-2 shrink-0 pointer-events-auto">
          {/* Circular Frosted Condition Badge */}
          <div 
            style={{
              background: internalSurface.cardBackground,
              borderColor: internalSurface.cardBorder,
              boxShadow: `0 0 16px ${activeAccentGlow}`,
            }}
            className="w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center text-white"
          >
            <Moon className="w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" style={{ color: activeAccent }} />
          </div>

          {/* °C / °F Unit Pill Toggle */}
          <div 
            style={{
              background: internalSurface.cardBackground,
              borderColor: internalSurface.cardBorder,
            }}
            className="flex items-center p-0.5 rounded-full border text-[10px] font-bold pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => setIsCelsius(true)}
              style={{
                backgroundColor: isCelsius ? activeAccentSoft : 'transparent',
                color: isCelsius ? typography.textPrimary : typography.textMuted,
              }}
              className="px-2 py-0.5 rounded-full transition-all cursor-pointer pointer-events-auto"
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setIsCelsius(false)}
              style={{
                backgroundColor: !isCelsius ? activeAccentSoft : 'transparent',
                color: !isCelsius ? typography.textPrimary : typography.textMuted,
              }}
              className="px-2 py-0.5 rounded-full transition-all cursor-pointer pointer-events-auto"
            >
              °F
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. HOURLY FORECAST SECTION (SMOOTH HORIZONTAL SCROLL + DRAG + NO SCROLLBAR) */}
      {/* ========================================================================= */}
      <div 
        className="space-y-2 pt-2 relative z-20 pointer-events-auto"
        style={{ borderTop: `1px solid ${internalSurface.cardBorder}` }}
      >
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
          <span className="font-bold" style={{ color: typography.textSecondary }}>HOURLY FORECAST</span>
          <span style={{ color: typography.textMuted }}>Next 12 Hours</span>
        </div>

        {/* Scrollable Horizontal Forecast Container with Click/Drag Separation */}
        <div 
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onClickCapture={handleClickCapture}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none py-1 pointer-events-auto"
        >
          {DEFAULT_HOURLY_FORECAST.map((item, index) => {
            const isSelected = selectedForecastIndex === index;
            const hourTemp = isCelsius ? item.tempC : Math.round((item.tempC * 9) / 5 + 32);

            return (
              <button
                key={item.time}
                type="button"
                onClick={() => setSelectedForecastIndex(index)}
                style={{
                  borderColor: isSelected ? internalSurface.selectedBorder : internalSurface.cardBorder,
                  backgroundColor: isSelected ? internalSurface.selectedBackground : internalSurface.cardBackground,
                  boxShadow: isSelected ? `0 0 14px ${activeAccentGlow}` : 'none',
                }}
                className={`min-w-[62px] py-2 px-2.5 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-between space-y-1.5 transition-all duration-200 cursor-pointer shrink-0 pointer-events-auto ${
                  isSelected ? 'font-bold' : 'hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <span 
                  className="text-[10px]"
                  style={{ color: isSelected ? typography.textPrimary : typography.textMuted }}
                >
                  {item.time}
                </span>

                <div className="my-0.5">
                  {item.icon === 'moon' ? (
                    <Moon 
                      className="w-4 h-4" 
                      style={{ color: isSelected ? activeAccent : typography.textSecondary }} 
                    />
                  ) : (
                    <Sun 
                      className="w-4 h-4 text-amber-400" 
                    />
                  )}
                </div>

                <span 
                  className="text-xs"
                  style={{ color: isSelected ? typography.textPrimary : typography.textSecondary }}
                >
                  {hourTemp}°
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 2x2 METRIC CARDS (HUMIDITY, WIND, AIR QUALITY, UV INDEX)               */}
      {/* ========================================================================= */}
      <div 
        className="grid grid-cols-2 gap-2 pt-2 relative z-20 pointer-events-auto"
        style={{ borderTop: `1px solid ${internalSurface.cardBorder}` }}
      >
        
        {/* Humidity Card */}
        <div 
          style={{
            backgroundColor: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="p-2.5 rounded-2xl border backdrop-blur-md flex items-center gap-2.5 transition-colors"
        >
          <div 
            style={{ 
              backgroundColor: activeAccentSoft,
              color: activeAccent,
              borderColor: internalSurface.selectedBorder
            }}
            className="p-2 rounded-xl border flex items-center justify-center shrink-0"
          >
            <Droplets className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] block font-medium" style={{ color: typography.textMuted }}>Humidity</span>
            <span className="text-xs font-bold font-mono" style={{ color: typography.textPrimary }}>{current.humidity}</span>
          </div>
        </div>

        {/* Wind Speed Card */}
        <div 
          style={{
            backgroundColor: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="p-2.5 rounded-2xl border backdrop-blur-md flex items-center gap-2.5 transition-colors"
        >
          <div 
            style={{ 
              backgroundColor: activeAccentSoft,
              color: activeAccent,
              borderColor: internalSurface.selectedBorder
            }}
            className="p-2 rounded-xl border flex items-center justify-center shrink-0"
          >
            <Wind className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] block font-medium" style={{ color: typography.textMuted }}>Wind Speed</span>
            <span className="text-xs font-bold font-mono" style={{ color: typography.textPrimary }}>{current.wind}</span>
          </div>
        </div>

        {/* Air Quality Card */}
        <div 
          style={{
            backgroundColor: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="p-2.5 rounded-2xl border backdrop-blur-md flex items-center gap-2.5 transition-colors"
        >
          <div 
            style={{ 
              backgroundColor: activeAccentSoft,
              color: activeAccent,
              borderColor: internalSurface.selectedBorder
            }}
            className="p-2 rounded-xl border flex items-center justify-center shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] block font-medium" style={{ color: typography.textMuted }}>Air Quality</span>
            <span className="text-xs font-bold font-mono truncate block" style={{ color: typography.textPrimary }}>{current.airQuality}</span>
          </div>
        </div>

        {/* UV Index Card */}
        <div 
          style={{
            backgroundColor: internalSurface.cardBackground,
            borderColor: internalSurface.cardBorder,
          }}
          className="p-2.5 rounded-2xl border backdrop-blur-md flex items-center gap-2.5 transition-colors"
        >
          <div 
            style={{ 
              backgroundColor: activeAccentSoft,
              color: activeAccent,
              borderColor: internalSurface.selectedBorder
            }}
            className="p-2 rounded-xl border flex items-center justify-center shrink-0"
          >
            <Sun className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] block font-medium" style={{ color: typography.textMuted }}>UV Index</span>
            <span className="text-xs font-bold font-mono" style={{ color: typography.textPrimary }}>{current.uvIndex}</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default WeatherWidget;
