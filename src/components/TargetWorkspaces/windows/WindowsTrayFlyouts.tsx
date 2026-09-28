import React, { useState } from 'react';
import { 
  Wifi, 
  Volume2, 
  VolumeX, 
  Battery, 
  Clock, 
  Search, 
  HardDrive, 
  FolderOpen, 
  Globe, 
  Settings, 
  Cpu, 
  Sparkles, 
  Download, 
  Power, 
  Check, 
  ChevronRight,
  Bluetooth,
  Moon,
  Sun,
  Shield,
  Cast
} from 'lucide-react';
import { Wallpaper } from '../../../types';

interface WindowsTrayFlyoutsProps {
  activeFlyout: 'start' | 'wifi' | 'volume' | 'battery' | 'clock' | null;
  onClose: () => void;
  onOpenAppWindow: (appId: string) => void;
  wallpapers: Wallpaper[];
  onSelectWallpaper: (w: Wallpaper) => void;
  clockFormat: '12h' | '24h';
}

export const WindowsTrayFlyouts: React.FC<WindowsTrayFlyoutsProps> = ({
  activeFlyout,
  onClose,
  onOpenAppWindow,
  wallpapers,
  onSelectWallpaper,
  clockFormat,
}) => {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [nightLightEnabled, setNightLightEnabled] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(82);
  const [isMuted, setIsMuted] = useState(false);
  const [powerMode, setPowerMode] = useState<'efficiency' | 'balanced' | 'performance'>('performance');
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeFlyout) return null;

  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: clockFormat === '12h',
  });
  const formattedDate = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="absolute z-40 select-none animate-in slide-in-from-bottom-3 fade-in-80 duration-150"
    >
      {/* ========================================================================= */}
      {/* 1. START MENU */}
      {/* ========================================================================= */}
      {activeFlyout === 'start' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[400px] max-w-[92vw] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type here to search apps and wallpapers..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          {/* Pinned Apps Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>Pinned Applications</span>
              <span className="text-blue-400 hover:text-blue-300 text-[11px] cursor-pointer">All apps →</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'this-pc', name: 'This PC', icon: <HardDrive className="w-5 h-5 text-blue-400" /> },
                { id: 'projects', name: 'Projects', icon: <FolderOpen className="w-5 h-5 text-amber-400" /> },
                { id: 'terminal', name: 'Terminal', icon: <Cpu className="w-5 h-5 text-emerald-400" /> },
                { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5 text-indigo-400" /> },
                { id: 'wallpapers', name: 'Wallpapers', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
                { id: 'browser', name: 'Browser', icon: <Globe className="w-5 h-5 text-cyan-400" /> },
                { id: 'recycle-bin', name: 'Recycle Bin', icon: <Download className="w-5 h-5 text-rose-400" /> },
                { id: 'control-panel', name: 'Control Panel', icon: <Shield className="w-5 h-5 text-teal-400" /> },
              ].map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    onClose();
                    onOpenAppWindow(app.id);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition group"
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                    {app.icon}
                  </div>
                  <span className="text-[10px] text-slate-200 font-medium text-center truncate w-full">
                    {app.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Wallpapers */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold px-1">Recommended for You</span>
            <div className="grid grid-cols-3 gap-2">
              {wallpapers.slice(0, 3).map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    onSelectWallpaper(w);
                    onClose();
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition group"
                >
                  <img
                    src={w.thumbnailUrl || w.imageUrl}
                    alt={w.title}
                    className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <p className="text-[10px] text-slate-300 font-medium truncate mt-1">{w.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User & Power Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow">
                W
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">WALLIX Studio User</p>
                <p className="text-[9px] text-emerald-400 font-mono">Simulated Workspace</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
              title="Close Start Menu"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WI-FI FLYOUT */}
      {/* ========================================================================= */}
      {activeFlyout === 'wifi' && (
        <div className="absolute bottom-16 right-20 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Network & Internet</span>
            </div>
            <button
              onClick={() => setWifiEnabled(!wifiEnabled)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                wifiEnabled ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {wifiEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {wifiEnabled ? (
            <div className="space-y-1.5">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-white">WALLIX_5G_ULTRA</p>
                    <p className="text-[10px] text-emerald-400">Connected, Secured (1.2 Gbps)</p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-blue-400" />
              </div>

              {[
                { name: 'CyberSphere_Guest', signal: 'Strong' },
                { name: 'Studio_Fiber_WiFi6', signal: 'Good' },
              ].map((net, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300 font-medium">{net.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{net.signal}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Wi-Fi is currently turned off.
            </div>
          )}

          {/* Quick tiles */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium transition cursor-pointer ${
                bluetoothEnabled ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Bluetooth</span>
            </button>
            <button
              onClick={() => setNightLightEnabled(!nightLightEnabled)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium transition cursor-pointer ${
                nightLightEnabled ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Night Light</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium bg-white/5 text-slate-400 hover:bg-white/10 transition cursor-pointer"
            >
              <Cast className="w-3.5 h-3.5" />
              <span>Cast</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VOLUME FLYOUT */}
      {/* ========================================================================= */}
      {activeFlyout === 'volume' && (
        <div className="absolute bottom-16 right-16 w-72 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              {isMuted || volumeLevel === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
              <span>Master Sound Output</span>
            </h4>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {isMuted ? 'Muted' : `${volumeLevel}%`}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volumeLevel}
              onChange={(e) => {
                setVolumeLevel(parseInt(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-white cursor-pointer"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <span>Dolby Atmos for Headphones</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BATTERY FLYOUT */}
      {/* ========================================================================= */}
      {activeFlyout === 'battery' && (
        <div className="absolute bottom-16 right-10 w-76 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span>Power & Battery</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400 font-bold">94% (AC Power)</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[94%]" />
          </div>
          <p className="text-[10px] text-slate-400">Plugged in, fast charging active. 8h 45m remaining.</p>

          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold">Power Mode</span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {[
                { id: 'efficiency', label: 'Saver' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'performance', label: 'Gaming' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPowerMode(m.id as any)}
                  className={`py-1 rounded-lg font-medium transition cursor-pointer text-center ${
                    powerMode === m.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CLOCK / CALENDAR FLYOUT */}
      {/* ========================================================================= */}
      {activeFlyout === 'clock' && (
        <div className="absolute bottom-16 right-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="text-center pb-2 border-b border-white/10">
            <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{formattedTime}</h3>
            <p className="text-xs text-blue-400 font-medium">{formattedDate}</p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="text-slate-500 font-bold py-0.5">{d}</span>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isToday = day === now.getDate();
                return (
                  <div
                    key={day}
                    className={`py-1 rounded-lg text-[11px] transition ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'text-slate-300 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>WALLIX Clock Widget</span>
            <span className="text-emerald-400 font-mono">Synchronized</span>
          </div>
        </div>
      )}
    </div>
  );
};
