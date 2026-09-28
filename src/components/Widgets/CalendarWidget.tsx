import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WALLIX_GLASS_TOKENS } from '../../config/wallixGlassTokens';

interface CalendarWidgetProps {
  compact?: boolean;
  className?: string;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  compact = false,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 22)); // Sept 2026 default
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  if (compact) {
    return (
      <div 
        id="wallix-calendar-widget"
        className={`select-none p-3.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-lg shadow-black/40 text-white transition-all duration-300 w-full flex flex-col justify-between group ${className}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-white/50 uppercase select-none">
            CALENDAR
          </span>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between my-0.5 px-0.5">
          <button
            onClick={handlePrevMonth}
            className="p-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <span className="text-[11px] font-semibold tracking-wider text-white/90 uppercase">
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-white/50 my-0.5">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center text-xs my-0.5">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-5 w-5 mx-auto" />;
            }

            // September 22 highlight or actual today date
            const isHighlighted = day === 22;

            return (
              <div
                key={`day-${day}`}
                className={`relative h-5 w-5 mx-auto flex items-center justify-center rounded-full text-[11px] transition-all ${
                  isHighlighted
                    ? 'bg-blue-500 text-white font-bold shadow-[0_0_8px_rgba(59,130,246,0.85)] ring-1 ring-white/50'
                    : 'hover:bg-white/10 text-white/80 font-normal'
                }`}
              >
                <span>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div 
      id="wallix-calendar-widget"
      className={`select-none p-5 text-white transition-all duration-300 w-full h-full flex flex-col justify-between group ${
        WALLIX_GLASS_TOKENS.card
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className={WALLIX_GLASS_TOKENS.subtleHeader}>
          CALENDAR
        </span>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between my-1 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
          title="Previous month"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-semibold tracking-wider text-white/90 uppercase">
          {monthNames[month]} {year}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
          title="Next month"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-white/50 my-1">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center text-xs my-auto">
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-6 w-6 mx-auto" />;
          }

          // September 22 highlight or actual today date
          const isHighlighted = day === 22;

          return (
            <div
              key={`day-${day}`}
              className={`relative h-6.5 w-6.5 mx-auto flex items-center justify-center rounded-full text-xs transition-all ${
                isHighlighted
                  ? 'bg-blue-500 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.85)] ring-1 ring-white/50'
                  : 'hover:bg-white/10 text-white/80 font-normal'
              }`}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

