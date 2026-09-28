import React, { useState, useEffect } from 'react';
import { InstalledApp, NativeAppPreferences, DiscoveryStatus } from '../../types/nativeApp';
import { AppNormalizer } from '../../services/nativeApp/AppNormalizer';
import { 
  X, Search, Pin, EyeOff, Eye, RefreshCw, Plus, ShieldCheck, 
  CheckCircle, AlertTriangle, Layers, Sliders, Check
} from 'lucide-react';

interface AppManagerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledApp[];
  status: DiscoveryStatus;
  preferences: NativeAppPreferences;
  onTogglePin: (appId: string) => void;
  onToggleHide: (appId: string) => void;
  onUpdatePreferences: (prefs: Partial<NativeAppPreferences>) => void;
  onRefreshScan: () => void;
  onAddManualApp: (data: { name: string; category?: string; icon?: string; launchTarget?: string }) => Promise<void>;
  platform: 'windows' | 'macos';
}

export const AppManager: React.FC<AppManagerProps> = ({
  isOpen,
  onClose,
  apps,
  status,
  preferences,
  onTogglePin,
  onToggleHide,
  onUpdatePreferences,
  onRefreshScan,
  onAddManualApp,
  platform
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'hidden' | 'settings' | 'manual' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual app state
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Web Browsers');
  const [manualTarget, setManualTarget] = useState('');
  const [manualIcon, setManualIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Security test suite state
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runSecurityTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/connector/apps/tests');
      const data = await res.json();
      if (data && data.results) {
        setTestResults(data.results);
      }
    } catch {
      // fallback
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security' && testResults.length === 0) {
      runSecurityTests();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const filteredApps = apps.filter(app => {
    if (activeTab === 'pinned' && !preferences.pinnedAppIds.includes(app.id)) return false;
    if (activeTab === 'hidden' && !preferences.hiddenAppIds.includes(app.id)) return false;
    if (activeTab === 'all' && preferences.hiddenAppIds.includes(app.id)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(q) || (app.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddManualApp({
        name: manualName.trim(),
        category: manualCategory,
        launchTarget: manualTarget.trim() || manualName.trim(),
        icon: manualIcon.trim()
      });
      setManualSuccess(true);
      setManualName('');
      setManualTarget('');
      setManualIcon('');
      setTimeout(() => {
        setManualSuccess(false);
        setActiveTab('all');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        id="wallix-app-manager-modal"
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900/90 border border-white/20 shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Application Manager</h3>
              <p className="text-xs text-white/50">
                Native bridge detected {apps.length} local applications ({platform === 'macos' ? 'macOS' : 'Windows'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshScan}
              disabled={status === 'refreshing' || status === 'scanning'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Rescan Applications"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'refreshing' || status === 'scanning' ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/10 bg-black/20 text-xs overflow-x-auto">
          {[
            { id: 'all', label: `All Apps (${apps.length})` },
            { id: 'pinned', label: `Pinned to Dock (${preferences.pinnedAppIds.length})` },
            { id: 'hidden', label: `Hidden (${preferences.hiddenAppIds.length})` },
            { id: 'manual', label: '+ Add Manual App' },
            { id: 'settings', label: 'Dock & Environment Settings' },
            { id: 'security', label: 'Security & Integrity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* TAB: App List (All / Pinned / Hidden) */}
          {(activeTab === 'all' || activeTab === 'pinned' || activeTab === 'hidden') && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter applications by name or category..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm outline-none focus:border-blue-500/50"
                />
              </div>

              {/* List */}
              {filteredApps.length > 0 ? (
                <div className="space-y-2">
                  {filteredApps.map((app) => {
                    const isPinned = preferences.pinnedAppIds.includes(app.id);
                    const isHidden = preferences.hiddenAppIds.includes(app.id);
                    const gradient = AppNormalizer.getAppGradient(app.name);

                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                            {app.icon ? (
                              <img src={app.icon} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm`}>
                                {app.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">{app.name}</h4>
                            <p className="text-xs text-white/50 truncate">{app.category || 'Application'}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onTogglePin(app.id)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                              isPinned
                                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                            <span>{isPinned ? 'Pinned' : 'Pin to Dock'}</span>
                          </button>

                          <button
                            onClick={() => onToggleHide(app.id)}
                            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                              isHidden
                                ? 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                            }`}
                            title={isHidden ? 'Restore to grid' : 'Hide from grid'}
                          >
                            {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-white/50 text-sm">
                  No applications found in this view.
                </div>
              )}
            </div>
          )}

          {/* TAB: Manual Application Add */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h4 className="text-base font-medium text-white">Add Custom Application Shortcut</h4>
                <p className="text-xs text-white/60 mt-1">
                  Add local software or web app to your native dock allowlist.
                </p>
              </div>

              {manualSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Application shortcut successfully registered!</span>
                </div>
              )}

              <div>
                <label className="block text-xs text-white/70 mb-1">Application Name *</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Blender 3D, Obsidian, Figma"
                  required
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="Web Browsers">Web Browsers</option>
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="Media & Entertainment">Media & Entertainment</option>
                  <option value="Communication & Social">Communication & Social</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Productivity & Office">Productivity & Office</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Utilities & System">Utilities & System</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Launch Identifier / Target</label>
                <input
                  type="text"
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  placeholder="e.g. /Applications/Blender.app or blender.exe"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Custom Icon Image URL (Optional)</label>
                <input
                  type="url"
                  value={manualIcon}
                  onChange={(e) => setManualIcon(e.target.value)}
                  placeholder="https://... (or leave blank for automatic colorful avatar)"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition cursor-pointer shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Application to Environment</span>
              </button>
            </form>
          )}

          {/* TAB: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Dock & Glassmorphism Preferences</h4>
                
                {/* Dock Size Slider */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs text-white/80">
                    <span>Dock Icon Size</span>
                    <span className="font-mono">{preferences.dockSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="68"
                    value={preferences.dockSize}
                    onChange={(e) => onUpdatePreferences({ dockSize: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Dock Blur Slider */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs text-white/80">
                    <span>Backdrop Blur Intensity</span>
                    <span className="font-mono">{preferences.dockBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="48"
                    value={preferences.dockBlur}
                    onChange={(e) => onUpdatePreferences({ dockBlur: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Dock Opacity Slider */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs text-white/80">
                    <span>Glass Opacity</span>
                    <span className="font-mono">{preferences.dockOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={preferences.dockOpacity}
                    onChange={(e) => onUpdatePreferences({ dockOpacity: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white/80">Dock Magnification on Hover</span>
                    <input
                      type="checkbox"
                      checked={preferences.dockMagnification}
                      onChange={(e) => onUpdatePreferences({ dockMagnification: e.target.checked })}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white/80">Show Tooltip Labels on Hover</span>
                    <input
                      type="checkbox"
                      checked={preferences.showTooltips}
                      onChange={(e) => onUpdatePreferences({ showTooltips: e.target.checked })}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Security & Verification Tests */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Security & Allowlist Integrity</h4>
                  <p className="text-xs text-white/60">Strict execution boundary verification</p>
                </div>
                <button
                  onClick={runSecurityTests}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>Run Verification Suite</span>
                </button>
              </div>

              <div className="space-y-2">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {t.passed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{t.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 uppercase font-mono">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 mt-0.5">{t.message}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
