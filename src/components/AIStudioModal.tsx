import React, { useState, useRef } from 'react';
import { 
  Wand2, 
  Sparkles, 
  Upload, 
  Video, 
  Play, 
  RotateCcw, 
  Zap, 
  Sliders, 
  Check, 
  Monitor,
  X,
  FileVideo,
  Link2,
  Image as ImageIcon
} from 'lucide-react';
import { LiveShaderType, Wallpaper } from '../types';
import { ThreeLiveWallpaper } from './LiveShaders/ThreeLiveWallpaper';
import { saveMediaFile, extractVideoThumbnail } from '../utils/mediaStorage';
import confetti from 'canvas-confetti';

interface AIStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomWallpaper: (w: Wallpaper) => void;
}

export const AIStudioModal: React.FC<AIStudioModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomWallpaper,
}) => {
  const [modalMode, setModalMode] = useState<'upload' | 'shader'>('upload');
  
  // Video / Image Upload State
  const [videoUrl, setVideoUrl] = useState('/videos/sample_loop.mp4');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Anime & Concept Art');
  const [customResolution, setCustomResolution] = useState<'4K UHD' | '8K Ultra' | 'Ultrawide 21:9'>('4K UHD');
  const [isDragging, setIsDragging] = useState(false);
  
  // 3D Shader State
  const [shaderType, setShaderType] = useState<LiveShaderType>('synthwave-sunset');
  const [prompt, setPrompt] = useState('Cyberpunk neon grid with floating synthwave sun and aurora mountains');
  const [speed, setSpeed] = useState(1);
  const [wallpaperTitle, setWallpaperTitle] = useState('My Custom Live Video Wallpaper');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presets = [
    { type: 'synthwave-sunset', label: 'Synthwave Sun & Mountains', prompt: 'Neon horizon grid under retro sun' },
    { type: 'cosmic-nebula', label: 'Cosmic Quantum Nebula', prompt: 'Swirling galaxy star dust with gravitational vortex' },
    { type: 'cyber-torus', label: 'Cyberpunk Hyper-Torus', prompt: 'Chrome metallic rings and glowing energy loops' },
    { type: 'crystal-poly', label: 'Faceted Crystal Monolith', prompt: 'Refractive obsidian crystal in dark void' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setShaderType(p.type as LiveShaderType);
    setPrompt(p.prompt);
    setWallpaperTitle(p.label);
  };

  const processVideoFile = (file: File) => {
    setUploadedFile(file);
    // Instant smooth Blob Object URL for immediate preview
    const blobUrl = URL.createObjectURL(file);
    setVideoUrl(blobUrl);

    // Extract actual video frame thumbnail
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i)) {
      extractVideoThumbnail(file).then((thumb) => {
        if (thumb) setThumbnailUrl(thumb);
      });
    }

    // Clean filename dynamically for a sleek title
    let cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (cleanName.toLowerCase().includes('klickpin')) {
      cleanName = 'Crimson Samurai Blade';
    } else {
      cleanName = cleanName
        .replace(/^From\s+[\w\.\-]+[-_]*/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      if (cleanName.length > 35) {
        cleanName = cleanName.substring(0, 35).trim();
      }
    }
    setWallpaperTitle(cleanName || 'Custom Live Wallpaper');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleSave = () => {
    confetti({ particleCount: 60, spread: 70 });
    
    if (modalMode === 'upload') {
      const isVideoFile = !!videoUrl && (
        videoUrl.includes('.mp4') || 
        videoUrl.includes('.webm') || 
        videoUrl.includes('.mov') || 
        videoUrl.startsWith('blob:') || 
        !!uploadedFile?.type.includes('video')
      );
      
      const customWall: Wallpaper = {
        id: `custom-video-${Date.now()}`,
        title: wallpaperTitle || 'My Custom 4K Live Video Wallpaper',
        category: uploadCategory,
        tags: ['Live Video', '4K UHD', 'Custom Upload', '#LiveWallpaper', '60 FPS', 'Local Blob'],
        resolution: customResolution,
        resolutionText: customResolution === '4K UHD' ? '3840 × 2160' : customResolution === '8K Ultra' ? '7680 × 4320' : '3440 × 1440',
        is3D: true,
        isLive: true,
        isVideo: isVideoFile,
        videoUrl: isVideoFile ? videoUrl : undefined,
        imageUrl: isVideoFile ? (thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85') : videoUrl,
        thumbnail: thumbnailUrl || (isVideoFile ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' : videoUrl),
        thumbnailUrl: thumbnailUrl || (isVideoFile ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' : videoUrl),
        author: { name: 'You (Creator)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'CREATOR' },
        downloads: 1,
        likes: 1,
        featured: true,
        aspectRatio: '16:9',
        depthIntensity: 1.5,
        description: `Custom live 60 FPS HTML5 video wallpaper uploaded via WALLIX Local Blob Engine.`,
        colors: ['#06B6D4', '#6366F1', '#38BDF8'],
        fileSize: uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : '18.5 MB',
        fps: 60,
        badge: 'NEW',
      };

      if (uploadedFile) {
        saveMediaFile(customWall.id, uploadedFile, customWall.title);
      }

      onSaveCustomWallpaper(customWall);
    } else {
      const customWall: Wallpaper = {
        id: `custom-shader-${Date.now()}`,
        title: wallpaperTitle,
        category: 'Cyberpunk',
        tags: ['Live', '3D', 'AI Generated', 'Custom', 'WebGL'],
        resolution: '4K UHD',
        resolutionText: '3840 × 2160',
        is3D: true,
        isLive: true,
        shaderType,
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2400&q=85',
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        author: { name: 'You (WALLIX Studio)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'CREATOR' },
        downloads: 1,
        likes: 1,
        featured: true,
        aspectRatio: '16:9',
        depthIntensity: 1.5,
        description: `Custom procedural 3D live wallpaper tuned with WALLIX Studio: ${prompt}`,
        colors: ['#6366F1', '#06B6D4', '#EC4899'],
        fileSize: '15.2 MB',
        fps: 120,
        badge: 'NEW',
      };

      onSaveCustomWallpaper(customWall);
    }
    
    onClose();
  };

  return (
    <div 
      id="ai-studio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] glass-panel-glow rounded-3xl border border-white/15 overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Real 3D WebGL Canvas OR HTML5 Video Preview */}
        <div className="flex-1 min-h-[360px] md:min-h-[500px] bg-slate-950 relative flex items-center justify-center overflow-hidden">
          {modalMode === 'upload' ? (
            videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Video className="w-16 h-16 text-cyan-400/50 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-slate-200">Upload or link an MP4 / WebM / MOV video</p>
                <p className="text-xs text-slate-500 mt-1">Live 60 FPS video background preview will appear here</p>
              </div>
            )
          ) : (
            <ThreeLiveWallpaper shaderType={shaderType} speedMultiplier={speed} className="w-full h-full" />
          )}

          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{modalMode === 'upload' ? 'Live HTML5 Video Engine (60 FPS)' : 'Real-Time WebGL 3D Shader'}</span>
          </div>

          <div className="absolute bottom-4 left-4 z-10 text-xs text-slate-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            {modalMode === 'upload' ? (
              <span className="font-mono text-cyan-300">Native 4K / 8K Video Loop</span>
            ) : (
              <>Speed: <span className="font-mono text-cyan-300">{speed.toFixed(1)}x</span></>
            )}
          </div>
        </div>

        {/* Right Side: Studio Parameters */}
        <div className="w-full md:w-96 p-6 bg-[#0E1017] border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-cyan-300 border border-indigo-500/30">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">WALLIX Live Studio</h3>
                <p className="text-xs text-slate-400">Import live video (.mp4/.webm/.mov) or shaders</p>
              </div>
            </div>

            {/* Studio Header Note */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-slate-300">
              <FileVideo className="w-4 h-4 text-cyan-400" />
              <span>Upload Video Wallpaper</span>
            </div>

            {modalMode === 'upload' ? (
              <div className="space-y-3">
                {/* File Upload Button & Drag Drop Area */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full py-5 px-4 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    isDragging 
                      ? 'border-cyan-400 bg-cyan-500/20 scale-[1.02]' 
                      : 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40'
                  }`}
                >
                  <Upload className="w-6 h-6 text-cyan-400 animate-bounce" />
                  <span className="text-xs font-bold text-slate-200">
                    {uploadedFile ? uploadedFile.name : 'Drop .mp4, .webm, or .mov video here'}
                  </span>
                  <span className="text-[10px] text-cyan-300/80">Local Browser Blob URL Engine • 60 FPS Auto-play</span>
                </div>

                {/* Video URL Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Or Direct Video URL</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://.../wallpaper.mp4"
                    className="w-full bg-[#141622] text-xs text-cyan-300 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Wallpaper Title</label>
                  <input
                    type="text"
                    value={wallpaperTitle}
                    onChange={(e) => setWallpaperTitle(e.target.value)}
                    className="w-full bg-[#141622] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category & Resolution */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-[#141622] text-xs text-slate-200 px-2 py-1.5 rounded-xl border border-white/10 focus:outline-none"
                    >
                      <option value="Anime & Concept Art">Anime & Concept Art</option>
                      <option value="Space & Nebula Abyss">Space & Nebula Abyss</option>
                      <option value="Dark AMOLED & Void">Dark AMOLED & Void</option>
                      <option value="Nature & Landscapes">Nature & Landscapes</option>
                      <option value="Cyberpunk & Neon">Cyberpunk & Neon</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Resolution</label>
                    <select
                      value={customResolution}
                      onChange={(e) => setCustomResolution(e.target.value as any)}
                      className="w-full bg-[#141622] text-xs text-slate-200 px-2 py-1.5 rounded-xl border border-white/10 focus:outline-none"
                    >
                      <option value="4K UHD">4K UHD</option>
                      <option value="8K Ultra">8K Ultra</option>
                      <option value="Ultrawide 21:9">Ultrawide 21:9</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Shader Engine Archetype</label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.type}
                        onClick={() => handleApplyPreset(p)}
                        className={`p-2 rounded-xl text-left text-xs font-medium border transition ${
                          shaderType === p.type
                            ? 'bg-indigo-600/30 text-cyan-300 border-indigo-500/50'
                            : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Wallpaper Name</label>
                  <input
                    type="text"
                    value={wallpaperTitle}
                    onChange={(e) => setWallpaperTitle(e.target.value)}
                    className="w-full bg-[#141622] text-xs text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Speed */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Simulation Speed</span>
                    <span className="font-mono text-cyan-400">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-purple-600 hover:from-indigo-500 hover:via-cyan-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Add to Position #1 & Play Live</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
