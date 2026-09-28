import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';
import { WALLIX_GLASS_TOKENS } from '../../config/wallixGlassTokens';

export type ClockMode = 'digital' | 'analog';

interface ClockWidgetProps {
  is24Hour?: boolean;
  initialMode?: ClockMode;
  onToggleFormat?: () => void;
  depthInterleaved?: boolean;
  compact?: boolean;
  className?: string;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  is24Hour = false,
  initialMode = 'digital',
  onToggleFormat,
  depthInterleaved = false,
  compact = false,
  className = '',
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [use24Hr, setUse24Hr] = useState<boolean>(is24Hour);
  const [mode, setMode] = useState<ClockMode>(initialMode);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawHours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  const hours = use24Hr 
    ? rawHours.toString().padStart(2, '0') 
    : (rawHours % 12 || 12).toString().padStart(2, '0');
  const minutes = rawMinutes.toString().padStart(2, '0');
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[time.getDay()];
  const monthName = months[time.getMonth()];
  const dateStr = `${dayName}, ${monthName} ${time.getDate()}`;

  // Analog Hand Angles
  const secondAngle = (rawSeconds / 60) * 360;
  const minuteAngle = ((rawMinutes + rawSeconds / 60) / 60) * 360;
  const hourAngle = (((rawHours % 12) + rawMinutes / 60) / 12) * 360;

  if (compact) {
    return (
      <div 
        id="wallix-clock-widget"
        className={`select-none p-3.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-lg shadow-black/40 text-white transition-all duration-300 w-full flex flex-col justify-between group ${className}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-white/50 uppercase select-none">
            CLOCK
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === 'digital' ? 'analog' : 'digital');
              }}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
              title="Toggle Analog / Digital"
            >
              {mode === 'digital' ? 'Dial' : 'Digital'}
            </button>
            {mode === 'digital' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUse24Hr(!use24Hr);
                  if (onToggleFormat) onToggleFormat();
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
              >
                {use24Hr ? '24H' : '12H'}
              </button>
            )}
          </div>
        </div>

        {/* Main Clock Content */}
        {mode === 'analog' ? (
          <div className="my-auto flex flex-col items-center justify-center py-1">
            <div className="relative w-20 h-20 rounded-full border border-white/20 bg-white/5 shadow-inner flex items-center justify-center">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className={`absolute w-0.5 ${deg % 90 === 0 ? 'h-1.5 bg-white/80' : 'h-0.5 bg-white/30'}`}
                  style={{
                    transform: `rotate(${deg}deg) translateY(-34px)`,
                    transformOrigin: 'bottom center',
                  }}
                />
              ))}
              {/* Hands */}
              <div
                className="absolute w-0.5 h-5 bg-white rounded-full shadow-md"
                style={{
                  transform: `rotate(${hourAngle}deg) translateY(-10px)`,
                  transformOrigin: 'bottom center',
                }}
              />
              <div
                className="absolute w-0.5 h-7 bg-white/90 rounded-full shadow-md"
                style={{
                  transform: `rotate(${minuteAngle}deg) translateY(-14px)`,
                  transformOrigin: 'bottom center',
                }}
              />
              <div
                className="absolute w-0.5 h-8 bg-amber-400 shadow-sm"
                style={{
                  transform: `rotate(${secondAngle}deg) translateY(-16px)`,
                  transformOrigin: 'bottom center',
                }}
              />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white border border-black/30 z-40" />
            </div>
          </div>
        ) : (
          <div className="my-1">
            {/* Clean compact time typography */}
            <div className="flex items-baseline font-semibold tracking-tight">
              <span className="text-3xl font-semibold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                {hours}:{minutes}
              </span>
              {!use24Hr && (
                <span className="text-xs font-medium text-white/70 ml-1.5 tracking-normal">
                  {ampm}
                </span>
              )}
            </div>
            {/* Sub-text Date */}
            <div className="text-xs text-white/70 mt-0.5">
              {dateStr}
            </div>
          </div>
        )}

        {/* Divider & Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3 h-3 text-white/60" />
            <span className="text-xs text-white/70">Local Time</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="wallix-clock-widget"
      className={`select-none p-5 sm:p-6 text-white transition-all duration-300 w-full h-full flex flex-col justify-between group ${
        WALLIX_GLASS_TOKENS.card
      } ${
        depthInterleaved ? 'bg-black/20' : ''
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <span className={WALLIX_GLASS_TOKENS.subtleHeader}>
          CLOCK
        </span>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode(mode === 'digital' ? 'analog' : 'digital');
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
            title="Toggle Analog / Digital"
          >
            {mode === 'digital' ? 'Dial' : 'Digital'}
          </button>
          {mode === 'digital' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUse24Hr(!use24Hr);
                if (onToggleFormat) onToggleFormat();
              }}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
            >
              {use24Hr ? '24H' : '12H'}
            </button>
          )}
        </div>
      </div>

      {/* Main Clock Content */}
      {mode === 'analog' ? (
        <div className="my-auto flex flex-col items-center justify-center py-2">
          <div className="relative w-28 h-28 rounded-full border border-white/20 bg-white/5 shadow-inner flex items-center justify-center">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className={`absolute w-0.5 ${deg % 90 === 0 ? 'h-2 bg-white/80' : 'h-1 bg-white/30'}`}
                style={{
                  transform: `rotate(${deg}deg) translateY(-48px)`,
                  transformOrigin: 'bottom center',
                }}
              />
            ))}
            {/* Hands */}
            <div
              className="absolute w-1 h-7 bg-white rounded-full shadow-md"
              style={{
                transform: `rotate(${hourAngle}deg) translateY(-14px)`,
                transformOrigin: 'bottom center',
              }}
            />
            <div
              className="absolute w-0.5 h-10 bg-white/90 rounded-full shadow-md"
              style={{
                transform: `rotate(${minuteAngle}deg) translateY(-20px)`,
                transformOrigin: 'bottom center',
              }}
            />
            <div
              className="absolute w-0.5 h-11 bg-amber-400 shadow-sm"
              style={{
                transform: `rotate(${secondAngle}deg) translateY(-22px)`,
                transformOrigin: 'bottom center',
              }}
            />
            <div className="absolute w-2 h-2 rounded-full bg-white border border-black/30 z-40" />
          </div>
        </div>
      ) : (
        <div className="my-auto py-1">
          {/* Large crisp elegant time */}
          <div className="flex items-baseline font-light tracking-tight">
            <span className="text-5xl sm:text-6xl lg:text-7xl font-extralight text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {hours}:{minutes}
            </span>
            {!use24Hr && (
              <span className="text-2xl sm:text-3xl font-light text-white/90 ml-2 tracking-normal">
                {ampm}
              </span>
            )}
          </div>
          {/* Subtitle Date */}
          <div className="text-sm sm:text-base font-normal text-white/90 mt-1.5 drop-shadow-sm">
            {dateStr}
          </div>
        </div>
      )}

      {/* Divider & Footer */}
      <div className={`pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80`}>
        <div className="flex items-center gap-1.5">
          <ClockIcon className="w-3.5 h-3.5 text-white/70" />
          <span className="font-normal text-white/80">Local Time</span>
        </div>
      </div>
    </div>
  );
};

