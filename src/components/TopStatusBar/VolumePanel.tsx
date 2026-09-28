import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1, Check } from 'lucide-react';
import { STATUS_GLASS_TOKENS } from './statusTokens';
import { AudioOutputDevice } from './statusTypes';

interface VolumePanelProps {
  onClose?: () => void;
}

const INITIAL_DEVICES: AudioOutputDevice[] = [
  { id: '1', name: 'WALLIX Speakers', type: 'built-in', isActive: true },
  { id: '2', name: 'Bluetooth Headphones', type: 'bluetooth', isActive: false },
  { id: '3', name: 'HDMI Audio', type: 'hdmi', isActive: false },
];

export const VolumePanel: React.FC<VolumePanelProps> = () => {
  const [volume, setVolume] = useState(72);
  const [isMuted, setIsMuted] = useState(false);
  const [devices, setDevices] = useState<AudioOutputDevice[]>(INITIAL_DEVICES);

  const activeDevice = devices.find(d => d.isActive) || devices[0];

  const handleDeviceSelect = (id: string) => {
    setDevices(prev => prev.map(d => ({
      ...d,
      isActive: d.id === id,
    })));
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="w-full min-w-0 space-y-4 select-none box-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Sound</h3>
      </div>

      {/* Large Speaker Center Visual */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <div className="text-slate-700 dark:text-slate-300">
          {isMuted || volume === 0 ? (
            <VolumeX className="w-14 h-14 stroke-[1.25] text-slate-400" />
          ) : volume < 50 ? (
            <Volume1 className="w-14 h-14 stroke-[1.25]" />
          ) : (
            <Volume2 className="w-14 h-14 stroke-[1.25]" />
          )}
        </div>
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute right-0 top-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Slider Row */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              if (isMuted) setIsMuted(false);
              setVolume(parseInt(e.target.value, 10));
            }}
            className="flex-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 w-8 text-right font-medium">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>
      </div>

      {/* Output Device Selection */}
      <div className="space-y-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="px-1">
          <span className={STATUS_GLASS_TOKENS.sectionHeader}>Output Device:</span>
          <div className="mt-1 font-medium text-xs text-slate-900 dark:text-white px-2 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
            {activeDevice.name}
          </div>
        </div>

        <div className="space-y-1 px-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Available Output:</span>
          <div className="space-y-0.5">
            {devices.map(device => (
              <button
                key={device.id}
                type="button"
                onClick={() => handleDeviceSelect(device.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left cursor-pointer transition ${
                  device.isActive 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span>• {device.name}</span>
                {device.isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
