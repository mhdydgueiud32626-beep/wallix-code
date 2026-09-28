import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Monitor, 
  Check, 
  Eye, 
  Share2, 
  Sparkles, 
  Clock, 
  Search, 
  HardDrive,
  Layers,
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import { DownloadHistoryItem, Wallpaper } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface DownloadsViewProps {
  downloads: DownloadHistoryItem[];
  activeWallpaperId?: string;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onReDownload: (item: DownloadHistoryItem) => void;
  onApplyDesktop: (wallpaper: Wallpaper) => void;
  onInspect: (wallpaper: Wallpaper) => void;
  onShare: (wallpaper: Wallpaper) => void;
  onNavigateDiscover: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  activeWallpaperId,
  onClearHistory,
  onRemoveItem,
  onReDownload,
  onApplyDesktop,
  onInspect,
  onShare,
  onNavigateDiscover,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDownloads = downloads.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.wallpaper.title.toLowerCase().includes(q) ||
      item.wallpaper.category.toLowerCase().includes(q) ||
      item.resolution.toLowerCase().includes(q) ||
      item.downloadedAt.toLowerCase().includes(q)
    );
  });

  const handleShareClick = (e: React.MouseEvent, item: DownloadHistoryItem) => {
    e.stopPropagation();
    onShare(item.wallpaper);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="wallix-downloads-view" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-cyan-950/50 border border-white/15 shadow-2xl space-y-4">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold font-mono">
              <Download className="w-3.5 h-3.5" />
              <span>OFFLINE ARCHIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Outfit'] tracking-tight">
              Downloads History
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Browse and re-download your high-resolution masters, manage local offline logs, or instantly re-apply saved wallpapers to your desktop simulator.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Downloads</p>
              <p className="text-xl font-black text-white font-mono">{downloads.length}</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Status</p>
              <p className="text-xl font-black text-cyan-400 font-mono">4K Master</p>
            </div>
            {downloads.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-3.5 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Clear all download history logs"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar inside downloads */}
        {downloads.length > 0 && (
          <div className="relative z-10 pt-2">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloaded wallpapers by title or date..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 transition shadow-inner"
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showConfirmClear && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowConfirmClear(false)}
        >
          <div 
            className="p-6 rounded-3xl glass-panel-glow border border-rose-500/30 bg-[#0F111A] max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear Download History?</h3>
                <p className="text-xs text-slate-400">This will remove all logged timestamps from your local history.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downloads List / Grid */}
      {filteredDownloads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <AnimatePresence>
            {filteredDownloads.map((item) => {
              const { wallpaper } = item;
              const isApplied = activeWallpaperId === wallpaper.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-cyan-400/60 bg-[#0E1017] shadow-xl hover:shadow-2xl hover:shadow-cyan-950/60 transition-all duration-300 flex flex-col"
                >
                  {/* Aspect Ratio Preview */}
                  <div 
                    className="relative w-full aspect-[16/10] overflow-hidden bg-[#0A0C14] cursor-pointer"
                    onClick={() => onInspect(wallpaper)}
                  >
                    <img
                      src={wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl}
                      alt={wallpaper.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 backdrop-blur-md">
                        {item.resolution}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(item.id);
                        }}
                        className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-500/30 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition cursor-pointer backdrop-blur-md"
                        title="Remove entry from downloads history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title & Category Info */}
                    <div className="absolute top-9 left-3 right-3 z-10 pointer-events-none">
                      <p className="text-xs font-bold text-white truncate drop-shadow-md">
                        {sanitizeWallpaperTitle(wallpaper.title)}
                      </p>
                      <p className="text-[10px] text-cyan-200 font-medium truncate drop-shadow-sm">
                        {wallpaper.category}
                      </p>
                    </div>

                    {/* Timestamp HUD Pill */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Clock className="w-3 h-3" />
                        <span>{item.downloadedAt}</span>
                      </span>
                      <span className="text-slate-400 font-bold">{wallpaper.fileSize}</span>
                    </div>
                  </div>

                  {/* Action Controls Bar */}
                  <div className="p-3 bg-[#0A0C14]/90 border-t border-white/10 flex items-center gap-1.5">
                    {/* Re-Download Button */}
                    <button
                      onClick={() => onReDownload(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold btn-primary-glow text-white transition cursor-pointer"
                      title="Re-download full 4K / 8K resolution file"
                    >
                      <RefreshCw className="w-3 h-3 text-cyan-200" />
                      <span>Re-download</span>
                    </button>

                    {/* Apply as Wallpaper Button */}
                    <button
                      onClick={() => onApplyDesktop(wallpaper)}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isApplied
                          ? 'btn-applied-emerald'
                          : 'btn-tertiary-glass text-slate-200 hover:text-white'
                      }`}
                      title="Apply wallpaper to your active desktop engine"
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-3 h-3 text-slate-300" />
                          <span>Apply</span>
                        </>
                      )}
                    </button>

                    {/* Share Link Button */}
                    <button
                      onClick={(e) => handleShareClick(e, item)}
                      className={`p-2 rounded-xl btn-tertiary-glass transition cursor-pointer ${
                        copiedId === item.id
                          ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-500/30'
                          : 'text-slate-300 hover:text-cyan-300'
                      }`}
                      title="Copy Shareable Link (?wallpaperId=)"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-cyan-300" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Inspect Button */}
                    <button
                      onClick={() => onInspect(wallpaper)}
                      className="p-2 rounded-xl btn-tertiary-glass text-slate-300 hover:text-white transition cursor-pointer"
                      title="Inspect in 3D Parallax Viewer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-panel rounded-3xl border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 text-cyan-300 shadow-xl shadow-indigo-950/60">
            <Download className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              {searchQuery ? 'No Matching Downloads Found' : 'No Download History Yet'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery 
                ? 'Try searching with a different wallpaper title or clear your search input.' 
                : 'Whenever you download a 4K UHD or 8K Ultra master, it will be automatically archived here with exact timestamps.'}
            </p>
          </div>
          <button
            onClick={onNavigateDiscover}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer hover:scale-105"
          >
            <span>Explore Wallpapers Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
