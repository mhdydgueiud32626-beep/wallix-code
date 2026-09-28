import React, { useState } from 'react';
import { 
  Globe, 
  Sparkles, 
  Heart, 
  Download, 
  Check, 
  Layers, 
  Palette, 
  Sliders, 
  Search, 
  Filter, 
  Plus, 
  Share2, 
  Clock, 
  Music, 
  Sun, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  FileJson,
  LayoutTemplate,
  Monitor,
  CheckCircle2
} from 'lucide-react';
import { CommunityPreset, Wallpaper } from '../types';
import { THEME_PRESETS } from '../data/colorPresets';
import { downloadFile } from '../desktop/backgroundEngine';
import { DESKTOP_SKETCH_PRESETS, DesktopPresetItem } from '../data/layoutPresets';

interface CommunityMarketplaceViewProps {
  presets: CommunityPreset[];
  onApplyPreset: (preset: CommunityPreset) => void;
  onOpenPublishModal: () => void;
  onSelectWallpaper?: (wallpaper: Wallpaper) => void;
  activePresetId?: string | null;
  onSelectSketchPreset?: (preset: DesktopPresetItem) => void;
}

export const CommunityMarketplaceView: React.FC<CommunityMarketplaceViewProps> = ({
  presets,
  onApplyPreset,
  onOpenPublishModal,
  activePresetId,
  onSelectSketchPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [likedPresetIds, setLikedPresetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_liked_presets');
      return saved ? JSON.parse(saved) : ['preset-cyber-samurai-2077'];
    } catch {
      return ['preset-cyber-samurai-2077'];
    }
  });

  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const categories = ['All', 'Cyberpunk', 'Anime', 'Minimal', 'OLED Dark', 'Synthwave', '3D Live', 'Nature'];

  const toggleLike = (presetId: string) => {
    let next: string[];
    if (likedPresetIds.includes(presetId)) {
      next = likedPresetIds.filter((id) => id !== presetId);
    } else {
      next = [...likedPresetIds, presetId];
    }
    setLikedPresetIds(next);
    try {
      localStorage.setItem('wallix_liked_presets', JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save liked presets', e);
    }
  };

  const handleApply = (preset: CommunityPreset) => {
    setAppliedPresetId(preset.id);
    onApplyPreset(preset);
    setTimeout(() => {
      setAppliedPresetId(null);
    }, 2000);
  };

  const handleDownloadJson = (preset: CommunityPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(
      JSON.stringify(preset, null, 2),
      `wallix_preset_${preset.id}.json`,
      'application/json'
    );
  };

  const filteredPresets = presets.filter((preset) => {
    const matchesCategory = selectedCategory === 'All' || preset.category === selectedCategory;
    const matchesSearch =
      preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.author.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div id="community-marketplace-view" className="space-y-8 animate-fadeIn pb-16">
      
      {/* ========================================================================= */}
      {/* COMMUNITY HERO BANNER */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/70 via-zinc-900/90 to-purple-950/60 border border-white/10 p-6 md:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-400/40 flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span>COMMUNITY PRESET MARKETPLACE</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-400/30">
                1-Click Apply Ready
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Community Hub & Preset Switcher
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Explore user-submitted combos and native <span className="text-cyan-300 font-semibold">Preset Layouts</span> with live Analog/Digital Clock widgets, Weather, Audio, and Sonoma App Dock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="publish-setup-hero-btn"
              onClick={onOpenPublishModal}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs md:text-sm shadow-xl shadow-cyan-500/25 transition cursor-pointer flex items-center gap-2 group transform active:scale-95"
            >
              <Share2 className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span>Publish Current Setup</span>
            </button>
          </div>
        </div>

        {/* Community Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="p-2 rounded-xl bg-white/5 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white font-mono text-sm">{presets.length} Active Presets</div>
              <div className="text-[10px] text-slate-400">Curated & User Uploads</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <div className="p-2 rounded-xl bg-white/5 text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white font-mono text-sm">11.4k+ Applied</div>
              <div className="text-[10px] text-slate-400">Instant One-Click Sync</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <div className="p-2 rounded-xl bg-white/5 text-rose-400">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white font-mono text-sm">7.1k Community Likes</div>
              <div className="text-[10px] text-slate-400">Verified Creators</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <div className="p-2 rounded-xl bg-white/5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white font-mono text-sm">JSON Portable</div>
              <div className="text-[10px] text-slate-400">Windows 11 / macOS / C#</div>
            </div>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* SEARCH AND CATEGORY FILTER BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-white/10">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, @handle, or tag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMMUNITY PRESETS GRID */}
      {/* ========================================================================= */}
      {filteredPresets.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-white/10 space-y-3">
          <Palette className="w-8 h-8 text-cyan-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No presets found matching "{searchQuery}"</h3>
          <p className="text-xs text-slate-400">Try adjusting your search terms or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => {
            const isLiked = likedPresetIds.includes(preset.id);
            const isCurrentlyApplied = appliedPresetId === preset.id || activePresetId === preset.id;
            const presetLutInfo = THEME_PRESETS.find((p) => p.id === preset.colorGrade.presetId);

            return (
              <div
                key={preset.id}
                id={`preset-card-${preset.id}`}
                className="group relative rounded-3xl overflow-hidden bg-zinc-900/80 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-cyan-950/30"
              >
                {/* 1. Card Media Preview with active CSS Color LUT overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img
                    src={preset.previewImage}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Live CSS Color LUT Preview Overlay on card */}
                  {presetLutInfo && presetLutInfo.id !== 'none' && (
                    <div
                      className={`absolute inset-0 pointer-events-none ${presetLutInfo.className}`}
                      style={{ opacity: preset.colorGrade.intensity }}
                    />
                  )}

                  {/* Ambient Bottom Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Badges (Category & LUT details) */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-cyan-300 font-mono text-[10px] font-bold border border-white/15 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-cyan-400" />
                      <span>{preset.colorGrade.name} ({Math.round(preset.colorGrade.intensity * 100)}%)</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(preset.id);
                      }}
                      className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer flex items-center gap-1 text-xs ${
                        isLiked
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50'
                          : 'bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/15'
                      }`}
                      title={isLiked ? 'Unlike Preset' : 'Like Preset'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-300'}`} />
                      <span className="font-mono text-[10px] font-bold">
                        {preset.likesCount + (isLiked ? 1 : 0)}
                      </span>
                    </button>
                  </div>

                  {/* Active Sonoma Widget Indicators Badge Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-[10px]">
                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-slate-300 font-mono">
                      <Sliders className="w-3 h-3 text-indigo-400" />
                      <span>Widgets:</span>
                      {preset.widgets.clock && <span className="text-cyan-300 font-bold">Clock</span>}
                      {preset.widgets.music && <span className="text-purple-300 font-bold">• Audio</span>}
                      {preset.widgets.weather && <span className="text-amber-300 font-bold">• Weather</span>}
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold">
                      {preset.category}
                    </span>
                  </div>
                </div>

                {/* 2. Card Details Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Author Badge & Handle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={preset.author.avatar}
                          alt={preset.author.name}
                          className="w-6 h-6 rounded-full object-cover border border-cyan-400/40"
                        />
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-bold text-slate-200">{preset.author.name}</span>
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold">{preset.author.handle}</span>
                          {preset.author.verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                          )}
                        </div>
                      </div>

                      {preset.author.badge && (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[9px] font-mono font-bold uppercase border border-white/10">
                          {preset.author.badge}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {preset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 text-[10px] font-mono border border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3. Card Footer with Downloads Count, JSON Export, and 1-Click Apply */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>{preset.downloadsCount}</span>
                      </span>
                      <button
                        onClick={(e) => handleDownloadJson(preset, e)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                        title="Download raw wallix_preset.json"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleApply(preset)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-lg ${
                        isCurrentlyApplied
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 group-hover:shadow-cyan-500/40'
                      }`}
                    >
                      {isCurrentlyApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply Preset</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
