import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, type MotionValue } from 'motion/react';
import { WindowsEnvironmentConfig } from './types';

interface WindowsTaskbarProps {
  config: WindowsEnvironmentConfig;
  activeFlyout: string | null;
  onToggleFlyout: (flyout: 'start' | 'wifi' | 'volume' | 'battery' | 'clock') => void;
  activeAppWindow: string | null;
  onOpenAppWindow: (appId: string, origin?: { x: number; y: number }) => void;
  activeAppIds?: string[];
  onToggleAppDrawer?: () => void;
  isAppDrawerOpen?: boolean;
}

interface DockAppItem {
  id: string;
  name: string;
  appId?: string;
  isFolder?: boolean;
  renderIcon: () => React.ReactNode;
}

interface DockItemProps {
  app: DockAppItem;
  index: number;
  mouseX: MotionValue<number>;
  magnificationEnabled: boolean;
  active: boolean;
  isBouncing: boolean;
  onClick: (e: React.MouseEvent) => void;
  onSetRef: (index: number, el: HTMLDivElement | null) => void;
}

/**
 * Single Dock Item with in-place spring-based magnification physics.
 * Baseline remains anchored to bottom; grows visually upward.
 */
const DockItem: React.FC<DockItemProps> = ({
  app,
  index,
  mouseX,
  magnificationEnabled,
  active,
  isBouncing,
  onClick,
  onSetRef,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSetRef(index, itemRef.current);
  }, [index, onSetRef]);

  // Compute horizontal distance between cursor position and center of this Dock icon
  const distance = useTransform(mouseX, (val: number) => {
    const el = itemRef.current;
    if (!el || val === Infinity || !magnificationEnabled) return 9999;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return val - centerX;
  });

  // Authentic macOS smooth bell-shaped falloff curve (invisible math, no visual graphs):
  // - Base icon: 1.0x (~40px)
  // - Directly hovered icon (d = 0): ~1.62x
  // - Immediate neighbors (d ~ 45px): ~1.34x
  // - Next neighbors (d ~ 90px): ~1.08x
  // - Farther icons (d >= 135px): 1.00x
  const rawScale = useTransform(distance, (d: number) => {
    const absD = Math.abs(d);
    if (absD >= 135) return 1.0;
    // Pure Gaussian bell-shaped falloff:
    const sigma = 44;
    const factor = Math.exp(-(absD * absD) / (2 * sigma * sigma));
    return 1.0 + 0.62 * factor;
  });

  // Spring characteristics: high responsiveness (stiffness 400), moderate damping (28),
  // small controlled overshoot, zero jitter, zero oscillation
  const springScale = useSpring(rawScale, {
    stiffness: 400,
    damping: 28,
    mass: 0.12,
  });

  // Dynamic z-index layering so hovered and enlarged icons cleanly layer over neighbors
  const zIndex = useTransform(rawScale, (s: number) => {
    if (s <= 1.01) return 10;
    return Math.round(10 + (s - 1.0) * 100);
  });

  return (
    <motion.div
      ref={itemRef}
      id={app.id === 'folder' ? 'dock-item-folder' : undefined}
      style={{
        scale: springScale,
        transformOrigin: 'bottom center', // Baseline anchored to bottom, expands upward
        zIndex,
      }}
      className="dock-item-wrapper cursor-pointer select-none shrink-0"
      onClick={onClick}
    >
      <button
        type="button"
        title={app.name}
        className={`focus:outline-none cursor-pointer block ${isBouncing ? 'bouncing' : ''}`}
      >
        {app.renderIcon()}
      </button>

      {/* Tiny, softly glowing, white, subtle, centered, stable active indicator */}
      <div className="h-1.5 flex items-center justify-center mt-0.5 pointer-events-none">
        <span
          className={`w-1 h-1 rounded-full transition-all duration-300 ${
            active
              ? 'bg-white/95 active-dot scale-100 opacity-100'
              : 'bg-transparent scale-0 opacity-0'
          }`}
        />
      </div>
    </motion.div>
  );
};

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  config,
  activeAppWindow,
  onOpenAppWindow,
  activeAppIds = ['messages', 'safari', 'music', 'calendar', 'clock'],
  onToggleAppDrawer,
  isAppDrawerOpen = false,
}) => {
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Framer Motion value for high-frequency cursor tracking outside React render loop
  const mouseX = useMotionValue(Infinity);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSetItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNumber = currentDate.getDate();
  const dayNameShort = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

  // Handle Dock item click: single icon launch bounce & scale window transition origin
  const handleItemClick = (app: DockAppItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger authentic launch bounce ONLY on this specific clicked icon
    setBouncingId(app.id);
    setTimeout(() => {
      setBouncingId(null);
    }, 720);

    // Compute exact icon center relative to desktop canvas for window expand transition
    const el = itemRefs.current[index];
    const canvas = el?.closest('#wallix-windows-desktop-canvas') || document.getElementById('wallix-windows-desktop-canvas');
    let origin: { x: number; y: number } | undefined;
    if (el && canvas) {
      const elRect = el.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      origin = {
        x: elRect.left + elRect.width / 2 - canvasRect.left,
        y: elRect.top + elRect.height / 2 - canvasRect.top,
      };
    }

    if (app.id === 'folder') {
      if (onToggleAppDrawer) {
        onToggleAppDrawer();
      } else {
        window.dispatchEvent(new CustomEvent('wallix:toggle-app-drawer'));
      }
    } else {
      onOpenAppWindow(app.id, origin);
    }
  };

  const isAppActive = (id: string, appId?: string) => {
    if (!id) return false;
    if (id === 'folder' && isAppDrawerOpen) return true;
    if (activeAppWindow === id || (appId && activeAppWindow === appId)) return true;
    return activeAppIds.includes(id) || (appId ? activeAppIds.includes(appId) : false);
  };

  const dockApps: DockAppItem[] = [
    {
      id: 'messages',
      name: 'Messages',
      appId: 'browser',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-gradient-to-b from-[#69eb5a] via-[#34d148] to-[#1bb82e] flex items-center justify-center p-1.5 shadow-lg">
          <svg className="w-5 h-5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.76 1.44 5.22 3.7 6.78-.17.97-.66 2.45-1.74 3.42 0 0 2.43.14 4.7-1.42.44.1 1.13.22 1.34.22 5.52 0 10-3.94 10-8.8S17.52 3 12 3z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'safari',
      name: 'Safari',
      appId: 'browser',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white flex items-center justify-center overflow-hidden relative shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2ca4fc] via-[#0d75e2] to-[#044eb4] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center relative">
              <div className="w-4 h-4 transform rotate-45 flex items-center justify-center">
                <div className="w-1 h-2.5 bg-[#ff3b30] rounded-t-sm shadow-sm" />
                <div className="w-1 h-2.5 bg-white rounded-b-sm shadow-sm" />
              </div>
              <div className="absolute w-1 h-1 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'music',
      name: 'Apple Music',
      appId: 'projects',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-gradient-to-b from-[#ff3c69] via-[#fa2350] to-[#db0f37] flex items-center justify-center p-1.5 shadow-lg">
          <svg className="w-4.5 h-4.5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'mail',
      name: 'Mail',
      appId: 'projects',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-gradient-to-b from-[#3ba2ff] via-[#1a7beb] to-[#0c62ce] flex items-center justify-center p-1.5 shadow-lg">
          <svg className="w-4.5 h-4.5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      appId: 'control-panel',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white flex flex-col items-center justify-between p-1 shadow-lg overflow-hidden">
          <span className="text-[7px] font-bold text-[#ff3b30] uppercase tracking-tighter">
            {dayNameShort}
          </span>
          <span className="text-sm sm:text-base font-bold text-neutral-800 -my-1 leading-tight tracking-tight font-sans">
            {dayNumber}
          </span>
          <span className="w-2.5 h-0.5 bg-neutral-200 rounded-full mb-0.5" />
        </div>
      ),
    },
    {
      id: 'photos',
      name: 'Photos',
      appId: 'projects',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white flex items-center justify-center relative shadow-lg">
          <div className="w-5 h-5 relative flex items-center justify-center">
            <span className="absolute w-1 h-2.5 rounded-full bg-yellow-400 rotate-0 -translate-y-1.5 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-orange-500 rotate-45 -translate-y-1 translate-x-1 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-rose-500 rotate-90 translate-x-1.5 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-purple-500 rotate-[135deg] translate-y-1 translate-x-1 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-blue-500 rotate-180 translate-y-1.5 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-teal-400 rotate-[225deg] translate-y-1 -translate-x-1 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-green-500 rotate-[270deg] -translate-x-1.5 opacity-95" />
            <span className="absolute w-1 h-2.5 rounded-full bg-lime-400 rotate-[315deg] -translate-y-1 -translate-x-1 opacity-95" />
            <span className="absolute w-1 h-1 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      ),
    },
    {
      id: 'notes',
      name: 'Notes',
      appId: 'this-pc',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white flex flex-col overflow-hidden shadow-lg">
          <div className="h-2 w-full bg-[#fbc02d] border-b border-amber-300" />
          <div className="flex-1 p-1 space-y-0.5 bg-neutral-50">
            <div className="w-full h-[1px] bg-neutral-300" />
            <div className="w-3/4 h-[1px] bg-neutral-300" />
            <div className="w-full h-[1px] bg-neutral-200" />
          </div>
        </div>
      ),
    },
    {
      id: 'clock',
      name: 'Clock',
      appId: 'clock',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white flex items-center justify-center relative shadow-lg">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-neutral-200 relative flex items-center justify-center">
            <span className="absolute top-0 text-[5px] font-bold text-neutral-600">12</span>
            <span className="absolute bottom-0 text-[5px] font-bold text-neutral-600">6</span>
            <span className="absolute left-0.5 text-[5px] font-bold text-neutral-600">9</span>
            <span className="absolute right-0.5 text-[5px] font-bold text-neutral-600">3</span>
            {/* Clock Hands */}
            <div className="absolute w-0.5 h-2 bg-neutral-900 rounded-full top-1.5 origin-bottom transform rotate-45" />
            <div className="absolute w-0.5 h-2.5 bg-neutral-600 rounded-full top-1 origin-bottom transform -rotate-45" />
            <div className="clock-second-hand absolute w-[1px] h-2.5 bg-orange-500 top-0.5" />
            <div className="w-1 h-1 rounded-full bg-orange-500 z-10" />
          </div>
        </div>
      ),
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      appId: 'projects',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-[#e60023] flex items-center justify-center p-2 shadow-lg">
          <svg className="w-5 h-5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      appId: 'terminal',
      renderIcon: () => (
        <div className="w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-[#10a37f] flex items-center justify-center p-2 shadow-lg">
          <svg className="w-5 h-5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.943a4.485 4.485 0 0 1 2.365-1.983V12.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.169a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.943zm16.597 3.855l-5.833-3.387L15.119 8.24a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 10.277V7.947a.082.082 0 0 1 .033-.062l4.84-2.793a4.499 4.499 0 0 1 6.665 4.673zM8.306 13.064l2.502-1.445 2.502 1.445v2.89l-2.502 1.445-2.502-1.445z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'folder',
      name: 'App Drawer / Launchpad',
      isFolder: true,
      renderIcon: () => (
        <div className={`w-9 h-9 sm:w-10 sm:h-10 app-squircle bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 hover:border-cyan-400 p-1.5 shadow-lg flex items-center justify-center transition-all ${isAppDrawerOpen ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : ''}`}>
          <div className="grid grid-cols-2 gap-0.5 w-full h-full p-0.5 pointer-events-none">
            <div className="w-full h-full rounded-[2px] bg-white flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full border-[0.6px] border-neutral-400 relative flex items-center justify-center">
                <span className="w-[0.5px] h-0.5 bg-black absolute top-0.5" />
              </div>
            </div>
            <div className="w-full h-full rounded-[2px] bg-white flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400" />
            </div>
            <div className="w-full h-full rounded-[2px] bg-[#666c75] flex items-center justify-center shadow-xs">
              <span className="w-1 h-1 rounded-full border border-neutral-300" />
            </div>
            <div className="w-full h-full rounded-[2px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xs">
              <span className="w-1 h-0.5 rounded-full bg-white/90" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-end pointer-events-none pb-1 sm:pb-2">
      {/* EXACTLY ONE DOCK CONTAINER WITH EXACTLY ONE ROW OF ITEMS */}
      <nav 
        ref={navRef}
        className="pointer-events-auto relative inline-flex items-end h-[54px] sm:h-[60px] px-2.5 sm:px-3.5 pb-1.5 pt-2 dock-glass-native rounded-[20px] sm:rounded-[22px] z-40 shadow-2xl overflow-visible select-none shrink-0"
        onMouseMove={(e) => {
          if (config.taskbar.magnification) {
            mouseX.set(e.clientX);
          }
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
        }}
        style={{
          opacity: config.taskbar.opacity,
          backdropFilter: `blur(${config.taskbar.blur || 54}px)`,
        }}
      >
        <div className="flex items-end gap-1 sm:gap-1.5 shrink-0">
          {dockApps.map((app, index) => {
            const isBouncing = bouncingId === app.id;
            const active = isAppActive(app.id, app.appId);

            return (
              <React.Fragment key={app.id}>
                {/* Separator Divider before App Library folder */}
                {app.id === 'folder' && (
                  <div className="h-6 w-[1px] bg-white/20 mx-1 mb-2.5 shrink-0 self-end rounded-full" />
                )}
                
                {/* Direct In-Place Dock Item */}
                <DockItem
                  app={app}
                  index={index}
                  mouseX={mouseX}
                  magnificationEnabled={config.taskbar.magnification}
                  active={active}
                  isBouncing={isBouncing}
                  onClick={(e) => handleItemClick(app, index, e)}
                  onSetRef={handleSetItemRef}
                />
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
