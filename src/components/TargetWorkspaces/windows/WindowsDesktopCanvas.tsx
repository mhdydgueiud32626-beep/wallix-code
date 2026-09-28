import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Wallpaper } from '../../../types';
import { WindowsEnvironmentConfig } from './types';
import { WindowsTopSystemBar } from './WindowsTopSystemBar';
import { WindowsTaskbar } from './WindowsTaskbar';
import { WindowsTrayFlyouts } from './WindowsTrayFlyouts';
import { WindowsAppWindow, WindowLifecycleState } from './WindowsAppWindow';
import { AppDrawerLauncher } from '../../Widgets/AppDrawerLauncher';

interface WindowsDesktopCanvasProps {
  config: WindowsEnvironmentConfig;
  onChangeConfig: (newConfig: WindowsEnvironmentConfig) => void;
  activeWallpaper: Wallpaper;
  wallpapers: Wallpaper[];
  onSelectWallpaper: (w: Wallpaper) => void;
  selectedIconId: string | null;
  onSelectIcon: (id: string | null) => void;
  onOpenSettingsTab: (tabId: string) => void;
}

export interface AppWindowSession {
  appId: string;
  state: WindowLifecycleState;
  dockOrigin: { x: number; y: number } | null;
  isMaximized: boolean;
  exitMode?: 'minimize' | 'close';
}

export const WindowsDesktopCanvas: React.FC<WindowsDesktopCanvasProps> = ({
  config,
  onChangeConfig,
  activeWallpaper,
  wallpapers,
  onSelectWallpaper,
  selectedIconId,
  onSelectIcon,
  onOpenSettingsTab,
}) => {
  const desktopAreaRef = useRef<HTMLDivElement>(null);
  const [desktopDimensions, setDesktopDimensions] = useState({ width: 900, height: 520 });

  // Flyouts and Active Window Lifecycle Sessions
  const [activeFlyout, setActiveFlyout] = useState<'start' | 'wifi' | 'volume' | 'battery' | 'clock' | null>(null);
  const [windowSessions, setWindowSessions] = useState<Record<string, AppWindowSession>>({});
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  
  // Dock active indicator dots: persists while app is running (even if minimized)
  const [activeAppIds, setActiveAppIds] = useState<string[]>(['messages', 'safari', 'music', 'calendar', 'clock']);

  // App Drawer Launcher State
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsAppDrawerOpen((prev) => !prev);
    const handleOpen = () => setIsAppDrawerOpen(true);
    const handleClose = () => setIsAppDrawerOpen(false);

    window.addEventListener('wallix:toggle-app-drawer', handleToggle);
    window.addEventListener('wallix:open-app-drawer', handleOpen);
    window.addEventListener('wallix:close-app-drawer', handleClose);

    return () => {
      window.removeEventListener('wallix:toggle-app-drawer', handleToggle);
      window.removeEventListener('wallix:open-app-drawer', handleOpen);
      window.removeEventListener('wallix:close-app-drawer', handleClose);
    };
  }, []);

  // Measure desktop dimensions dynamically with ResizeObserver
  useEffect(() => {
    if (!desktopAreaRef.current) return;
    const updateSize = () => {
      if (desktopAreaRef.current) {
        const rect = desktopAreaRef.current.getBoundingClientRect();
        setDesktopDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(desktopAreaRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  /**
   * OPEN / FOCUS APP WINDOW FROM DOCK ICON
   * 1. Detects exact on-screen position of that specific Dock icon.
   * 2. Stores that position for the application-window transition.
   * 3. Uses that exact position as the visual origin of the opening animation.
   * 4. If already open: focuses the existing window rather than creating another copy.
   * 5. If minimized: un-minimizes and emerges back out from the Dock icon location.
   */
  const handleOpenAppWindow = (appId: string, origin?: { x: number; y: number }) => {
    // Dismiss any open flyout
    if (activeFlyout) setActiveFlyout(null);

    const fallbackOrigin = desktopAreaRef.current
      ? { x: desktopAreaRef.current.clientWidth / 2, y: desktopAreaRef.current.clientHeight - 40 }
      : { x: desktopDimensions.width / 2, y: desktopDimensions.height - 40 };

    setWindowSessions((prev) => {
      const existing = prev[appId];
      const targetOrigin = origin || existing?.dockOrigin || fallbackOrigin;

      // 1. If application is already open or active: focus existing window without recreating
      if (existing && (existing.state === 'open' || existing.state === 'active')) {
        setActiveWindowId(appId);
        return {
          ...prev,
          [appId]: {
            ...existing,
            state: 'active',
          },
        };
      }

      // 2. If application is minimized: un-minimize and emerge from the remembered Dock icon location
      if (existing && existing.state === 'minimized') {
        setActiveWindowId(appId);
        return {
          ...prev,
          [appId]: {
            ...existing,
            dockOrigin: targetOrigin,
            state: 'opening',
          },
        };
      }

      // 3. New or closed: initialize session and launch from exact Dock origin
      setActiveWindowId(appId);
      return {
        ...prev,
        [appId]: {
          appId,
          state: 'opening',
          dockOrigin: targetOrigin,
          isMaximized: false,
        },
      };
    });

    // Ensure Dock icon shows the subtle glowing active indicator dot
    setActiveAppIds((prev) => (prev.includes(appId) ? prev : [...prev, appId]));
  };

  /**
   * FOCUS WINDOW
   */
  const handleFocusWindow = (appId: string) => {
    setActiveWindowId(appId);
    setWindowSessions((prev) => {
      if (!prev[appId]) return prev;
      return {
        ...prev,
        [appId]: { ...prev[appId], state: 'active' },
      };
    });
  };

  /**
   * MINIMIZE WINDOW (Yellow Control)
   * The application window reverses toward the Dock icon that launched it.
   * Visual sequence: open window -> controlled contraction -> movement toward original Dock icon -> scale down -> disappear into Dock origin.
   * Minimized state retains relationship to the correct Dock icon.
   * Dock icon active indicator remains ON.
   */
  const handleMinimizeWindow = (appId: string) => {
    setWindowSessions((prev) => {
      const session = prev[appId];
      if (!session) return prev;
      return {
        ...prev,
        [appId]: { ...session, state: 'minimized', exitMode: 'minimize' },
      };
    });
    setActiveWindowId((current) => (current === appId ? null : current));
    // App remains in activeAppIds so the Dock indicator dot stays visible!
  };

  /**
   * CLOSE WINDOW (Red Control)
   * Window closes cleanly.
   * Dock icon stops appearing active after the application closes (indicator cleared).
   */
  const handleCloseWindow = (appId: string) => {
    setWindowSessions((prev) => {
      const session = prev[appId];
      if (!session) return prev;
      return {
        ...prev,
        [appId]: { ...session, state: 'closed', exitMode: 'close' },
      };
    });
    setActiveWindowId((current) => (current === appId ? null : current));
    // Clear active indicator on Dock icon
    setActiveAppIds((prev) => prev.filter((id) => id !== appId));
  };

  /**
   * MAXIMIZE / RESTORE WINDOW (Green Control)
   * Expands into available workspace without breaking container boundaries or causing page scrolling.
   */
  const handleToggleMaximize = (appId: string) => {
    setWindowSessions((prev) => {
      const session = prev[appId];
      if (!session) return prev;
      return {
        ...prev,
        [appId]: { ...session, isMaximized: !session.isMaximized },
      };
    });
  };

  /**
   * ANIMATION COMPLETED
   */
  const handleAnimationComplete = (appId: string, finalState: 'open' | 'minimized' | 'closed') => {
    setWindowSessions((prev) => {
      const session = prev[appId];
      if (!session) return prev;
      if (finalState === 'open' && session.state === 'opening') {
        return {
          ...prev,
          [appId]: { ...session, state: 'active' },
        };
      }
      return prev;
    });
  };

  const screenBrightness = (config.device?.brightness ?? 100) / 100;
  const wallpaperUrl = 
    activeWallpaper?.imageUrl || 
    activeWallpaper?.image || 
    activeWallpaper?.thumbnailUrl || 
    activeWallpaper?.thumbnail || 
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=2560&q=85';

  // Windows that should be actively rendered in DOM (opening, open, active, closing)
  const renderedSessions = Object.values(windowSessions).filter(
    (s) => s.state !== 'closed' && s.state !== 'minimized'
  );

  return (
    <main
      id="wallix-windows-desktop-canvas"
      ref={desktopAreaRef}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        onSelectIcon(null);
        if (activeFlyout) setActiveFlyout(null);
      }}
      className="
        relative w-full h-full min-h-0 min-w-0
        overflow-hidden
        bg-black
        select-none
        focus:outline-none
      "
      tabIndex={0}
    >
      {/* ======================================================================= */}
      {/* 1. WALLPAPER BACKGROUND LAYER (Always visible, no black screen)         */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base Background Image Layer */}
        <div
          className="absolute inset-0 w-full h-full transition-all duration-700 bg-no-repeat"
          style={{
            backgroundImage: `url(${wallpaperUrl})`,
            backgroundSize: config.wallpaper.fit === 'contain' ? 'contain' : 'cover',
            backgroundPosition: 'center',
            filter: `brightness(${screenBrightness * (config.effects.vignette ? 0.9 : 1)}) contrast(1.04)`,
          }}
        />

        {/* Dynamic Video Layer */}
        {activeWallpaper?.isVideo && activeWallpaper?.videoUrl ? (
          <video
            src={activeWallpaper.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
          />
        ) : null}

        {/* Desktop Vignette */}
        {config.effects.vignette && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${config.effects.shadowDepth / 100}) 100%)`,
            }}
          />
        )}
      </div>

      {/* ======================================================================= */}
      {/* 2. TOP SOFTWARE STATUS LAYER                                           */}
      {/* ======================================================================= */}
      {config.device?.showTopBar && (
        <div
          className="
            absolute inset-x-0 top-0 z-50
            pointer-events-auto overflow-visible
          "
        >
          <WindowsTopSystemBar
            config={config}
            onToggleFlyout={(flyout) => setActiveFlyout(activeFlyout === flyout ? null : flyout)}
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3. REAL APPLICATION WINDOW WORKSPACE (Scale Origin from Dock Icon)       */}
      {/* Layered above wallpaper, below top bar and dock controls                */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        <AnimatePresence mode="sync">
          {renderedSessions.map((session) => (
            <WindowsAppWindow
              key={session.appId}
              appId={session.appId}
              lifecycleState={session.state}
              isActive={activeWindowId === session.appId}
              isMaximized={session.isMaximized}
              dockOrigin={session.dockOrigin}
              exitMode={session.exitMode}
              onFocus={() => handleFocusWindow(session.appId)}
              onMinimize={() => handleMinimizeWindow(session.appId)}
              onClose={() => handleCloseWindow(session.appId)}
              onToggleMaximize={() => handleToggleMaximize(session.appId)}
              onAnimationComplete={(final) => handleAnimationComplete(session.appId, final)}
              wallpapers={wallpapers}
              activeWallpaper={activeWallpaper}
              onSelectWallpaper={onSelectWallpaper}
              containerBounds={desktopDimensions}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ======================================================================= */}
      {/* 4. DOCK (Bottom-Center: comfortable clearance from bottom)              */}
      {/* Single container, in-place magnification, launch bounce & active dots  */}
      {/* ======================================================================= */}
      <div
        className="
          pointer-events-auto
          absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-40
          flex justify-center items-end
          max-w-[calc(100%-1rem)]
        "
      >
        <WindowsTaskbar
          config={config}
          activeFlyout={activeFlyout}
          onToggleFlyout={(flyout) => setActiveFlyout(activeFlyout === flyout ? null : flyout)}
          activeAppWindow={activeWindowId}
          onOpenAppWindow={handleOpenAppWindow}
          activeAppIds={activeAppIds}
          onToggleAppDrawer={() => setIsAppDrawerOpen((prev) => !prev)}
          isAppDrawerOpen={isAppDrawerOpen}
        />
      </div>

      {/* App Drawer Launcher Window */}
      <AppDrawerLauncher
        isOpen={isAppDrawerOpen}
        onClose={() => setIsAppDrawerOpen(false)}
        onLaunchApp={(app) => {
          handleOpenAppWindow(app.id);
        }}
      />

      {/* ======================================================================= */}
      {/* 5. SYSTEM TRAY FLYOUTS                                                  */}
      {/* ======================================================================= */}
      <WindowsTrayFlyouts
        activeFlyout={activeFlyout}
        onClose={() => setActiveFlyout(null)}
        onOpenAppWindow={(appId) => handleOpenAppWindow(appId)}
        wallpapers={wallpapers}
        onSelectWallpaper={onSelectWallpaper}
        clockFormat={config.systemUI.clockFormat}
      />
    </main>
  );
};
