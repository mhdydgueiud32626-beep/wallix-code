import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Code, 
  Layers, 
  Search, 
  Clock, 
  CloudSun, 
  Settings, 
  ExternalLink, 
  Sparkles, 
  Globe, 
  Plus, 
  Trash2, 
  Laptop, 
  FileCode, 
  FileText, 
  FolderArchive,
  ShieldCheck,
  Zap,
  Eye,
  Grid,
  Mic,
  Camera,
  Pencil
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Wallpaper } from '../types';

interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper;
  onNavigateToGalleryForExtension?: () => void;
}

type TabType = 'preview' | 'code' | 'guide';
type CodeFileType = 'all-in-one.html' | 'manifest.json' | 'index.html' | 'styles.css' | 'app.js';

interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  iconBg: string;
  initials: string;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com', iconBg: 'from-blue-500 to-red-500', initials: 'G' },
  { id: '2', title: 'YouTube', url: 'https://www.youtube.com', iconBg: 'from-red-600 to-rose-700', initials: 'YT' },
  { id: '3', title: 'GitHub', url: 'https://www.github.com', iconBg: 'from-slate-800 to-zinc-900', initials: 'GH' },
  { id: '4', title: 'AI Studio', url: 'https://aistudio.google.com', iconBg: 'from-cyan-500 to-blue-600', initials: 'AI' },
  { id: '5', title: 'Reddit', url: 'https://www.reddit.com', iconBg: 'from-orange-500 to-red-600', initials: 'R' },
  { id: '6', title: 'Twitter / X', url: 'https://x.com', iconBg: 'from-zinc-800 to-black', initials: 'X' },
  { id: '7', title: 'ChatGPT', url: 'https://chatgpt.com', iconBg: 'from-emerald-600 to-teal-700', initials: 'GPT' },
  { id: '8', title: 'Netflix', url: 'https://www.netflix.com', iconBg: 'from-rose-700 to-red-900', initials: 'N' }
];

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({
  isOpen,
  onClose,
  wallpapers,
  activeWallpaper,
  onNavigateToGalleryForExtension
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [activeCodeFile, setActiveCodeFile] = useState<CodeFileType>('manifest.json');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Live Extension Preview States
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper>(() => {
    try {
      const savedWp = localStorage.getItem('wallix_extension_live_wallpaper');
      if (savedWp) return JSON.parse(savedWp);
      const currUrl = localStorage.getItem('current_wallpaper');
      if (currUrl) {
        const found = wallpapers.find(w => w.videoUrl === currUrl || w.imageUrl === currUrl || w.thumbnail === currUrl);
        if (found) return found;
      }
    } catch {}
    return activeWallpaper;
  });

  // Sync wallpaper whenever modal is opened or activeWallpaper updates
  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedWp = localStorage.getItem('wallix_extension_live_wallpaper');
      if (savedWp) {
        setPreviewWallpaper(JSON.parse(savedWp));
        return;
      }
      const currUrl = localStorage.getItem('current_wallpaper');
      if (currUrl) {
        const found = wallpapers.find(w => w.videoUrl === currUrl || w.imageUrl === currUrl || w.thumbnail === currUrl);
        if (found) {
          setPreviewWallpaper(found);
          return;
        }
      }
    } catch {}
    if (activeWallpaper) {
      setPreviewWallpaper(activeWallpaper);
    }
  }, [isOpen, activeWallpaper, wallpapers]);

  // Handle ESC key to smoothly close the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApplyWallpaper = (wp: Wallpaper) => {
    setPreviewWallpaper(wp);
    const mediaUrl = wp.videoUrl || wp.imageUrl || wp.thumbnail || '';
    try {
      localStorage.setItem('current_wallpaper', mediaUrl);
      localStorage.setItem('wallix_extension_live_wallpaper', JSON.stringify(wp));
      if (wp.videoUrl) {
        localStorage.setItem('wallix_bg_type', 'video');
        localStorage.setItem('wallix_bg_video_url', wp.videoUrl);
      } else if (wp.imageUrl || wp.thumbnail) {
        localStorage.setItem('wallix_bg_type', 'image');
        localStorage.setItem('wallix_bg_data', wp.imageUrl || wp.thumbnail);
      }
    } catch {}
  };

  const handleLocalWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const customWp: Wallpaper = {
      id: 'custom-local-' + Date.now(),
      title: file.name,
      category: 'Custom',
      tags: ['custom', 'local'],
      resolution: '4K UHD',
      resolutionText: '4K UHD 3840x2160',
      is3D: false,
      isLive: file.type.startsWith('video/'),
      isVideo: file.type.startsWith('video/'),
      videoUrl: file.type.startsWith('video/') ? url : undefined,
      imageUrl: file.type.startsWith('image/') ? url : 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
      thumbnailUrl: file.type.startsWith('image/') ? url : 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
      thumbnail: file.type.startsWith('image/') ? url : 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
      author: {
        name: 'Local User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        badge: 'Creator'
      },
      downloads: 1,
      likes: 1,
      aspectRatio: '16:9',
      description: 'Local custom uploaded wallpaper',
      colors: ['#06B6D4', '#3B82F6'],
      fileSize: `${Math.round(file.size / (1024 * 1024) * 10) / 10} MB`,
      fps: 60
    };
    handleApplyWallpaper(customWp);
  };
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState<'google' | 'duckduckgo' | 'bing' | 'youtube'>('google');
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const saved = localStorage.getItem('wallsflow_ext_shortcuts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SHORTCUTS;
  });
  
  // Settings in preview
  const [layoutMode, setLayoutMode] = useState<'clean' | 'dashboard'>('clean');
  const [showClock, setShowClock] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [is24Hour, setIs24Hour] = useState(false);
  const [glassBlur, setGlassBlur] = useState<number>(16);
  const [glassOpacity, setGlassOpacity] = useState<number>(15);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // New Shortcut Modal State
  const [isAddShortcutOpen, setIsAddShortcutOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update preview wallpaper if active wallpaper changes
  useEffect(() => {
    setPreviewWallpaper(activeWallpaper);
  }, [activeWallpaper]);

  if (!isOpen) return null;

  // Real-time formatted clock string
  const formatClock = () => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    let ampm = '';
    
    if (!is24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // '0' should be '12'
    }
    const formattedHours = is24Hour ? hours.toString().padStart(2, '0') : hours.toString();
    return {
      main: `${formattedHours}:${minutes}`,
      seconds: `:${seconds}`,
      ampm
    };
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const encoded = encodeURIComponent(searchQuery.trim());
    let url = `https://www.google.com/search?q=${encoded}`;
    if (searchEngine === 'duckduckgo') url = `https://duckduckgo.com/?q=${encoded}`;
    if (searchEngine === 'bing') url = `https://www.bing.com/search?q=${encoded}`;
    if (searchEngine === 'youtube') url = `https://www.youtube.com/results?search_query=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const initials = newTitle.slice(0, 2).toUpperCase();
    const newShortcut: ShortcutItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      url,
      iconBg: 'from-indigo-600 to-purple-600',
      initials
    };
    const updated = [...shortcuts, newShortcut];
    setShortcuts(updated);
    localStorage.setItem('wallsflow_ext_shortcuts', JSON.stringify(updated));
    setNewTitle('');
    setNewUrl('');
    setIsAddShortcutOpen(false);
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = shortcuts.filter(s => s.id !== id);
    setShortcuts(updated);
    localStorage.setItem('wallsflow_ext_shortcuts', JSON.stringify(updated));
  };

  // Extension Code Templates
  const MANIFEST_CODE = `{
  "manifest_version": 3,
  "name": "Wallsflow - Live 4K Wallpaper New Tab",
  "version": "1.0.0",
  "description": "Transform your Chrome New Tab with stunning 60 FPS live video wallpapers, 4K backgrounds, glassmorphism widgets, clock, and quick shortcuts.",
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "permissions": [
    "storage",
    "unlimitedStorage"
  ],
  "host_permissions": [
    "https://api.open-meteo.com/*",
    "https://images.unsplash.com/*",
    "https://assets.mixkit.co/*"
  ],
  "action": {
    "default_title": "Wallsflow Live New Tab"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`;

  const INDEX_HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WallX Studio - New Tab</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <style>
    /* Global Styles & Background */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0d0f12 url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop') center/cover no-repeat fixed;
      min-height: 100vh;
      color: #ffffff;
      overflow: hidden;
    }

    /* Top Navigation Glass Pill */
    .glass-header-pill {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    /* Search Bar Glass */
    .glass-search-pill {
      background: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(25px) saturate(180%);
      -webkit-backdrop-filter: blur(25px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
    }

    /* macOS Dock Elastic Physics Animation */
    .mac-dock-item {
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .glass-shortcut-circle {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    .glass-shortcut-circle::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 45%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 100%);
      border-radius: 50% 50% 0 0;
      pointer-events: none;
    }

    /* Smooth Hover Animation without any Red Badges */
    .mac-dock-item:hover .glass-shortcut-circle {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%);
      border-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 25px rgba(255, 255, 255, 0.35);
      transform: scale(1.32) translateY(-10px);
    }

    /* Hide default delete button badges if any */
    .delete-btn, .remove-shortcut, button[title*="Remove"] {
      display: none !important;
    }

    .glass-floating-btn {
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .glass-floating-btn:hover {
      background: rgba(0, 0, 0, 0.65);
      border-color: rgba(255, 255, 255, 0.5);
    }
  </style>
</head>
<body class="flex flex-col justify-between p-6 relative">

  <!-- TOP-RIGHT NAVIGATION HEADER -->
  <header class="w-full flex justify-end items-center z-30">
    <div class="glass-header-pill px-4 py-2 rounded-full flex items-center gap-5 shadow-lg">
      <a href="https://mail.google.com" target="_blank" class="text-xs font-semibold text-white/90 hover:text-white transition-colors">Gmail</a>
      <a href="https://images.google.com" target="_blank" class="text-xs font-semibold text-white/90 hover:text-white transition-colors">Images</a>
      
      <!-- Clean 3x3 Dot Grid Icon -->
      <button class="text-white/80 hover:text-white p-1 rounded-full transition-all hover:scale-110" title="Google Apps">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
          <circle cx="5" cy="5" r="2"/>
          <circle cx="12" cy="5" r="2"/>
          <circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="12" cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
        </svg>
      </button>

      <!-- Profile Avatar -->
      <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md border border-white/40 cursor-pointer">
        W
      </div>
    </div>
  </header>

  <!-- CENTER VIEWPORT: SEARCH BAR & SHORTCUTS -->
  <main class="flex-1 flex flex-col items-center justify-center -mt-10 z-20 w-full max-w-3xl mx-auto">
    
    <!-- FROSTED GLASS SEARCH BAR -->
    <div class="w-full relative mb-10">
      <div class="glass-search-pill rounded-full px-5 py-3.5 flex items-center gap-3 transition-all">
        <i data-lucide="search" class="w-5 h-5 text-white/80"></i>
        <input 
          type="text" 
          id="main-search-input"
          placeholder="Ask Google, search the web, or ask Gemini AI..." 
          class="bg-transparent border-none outline-none w-full text-white placeholder-white/70 text-sm font-medium"
        />
        
        <!-- Action Buttons inside Search Bar -->
        <div class="flex items-center gap-2">
          <button title="Voice Search" class="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all">
            <i data-lucide="mic" class="w-4 h-4"></i>
          </button>
          <button title="Google Lens" class="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all">
            <i data-lucide="camera" class="w-4 h-4"></i>
          </button>
          <button id="ai-mode-toggle" class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/50 transition-all shadow-sm">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-cyan-300"></i>
            <span>AI Mode: ON</span>
          </button>
        </div>
      </div>
    </div>

    <!-- FREELY FLOATING MAC-STYLE SHORTCUTS GRID (No Background Box) -->
    <div class="flex items-center justify-center gap-6 flex-wrap px-4 py-2">
      
      <!-- Shortcut 1: Web Store -->
      <a href="https://chromewebstore.google.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="shopping-bag" class="w-5 h-5 text-cyan-300"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">Web Store</span>
      </a>

      <!-- Shortcut 2: YouTube -->
      <a href="https://youtube.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="youtube" class="w-5 h-5 text-red-400"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">YouTube</span>
      </a>

      <!-- Shortcut 3: AI Studio -->
      <a href="https://aistudio.google.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">AI Studio</span>
      </a>

      <!-- Shortcut 4: GitHub -->
      <a href="https://github.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="github" class="w-5 h-5 text-white"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">GitHub</span>
      </a>

      <!-- Shortcut 5: Reddit -->
      <a href="https://reddit.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="message-square" class="w-5 h-5 text-orange-400"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">Reddit</span>
      </a>

      <!-- Shortcut 6: Canva -->
      <a href="https://canva.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="palette" class="w-5 h-5 text-emerald-300"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">Canva</span>
      </a>

      <!-- Shortcut 7: ChatGPT -->
      <a href="https://chatgpt.com" class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center">
          <i data-lucide="bot" class="w-5 h-5 text-teal-300"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">ChatGPT</span>
      </a>

      <!-- Shortcut 8: Add Link -->
      <button class="mac-dock-item flex flex-col items-center gap-2 group">
        <div class="w-12 h-12 rounded-full glass-shortcut-circle flex items-center justify-center border-dashed">
          <i data-lucide="plus" class="w-5 h-5 text-white/80"></i>
        </div>
        <span class="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">Add Link</span>
      </button>

    </div>

  </main>

  <!-- BOTTOM-RIGHT CORNER CONTROLS -->
  <footer class="fixed bottom-5 right-5 z-40">
    <button id="customize-pencil-btn" title="Customize New Tab Page" class="w-10 h-10 rounded-full glass-floating-btn flex items-center justify-center text-white hover:text-cyan-300 transition-all shadow-xl hover:scale-110">
      <i data-lucide="pencil" class="w-4 h-4"></i>
    </button>
  </footer>

  <script>
    // Initialize Lucide Icons
    lucide.createIcons();

    // Search Trigger Handling
    const searchInput = document.getElementById('main-search-input');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        const query = encodeURIComponent(searchInput.value.trim());
        window.location.href = 'https://www.google.com/search?q=' + query;
      }
    });
  </script>
</body>
</html>`;

  const STYLES_CSS_CODE = `/* Wallsflow Chrome Extension Stylesheet */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #ffffff;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  background-color: #0b0d14;
}

/* Background Media Container */
.wallpaper-container {
  position: fixed;
  inset: 0;
  z-index: -2;
  overflow: hidden;
}

.bg-media {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  transform: scale(1.02);
  transition: opacity 0.5s ease;
}

.bg-img {
  background-size: cover;
  background-position: center;
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%),
              linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
  pointer-events-none;
}

/* Glassmorphic Components */
.glass-pill {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.glass-card {
  background: rgba(20, 24, 38, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.glass-btn {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.glass-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
}

/* Layout */
.dashboard-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px 48px;
  position: relative;
  z-index: 10;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-center {
  margin: auto;
  text-align: center;
  max-width: 760px;
  width: 100%;
}

/* Clock */
.clock-card {
  margin-bottom: 28px;
}

.time-text {
  font-size: 5.5rem;
  font-weight: 800;
  letter-spacing: -2px;
  line-height: 1;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
}

.date-text {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

/* Search Bar */
.search-box {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin-bottom: 36px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-box:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
  transform: scale(1.015);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.05rem;
  padding: 8px 12px;
  outline: none;
  font-family: inherit;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-submit-btn {
  background: #38bdf8;
  border: none;
  color: #000;
  font-weight: 700;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.search-submit-btn:hover {
  transform: scale(1.1);
}

/* Shortcuts */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.shortcut-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #fff;
  transition: all 0.25s ease;
}

.shortcut-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  border-color: #38bdf8;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.shortcut-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.shortcut-label {
  font-size: 0.85rem;
  font-weight: 600;
}

/* Settings Drawer */
.settings-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  background: rgba(15, 18, 28, 0.95);
  backdrop-filter: blur(25px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  padding: 24px;
  transform: translateX(0);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.settings-drawer.hidden {
  transform: translateX(100%);
  display: block;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  font-size: 0.9rem;
}
`;

  const APP_JS_CODE = `// Wallsflow Chrome Extension Core Logic
document.addEventListener('DOMContentLoaded', () => {
  // 1. Clock Engine
  const timeDisplay = document.getElementById('timeDisplay');
  const dateDisplay = document.getElementById('dateDisplay');
  let is24Hour = false;

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    if (!is24Hour) {
      hours = hours % 12 || 12;
    }
    
    timeDisplay.textContent = \`\${hours}:\${minutes}\`;
    dateDisplay.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
  
  setInterval(updateClock, 1000);
  updateClock();

  // 2. Weather Engine (Open-Meteo Public API)
  async function fetchWeather() {
    try {
      // Default to auto-location or fallback coordinates
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true');
      const data = await res.json();
      if (data && data.current_weather) {
        document.getElementById('tempDisplay').textContent = \`\${Math.round(data.current_weather.temperature)}°C\`;
        document.getElementById('weatherDesc').textContent = 'Clear Sky';
      }
    } catch (e) {
      console.warn('Weather fetch fallback:', e);
    }
  }
  fetchWeather();

  // 3. Search Bar Submission
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    
    if (query.startsWith('http://') || query.startsWith('https://')) {
      window.location.href = query;
    } else {
      window.location.href = \`https://www.google.com/search?q=\${encodeURIComponent(query)}\`;
    }
  });

  // 4. Load & Render Shortcuts
  const DEFAULT_SHORTCUTS = [
    { title: 'Google', url: 'https://www.google.com', color: '#4285F4' },
    { title: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
    { title: 'GitHub', url: 'https://www.github.com', color: '#24292E' },
    { title: 'AI Studio', url: 'https://aistudio.google.com', color: '#06B6D4' }
  ];

  function renderShortcuts() {
    const grid = document.getElementById('shortcutsGrid');
    chrome.storage?.local?.get(['shortcuts'], (result) => {
      const list = result.shortcuts || DEFAULT_SHORTCUTS;
      grid.innerHTML = list.map(item => \`
        <a href="\${item.url}" class="shortcut-item">
          <div class="shortcut-icon" style="background: \${item.color}">
            \${item.title.charAt(0)}
          </div>
          <span class="shortcut-label">\${item.title}</span>
        </a>
      \`).join('');
    });
  }
  renderShortcuts();

  // 5. Settings Drawer Controls
  const settingsDrawer = document.getElementById('settingsDrawer');
  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  settingsToggleBtn.addEventListener('click', () => {
    settingsDrawer.classList.toggle('hidden');
  });

  closeDrawerBtn.addEventListener('click', () => {
    settingsDrawer.classList.add('hidden');
  });
});
`;

  const ALL_IN_ONE_HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean Live New Tab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
    }

    body {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      background-color: #0b0d14;
    }

    /* 1. Fullscreen 60FPS Video Wallpaper Layer */
    .wallpaper-container {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
    }

    #bgVideo {
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      transform: scale(1.02);
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.6) 100%),
                  linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 60%);
    }

    /* 2. Minimal Centered Dashboard */
    .main-dashboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      width: 100%;
      max-width: 640px;
      padding: 0 24px;
      z-index: 10;
    }

    /* Brand Logo / Monogram */
    .brand-logo {
      width: 48px;
      height: 48px;
      opacity: 0.9;
      filter: drop-shadow(0 4px 16px rgba(56, 189, 248, 0.4));
      transition: transform 0.3s ease;
    }

    .brand-logo:hover {
      transform: scale(1.08);
    }

    /* 3. Glassmorphic Search Bar */
    .search-form {
      width: 100%;
    }

    .search-box {
      width: 100%;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      display: flex;
      align-items: center;
      padding: 6px 18px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .search-box:focus-within {
      border-color: #38bdf8;
      box-shadow: 0 0 28px rgba(56, 189, 248, 0.45);
      transform: scale(1.02);
      background: rgba(255, 255, 255, 0.2);
    }

    .search-box input {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 16px;
      padding: 12px 10px;
      user-select: text;
    }

    .search-box input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    .search-btn {
      background: linear-gradient(135deg, #38bdf8, #0284c7);
      border: none;
      color: #000000;
      cursor: pointer;
      font-size: 14px;
      font-weight: 800;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .search-btn:hover {
      transform: scale(1.08);
    }

    /* 4. Minimalist Shortcut Tiles Row */
    .shortcuts-container {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .shortcut-card {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      width: 92px;
      height: 92px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      color: #ffffff;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .shortcut-card:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.24);
      border-color: #38bdf8;
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.3);
    }

    .shortcut-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      color: #ffffff;
      box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }

    .shortcut-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    /* 1-Click Wallpaper Changer बटन (कोने में) */
    .change-btn-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
    }

    .change-btn {
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .change-btn:hover {
      background: rgba(255, 255, 255, 0.28);
      border-color: #38bdf8;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.35);
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>

  <!-- Fullscreen 60FPS Video Background & Image Fallback -->
  <div class="wallpaper-container">
    <video autoplay loop muted playsinline id="bgVideo" class="bg-media">
      <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4">
    </video>
    <img id="bgImg" class="bg-media hidden" alt="wallpaper">
    <div class="overlay"></div>
  </div>

  <!-- Clean Minimalist Dashboard -->
  <main class="main-dashboard">
    
    <!-- Minimal Geometric Brand Logo -->
    <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>

    <!-- Centered Search Bar -->
    <form class="search-form" action="https://www.google.com/search" method="GET">
      <div class="search-box">
        <input type="text" name="q" placeholder="Search Google or enter web address..." autocomplete="off" autofocus>
        <button type="submit" class="search-btn">→</button>
      </div>
    </form>

    <!-- Row of 4-5 Quick Shortcut Tiles -->
    <div class="shortcuts-container">
      <a href="https://www.youtube.com" target="_blank" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #FF0000, #CC0000);">▶</div>
        <span class="shortcut-label">YouTube</span>
      </a>

      <a href="https://www.google.com" target="_blank" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #4285F4, #34A853);">G</div>
        <span class="shortcut-label">Google</span>
      </a>

      <a href="https://aistudio.google.com" target="_blank" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #06B6D4, #3B82F6);">AI</div>
        <span class="shortcut-label">AI Studio</span>
      </a>

      <a href="https://www.pinterest.com" target="_blank" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #E60023, #BD081C);">P</div>
        <span class="shortcut-label">Pinterest</span>
      </a>

      <a href="https://store.steampowered.com" target="_blank" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #171A21, #000000);">S</div>
        <span class="shortcut-label">Steam</span>
      </a>
    </div>

  </main>

  <!-- 1-Click Wallpaper Picker -->
  <div class="change-btn-wrapper">
    <input type="file" id="wallpaperPicker" accept="video/*,image/*" style="display: none;">
    <button class="change-btn" onclick="document.getElementById('wallpaperPicker').click()">
      <span>📸</span>
      <span>Change Wallpaper</span>
    </button>
  </div>

  <script>
    const picker = document.getElementById('wallpaperPicker');
    const bgVideo = document.getElementById('bgVideo');
    const bgImg = document.getElementById('bgImg');

    picker.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileURL = URL.createObjectURL(file);

      if (file.type.startsWith('video/')) {
        bgImg.classList.add('hidden');
        bgVideo.classList.remove('hidden');
        bgVideo.src = fileURL;
        bgVideo.play();
      } else if (file.type.startsWith('image/')) {
        bgVideo.classList.add('hidden');
        bgImg.classList.remove('hidden');
        bgImg.src = fileURL;
      }
    });
  </script>

</body>
</html>`;

  const getCodeContent = (file: CodeFileType) => {
    switch (file) {
      case 'all-in-one.html':
        return ALL_IN_ONE_HTML_CODE;
      case 'manifest.json':
        return MANIFEST_CODE;
      case 'index.html':
        return INDEX_HTML_CODE;
      case 'styles.css':
        return STYLES_CSS_CODE;
      case 'app.js':
        return APP_JS_CODE;
      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    const code = getCodeContent(activeCodeFile);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1-Click Chrome Extension Install / Action
  // NOTE: Replace YOUR_CHROME_STORE_URL with your published Chrome Web Store link
  const YOUR_CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/wallix-live-4k-wallpapers/';

  const handleAddToChrome = () => {
    try {
      window.open(YOUR_CHROME_STORE_URL, '_blank');
    } catch (err) {
      console.warn('Failed to open Chrome Web Store URL', err);
    }

    // Switch to visual setup guide tab and trigger celebration confetti
    setActiveTab('guide');
    confetti({
      particleCount: 60,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#06B6D4', '#38BDF8', '#818CF8', '#A855F7']
    });
  };

  // 1-Click Package Download
  const handleDownloadPackage = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      // Core Chrome Extension Manifest V3 files
      zip.file('manifest.json', MANIFEST_CODE);
      zip.file('index.html', INDEX_HTML_CODE);
      zip.file('styles.css', STYLES_CSS_CODE);
      zip.file('app.js', APP_JS_CODE);
      zip.file('README.md', `# WALLIX - Chrome Extension Live Wallpaper New Tab

## 🚀 Quick Setup:
1. Open Chrome and go to: \`chrome://extensions/\`
2. Turn ON **"Developer mode"** in top-right.
3. Drag & drop or select this folder.
4. Open a New Tab and enjoy your 4K / 8K Live Wallpaper!
`);

      const icons = zip.folder('icons');
      if (icons) {
        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`;
        icons.file('icon.svg', svgIcon);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wallix-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate package:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const clock = formatClock();

  return (
    <div 
      id="chrome-extension-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-2 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[90vh] bg-[#0c0e17] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
      >
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Wallsflow Chrome Extension Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Manifest V3
                </span>
              </div>
            </div>
          </div>

          {/* Tab Switcher & 1-Click Chrome Install Button */}
          <div className="flex items-center gap-3">
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-cyan-500 text-black shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Simulator</span>
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'guide'
                    ? 'bg-cyan-500 text-black shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Visual Setup Guide</span>
              </button>
            </div>

            <button
              id="ext-modal-add-to-chrome-btn"
              onClick={handleAddToChrome}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black shadow-[0_0_24px_rgba(6,182,212,0.5)] hover:shadow-[0_0_32px_rgba(6,182,212,0.8)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>🚀</span>
              <span>Add to Chrome (1-Click)</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden relative">

          {/* TAB 1: LIVE EXTENSION SIMULATOR */}
          {activeTab === 'preview' && (
            <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-hidden select-none">
              
              {/* Background Wallpaper */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {previewWallpaper.videoUrl ? (
                  <video
                    key={previewWallpaper.videoUrl}
                    src={previewWallpaper.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewWallpaper.imageUrl || previewWallpaper.thumbnail}
                    alt={previewWallpaper.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Vignette Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />
              </div>

              {/* Top-Right Navigation Header */}
              <div className="relative z-10 flex items-center justify-end w-full">
                <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg flex items-center gap-4 transition-all hover:border-white/40">
                  <a 
                    href="https://mail.google.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-semibold text-white/90 hover:text-white transition-colors"
                  >
                    Gmail
                  </a>
                  <a 
                    href="https://images.google.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-semibold text-white/90 hover:text-white transition-colors"
                  >
                    Images
                  </a>
                  <button 
                    className="text-white/80 hover:text-white p-1 rounded-full transition-all hover:scale-110 cursor-pointer" 
                    title="Google Apps"
                    onClick={() => window.open('https://about.google/products/', '_blank')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <circle cx="5" cy="5" r="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="19" cy="5" r="2"/>
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                      <circle cx="5" cy="19" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                      <circle cx="19" cy="19" r="2"/>
                    </svg>
                  </button>
                  <div 
                    className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md border border-white/40 cursor-pointer"
                    title="Google Account"
                  >
                    W
                  </div>
                </div>
              </div>

              {/* Center Viewport: Search Bar & Floating Shortcuts */}
              <div className="relative z-10 max-w-2xl mx-auto w-full text-center my-auto flex flex-col items-center">
                
                {/* Frosted Glass Search Bar */}
                <form onSubmit={handleSearchSubmit} className="mb-8 w-full">
                  <div 
                    className="relative flex items-center rounded-full px-5 py-3.5 bg-white/20 backdrop-blur-2xl border border-white/35 shadow-[0_15px_35px_rgba(0,0,0,0.35)] transition-all duration-300 focus-within:bg-white/30 focus-within:border-white/60 focus-within:shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                  >
                    <Search className="w-5 h-5 text-white/80 mr-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ask Google, search the web, or ask Gemini AI..."
                      className="w-full bg-transparent text-sm font-medium text-white placeholder-white/70 focus:outline-none"
                    />
                    
                    {/* Internal Search Bar Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        title="Voice Search"
                        onClick={() => setSearchQuery('Voice search activated...')}
                        className="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Google Lens"
                        onClick={() => window.open('https://lens.google.com', '_blank')}
                        className="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchEngine(searchEngine === 'google' ? 'youtube' : 'google')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/30 hover:bg-cyan-500/50 border border-cyan-400/50 text-cyan-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>AI Mode: ON</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Freely Floating Mac-Style Shortcuts Grid (No background box) */}
                {showShortcuts && (
                  <div className="flex items-center justify-center gap-6 flex-wrap px-4 py-2">
                    {shortcuts.map((sc) => (
                      <div
                        key={sc.id}
                        className="group relative flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer"
                        onClick={() => window.open(sc.url, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/40 shadow-[0_8px_25px_rgba(0,0,0,0.25)] flex items-center justify-center text-white text-xs font-black transition-all duration-300 group-hover:scale-[1.35] group-hover:-translate-y-3 group-hover:border-white/70 group-hover:shadow-[0_16px_35px_rgba(0,0,0,0.4)]">
                          <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${sc.iconBg} flex items-center justify-center text-white text-[11px] font-black`}>
                            {sc.initials}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">
                          {sc.title}
                        </span>
                      </div>
                    ))}

                    {/* Add Shortcut Button */}
                    <button
                      onClick={() => setIsAddShortcutOpen(true)}
                      className="group flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer"
                      title="Add Custom Shortcut"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-dashed border-white/40 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/70 group-hover:scale-[1.35] group-hover:-translate-y-3 transition-all duration-300">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors drop-shadow">
                        Add Link
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Unified Control Dock with Pencil Customization Button */}
              <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                {/* Choose from Gallery Button */}
                <button
                  onClick={() => {
                    if (onNavigateToGalleryForExtension) {
                      onNavigateToGalleryForExtension();
                    } else {
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 hover:border-cyan-400/60 text-white font-bold text-xs shadow-xl backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  title="Browse Home Gallery and select any wallpaper for Google Chrome New Tab"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Choose from Gallery</span>
                </button>

                {/* Set Live Wallpaper Button */}
                <button
                  onClick={() => {
                    handleApplyWallpaper(previewWallpaper);
                    setDownloadSuccess(true);
                    confetti({
                      particleCount: 50,
                      spread: 70,
                      origin: { y: 0.8 },
                      colors: ['#06B6D4', '#38BDF8', '#818CF8']
                    });
                    setTimeout(() => setDownloadSuccess(false), 3000);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs shadow-[0_0_24px_rgba(6,182,212,0.4)] hover:shadow-[0_0_32px_rgba(6,182,212,0.7)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  title="Lock this selection as the default Chrome Extension wallpaper"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span>Locked as Default!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>Set Live Wallpaper</span>
                    </>
                  )}
                </button>

                {/* Bottom-Right Standalone Glass Pencil Button */}
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  title="Customize New Tab Page"
                  className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl border border-white/25 hover:border-white/50 text-white hover:text-cyan-300 flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Slide-out Settings Drawer */}
              {isSettingsOpen && (
                <div className="absolute top-0 right-0 bottom-0 w-80 bg-[#0d101c]/95 border-l border-white/15 z-30 p-5 overflow-y-auto backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-cyan-400" />
                        <span>Extension Settings</span>
                      </h3>
                      <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="text-slate-400 hover:text-white text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Live Wallpaper Picker */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-300">
                          Select Live Wallpaper
                        </label>
                        <button
                          onClick={() => document.getElementById('ext-local-wp-picker')?.click()}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                        >
                          + Upload Local
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {wallpapers.slice(0, 10).map((wp) => (
                          <div
                            key={wp.id}
                            onClick={() => handleApplyWallpaper(wp)}
                            className={`relative rounded-xl overflow-hidden aspect-video border cursor-pointer transition ${
                              previewWallpaper.id === wp.id
                                ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img
                              src={wp.thumbnail || wp.imageUrl}
                              alt={wp.title}
                              className="w-full h-full object-cover"
                            />
                            {wp.videoUrl && (
                              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-bold text-cyan-300">
                                VIDEO
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Widget Toggles */}
                    <div className="mb-5 space-y-2.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Widget Visibility
                      </label>
                      
                      <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer">
                        <span>Digital Clock</span>
                        <input
                          type="checkbox"
                          checked={showClock}
                          onChange={(e) => setShowClock(e.target.checked)}
                          className="accent-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer">
                        <span>Weather Badge</span>
                        <input
                          type="checkbox"
                          checked={showWeather}
                          onChange={(e) => setShowWeather(e.target.checked)}
                          className="accent-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer">
                        <span>Website Shortcuts</span>
                        <input
                          type="checkbox"
                          checked={showShortcuts}
                          onChange={(e) => setShowShortcuts(e.target.checked)}
                          className="accent-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer">
                        <span>24-Hour Clock Format</span>
                        <input
                          type="checkbox"
                          checked={is24Hour}
                          onChange={(e) => setIs24Hour(e.target.checked)}
                          className="accent-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Glassmorphism Controls */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-300 block">
                        Glassmorphism Blur & Opacity
                      </label>
                      
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Blur Intensity</span>
                          <span>{glassBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="32"
                          value={glassBlur}
                          onChange={(e) => setGlassBlur(Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Card Opacity</span>
                          <span>{glassOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          value={glassOpacity}
                          onChange={(e) => setGlassOpacity(Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full py-2.5 mt-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black shadow-lg transition"
                  >
                    Save & Close
                  </button>
                </div>
              )}

              {/* Add Shortcut Modal */}
              {isAddShortcutOpen && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4">
                  <div className="bg-[#141828] border border-cyan-500/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-3">Add Custom Shortcut</h3>
                    <form onSubmit={handleAddShortcut} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Title</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Spotify"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">URL</label>
                        <input
                          type="text"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="e.g. spotify.com"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddShortcutOpen(false)}
                          className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-cyan-500 text-black text-xs font-black hover:bg-cyan-400 transition"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: COMPLETE SOURCE CODE VIEWER */}
          {activeTab === 'code' && (
            <div className="w-full h-full flex flex-col p-5 bg-[#090b12]">
              {/* File Selectors Bar */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {(['all-in-one.html', 'manifest.json', 'index.html', 'styles.css', 'app.js'] as CodeFileType[]).map((file) => (
                    <button
                      key={file}
                      onClick={() => setActiveCodeFile(file)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap ${
                        activeCodeFile === file
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-black/50 text-slate-400 border border-white/10 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{file === 'all-in-one.html' ? '⚡ all-in-one.html (Single File)' : file}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied {activeCodeFile}!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy {activeCodeFile}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Display Area */}
              <div className="flex-1 bg-[#05070c] border border-zinc-800 rounded-2xl p-4 overflow-auto font-mono text-xs text-slate-200 shadow-inner">
                <pre className="whitespace-pre">
                  <code>{getCodeContent(activeCodeFile)}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: 3-STEP VISUAL SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="w-full h-full p-6 sm:p-8 bg-[#090b12] overflow-y-auto text-slate-200">
              <div className="max-w-3xl mx-auto space-y-6">
                
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Instant 3-Step Setup Guide</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-wide mb-2">
                    Add Live Wallpaper to Google Chrome
                  </h3>
                  <p className="text-sm text-slate-400">
                    Experience ultra-smooth 60 FPS live wallpapers with smart Google search and quick app shortcuts every time you open a new tab.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0c0e17] border border-cyan-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/60 transition-all">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-cyan-500 text-black font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                          1
                        </span>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          Step 1
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">
                        Click 'Add to Chrome'
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Click the high-visibility primary button to trigger instant installation for Google Chrome or any Chromium browser.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>One-click addition</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0c0e17] border border-sky-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-sky-400/60 transition-all">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-sky-400 text-black font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                          2
                        </span>
                        <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-500/30">
                          Step 2
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">
                        Confirm 'Keep Changes'
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        When Chrome asks to set your new tab page, click <strong>"Keep Changes"</strong> to keep your stunning live background active.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-sky-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Safe & Verified</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0c0e17] border border-indigo-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400/60 transition-all">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                          3
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                          Step 3
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">
                        Enjoy Your Live Wallpaper!
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Open a new tab (<kbd className="bg-black/60 px-1 py-0.5 rounded border border-white/20">Ctrl+T</kbd> / <kbd className="bg-black/60 px-1 py-0.5 rounded border border-white/20">Cmd+T</kbd>) to immerse in 60 FPS live backgrounds with fast search & shortcuts.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-purple-300">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>60 FPS Active</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Callout */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-indigo-950/70 border border-cyan-400/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-black flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
                      <Zap className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Ready to Transform Your New Tab?</h4>
                      <p className="text-xs text-slate-300">Click below to initiate 1-click addition to Chrome immediately.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={handleAddToChrome}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black shadow-[0_0_24px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                      <span>🚀</span>
                      <span>Add to Chrome (1-Click)</span>
                    </button>
                    
                    <button
                      id="ext-package-backup-btn"
                      onClick={handleDownloadPackage}
                      disabled={isDownloadingZip}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Generate and Download Extension ZIP Backup"
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ZIP Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <FolderArchive className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Package Backup (.ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
