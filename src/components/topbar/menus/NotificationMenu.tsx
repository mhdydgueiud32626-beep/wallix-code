import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings, 
  Wifi, 
  Bluetooth, 
  Moon, 
  SunMedium, 
  Sun, 
  Battery, 
  Cast, 
  Share2, 
  Smartphone, 
  Plane, 
  MapPin, 
  Monitor, 
  Radio,
  Sliders,
  Send,
  ShieldCheck,
  MessageSquare,
  CheckSquare,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  useWindowsNotifications, 
  useQuickSettings, 
  usePowerStatus, 
  useNetworkStatus,
  FocusAssistMode,
  ProjectDisplayMode
} from '../../../services/systemBridge';

interface NotificationMenuProps {
  onClose?: () => void;
  onOpenApp?: (appId: string) => void;
  onOpenSettings?: () => void;
  hasUnreadNotifications?: boolean;
  setHasUnreadNotifications?: (hasUnread: boolean | ((prev: boolean) => boolean)) => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ 
  onClose, 
  onOpenApp,
  onOpenSettings
}) => {
  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    markNotificationAsRead,
    sendNotificationReply,
  } = useWindowsNotifications();

  const {
    quickSettings,
    toggleQuickSetting,
    setScreenBrightness,
    setFocusAssist,
    setProjectMode,
  } = useQuickSettings();

  const {
    power,
    batterySaverActive,
    setBatterySaver,
  } = usePowerStatus();

  const {
    enabled: wifiEnabled,
    currentSsid,
    setWifiEnabled,
  } = useNetworkStatus();

  // Quick action grid expand/collapse state
  const [isExpanded, setIsExpanded] = useState(true);

  // State for mock toggles that don't have dedicated OS bridge state
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [connectActive, setConnectActive] = useState(false);

  // Active reply state for toast notifications
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const cycleFocusAssist = () => {
    const modes: FocusAssistMode[] = ['off', 'priority_only', 'alarms_only'];
    const nextIndex = (modes.indexOf(quickSettings.focusAssist) + 1) % modes.length;
    setFocusAssist(modes[nextIndex]);
  };

  const getFocusAssistLabel = (mode: FocusAssistMode) => {
    switch (mode) {
      case 'priority_only': return 'Priority only';
      case 'alarms_only': return 'Alarms only';
      default: return 'Off';
    }
  };

  const cycleProjectMode = () => {
    const modes: ProjectDisplayMode[] = ['pc_screen_only', 'duplicate', 'extend', 'second_screen_only'];
    const nextIndex = (modes.indexOf(quickSettings.projectMode) + 1) % modes.length;
    setProjectMode(modes[nextIndex]);
  };

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    sendNotificationReply(id, replyText);
    setReplyText('');
    setReplyingId(null);
  };

  const handleOpenAllSettings = () => {
    onOpenSettings?.();
    onClose?.();
  };

  return (
    <>
      {/* Backdrop for outside click dismissal */}
      <div 
        className="fixed inset-0 z-[99990] bg-black/25 backdrop-blur-[1px] pointer-events-auto"
        onClick={onClose}
      />

      {/* Windows 10 Action Center Right-Docked Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 35 }}
        className="fixed top-0 right-0 h-screen w-[380px] sm:w-[410px] bg-[#161616]/96 dark:bg-[#101010]/98 backdrop-blur-3xl border-l border-white/10 shadow-[-15px_0_40px_rgba(0,0,0,0.7)] text-white select-none z-[99999] pointer-events-auto flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================================= */}
        {/* 1. TOP HEADER: Action center Title & Clear all notifications           */}
        {/* ======================================================================= */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-semibold tracking-normal text-white">Action center</h2>
            <button
              type="button"
              onClick={handleOpenAllSettings}
              className="text-[11px] text-[#0078D7] hover:text-[#2b88d8] hover:underline transition cursor-pointer"
            >
              Manage notifications
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications()}
              className="text-[11px] font-normal text-[#0078D7] hover:text-[#2b88d8] hover:underline transition cursor-pointer"
            >
              Clear all notifications
            </button>
          )}
        </div>

        {/* ======================================================================= */}
        {/* 2. NOTIFICATIONS STREAM (Flex-1, Scrollable Windows Toast Cards)         */}
        {/* ======================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence initial={false}>
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const isReplying = replyingId === notif.id;

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 25, transition: { duration: 0.15 } }}
                    className="bg-[#1f1f1f]/95 hover:bg-[#252525] border border-white/10 hover:border-white/20 p-3.5 rounded-none shadow-sm transition-all duration-150 group relative"
                  >
                    {/* Header Row: Windows App Icon + Name + Timestamp + Dismiss [X] */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {notif.appIconCategory === 'messages' && <MessageSquare className="w-3.5 h-3.5 text-[#0078D7]" />}
                          {notif.appIconCategory === 'reminders' && <CheckSquare className="w-3.5 h-3.5 text-[#0078D7]" />}
                          {notif.appIconCategory === 'calendar' && <CalendarIcon className="w-3.5 h-3.5 text-[#0078D7]" />}
                          {notif.appIconCategory === 'security' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                          {!['messages', 'reminders', 'calendar', 'security'].includes(notif.appIconCategory) && (
                            <div className="w-3 h-3 bg-[#0078D7] rounded-xs" />
                          )}
                        </div>
                        <span className="text-[11.5px] font-semibold text-white/90 truncate">{notif.appName}</span>
                        <span className="text-[10px] text-white/40 shrink-0">{notif.timestamp}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dismissNotification(notif.id)}
                        className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Toast Title & Message Content */}
                    <div className="text-xs font-semibold text-white mb-0.5">{notif.title}</div>
                    <div className="text-[11.5px] text-white/75 leading-relaxed">{notif.message}</div>

                    {/* Actionable buttons */}
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-2">
                      {notif.appIconCategory === 'messages' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(isReplying ? null : notif.id);
                            markNotificationAsRead(notif.id);
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-normal transition cursor-pointer border border-white/10"
                        >
                          {isReplying ? 'Cancel' : 'Reply'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose?.();
                          onOpenApp?.(notif.appId);
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-[11px] font-normal transition cursor-pointer border border-white/5"
                      >
                        Open {notif.appName}
                      </button>
                    </div>

                    {/* Inline Reply Form */}
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
                          placeholder="Type a Windows message reply..."
                          className="flex-1 bg-black/60 border border-[#0078D7] px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(notif.id)}
                          className="p-1.5 bg-[#0078D7] hover:bg-[#0063B1] text-white transition cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-1">
                <div className="text-xs font-normal text-white/50">No new notifications</div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================================================================= */}
        {/* 3. QUICK ACTIONS PINNED BOTTOM PANEL (4-Column Native Grid)            */}
        {/* ======================================================================= */}
        <div className="p-3 bg-[#181818] border-t border-white/10 shrink-0 space-y-2.5">
          {/* Collapse / Expand Link */}
          <div className="flex items-center justify-between px-0.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11.5px] text-white/70 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {/* 4-Column Quick Actions Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* 1. Location */}
            <button
              type="button"
              onClick={() => setLocationEnabled(!locationEnabled)}
              className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                locationEnabled 
                  ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight font-normal line-clamp-2">
                Location
              </span>
            </button>

            {/* 2. Battery Saver */}
            <button
              type="button"
              onClick={() => setBatterySaver(!batterySaverActive)}
              className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                batterySaverActive 
                  ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
              }`}
            >
              <Battery className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight font-normal line-clamp-2">
                Battery saver
              </span>
            </button>

            {/* 3. Bluetooth */}
            <button
              type="button"
              onClick={() => toggleQuickSetting('bluetooth')}
              className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                quickSettings.bluetooth 
                  ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
              }`}
            >
              <Bluetooth className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight font-normal line-clamp-2">
                Bluetooth
              </span>
            </button>

            {/* 4. Night Light */}
            <button
              type="button"
              onClick={() => toggleQuickSetting('nightLight')}
              className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                quickSettings.nightLight 
                  ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
              }`}
            >
              <SunMedium className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight font-normal line-clamp-2">
                Night light
              </span>
            </button>

            {/* Expanded Rows (Row 2 & 3) */}
            {isExpanded && (
              <>
                {/* 5. Mobile Hotspot */}
                <button
                  type="button"
                  onClick={() => toggleQuickSetting('mobileHotspot')}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    quickSettings.mobileHotspot 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    Mobile hotspot
                  </span>
                </button>

                {/* 6. Airplane Mode */}
                <button
                  type="button"
                  onClick={() => toggleQuickSetting('airplaneMode')}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    quickSettings.airplaneMode 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Plane className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    Airplane mode
                  </span>
                </button>

                {/* 7. Nearby Sharing */}
                <button
                  type="button"
                  onClick={() => toggleQuickSetting('nearbySharing')}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    quickSettings.nearbySharing 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    Nearby sharing
                  </span>
                </button>

                {/* 8. All Settings */}
                <button
                  type="button"
                  onClick={handleOpenAllSettings}
                  className="h-15 p-1 flex flex-col items-center justify-center gap-1 bg-white/10 hover:bg-white/15 text-white/80 border border-white/5 transition cursor-pointer text-center"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    All settings
                  </span>
                </button>

                {/* 9. Network / Wi-Fi */}
                <button
                  type="button"
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    wifiEnabled 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Wifi className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    {wifiEnabled ? (currentSsid || 'Network') : 'Network'}
                  </span>
                </button>

                {/* 10. Connect */}
                <button
                  type="button"
                  onClick={() => setConnectActive(!connectActive)}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    connectActive 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Cast className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    Connect
                  </span>
                </button>

                {/* 11. Project */}
                <button
                  type="button"
                  onClick={cycleProjectMode}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    quickSettings.projectMode !== 'pc_screen_only' 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    Project
                  </span>
                </button>

                {/* 12. Focus Assist */}
                <button
                  type="button"
                  onClick={cycleFocusAssist}
                  className={`h-15 p-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    quickSettings.focusAssist !== 'off' 
                      ? 'bg-[#0078D7] text-white border border-[#0090FF]' 
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/5'
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight font-normal line-clamp-2">
                    {getFocusAssistLabel(quickSettings.focusAssist)}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* ======================================================================= */}
          {/* 4. WINDOWS DISPLAY BRIGHTNESS HORIZONTAL SLIDER                        */}
          {/* ======================================================================= */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-3 px-1">
            <Sun className="w-4 h-4 text-white/70 shrink-0" />
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="10"
                max="100"
                value={quickSettings.screenBrightness}
                onChange={(e) => setScreenBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 appearance-none cursor-pointer accent-[#0078D7]"
              />
            </div>
            <span className="text-[11px] font-mono text-white/70 w-8 text-right shrink-0">
              {quickSettings.screenBrightness}%
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default NotificationMenu;
