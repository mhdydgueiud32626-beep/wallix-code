import React, { useState, useEffect } from 'react';

export type RuntimeSyncStatus = 'live' | 'syncing' | 'error';

interface RuntimeSyncIndicatorProps {
  status?: RuntimeSyncStatus;
  className?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Developer-only subtle runtime status indicator (● LIVE / ● SYNCING / ● ERROR).
 * Only renders in development mode.
 */
export const RuntimeSyncIndicator: React.FC<RuntimeSyncIndicatorProps> = ({
  status: manualStatus,
  className = '',
  errorMessage,
  onRetry
}) => {
  const isDev = Boolean(
    typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
      ? true
      : (import.meta as any).env?.DEV
  );
  
  const [syncStatus, setSyncStatus] = useState<RuntimeSyncStatus>(manualStatus || 'live');

  // Sync with manual override if provided
  useEffect(() => {
    if (manualStatus) {
      setSyncStatus(manualStatus);
    }
  }, [manualStatus]);

  // Hook into Vite HMR lifecycle events when available in development
  useEffect(() => {
    if (!isDev || typeof window === 'undefined') return;

    let resetTimer: NodeJS.Timeout | null = null;

    // Listen to custom or Vite HMR events if available
    const handleBeforeUpdate = () => {
      setSyncStatus('syncing');
    };

    const handleAfterUpdate = () => {
      setSyncStatus('syncing');
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        setSyncStatus('live');
      }, 400);
    };

    const handleError = () => {
      setSyncStatus('error');
    };

    window.addEventListener('vite:beforeUpdate', handleBeforeUpdate);
    window.addEventListener('vite:afterUpdate', handleAfterUpdate);
    window.addEventListener('vite:error', handleError);

    // Also support custom runtime synchronization events
    const handleRuntimeSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ status: RuntimeSyncStatus }>;
      if (customEvent.detail?.status) {
        setSyncStatus(customEvent.detail.status);
      }
    };
    window.addEventListener('wallix:runtime-sync', handleRuntimeSync);

    // If Vite HMR is active on import.meta.hot
    const metaHot = (import.meta as any).hot;
    if (metaHot) {
      try {
        metaHot.on('vite:beforeUpdate', handleBeforeUpdate);
        metaHot.on('vite:afterUpdate', handleAfterUpdate);
        metaHot.on('vite:error', handleError);
      } catch {
        // Safe fallback
      }
    }

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      window.removeEventListener('vite:beforeUpdate', handleBeforeUpdate);
      window.removeEventListener('vite:afterUpdate', handleAfterUpdate);
      window.removeEventListener('vite:error', handleError);
      window.removeEventListener('wallix:runtime-sync', handleRuntimeSync);
    };
  }, [isDev]);

  if (!isDev) return null;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono select-none backdrop-blur-md transition-all duration-200 border ${
        syncStatus === 'live' 
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
          : syncStatus === 'syncing'
          ? 'bg-amber-950/60 text-amber-300 border-amber-500/30 animate-pulse'
          : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
      } ${className}`}
      title={
        syncStatus === 'live' 
          ? 'Live WYSIWYG runtime synchronized with active source modules' 
          : syncStatus === 'syncing'
          ? 'Reconciling updated module...'
          : errorMessage || 'Runtime error during module execution. Click to retry.'
      }
      onClick={syncStatus === 'error' && onRetry ? onRetry : undefined}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full ${
          syncStatus === 'live'
            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
            : syncStatus === 'syncing'
            ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
            : 'bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
        }`} 
      />
      <span className="font-semibold uppercase tracking-wider text-[9px]">
        {syncStatus === 'live' ? 'LIVE' : syncStatus === 'syncing' ? 'SYNCING' : 'ERROR'}
      </span>
    </div>
  );
};
