import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Wifi, 
  Lock, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  Plane, 
  Smartphone,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { useNetworkStatus, useQuickSettings, NearbyNetworkItem, SignalLevel } from '../../../services/systemBridge';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from '../../../modules/desktop/shell/LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';

export interface WindowsNetworkFlyoutProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export const WindowsNetworkFlyout: React.FC<WindowsNetworkFlyoutProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const {
    network,
    enabled: wifiEnabled,
    status: networkStatus,
    currentSsid,
    signalStrength,
    networks,
    isScanning,
    setWifiEnabled,
    connectToNetwork,
    disconnectNetwork,
    scanNetworks,
  } = useNetworkStatus();

  const {
    quickSettings,
    toggleQuickSetting,
  } = useQuickSettings();

  const { tokens } = useAdaptiveMaterial();

  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [connectAutomatically, setConnectAutomatically] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const getSignalIcon = (signal: SignalLevel) => {
    switch (signal) {
      case 'high':
        return <SignalHigh className="w-4 h-4 text-white/90" />;
      case 'medium':
        return <SignalMedium className="w-4 h-4 text-white/70" />;
      case 'low':
        return <SignalLow className="w-4 h-4 text-white/50" />;
    }
  };

  const handleConnect = async (net: NearbyNetworkItem) => {
    setIsConnecting(true);
    await connectToNetwork(net.ssid);
    setIsConnecting(false);
    setSelectedNetworkId(null);
  };

  const handleDisconnect = async () => {
    await disconnectNetwork();
  };

  const handleOpenNetworkSettings = () => {
    onOpenSettings?.();
    onClose?.();
  };

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 z-[99990] bg-black/30 pointer-events-auto"
        onClick={onClose}
      />

      {/* Windows 10 Network Flyout Liquid Glass Window */}
      <LiquidGlassSurface
        variant="flyout"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.1, 0.9, 0.2, 1] }}
        className="fixed bottom-3 right-3 sm:right-5 w-[360px] max-w-[95vw] rounded-xl flex flex-col z-[99999]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
      >
        {/* ======================================================================= */}
        {/* 1. NETWORKS LIST REGION                                                 */}
        {/* ======================================================================= */}
        <div className="p-3.5 max-h-[380px] overflow-y-auto space-y-2 custom-scrollbar">
          {wifiEnabled ? (
            <>
              {/* Active Connected Network Card */}
              {networkStatus === 'connected' && currentSsid ? (
                <div className="bg-white/[0.07] border border-white/[0.12] p-3 text-white rounded-lg shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wifi className="w-4 h-4 shrink-0" style={{ color: tokens.accent.activeAccent }} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate text-white leading-tight">
                          {currentSsid}
                        </div>
                        <div className="text-[11px] text-white/60">Connected, secured</div>
                      </div>
                    </div>
                    {getSignalIcon(signalStrength)}
                  </div>

                  {/* Connect automatically checkbox & Disconnect button */}
                  <div className="mt-3 pt-2 border-t border-white/[0.08] space-y-2">
                    <label className="flex items-center gap-2 text-[11.5px] text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={connectAutomatically}
                        onChange={(e) => setConnectAutomatically(e.target.checked)}
                        style={{ accentColor: tokens.accent.activeAccent }}
                        className="rounded-none cursor-pointer"
                      />
                      <span>Connect automatically</span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenNetworkSettings}
                        className="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-normal transition-colors cursor-pointer border border-white/[0.1] rounded"
                      >
                        Properties
                      </button>

                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-4 py-1 bg-white/[0.1] hover:bg-white/[0.18] text-white text-[11px] font-normal transition-colors cursor-pointer border border-white/[0.15] rounded"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Available Nearby Networks List */}
              <div className="space-y-1.5 pt-1">
                {networks
                  .filter((net) => net.ssid !== currentSsid || networkStatus !== 'connected')
                  .map((net) => {
                    const isSelected = selectedNetworkId === net.id;

                    return (
                      <div
                        key={net.id}
                        style={isSelected ? {
                          backgroundColor: tokens.internalSurface.selectedBackground,
                          borderColor: tokens.internalSurface.selectedBorder,
                          boxShadow: `0 2px 8px ${tokens.accent.activeAccentSoft}`,
                        } : {}}
                        className={`rounded-lg border transition-all overflow-hidden ${
                          isSelected 
                            ? '' 
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06]'
                        }`}
                      >
                        {/* Network Row Summary */}
                        <button
                          type="button"
                          onClick={() => setSelectedNetworkId(isSelected ? null : net.id)}
                          className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Wifi className="w-4 h-4 text-white/70 shrink-0" />
                            <span className="text-[12px] font-normal text-white truncate">
                              {net.ssid}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {net.isLocked && <Lock className="w-3.5 h-3.5 text-white/40" />}
                            {getSignalIcon(net.signal)}
                          </div>
                        </button>

                        {/* Expanded Connect Affordance */}
                        {isSelected && (
                          <div className="p-3 pt-0 border-t border-white/[0.08] space-y-2 mt-1">
                            <label className="flex items-center gap-2 text-[11.5px] text-white/80 cursor-pointer pt-2">
                              <input
                                type="checkbox"
                                defaultChecked
                                style={{ accentColor: tokens.accent.activeAccent }}
                                className="rounded-none cursor-pointer"
                              />
                              <span>Connect automatically</span>
                            </label>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                disabled={isConnecting}
                                onClick={() => handleConnect(net)}
                                style={{
                                  background: tokens.quickAction.tileActiveGradient,
                                  borderColor: tokens.quickAction.tileActiveBorder,
                                  boxShadow: tokens.quickAction.tileActiveShadow,
                                }}
                                className="px-5 py-1 hover:brightness-110 active:brightness-95 text-white text-[11.5px] font-normal transition-all cursor-pointer border rounded shadow-xs"
                              >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-white/50">
              Wi-Fi is turned off
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* 2. BOTTOM CONTROLS & TILES                                             */}
        {/* ======================================================================= */}
        <div 
          className="p-3.5 border-t border-white/[0.08] space-y-2.5 rounded-b-xl backdrop-blur-md"
          style={{ backgroundColor: tokens.bottomSurface.background }}
        >
          {/* Network & Internet settings link */}
          <button
            type="button"
            onClick={handleOpenNetworkSettings}
            className="text-[11.5px] hover:underline cursor-pointer block transition-colors"
            style={{ color: tokens.typography.textAccent }}
          >
            Network & Internet settings
          </button>

          {/* Wi-Fi / Airplane Mode / Hotspot Quick Tiles */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {/* Wi-Fi Tile */}
            <button
              type="button"
              onClick={() => setWifiEnabled(!wifiEnabled)}
              style={
                wifiEnabled
                  ? {
                      background: tokens.quickAction.tileActiveGradient,
                      borderColor: tokens.quickAction.tileActiveBorder,
                      boxShadow: tokens.quickAction.tileActiveShadow,
                      color: tokens.quickAction.tileActiveText,
                    }
                  : undefined
              }
              className={`h-14 p-2 flex flex-col items-start justify-between rounded-lg border transition-all cursor-pointer text-left ${
                wifiEnabled
                  ? 'hover:brightness-110 active:brightness-95'
                  : LIQUID_GLASS_TOKENS.tileInactive
              }`}
            >
              <Wifi className="w-4 h-4" />
              <div className="text-[11px] font-normal leading-tight">Wi-Fi</div>
            </button>

            {/* Airplane Mode Tile */}
            <button
              type="button"
              onClick={() => toggleQuickSetting('airplaneMode')}
              style={
                quickSettings.airplaneMode
                  ? {
                      background: tokens.quickAction.tileActiveGradient,
                      borderColor: tokens.quickAction.tileActiveBorder,
                      boxShadow: tokens.quickAction.tileActiveShadow,
                      color: tokens.quickAction.tileActiveText,
                    }
                  : undefined
              }
              className={`h-14 p-2 flex flex-col items-start justify-between rounded-lg border transition-all cursor-pointer text-left ${
                quickSettings.airplaneMode
                  ? 'hover:brightness-110 active:brightness-95'
                  : LIQUID_GLASS_TOKENS.tileInactive
              }`}
            >
              <Plane className="w-4 h-4" />
              <div className="text-[11px] font-normal leading-tight">Airplane mode</div>
            </button>

            {/* Mobile Hotspot Tile */}
            <button
              type="button"
              onClick={() => toggleQuickSetting('mobileHotspot')}
              style={
                quickSettings.mobileHotspot
                  ? {
                      background: tokens.quickAction.tileActiveGradient,
                      borderColor: tokens.quickAction.tileActiveBorder,
                      boxShadow: tokens.quickAction.tileActiveShadow,
                      color: tokens.quickAction.tileActiveText,
                    }
                  : undefined
              }
              className={`h-14 p-2 flex flex-col items-start justify-between rounded-lg border transition-all cursor-pointer text-left ${
                quickSettings.mobileHotspot
                  ? 'hover:brightness-110 active:brightness-95'
                  : LIQUID_GLASS_TOKENS.tileInactive
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <div className="text-[11px] font-normal leading-tight">Mobile hotspot</div>
            </button>
          </div>
        </div>
      </LiquidGlassSurface>
    </>
  );
};

export default WindowsNetworkFlyout;

