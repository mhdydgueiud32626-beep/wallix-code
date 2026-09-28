import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Square, 
  HardDrive, 
  FolderOpen, 
  Settings, 
  Trash2, 
  Sparkles, 
  Shield, 
  Check, 
  Terminal as TerminalIcon,
  Monitor,
  Folder,
  Layers,
  Globe,
  Compass,
  Music,
  Clock as ClockIcon,
  Search,
  ExternalLink,
  RotateCw,
  Lock,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { Wallpaper } from '../../../types';

export type WindowLifecycleState = 'closed' | 'opening' | 'open' | 'active' | 'minimized' | 'closing';

export interface WindowsAppWindowProps {
  appId: string;
  lifecycleState: WindowLifecycleState;
  isActive: boolean;
  isMaximized: boolean;
  dockOrigin: { x: number; y: number } | null;
  exitMode?: 'minimize' | 'close';
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onToggleMaximize: () => void;
  onAnimationComplete?: (finalState: 'open' | 'minimized' | 'closed') => void;
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  onSelectWallpaper: (w: Wallpaper) => void;
  containerBounds: { width: number; height: number };
}

export const WindowsAppWindow: React.FC<WindowsAppWindowProps> = ({
  appId,
  lifecycleState,
  isActive,
  isMaximized,
  dockOrigin,
  exitMode,
  onFocus,
  onMinimize,
  onClose,
  onToggleMaximize,
  onAnimationComplete,
  wallpapers,
  activeWallpaper,
  onSelectWallpaper,
  containerBounds,
}) => {
  // Standard window dimensions: comfortable macOS desktop window proportion
  const standardWidth = Math.min(560, Math.max(340, containerBounds.width - 40));
  const standardHeight = Math.min(410, Math.max(280, containerBounds.height - 120));

  // Initial centered position within desktop workspace
  const defaultX = Math.max(16, Math.round((containerBounds.width - standardWidth) / 2));
  const defaultY = Math.max(24, Math.round((containerBounds.height - standardHeight) / 2 - 20));

  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: defaultX,
    initY: defaultY,
  });

  // Keep window in bounds if container size changes
  useEffect(() => {
    setPosition((prev) => ({
      x: Math.max(10, Math.min(containerBounds.width - 200, prev.x)),
      y: Math.max(10, Math.min(containerBounds.height - 120, prev.y)),
    }));
  }, [containerBounds.width, containerBounds.height]);

  // Dragging by Titlebar
  const handleTitlebarMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    onFocus();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(8, Math.min(containerBounds.width - standardWidth - 8, dragStartRef.current.initX + dx));
      const newY = Math.max(8, Math.min(containerBounds.height - standardHeight - 50, dragStartRef.current.initY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, containerBounds, standardWidth, standardHeight]);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'WALLIX PowerShell v11.4 [DirectX 12 / Metal GPU Shader Pipeline]',
    'Copyright (C) 2026 WALLIX Studio. All rights reserved.',
    '',
    'Type "help", "neofetch", "wallpapers", "status", or "clear".',
  ]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let reply = '';
    if (cmd === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'help') {
      reply = 'Available commands: help, neofetch, wallpapers, status, clear';
    } else if (cmd === 'neofetch') {
      reply = `OS: WALLIX macOS Sequoia Edition\nShell: zsh / WALLIX Native Bridge 2.4\nKernel: Darwin 24.1.0\nTheme: Liquid Frosted Glass (DirectX 12)\nMemory: 3.2 GB / 16.0 GB`;
    } else if (cmd === 'wallpapers') {
      reply = `Active Wallpaper: "${activeWallpaper.title}" (${activeWallpaper.resolution})\nTotal in library: ${wallpapers.length}`;
    } else if (cmd === 'status') {
      reply = 'System: Ready | Pacing: 120 FPS | Window Spring: Stiff 350 / Damp 25';
    } else {
      reply = `zsh: command not found: "${cmd}". Type "help" for a list of commands.`;
    }

    setTerminalLogs((prev) => [...prev, `PS WALLIX> ${terminalInput}`, reply, '']);
    setTerminalInput('');
  };

  // Browser State for Safari View
  const [browserUrl, setBrowserUrl] = useState('https://wallix.studio/explore');

  // Compute exact delta vector between window center and the specific clicked Dock icon
  // This guarantees authentic scale emergence from the exact Dock icon location!
  const windowWidth = isMaximized ? containerBounds.width - 32 : standardWidth;
  const windowHeight = isMaximized ? containerBounds.height - 120 : standardHeight;
  const currentLeft = isMaximized ? 16 : position.x;
  const currentTop = isMaximized ? 38 : position.y;

  const windowCenterX = currentLeft + windowWidth / 2;
  const windowCenterY = currentTop + windowHeight / 2;

  // Safe fallback if dockOrigin is not yet registered
  const originX = dockOrigin?.x ?? containerBounds.width / 2;
  const originY = dockOrigin?.y ?? containerBounds.height - 35;

  const deltaX = originX - windowCenterX;
  const deltaY = originY - windowCenterY;

  // Track minimize vs close exit mode
  const [exitTarget, setExitTarget] = useState<'minimize' | 'close'>('minimize');
  const effectiveExit = exitMode || exitTarget;

  const handleTriggerMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExitTarget('minimize');
    onMinimize();
  };

  const handleTriggerClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExitTarget('close');
    onClose();
  };

  const getWindowTitle = () => {
    switch (appId) {
      case 'browser':
      case 'safari':
      case 'messages':
        return 'Safari - Apple Web Engine';
      case 'projects':
      case 'photos':
      case 'pinterest':
      case 'mail':
        return 'Photos - Wallpaper Projects Gallery';
      case 'terminal':
      case 'chatgpt':
        return 'PowerShell - WALLIX CLI';
      case 'settings':
        return 'System Personalization & Settings';
      case 'control-panel':
      case 'calendar':
        return 'Calendar & System Controls';
      case 'clock':
        return 'World Clock & Time Engine';
      case 'this-pc':
      case 'notes':
        return 'Notes & Cloud Storage';
      default:
        return 'WALLIX Application';
    }
  };

  const getWindowIcon = () => {
    switch (appId) {
      case 'browser':
      case 'safari':
      case 'messages':
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case 'projects':
      case 'photos':
      case 'pinterest':
      case 'mail':
        return <FolderOpen className="w-3.5 h-3.5 text-pink-400" />;
      case 'terminal':
      case 'chatgpt':
        return <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'settings':
        return <Settings className="w-3.5 h-3.5 text-indigo-400" />;
      case 'control-panel':
      case 'calendar':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'clock':
        return <ClockIcon className="w-3.5 h-3.5 text-orange-400" />;
      case 'this-pc':
      case 'notes':
        return <HardDrive className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // macOS Window Animation Physics:
  // Stiffness 350, Damping 25 as strictly requested by user specifications
  const springTransition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 25,
    mass: 0.85,
  };

  return (
    <motion.div
      key={appId}
      initial={{
        x: deltaX,
        y: deltaY,
        scale: 0.06,
        opacity: 0,
        filter: 'blur(8px)',
      }}
      animate={{
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
      }}
      exit={
        effectiveExit === 'minimize'
          ? {
              x: deltaX,
              y: deltaY,
              scale: 0.05,
              opacity: 0,
              filter: 'blur(6px)',
              transition: springTransition,
            }
          : {
              scale: 0.94,
              opacity: 0,
              filter: 'blur(4px)',
              transition: { duration: 0.16, ease: 'easeOut' },
            }
      }
      transition={springTransition}
      onAnimationComplete={(definition) => {
        if (definition === 'animate') {
          onAnimationComplete?.('open');
        }
      }}
      onClick={onFocus}
      style={{
        width: `${windowWidth}px`,
        height: `${windowHeight}px`,
        left: `${currentLeft}px`,
        top: `${currentTop}px`,
      }}
      className={`
        pointer-events-auto absolute flex flex-col rounded-[18px] overflow-hidden select-none
        bg-slate-950/85 backdrop-blur-3xl
        border border-white/18 border-t-white/35
        shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)]
        ${isActive ? 'z-30 ring-1 ring-white/20' : 'z-20 opacity-95'}
      `}
    >
      {/* Specular Top Reflection Line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

      {/* REFINED MACOS TITLEBAR */}
      <div
        onMouseDown={handleTitlebarMouseDown}
        onDoubleClick={onToggleMaximize}
        className={`
          h-10 px-3.5 border-b flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0 z-10 transition-colors
          ${isActive ? 'bg-white/[0.04] border-white/12' : 'bg-black/40 border-white/8'}
        `}
      >
        {/* Left: macOS Traffic Lights (Red Close, Yellow Minimize, Green Maximize) */}
        <div className="flex items-center gap-2 group/controls py-1">
          {/* Red Close Control */}
          <button
            type="button"
            onClick={handleTriggerClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/80 hover:brightness-110 active:brightness-90 flex items-center justify-center text-black/60 hover:text-black transition shadow-xs cursor-pointer"
            title="Close"
          >
            <X className="w-2 h-2 opacity-0 group-hover/controls:opacity-100 transition-opacity" />
          </button>

          {/* Yellow Minimize Control */}
          <button
            type="button"
            onClick={handleTriggerMinimize}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/80 hover:brightness-110 active:brightness-90 flex items-center justify-center text-black/60 hover:text-black transition shadow-xs cursor-pointer"
            title="Minimize to Dock"
          >
            <Minus className="w-2 h-2 opacity-0 group-hover/controls:opacity-100 transition-opacity" />
          </button>

          {/* Green Maximize Control */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/80 hover:brightness-110 active:brightness-90 flex items-center justify-center text-black/60 hover:text-black transition shadow-xs cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="w-1.5 h-1.5 opacity-0 group-hover/controls:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Center: App Icon and Title */}
        <div className="flex items-center gap-2 px-2 max-w-[65%] truncate">
          {getWindowIcon()}
          <span className={`text-xs font-semibold tracking-wide truncate ${isActive ? 'text-white/95' : 'text-white/60'}`}>
            {getWindowTitle()}
          </span>
        </div>

        {/* Right: Elegant Balance Spacer */}
        <div className="w-14 flex items-center justify-end">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>

      {/* WINDOW BODY VIEWPORTS */}
      <div className="flex-1 p-4 overflow-y-auto text-slate-200 focus:outline-none">
        {/* 1. SAFARI / BROWSER / MESSAGES VIEW */}
        {(appId === 'browser' || appId === 'safari' || appId === 'messages') && (
          <div className="h-full flex flex-col space-y-3">
            {/* Safari Address Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs">
              <Lock className="w-3.5 h-3.5 text-white/50 ml-1.5 shrink-0" />
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white/90 font-mono text-[11px] truncate"
              />
              <button className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition">
                <RotateCw className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Favorites Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { name: 'WALLIX Studio', url: 'https://wallix.studio' },
                { name: 'Wallpaper Hub', url: 'https://wallpapers.wallix' },
                { name: 'DirectX Shaders', url: 'https://shaders.dev' },
                { name: 'Apple HIG', url: 'https://developer.apple.com' },
              ].map((b) => (
                <button
                  key={b.name}
                  onClick={() => setBrowserUrl(b.url)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
                >
                  <Bookmark className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{b.name}</span>
                </button>
              ))}
            </div>

            {/* Browser Content Canvas */}
            <div className="flex-1 rounded-xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-black border border-white/10 p-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">WALLIX High-Performance Web Engine</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Fully hardware-accelerated rendering inside the active live desktop container.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono">
                  HTTPS Secure
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono">
                  Zero Jitter
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. PHOTOS / WALLPAPERS GALLERY (projects, photos, pinterest, mail) */}
        {(appId === 'projects' || appId === 'photos' || appId === 'pinterest' || appId === 'mail') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-white tracking-wide">Wallpaper Projects Gallery ({wallpapers.length})</h4>
              <span className="text-[10px] text-pink-400 font-mono">Click to preview live</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {wallpapers.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWallpaper(w)}
                  className={`p-1.5 rounded-xl border cursor-pointer transition group ${
                    activeWallpaper.id === w.id
                      ? 'bg-pink-600/20 border-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <img
                    src={w.thumbnailUrl || w.imageUrl}
                    alt={w.title}
                    className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <p className="text-xs font-medium text-white truncate mt-1.5">{w.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{w.resolution}</span>
                    {activeWallpaper.id === w.id && (
                      <span className="text-pink-400 font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TERMINAL / CHATGPT CLI */}
        {(appId === 'terminal' || appId === 'chatgpt') && (
          <div className="h-full flex flex-col font-mono text-xs text-emerald-400 bg-black/70 p-3.5 rounded-xl border border-emerald-500/25 shadow-inner">
            <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1">
              {terminalLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-emerald-500/25">
              <span className="text-blue-400 font-bold shrink-0">PS WALLIX&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type 'help' or 'wallpapers'..."
                className="flex-1 bg-transparent border-none outline-none text-emerald-300 placeholder-emerald-800 text-xs"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* 4. SETTINGS VIEW */}
        {appId === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30">
              <Monitor className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">System Personalization</h4>
                <p className="text-[10px] text-slate-400">Liquid Acrylic Blur, Baseline Anchoring & High-DPI Scaling</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Active Wallpaper</p>
                  <p className="text-[10px] text-slate-400">{activeWallpaper.title}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                  {activeWallpaper.resolution}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Spring Animation Engine</p>
                  <p className="text-[10px] text-slate-400">Stiffness 350 | Damping 25 | In-Place Origin</p>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. NOTES & THIS PC */}
        {(appId === 'this-pc' || appId === 'notes') && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
              Drives & Cloud Volumes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-xs font-bold text-white">Macintosh HD</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[64%]" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">312 GB free of 1.00 TB</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold text-white">iCloud Drive</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[82%]" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">1.84 TB free of 10.0 TB</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <h5 className="text-[11px] font-semibold text-slate-400">Recent Notes</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['macOS Dock Wave', 'Wallpaper Engine', 'DirectX Shaders'].map((f) => (
                  <div key={f} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. CLOCK VIEW */}
        {appId === 'clock' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
              World Clock & Time Zones
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { city: 'Cupertino', time: '03:45 AM', offset: 'Local Time (PST)' },
                { city: 'Tokyo', time: '08:45 PM', offset: '+17 hrs ahead (JST)' },
                { city: 'London', time: '11:45 AM', offset: '+8 hrs ahead (GMT)' },
                { city: 'Zurich', time: '12:45 PM', offset: '+9 hrs ahead (CET)' },
              ].map((c) => (
                <div key={c.city} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{c.city}</p>
                    <p className="text-[10px] text-slate-400">{c.offset}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-400 font-mono">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. CALENDAR & CONTROL PANEL */}
        {(appId === 'control-panel' || appId === 'calendar') && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">System & Security Controls</h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <p className="font-semibold text-white">Gatekeeper Protection</p>
                <p className="text-[10px] text-slate-400">App sandbox verified. No malware detected.</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <Layers className="w-4 h-4 text-cyan-400" />
                <p className="font-semibold text-white">Acrylic Compositor</p>
                <p className="text-[10px] text-slate-400">Real-time backdrop filters active at 120 FPS.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
