import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  ExternalLink,
  Sliders
} from 'lucide-react';
import { useSystemCalendar } from '../../../services/systemBridge';
import { shellFlyoutMotion } from './shellMotion';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from './LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../adaptive';

interface WindowsCalendarShellSurfaceProps {
  onClose?: () => void;
  onOpenCalendarApp?: () => void;
  onOpenSettings?: () => void;
}

export const WindowsCalendarShellSurface: React.FC<WindowsCalendarShellSurfaceProps> = ({
  onClose,
  onOpenCalendarApp,
  onOpenSettings,
}) => {
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;
  const textAccent = tokens.typography.textAccent;
  const {
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
  } = useSystemCalendar();

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isAgendaCollapsed, setIsAgendaCollapsed] = useState<boolean>(false);
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00 PM');

  // Real-time ticking clock for top header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentYear = currentViewDate.getFullYear();
  const currentMonth = currentViewDate.getMonth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Calendar days generator
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        monthOffset: -1,
        date: new Date(currentYear, currentMonth - 1, prevMonthDays - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        monthOffset: 0,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    // Next month days to complete 6-row or 5-row grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        monthOffset: 1,
        date: new Date(currentYear, currentMonth + 1, i),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => isSameDay(d, new Date());
  const isSelected = (d: Date) => isSameDay(d, selectedDate);

  const formattedDigitalTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedFullDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const selectedDayHeader = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    addCalendarEvent({
      title: newEventTitle.trim(),
      time: newEventTime,
      category: 'work',
      color: '#0078d4',
    });
    setNewEventTitle('');
    setIsAddingEvent(false);
  };

  return (
    <LiquidGlassSurface
      variant="flyout"
      {...shellFlyoutMotion}
      className="w-[350px] rounded-xl p-3.5 space-y-3 font-sans text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Large Windows Clock & Date Header */}
      <div className="px-1 pb-2 border-b border-white/[0.09] flex flex-col">
        <div className="text-2xl font-light tracking-tight text-white font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {formattedDigitalTime}
        </div>
        <div className="text-xs font-normal tracking-tight" style={{ color: textAccent }}>
          {formattedFullDate}
        </div>
      </div>

      {/* 2. Month & Year Selector Navigation */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-white tracking-wide">
          {months[currentMonth]} {currentYear}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2 py-0.5 text-[10.5px] font-medium text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] rounded transition cursor-pointer border border-white/[0.09]"
            title="Today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-medium text-white/45 uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* 4. Calendar Matrix */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, idx) => {
          const selected = isSelected(item.date);
          const todayMatch = isToday(item.date);
          const isCurrentMonth = item.monthOffset === 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedDate(item.date);
                if (item.monthOffset !== 0) {
                  setCurrentViewDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
                }
              }}
              style={
                selected
                  ? {
                      background: tokens.quickAction.tileActiveGradient,
                      borderColor: tokens.quickAction.tileActiveBorder,
                      boxShadow: `0 0 10px ${tokens.accent.activeAccentSoft}`,
                    }
                  : todayMatch
                  ? {
                      borderColor: activeAccent,
                    }
                  : undefined
              }
              className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center text-xs font-normal transition-all cursor-pointer relative ${
                selected
                  ? 'text-white font-semibold'
                  : todayMatch
                  ? 'text-white font-semibold bg-white/[0.08] border'
                  : isCurrentMonth
                  ? 'text-white/90 hover:bg-white/10'
                  : 'text-white/25 hover:text-white/45'
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* 5. Collapsible Agenda Section */}
      <div className="pt-2 border-t border-white/[0.09] space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" style={{ color: textAccent }} />
            <span className="text-[11px] font-medium text-white/85">{selectedDayHeader}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Add event"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAgendaCollapsed(!isAgendaCollapsed)}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title={isAgendaCollapsed ? 'Expand agenda' : 'Collapse agenda'}
            >
              {isAgendaCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {isAddingEvent && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateEvent}
              className="p-2.5 bg-black/40 border border-white/[0.12] rounded-lg space-y-2 overflow-hidden backdrop-blur-md"
            >
              <input
                type="text"
                autoFocus
                placeholder="Add event name..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.15] rounded px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
              />
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Time (e.g. 2:00 PM)"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-1/2 bg-white/[0.08] border border-white/[0.15] rounded px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-[#0078d4] hover:bg-[#0063B1] text-white rounded text-xs font-medium cursor-pointer shadow-xs transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Event List */}
        {!isAgendaCollapsed && (
          <div className="space-y-1 max-h-[110px] overflow-y-auto pr-0.5 custom-scrollbar">
            {calendarEvents.length > 0 ? (
              calendarEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border-l-2 border-[#0078d4] transition group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate">{event.title}</div>
                    <div className="text-[10px] text-white/50 truncate flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-white/40" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCalendarEvent(event.id)}
                    className="w-5 h-5 rounded hover:bg-white/10 text-white/40 hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-white/45 text-[11px]">
                No events scheduled for this day
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Settings & Calendar App Links */}
      <div className="pt-1 border-t border-white/[0.09] flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => {
            onClose?.();
            onOpenCalendarApp?.();
          }}
          className="text-[11px] text-[#60cdff] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Open Calendar</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSettings?.();
            onClose?.();
          }}
          className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Sliders className="w-3 h-3" />
          <span>Date & time settings</span>
        </button>
      </div>
    </LiquidGlassSurface>
  );
};

export default WindowsCalendarShellSurface;

