import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  WifiIcon, 
  WifiOffIcon, 
  WifiCogIcon,
  Volume2Icon, 
  Volume1Icon, 
  VolumeXIcon,
  BatteryIcon,
  BatteryChargingIcon,
  SlidersHorizontalIcon,
  SearchIcon,
  CalendarIcon,
  BellIcon
} from '@animateicons/react/lucide';
import { 
  WindowsNetworkShellSurface,
  WindowsAudioShellSurface,
  WindowsPowerShellSurface,
  WindowsQuickSettingsShellSurface,
  WindowsCalendarShellSurface,
  WindowsSearchShellSurface,
  WindowsActionCenterShellSurface
} from '../../modules/desktop/shell';
import { 
  useNetworkStatus, 
  useAudioOutput, 
  usePowerStatus, 
  useWindowsNotifications 
} from '../../services/systemBridge';
import { WeatherFlyout, WeatherIcon } from './weather';
import { useWeather } from '../../services/weather';

export type ActiveMenuType = 'wifi' | 'sound' | 'battery' | 'toggles' | 'datetime' | 'notifications' | 'weather' | null;

interface TopBarProps {
  platformTitle?: string;
  className?: string;
  onOpenSettings?: () => void;
  onOpenApp?: (appId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  className = '',
  onOpenSettings,
  onOpenApp,
}) => {
  const [activeMenu, setActiveMenu] = useState<ActiveMenuType>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Weather Provider integration
  const weather = useWeather();
  const displayTemp = weather.unit === 'fahrenheit' 
    ? Math.round((weather.temperature * 9) / 5 + 32)
    : weather.temperature;
  const tempUnitSymbol = weather.unit === 'fahrenheit' ? '°F' : '°C';
  
  // Connect to OS Presentation Bridge hooks
  const { 
    enabled: wifiEnabled, 
    status: networkStatus, 
    currentSsid, 
    setWifiEnabled 
  } = useNetworkStatus();

  const { 
    volume, 
    isMuted, 
    setVolume, 
    setIsMuted, 
    toggleMute 
  } = useAudioOutput();

  const { 
    batteryLevel, 
    isCharging, 
    setBatteryLevel, 
    setIsCharging 
  } = usePowerStatus();

  const { 
    unreadNotificationCount, 
    hasUnread 
  } = useWindowsNotifications();

  // Animation Refs
  const wifiRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const batteryRef = useRef<any>(null);
  const slidersRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const calendarRef = useRef<any>(null);
  const bellRef = useRef<any>(null);

  // Spotlight State
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);

  // Determine current wifi state for icons
  const wifiState = !wifiEnabled || networkStatus === 'disconnected' 
    ? 'disconnected' 
    : networkStatus === 'connecting' || networkStatus === 'configuring'
    ? 'configuring'
    : 'connected';

  // Wi-Fi Animation Triggers
  const playWifiAnimation = () => {
    if (wifiRef.current) {
      try {
        wifiRef.current.stopAnimation?.();
        wifiRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopWifiAnimation = () => {
    if (wifiRef.current) {
      try {
        wifiRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Volume Animation Triggers
  const playVolumeAnimation = () => {
    if (volumeRef.current) {
      try {
        volumeRef.current.stopAnimation?.();
        volumeRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopVolumeAnimation = () => {
    if (volumeRef.current) {
      try {
        volumeRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Battery Animation Triggers
  const playBatteryAnimation = () => {
    if (batteryRef.current) {
      try {
        batteryRef.current.stopAnimation?.();
        batteryRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopBatteryAnimation = () => {
    if (batteryRef.current) {
      try {
        batteryRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Sliders Animation Triggers
  const playSlidersAnimation = () => {
    if (slidersRef.current) {
      try {
        slidersRef.current.stopAnimation?.();
        slidersRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopSlidersAnimation = () => {
    if (slidersRef.current) {
      try {
        slidersRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Search Animation Triggers
  const playSearchAnimation = () => {
    if (searchRef.current) {
      try {
        searchRef.current.stopAnimation?.();
        searchRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopSearchAnimation = () => {
    if (searchRef.current) {
      try {
        searchRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Calendar Animation Triggers
  const playCalendarAnimation = () => {
    if (calendarRef.current) {
      try {
        calendarRef.current.stopAnimation?.();
        calendarRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopCalendarAnimation = () => {
    if (calendarRef.current) {
      try {
        calendarRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Bell Animation Triggers
  const playBellAnimation = () => {
    if (bellRef.current) {
      try {
        bellRef.current.stopAnimation?.();
        bellRef.current.startAnimation?.();
      } catch (e) {}
    }
  };

  const stopBellAnimation = () => {
    if (bellRef.current) {
      try {
        bellRef.current.stopAnimation?.();
      } catch (e) {}
    }
  };

  // Container ref for outside click handling
  const containerRef = useRef<HTMLElement>(null);

  // Live Accurate Clock with 1-second interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(`${datePart}, ${timePart}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts (Cmd+Space / Ctrl+Space for Spotlight Search, Escape to dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        playSearchAnimation();
        setIsSpotlightOpen((prev) => !prev);
        setActiveMenu(null);
      }
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Outside Click Dismissal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Scroll on volume icon to adjust level directly in 5% increments
  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 5 : -5;
    setVolume((prev) => Math.max(0, Math.min(100, prev + delta)));
    playVolumeAnimation();
  };

  // Double-click to instantly toggle mute
  const handleVolumeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
    playVolumeAnimation();
  };

  // Determine current active volume icon key
  const volumeIconKey = isMuted || volume === 0 ? 'muted' : volume <= 50 ? 'low' : 'high';

  return (
    <>
      <header
        ref={containerRef}
        id="macos-sequoia-top-bar"
        className={`relative z-50 w-full pt-2 px-3 sm:px-4 flex items-center justify-end select-none pointer-events-auto ${className}`}
      >
        {/* Unified Status Capsule Container */}
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 shadow-lg shadow-black/30 text-white text-xs font-medium select-none transition hover:bg-white/12">
            {/* 0. Weather Segment (Unified inside Capsule on Far Left) */}
            <button
              type="button"
              data-weather-trigger="true"
              onClick={() => setActiveMenu(activeMenu === 'weather' ? null : 'weather')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer ${
                activeMenu === 'weather' ? 'bg-white/20 text-white shadow-xs' : 'text-white/90'
              }`}
              title={`Weather: ${displayTemp}${tempUnitSymbol} in ${weather.city}, ${weather.condition}`}
              aria-label="Weather Forecast"
            >
              <WeatherIcon
                conditionCode={weather.conditionCode}
                condition={weather.condition}
                isDay={weather.isDay}
                size={14}
              />
              <span className="text-xs font-semibold text-white tracking-tight tabular-nums">
                {displayTemp}{tempUnitSymbol}
              </span>
              <span className="text-xs text-white/70 font-normal truncate max-w-[85px] sm:max-w-[110px]">
                {weather.city}
              </span>
            </button>

            {/* Subtle Divider between Weather and OS Controls */}
            <div className="h-3.5 w-[1px] bg-white/15 shrink-0 rounded-full" />

            {/* 1. Dynamic Animated Wi-Fi Trigger */}
            <button
              type="button"
              onClick={() => {
                playWifiAnimation();
                setActiveMenu(activeMenu === 'wifi' ? null : 'wifi');
              }}
              onMouseEnter={playWifiAnimation}
              onMouseLeave={stopWifiAnimation}
              className={`p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                activeMenu === 'wifi' ? 'bg-white/20 text-white shadow-xs' : 'text-white/90'
              }`}
              title={
                wifiState === 'connected'
                  ? `Wi-Fi: Connected (${currentSsid || 'Online'})`
                  : wifiState === 'disconnected'
                  ? 'Wi-Fi: Off'
                  : 'Wi-Fi: Configuring Settings'
              }
              aria-label="Wi-Fi Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={wifiState}
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="flex items-center justify-center pointer-events-none"
                >
                  {wifiState === 'connected' && (
                    <WifiIcon ref={wifiRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                  {wifiState === 'disconnected' && (
                    <WifiOffIcon ref={wifiRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                  {wifiState === 'configuring' && (
                    <WifiCogIcon ref={wifiRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* 2. Dynamic Animated Sound / Volume Trigger */}
            <button
              type="button"
              onClick={() => {
                playVolumeAnimation();
                setActiveMenu(activeMenu === 'sound' ? null : 'sound');
              }}
              onMouseEnter={playVolumeAnimation}
              onMouseLeave={stopVolumeAnimation}
              onDoubleClick={handleVolumeDoubleClick}
              onWheel={handleVolumeWheel}
              className={`p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                activeMenu === 'sound' ? 'bg-white/20 text-white shadow-xs' : 'text-white/90'
              }`}
              title={`Volume: ${isMuted || volume === 0 ? 'Muted' : `${volume}%`} (Scroll to adjust, double-click to mute)`}
              aria-label="Sound & Volume Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={volumeIconKey}
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="flex items-center justify-center pointer-events-none"
                >
                  {volumeIconKey === 'muted' && (
                    <VolumeXIcon ref={volumeRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                  {volumeIconKey === 'low' && (
                    <Volume1Icon ref={volumeRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                  {volumeIconKey === 'high' && (
                    <Volume2Icon ref={volumeRef} size={18} duration={0.8} color="#ffffff" isAnimated={false} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* 3. Dynamic Animated Battery Trigger (Percentage + Dynamic Battery / Charging Icon) */}
            <button
              type="button"
              onClick={() => {
                playBatteryAnimation();
                setActiveMenu(activeMenu === 'battery' ? null : 'battery');
              }}
              onMouseEnter={playBatteryAnimation}
              onMouseLeave={stopBatteryAnimation}
              className={`px-2 py-0.5 rounded-full cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                activeMenu === 'battery' ? 'bg-white/20 text-white shadow-xs' : 'hover:bg-white/10 text-white/90'
              }`}
              title={`Battery: ${batteryLevel}% ${isCharging ? '(Charging)' : ''}`}
              aria-label="Battery Status Menu"
            >
              <span className="text-[11.5px] font-semibold tracking-tight drop-shadow-sm">{batteryLevel}%</span>
              <div className="flex items-center justify-center pointer-events-none">
                {isCharging ? (
                  <BatteryChargingIcon
                    ref={batteryRef}
                    size={18}
                    duration={0.8}
                    color="#34d399"
                    isAnimated={false}
                  />
                ) : (
                  <BatteryIcon
                    ref={batteryRef}
                    size={18}
                    duration={0.8}
                    color="#ffffff"
                    isAnimated={false}
                  />
                )}
              </div>
            </button>

            {/* 4. Dynamic Animated Control Center / Settings Trigger (SlidersHorizontalIcon) */}
            <button
              type="button"
              onClick={() => {
                playSlidersAnimation();
                setActiveMenu(activeMenu === 'toggles' ? null : 'toggles');
              }}
              onMouseEnter={playSlidersAnimation}
              onMouseLeave={stopSlidersAnimation}
              className={`p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all active:scale-95 ${
                activeMenu === 'toggles' ? 'bg-white/20 text-white shadow-xs' : 'hover:bg-white/10 text-white/90'
              }`}
              title="Control Center & Quick Settings"
              aria-label="Control Center Menu"
            >
              <div className="flex items-center justify-center pointer-events-none">
                <SlidersHorizontalIcon 
                  ref={slidersRef} 
                  size={18} 
                  duration={0.8} 
                  color="#ffffff" 
                  isAnimated={false} 
                />
              </div>
            </button>

            {/* 5. Dynamic Animated Spotlight Search Trigger (SearchIcon) */}
            <button
              type="button"
              onClick={() => {
                playSearchAnimation();
                setIsSpotlightOpen((prev) => !prev);
                setActiveMenu(null);
              }}
              onMouseEnter={playSearchAnimation}
              onMouseLeave={stopSearchAnimation}
              className={`p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all active:scale-95 ${
                isSpotlightOpen ? 'bg-white/20 text-white shadow-xs' : 'hover:bg-white/10 text-white/90'
              }`}
              title="Spotlight Search (Cmd + Space / Ctrl + Space)"
              aria-label="Spotlight Search"
            >
              <div className="flex items-center justify-center pointer-events-none">
                <SearchIcon
                  ref={searchRef}
                  size={18}
                  duration={0.8}
                  color="#ffffff"
                  isAnimated={false}
                />
              </div>
            </button>

            {/* 6. Dynamic Animated Live Date & Time Pill Button */}
            <button
              type="button"
              onClick={() => {
                playCalendarAnimation();
                setActiveMenu(activeMenu === 'datetime' ? null : 'datetime');
              }}
              onMouseEnter={playCalendarAnimation}
              onMouseLeave={stopCalendarAnimation}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-all active:scale-95 ${
                activeMenu === 'datetime' ? 'bg-white/20 text-white shadow-inner' : 'hover:bg-white/10 text-white/90'
              }`}
              title="Calendar & Upcoming Agenda"
              aria-label="Calendar and Agenda Menu"
            >
              <div className="flex items-center justify-center pointer-events-none">
                <CalendarIcon
                  ref={calendarRef}
                  size={14}
                  duration={0.8}
                  color="#ffffff"
                  isAnimated={false}
                />
              </div>
              <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                {currentTime || 'Thu, Sep 24, 4:30 PM'}
              </span>
            </button>

            {/* 7. Dynamic Animated Notification Center Trigger with Unread Indicator */}
            <button
              type="button"
              onClick={() => {
                playBellAnimation();
                setActiveMenu(activeMenu === 'notifications' ? null : 'notifications');
              }}
              onMouseEnter={playBellAnimation}
              onMouseLeave={stopBellAnimation}
              className={`relative p-1.5 rounded-full transition cursor-pointer hover:bg-white/10 active:scale-95 flex items-center justify-center ${
                activeMenu === 'notifications' ? 'bg-white/20 text-white shadow-xs' : 'text-white/90'
              }`}
              title={`Notifications ${unreadNotificationCount > 0 ? `(${unreadNotificationCount} unread)` : ''}`}
              aria-label="Notifications Menu"
            >
              <div className="flex items-center justify-center pointer-events-none">
                <BellIcon ref={bellRef} size={18} duration={0.9} color="#ffffff" isAnimated={false} />
              </div>
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none" />
              )}
            </button>
          </div>

          {/* ======================================================================= */}
          {/* DROPDOWN FLYOUT MENUS (WINDOWS SHELL SURFACES)                         */}
          {/* ======================================================================= */}
          <div className="absolute top-full mt-2 right-0 z-[9999] pointer-events-auto">
            <AnimatePresence mode="wait">
              {activeMenu === 'wifi' && (
                <WindowsNetworkShellSurface
                  key="windows-network-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenSettings={onOpenSettings}
                />
              )}

              {activeMenu === 'sound' && (
                <WindowsAudioShellSurface
                  key="windows-audio-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenSettings={onOpenSettings}
                />
              )}

              {activeMenu === 'battery' && (
                <WindowsPowerShellSurface
                  key="windows-power-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenSettings={onOpenSettings}
                />
              )}

              {activeMenu === 'toggles' && (
                <WindowsQuickSettingsShellSurface
                  key="windows-quick-settings-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenSettings={onOpenSettings}
                  onOpenWifiShell={() => setActiveMenu('wifi')}
                />
              )}

              {activeMenu === 'datetime' && (
                <WindowsCalendarShellSurface
                  key="windows-calendar-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenCalendarApp={() => {
                    setActiveMenu(null);
                    onOpenApp?.('calendar');
                  }}
                  onOpenSettings={onOpenSettings}
                />
              )}

              {activeMenu === 'notifications' && (
                <WindowsActionCenterShellSurface
                  key="windows-action-center-shell"
                  onClose={() => setActiveMenu(null)}
                  onOpenApp={onOpenApp}
                  onOpenSettings={onOpenSettings}
                  onOpenNetworkFlyout={() => setActiveMenu('wifi')}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Left-Anchored Weather Flyout (Directly underneath the Weather segment) */}
          <div className="absolute top-full mt-2 left-0 z-[9999] pointer-events-auto">
            <AnimatePresence mode="wait">
              {activeMenu === 'weather' && (
                <WeatherFlyout
                  key="windows-weather-flyout"
                  isOpen={activeMenu === 'weather'}
                  onClose={() => setActiveMenu(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Windows Search Shell Modal (Replaces generic spotlight with authentic Windows Search) */}
      <WindowsSearchShellSurface
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpenApp={onOpenApp}
        onOpenSettings={onOpenSettings}
      />
    </>
  );
};

export default TopBar;
