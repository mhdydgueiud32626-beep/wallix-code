import React, { useState } from 'react';
import { InstalledApp } from '../../types/nativeApp';
import { AppNormalizer } from '../../services/nativeApp/AppNormalizer';
import { Pin, EyeOff, Check, Play, ExternalLink, ShieldCheck } from 'lucide-react';

interface InstalledAppCardProps {
  app: InstalledApp;
  isPinned: boolean;
  onLaunch: (appId: string) => Promise<void>;
  onTogglePin: (appId: string) => void;
  onHideApp: (appId: string) => void;
}

export const InstalledAppCard: React.FC<InstalledAppCardProps> = ({
  app,
  isPinned,
  onLaunch,
  onTogglePin,
  onHideApp
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    try {
      await onLaunch(app.id);
      setLaunchSuccess(true);
      setTimeout(() => setLaunchSuccess(false), 2400);
    } finally {
      setIsLaunching(false);
    }
  };

  const gradient = AppNormalizer.getAppGradient(app.name);

  return (
    <div
      id={`app-card-${app.id}`}
      className="group relative flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.12] dark:bg-black/20 dark:hover:bg-black/40 border border-white/10 hover:border-white/25 backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-2xl cursor-pointer will-change-transform"
      onClick={handleCardClick}
    >
      {/* Quick Pin / Hide Action Overlay (visible on group hover) */}
      <div 
        className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onTogglePin(app.id)}
          className={`p-1 rounded-lg border backdrop-blur-md transition ${
            isPinned 
              ? 'bg-blue-600/40 border-blue-400 text-blue-300' 
              : 'bg-black/40 border-white/20 text-white/70 hover:text-white hover:bg-black/60'
          }`}
          title={isPinned ? 'Unpin from dock' : 'Pin to dock'}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          onClick={() => onHideApp(app.id)}
          className="p-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white/70 hover:text-white backdrop-blur-md transition"
          title="Hide from grid"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>

      {/* App Icon Container */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2.5 flex items-center justify-center">
        {app.icon && !imageError ? (
          <img
            src={app.icon}
            alt={app.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-2xl shadow-md group-hover:shadow-lg transition-transform duration-200 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg`}>
            {app.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Launching / Success Indicator Overlay */}
        {isLaunching && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {launchSuccess && (
          <div className="absolute inset-0 bg-emerald-500/80 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-in fade-in">
            <Check className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Pinned Pill Indicator */}
        {isPinned && (
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-slate-900 flex items-center justify-center"
            title="Pinned to dock"
          >
            <Pin className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* App Name & Category */}
      <div className="text-center w-full px-1">
        <h4 className="text-xs sm:text-[13px] font-medium text-white/95 truncate tracking-tight group-hover:text-blue-300 transition-colors">
          {app.name}
        </h4>
        <p className="text-[10px] text-white/50 truncate mt-0.5 font-light">
          {app.category || 'Application'}
        </p>
      </div>

      {/* Subtle Launch Cue on Hover */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-300/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-2.5 h-2.5 fill-current" />
        <span>Launch</span>
      </div>
    </div>
  );
};
