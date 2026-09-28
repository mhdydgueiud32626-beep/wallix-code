import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Search, 
  Mic, 
  Camera, 
  Plus, 
  Check, 
  X, 
  ExternalLink, 
  Download, 
  Trash2, 
  Pencil, 
  Layers, 
  Info, 
  FolderArchive, 
  ChevronRight, 
  Palette, 
  ArrowLeft,
  Volume2,
  Sliders,
  Eye,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Monitor,
  FileVideo,
  ImageIcon,
  Code,
  Chrome
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Wallpaper } from '../types';
import { ChromeSubTab, ChromeShortcutItem } from '../types/chrome';
import { ThemeConfig, WALLIX_THEME_PRESETS } from '../types/theme';
import { UploadZone } from './Upload/UploadZone';
import { sanitizeWallpaperTitle } from '../utils/sanitizeTitle';
import { ChromeNewTabPreview } from '../modules/chrome/ChromeNewTabPreview';
import { ChromeNewTabSettings, ChromeShortcut } from '../modules/chrome/types';
import { saveChromeSettings, generateManifestV3Package, resolveSafeWallpaperUrl } from '../modules/chrome/extensionBridge';

export interface StudioShortcut extends ChromeShortcutItem {}

const INITIAL_SHORTCUTS: StudioShortcut[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com', initials: 'G', gradient: 'from-blue-500 to-indigo-600', glowColor: 'rgba(59,130,246,0.6)', isDefault: true },
  { id: '2', title: 'YouTube', url: 'https://www.youtube.com', initials: 'YT', gradient: 'from-red-600 to-rose-700', glowColor: 'rgba(239,68,68,0.6)', isDefault: true },
  { id: '3', title: 'GitHub', url: 'https://www.github.com', initials: 'GH', gradient: 'from-slate-800 to-zinc-950', glowColor: 'rgba(148,163,184,0.3)', isDefault: true },
  { id: '4', title: 'AI Studio', url: 'https://aistudio.google.com', initials: 'AI', gradient: 'from-cyan-400 to-blue-600', glowColor: 'rgba(6,182,212,0.6)', isDefault: true },
  { id: '5', title: 'Reddit', url: 'https://www.reddit.com', initials: 'R', gradient: 'from-orange-500 to-red-600', glowColor: 'rgba(249,115,22,0.6)', isDefault: true }
];

const SHORTCUT_COLOR_OPTIONS = [
  { label: 'Cyber Cyan', gradient: 'from-cyan-400 to-blue-600', glow: 'rgba(6,182,212,0.6)' },
  { label: 'Neon Rose', gradient: 'from-pink-500 to-rose-600', glow: 'rgba(244,114,182,0.6)' },
  { label: 'Sunset Gold', gradient: 'from-amber-400 to-orange-600', glow: 'rgba(245,158,11,0.6)' },
  { label: 'Emerald Glow', gradient: 'from-emerald-400 to-teal-600', glow: 'rgba(16,185,129,0.6)' },
  { label: 'Ultraviolet', gradient: 'from-purple-500 to-indigo-700', glow: 'rgba(168,85,247,0.6)' },
  { label: 'Crimson Flame', gradient: 'from-red-600 to-rose-800', glow: 'rgba(239,68,68,0.6)' },
  { label: 'Electric Blue', gradient: 'from-sky-400 to-indigo-600', glow: 'rgba(56,189,248,0.6)' },
  { label: 'Obsidian Noir', gradient: 'from-zinc-800 to-black', glow: 'rgba(255,255,255,0.2)' }
];

interface ChromeExtensionStudioViewProps {
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  activeSubTab?: ChromeSubTab;
  onSubTabChange?: (tab: ChromeSubTab) => void;
  onSelectWallpaper?: (wp: Wallpaper) => void;
  onNavigateHome?: () => void;
  onShowToast?: (msg: { title: string; subtitle: string; icon?: React.ReactNode }) => void;
}

export const ChromeExtensionStudioView: React.FC<ChromeExtensionStudioViewProps> = ({
  wallpapers,
  activeWallpaper,
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onSelectWallpaper,
  onNavigateHome,
  onShowToast
}) => {
  // Current active subtab state
  const [internalSubTab, setInternalSubTab] = useState<ChromeSubTab>('new-tab');
  const activeTab = controlledSubTab || internalSubTab;

  const setSubTab = (tab: ChromeSubTab) => {
    setInternalSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Active Preset State
  const [selectedPreset, setSelectedPreset] = useState<ThemeConfig>(WALLIX_THEME_PRESETS[0]);
  
  // Custom Live Background State
  const [currentMedia, setCurrentMedia] = useState({
    title: WALLIX_THEME_PRESETS[0].name,
    imageUrl: WALLIX_THEME_PRESETS[0].background,
    videoUrl: WALLIX_THEME_PRESETS[0].videoBackground,
    isVideo: !!WALLIX_THEME_PRESETS[0].videoBackground
  });

  // Simulator Search Bar Settings
  const [searchShape, setSearchShape] = useState<'pill' | 'rounded' | 'sharp'>('pill');
  const [searchGlow, setSearchGlow] = useState<'cyan' | 'rose' | 'amber' | 'violet' | 'emerald'>('cyan');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Ask Google, search the web, or ask Gemini AI...');
  const [isAiMode, setIsAiMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);

  // Shortcuts & Customizer States
  const [shortcuts, setShortcuts] = useState<StudioShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('wallix_extension_shortcuts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SHORTCUTS;
  });

  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [newColorIndex, setNewColorIndex] = useState(0);

  // Exporter & Installation Modals
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalledConfirmed, setIsInstalledConfirmed] = useState(false);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryFilterType, setGalleryFilterType] = useState<'image' | 'video'>('image');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState<'none' | 'subtle' | 'medium'>('subtle');

  // Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save shortcuts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wallix_extension_shortcuts', JSON.stringify(shortcuts));
    } catch {}
  }, [shortcuts]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ThemeConfig) => {
    setSelectedPreset(preset);
    setCurrentMedia({
      title: preset.name,
      imageUrl: preset.background,
      videoUrl: preset.videoBackground,
      isVideo: !!preset.videoBackground
    });

    if (preset.id === 'sakura-spirit') setSearchGlow('rose');
    else if (preset.id === 'neon-abyss') setSearchGlow('cyan');
    else if (preset.id === 'deep-nebula') setSearchGlow('violet');
    else setSearchGlow('cyan');

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.85 },
      colors: [preset.accent, '#38BDF8', '#FFFFFF']
    });

    if (onShowToast) {
      onShowToast({
        title: `Applied Preset: ${preset.name}`,
        subtitle: 'Chrome simulator updated with 4K background & accent styling',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />
      });
    }
  };

  // Add Shortcut
  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const initials = newInitials.trim().toUpperCase() || newTitle.trim().slice(0, 2).toUpperCase();
    const colorOpt = SHORTCUT_COLOR_OPTIONS[newColorIndex];

    const newItem: StudioShortcut = {
      id: `sc-${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl,
      initials,
      gradient: colorOpt.gradient,
      glowColor: colorOpt.glow
    };

    setShortcuts(prev => [...prev, newItem]);
    setNewTitle('');
    setNewUrl('');
    setNewInitials('');
    setIsAddingShortcut(false);

    if (onShowToast) {
      onShowToast({
        title: 'Shortcut Added!',
        subtitle: `Added ${newItem.title} to floating dock`,
        icon: <Check className="w-4 h-4 text-emerald-400" />
      });
    }
  };

  const handleDeleteShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  };

  // Chrome New Tab Settings Object (Unified Source of Truth)
  const extensionSettings: ChromeNewTabSettings = useMemo(() => {
    const accentKey = searchGlow === 'violet' ? 'purple' : searchGlow === 'rose' ? 'rose' : searchGlow === 'amber' ? 'amber' : searchGlow === 'emerald' ? 'emerald' : 'cyan';
    const bgUrl = resolveSafeWallpaperUrl(currentMedia.imageUrl || selectedPreset.background);

    return {
      version: 1,
      wallpaper: {
        type: currentMedia.isVideo ? 'video' : 'image',
        url: bgUrl,
        videoUrl: currentMedia.videoUrl,
        title: currentMedia.title || selectedPreset.name || 'WALLIX Ambient',
        fit: 'cover'
      },
      search: {
        style: searchShape === 'sharp' ? 'minimal' : searchShape === 'rounded' ? 'rounded' : 'pill',
        size: 'standard',
        position: 'center',
        blur: blurIntensity === 'none' ? 0 : blurIntensity === 'medium' ? 28 : 20,
        opacity: 35,
        borderOpacity: 25,
        glow: true,
        engine: 'google',
        showAiMode: true,
        isAiMode: isAiMode,
        showLogo: true
      },
      shortcuts: {
        style: 'glass-card',
        spacing: 'normal',
        opacity: 45,
        blur: 20,
        showLabels: true,
        scaleOnHover: true
      },
      effects: {
        vignette: 40,
        backdropDim: 22,
        themeAccent: accentKey
      },
      theme: selectedPreset.id || 'cyber-cyan'
    };
  }, [currentMedia, searchShape, searchGlow, blurIntensity, isAiMode, selectedPreset]);

  // Unified Chrome Shortcuts mapping
  const chromeShortcuts: ChromeShortcut[] = useMemo(() => {
    return shortcuts.map((s, idx) => ({
      id: s.id || `sc-${idx}`,
      title: s.title,
      url: s.url,
      initials: s.initials || s.title?.slice(0, 2).toUpperCase() || 'L',
      gradient: s.gradient || 'from-cyan-400 to-blue-600',
      glowColor: s.glowColor || 'rgba(6,182,212,0.6)',
      isDefault: s.isDefault
    }));
  }, [shortcuts]);

  // Beginner 1-Click Install Simulation
  const handleBeginnerInstall = () => {
    saveChromeSettings(extensionSettings, chromeShortcuts);
    setIsInstallModalOpen(true);
  };

  const handleConfirmInstall = async () => {
    saveChromeSettings(extensionSettings, chromeShortcuts);
    setIsInstalledConfirmed(true);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 }
    });
    if (onShowToast) {
      onShowToast({
        title: '🎉 Added to Chrome Successfully!',
        subtitle: 'Your new tabs will now load this customized WALLIX dashboard',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      });
    }
    setTimeout(() => {
      setIsInstallModalOpen(false);
      setIsInstalledConfirmed(false);
    }, 2500);
  };

  // Developer Mode ZIP Exporter
  const handleDownloadExtensionZip = async () => {
    setIsExportingZip(true);
    try {
      saveChromeSettings(extensionSettings, chromeShortcuts);
      const content = await generateManifestV3Package(extensionSettings, chromeShortcuts);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `wallix-chrome-extension-${selectedPreset.id || 'custom'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      if (onShowToast) {
        onShowToast({
          title: 'Manifest V3 ZIP Generated',
          subtitle: 'Unpacked extension archive downloaded for Chrome Developer Mode',
          icon: <Check className="w-4 h-4 text-cyan-400" />
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const glowBorderClass = {
    cyan: 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    rose: 'border-pink-400/60 shadow-[0_0_25px_rgba(244,114,182,0.35)]',
    amber: 'border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    violet: 'border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.35)]',
    emerald: 'border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
  }[searchGlow];

  const searchShapeClass = {
    pill: 'rounded-full',
    rounded: 'rounded-2xl',
    sharp: 'rounded-lg'
  }[searchShape];

  // Sub-Navigation Tabs definition matching requested architecture
  const subTabs = [
    { id: 'new-tab' as ChromeSubTab, label: 'New Tab', icon: Monitor },
    { id: 'background' as ChromeSubTab, label: 'Background', icon: ImageIcon },
    { id: 'video' as ChromeSubTab, label: 'Video Background', icon: FileVideo },
    { id: 'search' as ChromeSubTab, label: 'Search', icon: Search },
    { id: 'shortcuts' as ChromeSubTab, label: 'Shortcuts', icon: Globe },
    { id: 'themes' as ChromeSubTab, label: 'Chrome Themes', icon: Palette },
    { id: 'extension' as ChromeSubTab, label: 'Add to Chrome', icon: Chrome },
  ];

  return (
    <div id="chrome-customization-studio" className="w-full space-y-6 animate-fadeIn pb-12">
      
      {/* ========================================================================= */}
      {/* 1. CHROME STUDIO HEADER & SUB-NAVIGATION BAR                              */}
      {/* ========================================================================= */}
      <div className="p-4 md:p-5 rounded-3xl border border-white/10 bg-[#0E1118]/95 backdrop-blur-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
                  Chrome Customization Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  Dedicated Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your Google Chrome New Tab: backdrops, frosted search, shortcuts dock & 1-click install.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBeginnerInstall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black shadow-[0_0_22px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>🚀</span>
              <span>Add to Chrome (1-Click)</span>
            </button>
          </div>
        </div>

        {/* 7 DEDICATED SUB-TABS (ISOLATED WORKSPACES) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-white/10">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isTabActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTabActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUBTAB 1: NEW TAB INTERACTIVE SIMULATOR (SIMULATION ONLY)              */}
      {/* ========================================================================= */}
      {(activeTab === 'new-tab' || activeTab === 'search' || activeTab === 'shortcuts') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-bold font-mono uppercase text-slate-300 tracking-wider">
                Live Chrome New Tab Simulator
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              Interactive Preview
            </span>
          </div>

          <div className="w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative">
            <ChromeNewTabPreview
              settings={extensionSettings}
              shortcuts={chromeShortcuts}
              variant="full"
              onAddShortcutClick={() => setIsAddingShortcut(true)}
              onQuickCustomizeClick={() => setSubTab('themes')}
              onUpdateShortcuts={(updated) => {
                const mapped: StudioShortcut[] = updated.map(s => ({
                  id: s.id,
                  title: s.title,
                  url: s.url,
                  initials: s.initials,
                  gradient: s.gradient,
                  glowColor: s.glowColor,
                  isDefault: s.isDefault
                }));
                setShortcuts(mapped);
                saveChromeSettings(extensionSettings, updated);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBTAB 2: CHROME BACKGROUND (IMAGE)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'background' && (
        <div className="max-w-4xl mx-auto space-y-6 pt-2">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Chrome Background Image
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Upload your custom high-res picture or choose directly from the WALLIX curated gallery.
            </p>
          </div>

          {/* Current Background Status Card */}
          <div className="p-4 rounded-2xl bg-[#0E121E] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0">
                <img src={currentMedia.imageUrl} alt={currentMedia.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white truncate max-w-xs">{currentMedia.title}</p>
                <p className="text-[10px] text-cyan-400 font-mono">Current Chrome New Tab Backdrop</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setGalleryFilterType('image');
                  setIsGalleryPickerOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Choose From WALLIX</span>
              </button>

              <button
                onClick={() => {
                  setCurrentMedia({
                    title: 'Clean Minimalist Obsidian',
                    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85',
                    videoUrl: undefined,
                    isVideo: false
                  });
                  if (onShowToast) onShowToast({ title: 'Background Reset', subtitle: 'Default dark minimalist wallpaper restored' });
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Upload Component */}
          <UploadZone
            mediaType="image"
            acceptedTypes={['.png', '.jpg', '.jpeg', '.webp', 'image/png', 'image/jpeg', 'image/webp']}
            maxSizeMB={25}
            title="Upload Custom Image for Chrome"
            subtitle="Select a PNG, JPG, or WEBP wallpaper (up to 25MB)"
            actionLabel="Apply to Chrome New Tab"
            onSuccess={(data) => {
              setCurrentMedia({
                title: data.name,
                imageUrl: data.objectUrl,
                videoUrl: '',
                isVideo: false
              });
            }}
            onApply={(data) => {
              setCurrentMedia({
                title: data.name,
                imageUrl: data.objectUrl,
                videoUrl: '',
                isVideo: false
              });
              if (onShowToast) {
                onShowToast({
                  title: 'Chrome Background Set',
                  subtitle: `"${data.name}" will display on New Tab`,
                  icon: <Check className="w-4 h-4 text-emerald-400" />
                });
              }
              setSubTab('new-tab');
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUBTAB 3: CHROME VIDEO BACKGROUND                                      */}
      {/* ========================================================================= */}
      {activeTab === 'video' && (
        <div className="max-w-4xl mx-auto space-y-6 pt-2">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Chrome Video Background (60 FPS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Set an animated video loop as your browser background. Validated for ultra-smooth 60 FPS playback.
            </p>
          </div>

          {/* Upload Component */}
          <UploadZone
            mediaType="video"
            acceptedTypes={['.mp4', '.webm', '.mov', 'video/mp4', 'video/webm', 'video/quicktime']}
            maxSizeMB={150}
            title="Upload Chrome Video Loop"
            subtitle="Upload an MP4 or WebM video file (up to 150MB)"
            actionLabel="Apply Video to Chrome"
            onSuccess={(data) => {
              setCurrentMedia({
                title: data.name,
                imageUrl: data.objectUrl,
                videoUrl: data.objectUrl,
                isVideo: true
              });
            }}
            onApply={(data) => {
              setCurrentMedia({
                title: data.name,
                imageUrl: data.objectUrl,
                videoUrl: data.objectUrl,
                isVideo: true
              });
              if (onShowToast) {
                onShowToast({
                  title: 'Video Applied to Chrome',
                  subtitle: `60 FPS loop configured for New Tab`,
                  icon: <Zap className="w-4 h-4 text-cyan-400" />
                });
              }
              setSubTab('new-tab');
            }}
          />

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setGalleryFilterType('video');
                setIsGalleryPickerOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition flex items-center gap-2 cursor-pointer"
            >
              <FileVideo className="w-4 h-4 text-sky-300" />
              <span>Choose From Curated Video Wallpapers</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUBTAB 4: SEARCH CUSTOMIZER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="max-w-3xl mx-auto space-y-6 pt-2">
          <div className="p-6 rounded-3xl border border-white/10 bg-[#0E121E] space-y-5">
            <h3 className="text-base font-black text-white font-['Outfit']">
              Customize Search Bar Styling
            </h3>

            {/* Shape */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">Search Bar Shape</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pill', 'rounded', 'sharp'] as const).map(shape => (
                  <button
                    key={shape}
                    onClick={() => setSearchShape(shape)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      searchShape === shape 
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50' 
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Glow Color */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">Border Neon Glow</label>
              <div className="flex items-center gap-3">
                {(['cyan', 'rose', 'amber', 'violet', 'emerald'] as const).map(glow => (
                  <button
                    key={glow}
                    onClick={() => setSearchGlow(glow)}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer border-2 ${
                      searchGlow === glow ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: glow === 'cyan' ? '#06b6d4' : glow === 'rose' ? '#f472b6' : glow === 'amber' ? '#f59e0b' : glow === 'violet' ? '#a855f7' : '#10b981'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Placeholder Text */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">Placeholder Text</label>
              <input
                type="text"
                value={searchPlaceholder}
                onChange={(e) => setSearchPlaceholder(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSubTab('new-tab');
                  if (onShowToast) onShowToast({ title: 'Search Bar Styling Saved', subtitle: 'Changes live in simulator' });
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs cursor-pointer hover:bg-cyan-400 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUBTAB 5: SHORTCUTS MANAGER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'shortcuts' && (
        <div className="max-w-3xl mx-auto space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white font-['Outfit']">
              Manage Quick Links ({shortcuts.length})
            </h3>
            <button
              onClick={() => setIsAddingShortcut(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          <div className="space-y-2">
            {shortcuts.map((sc) => (
              <div
                key={sc.id}
                className="p-3 rounded-2xl bg-[#0E121E] border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sc.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {sc.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{sc.title}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{sc.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteShortcut(sc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Delete shortcut"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUBTAB 6: THEMES (2X2 CURATED GRID)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'themes' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Chrome Visual Configurations
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Select a card to apply to Chrome
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WALLIX_THEME_PRESETS.map((preset) => {
              const isCurrent = selectedPreset.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative rounded-2xl p-4.5 transition-all duration-300 cursor-pointer overflow-hidden border ${
                    isCurrent 
                      ? 'border-cyan-400 bg-[#121623] shadow-[0_0_28px_rgba(6,182,212,0.25)] ring-2 ring-cyan-500/30' 
                      : 'border-zinc-800/80 hover:border-zinc-600/80 bg-[#0E1017]/90 hover:bg-[#131620]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {preset.tagline}
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                      {preset.badge || 'CHROME THEME'}
                    </span>
                  </div>

                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-black/60 border border-white/10">
                    <img
                      src={preset.background}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] font-mono text-slate-400">
                      Search: <strong className="text-white capitalize">{preset.searchStyle}</strong>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(preset);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/10 text-white hover:bg-cyan-500 hover:text-black'
                      }`}
                    >
                      {isCurrent ? 'Applied' : 'Apply Theme'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUBTAB 7: ADD TO CHROME / EXTENSION (BEGINNER FLOW + DEVELOPER MODE)    */}
      {/* ========================================================================= */}
      {activeTab === 'extension' && (
        <div className="max-w-2xl mx-auto space-y-6 pt-2">
          {/* Main Beginner Installation Card */}
          <div className="rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-[#0E1528] to-[#080B14] p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-600 text-black flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <Layers className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-['Outfit']">
                Install WALLIX in Google Chrome
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Enjoy your customized 4K background, frosted glass search, and instant dock shortcuts every time you open a new tab.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero configuration required</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Hardware-accelerated 60 FPS engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Safe Chrome Web Store verified workflow</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleBeginnerInstall}
                className="w-full max-w-md px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                🚀 Add to Chrome (1-Click)
              </button>
            </div>
          </div>

          {/* ADVANCED DEVELOPER MODE COLLAPSIBLE */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
            <button
              onClick={() => setShowDeveloperMode(!showDeveloperMode)}
              className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Developer Mode: Manual Manifest V3 Package</span>
              </span>
              <span>{showDeveloperMode ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showDeveloperMode && (
              <div className="pt-3 border-t border-white/10 space-y-3 text-xs text-slate-300">
                <p>
                  For developers wanting to inspect the raw Manifest V3 source files, customize the HTML/CSS, or load via <code>chrome://extensions</code> Developer Mode:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Download the self-contained ZIP below</li>
                  <li>Extract archive into a local folder</li>
                  <li>In Chrome, go to <code>chrome://extensions</code> & toggle Developer mode</li>
                  <li>Click "Load unpacked" and select the folder</li>
                </ol>
                <button
                  onClick={handleDownloadExtensionZip}
                  disabled={isExportingZip}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingZip ? 'Packaging ZIP...' : 'Download Unpacked ZIP Bundle'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALS: OFFICIAL CHROME WEB STORE INSTALL CONFIRMATION MODAL            */}
      {/* ========================================================================= */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-[#0E121E] border border-cyan-400/40 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mx-auto shadow-lg shadow-cyan-950/40">
              <Layers className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white font-['Outfit']">
                Add "WALLIX 4K Live New Tab"?
              </h3>
              <p className="text-xs text-slate-400">
                Google Chrome Web Store Verified Extension
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-left text-xs text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">This extension can:</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Replace the page you see when opening a new tab</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Render your active 4K background and quick dock</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInstall}
                disabled={isInstalledConfirmed}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-lg shadow-cyan-950/50 transition flex items-center gap-2 cursor-pointer"
              >
                {isInstalledConfirmed ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Installed!</span>
                  </>
                ) : (
                  <span>Add extension</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODALS: ADD SHORTCUT MODAL                                            */}
      {/* ========================================================================= */}
      {isAddingShortcut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl p-6 bg-[#0E121E] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-black text-white font-['Outfit']">Add Shortcut to Dock</h4>
              <button onClick={() => setIsAddingShortcut(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShortcut} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Figma, Twitter"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Custom Initials (Optional)</label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. NF, FG"
                  value={newInitials}
                  onChange={(e) => setNewInitials(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Neon Color Theme</label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {SHORTCUT_COLOR_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewColorIndex(idx)}
                      className={`h-7 rounded-lg bg-gradient-to-r ${opt.gradient} border-2 transition-transform ${
                        newColorIndex === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingShortcut(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow-md"
                >
                  Add Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODALS: CHOOSE FROM WALLIX GALLERY PICKER                              */}
      {/* ========================================================================= */}
      {isGalleryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[85vh] rounded-3xl p-6 bg-[#0E121E] border border-white/20 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white font-['Outfit']">
                  Choose Wallpaper for Chrome New Tab
                </h3>
              </div>
              <button onClick={() => setIsGalleryPickerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {wallpapers
                .filter(w => galleryFilterType === 'video' ? (w.isVideo || w.videoUrl) : (!w.isVideo || w.imageUrl))
                .map((wp) => (
                <div
                  key={wp.id}
                  onClick={() => {
                    setCurrentMedia({
                      title: sanitizeWallpaperTitle(wp.title),
                      imageUrl: wp.imageUrl || wp.thumbnail || '',
                      videoUrl: wp.videoUrl,
                      isVideo: !!wp.videoUrl
                    });
                    setIsGalleryPickerOpen(false);
                    if (onShowToast) {
                      onShowToast({
                        title: 'Chrome Wallpaper Selected',
                        subtitle: sanitizeWallpaperTitle(wp.title),
                        icon: <Sparkles className="w-4 h-4 text-cyan-400" />
                      });
                    }
                  }}
                  className="group relative h-32 rounded-xl overflow-hidden bg-black/60 border border-white/10 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <img
                    src={wp.thumbnail || wp.thumbnailUrl || wp.imageUrl}
                    alt={wp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 inset-x-2">
                    <p className="text-[11px] font-bold text-white truncate">{sanitizeWallpaperTitle(wp.title)}</p>
                    <p className="text-[9px] text-cyan-300 font-mono">{wp.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
