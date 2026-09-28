import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NotificationItem, useWindowsNotifications } from '../../../services/systemBridge';

export interface WindowsNotificationGroupProps {
  appName: string;
  appIconCategory: string;
  notifications: NotificationItem[];
  onOpenApp?: (appId: string) => void;
}

export const WindowsNotificationGroup: React.FC<WindowsNotificationGroupProps> = ({
  appName,
  appIconCategory,
  notifications,
  onOpenApp,
}) => {
  const { 
    dismissNotification, 
    markNotificationAsRead, 
    sendNotificationReply 
  } = useWindowsNotifications();

  const [isGroupCollapsed, setIsGroupCollapsed] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const renderAppIcon = () => {
    switch (appIconCategory) {
      case 'security':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'messages':
        return <MessageSquare className="w-3.5 h-3.5 text-[#60cdff]" />;
      case 'reminders':
        return <CheckSquare className="w-3.5 h-3.5 text-[#60cdff]" />;
      case 'calendar':
        return <CalendarIcon className="w-3.5 h-3.5 text-[#60cdff]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#60cdff]" />;
    }
  };

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    sendNotificationReply(id, replyText);
    setReplyText('');
    setReplyingId(null);
  };

  const handleDismissAllInGroup = () => {
    notifications.forEach((n) => dismissNotification(n.id));
  };

  return (
    <div className="w-full space-y-1.5 font-sans select-none mb-3">
      {/* Group Header */}
      <div className="flex items-center justify-between px-1 py-1 text-white/90">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {renderAppIcon()}
          </div>
          <span className="text-[12px] font-semibold tracking-tight truncate">{appName}</span>
          <span className="text-[10px] text-white/50">({notifications.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse Group Toggle */}
          <button
            type="button"
            onClick={() => setIsGroupCollapsed(!isGroupCollapsed)}
            className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
            title={isGroupCollapsed ? 'Expand group' : 'Collapse group'}
          >
            {isGroupCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Dismiss Entire Group Button */}
          <button
            type="button"
            onClick={handleDismissAllInGroup}
            className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
            title={`Clear all from ${appName}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Group Notifications List */}
      {!isGroupCollapsed && (
        <div className="space-y-1.5 pl-0.5">
          {notifications.map((notif) => {
            const isReplying = replyingId === notif.id;

            return (
              <div
                key={notif.id}
                className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] p-3 text-white rounded-lg shadow-xs transition-all group relative backdrop-blur-md"
              >
                {/* Header Row: Title & Timestamp + Individual Dismiss */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-white leading-snug">
                      {notif.title}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {notif.timestamp}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissNotification(notif.id)}
                    className="w-4 h-4 flex items-center justify-center text-white/30 hover:text-white transition-colors cursor-pointer shrink-0 mt-0.5"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Body Message */}
                <div className="text-[11.5px] text-white/80 leading-relaxed font-normal">
                  {notif.message}
                </div>

                {/* Actions (Reply / Open App) */}
                <div className="mt-2.5 pt-1.5 border-t border-white/[0.06] flex items-center gap-2">
                  {notif.appIconCategory === 'messages' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingId(isReplying ? null : notif.id);
                        markNotificationAsRead(notif.id);
                      }}
                      className="px-2.5 py-0.5 bg-white/[0.08] hover:bg-white/[0.15] text-white/90 text-[11px] font-normal transition-colors border border-white/[0.1] rounded cursor-pointer"
                    >
                      {isReplying ? 'Cancel' : 'Reply'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenApp?.(notif.appId)}
                    className="px-2.5 py-0.5 bg-transparent hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-normal transition-colors border border-transparent hover:border-white/[0.1] rounded cursor-pointer"
                  >
                    Open
                  </button>
                </div>

                {/* Inline Windows Reply Form */}
                {isReplying && (
                  <div className="mt-2 flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply(notif.id);
                      }}
                      placeholder="Type a reply..."
                      className="flex-1 bg-black/40 border border-[#0078D7] px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReply(notif.id)}
                      className="p-1.5 bg-[#0078D7] hover:bg-[#0063B1] text-white rounded transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WindowsNotificationGroup;

