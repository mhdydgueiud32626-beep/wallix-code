import React from 'react';
import { Headphones, Laptop, Monitor, Check, Sparkles, Sliders, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { useAudioOutput, useHostEnvironment } from '../../../services/systemBridge';
import { shellFlyoutMotion } from './shellMotion';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from './LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../adaptive';

interface WindowsAudioShellSurfaceProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export const WindowsAudioShellSurface: React.FC<WindowsAudioShellSurfaceProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;
  const textAccent = tokens.typography.textAccent;

  const {
    volume,
    isMuted,
    activeDeviceId,
    devices,
    spatialAudio,
    setVolume,
    setIsMuted,
    toggleMute,
    setActiveAudioDevice,
    toggleSpatialAudio,
  } = useAudioOutput();

  const { isWebOnly } = useHostEnvironment();
  const effectiveVolume = isMuted ? 0 : volume;

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'headphones':
      case 'bluetooth':
        return <Headphones className="w-4 h-4" style={{ color: textAccent }} />;
      case 'hdmi':
        return <Monitor className="w-4 h-4" style={{ color: textAccent }} />;
      default:
        return <Laptop className="w-4 h-4" style={{ color: textAccent }} />;
    }
  };

  return (
    <LiquidGlassSurface
      variant="flyout"
      {...shellFlyoutMotion}
      className="w-[330px] rounded-xl p-3 space-y-3 font-sans text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Volume & Output Label */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.09]">
        <span className="text-[13px] font-semibold text-white tracking-tight">Sound</span>
        <span className="text-[11px] font-mono text-white/80">
          {isMuted || volume === 0 ? 'Muted' : `${volume}%`}
        </span>
      </div>

      {/* 2. Master Output Slider Bar */}
      <div className="space-y-1.5 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition cursor-pointer border ${
              isMuted 
                ? 'text-rose-400 bg-rose-500/20 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                : 'text-white/90 hover:text-white border-transparent'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" style={{ color: textAccent }} />
            )}
          </button>

          <div className="flex-1 relative flex items-center">
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
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer overflow-hidden"
              style={{
                accentColor: activeAccent,
                background: `linear-gradient(to right, ${activeAccent} ${effectiveVolume}%, rgba(255, 255, 255, 0.18) ${effectiveVolume}%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Output Device Selector */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-semibold text-white/60 px-1 uppercase tracking-wider">
          Select playback device
        </div>

        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
          {devices.map((device) => {
            const isSelected = activeDeviceId === device.id;
            return (
              <button
                key={device.id}
                onClick={() => setActiveAudioDevice(device.id)}
                style={
                  isSelected
                    ? {
                        backgroundColor: tokens.internalSurface.selectedBackground,
                        borderColor: tokens.internalSurface.selectedBorder,
                        boxShadow: `0 2px 8px ${tokens.accent.activeAccentSoft}`,
                      }
                    : undefined
                }
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-left cursor-pointer border ${
                  isSelected
                    ? 'text-white'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.06] text-white/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{device.name}</div>
                    {device.sampleRate && (
                      <div className="text-[10px] text-white/45">
                        {device.sampleRate} • {device.bitDepth || '24-bit'}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: activeAccent }}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Spatial Audio Quick Switch */}
      <div className="pt-2 border-t border-white/[0.09] flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: textAccent }} />
          <span className="text-[11.5px] text-white/85">Spatial sound</span>
        </div>

        <button
          type="button"
          onClick={toggleSpatialAudio}
          style={
            spatialAudio
              ? {
                  backgroundColor: tokens.accent.activeAccentSoft,
                  color: textAccent,
                  borderColor: tokens.internalSurface.selectedBorder,
                  boxShadow: `0 0 8px ${tokens.accent.activeAccentSoft}`,
                }
              : undefined
          }
          className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer border ${
            spatialAudio
              ? ''
              : 'bg-white/[0.05] text-white/60 border-white/[0.08] hover:text-white/80 hover:bg-white/[0.09]'
          }`}
        >
          {spatialAudio ? 'Windows Sonic (On)' : 'Off'}
        </button>
      </div>

      {/* Web-only capability notice */}
      {isWebOnly && (
        <div className="px-2 py-1 bg-amber-500/15 border border-amber-500/25 rounded text-[10px] text-amber-300/90 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 shrink-0 text-amber-400" />
          <span>Web presentation mode: Host bridge active for presentation</span>
        </div>
      )}

      {/* 5. Windows Settings Link */}
      <div className="pt-1 border-t border-white/[0.09]">
        <button
          type="button"
          onClick={() => {
            onOpenSettings?.();
            onClose?.();
          }}
          className="w-full py-1.5 bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.09] rounded-lg text-xs font-medium text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-white/70" />
          <span>More volume settings</span>
        </button>
      </div>
    </LiquidGlassSurface>
  );
};

export default WindowsAudioShellSurface;

