import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Check, 
  Layers, 
  Palette, 
  Download, 
  Share2, 
  Globe, 
  User, 
  Sliders, 
  Tag, 
  FileJson,
  Monitor
} from 'lucide-react';
import { Wallpaper, CommunityPreset } from '../types';
import { ColorGradePreset } from '../data/colorPresets';
import { downloadFile } from '../desktop/backgroundEngine';
import confetti from 'canvas-confetti';

interface PublishPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallpaper: Wallpaper;
  activeColorTheme: ColorGradePreset;
  colorIntensity: number;
  onPublishSuccess: (newPreset: CommunityPreset) => void;
}

const CATEGORY_OPTIONS: Array<CommunityPreset['category']> = [
  'Cyberpunk',
  'Anime',
  'Minimal',
  'OLED Dark',
  'Synthwave',
  '3D Live',
  'Nature',
];

const SUGGESTED_TAGS = [
  'Neon', 'Lo-Fi', 'Warm', 'Cozy', 'OLED', '4K UHD', '3D Shaders', 'Clock Stack', 'Minimalist', 'Retro', 'AMOLED'
];

export const PublishPresetModal: React.FC<PublishPresetModalProps> = ({
  isOpen,
  onClose,
  activeWallpaper,
  activeColorTheme,
  colorIntensity,
  onPublishSuccess,
}) => {
  const [title, setTitle] = useState(`${activeWallpaper.title} Setup`);
  const [description, setDescription] = useState(
    `Custom ${activeColorTheme.name} theme setup with 4K depth parallax, widgets, and vibrant color grading.`
  );
  const [authorName, setAuthorName] = useState('Alex Rivera');
  const [authorHandle, setAuthorHandle] = useState('@CyberSamurai');
  const [category, setCategory] = useState<CommunityPreset['category']>('Cyberpunk');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Neon', 'Cyberpunk', '4K UHD']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);

    const presetPayload: CommunityPreset = {
      id: `custom-preset-${Date.now()}`,
      title: title.trim() || `${activeWallpaper.title} Setup`,
      description: description.trim() || 'Custom community setup.',
      tags: selectedTags.length > 0 ? selectedTags : ['Custom', 'Community'],
      category,
      author: {
        name: authorName.trim() || 'Anonymous Creator',
        handle: authorHandle.startsWith('@') ? authorHandle.trim() : `@${authorHandle.trim() || 'Creator'}`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        badge: 'CREATOR',
        verified: true,
      },
      wallpaperId: activeWallpaper.id,
      wallpaperTitle: activeWallpaper.title,
      previewImage: activeWallpaper.imageUrl || activeWallpaper.thumbnail || activeWallpaper.thumbnailUrl,
      isVideo: activeWallpaper.isVideo || !!activeWallpaper.videoUrl,
      is3D: activeWallpaper.is3D || activeWallpaper.isLive,
      colorGrade: {
        presetId: activeColorTheme.id,
        name: activeColorTheme.name,
        intensity: colorIntensity,
      },
      widgets: {
        clock: true,
        calendar: true,
        music: true,
        weather: true,
        depth3D: activeWallpaper.is3D || activeWallpaper.isLive,
      },
      downloadsCount: 1,
      likesCount: 1,
      createdAt: 'Just now',
      isCustomUserUpload: true,
    };

    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);

      // Trigger Confetti Effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#6366f1', '#a855f7', '#ec4899'],
        });
      } catch {
        // fallback
      }

      onPublishSuccess(presetPayload);

      setTimeout(() => {
        setIsPublished(false);
        onClose();
      }, 1400);
    }, 800);
  };

  const handleExportJson = () => {
    const jsonPayload = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      presetTitle: title,
      author: {
        name: authorName,
        handle: authorHandle,
      },
      wallpaper: {
        id: activeWallpaper.id,
        title: activeWallpaper.title,
        url: activeWallpaper.imageUrl,
      },
      colorGrading: {
        presetId: activeColorTheme.id,
        name: activeColorTheme.name,
        className: activeColorTheme.className,
        intensity: colorIntensity,
      },
      widgets: {
        clock: true,
        calendar: true,
        music: true,
        weather: true,
        layout: 'sonoma-left-dock',
      },
    };

    downloadFile(
      JSON.stringify(jsonPayload, null, 2),
      `wallix_preset_${activeColorTheme.id}_${Date.now()}.json`,
      'application/json'
    );
  };

  return (
    <div 
      id="publish-preset-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none overflow-y-auto animate-fadeIn"
    >
      <div 
        id="publish-preset-modal"
        className="w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-950/60 relative overflow-hidden space-y-6"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/30 text-cyan-300 border border-cyan-400/40 shadow-inner">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                Publish Setup to Community Hub
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-400/30">
                  LUT & Config
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Share your live color LUT, widget coordinates, and wallpaper combination with creators worldwide.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Setup Snapshot Preview Card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900/60 p-3.5 flex items-center gap-4">
          <div className="w-28 h-20 rounded-xl overflow-hidden relative flex-shrink-0 border border-white/10 shadow-lg">
            <img
              src={activeWallpaper.imageUrl || activeWallpaper.thumbnail}
              alt={activeWallpaper.title}
              className="w-full h-full object-cover"
            />
            {/* Live Color LUT Overlay preview */}
            {activeColorTheme.id !== 'none' && (
              <div 
                className={`absolute inset-0 pointer-events-none ${activeColorTheme.className}`}
                style={{ opacity: colorIntensity }}
              />
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300 font-bold">
              {Math.round(colorIntensity * 100)}% LUT
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{activeWallpaper.title}</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold border border-indigo-400/30">
                {activeColorTheme.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-cyan-400" />
                LUT: <span className="font-mono text-slate-300 font-semibold">{activeColorTheme.name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-400" />
                Widgets: <span className="font-mono text-slate-300 font-semibold">Sonoma 4-Stack</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeWallpaper.category} • {activeWallpaper.resolution}
            </p>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="space-y-4 relative z-10 text-xs">
          {/* Preset Title */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Preset Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neo-Tokyo Cyberpunk 2077 Night"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Author Name & Handle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                Creator Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                Community Handle
              </label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                placeholder="e.g. @CyberSamurai"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Theme Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer text-xs ${
                    category === cat
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Preset Tags & Keywords
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTED_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/40 text-cyan-300 border border-cyan-400/50'
                        : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Add custom tag (Press Enter)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Preset Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what makes this configuration special..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition text-xs"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 relative z-10">
          <button
            type="button"
            onClick={handleExportJson}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
            title="Download local JSON payload for backup or offline import"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export wallix_preset.json</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPublishing || isPublished}
              onClick={handlePublish}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPublished ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Published to Community!</span>
                </>
              ) : isPublishing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Packaging Preset JSON...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Publish to Community Hub</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
