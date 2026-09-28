import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Radio
} from 'lucide-react';
import { WALLIX_GLASS_TOKENS } from '../../config/wallixGlassTokens';

const TRACKS = [
  {
    title: 'Midnight City Drive',
    artist: 'Synthwave Neon / Kavinsky',
    duration: 215,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Sakura Cyber Blade',
    artist: 'Tokyo Lo-Fi & Chillwave',
    duration: 184,
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80'
  },
  {
    title: 'Cosmic Nebula Horizon',
    artist: 'Ambient Space Odyssey',
    duration: 260,
    cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80'
  }
];

export const MusicWidget: React.FC = () => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(42);

  const currentTrack = TRACKS[trackIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgressSec((prev) => (prev >= currentTrack.duration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgressSec(0);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgressSec(0);
  };

  const progressPercent = Math.min(100, Math.max(0, (progressSec / currentTrack.duration) * 100));

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(1, clickX / rect.width));
    setProgressSec(Math.floor(newPct * currentTrack.duration));
  };

  return (
    <div 
      id="wallix-music-widget" 
      className={`select-none p-5 text-white transition-all duration-300 w-full h-full flex flex-col justify-between ${
        WALLIX_GLASS_TOKENS.card
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <span className={WALLIX_GLASS_TOKENS.subtleHeader}>
          AUDIO PLAYER
        </span>
        <div className="flex items-center gap-1">
          {/* Animated Visualizer EQ Bars */}
          {[40, 90, 60, 100, 75, 45].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-blue-400 transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, ((height * (i + 1)) % 16) + 6)}px` : '4px',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Album Cover & Track Info */}
      <div className="flex items-center gap-3 my-1">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 flex-shrink-0 shadow-md">
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate drop-shadow-sm">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-white/70 truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 my-1 group">
        <div 
          className="relative w-full h-1.5 group-hover:h-2 bg-white/20 rounded-full cursor-pointer transition-all duration-150"
          onClick={handleScrub}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-white/60 px-0.5">
          <span className="text-blue-300 font-medium">{formatTime(progressSec)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className={`pt-3 flex items-center justify-between ${WALLIX_GLASS_TOKENS.divider}`}>
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          title="Previous Track"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold transition shadow-lg shadow-blue-500/40 active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
