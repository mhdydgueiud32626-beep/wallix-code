import React from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  Moon, 
  CloudSun, 
  CloudMoon, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudFog,
  Wind
} from 'lucide-react';

interface WeatherIconProps {
  conditionCode?: number;
  condition?: string;
  isDay?: boolean;
  size?: number;
  className?: string;
  isHovered?: boolean;
  color?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  conditionCode = 0,
  condition = '',
  isDay = true,
  size = 16,
  className = '',
  isHovered = false,
  color,
}) => {
  const normCondition = condition.toLowerCase();

  // Determine icon component and semantic color palette
  let IconComponent = isDay ? Sun : Moon;
  let defaultColor = isDay ? '#f59e0b' : '#cbd5e1'; // Warm amber or silvery moonlight

  if (conditionCode === 0 || normCondition.includes('clear')) {
    IconComponent = isDay ? Sun : Moon;
    defaultColor = isDay ? '#fbbf24' : '#e2e8f0';
  } else if (conditionCode === 1 || conditionCode === 2 || normCondition.includes('partly')) {
    IconComponent = isDay ? CloudSun : CloudMoon;
    defaultColor = isDay ? '#f59e0b' : '#94a3b8';
  } else if (conditionCode === 3 || normCondition.includes('overcast') || normCondition.includes('cloudy')) {
    IconComponent = Cloud;
    defaultColor = '#cbd5e1';
  } else if ((conditionCode >= 51 && conditionCode <= 67) || (conditionCode >= 80 && conditionCode <= 82) || normCondition.includes('rain') || normCondition.includes('drizzle') || normCondition.includes('shower')) {
    IconComponent = CloudRain;
    defaultColor = '#38bdf8';
  } else if ((conditionCode >= 71 && conditionCode <= 77) || (conditionCode >= 85 && conditionCode <= 86) || normCondition.includes('snow')) {
    IconComponent = CloudSnow;
    defaultColor = '#e0f2fe';
  } else if ((conditionCode >= 95 && conditionCode <= 99) || normCondition.includes('thunder')) {
    IconComponent = CloudLightning;
    defaultColor = '#c084fc';
  } else if ((conditionCode >= 45 && conditionCode <= 48) || normCondition.includes('fog')) {
    IconComponent = CloudFog;
    defaultColor = '#94a3b8';
  }

  const iconColor = color || defaultColor;

  return (
    <motion.div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      animate={isHovered ? {
        scale: 1.08,
        rotate: isDay && IconComponent === Sun ? 12 : 0,
        y: IconComponent === CloudSun || IconComponent === Cloud ? -1.5 : 0,
      } : {
        scale: 1,
        rotate: 0,
        y: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <IconComponent 
        size={size} 
        color={iconColor} 
        strokeWidth={2.2} 
        className="drop-shadow-xs" 
      />
    </motion.div>
  );
};

export default WeatherIcon;
