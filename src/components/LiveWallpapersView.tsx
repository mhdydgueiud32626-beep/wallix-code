import React, { useRef, useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  X, 
  Box, 
  RotateCcw, 
  Sliders, 
  Check, 
  Eye, 
  FileCode, 
  Layers,
  ZoomIn,
  Move3d
} from 'lucide-react';
import { Wallpaper } from '../types';
import { Model3DViewer } from './LiveShaders/Model3DViewer';
import { WallpaperCard } from './WallpaperCard';
import confetti from 'canvas-confetti';

interface LiveWallpapersViewProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop: (w: Wallpaper) => void;
  onQuickDownload: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedDirectoryId: string;
  onSelectDirectoryId: (id: string) => void;
  selectedResolution: string;
  onSelectResolution: (res: string) => void;
}

export const LiveWallpapersView: React.FC<LiveWallpapersViewProps> = ({
  wallpapers: initialWallpapers,
  favorites,
  activeWallpaperId,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  onDelete,
  enableTilt = true,
  searchQuery,
  onSearchQueryChange,
  selectedDirectoryId,
  onSelectDirectoryId,
  selectedResolution,
  onSelectResolution,
}) => {
  // Local 3D models collection strictly isolated to this 3D Live Shaders tab
  const [local3DModels, setLocal3DModels] = useState<Wallpaper[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_local_3d_models');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Combine initial wallpapers + local uploaded 3D models (strictly in this 3D tab)
  const combinedWallpapers = React.useMemo(() => {
    return [...local3DModels, ...initialWallpapers];
  }, [local3DModels, initialWallpapers]);

  const liveList = React.useMemo(
    () => combinedWallpapers.filter((w) => w.isLive || w.isModel3D || w.shaderType),
    [combinedWallpapers]
  );
  
  const [selectedHeroWallpaper, setSelectedHeroWallpaper] = useState<Wallpaper>(
    liveList[0] || combinedWallpapers[0]
  );

  // 3D Model Interactive Controls state
  const [speed, setSpeed] = useState<number>(1);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [enableWireframe, setEnableWireframe] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle .glb and .gltf 3D Model Upload
  const process3DFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
      setUploadError('Only .glb and .gltf 3D model formats are supported.');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    setUploadError(null);
    const objectUrl = URL.createObjectURL(file);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const new3DModelWallpaper: Wallpaper = {
      id: `model3d-${Date.now()}`,
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      category: '3D Live Shaders',
      tags: ['3D Model', 'Interactive GLTF', '.GLB', 'WebGL', '#OrbitControls'],
      resolution: '4K UHD',
      resolutionText: '3840 × 2160 (Real-time 3D)',
      is3D: true,
      isLive: true,
      isModel3D: true,
      modelUrl: objectUrl,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      author: {
        name: 'You (3D Creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        badge: '3D ARTIST',
      },
      downloads: 1,
      likes: 1,
      featured: true,
      aspectRatio: '16:9',
      depthIntensity: 2.0,
      description: `Interactive 3D model (${file.name}) loaded directly into WebGL canvas with full drag, rotate, zoom and OrbitControls.`,
      colors: ['#06B6D4', '#6366F1', '#A855F7'],
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fps: 60,
      badge: 'EXCLUSIVE',
    };

    // Save to 3D models state strictly inside 3D Live Shaders view
    setLocal3DModels((prev) => {
      const updated = [new3DModelWallpaper, ...prev];
      return updated;
    });

    // Immediately display and focus this 3D model in the 3D Viewer canvas
    setSelectedHeroWallpaper(new3DModelWallpaper);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06B6D4', '#38BDF8', '#818CF8'],
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      process3DFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      process3DFile(file);
    }
  };

  // Filter Wallpapers based on search and resolution
  const filteredWallpapers = React.useMemo(() => {
    return combinedWallpapers.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesCategory = w.category.toLowerCase().includes(q);
        const matchesTags = w.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      if (selectedResolution !== 'all') {
        if (selectedResolution === '4K' && !w.resolution.includes('4K')) return false;
        if (selectedResolution === '8K' && !w.resolution.includes('8K')) return false;
        if (selectedResolution === 'Live' && !w.isLive) return false;
        if (selectedResolution === '3D' && !w.is3D) return false;
      }

      return true;
    });
  }, [combinedWallpapers, searchQuery, selectedResolution]);

  return (
    <div id="wallix-live-3d-view" className="w-full max-w-none space-y-5 pb-12 animate-fadeIn">
      {/* Hidden 3D File Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* DEDICATED 3D MODEL UPLOAD BAR & NOTICE */}
      {/* ========================================================================= */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDraggingFile
            ? 'bg-cyan-500/20 border-cyan-400 scale-[1.01] shadow-[0_0_25px_rgba(6,182,212,0.35)]'
            : 'bg-gradient-to-r from-[#0C101C] via-[#101426] to-[#0C101C] border-cyan-500/30 hover:border-cyan-400/50 shadow-xl'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">3D Model Studio Engine</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                .GLB / .GLTF ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload custom 3D files to inspect in real-time with full 360° orbit, drag, zoom & wireframe controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {uploadError && (
            <span className="text-xs font-semibold text-rose-400 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40">
              {uploadError}
            </span>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-black" />
            <span>Upload 3D Model (.glb / .gltf)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO FEATURED 3D CANVAS DISPLAY */}
      {/* ========================================================================= */}
      {selectedHeroWallpaper && (
        <div className="relative w-full h-[400px] md:h-[480px] rounded-3xl overflow-hidden glass-panel-glow border border-cyan-500/40 p-1 shadow-2xl group">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-between p-5 md:p-8">
            
            {/* Real-time Interactive 3D Model Viewer Canvas OR WebGL Shader OR Native Video */}
            {selectedHeroWallpaper.isModel3D && selectedHeroWallpaper.modelUrl ? (
              <Model3DViewer
                modelUrl={selectedHeroWallpaper.modelUrl}
                autoRotate={autoRotate}
                rotationSpeed={speed}
                scaleMultiplier={scaleMultiplier}
                enableWireframe={enableWireframe}
                className="absolute inset-0 w-full h-full"
              />
            ) : selectedHeroWallpaper.videoUrl ? (
              <video
                key={selectedHeroWallpaper.videoUrl}
                src={selectedHeroWallpaper.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                poster={selectedHeroWallpaper.imageUrl || selectedHeroWallpaper.thumbnail || selectedHeroWallpaper.thumbnailUrl}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : selectedHeroWallpaper.shaderType ? (
              <div className="absolute inset-0 w-full h-full">
                {/* Fallback shader / scene */}
                <Model3DViewer
                  modelUrl="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"
                  autoRotate={autoRotate}
                  rotationSpeed={speed}
                  scaleMultiplier={scaleMultiplier}
                  enableWireframe={enableWireframe}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img 
                src={selectedHeroWallpaper.imageUrl} 
                alt={selectedHeroWallpaper.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Subtle Gradient Overlays for readable text */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C13] via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C13]/85 via-transparent to-transparent pointer-events-none" />

            {/* Top Interactive Controls & Simulation Speed Bar */}
            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.35)] backdrop-blur-md flex items-center gap-2 tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>{selectedHeroWallpaper.isModel3D ? 'INTERACTIVE 3D MODEL CANVAS' : 'FEATURED 3D SPOTLIGHT'}</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 backdrop-blur-md">
                  {selectedHeroWallpaper.isModel3D ? 'GLTF/GLB Engine' : selectedHeroWallpaper.resolution}
                </span>
              </div>

              {/* Real-time 3D Model Control Toolbar (Rotate, Zoom, Wireframe, Speed) */}
              <div className="flex items-center gap-2 bg-[#0B0D14]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg flex-wrap">
                {/* Auto Rotate Toggle */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer ${
                    autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Auto Rotation"
                >
                  <Move3d className="w-3 h-3" />
                  <span>{autoRotate ? 'Rotate: ON' : 'Rotate: OFF'}</span>
                </button>

                {/* Wireframe Toggle */}
                <button
                  onClick={() => setEnableWireframe(!enableWireframe)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer ${
                    enableWireframe ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Wireframe Mesh"
                >
                  <Layers className="w-3 h-3" />
                  <span>Wireframe</span>
                </button>

                {/* Scale Multiplier */}
                <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
                  <ZoomIn className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-mono text-slate-400">Scale:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={scaleMultiplier}
                    onChange={(e) => setScaleMultiplier(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-cyan-300 font-bold w-6">{scaleMultiplier}x</span>
                </div>

                {/* Speed Slider */}
                <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-slate-400">Speed:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-cyan-300 font-bold w-6">{speed}x</span>
                </div>
              </div>
            </div>

            {/* Bottom Info & Action Buttons */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-tight">
                  {selectedHeroWallpaper.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-200/90 max-w-xl line-clamp-2 drop-shadow leading-relaxed">
                  {selectedHeroWallpaper.description}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-slate-300 pt-1 font-mono flex-wrap">
                  <span className="bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                    Author: <strong className="text-white font-semibold">{selectedHeroWallpaper.author.name}</strong>
                  </span>
                  <span>•</span>
                  <span className="bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-500/30 text-cyan-300 font-semibold">
                    {selectedHeroWallpaper.category}
                  </span>
                  <span className="bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-500/30 text-indigo-300 font-semibold">
                    Interactive 360° Drag
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => onApplyDesktop(selectedHeroWallpaper)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
                    activeWallpaperId === selectedHeroWallpaper.id
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold shadow-cyan-500/25 glow-cyan'
                  }`}
                >
                  {activeWallpaperId === selectedHeroWallpaper.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Applied to Desktop</span>
                    </>
                  ) : (
                    <>
                      <Box className="w-4 h-4" />
                      <span>Set as 3D Wallpaper</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onInspect(selectedHeroWallpaper)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer"
                  title="Inspect Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3D LIVE SHADERS & MODELS GRID */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-200 font-bold">3D Shaders & Models:</span>
          <span>Showing <strong className="text-cyan-400">{filteredWallpapers.length}</strong> items</span>
          {local3DModels.length > 0 && (
            <span className="bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/40 text-[11px]">
              {local3DModels.length} Custom 3D Model{local3DModels.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-semibold cursor-pointer transition hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Search</span>
          </button>
        )}
      </div>

      {filteredWallpapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
          {filteredWallpapers.map((wallpaper) => (
            <div 
              key={wallpaper.id}
              onClick={() => {
                setSelectedHeroWallpaper(wallpaper);
              }}
              className="cursor-pointer"
            >
              <WallpaperCard
                wallpaper={wallpaper}
                isFavorite={favorites.includes(wallpaper.id)}
                isApplied={activeWallpaperId === wallpaper.id}
                onToggleFavorite={onToggleFavorite}
                onInspect={onInspect}
                onApplyDesktop={onApplyDesktop}
                onQuickDownload={onQuickDownload}
                onOpenDesktopSim={onOpenDesktopSim}
                onShare={onShare}
                onDelete={onDelete}
                enableTilt={enableTilt}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full p-16 rounded-2xl bg-[#0D0F18]/80 border border-white/10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Box className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No 3D Models Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload your first .glb or .gltf 3D model using the upload bar above.
          </p>
        </div>
      )}
    </div>
  );
};
