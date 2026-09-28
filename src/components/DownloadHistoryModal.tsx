import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  Monitor, 
  Check, 
  Eye, 
  Share2, 
  Clock, 
  Search, 
  HardDrive,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DownloadHistoryItem, Wallpaper } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';

interface DownloadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadHistoryItem[];
  activeWallpaperId?: string;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onReDownload: (item: DownloadHistoryItem) => void;
  onApplyDesktop: (wallpaper: Wallpaper) => void;
  onInspect: (wallpaper: Wallpaper) => void;
  onShare: (wallpaper: Wallpaper) => void;
}

export const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({
  isOpen,
  onClose,
  downloads,
  activeWallpaperId,
  onClearHistory,
  onRemoveItem,
  onReDownload,
  onApplyDesktop,
  onInspect,
  onShare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <div 
      id="download-history-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl bg-[#0D1019]/95 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#111422]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] tracking-tight">
                  Wallpaper Download History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {downloads.length} {downloads.length === 1 ? 'Master' : 'Masters'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Offline master archive & high-resolution export records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloads.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Clear all download records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {downloads.length > 0 && (
          <div className="p-4 border-b border-white/10 bg-black/40">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloaded wallpapers by title, category, or date..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141824] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Downloads List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {filteredDownloads.length > 0 ? (
            <AnimatePresence>
              {filteredDownloads.map((item) => {
                const { wallpaper } = item;
                const isApplied = activeWallpaperId === wallpaper.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group rounded-2xl p-3 bg-[#131726]/80 hover:bg-[#181d30] border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                  >
                    {/* Thumbnail & Title Info */}
                    <div 
                      className="flex items-center gap-3.5 min-w-0 cursor-pointer"
                      onClick={() => onInspect(wallpaper)}
                    >
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 group-hover:border-cyan-400/60 transition">
                        <img
                          src={wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl}
                          alt={wallpaper.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {sanitizeWallpaperTitle(wallpaper.title)}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                          <span className="text-cyan-400 font-medium">{wallpaper.category}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">{item.resolution}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            {item.downloadedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <button
                        onClick={() => onReDownload(item)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 hover:border-cyan-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Re-download full resolution master"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Download</span>
                      </button>

                      <button
                        onClick={() => onApplyDesktop(wallpaper)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                            : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10'
                        }`}
                        title="Apply wallpaper to live desktop"
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Apply</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleShareClick(e, item)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          copiedId === item.id
                            ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                            : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border-white/10'
                        }`}
                        title="Share link"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-cyan-300" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition cursor-pointer"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <HardDrive className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No Matching Downloads Found' : 'No Download History Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {searchQuery 
                  ? 'Try searching with a different term or clear your search input.'
                  : 'Wallpapers you download in 4K UHD or 8K Ultra resolution will be automatically logged and archived here.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111422] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WALLIX High-Fidelity Master Storage</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
