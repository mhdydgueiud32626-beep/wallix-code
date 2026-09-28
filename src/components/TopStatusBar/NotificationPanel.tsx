import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, MessageSquare, Globe, Sparkles } from 'lucide-react';
import { STATUS_GLASS_TOKENS } from './statusTokens';
import { StatusNotification } from './statusTypes';

interface NotificationPanelProps {
  onClose?: () => void;
}

const INITIAL_NOTIFICATIONS: StatusNotification[] = [
  {
    id: '1',
    appName: 'Chrome',
    appType: 'chrome',
    message: 'Download completed.',
    timeAgo: '5 min.',
    isRead: false,
  },
  {
    id: '2',
    appName: 'Messages',
    appType: 'messages',
    message: 'New message received.',
    timeAgo: '12 min.',
    isRead: false,
  },
  {
    id: '3',
    appName: 'WALLIX',
    appType: 'wallix',
    message: 'Your wallpaper has been updated.',
    timeAgo: 'Just now.',
    isRead: false,
  },
];

export const NotificationPanel: React.FC<NotificationPanelProps> = () => {
  const [notifications, setNotifications] = useState<StatusNotification[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClear = () => {
    setNotifications([]);
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'chrome':
        return (
          <div className="w-6 h-6 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-[10px] border border-red-500/30">
            <Globe className="w-3.5 h-3.5" />
          </div>
        );
      case 'messages':
        return (
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px] border border-emerald-500/30">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        );
      case 'wallix':
      default:
        return (
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-[10px] border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-3 select-none box-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Notifications</h3>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-2 py-0.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-0.5 rounded text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Section: Today */}
      <div className="space-y-2">
        <span className={STATUS_GLASS_TOKENS.sectionHeader}>Today</span>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  notif.isRead
                    ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.04]'
                    : 'bg-white/80 dark:bg-slate-800/80 border-black/[0.06] dark:border-white/[0.1] shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {getAppIcon(notif.appType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {notif.appName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {notif.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
              <Bell className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              <span>No notifications for today</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
