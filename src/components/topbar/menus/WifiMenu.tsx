import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Check, 
  Lock, 
  Sliders, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useNetworkStatus, NearbyNetworkItem, SignalLevel } from '../../../services/systemBridge';

interface WifiMenuProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  wifiState?: any;
  setWifiState?: any;
}

export const WifiMenu: React.FC<WifiMenuProps> = ({ 
  onClose, 
  onOpenSettings 
}) => {
  const {
    network,
    enabled: wifiEnabled,
    status: networkStatus,
    currentSsid,
    signalStrength,
    ipAddress,
    gateway,
    dns,
    adapterName,
    macAddress,
    networks,
    isScanning,
    setWifiEnabled,
    connectToNetwork,
    scanNetworks,
  } = useNetworkStatus();

  const [showAdapterDetails, setShowAdapterDetails] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleScan = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await scanNetworks();
  };

  const toggleWifi = () => {
    setWifiEnabled(!wifiEnabled);
  };

  const handleConnect = async (net: NearbyNetworkItem) => {
    if (!wifiEnabled) {
      setWifiEnabled(true);
    }
    setConnectingId(net.id);
    await connectToNetwork(net.ssid);
    setConnectingId(null);
  };

  const handleOpenSettings = () => {
    onOpenSettings?.();
    onClose?.();
  };

  const getSignalIcon = (signal: SignalLevel) => {
    switch (signal) {
      case 'high':
        return <SignalHigh className="w-3.5 h-3.5 text-white/90" />;
      case 'medium':
        return <SignalMedium className="w-3.5 h-3.5 text-white/70" />;
      case 'low':
        return <SignalLow className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="w-[320px] bg-slate-900/85 dark:bg-black/80 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-3.5 text-white select-none z-50 pointer-events-auto space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Active Connected Network Card */}
      {wifiEnabled && networkStatus === 'connected' && currentSsid ? (
        <div className="bg-gradient-to-br from-blue-600/25 via-blue-500/15 to-transparent border border-blue-400/30 rounded-xl p-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/40 shrink-0">
                <Wifi className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate tracking-tight">
                  {currentSsid}
                </div>
                <div className="text-[10.5px] text-emerald-400 font-medium flex items-center gap-1">
                  <span>Connected, secured</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {getSignalIcon(signalStrength)}
              <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Collapsible Windows Adapter Technical Specs */}
          <div className="mt-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAdapterDetails(!showAdapterDetails)}
              className="w-full flex items-center justify-between text-[10.5px] text-white/70 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-cyan-400" />
                <span>Adapter & IP Properties</span>
              </span>
              {showAdapterDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {showAdapterDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-[10px] space-y-1 text-white/60 font-mono bg-black/30 p-2 rounded-lg border border-white/5"
                >
                  <div className="flex justify-between">
                    <span className="text-white/40">Adapter:</span>
                    <span className="text-white/80 truncate max-w-[170px]">{adapterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">IPv4 Address:</span>
                    <span className="text-emerald-400">{ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Gateway / DNS:</span>
                    <span className="text-white/70">{gateway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">MAC Address:</span>
                    <span className="text-white/70">{macAddress}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center text-xs text-white/60">
          {!wifiEnabled ? 'Wi-Fi hardware is turned off' : 'Searching for networks...'}
        </div>
      )}

      {/* 2. Nearby Available Networks List */}
      {wifiEnabled && (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold text-white/50 tracking-wider uppercase">
            <span>Available Networks</span>
            <button 
              onClick={handleScan}
              className="text-white/60 hover:text-white transition p-0.5 rounded hover:bg-white/10 flex items-center gap-1 cursor-pointer"
              title="Refresh Networks"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
              <span className="text-[9px] lowercase font-normal">scan</span>
            </button>
          </div>

          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
            {networks.map((net) => {
              const isCurrent = currentSsid === net.ssid;
              const isConnecting = connectingId === net.id;

              return (
                <button
                  key={net.id}
                  disabled={isConnecting}
                  onClick={() => handleConnect(net)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition text-left cursor-pointer group ${
                    isCurrent
                      ? 'bg-blue-500/20 border border-blue-400/40 text-white'
                      : 'hover:bg-white/10 text-white/85 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Wifi className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-blue-400' : 'text-white/70 group-hover:text-white'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate flex items-center gap-1.5">
                        <span>{net.ssid}</span>
                        {net.is5G && (
                          <span className="text-[9px] px-1 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                            5G
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-white/40">{net.security}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {net.isLocked && <Lock className="w-3 h-3 text-white/40 group-hover:text-white/60" />}
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      getSignalIcon(net.signal)
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-[1px] bg-white/10 my-1" />

      {/* 3. Wi-Fi Adapter Main Toggle */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
            wifiEnabled ? 'bg-blue-500 text-white shadow-md' : 'bg-white/15 text-white/50'
          }`}>
            <Wifi className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Wi-Fi Adapter</div>
            <div className="text-[10px] text-white/50">{wifiEnabled ? 'Enabled & Ready' : 'Disabled'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">{wifiEnabled ? 'On' : 'Off'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={wifiEnabled}
            onClick={toggleWifi}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
              wifiEnabled ? 'bg-blue-500 justify-end' : 'bg-white/20 justify-start'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </div>

      {/* 4. Windows Network Settings Button */}
      <div className="pt-1">
        <button
          onClick={handleOpenSettings}
          className="w-full py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-medium text-white text-center transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-white/70" />
          <span>Network & Internet Settings</span>
        </button>
      </div>
    </motion.div>
  );
};

export default WifiMenu;
