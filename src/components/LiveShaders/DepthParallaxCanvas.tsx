import React, { useState, useRef, useEffect } from 'react';
import { Wallpaper } from '../../types';
import { CutoutSubject } from '../../desktop/types';
import { DEFAULT_CUTOUT_SUBJECTS } from '../../data/cutouts';
import { ThreeLiveWallpaper } from './ThreeLiveWallpaper';
import { Model3DViewer } from './Model3DViewer';
import { ClockWidget } from '../Widgets/ClockWidget';
import { Layers, Sparkles, Upload, Image as ImageIcon, Sliders } from 'lucide-react';

interface DepthParallaxCanvasProps {
  wallpaper: Wallpaper;
  activeCutout?: CutoutSubject;
  parallaxIntensity?: number;
  showDepthClock?: boolean;
  isPaused?: boolean;
  className?: string;
  onSelectCutout?: (cutout: CutoutSubject) => void;
}

export const DepthParallaxCanvas: React.FC<DepthParallaxCanvasProps> = ({
  wallpaper,
  activeCutout = DEFAULT_CUTOUT_SUBJECTS[0],
  parallaxIntensity = 1.0,
  showDepthClock = true,
  isPaused = false,
  className = '',
  onSelectCutout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedSubject, setSelectedSubject] = useState<CutoutSubject>(activeCutout);
  const [customCutoutUrl, setCustomCutoutUrl] = useState<string | null>(null);

  // Sync video play/pause with isPaused
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  // Smooth mouse damping animation loop (skips updates if isPaused to hit 0% CPU)
  useEffect(() => {
    let animationFrameId: number;
    const updateMotion = () => {
      if (!isPaused) {
        setMousePos((prev) => ({
          x: prev.x + (targetPos.x - prev.x) * 0.08,
          y: prev.y + (targetPos.y - prev.y) * 0.08,
        }));
      }
      animationFrameId = requestAnimationFrame(updateMotion);
    };
    animationFrameId = requestAnimationFrame(updateMotion);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPos, isPaused]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isPaused) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTargetPos({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setTargetPos({ x: 0, y: 0 });
  };

  // Parallax offsets
  // Background moves opposite slightly
  const bgOffsetX = mousePos.x * -18 * parallaxIntensity;
  const bgOffsetY = mousePos.y * -18 * parallaxIntensity;
  const bgScale = 1.06;

  // Clock in middle moves slightly
  const clockOffsetX = mousePos.x * 5 * parallaxIntensity;
  const clockOffsetY = mousePos.y * 5 * parallaxIntensity;

  // Foreground cutout moves 1.6x faster towards cursor with subtle 3D rotation
  const fgOffsetX = mousePos.x * 40 * parallaxIntensity;
  const fgOffsetY = mousePos.y * 35 * parallaxIntensity;
  const fgRotateY = mousePos.x * 12 * parallaxIntensity;
  const fgRotateX = -mousePos.y * 12 * parallaxIntensity;

  const currentCutout = customCutoutUrl
    ? {
        ...selectedSubject,
        cutoutUrl: customCutoutUrl,
        name: 'Custom PNG Cutout',
      }
    : selectedSubject;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full overflow-hidden select-none bg-black ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* ========================================================================= */}
      {/* LAYER 0: BACKGROUND (Video / WebGL / High-Res Image) */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-transform will-change-transform"
        style={{
          transform: `translate3d(${bgOffsetX}px, ${bgOffsetY}px, 0px) scale(${bgScale})`,
          transformOrigin: 'center center',
        }}
      >
        {wallpaper.isModel3D && wallpaper.modelUrl ? (
          <Model3DViewer modelUrl={wallpaper.modelUrl} autoRotate={!isPaused} className="w-full h-full" />
        ) : wallpaper.videoUrl ? (
          <video
            ref={videoRef}
            key={wallpaper.videoUrl}
            src={wallpaper.videoUrl}
            autoPlay={!isPaused}
            loop
            muted
            playsInline
            controls={false}
            poster={wallpaper.imageUrl || wallpaper.thumbnail}
            className="w-full h-full object-cover"
          />
        ) : wallpaper.isLive && wallpaper.shaderType ? (
          <ThreeLiveWallpaper 
            shaderType={wallpaper.shaderType} 
            interactive={false} 
            isPaused={isPaused}
            className="w-full h-full" 
          />
        ) : (
          <img
            src={wallpaper.imageUrl}
            alt={wallpaper.title}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Soft Vignette and Atmospheric Depth Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 1: INTERLEAVED DIGITAL CLOCK (Behind Character Cutout) */}
      {/* ========================================================================= */}
      {showDepthClock && (
        <div
          className="absolute z-10 pointer-events-none transition-transform will-change-transform"
          style={{
            top: '12%',
            left: '50%',
            transform: `translate(-50%, 0) translate3d(${clockOffsetX}px, ${clockOffsetY}px, 0px)`,
          }}
        >
          <div className="text-center">
            <ClockWidget depthInterleaved={true} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYER 2: FOREGROUND SUBJECT CUTOUT (Overlaps Clock & Reacts Fast to 3D Parallax) */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 z-20 pointer-events-none flex items-end justify-center transition-transform will-change-transform"
        style={{
          transform: `translate3d(${fgOffsetX}px, ${fgOffsetY}px, 40px) rotateY(${fgRotateY}deg) rotateX(${fgRotateX}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="relative max-w-2xl max-h-[85vh] flex items-end justify-center pointer-events-none">
          <img
            src={currentCutout.cutoutUrl}
            alt={currentCutout.name}
            className="w-auto h-auto max-h-[85vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter brightness-105 contrast-105 select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Subject Cutout Switcher Mini Pill */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Cutout:</span>
        </span>
        {DEFAULT_CUTOUT_SUBJECTS.map((cutout) => (
          <button
            key={cutout.id}
            onClick={() => {
              setCustomCutoutUrl(null);
              setSelectedSubject(cutout);
              if (onSelectCutout) onSelectCutout(cutout);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
              selectedSubject.id === cutout.id && !customCutoutUrl
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-white/5 hover:bg-white/15 text-slate-300'
            }`}
          >
            {cutout.name}
          </button>
        ))}

        {/* Custom PNG Upload Button */}
        <label
          className={`p-1.5 rounded-xl border border-dashed transition cursor-pointer flex items-center justify-center ${
            customCutoutUrl
              ? 'bg-indigo-600/40 text-cyan-300 border-cyan-400/60'
              : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border-white/20'
          }`}
          title="Upload Custom PNG Cutout"
        >
          <Upload className="w-3 h-3" />
          <input
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setCustomCutoutUrl(url);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};
