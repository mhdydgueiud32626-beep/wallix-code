import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWindowsNotifications, NotificationItem } from '../../../services/systemBridge';
import { WindowsNotificationGroup } from './WindowsNotificationGroup';
import { WindowsQuickActionGrid } from './WindowsQuickActionGrid';
import { WindowsBrightnessSlider } from './WindowsBrightnessSlider';
import { LiquidGlassSurface } from '../../../modules/desktop/shell/LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';
import { shellSideDockMotion } from '../../../modules/desktop/shell/shellMotion';

export interface WindowsActionCenterFlyoutProps {
  onClose?: () => void;
  onOpenApp?: (appId: string) => void;
  onOpenSettings?: () => void;
  onOpenNetworkFlyout?: () => void;
}

export const WindowsActionCenterFlyout: React.FC<WindowsActionCenterFlyoutProps> = ({
  onClose,
  onOpenApp,
  onOpenSettings,
  onOpenNetworkFlyout,
}) => {
  const {
    notifications,
    clearAllNotifications,
  } = useWindowsNotifications();

  const { tokens } = useAdaptiveMaterial();

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

  // Group notifications by application name
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, { appName: string; appIconCategory: string; items: NotificationItem[] }> = {};

    notifications.forEach((notif) => {
      const key = notif.appName || 'Windows System';
      if (!groups[key]) {
        groups[key] = {
          appName: key,
          appIconCategory: notif.appIconCategory || 'system',
          items: [],
        };
      }
      groups[key].items.push(notif);
    });

    return Object.values(groups);
  }, [notifications]);

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const handleManageNotifications = () => {
    onOpenSettings?.();
    onClose?.();
  };

  return (
    <>
      {/* Background Overlay to dismiss on outside click */}
      <div 
        className="fixed inset-0 z-[99990] bg-black/35 pointer-events-auto select-none"
        onClick={onClose}
      />

      {/* Windows 10 Action Center Right-Docked Liquid Glass Shell Flyout */}
      <LiquidGlassSurface
        variant="sideDock"
        {...shellSideDockMotion}
        className="fixed top-0 right-0 h-screen w-[380px] max-w-[100vw] z-[99999] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
      >
        {/* ======================================================================= */}
        {/* 1. HEADER: Action Center Title & Manage / Clear Actions                */}
        {/* ======================================================================= */}
        <div className="pt-4 px-4 pb-3 border-b border-white/[0.09] shrink-0 bg-black/20">
          <div className="flex items-center justify-between">
            <h1 className="text-[20px] font-normal tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Action center
            </h1>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{ color: tokens.typography.textAccent }}
                className="text-[12px] font-normal hover:underline cursor-pointer transition-colors"
              >
                Clear all notifications
              </button>
            )}
          </div>

          <div className="mt-1">
            <button
              type="button"
              onClick={handleManageNotifications}
              style={{ color: tokens.typography.textAccent }}
              className="text-[12px] font-normal hover:underline cursor-pointer transition-colors"
            >
              Manage notifications
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. NOTIFICATION STREAM: Vertically Grouped Toast Items                  */}
        {/* ======================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {groupedNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <WindowsNotificationGroup
                  key={group.appName}
                  appName={group.appName}
                  appIconCategory={group.appIconCategory}
                  notifications={group.items}
                  onOpenApp={onOpenApp}
                />
              ))
            ) : (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center space-y-1 py-12">
                <span className="text-[13px] font-normal text-white/45">
                  No new notifications
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================================================================= */}
        {/* 3. QUICK ACTIONS REGION & BRIGHTNESS SLIDER                            */}
        {/* ======================================================================= */}
        <div 
          className="p-4 border-t border-white/[0.09] shrink-0 space-y-3 backdrop-blur-md"
          style={{ backgroundColor: tokens.bottomSurface.background }}
        >
          {/* 4-Column Quick Action Matrix */}
          <WindowsQuickActionGrid
            onOpenSettings={() => {
              onOpenSettings?.();
              onClose?.();
            }}
            onOpenNetworkFlyout={() => {
              onClose?.();
              onOpenNetworkFlyout?.();
            }}
          />

          {/* Windows 10 Horizontal Brightness Slider */}
          <div className="pt-2 border-t border-white/[0.08]">
            <WindowsBrightnessSlider />
          </div>
        </div>
      </LiquidGlassSurface>
    </>
  );
};

export default WindowsActionCenterFlyout;

