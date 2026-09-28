import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InstalledApp, DiscoveryStatus, EnvironmentAppearanceMode, NativeAppPreferences, BridgeStatusResponse } from '../../types/nativeApp';
import { AppDiscoveryService } from '../../services/nativeApp/AppDiscoveryService';
import { NativeAppStorage } from '../../services/nativeApp/storage';
import { BridgeConnectionStatus } from './BridgeConnectionStatus';
import { InstalledAppGrid } from './InstalledAppGrid';
import { AppManager } from './AppManager';
import { ClockWidget } from '../Widgets/ClockWidget';
import { WeatherWidget } from '../Widgets/WeatherWidget';
import { CalendarWidget } from '../Widgets/CalendarWidget';
import { MacAppDock } from '../Widgets/MacAppDock';
import { 
  Battery, Search, SlidersHorizontal, Moon, Clock, Sparkles, 
  Monitor, Laptop, Palette, Layout, ExternalLink, RefreshCw, CheckCircle2, Shield, AlertTriangle
} from 'lucide-react';
import { WALLIX_MOTION_CONFIG } from '../../config/wallixMotionConfig';
import { RuntimeSyncIndicator } from '../common/RuntimeSyncIndicator';
import { TopStatusBar } from '../TopStatusBar/TopStatusBar';

interface EnvironmentAppearanceProps {
  currentWallpaperUrl?: string;
  onSelectWallpaper?: () => void;
}

export const EnvironmentAppearance: React.FC<EnvironmentAppearanceProps> = ({
  currentWallpaperUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=85',
  onSelectWallpaper
}) => {
  const discoveryService = useMemo(() => AppDiscoveryService.getInstance(), []);

  // Discovery state
  const [apps, setApps] = useState<InstalledApp[]>(discoveryService.getApps());
  const [status, setStatus] = useState<DiscoveryStatus>(discoveryService.getStatus());
  const [platform, setPlatform] = useState<'windows' | 'macos'>(discoveryService.getPlatform());
  const [bridgeInfo, setBridgeInfo] = useState<BridgeStatusResponse | null>(null);

  // User UI Preferences
  const [preferences, setPreferences] = useState<NativeAppPreferences>(() => NativeAppStorage.loadPreferences());
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'widgets'>('grid');
  const [launchNotification, setLaunchNotification] = useState<{ name: string; message: string; unavailable?: boolean } | null>(null);

  // Subscribe to discovery updates and initialize startup flow
  useEffect(() => {
    const unsubscribe = discoveryService.subscribe((newStatus, newApps) => {
      setStatus(newStatus);
      setApps(newApps);
      setPlatform(discoveryService.getPlatform());
    });

    const targetPlatform = preferences.appearanceMode === 'windows-inspired' ? 'windows' : (discoveryService.getPlatform() || 'macos');
    discoveryService.initializeStartup(targetPlatform);
    discoveryService.checkBridgeStatus().then(setBridgeInfo);

    return unsubscribe;
  }, [discoveryService]);

  // If no pinned apps yet, auto-pin the first 8 detected apps for dock beauty
  useEffect(() => {
    if (apps.length > 0 && preferences.pinnedAppIds.length === 0) {
      const initialPinned = apps.slice(0, 8).map(a => a.id);
      updatePreferences({ pinnedAppIds: initialPinned, dockOrder: initialPinned });
    }
  }, [apps]);

  const updatePreferences = (updates: Partial<NativeAppPreferences>) => {
    const updated = NativeAppStorage.savePreferences(updates);
    setPreferences(updated);
  };

  const handleLaunch = async (appId: string) => {
    setActiveAppId(appId);
    const targetApp = apps.find(a => a.id === appId);
    NativeAppStorage.addRecent(appId);
    setPreferences(NativeAppStorage.loadPreferences());

    const result = await discoveryService.launchApp(appId);
    if (targetApp) {
      setLaunchNotification({
        name: targetApp.name,
        message: result.message,
        unavailable: result.unavailable
      });
      setTimeout(() => setLaunchNotification(null), 3500);
    }
    setTimeout(() => setActiveAppId(null), 1200);
  };

  const handleTogglePin = (appId: string) => {
    const updated = NativeAppStorage.togglePinned(appId);
    setPreferences(prev => ({ ...prev, pinnedAppIds: updated }));
  };

  const handleToggleHide = (appId: string) => {
    const updated = NativeAppStorage.toggleHidden(appId);
    setPreferences(prev => ({ ...prev, hiddenAppIds: updated }));
  };

  const handleRefreshScan = () => {
    discoveryService.refresh(preferences.appearanceMode === 'windows-inspired' ? 'windows' : 'macos');
    discoveryService.checkBridgeStatus().then(setBridgeInfo);
  };

  const handleAddManualApp = async (data: { name: string; category?: string; icon?: string; launchTarget?: string }) => {
    await discoveryService.addManualApp(data);
  };

  // Apps displayed on dock (strictly respecting dock order if present, or pinned apps)
  const dockApps = useMemo(() => {
    const order = (preferences.dockOrder && preferences.dockOrder.length > 0) ? preferences.dockOrder : preferences.pinnedAppIds;
    const pinned = order
      .map(id => apps.find(a => a.id === id))
      .filter((a): a is InstalledApp => Boolean(a));
    if (pinned.length > 0) return pinned;
    return apps.slice(0, 8);
  }, [apps, preferences.dockOrder, preferences.pinnedAppIds]);

  // Mode-based styling variables
  const isMac = preferences.appearanceMode === 'mac-inspired';
  const isWindows = preferences.appearanceMode === 'windows-inspired';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Controls: Mode Switcher, Status Pill & Layout Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Appearance Mode Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => updatePreferences({ appearanceMode: 'mac-inspired' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isMac 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Mac-inspired</span>
          </button>
          <button
            onClick={() => updatePreferences({ appearanceMode: 'windows-inspired' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isWindows 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows-inspired</span>
          </button>
          <button
            onClick={() => updatePreferences({ appearanceMode: 'custom' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              preferences.appearanceMode === 'custom' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>

        {/* View Layout Toggle & Wallpaper Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setLayoutStyle('grid')}
              className={`px-2.5 py-1 rounded-lg transition ${layoutStyle === 'grid' ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white'}`}
            >
              App Grid
            </button>
            <button
              onClick={() => setLayoutStyle('widgets')}
              className={`px-2.5 py-1 rounded-lg transition ${layoutStyle === 'widgets' ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white'}`}
            >
              Widgets & Apps
            </button>
          </div>

          <BridgeConnectionStatus
            status={status}
            appsCount={apps.length}
            platform={platform}
            onRefresh={handleRefreshScan}
            onOpenManager={() => setIsManagerOpen(true)}
            bridgeInfo={bridgeInfo}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN SOFTWARE ENVIRONMENT VIEWPORT                                        */}
      {/* ========================================================================= */}
      <div 
        id="wallix-native-environment-viewport"
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-[16/10] max-h-[780px] flex flex-col justify-between select-none"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Cinematic Wallpaper Layer (Extends seamlessly to the absolute top edge) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
          style={{ backgroundImage: `url(${currentWallpaperUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* TOP STATUS BAR (Unified Liquid Glass Interaction System) */}
        <TopStatusBar 
          platformTitle={isWindows ? "WALLIX Windows Environment" : "WALLIX Native Discovery"} 
        />

        {/* ========================================================================= */}
        {/* CENTER CONTENT AREA (Grid Mode vs. Aesthetic Widgets Mode from Reference 2) */}
        {/* ========================================================================= */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {layoutStyle === 'grid' ? (
            /* Layout 1: Comprehensive App Grid */
            <div className="max-w-6xl mx-auto">
              <InstalledAppGrid
                apps={apps}
                status={status}
                pinnedIds={preferences.pinnedAppIds}
                hiddenIds={preferences.hiddenAppIds}
                onLaunchApp={handleLaunch}
                onTogglePin={handleTogglePin}
                onHideApp={handleToggleHide}
                onRefresh={handleRefreshScan}
                onOpenManualModal={() => setIsManagerOpen(true)}
              />
            </div>
          ) : (
            /* Layout 2: Actual Production Clock (Upper-Left), Calendar (Upper-Right), Weather (Lower-Left) & Detected Apps */
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-between p-3 sm:p-5 pointer-events-none">
              {/* Top Row: Clock (Upper-Left) & Calendar (Upper-Right) */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 w-full pointer-events-auto">
                <div className="w-full md:w-[380px] h-[190px]">
                  <ClockWidget />
                </div>
                <div className="w-full md:w-[340px] h-[320px]">
                  <CalendarWidget />
                </div>
              </div>

              {/* Bottom Row: Weather (Lower-Left) */}
              <div className="flex flex-col md:flex-row items-end justify-between gap-6 w-full pointer-events-auto">
                <div className="w-full md:w-[380px] h-[195px]">
                  <WeatherWidget />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManagerOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-black/50 backdrop-blur-xl border border-white/15 text-xs text-white/90 hover:text-white hover:border-cyan-400 transition cursor-pointer shadow-lg"
                  >
                    View All Apps ({apps.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM MACOS SONOMA DOCK WITH MAGNIFICATION WAVE                          */}
        {/* ========================================================================= */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center">
          {/* Launch Toast Indicator */}
          <AnimatePresence>
            {launchNotification && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: WALLIX_MOTION_CONFIG.toast.stiffness, damping: WALLIX_MOTION_CONFIG.toast.damping }}
                className={`mb-2 px-4 py-1.5 rounded-full border text-xs font-medium backdrop-blur-xl shadow-xl flex items-center gap-2 ${
                  launchNotification.unavailable
                    ? 'bg-rose-600/90 border-rose-400/40 text-white'
                    : 'bg-blue-600/90 border-blue-400/40 text-white'
                }`}
              >
                {launchNotification.unavailable ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                )}
                <span>{launchNotification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <MacAppDock />
        </div>
      </div>

      {/* Application Manager Modal */}
      <AppManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        apps={apps}
        status={status}
        preferences={preferences}
        onTogglePin={handleTogglePin}
        onToggleHide={handleToggleHide}
        onUpdatePreferences={updatePreferences}
        onRefreshScan={handleRefreshScan}
        onAddManualApp={handleAddManualApp}
        platform={platform}
      />
    </div>
  );
};
