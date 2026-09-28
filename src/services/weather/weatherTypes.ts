export interface HourlyForecastItem {
  time: string;
  hour: number;
  temp: number;
  condition: string;
  conditionCode: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  day: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  conditionCode: number;
}

export interface AirQualityData {
  aqi: number;
  label: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  status: 'good' | 'moderate' | 'unhealthy';
  pm25?: number;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  isDay: boolean;
  city: string;
  country: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  uvIndex?: number;
  airQuality?: AirQualityData | null;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
  status: 'loading' | 'ready' | 'error' | 'unavailable';
}

export interface WeatherContextType extends WeatherData {
  refreshWeather: () => Promise<void>;
  unit: 'celsius' | 'fahrenheit';
  setUnit: (unit: 'celsius' | 'fahrenheit') => void;
}
