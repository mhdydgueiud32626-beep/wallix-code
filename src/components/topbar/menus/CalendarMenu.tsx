import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useSystemCalendar, CalendarEventItem } from '../../../services/systemBridge';

interface CalendarMenuProps {
  onClose?: () => void;
  onOpenCalendarApp?: () => void;
}

export const CalendarMenu: React.FC<CalendarMenuProps> = ({ 
  onClose, 
  onOpenCalendarApp 
}) => {
  const {
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
  } = useSystemCalendar();

  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Generate real calendar days for current month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month filler days
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

    // Next month filler days to complete grid cells
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

  const isToday = (d: Date) => isSameDay(d, today);
  const isSelected = (d: Date) => isSameDay(d, selectedDate);

  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addCalendarEvent({
      title: newTitle.trim(),
      time: newTime,
      category: 'work',
      color: '#38bdf8',
    });
    setNewTitle('');
    setIsAddingEvent(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="w-[330px] bg-slate-900/85 dark:bg-black/85 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-3.5 text-white select-none z-50 pointer-events-auto space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Month, Year & Navigation Controls */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {months[currentMonth]} <span className="text-white/60 font-normal text-xs">{currentYear}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2 py-0.5 text-[10.5px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 rounded-md transition cursor-pointer border border-white/10"
            title="Jump to Today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Days of Week */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-semibold text-white/45 tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* 3. Calendar Grid */}
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
                  setCurrentDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
                }
              }}
              className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150 cursor-pointer relative ${
                selected
                  ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.85)] scale-105 z-10'
                  : todayMatch
                  ? 'bg-white/20 text-white font-semibold border border-blue-400/60 shadow-xs'
                  : isCurrentMonth
                  ? 'text-white/90 hover:bg-white/15'
                  : 'text-white/25 hover:text-white/40'
              }`}
            >
              {item.day}
              {todayMatch && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Dynamic Windows Agenda Card for Selected Date */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/12 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white">Agenda • {selectedDateLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition cursor-pointer"
            title="Add Event"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Add Event Inline Form */}
        <AnimatePresence>
          {isAddingEvent && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateEvent}
              className="p-2 bg-black/40 border border-white/10 rounded-lg space-y-2"
            >
              <input
                type="text"
                autoFocus
                placeholder="Event title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Time (e.g. 11:00 AM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-1/2 bg-white/10 border border-white/15 rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Events List */}
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
          {calendarEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border-l-2 border-cyan-400 transition cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-white group-hover:text-cyan-200 transition-colors truncate">
                  {event.title}
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  {event.time} {event.location ? `• ${event.location}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCalendarEvent(event.id);
                }}
                className="w-5 h-5 rounded hover:bg-white/10 text-white/40 hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Action button */}
        {onOpenCalendarApp && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenCalendarApp();
            }}
            className="w-full mt-1 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Open Windows Calendar App</span>
            <ExternalLink className="w-3 h-3 text-white/60" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CalendarMenu;
