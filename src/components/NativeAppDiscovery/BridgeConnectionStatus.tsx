import React from 'react';
import { DiscoveryStatus, BridgeStatusResponse } from '../../types/nativeApp';
import { RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, WifiOff, Loader2 } from 'lucide-react';

interface BridgeConnectionStatusProps {
  status: DiscoveryStatus;
  appsCount: number;
  platform: 'windows' | 'macos';
  onRefresh: () => void;
  onOpenManager: () => void;
  bridgeInfo?: BridgeStatusResponse | null;
}

export const BridgeConnectionStatus: React.FC<BridgeConnectionStatusProps> = ({
  status,
  appsCount,
  platform,
  onRefresh,
  onOpenManager,
  bridgeInfo
}) => {
  const isRefreshing = status === 'refreshing' || status === 'scanning';

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Status Badge */}
      <div 
        id="wallix-native-bridge-status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all ${
          status === 'detected'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : status === 'scanning' || status === 'connecting' || status === 'refreshing'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : status === 'permission_required'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}
      >
        {status === 'detected' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        {status === 'scanning' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
        {status === 'connecting' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
        {status === 'refreshing' && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
        {status === 'unavailable' && <WifiOff className="w-3 h-3 text-rose-400" />}
        {status === 'permission_required' && <AlertCircle className="w-3 h-3 text-amber-400" />}

        <span className="font-medium">
          {status === 'detected' && `${appsCount} Apps Discovered (${platform === 'macos' ? 'macOS' : 'Windows'})`}
          {status === 'scanning' && `Scanning ${platform === 'macos' ? 'macOS Applications' : 'Windows Start Menu'}...`}
          {status === 'connecting' && 'Connecting Local Bridge...'}
          {status === 'refreshing' && 'Refreshing Registry...'}
          {status === 'empty' && 'No Local Apps Detected'}
          {status === 'unavailable' && 'Bridge Offline'}
          {status === 'permission_required' && 'Permission Required'}
          {status === 'error' && 'Scan Notice'}
        </span>

        {bridgeInfo?.securityMode === 'ALLOWLIST_VALIDATED' && (
          <span 
            className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-white/10 text-[10px] text-white/60"
            title="Strict allowlist validation active. Command injection blocked."
          >
            <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
            <span>Secure</span>
          </span>
        )}
      </div>

      {/* Manual Refresh Action */}
      <button
        id="wallix-bridge-rescan-btn"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition cursor-pointer disabled:opacity-50"
        title="Rescan installed applications"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>Rescan</span>
      </button>

      {/* Manage Apps Action */}
      <button
        id="wallix-bridge-manage-apps-btn"
        onClick={onOpenManager}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 transition cursor-pointer"
      >
        <span>Manage Apps</span>
      </button>
    </div>
  );
};
