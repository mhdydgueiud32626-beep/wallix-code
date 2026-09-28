import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Wallpaper, PlatformOS } from '../types';
import { EnvironmentAppearance } from './NativeAppDiscovery/EnvironmentAppearance';
import { WindowsDesktopCanvas } from './TargetWorkspaces/windows/WindowsDesktopCanvas';
import { DEFAULT_WINDOWS_CONFIG, WindowsEnvironmentConfig } from './TargetWorkspaces/windows/types';
import { LivePreviewErrorBoundary } from './common/LivePreviewErrorBoundary';
import { ColorGradePreset } from '../data/colorPresets';
import { AdaptiveMaterialProvider } from '../modules/desktop/adaptive';

interface DesktopSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: Wallpaper | null;
  platformOS: PlatformOS;
  onTogglePlatformOS: () => void;
  onOpenSettings?: () => void;
  onOpenPublishModal?: (colorTheme: ColorGradePreset, intensity: number) => void;
  initialPresetId?: string;
}

const STORAGE_KEY_WIN = 'wallix_windows_environment_config';

/**
 * WALLIX Fullscreen Live WYSIWYG Preview & Desktop Studio.
 * Renders the production EnvironmentAppearance and WindowsDesktopCanvas components
 * as the single source of truth runtime with live HMR module reconciliation.
 */
export const DesktopSimulatorModal: React.FC<DesktopSimulatorModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  platformOS,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPlatform, setCurrentPlatform] = useState<PlatformOS>(platformOS);

  // Sync platform changes from props
  useEffect(() => {
    setCurrentPlatform(platformOS);
  }, [platformOS]);

  // Load windows configuration if needed
  const [windowsConfig, setWindowsConfig] = useState<WindowsEnvironmentConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIN);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WINDOWS_CONFIG;
  });

  // Handle ESC key to exit fullscreen simulator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !wallpaper) return null;

  const activeWallpaperUrl = wallpaper.imageUrl || wallpaper.thumbnail || wallpaper.thumbnailUrl || '';

  return (
    <div 
      ref={containerRef}
      id="desktop-simulator-modal"
      className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden"
    >
      {/* Floating Discreet Exit Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/70 hover:bg-rose-500/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-xl transition cursor-pointer shadow-2xl"
        title="Close Preview (Esc)"
        aria-label="Close Preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Main Production Component Tree as Single Source of Truth */}
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        <LivePreviewErrorBoundary fallbackTitle="Fullscreen Live WYSIWYG Render Error">
          <AdaptiveMaterialProvider 
            wallpaper={wallpaper} 
            activeWallpaperUrl={activeWallpaperUrl} 
            activeWallpaperId={wallpaper?.id}
          >
            {currentPlatform === 'macos' ? (
              <div className="w-full max-w-7xl h-full flex flex-col justify-center">
                <EnvironmentAppearance 
                  currentWallpaperUrl={activeWallpaperUrl}
                />
              </div>
            ) : (
              <div className="w-full h-full relative overflow-hidden rounded-2xl border border-white/10">
                <WindowsDesktopCanvas
                  activeWallpaper={wallpaper}
                  wallpapers={[wallpaper]}
                  config={windowsConfig}
                  onChangeConfig={setWindowsConfig}
                  onSelectWallpaper={() => {}}
                  selectedIconId={null}
                  onSelectIcon={() => {}}
                  onOpenSettingsTab={() => {}}
                />
              </div>
            )}
          </AdaptiveMaterialProvider>
        </LivePreviewErrorBoundary>
      </div>
    </div>
  );
};
