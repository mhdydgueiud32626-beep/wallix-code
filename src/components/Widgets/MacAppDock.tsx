import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { 
  Globe, 
  Music, 
  MessageSquare, 
  Code, 
  ImageIcon, 
  Play, 
  Terminal, 
  Gamepad2, 
  Plus, 
  Sparkles, 
  X, 
  Trash2,
  Monitor,
  Zap
} from 'lucide-react';
import { WALLIX_GLASS_TOKENS } from '../../config/wallixGlassTokens';
import { AppDrawerLauncher } from './AppDrawerLauncher';

export type DockAppCategory = 'Media' | 'Tools' | 'Social' | 'Browser' | 'Developer' | 'Audio' | 'Gaming' | 'Design' | 'Communication';

export interface DockApp {
  id: string;
  name: string;
  category: DockAppCategory | string;
  uriOrUrl: string;
  iconType: 'preset' | 'image';
  iconKey: string;
  color?: string;
  isRunning?: boolean;
}

export const DEFAULT_DOCK_APPS: DockApp[] = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    category: 'Browser',
    uriOrUrl: 'https://google.com',
    iconType: 'preset',
    iconKey: 'globe',
    isRunning: true
  },
  {
    id: 'spotify',
    name: 'Spotify Music',
    category: 'Audio',
    uriOrUrl: 'spotify:',
    iconType: 'preset',
    iconKey: 'music',
    isRunning: true
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'Social',
    uriOrUrl: 'discord:',
    iconType: 'preset',
    iconKey: 'message',
    isRunning: false
  },
  {
    id: 'vscode',
    name: 'VS Code Studio',
    category: 'Developer',
    uriOrUrl: 'vscode:',
    iconType: 'preset',
    iconKey: 'code',
    isRunning: true
  },
  {
    id: 'photoshop',
    name: 'Adobe Creative Suite',
    category: 'Tools',
    uriOrUrl: 'photoshop:',
    iconType: 'preset',
    iconKey: 'image',
    isRunning: false
  },
  {
    id: 'youtube',
    name: 'YouTube Media',
    category: 'Media',
    uriOrUrl: 'https://youtube.com',
    iconType: 'preset',
    iconKey: 'play',
    isRunning: false
  },
  {
    id: 'terminal',
    name: 'Terminal CLI',
    category: 'Developer',
    uriOrUrl: 'cmd:',
    iconType: 'preset',
    iconKey: 'terminal',
    isRunning: true
  },
  {
    id: 'steam',
    name: 'Steam Games',
    category: 'Social',
    uriOrUrl: 'steam:',
    iconType: 'preset',
    iconKey: 'gamepad',
    isRunning: false
  }
];

export const PRESET_ICONS = [
  { key: 'globe', label: 'Web Browser', icon: Globe },
  { key: 'music', label: 'Audio Player', icon: Music },
  { key: 'message', label: 'Chat / Social', icon: MessageSquare },
  { key: 'code', label: 'Code Editor', icon: Code },
  { key: 'image', label: 'Photo / Design', icon: ImageIcon },
  { key: 'play', label: 'Video / Stream', icon: Play },
  { key: 'terminal', label: 'Terminal / CLI', icon: Terminal },
  { key: 'gamepad', label: 'Gaming Client', icon: Gamepad2 },
  { key: 'sparkles', label: 'AI Engine', icon: Sparkles }
];

export const getDockCategoryStyle = (category: string) => {
  const cat = (category || '').toLowerCase();

  if (cat.includes('audio') || cat.includes('music') || cat.includes('media') || cat.includes('video') || cat.includes('stream')) {
    return {
      gradient: 'from-cyan-500 via-sky-600 to-blue-700',
      glowShadow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]',
      borderGlow: 'group-hover:border-cyan-300',
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30',
      groupName: 'Media & Audio'
    };
  }

  if (cat.includes('dev') || cat.includes('code') || cat.includes('tool') || cat.includes('system') || cat.includes('cli') || cat.includes('terminal') || cat.includes('design') || cat.includes('util')) {
    return {
      gradient: 'from-purple-600 via-indigo-600 to-fuchsia-700',
      glowShadow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]',
      borderGlow: 'group-hover:border-purple-300',
      badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-500/30',
      groupName: 'Tools & System'
    };
  }

  return {
    gradient: 'from-amber-400 via-orange-500 to-rose-600',
    glowShadow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)]',
    borderGlow: 'group-hover:border-rose-300',
    badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-500/30',
    groupName: 'Browser & Social'
  };
};

const renderAppIconStatic = (app: DockApp) => {
  const iconClass = "w-6 h-6 sm:w-6.5 sm:h-6.5 text-white drop-shadow-md";

  switch (app.iconKey) {
    case 'globe': return <Globe className={iconClass} />;
    case 'music': return <Music className={iconClass} />;
    case 'message': return <MessageSquare className={iconClass} />;
    case 'code': return <Code className={iconClass} />;
    case 'image': return <ImageIcon className={iconClass} />;
    case 'play': return <Play className={iconClass} />;
    case 'terminal': return <Terminal className={iconClass} />;
    case 'gamepad': return <Gamepad2 className={iconClass} />;
    case 'sparkles': return <Sparkles className={iconClass} />;
    default: return <Zap className={iconClass} />;
  }
};

interface DockItemProps {
  app: DockApp;
  mouseX: any;
  categoryStyle: any;
  isBouncing: boolean;
  onLaunch: (app: DockApp) => void;
}

const DockItem: React.FC<DockItemProps> = ({ app, mouseX, categoryStyle, isBouncing, onLaunch }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const element = ref.current;
    if (!element || val === Infinity) return 9999;
    const rect = element.getBoundingClientRect();
    const itemCenter = rect.left + rect.width / 2;
    return val - itemCenter;
  });

  // Authentic macOS Gaussian bell-curve falloff:
  // Base 1.0x, directly hovered ~1.60x, neighbors ~1.34x, outer ~1.08x
  const rawScale = useTransform(distance, (d: number) => {
    const absD = Math.abs(d);
    if (absD >= 135) return 1.0;
    const sigma = 44;
    const factor = Math.exp(-(absD * absD) / (2 * sigma * sigma));
    return 1.0 + 0.60 * factor;
  });

  const scale = useSpring(rawScale, { stiffness: 400, damping: 28, mass: 0.12 });
  const zIndex = useTransform(rawScale, (s: number) => {
    if (s <= 1.01) return 10;
    return Math.round(10 + (s - 1.0) * 100);
  });

  return (
    <motion.div 
      ref={ref} 
      style={{ scale, transformOrigin: 'bottom center', zIndex }}
      className="relative flex flex-col items-center group shrink-0 select-none"
    >
      <button
        type="button"
        onClick={() => onLaunch(app)}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${categoryStyle.gradient} p-0.5 flex items-center justify-center shadow-lg border border-white/30 ${categoryStyle.borderGlow} ${categoryStyle.glowShadow} transition-colors duration-200 cursor-pointer ${isBouncing ? 'bouncing' : ''}`}
        title={app.name}
      >
        {/* Specular Highlight */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-black/30 pointer-events-none" />
        
        {/* Icon Graphic */}
        <div className="relative z-10 flex items-center justify-center">
          {renderAppIconStatic(app)}
        </div>
      </button>

      {/* Tiny, softly glowing, white, subtle, centered, stable active indicator */}
      <div className="h-1.5 flex items-center justify-center mt-0.5 pointer-events-none">
        {app.isRunning && (
          <span className="w-1 h-1 rounded-full bg-white/95 active-dot scale-100 opacity-100" />
        )}
      </div>
    </motion.div>
  );
};

const AddDockItem: React.FC<{ mouseX: any; onClick: () => void }> = ({ mouseX, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const element = ref.current;
    if (!element || val === Infinity) return 9999;
    const rect = element.getBoundingClientRect();
    const itemCenter = rect.left + rect.width / 2;
    return val - itemCenter;
  });

  const rawScale = useTransform(distance, (d: number) => {
    const absD = Math.abs(d);
    if (absD >= 135) return 1.0;
    const sigma = 44;
    const factor = Math.exp(-(absD * absD) / (2 * sigma * sigma));
    return 1.0 + 0.60 * factor;
  });

  const scale = useSpring(rawScale, { stiffness: 400, damping: 28, mass: 0.12 });
  const zIndex = useTransform(rawScale, (s: number) => {
    if (s <= 1.01) return 10;
    return Math.round(10 + (s - 1.0) * 100);
  });

  return (
    <motion.div 
      ref={ref} 
      style={{ scale, transformOrigin: 'bottom center', zIndex }}
      className="relative flex flex-col items-center shrink-0 select-none"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-white/25 to-white/10 hover:from-cyan-500/30 hover:to-indigo-600/30 backdrop-blur-md border border-white/25 hover:border-cyan-400/70 hover:shadow-[0_0_18px_rgba(6,182,212,0.5)] text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer group"
        title="Add Custom Application"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 via-transparent to-black/20 pointer-events-none" />
        <Plus className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
      </button>
      <div className="h-1.5 mt-0.5" />
    </motion.div>
  );
};

const LaunchpadDockItem: React.FC<{ mouseX: any; onClick: () => void }> = ({ mouseX, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const element = ref.current;
    if (!element || val === Infinity) return 9999;
    const rect = element.getBoundingClientRect();
    const itemCenter = rect.left + rect.width / 2;
    return val - itemCenter;
  });

  const rawScale = useTransform(distance, (d: number) => {
    const absD = Math.abs(d);
    if (absD >= 135) return 1.0;
    const sigma = 44;
    const factor = Math.exp(-(absD * absD) / (2 * sigma * sigma));
    return 1.0 + 0.60 * factor;
  });

  const scale = useSpring(rawScale, { stiffness: 400, damping: 28, mass: 0.12 });
  const zIndex = useTransform(rawScale, (s: number) => {
    if (s <= 1.01) return 10;
    return Math.round(10 + (s - 1.0) * 100);
  });

  return (
    <motion.div 
      ref={ref} 
      style={{ scale, transformOrigin: 'bottom center', zIndex }}
      className="relative flex flex-col items-center shrink-0 select-none"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-slate-700/80 to-slate-900/90 hover:from-cyan-600/60 hover:to-blue-800/80 backdrop-blur-md border border-white/25 hover:border-cyan-400 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer group"
        title="App Drawer / Launchpad"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 via-transparent to-black/30 pointer-events-none" />
        <svg className="w-5 h-5 text-white/90 group-hover:text-cyan-200 transition-colors" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>
      <div className="h-1.5 mt-0.5" />
    </motion.div>
  );
};

export const MacAppDock: React.FC = () => {
  const [apps, setApps] = useState<DockApp[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_dock_apps');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading dock storage', e);
    }
    return DEFAULT_DOCK_APPS;
  });

  const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Allow global events to toggle or open app drawer
  React.useEffect(() => {
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

  // New App Form State
  const [newAppName, setNewAppName] = useState('');
  const [newAppUri, setNewAppUri] = useState('');
  const [newAppCategory, setNewAppCategory] = useState<string>('Developer');
  const [newAppIconKey, setNewAppIconKey] = useState('sparkles');

  // MotionValue for high-frequency cursor proximity tracking without React re-renders
  const mouseX = useMotionValue(Infinity);

  const saveApps = (newApps: DockApp[]) => {
    setApps(newApps);
    try {
      localStorage.setItem('wallix_dock_apps', JSON.stringify(newApps));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLaunchApp = (app: DockApp) => {
    setBouncingAppId(app.id);
    setTimeout(() => setBouncingAppId(null), 720);

    const updated = apps.map((a) => (a.id === app.id ? { ...a, isRunning: true } : a));
    saveApps(updated);

    try {
      if ((window as any).wallix && typeof (window as any).wallix.launchApp === 'function') {
        (window as any).wallix.launchApp(app.uriOrUrl);
      } else {
        window.dispatchEvent(new CustomEvent('wallix:launch-app', { detail: { app } }));
      }
    } catch (e) {
      console.warn('Native launch dispatch error:', e);
    }

    setToastMessage(`Launching ${app.name}...`);
    setTimeout(() => setToastMessage(null), 3000);

    if (app.uriOrUrl.startsWith('http://') || app.uriOrUrl.startsWith('https://')) {
      window.open(app.uriOrUrl, '_blank', 'noopener,noreferrer');
    } else {
      try {
        const link = document.createElement('a');
        link.href = app.uriOrUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.log('Protocol handled via OS shell');
      }
    }
  };

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppUri.trim()) return;

    const newApp: DockApp = {
      id: 'app_' + Date.now(),
      name: newAppName.trim(),
      category: newAppCategory,
      uriOrUrl: newAppUri.trim(),
      iconType: 'preset',
      iconKey: newAppIconKey,
      isRunning: false
    };

    saveApps([...apps, newApp]);
    setNewAppName('');
    setNewAppUri('');
    setIsAddModalOpen(false);
    setToastMessage(`Added "${newApp.name}" to macOS Dock!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRemoveApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = apps.filter((a) => a.id !== id);
    saveApps(updated);
  };

  const handleResetDefaults = () => {
    saveApps(DEFAULT_DOCK_APPS);
    setIsAddModalOpen(false);
    setToastMessage('Dock restored to default macOS apps!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div 
      id="macos-horizontal-dock-container"
      className="relative z-40 pointer-events-auto flex flex-col items-center select-none"
    >
      {/* Toast Feedback for App Launch */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-2xl border border-cyan-400/50 text-cyan-200 text-xs font-mono font-bold shadow-xl flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTINUOUS LIQUID GLASS DOCK STRIP */}
      <div 
        className={WALLIX_GLASS_TOKENS.dock}
        onMouseMove={(e) => {
          mouseX.set(e.clientX);
        }}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {/* Top-edge specular reflection line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none rounded-t-[28px]" />

        {apps.map((app) => {
          const categoryStyle = getDockCategoryStyle(app.category);
          const isBouncing = bouncingAppId === app.id;

          return (
            <DockItem
              key={app.id}
              app={app}
              mouseX={mouseX}
              categoryStyle={categoryStyle}
              isBouncing={isBouncing}
              onLaunch={handleLaunchApp}
            />
          );
        })}

        {/* Separator Divider */}
        <div className="h-7 w-[1px] bg-white/20 mx-1" />

        {/* Add Custom App Button */}
        <AddDockItem
          mouseX={mouseX}
          onClick={() => setIsAddModalOpen(true)}
        />

        {/* App Drawer / Launchpad Button */}
        <LaunchpadDockItem
          mouseX={mouseX}
          onClick={() => setIsAppDrawerOpen(true)}
        />
      </div>

      {/* App Drawer Launcher Window */}
      <AppDrawerLauncher
        isOpen={isAppDrawerOpen}
        onClose={() => setIsAppDrawerOpen(false)}
        onLaunchApp={(app) => {
          setToastMessage(`Launched ${app.name} from Launchpad`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* ADD CUSTOM APP MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="w-full max-w-md rounded-3xl bg-slate-950/95 border border-cyan-400/40 p-6 shadow-2xl text-white space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-base tracking-wide">Add Custom Application</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddCustomApp} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">App Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Figma, Notion, Blender"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category (Auto Glow Accent)
                  </label>
                  <select
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 focus:border-cyan-400 text-sm text-white focus:outline-none"
                  >
                    <option value="Media">Media & Audio (Deep Blue / Neon Cyan Glow)</option>
                    <option value="Developer">Tools & Developer (Purple / Magenta Glow)</option>
                    <option value="Browser">Social & Browser (Warm Amber / Rose Glow)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    URI Scheme / Executable / URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. notion://, figma://, or https://chatgpt.com"
                    value={newAppUri}
                    onChange={(e) => setNewAppUri(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-sm font-mono text-cyan-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Preset Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = newAppIconKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setNewAppIconKey(item.key)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Existing Custom Apps List to delete */}
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Current Dock Apps</label>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {apps.map((app) => (
                      <div 
                        key={app.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                      >
                        <span className="truncate">{app.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveApp(app.id, e)}
                          className="text-rose-400 hover:text-rose-300 p-1 transition cursor-pointer"
                          title="Remove from dock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-xs text-slate-400 hover:text-cyan-300 transition underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg cursor-pointer"
                    >
                      Add App
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
