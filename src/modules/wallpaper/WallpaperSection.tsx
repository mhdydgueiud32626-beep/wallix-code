import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  FileVideo, 
  UploadCloud, 
  Film, 
  Grid, 
  Filter, 
  Zap, 
  Sliders, 
  Check, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import { Wallpaper, ResolutionType } from '../../types';
import { HeroCarousel } from '../../components/HeroCarousel';
import { WallpaperGrid } from '../../components/WallpaperGrid';
import { ContextualUploader, UploadSuccessPayload } from '../../components/Upload/ContextualUploader';
import { sanitizeWallpaperTitle } from '../../utils/sanitizeTitle';

export type WallpaperSubTab = 'gallery' | 'static' | 'live' | 'upload';

interface WallpaperSectionProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  selectedWallpaper: Wallpaper;
  onToggleFavorite: (id: string) => void;
  onInspect: (wallpaper: Wallpaper) => void;
  onApplyDesktop: (wallpaper: Wallpaper) => void;
  onQuickDownload: (wallpaper: Wallpaper) => void;
  onShare: (wallpaper: Wallpaper) => void;
  onOpenAddToCollection: (wallpaper: Wallpaper) => void;
  onAddCustomWallpaper: (wallpaper: Wallpaper) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
  activeSubTab?: WallpaperSubTab;
  onSubTabChange?: (tab: WallpaperSubTab) => void;
}

export const WallpaperSection: React.FC<WallpaperSectionProps> = ({
  wallpapers,
  favorites,
  activeWallpaperId,
  selectedWallpaper,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onShare,
  onOpenAddToCollection,
  onAddCustomWallpaper,
  onDelete,
  enableTilt = true,
  searchQuery = '',
  onShowToast,
  activeSubTab: controlledSubTab,
  onSubTabChange
}) => {
  const [internalSubTab, setInternalSubTab] = useState<WallpaperSubTab>('gallery');
  const currentSubTab = controlledSubTab || internalSubTab;

  const handleSetSubTab = (tab: WallpaperSubTab) => {
    setInternalSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedResolution, setSelectedResolution] = useState<'All' | ResolutionType>('All');

  // Video URL Input state for upload tab
  const [remoteVideoUrl, setRemoteVideoUrl] = useState('');

  // Handle uploaded video completion
  const handleUploadVideoComplete = (payload: UploadSuccessPayload) => {
    const newWallpaper: Wallpaper = {
      id: `custom-live-${Date.now()}`,
      title: payload.name || 'Custom Live Video Wallpaper',
      category: 'Live Video',
      tags: ['Live', 'Video', '60FPS', 'CustomUpload'],
      resolution: '4K UHD',
      resolutionText: '3840 × 2160 (60 FPS)',
      is3D: false,
      isLive: true,
      isVideo: true,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      videoUrl: payload.url,
      description: 'Ultra-smooth custom uploaded 60 FPS live video wallpaper loop.',
      fileSize: '42.5 MB',
      author: {
        name: 'Local User',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        badge: 'CREATOR'
      },
      downloads: 1,
      likes: 1,
      aspectRatio: '16:9',
      colors: ['#06b6d4', '#3b82f6']
    };

    onAddCustomWallpaper(newWallpaper);
    if (onShowToast) {
      onShowToast({
        title: 'Live Wallpaper Ready',
        subtitle: `"${payload.name}" loaded into your collection`,
        icon: <Zap className="w-4 h-4 text-cyan-400" />
      });
    }
  };

  const handleAddRemoteVideo = () => {
    if (!remoteVideoUrl.trim()) return;
    const cleanUrl = remoteVideoUrl.trim();

    const newWallpaper: Wallpaper = {
      id: `remote-live-${Date.now()}`,
      title: 'Web Stream Live Wallpaper',
      category: 'Live Video',
      tags: ['Live', 'Stream', '60FPS', 'WebVideo'],
      resolution: '4K UHD',
      resolutionText: '3840 × 2160 (60 FPS)',
      is3D: false,
      isLive: true,
      isVideo: true,
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      videoUrl: cleanUrl,
      description: 'Live web streaming 60 FPS animated background.',
      fileSize: 'Stream',
      author: {
        name: 'Web Stream',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        badge: 'STREAM'
      },
      downloads: 1,
      likes: 1,
      aspectRatio: '16:9',
      colors: ['#3b82f6', '#8b5cf6']
    };

    onAddCustomWallpaper(newWallpaper);
    setRemoteVideoUrl('');
    if (onShowToast) {
      onShowToast({
        title: 'Live Video Added',
        subtitle: 'Remote video stream saved to your live gallery',
        icon: <Check className="w-4 h-4 text-emerald-400" />
      });
    }
  };

  // Filter wallpapers depending on active sub-tab
  const filteredWallpapers = wallpapers.filter((w) => {
    if (currentSubTab === 'static') {
      return !w.videoUrl && !w.tags.some((t) => /live|3d|shader/i.test(t));
    }
    if (currentSubTab === 'live') {
      return !!w.videoUrl || w.tags.some((t) => /live|3d|shader/i.test(t));
    }
    return true; // 'gallery' shows all
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      
      {/* 1. WALLPAPERS SECTION HEADER & SUB-TABS */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
              WALLPAPERS GALLERY
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Wallpaper Studio & Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse static 4K/8K art, interactive 3D live wallpapers, or upload your own 60 FPS live video background
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/10 shadow-inner shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => handleSetSubTab('gallery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentSubTab === 'gallery'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Gallery</span>
          </button>

          <button
            onClick={() => handleSetSubTab('static')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentSubTab === 'static'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Static 4K/8K</span>
          </button>

          <button
            onClick={() => handleSetSubTab('live')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentSubTab === 'live'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Wallpapers</span>
          </button>

          <button
            onClick={() => handleSetSubTab('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentSubTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-VIEW: UPLOAD VIDEO CONTEXTUAL PANEL */}
      {currentSubTab === 'upload' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
              <FileVideo className="w-5 h-5 text-cyan-400" />
              <span>Live Wallpaper Video Uploader</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload local .mp4 or .webm files. Videos play in a hardware-accelerated 60 FPS loop with zero battery drain.
            </p>
          </div>

          {/* Dedicated Contextual Drag-and-Drop Uploader */}
          <ContextualUploader
            mediaType="video"
            title="Drag & Drop 60 FPS Video File Here"
            description="Supports MP4, WebM, or MOV up to 120MB. Encoded at native 3840×2160 or 1080p 60 FPS."
            maxSizeMB={120}
            onUploadComplete={handleUploadVideoComplete}
          />

          {/* Alternative Remote URL Input */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Or Stream From Video URL (.mp4 / WebM direct link)
            </h4>
            <div className="flex gap-2">
              <input
                type="url"
                value={remoteVideoUrl}
                onChange={(e) => setRemoteVideoUrl(e.target.value)}
                placeholder="https://domain.com/video-loop.mp4"
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
              <button
                onClick={handleAddRemoteVideo}
                disabled={!remoteVideoUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Add Stream</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-VIEW: GALLERY & STATIC & LIVE WALLPAPERS */}
      {currentSubTab !== 'upload' && (
        <div className="space-y-6">
          {/* Hero Featured Showcase */}
          <HeroCarousel
            wallpapers={filteredWallpapers}
            selectedWallpaper={selectedWallpaper}
            onInspect={onInspect}
            onApplyDesktop={onApplyDesktop}
            onQuickDownload={onQuickDownload}
            onOpenDesktopSim={() => {}}
            onShare={onShare}
            activeWallpaperId={activeWallpaperId}
          />

          {/* 2x2 & 4-Column Responsive Grid View */}
          <WallpaperGrid
            wallpapers={filteredWallpapers}
            favorites={favorites}
            activeWallpaperId={activeWallpaperId}
            onToggleFavorite={onToggleFavorite}
            onInspect={onInspect}
            onApplyDesktop={onApplyDesktop}
            onQuickDownload={onQuickDownload}
            onOpenDesktopSim={() => {}}
            onShare={onShare}
            onOpenAddToCollection={onOpenAddToCollection}
            onDelete={onDelete}
            enableTilt={enableTilt}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedResolution={selectedResolution}
            searchQuery={searchQuery}
          />
        </div>
      )}

    </div>
  );
};
