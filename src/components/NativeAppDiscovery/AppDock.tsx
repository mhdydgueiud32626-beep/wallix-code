import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, MotionValue } from 'motion/react';
import { InstalledApp } from '../../types/nativeApp';
import { AppNormalizer } from '../../services/nativeApp/AppNormalizer';
import { LayoutGrid, Plus } from 'lucide-react';
import { WALLIX_MOTION_CONFIG } from '../../config/wallixMotionConfig';

interface AppDockProps {
  dockApps: InstalledApp[];
  recentAppIds: string[];
  activeAppId?: string | null;
  dockSize?: number; // default 52
  dockBlur?: number; // default 32
  dockOpacity?: number; // default 45
  showTooltips?: boolean;
  dockMagnification?: boolean;
  onLaunch: (appId: string) => Promise<void>;
  onToggleManager: () => void;
  onOpenManualAdd: () => void;
}

// Single Source of Truth Spring Physics
const SPRING_CONFIG = {
  stiffness: WALLIX_MOTION_CONFIG.dock.stiffness,
  damping: WALLIX_MOTION_CONFIG.dock.damping,
  mass: WALLIX_MOTION_CONFIG.dock.mass
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  app: InstalledApp;
  dockSize: number;
  isActive: boolean;
  isRecent: boolean;
  showTooltips: boolean;
  dockMagnification: boolean;
  shouldReduceMotion: boolean;
  onLaunch: (appId: string) => void;
}

const DockItem: React.FC<DockItemProps> = React.memo(({
  mouseX,
  app,
  dockSize,
  isActive,
  isRecent,
  showTooltips,
  dockMagnification,
  shouldReduceMotion,
  onLaunch
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // Measure distance from pointer to icon center
  const distance = useTransform(mouseX, (val: number) => {
    if (val === Infinity || !itemRef.current) return Infinity;
    const bounds = itemRef.current.getBoundingClientRect();
    return val - (bounds.x + bounds.width / 2);
  });

  const isEnabled = dockMagnification && !shouldReduceMotion;

  // Proximity-based dynamic magnification curve driven directly from WALLIX_MOTION_CONFIG:
  const cfg = WALLIX_MOTION_CONFIG.dock;
  const targetScale = useTransform(
    distance,
    [-160, -110, -55, 0, 55, 110, 160],
    isEnabled ? [1, cfg.outerScale, cfg.adjacentScale, cfg.maxScale, cfg.adjacentScale, cfg.outerScale, 1] : [1, 1, 1, 1, 1, 1, 1]
  );

  const targetY = useTransform(
    distance,
    [-160, -110, -55, 0, 55, 110, 160],
    isEnabled ? [0, cfg.outerLift, cfg.adjacentLift, cfg.centerLift, cfg.adjacentLift, cfg.outerLift, 0] : [0, 0, 0, 0, 0, 0, 0]
  );

  const targetBrightness = useTransform(
    distance,
    [-160, -110, -55, 0, 55, 110, 160],
    isEnabled ? [1, 1.01, 1.03, cfg.brightnessPeak, 1.03, 1.01, 1] : [1, 1, 1, 1, 1, 1, 1]
  );

  const scale = useSpring(targetScale, SPRING_CONFIG);
  const y = useSpring(targetY, SPRING_CONFIG);
  const brightness = useSpring(targetBrightness, SPRING_CONFIG);

  const filter = useTransform(brightness, (b) => `brightness(${b})`);
  const gradient = AppNormalizer.getAppGradient(app.name);

  return (
    <motion.div
      ref={itemRef}
      style={{
        scale,
        y,
        filter
      }}
      whileTap={{ scale: 0.94 }}
      className="relative flex flex-col items-center group cursor-pointer origin-bottom will-change-transform select-none"
      onClick={() => onLaunch(app.id)}
    >
      {/* Optional Minimal Tooltip (shown ONLY if showTooltips enabled) */}
      {showTooltips && (
        <div className="absolute -top-8 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-medium tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg border border-white/10">
          {app.name}
        </div>
      )}

      {/* Icon */}
      <div
        style={{ width: `${dockSize}px`, height: `${dockSize}px` }}
        className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-200 bg-slate-900 flex items-center justify-center"
      >
        {app.icon ? (
          <img
            src={app.icon}
            alt={app.name}
            className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base sm:text-lg`}>
            {app.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Dot indicator beneath active / recent apps */}
      <div className="h-1.5 flex items-center justify-center mt-1">
        {isActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        ) : isRecent ? (
          <span className="w-1 h-1 rounded-full bg-white/70" />
        ) : null}
      </div>
    </motion.div>
  );
});

interface DockActionButtonProps {
  mouseX: MotionValue<number>;
  dockSize: number;
  title: string;
  ariaLabel: string;
  icon: React.ReactNode;
  variant?: 'default' | 'accent';
  dockMagnification: boolean;
  shouldReduceMotion: boolean;
  onClick: () => void;
}

const DockActionButton: React.FC<DockActionButtonProps> = React.memo(({
  mouseX,
  dockSize,
  title,
  ariaLabel,
  icon,
  variant = 'default',
  dockMagnification,
  shouldReduceMotion,
  onClick
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    if (val === Infinity || !btnRef.current) return Infinity;
    const bounds = btnRef.current.getBoundingClientRect();
    return val - (bounds.x + bounds.width / 2);
  });

  const isEnabled = dockMagnification && !shouldReduceMotion;
  const cfg = WALLIX_MOTION_CONFIG.dock;

  const targetScale = useTransform(
    distance,
    [-140, -90, -45, 0, 45, 90, 140],
    isEnabled ? [1, cfg.actionOuterScale, cfg.actionAdjacentScale, cfg.actionMaxScale, cfg.actionAdjacentScale, cfg.actionOuterScale, 1] : [1, 1, 1, 1, 1, 1, 1]
  );

  const targetY = useTransform(
    distance,
    [-140, -90, -45, 0, 45, 90, 140],
    isEnabled ? [0, cfg.actionOuterLift, cfg.actionAdjacentLift, cfg.actionCenterLift, cfg.actionAdjacentLift, cfg.actionOuterLift, 0] : [0, 0, 0, 0, 0, 0, 0]
  );

  const scale = useSpring(targetScale, SPRING_CONFIG);
  const y = useSpring(targetY, SPRING_CONFIG);

  return (
    <motion.button
      ref={btnRef}
      style={{
        scale,
        y,
        width: `${dockSize}px`,
        height: `${dockSize}px`
      }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={`rounded-xl sm:rounded-2xl border flex items-center justify-center cursor-pointer group origin-bottom will-change-transform select-none ${
        variant === 'accent'
          ? 'bg-white/15 hover:bg-white/25 border-white/25 text-white shadow-md'
          : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80 hover:text-white'
      }`}
    >
      {icon}
    </motion.button>
  );
});

export const AppDock: React.FC<AppDockProps> = ({
  dockApps,
  recentAppIds,
  activeAppId,
  dockSize = 52,
  dockBlur = 32,
  dockOpacity = 45,
  showTooltips = false,
  dockMagnification = true,
  onLaunch,
  onToggleManager,
  onOpenManualAdd
}) => {
  const mouseX = useMotionValue(Infinity);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const rafId = useRef<number | null>(null);

  // RAF-throttled pointer tracking for continuous 60fps+ motion without React state re-renders
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const pageX = e.pageX;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      mouseX.set(pageX);
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    mouseX.set(Infinity);
  };

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center pointer-events-auto">
      <motion.nav
        id="wallix-native-app-dock"
        aria-label="Application Dock"
        style={{
          backdropFilter: `blur(${dockBlur}px)`,
          WebkitBackdropFilter: `blur(${dockBlur}px)`,
          backgroundColor: `rgba(255, 255, 255, ${(dockOpacity / 100) * 0.25})`,
          boxShadow: '0 20px 45px -10px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.18)'
        }}
        whileHover={{
          boxShadow: '0 24px 50px -10px rgba(0,0,0,0.52), 0 0 0 1px rgba(255,255,255,0.22)'
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-end gap-2 sm:gap-2.5 px-3 py-2 rounded-2xl sm:rounded-3xl border border-white/20 will-change-transform"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {dockApps.map((app) => {
          const isRecent = recentAppIds.includes(app.id);
          const isActive = activeAppId === app.id;

          return (
            <DockItem
              key={app.id}
              mouseX={mouseX}
              app={app}
              dockSize={dockSize}
              isActive={isActive}
              isRecent={isRecent}
              showTooltips={showTooltips}
              dockMagnification={dockMagnification}
              shouldReduceMotion={shouldReduceMotion}
              onLaunch={onLaunch}
            />
          );
        })}

        {/* Straight Clean Vertical Divider */}
        <div className="w-[1px] h-8 bg-white/20 mx-1 self-center" />

        {/* Manual Add Shortcut */}
        <DockActionButton
          mouseX={mouseX}
          dockSize={dockSize}
          title="Add Application Shortcut"
          ariaLabel="Add Application Shortcut"
          icon={<Plus className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" />}
          dockMagnification={dockMagnification}
          shouldReduceMotion={shouldReduceMotion}
          onClick={onOpenManualAdd}
        />

        {/* 2x2 Grid Folder Icon (Opens All Apps Manager) */}
        <DockActionButton
          mouseX={mouseX}
          dockSize={dockSize}
          title="Manage Applications & Grid"
          ariaLabel="Launchpad / Manage Applications"
          icon={<LayoutGrid className="w-5 h-5 text-white/90 group-hover:scale-105 group-hover:text-blue-300 transition-all duration-200" />}
          variant="accent"
          dockMagnification={dockMagnification}
          shouldReduceMotion={shouldReduceMotion}
          onClick={onToggleManager}
        />
      </motion.nav>
    </div>
  );
};
