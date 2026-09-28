import React, { useState, useEffect, useRef } from 'react';
import { Wallpaper } from '../types';
import { WallixLogo3D } from './WallixLogo3D';

interface ArcCarouselLandingProps {
  wallpapers: Wallpaper[];
  onCompleteLoading: () => void;
  onSelectWallpaper: (w: Wallpaper) => void;
}

export const ArcCarouselLanding: React.FC<ArcCarouselLandingProps> = ({
  wallpapers,
  onCompleteLoading,
  onSelectWallpaper,
}) => {
  // 6 high-resolution wallpaper cards for the 6-card carousel sequence
  const items = wallpapers.slice(0, 6);
  const totalItems = 6;

  const [currentAngle, setCurrentAngle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronized 6-Card Carousel Auto-Rotation & Progress System
  useEffect(() => {
    // 7.2 seconds total duration for cards 1 to 6 to cycle through smoothly
    const totalDurationMs = 7200;
    const intervalMs = 25;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(1, elapsed / totalDurationMs);

      // Smooth percentage from 0% to 100%
      const currentPct = Math.round(fraction * 100);
      setProgress(currentPct);

      // Direct synchronization: As carousel rotates through cards 1 to 6 (360 deg total)
      const targetAngle = fraction * 360;
      setCurrentAngle(targetAngle);

      // Immediately upon reaching 100% (6th card completed), auto-transition to main gallery
      if (fraction >= 1) {
        clearInterval(timer);
        setIsTransitioning(true);
        setTimeout(() => {
          onCompleteLoading();
        }, 700);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [totalItems, onCompleteLoading]);

  // Mouse parallax interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
    setMouseOffset({ x, y });
  };

  const handleCardClick = (index: number) => {
    const targetDeg = index * (360 / totalItems);
    setCurrentAngle(targetDeg);
    onSelectWallpaper(items[index]);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full min-h-screen bg-[#0B0C10] text-slate-100 flex flex-col justify-between items-center px-4 py-6 sm:py-8 overflow-hidden select-none transition-all duration-700 ${
        isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Cyber Neon Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* 1. BRANDING & HERO HEADER */}
      <header className="relative z-20 flex flex-col items-center text-center pt-1 sm:pt-3 space-y-2">
        
        {/* High-Detail 3D Frosted Glass 'W' Icon over Purple Sunset Mountains Backdrop */}
        <div 
          className="relative cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => setCurrentAngle((prev) => prev + 60)}
        >
          <WallixLogo3D size={118} />
        </div>

        {/* Deep Obsidian Black WALLIX Title & Subtitle Matching Reference */}
        <div className="space-y-1 relative flex flex-col items-center">
          
          {/* Subtle Ambient Backlight Glow behind typography */}
          <div className="absolute -inset-x-8 -inset-y-4 bg-gradient-to-r from-cyan-500/15 via-blue-500/20 to-indigo-500/15 rounded-full blur-xl -z-10 pointer-events-none" />

          <h1 
            className="text-3xl sm:text-5xl font-black tracking-widest font-['Outfit'] uppercase"
            style={{
              color: '#0A0A0C',
              textShadow: '0 0 1px rgba(255,255,255,0.4), 0 2px 14px rgba(6,182,212,0.35)',
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.25)',
            }}
          >
            WALLIX
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold tracking-[0.3em] text-slate-300 uppercase">
            <span className="text-indigo-400 font-normal">→</span>
            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
              3D WALLPAPERS
            </span>
            <span className="text-indigo-400 font-normal">←</span>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - 6-CARD 3D ROTATING ARC CAROUSEL */}
      <section 
        className="relative w-full max-w-6xl h-[360px] sm:h-[420px] flex items-center justify-center my-auto perspective-1000 overflow-visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {items.map((wallpaper, idx) => {
            const itemAngleDeg = (idx * (360 / totalItems));
            let diff = ((itemAngleDeg - currentAngle) % 360 + 360) % 360;
            if (diff > 180) diff -= 360; // range -180 to +180

            // Arched convex semi-circle curve mathematics
            const rad = (diff * Math.PI) / 180;
            const radiusX = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 440;
            const radiusY = typeof window !== 'undefined' && window.innerWidth < 640 ? 95 : 140;

            const posX = Math.sin(rad) * radiusX;
            const posY = (1 - Math.cos(rad)) * radiusY;
            const posZ = Math.cos(rad) * 140; // 3D depth

            const rotateZ = diff * 0.48; // card tilts tangentially along the arch
            const rotateY = -diff * 0.22; // 3D yaw

            const isCenter = Math.abs(diff) < 25;
            const scale = Math.max(0.68, 1.18 - Math.abs(diff) / 140);
            const opacity = Math.abs(diff) > 105 ? 0 : Math.max(0.25, 1 - (Math.abs(diff) / 95) ** 1.5);
            const zIndex = Math.round(100 - Math.abs(diff));

            if (opacity <= 0) return null;

            return (
              <div
                key={wallpaper.id}
                onClick={() => handleCardClick(idx)}
                style={{
                  position: 'absolute',
                  transform: `translate3d(${posX}px, ${posY}px, ${posZ}px) rotateZ(${rotateZ}deg) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: isHovered ? 'transform 0.25s ease-out' : 'transform 0.08s linear',
                }}
                className={`w-36 h-50 sm:w-48 sm:h-64 rounded-2xl overflow-hidden glass-panel cursor-pointer group transition-all duration-300 ${
                  isCenter
                    ? 'border-2 border-cyan-400 glow-cyan shadow-[0_0_40px_rgba(6,182,212,0.6)] ring-2 ring-indigo-500/50'
                    : 'border border-white/20 hover:border-indigo-400/60 shadow-xl'
                }`}
              >
                {/* Clean Wallpaper Video or Image */}
                {wallpaper.videoUrl ? (
                  <video
                    key={wallpaper.videoUrl}
                    src={wallpaper.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    poster={wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl}
                    className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={wallpaper.thumbnailUrl}
                    alt={wallpaper.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Subtle Edge Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                {/* Center Card Active Glow highlight sheen */}
                {isCenter && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-indigo-500/15 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SOLID 100% SMOOTH BLUE LASER BEAM PROGRESS BAR */}
      <footer className="relative z-20 w-full max-w-[360px] flex flex-col items-center pb-8">
        
        {/* COMPACT & SLENDER (6px) SOLID BLUE PLASMA LASER BEAM */}
        <div 
          className="relative w-full h-[6px] rounded-full laser-beam-track overflow-visible"
        >
          {/* Outer Neon Plasma Aura Glow */}
          <div 
            className="absolute -inset-y-1.5 left-0 rounded-full pointer-events-none transition-all duration-75 ease-out opacity-90"
            style={{
              width: `${Math.max(3, progress)}%`,
              background: 'linear-gradient(90deg, rgba(37,99,235,0.2) 0%, rgba(59,130,246,0.6) 40%, rgba(6,182,212,0.9) 85%, #FFFFFF 100%)',
              filter: 'blur(3px)',
            }}
          />

          {/* 100% Solid Laser Beam Fill Bar (Zero Dotted/Segmented artifacts) */}
          <div 
            className="h-full rounded-full laser-beam-core relative transition-all duration-75 ease-out"
            style={{ width: `${Math.max(2.5, progress)}%` }}
          >
            {/* Glowing White-Cyan Arrowhead / Plasma Laser Tip on the Right Edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center pointer-events-none z-10">
              
              {/* Pointed Arrow Tip */}
              <div 
                className="w-3.5 h-2.5 bg-white"
                style={{
                  clipPath: 'polygon(0% 10%, 55% 10%, 100% 50%, 55% 90%, 0% 90%, 25% 50%)',
                  filter: 'drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px #06B6D4) drop-shadow(0 0 16px #2563EB)',
                }}
              />

              {/* Plasma Flare Bloom */}
              <div className="absolute w-5 h-5 rounded-full bg-cyan-300/50 blur-[2.5px] -z-10 animate-pulse" />
              
              {/* Center Bright Spark */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#FFFFFF]" />
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
};
