import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  FolderCheck, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowLeft, 
  Monitor, 
  Download, 
  Heart, 
  Eye, 
  Layers, 
  Check, 
  Shuffle,
  Grid,
  Filter,
  X,
  Share2
} from 'lucide-react';
import { CollectionFolder, Wallpaper } from '../types';
import { WallpaperCard } from './WallpaperCard';

interface CollectionsViewProps {
  collections: CollectionFolder[];
  wallpapers: Wallpaper[];
  favorites: string[];
  activeWallpaperId?: string;
  onToggleFavorite: (id: string) => void;
  onInspect: (w: Wallpaper) => void;
  onApplyDesktop: (w: Wallpaper) => void;
  onQuickDownload: (w: Wallpaper) => void;
  onOpenDesktopSim?: (w: Wallpaper) => void;
  onShare?: (w: Wallpaper) => void;
  onOpenAddToCollection: (w: Wallpaper) => void;
  onCreateCollection: (name: string, description?: string, color?: CollectionFolder['color']) => CollectionFolder;
  onUpdateCollection: (id: string, updates: Partial<CollectionFolder>) => void;
  onDeleteCollection: (id: string) => void;
  onRemoveFromCollection: (collectionId: string, wallpaperId: string) => void;
  onDelete?: (id: string) => void;
  enableTilt?: boolean;
  onNavigateDiscover: () => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  cyan: { bg: 'from-cyan-950/40 via-cyan-900/20 to-slate-900/60', border: 'border-cyan-500/30 hover:border-cyan-400/60', text: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40', glow: 'shadow-cyan-950/50' },
  purple: { bg: 'from-purple-950/40 via-purple-900/20 to-slate-900/60', border: 'border-purple-500/30 hover:border-purple-400/60', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40', glow: 'shadow-purple-950/50' },
  emerald: { bg: 'from-emerald-950/40 via-emerald-900/20 to-slate-900/60', border: 'border-emerald-500/30 hover:border-emerald-400/60', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', glow: 'shadow-emerald-950/50' },
  rose: { bg: 'from-rose-950/40 via-rose-900/20 to-slate-900/60', border: 'border-rose-500/30 hover:border-rose-400/60', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-400/40', glow: 'shadow-rose-950/50' },
  amber: { bg: 'from-amber-950/40 via-amber-900/20 to-slate-900/60', border: 'border-amber-500/30 hover:border-amber-400/60', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40', glow: 'shadow-amber-950/50' },
  indigo: { bg: 'from-indigo-950/40 via-indigo-900/20 to-slate-900/60', border: 'border-indigo-500/30 hover:border-indigo-400/60', text: 'text-indigo-300', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40', glow: 'shadow-indigo-950/50' },
  orange: { bg: 'from-orange-950/40 via-orange-900/20 to-slate-900/60', border: 'border-orange-500/30 hover:border-orange-400/60', text: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300 border-orange-400/40', glow: 'shadow-orange-950/50' },
};

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  wallpapers,
  favorites,
  activeWallpaperId,
  onToggleFavorite,
  onInspect,
  onApplyDesktop,
  onQuickDownload,
  onOpenDesktopSim,
  onShare,
  onOpenAddToCollection,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRemoveFromCollection,
  onDelete,
  enableTilt = true,
  onNavigateDiscover,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CollectionFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState<CollectionFolder['color']>('cyan');

  const activeFolder = collections.find((c) => c.id === selectedFolderId);

  // Wallpapers belonging to active folder
  const folderWallpapers = activeFolder
    ? wallpapers.filter((w) => activeFolder.wallpaperIds.includes(w.id))
    : [];

  const totalOrganizedItems = collections.reduce((acc, c) => acc + c.wallpaperIds.length, 0);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    onCreateCollection(newFolderName.trim(), newFolderDesc.trim(), selectedColor);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreatingModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolder.name.trim()) return;

    onUpdateCollection(editingFolder.id, {
      name: editingFolder.name.trim(),
      description: editingFolder.description?.trim(),
      color: editingFolder.color,
    });
    setEditingFolder(null);
  };

  // =========================================================================
  // VIEW MODE 1: INSIDE A SPECIFIC FOLDER
  // =========================================================================
  if (activeFolder) {
    const colorStyle = COLOR_MAP[activeFolder.color || 'cyan'] || COLOR_MAP.cyan;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Top Breadcrumbs & Folder Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel-glow border border-white/15">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFolderId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to All Collections</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorStyle.bg} border ${colorStyle.border} ${colorStyle.text} shadow-lg`}>
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                    {activeFolder.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${colorStyle.badge}`}>
                    {folderWallpapers.length} Items
                  </span>
                </div>
                {activeFolder.description && (
                  <p className="text-xs text-slate-400 max-w-xl">{activeFolder.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {folderWallpapers.length > 0 && (
              <button
                onClick={() => {
                  const randomIdx = Math.floor(Math.random() * folderWallpapers.length);
                  onApplyDesktop(folderWallpapers[randomIdx]);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition cursor-pointer shadow-sm"
                title="Pick and set a random wallpaper from this folder"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Apply</span>
              </button>
            )}

            <button
              onClick={() => setEditingFolder(activeFolder)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-300" />
              <span>Edit Folder</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the collection "${activeFolder.name}"?`)) {
                  onDeleteCollection(activeFolder.id);
                  setSelectedFolderId(null);
                }
              }}
              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer"
              title="Delete Collection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wallpapers in this folder */}
        {folderWallpapers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mx-auto shadow-inner">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">This collection is currently empty</h3>
              <p className="text-xs text-slate-400">
                Browse our 4K / 8K wallpaper catalog or live shaders, and click "Add to Collection" to populate this folder.
              </p>
            </div>
            <button
              onClick={onNavigateDiscover}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition cursor-pointer"
            >
              Explore Discover Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {folderWallpapers.length} curated wallpaper{folderWallpapers.length === 1 ? '' : 's'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folderWallpapers.map((wallpaper) => (
                <div key={wallpaper.id} className="relative group">
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

                  {/* Top-Right Quick Remove from Folder Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromCollection(activeFolder.id, wallpaper.id);
                    }}
                    className="absolute top-2.5 right-11 z-30 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                    title="Remove from this folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Folder Modal */}
        {editingFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <form onSubmit={handleSaveEdit} className="w-full max-w-md glass-panel-glow rounded-3xl border border-white/20 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-base">Edit Collection</h3>
                <button type="button" onClick={() => setEditingFolder(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-cyan-300">Folder Name</label>
                <input
                  type="text"
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                  required
                  className="w-full bg-black/50 text-xs text-white px-3 py-2 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Description</label>
                <input
                  type="text"
                  value={editingFolder.description || ''}
                  onChange={(e) => setEditingFolder({ ...editingFolder, description: e.target.value })}
                  className="w-full bg-black/50 text-xs text-white px-3 py-2 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: MAIN COLLECTIONS DASHBOARD (Grid of all folders)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel-glow border border-white/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-cyan-300 border border-cyan-400/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              Custom Collections & Folders
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Group your favorite 4K/8K wallpapers into customized theme folders like "Cyberpunk Vibes", "Chill Anime", or "Deep Space".
          </p>
        </div>

        <button
          id="create-new-collection-btn"
          onClick={() => setIsCreatingModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition cursor-pointer hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/30">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-white font-mono">{collections.length}</p>
            <p className="text-[11px] text-slate-400">Total Folders</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-400/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-white font-mono">{totalOrganizedItems}</p>
            <p className="text-[11px] text-slate-400">Wallpapers Categorized</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-emerald-300 font-mono">100% Offline</p>
            <p className="text-[11px] text-slate-400">LocalStorage Synced</p>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((folder) => {
          const colorStyle = COLOR_MAP[folder.color || 'cyan'] || COLOR_MAP.cyan;
          const folderItems = wallpapers.filter((w) => folder.wallpaperIds.includes(w.id));
          const previewThumbnails = folderItems.slice(0, 4);

          return (
            <div
              key={folder.id}
              id={`collection-card-${folder.id}`}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`group relative rounded-3xl p-5 bg-gradient-to-br ${colorStyle.bg} border ${colorStyle.border} shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer space-y-4 hover:-translate-y-1`}
            >
              {/* Top Header of Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2.5 rounded-2xl bg-black/40 border border-white/10 ${colorStyle.text} group-hover:scale-110 transition-transform shadow-inner`}>
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate group-hover:text-cyan-200 transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {folder.description || 'Custom collection folder'}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${colorStyle.badge}`}>
                  {folder.wallpaperIds.length}
                </span>
              </div>

              {/* 4-Image Mosaic Preview Grid */}
              <div className="grid grid-cols-2 gap-1.5 aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10 p-1">
                {previewThumbnails.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center text-slate-500 space-y-1">
                    <Folder className="w-8 h-8 opacity-40" />
                    <span className="text-[11px]">Folder is empty</span>
                  </div>
                ) : (
                  [0, 1, 2, 3].map((idx) => {
                    const item = previewThumbnails[idx];
                    if (!item) {
                      return (
                        <div key={idx} className="bg-black/30 rounded-xl flex items-center justify-center border border-white/5">
                          <span className="text-[9px] text-slate-600 font-mono">+</span>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                        <img
                          src={item.thumbnail || item.thumbnailUrl || item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                  Click to open & manage →
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingFolder(folder)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Rename / Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete collection "${folder.name}"?`)) {
                        onDeleteCollection(folder.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Create New Collection */}
      {isCreatingModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsCreatingModal(false)}
        >
          <form 
            onSubmit={handleCreateNew} 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-panel-glow rounded-3xl border border-white/20 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Create New Collection</h3>
              </div>
              <button type="button" onClick={() => setIsCreatingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-300">Collection Name</label>
              <input
                type="text"
                placeholder="e.g. Cyberpunk Vibes, Chill Anime, Lo-Fi Chill..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
                className="w-full bg-black/50 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief description of this wallpaper folder..."
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                className="w-full bg-black/50 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">Color Theme Accent</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cyan', 'purple', 'emerald', 'rose', 'amber', 'indigo'] as const).map((colorKey) => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setSelectedColor(colorKey)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer capitalize ${
                      selectedColor === colorKey
                        ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-md'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {colorKey}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition cursor-pointer"
              >
                Create Collection
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
