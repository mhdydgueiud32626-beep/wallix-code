import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  FolderCheck, 
  Folder, 
  Plus, 
  Check, 
  Sparkles, 
  Layers,
  Heart
} from 'lucide-react';
import { CollectionFolder, Wallpaper } from '../types';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: Wallpaper | null;
  collections: CollectionFolder[];
  onToggleWallpaperInCollection: (collectionId: string, wallpaperId: string) => void;
  onCreateCollection: (name: string, description?: string, color?: CollectionFolder['color']) => CollectionFolder;
}

const COLOR_OPTIONS: { id: CollectionFolder['color']; label: string; bg: string; border: string; text: string }[] = [
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', text: 'text-cyan-300' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500/20', border: 'border-purple-400/50', text: 'text-purple-300' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-400/50', text: 'text-emerald-300' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500/20', border: 'border-rose-400/50', text: 'text-rose-300' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500/20', border: 'border-amber-400/50', text: 'text-amber-300' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/20', border: 'border-indigo-400/50', text: 'text-indigo-300' },
];

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  collections,
  onToggleWallpaperInCollection,
  onCreateCollection,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState<CollectionFolder['color']>('cyan');

  if (!isOpen || !wallpaper) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const created = onCreateCollection(newFolderName.trim(), newFolderDesc.trim(), selectedColor);
    // Auto-add this wallpaper to the newly created folder
    onToggleWallpaperInCollection(created.id, wallpaper.id);

    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreatingNew(false);
  };

  return (
    <div 
      id="add-to-collection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md glass-panel-glow rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Organize in Collections</h3>
              <p className="text-xs text-slate-400">Add "{wallpaper.title}" to your folders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallpaper Snapshot preview */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <img 
            src={wallpaper.thumbnail || wallpaper.thumbnailUrl || wallpaper.imageUrl} 
            alt={wallpaper.title}
            className="w-12 h-12 object-cover rounded-xl border border-white/10 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{wallpaper.title}</p>
            <p className="text-[11px] text-cyan-300/80">{wallpaper.category} • {wallpaper.resolutionText || '4K UHD'}</p>
          </div>
        </div>

        {/* Existing Collections List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
            <span>Your Collections ({collections.length})</span>
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingNew ? 'Cancel' : 'New Folder'}</span>
            </button>
          </div>

          {/* New Folder Creation Form */}
          {isCreatingNew && (
            <form onSubmit={handleCreateSubmit} className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-cyan-300">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cyberpunk Vibes, Chill Anime..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-black/50 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short theme notes..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full bg-black/50 text-xs text-white placeholder-slate-500 px-3 py-1.5 rounded-xl border border-white/15 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Color Tag Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-medium">Color Accent</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        selectedColor === c.id 
                          ? `${c.bg} ${c.border} ${c.text} shadow-sm`
                          : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition cursor-pointer"
              >
                Create & Add Wallpaper
              </button>
            </form>
          )}

          {/* Collection Items */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {collections.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <Folder className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No collections created yet.</p>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-400/40 hover:bg-cyan-500/30 transition cursor-pointer"
                >
                  Create Your First Folder
                </button>
              </div>
            ) : (
              collections.map((folder) => {
                const isInside = folder.wallpaperIds.includes(wallpaper.id);

                return (
                  <button
                    key={folder.id}
                    id={`collection-folder-toggle-${folder.id}`}
                    onClick={() => onToggleWallpaperInCollection(folder.id, wallpaper.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
                      isInside
                        ? 'bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/60 border-cyan-400/60 shadow-md shadow-cyan-950/30 text-white'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl border transition ${
                        isInside 
                          ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/40 shadow-inner' 
                          : 'bg-black/30 text-slate-400 border-white/10 group-hover:text-cyan-300'
                      }`}>
                        {isInside ? <FolderCheck className="w-4 h-4 text-cyan-300" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate group-hover:text-cyan-200 transition-colors">
                          {folder.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {folder.wallpaperIds.length} item{folder.wallpaperIds.length === 1 ? '' : 's'}
                          {folder.description ? ` • ${folder.description}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                      isInside 
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_8px_rgba(6,182,212,0.6)]' 
                        : 'border-white/20 bg-black/30 group-hover:border-white/40'
                    }`}>
                      {isInside && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Done / Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
