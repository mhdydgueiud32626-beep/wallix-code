import React, { useState, useMemo } from 'react';
import { InstalledApp, DiscoveryStatus } from '../../types/nativeApp';
import { InstalledAppCard } from './InstalledAppCard';
import { Search, Filter, Plus, RefreshCw, Layers, ShieldCheck, WifiOff, Sparkles } from 'lucide-react';

interface InstalledAppGridProps {
  apps: InstalledApp[];
  status: DiscoveryStatus;
  pinnedIds: string[];
  hiddenIds: string[];
  onLaunchApp: (appId: string) => Promise<void>;
  onTogglePin: (appId: string) => void;
  onHideApp: (appId: string) => void;
  onRefresh: () => void;
  onOpenManualModal: () => void;
}

export const InstalledAppGrid: React.FC<InstalledAppGridProps> = ({
  apps,
  status,
  pinnedIds,
  hiddenIds,
  onLaunchApp,
  onTogglePin,
  onHideApp,
  onRefresh,
  onOpenManualModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showHidden, setShowHidden] = useState(false);

  // Available categories derived dynamically from discovered apps
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const app of apps) {
      if (app.category) cats.add(app.category);
    }
    return ['All', ...Array.from(cats).sort()];
  }, [apps]);

  // Filtered applications
  const visibleApps = useMemo(() => {
    return apps.filter(app => {
      // Hidden filter
      const isHidden = hiddenIds.includes(app.id);
      if (isHidden && !showHidden) return false;

      // Category filter
      if (selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesCategory = (app.category || '').toLowerCase().includes(q);
        return matchesName || matchesCategory;
      }

      return true;
    });
  }, [apps, hiddenIds, showHidden, selectedCategory, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="installed-apps-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search installed applications..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-black/40 border border-white/10 focus:border-blue-500/50 text-white placeholder-white/40 text-xs sm:text-sm backdrop-blur-md outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer text-xs ${
                  isActive
                    ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 font-medium'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Apps Grid */}
      {visibleApps.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-1">
          {visibleApps.map((app) => (
            <InstalledAppCard
              key={app.id}
              app={app}
              isPinned={pinnedIds.includes(app.id)}
              onLaunch={onLaunchApp}
              onTogglePin={onTogglePin}
              onHideApp={onHideApp}
            />
          ))}
        </div>
      ) : (
        /* Empty / Fallback State */
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl text-center">
          {status === 'unavailable' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                <WifiOff className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                Connect WALLIX to your device to automatically detect installed applications.
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-md mb-5 leading-relaxed">
                The local native bridge connector is currently offline. You can start the local connector or manually add application shortcuts to your environment.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onRefresh}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Bridge Connection</span>
                </button>
                <button
                  onClick={onOpenManualModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Application Manually</span>
                </button>
              </div>
            </>
          ) : searchQuery ? (
            <>
              <Search className="w-10 h-10 text-white/30 mb-2" />
              <h4 className="text-sm font-medium text-white mb-1">No applications match "{searchQuery}"</h4>
              <p className="text-xs text-white/50 mb-3">Try checking for typos or clear your filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-blue-400/50 mb-2 animate-pulse" />
              <h4 className="text-sm font-medium text-white mb-1">Scanning local environment...</h4>
              <p className="text-xs text-white/50">Discovered applications will appear here automatically.</p>
            </>
          )}
        </div>
      )}

      {/* Grid Footer Controls */}
      <div className="flex items-center justify-between text-[11px] text-white/50 px-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span>Showing {visibleApps.length} of {apps.length} applications</span>
          {hiddenIds.length > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {showHidden ? 'Hide hidden items' : `Show ${hiddenIds.length} hidden`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/40">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400/70" />
          <span>Local execution restricted to allowlisted targets</span>
        </div>
      </div>
    </div>
  );
};
