import React, { useState } from 'react';
import { Wifi, RefreshCw, Check } from 'lucide-react';
import { STATUS_GLASS_TOKENS } from './statusTokens';
import { WifiNetwork } from './statusTypes';

interface WifiPanelProps {
  onClose?: () => void;
}

const INITIAL_NETWORKS: WifiNetwork[] = [
  { id: '1', ssid: 'WALLIX_HOME', signalStrength: 'strong', isSecured: true, isConnected: true, type: 'wifi' },
];

export const WifiPanel: React.FC<WifiPanelProps> = () => {
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [networks] = useState<WifiNetwork[]>(INITIAL_NETWORKS);

  const connectedNetwork = networks.find(n => n.isConnected);

  const handleRefresh = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="w-full min-w-0 space-y-3.5 select-none box-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Wi-Fi</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isWifiOn ? (connectedNetwork ? 'Connected' : 'Searching...') : 'Off'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          title="Scan for networks"
          aria-label="Scan for networks"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>

      {/* Toggle Row */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
          Wi-Fi {isWifiOn ? 'ON' : 'OFF'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isWifiOn}
          onClick={() => setIsWifiOn(!isWifiOn)}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
            isWifiOn ? STATUS_GLASS_TOKENS.switchActive : STATUS_GLASS_TOKENS.switchInactive
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
              isWifiOn ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Connected Network Card */}
      {isWifiOn && connectedNetwork && (
        <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                  {connectedNetwork.ssid}
                </span>
                <Check className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Connected • Strong Signal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
