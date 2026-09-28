import React from 'react';
import { motion } from 'motion/react';
import { Headphones, Laptop, Monitor, Check, Sparkles, Sliders } from 'lucide-react';
import { Volume2Icon, Volume1Icon, VolumeXIcon } from '@animateicons/react/lucide';
import { useAudioOutput } from '../../../services/systemBridge';

interface SoundMenuProps {
  onClose?: () => void;
  volume?: number;
  setVolume?: (vol: number | ((prev: number) => number)) => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean | ((prev: boolean) => boolean)) => void;
}

export const SoundMenu: React.FC<SoundMenuProps> = ({ 
  onClose: _onClose,
  volume: externalVolume,
  setVolume: externalSetVolume,
  isMuted: externalIsMuted,
  setIsMuted: externalSetIsMuted,
}) => {
  const {
    volume: bridgeVolume,
    isMuted: bridgeIsMuted,
    activeDeviceId,
    devices,
    spatialAudio,
    soundEnhancements,
    setVolume: bridgeSetVolume,
    setIsMuted: bridgeSetIsMuted,
    toggleMute,
    setActiveAudioDevice,
    toggleSpatialAudio,
  } = useAudioOutput();

  const volume = externalVolume !== undefined ? externalVolume : bridgeVolume;
  const setVolume = externalSetVolume || bridgeSetVolume;
  const isMuted = externalIsMuted !== undefined ? externalIsMuted : bridgeIsMuted;
  const setIsMuted = externalSetIsMuted || bridgeSetIsMuted;

  const effectiveVolume = isMuted ? 0 : volume;

  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeXIcon size={16} duration={1} color="#f87171" />;
    }
    if (volume <= 50) {
      return <Volume1Icon size={16} duration={1} color="#38bdf8" />;
    }
    return <Volume2Icon size={16} duration={1} color="#38bdf8" />;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'headphones':
      case 'bluetooth':
        return <Headphones className="w-4 h-4 text-cyan-400" />;
      case 'hdmi':
        return <Monitor className="w-4 h-4 text-indigo-400" />;
      default:
        return <Laptop className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="w-[310px] bg-slate-900/85 dark:bg-black/80 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-3.5 text-white select-none z-50 pointer-events-auto space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Master Output Volume Slider Card */}
      <div className="bg-white/10 border border-white/15 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded-lg hover:bg-white/10 active:scale-95 transition cursor-pointer text-white/80 hover:text-white flex items-center justify-center"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {renderVolumeIcon()}
            </button>
            <span>Master Output Volume</span>
          </div>
          <span className="text-[11px] font-mono text-white/70">
            {isMuted || volume === 0 ? 'Muted' : `${volume}%`}
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={effectiveVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVolume(val);
              if (isMuted && val > 0) setIsMuted(false);
            }}
            className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 overflow-hidden"
            style={{
              background: `linear-gradient(to right, #38bdf8 ${effectiveVolume}%, rgba(255, 255, 255, 0.2) ${effectiveVolume}%)`,
            }}
          />
        </div>
      </div>

      {/* 2. Windows Audio Output Endpoints Selection */}
      <div className="space-y-1">
        <div className="text-[10px] font-semibold text-white/50 px-1 uppercase tracking-wider">
          Audio Output Device
        </div>

        <div className="space-y-1">
          {devices.map((device) => {
            const isSelected = activeDeviceId === device.id;
            return (
              <button
                key={device.id}
                onClick={() => setActiveAudioDevice(device.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition text-left cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-500/20 border-blue-400/40 text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/85'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{device.name}</div>
                    {device.sampleRate && (
                      <div className="text-[9.5px] text-white/40">{device.sampleRate} • {device.bitDepth || '24-bit'}</div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Audio Enhancements & Spatial Sound */}
      <div className="pt-1 border-t border-white/10 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-white/80">Windows Spatial Audio</span>
        </div>

        <button
          type="button"
          onClick={toggleSpatialAudio}
          className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition cursor-pointer border ${
            spatialAudio 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' 
              : 'bg-white/5 text-white/50 border-white/10'
          }`}
        >
          {spatialAudio ? 'Dolby Atmos / On' : 'Off'}
        </button>
      </div>
    </motion.div>
  );
};

export default SoundMenu;
