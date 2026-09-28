import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  WeatherData, 
  WeatherContextType, 
  HourlyForecastItem, 
  DailyForecastItem, 
  AirQualityData 
} from './weatherTypes';

const WeatherContext = createContext<WeatherContextType | null>(null);

// WMO Weather interpretation codes
function interpretWmoCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

function interpretAqi(aqi: number): AirQualityData {
  if (aqi <= 50) return { aqi, label: 'Good', status: 'good' };
  if (aqi <= 100) return { aqi, label: 'Moderate', status: 'moderate' };
  if (aqi <= 150) return { aqi, label: 'Unhealthy for Sensitive', status: 'unhealthy' };
  if (aqi <= 200) return { aqi, label: 'Unhealthy', status: 'unhealthy' };
  if (aqi <= 300) return { aqi, label: 'Very Unhealthy', status: 'unhealthy' };
  return { aqi, label: 'Hazardous', status: 'unhealthy' };
}

const CACHE_KEY = 'wallix_weather_cache_v1';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [data, setData] = useState<WeatherData>({
    temperature: 28,
    feelsLike: 27,
    condition: 'Clear',
    conditionCode: 0,
    isDay: true,
    city: 'New Delhi',
    country: 'India',
    humidity: 46,
    windSpeed: 12,
    windDirection: 310,
    uvIndex: 4,
    airQuality: { aqi: 74, label: 'Moderate', status: 'moderate', pm25: 22.4 },
    hourlyForecast: [],
    dailyForecast: [],
    lastUpdated: '',
    loading: true,
    error: null,
    status: 'loading'
  });

  const isFetchingRef = useRef(false);

  const fetchWeather = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;

    // Check localStorage cache if not forced
    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_DURATION_MS && parsed.data) {
            setData({
              ...parsed.data,
              loading: false,
              status: 'ready'
            });
            return;
          }
        }
      } catch (e) {
        // Ignore cache parse error
      }
    }

    isFetchingRef.current = true;
    setData((prev) => ({ ...prev, loading: true }));

    try {
      let lat = 28.6139;
      let lon = 77.2090;
      let detectedCity = 'New Delhi';
      let detectedCountry = 'India';

      // Attempt fast IP/Geo resolution
      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(3500) });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.latitude && geoData.longitude) {
            lat = parseFloat(geoData.latitude);
            lon = parseFloat(geoData.longitude);
            detectedCity = geoData.city || detectedCity;
            detectedCountry = geoData.country || detectedCountry;
          }
        }
      } catch (geoErr) {
        // Fallback to default location
      }

      // Fetch Real Weather from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`;

      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetch(weatherUrl, { signal: AbortSignal.timeout(6000) }),
        fetch(aqiUrl, { signal: AbortSignal.timeout(4000) })
      ]);

      if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
        throw new Error('Weather service unavailable');
      }

      const weatherJson = await weatherRes.value.json();
      const current = weatherJson.current;
      const hourly = weatherJson.hourly;
      const daily = weatherJson.daily;

      // Parse Air Quality
      let airQuality: AirQualityData | null = null;
      if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
        try {
          const aqiJson = await aqiRes.value.json();
          if (aqiJson?.current?.us_aqi !== undefined) {
            airQuality = {
              ...interpretAqi(Math.round(aqiJson.current.us_aqi)),
              pm25: aqiJson.current.pm2_5
            };
          }
        } catch (e) {}
      }

      // Process Hourly Forecast (next 12 hours)
      const currentHourIndex = hourly?.time ? Math.max(0, hourly.time.findIndex((t: string) => {
        const itemDate = new Date(t);
        const now = new Date();
        return itemDate >= now;
      })) : 0;

      const hourlyForecast: HourlyForecastItem[] = [];
      if (hourly?.time) {
        const count = Math.min(14, hourly.time.length - currentHourIndex);
        for (let i = 0; i < count; i++) {
          const idx = currentHourIndex + i;
          const timeDate = new Date(hourly.time[idx]);
          const hourNum = timeDate.getHours();
          const isNow = i === 0;
          const timeFormatted = isNow 
            ? 'Now' 
            : timeDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

          hourlyForecast.push({
            time: timeFormatted,
            hour: hourNum,
            temp: Math.round(hourly.temperature_2m[idx]),
            condition: interpretWmoCode(hourly.weather_code[idx]),
            conditionCode: hourly.weather_code[idx],
            isDay: Boolean(hourly.is_day[idx])
          });
        }
      }

      // Process Daily Forecast (next 5 days)
      const dailyForecast: DailyForecastItem[] = [];
      if (daily?.time) {
        const count = Math.min(5, daily.time.length);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < count; i++) {
          const dayDate = new Date(daily.time[i]);
          const dayLabel = i === 0 ? 'Today' : dayNames[dayDate.getDay()];
          dailyForecast.push({
            day: dayLabel,
            date: daily.time[i],
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
            condition: interpretWmoCode(daily.weather_code[i]),
            conditionCode: daily.weather_code[i]
          });
        }
      }

      const nowFormatted = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      const weatherPayload: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        condition: interpretWmoCode(current.weather_code),
        conditionCode: current.weather_code,
        isDay: Boolean(current.is_day),
        city: detectedCity,
        country: detectedCountry,
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: Math.round(current.wind_direction_10m),
        uvIndex: current.uv_index ? Math.round(current.uv_index) : undefined,
        airQuality,
        hourlyForecast,
        dailyForecast,
        lastUpdated: nowFormatted,
        loading: false,
        error: null,
        status: 'ready'
      };

      setData(weatherPayload);

      // Save to local cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: weatherPayload
        }));
      } catch (e) {}

    } catch (err: any) {
      console.warn('Weather fetch warning, falling back to cached state:', err?.message);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to update weather',
        status: prev.temperature ? 'ready' : 'unavailable'
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Auto-refresh every 20 minutes
    const interval = setInterval(() => {
      fetchWeather(true);
    }, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const refreshWeather = useCallback(async () => {
    await fetchWeather(true);
  }, [fetchWeather]);

  return (
    <WeatherContext.Provider value={{ ...data, refreshWeather, unit, setUnit }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export default WeatherProvider;
