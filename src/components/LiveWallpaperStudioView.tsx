import React, { useState, useMemo, useRef } from 'react';
import { 
  FileVideo, 
  Sparkles, 
  Upload, 
  Play, 
  Check, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Eye, 
  Layers,
  ArrowRight,
  Filter,
  Trash2
} from 'lucide-react';
import { Wallpaper } from '../types';
import { UploadZone } from './Upload/UploadZone';
import { WallpaperCard } from './WallpaperCard';
import { saveMediaFile } from '../utils/mediaStorage';
import confetti from 'canvas-confetti';

interface LiveWallpaperStudioViewProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop: (w: Wallpaper) => void;
  onQuickDownload: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onAddCustomWallpaper?: (w: Wallpaper) => void;
  onDelete?: (id: string) => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
  activeSubTab?: 'browse' | 'upload';
  onSubTabChange?: (tab: 'browse' | 'upload') => void;
}

export const LiveWallpaperStudioView: React.FC<LiveWallpaperStudioViewProps> = ({
  wallpapers,
  favorites,
  activeWallpaperId,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  onAddCustomWallpaper,
  onDelete,
  onShowToast,
  activeSubTab = 'browse',
  onSubTabChange
}) => {
  const [internalTab, setInternalTab] = useState<'browse' | 'upload'>('browse');
  const activeTab = activeSubTab || internalTab;
  const setActiveTab = (tab: 'browse' | 'upload') => {
    setInternalTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };
  const [isMuted, setIsMuted] = useState(true);

  // Filter only live/video wallpapers
  const liveList = useMemo(() => {
    return wallpapers.filter(w => w.isLive || w.isVideo || w.videoUrl || w.shaderType || w.isModel3D);
  }, [wallpapers]);

  // Selected hero video preview
  const [selectedHero, setSelectedHero] = useState<Wallpaper>(() => {
    return liveList[0] || wallpapers[0];
  });

  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const handleUploadSuccess = (fileData: { file: File; objectUrl: string; name: string; sizeFormatted: string; thumbnailDataUrl?: string }) => {
    const customId = `custom-video-${Date.now()}`;
    // Save binary file into IndexedDB for persistent session restore
    saveMediaFile(customId, fileData.file, fileData.name);

    const posterImage = fileData.thumbnailDataUrl || fileData.objectUrl;

    const newWallpaper: Wallpaper = {
      id: customId,
      title: fileData.name,
      category: 'Live Wallpapers',
      tags: ['Custom Video', '60 FPS', 'Personal Upload', '#LiveVideo'],
      resolution: '4K UHD',
      resolutionText: '3840 × 2160 (60 FPS)',
      is3D: true,
      isLive: true,
      isVideo: true,
      videoUrl: fileData.objectUrl,
      imageUrl: posterImage,
      thumbnailUrl: posterImage,
      thumbnail: posterImage,
      author: {
        name: 'You (Creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        badge: 'USER'
      },
      downloads: 1,
      likes: 1,
      aspectRatio: '16:9',
      description: 'Personal custom video wallpaper uploaded to local session.',
      colors: ['#06b6d4', '#3b82f6'],
      fileSize: fileData.sizeFormatted,
      fps: 60,
      badge: 'NEW'
    };

    if (onAddCustomWallpaper) {
      onAddCustomWallpaper(newWallpaper);
    }

    setSelectedHero(newWallpaper);

    if (onShowToast) {
      onShowToast({
        title: 'Video Uploaded & Ready',
        subtitle: `"${fileData.name}" has been prepared for playback`,
        icon: <FileVideo className="w-4 h-4 text-emerald-400" />
      });
    }
  };

  const handleApplyCustomVideo = (fileData: { file: File; objectUrl: string; name: string; thumbnailDataUrl?: string }) => {
    const customId = `custom-video-${Date.now()}`;
    // Save binary file into IndexedDB for persistent session restore
    saveMediaFile(customId, fileData.file, fileData.name);

    const posterImage = fileData.thumbnailDataUrl || fileData.objectUrl;

    const newWallpaper: Wallpaper = {
      id: customId,
      title: fileData.name,
      category: 'Live Wallpapers',
      tags: ['Custom Video', '60 FPS', 'Personal Upload'],
      resolution: '4K UHD',
      resolutionText: '3840 × 2160 (60 FPS)',
      is3D: true,
      isLive: true,
      isVideo: true,
      videoUrl: fileData.objectUrl,
      imageUrl: posterImage,
      thumbnailUrl: posterImage,
      thumbnail: posterImage,
      author: {
        name: 'You (Creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        badge: 'USER'
      },
      downloads: 1,
      likes: 1,
      aspectRatio: '16:9',
      description: 'Personal custom video wallpaper applied.',
      colors: ['#06b6d4', '#3b82f6'],
      fileSize: 'Custom',
      fps: 60
    };

    if (onAddCustomWallpaper) {
      onAddCustomWallpaper(newWallpaper);
    }
    onApplyDesktop(newWallpaper);
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-2">
      {/* SECTION HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-mono font-bold mb-2">
            <FileVideo className="w-3.5 h-3.5" />
            <span>ANIMATED & 60 FPS ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Live Wallpapers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Explore 60 FPS animated loops, 3D WebGL motion art, or drag-and-drop your own MP4 video to apply immediately.
          </p>
        </div>

        {/* WORKSPACE SWITCHER */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shrink-0">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Browse Live Wallpapers</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your Video</span>
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD YOUR VIDEO */}
      {activeTab === 'upload' && (
        <div className="max-w-3xl mx-auto space-y-6 pt-2">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Upload Live Video Wallpaper
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Drag and drop an MP4, WebM, or MOV video loop from your computer. The engine will validate, preview, and apply it directly.
            </p>
          </div>

          <UploadZone
            mediaType="video"
            acceptedTypes={['.mp4', '.webm', '.mov', 'video/mp4', 'video/webm', 'video/quicktime']}
            maxSizeMB={150}
            title="Drag & Drop Video"
            subtitle="Choose an ultra HD video loop or personal clip (MP4 / WebM / MOV up to 150MB)"
            actionLabel="Apply as Active Wallpaper"
            onSuccess={handleUploadSuccess}
            onApply={handleApplyCustomVideo}
          />
        </div>
      )}

      {/* TAB 2: BROWSE LIVE WALLPAPERS */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          {/* HERO LIVE PLAYER SHOWCASE */}
          {selectedHero && (
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-black/80 shadow-2xl">
              <div className="relative aspect-[21/9] min-h-[300px] max-h-[440px] w-full overflow-hidden bg-black flex items-center justify-center">
                {selectedHero.videoUrl ? (
                  <video
                    ref={heroVideoRef}
                    src={selectedHero.videoUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedHero.imageUrl}
                    alt={selectedHero.title}
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#090C16] via-transparent to-black/40" />

                {/* Top Floating Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/50 text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>60 FPS HARDWARE ACCELERATED</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300">
                    {selectedHero.resolutionText || '4K UHD'}
                  </span>
                </div>

                {/* Sound toggle if video */}
                {selectedHero.videoUrl && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-slate-300 hover:text-white transition cursor-pointer"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                )}

                {/* Bottom Overlay Controls */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                      Selected Live Wallpaper
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                      {selectedHero.title}
                    </h2>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {selectedHero.description || 'Ultra-high framerate smooth looping backdrop crafted for high-refresh displays.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => onApplyDesktop(selectedHero)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-black text-xs md:text-sm shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{activeWallpaperId === selectedHero.id ? 'Active Desktop' : 'Apply Live Wallpaper'}</span>
                    </button>

                    <button
                      onClick={() => onInspect(selectedHero)}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm border border-white/15 transition flex items-center gap-2 cursor-pointer backdrop-blur-xl"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect</span>
                    </button>

                    {onDelete && (selectedHero.id.startsWith('custom-') || selectedHero.id.startsWith('custom-video-')) && (
                      <button
                        onClick={() => {
                          onDelete(selectedHero.id);
                        }}
                        className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs md:text-sm border border-rose-500/40 transition flex items-center gap-2 cursor-pointer backdrop-blur-xl"
                        title="Delete this custom live wallpaper"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRID OF LIVE WALLPAPERS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white font-['Outfit']">
                All Live & Animated Loops ({liveList.length})
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Click to preview in hero player
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveList.map((wp) => {
                const isHero = selectedHero?.id === wp.id;
                const isActive = activeWallpaperId === wp.id;

                return (
                  <div
                    key={wp.id}
                    onClick={() => setSelectedHero(wp)}
                    className={`group relative rounded-2xl overflow-hidden bg-[#0c101d] border transition-all duration-300 cursor-pointer shadow-lg ${
                      isHero 
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={wp.thumbnail || wp.thumbnailUrl || wp.imageUrl}
                        alt={wp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-md bg-sky-950/80 backdrop-blur-md border border-sky-400/40 text-[9px] font-mono font-bold text-sky-300 flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-sky-300" />
                          <span>60 FPS</span>
                        </span>
                      </div>

                      {isActive && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2.5 right-2.5">
                        <p className="text-xs font-bold text-white truncate">{wp.title}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">{wp.category}</p>
                      </div>
                    </div>

                    <div className="p-2.5 flex items-center justify-between border-t border-white/5 bg-[#090C16]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHero(wp);
                        }}
                        className="text-[11px] text-slate-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {onDelete && (wp.id.startsWith('custom-') || wp.id.startsWith('custom-video-')) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(wp.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                            title="Delete custom live wallpaper"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyDesktop(wp);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-400/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
