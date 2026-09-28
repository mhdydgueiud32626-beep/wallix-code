import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  ShellSurfaceId, 
  ShellAnchorRect, 
  DesktopShellControllerContextType 
} from './shellSurfaceTypes';
import { WindowsNetworkShellSurface } from './WindowsNetworkShellSurface';
import { WindowsAudioShellSurface } from './WindowsAudioShellSurface';
import { WindowsPowerShellSurface } from './WindowsPowerShellSurface';
import { WindowsQuickSettingsShellSurface } from './WindowsQuickSettingsShellSurface';
import { WindowsSearchShellSurface } from './WindowsSearchShellSurface';
import { WindowsCalendarShellSurface } from './WindowsCalendarShellSurface';
import { WindowsActionCenterShellSurface } from './WindowsActionCenterShellSurface';

const DesktopShellControllerContext = createContext<DesktopShellControllerContextType | null>(null);

export const useDesktopShellController = (): DesktopShellControllerContextType => {
  const context = useContext(DesktopShellControllerContext);
  if (!context) {
    throw new Error('useDesktopShellController must be used within a DesktopShellSurfaceProvider');
  }
  return context;
};

interface DesktopShellSurfaceProviderProps {
  children: React.ReactNode;
  onOpenSettings?: () => void;
  onOpenApp?: (appId: string) => void;
}

export const DesktopShellSurfaceProvider: React.FC<DesktopShellSurfaceProviderProps> = ({
  children,
  onOpenSettings,
  onOpenApp,
}) => {
  const [activeSurface, setActiveSurface] = useState<ShellSurfaceId | null>(null);
  const [anchorRect, setAnchorRect] = useState<ShellAnchorRect | null>(null);
  const surfaceContainerRef = useRef<HTMLDivElement>(null);

  const openSurface = useCallback((surfaceId: ShellSurfaceId, triggerElement?: HTMLElement | null) => {
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setAnchorRect(null);
    }
    setActiveSurface(surfaceId);
  }, []);

  const closeSurface = useCallback(() => {
    setActiveSurface(null);
    setAnchorRect(null);
  }, []);

  const toggleSurface = useCallback((surfaceId: ShellSurfaceId, triggerElement?: HTMLElement | null) => {
    if (activeSurface === surfaceId) {
      closeSurface();
    } else {
      openSurface(surfaceId, triggerElement);
    }
  }, [activeSurface, closeSurface, openSurface]);

  const isSurfaceOpen = useCallback((surfaceId: ShellSurfaceId) => {
    return activeSurface === surfaceId;
  }, [activeSurface]);

  // Global keydown listeners for Escape key dismissal and Cmd+Space / Ctrl+Space for Windows Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSurface !== null) {
        closeSurface();
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        if (activeSurface === 'search') {
          closeSurface();
        } else {
          openSurface('search');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSurface, closeSurface, openSurface]);

  // Outside click listener for anchored popovers (except search modal and right docked panel which handle their own backdrops)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeSurface && 
        activeSurface !== 'search' && 
        activeSurface !== 'notifications' &&
        activeSurface !== 'wifi'
      ) {
        if (surfaceContainerRef.current && !surfaceContainerRef.current.contains(event.target as Node)) {
          closeSurface();
        }
      }
    };

    if (activeSurface) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSurface, closeSurface]);

  const value: DesktopShellControllerContextType = {
    activeSurface,
    anchorRect,
    isOpen: activeSurface !== null,
    openSurface,
    closeSurface,
    toggleSurface,
    isSurfaceOpen,
  };

  return (
    <DesktopShellControllerContext.Provider value={value}>
      {children}

      {/* ======================================================================= */}
      {/* CENTRALIZED SHELL SURFACES VIEWPORT LAYER                               */}
      {/* ======================================================================= */}
      <div 
        ref={surfaceContainerRef} 
        id="wallix-desktop-shell-surface-layer" 
        className="fixed inset-0 pointer-events-none z-[9999]"
      >
        <AnimatePresence mode="wait">
          {/* 1. Windows Network Flyout */}
          {activeSurface === 'wifi' && (
            <WindowsNetworkShellSurface
              key="shell-surface-wifi"
              onClose={closeSurface}
              onOpenSettings={onOpenSettings}
            />
          )}

          {/* 2. Windows Sound / Audio Flyout */}
          {activeSurface === 'volume' && (
            <div className="absolute top-12 right-4 sm:right-6 pointer-events-auto">
              <WindowsAudioShellSurface
                key="shell-surface-audio"
                onClose={closeSurface}
                onOpenSettings={onOpenSettings}
              />
            </div>
          )}

          {/* 3. Windows Power & Battery Flyout */}
          {activeSurface === 'battery' && (
            <div className="absolute top-12 right-4 sm:right-6 pointer-events-auto">
              <WindowsPowerShellSurface
                key="shell-surface-battery"
                onClose={closeSurface}
                onOpenSettings={onOpenSettings}
              />
            </div>
          )}

          {/* 4. Windows 11 Quick Settings Flyout */}
          {activeSurface === 'quickSettings' && (
            <div className="absolute top-12 right-4 sm:right-6 pointer-events-auto">
              <WindowsQuickSettingsShellSurface
                key="shell-surface-quick-settings"
                onClose={closeSurface}
                onOpenSettings={onOpenSettings}
                onOpenWifiShell={() => openSurface('wifi')}
              />
            </div>
          )}

          {/* 5. Windows Date & Time / Calendar Flyout */}
          {activeSurface === 'calendar' && (
            <div className="absolute top-12 right-4 sm:right-6 pointer-events-auto">
              <WindowsCalendarShellSurface
                key="shell-surface-calendar"
                onClose={closeSurface}
                onOpenCalendarApp={() => {
                  closeSurface();
                  onOpenApp?.('calendar');
                }}
                onOpenSettings={onOpenSettings}
              />
            </div>
          )}

          {/* 6. Windows 10 Action Center Flyout */}
          {activeSurface === 'notifications' && (
            <WindowsActionCenterShellSurface
              key="shell-surface-action-center"
              onClose={closeSurface}
              onOpenApp={onOpenApp}
              onOpenSettings={onOpenSettings}
              onOpenNetworkFlyout={() => openSurface('wifi')}
            />
          )}
        </AnimatePresence>

        {/* 7. Windows Search Shell Modal */}
        <WindowsSearchShellSurface
          isOpen={activeSurface === 'search'}
          onClose={closeSurface}
          onOpenApp={onOpenApp}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </DesktopShellControllerContext.Provider>
  );
};
