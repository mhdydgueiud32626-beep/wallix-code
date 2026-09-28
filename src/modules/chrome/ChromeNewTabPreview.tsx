import React, { useState, useRef, useEffect } from 'react';
import { CirclePlusIcon } from '@animateicons/react/lucide';
import { 
  ChromeNewTabSettings, 
  ChromeShortcut,
  LayoutElementId,
  LAYOUT_ELEMENT_METAS,
  DEFAULT_LAYOUT_SETTINGS,
  getFaviconUrl,
  getDomainFromUrl
} from './types';
import { GlassSurface } from './GlassSurface';
import { WeatherWidget } from './WeatherWidget';
import { saveChromeSettings } from './extensionBridge';
import { 
  Search, 
  Sparkles, 
  Mic, 
  Camera, 
  User, 
  Plus, 
  Volume2, 
  VolumeX, 
  Pencil,
  X,
  Check,
  CloudSun,
  Trash2,
  Move,
  RotateCcw,
  GripHorizontal,
  Layers,
  Crosshair,
  Maximize2,
  Clock,
  History,
  ArrowUpLeft
} from 'lucide-react';

export type ChromePreviewVariant = 'full' | 'card' | 'environment-card';

interface ChromeNewTabPreviewProps {
  settings: ChromeNewTabSettings;
  shortcuts: ChromeShortcut[];
  variant?: ChromePreviewVariant;
  previewMode?: 'full' | 'card';
  isLayoutEditing?: boolean;
  onToggleLayoutEditing?: (editing: boolean) => void;
  selectedLayoutElement?: LayoutElementId | null;
  onSelectLayoutElement?: (element: LayoutElementId | null) => void;
  onUpdateLayoutOffset?: (element: LayoutElementId, offset: { x: number; y: number }) => void;
  onUpdateSettings?: (updater: (prev: ChromeNewTabSettings) => ChromeNewTabSettings) => void;
  onOpenShortcut?: (shortcut: ChromeShortcut) => void;
  onAddShortcutClick?: () => void;
  onQuickCustomizeClick?: () => void;
  onHoverSection?: (section: 'background' | 'search' | 'dock' | 'effects' | 'theme' | 'layout' | null) => void;
  onUpdateShortcuts?: (shortcuts: ChromeShortcut[]) => void;
}

const GOOGLE_APPS = [
  { name: 'Search', url: 'https://www.google.com', icon: '🔍', color: 'from-blue-500 to-indigo-600' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶', color: 'from-red-600 to-rose-700' },
  { name: 'Maps', url: 'https://maps.google.com', icon: '📍', color: 'from-emerald-500 to-teal-600' },
  { name: 'Drive', url: 'https://drive.google.com', icon: '📁', color: 'from-amber-500 to-yellow-600' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉', color: 'from-rose-500 to-red-600' },
  { name: 'Photos', url: 'https://photos.google.com', icon: '🖼', color: 'from-sky-500 to-blue-600' },
  { name: 'Docs', url: 'https://docs.google.com', icon: '📄', color: 'from-blue-500 to-indigo-600' },
  { name: 'Sheets', url: 'https://sheets.google.com', icon: '📊', color: 'from-emerald-600 to-green-700' },
  { name: 'Meet', url: 'https://meet.google.com', icon: '📹', color: 'from-teal-500 to-emerald-600' },
  { name: 'Calendar', url: 'https://calendar.google.com', icon: '📅', color: 'from-blue-600 to-sky-600' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: '✦', color: 'from-purple-500 to-indigo-600' },
  { name: 'Web Store', url: 'https://chromewebstore.google.com', icon: '🌐', color: 'from-cyan-500 to-blue-600' },
];

export const ChromeNewTabPreview: React.FC<ChromeNewTabPreviewProps> = ({
  settings,
  shortcuts,
  variant = 'full',
  previewMode,
  isLayoutEditing = false,
  onToggleLayoutEditing,
  selectedLayoutElement = null,
  onSelectLayoutElement,
  onUpdateLayoutOffset,
  onUpdateSettings,
  onOpenShortcut,
  onAddShortcutClick,
  onQuickCustomizeClick,
  onHoverSection,
  onUpdateShortcuts,
}) => {
  const isCardMode = variant === 'card' || variant === 'environment-card' || previewMode === 'card';
  const [searchInput, setSearchInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hoveredShortcutId, setHoveredShortcutId] = useState<string | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showAppsPopover, setShowAppsPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});

  // Real-time Visual Drag & Drop Layout Editor State
  const [activeDraggingElement, setActiveDraggingElement] = useState<LayoutElementId | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragInitialOffset, setDragInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [liveDragOffset, setLiveDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isSnappedX, setIsSnappedX] = useState(false);
  const [isSnappedY, setIsSnappedY] = useState(false);
  const [hoveredLayoutElement, setHoveredLayoutElement] = useState<LayoutElementId | null>(null);
  const [setConfirmations, setSetConfirmations] = useState<Record<LayoutElementId, boolean>>({
    search: false,
    dock: false,
    weather: false,
    topRight: false,
  });

  // Shortcut Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const appsPopoverRef = useRef<HTMLDivElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Recent Searches State & Persistence
  const RECENT_SEARCHES_STORAGE_KEY = 'wallix_recent_searches';
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 5);
        }
      }
    } catch {}
    return ['4K Cyberpunk wallpapers', 'Anime live themes', 'Minimal OLED dark'];
  });
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  // Save query to recent searches: max 5, newest at top, no empty, no duplicates
  const saveRecentSearchQuery = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSelectRecentSearch = (query: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchInput(query);
    setShowRecentSearches(false);
    setIsInputFocused(true);
  };

  const handleRemoveRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {}
  };

  // Close popovers and shortcut menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (appsPopoverRef.current && !appsPopoverRef.current.contains(target)) {
        setShowAppsPopover(false);
      }
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(target)) {
        setShowProfilePopover(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowRecentSearches(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAppsPopover(false);
        setShowProfilePopover(false);
        setIsModalOpen(false);
        setShowRecentSearches(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = searchInput.trim();
    if (!queryStr) return;
    saveRecentSearchQuery(queryStr);
    setShowRecentSearches(false);
    setIsInputFocused(false);

    const query = encodeURIComponent(queryStr);
    if (settings.search.isAiMode) {
      window.open(`https://www.google.com/search?q=${query}+%28ai%29`, '_blank');
    } else if (settings.search.engine === 'duckduckgo') {
      window.open(`https://duckduckgo.com/?q=${query}`, '_blank');
    } else if (settings.search.engine === 'bing') {
      window.open(`https://www.bing.com/search?q=${query}`, '_blank');
    } else {
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsVoiceListening(true);
        recognition.onend = () => setIsVoiceListening(false);
        recognition.onerror = () => setIsVoiceListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setSearchInput(transcript);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(transcript)}`, '_blank');
          }
          setIsVoiceListening(false);
        };
        recognition.start();
        return;
      } catch {
        setIsVoiceListening(false);
      }
    }
    // Fallback: Google Voice Search query
    window.open('https://www.google.com/search?q=&source=voice', '_blank');
  };

  // Google Lens Handler
  const handleLensSearch = () => {
    window.open('https://lens.google.com/', '_blank');
  };

  // AI Mode Pill Click Handler
  const handleAiModeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (searchInput.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchInput.trim())}+%28ai%29`, '_blank');
    } else {
      window.open('https://gemini.google.com', '_blank');
    }
  };

  // Context menu for deliberate shortcut management (Edit/Remove)
  const [contextMenuShortcut, setContextMenuShortcut] = useState<{
    shortcut: ChromeShortcut;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenuShortcut(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Open Add Shortcut Modal
  const openAddModal = () => {
    setModalMode('add');
    setModalTargetId(null);
    setModalName('');
    setModalUrl('');
    setModalError(null);
    setIsModalOpen(true);
    if (onAddShortcutClick) onAddShortcutClick();
  };

  // Open Edit Shortcut Modal
  const openEditModal = (sc: ChromeShortcut) => {
    setModalMode('edit');
    setModalTargetId(sc.id);
    setModalName(sc.title);
    setModalUrl(sc.url);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Remove Shortcut
  const handleRemoveShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = shortcuts.filter(s => s.id !== id);
    if (onUpdateShortcuts) {
      onUpdateShortcuts(updated);
    }
  };

  // Save Modal (Add or Edit)
  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = modalName.trim();
    let cleanUrl = modalUrl.trim();

    if (!cleanName) {
      setModalError('Please enter a name for the shortcut.');
      return;
    }
    if (!cleanUrl) {
      setModalError('Please enter a destination URL.');
      return;
    }

    // Security validation against script injection
    if (/^(javascript:|data:|file:|vbscript:)/i.test(cleanUrl)) {
      setModalError('Only valid http:// or https:// URLs are allowed.');
      return;
    }

    // Ensure valid protocol
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setModalError('Please enter a valid URL (e.g. github.com)');
      return;
    }

    if (modalMode === 'add') {
      const initials = cleanName.slice(0, 2).toUpperCase();
      const colorGradients = [
        { gradient: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.5)' },
        { gradient: 'from-cyan-400 to-blue-600', glow: 'rgba(6,182,212,0.5)' },
        { gradient: 'from-purple-500 to-pink-600', glow: 'rgba(168,85,247,0.5)' },
        { gradient: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.5)' },
        { gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.5)' },
      ];
      const picked = colorGradients[shortcuts.length % colorGradients.length];

      const newShortcut: ChromeShortcut = {
        id: `sc-${Date.now()}`,
        title: cleanName,
        url: cleanUrl,
        initials,
        gradient: picked.gradient,
        glowColor: picked.glow,
        isDefault: false
      };

      const updated = [...shortcuts, newShortcut];
      if (onUpdateShortcuts) {
        onUpdateShortcuts(updated);
      }
    } else if (modalMode === 'edit' && modalTargetId) {
      const updated = shortcuts.map(s => {
        if (s.id === modalTargetId) {
          return {
            ...s,
            title: cleanName,
            url: cleanUrl,
            initials: cleanName.slice(0, 2).toUpperCase(),
          };
        }
        return s;
      });
      if (onUpdateShortcuts) {
        onUpdateShortcuts(updated);
      }
    }

    setIsModalOpen(false);
  };

  // Search Size mapping
  const searchSizeClass = {
    compact: 'py-2 px-4 text-xs',
    standard: 'py-3 px-5 text-sm',
    spacious: 'py-3.5 px-6 text-base',
  }[settings.search.size];

  // Custom search width with safety constraints
  const computedSearchWidth = settings.search.customWidth || (
    settings.search.size === 'compact' ? 480 : settings.search.size === 'spacious' ? 680 : 580
  );

  // Custom search radius
  const computedSearchRadius = typeof settings.search.radius === 'number'
    ? (settings.search.style === 'pill' ? ('full' as const) : settings.search.radius)
    : {
        pill: 'full' as const,
        rounded: '2xl' as const,
        minimal: 'xl' as const,
      }[settings.search.style];

  // Shortcut Dimensions & Spacing
  const shortcutIconSize = isCardMode ? 28 : (settings.shortcuts.iconSize || 48);
  const shortcutInnerSize = Math.round(shortcutIconSize * 0.625);
  const shortcutFontSize = Math.max(9, Math.round(shortcutIconSize * 0.25));
  const shortcutLabelSize = isCardMode ? 9 : (settings.shortcuts.labelSize || 11.5);
  const shortcutLabelMaxWidth = isCardMode ? 44 : Math.max(68, Math.round(shortcutIconSize * 1.5));
  const shortcutSpacingPx = isCardMode
    ? 8
    : (settings.shortcuts.spacingPx !== undefined
        ? settings.shortcuts.spacingPx
        : settings.shortcuts.spacing === 'tight' ? 12 : settings.shortcuts.spacing === 'loose' ? 24 : 18);
  const shortcutHoverScale = settings.shortcuts.scaleOnHover ? (settings.shortcuts.hoverScale || 1.04) : 1;
  const shortcutBorderOpacity = settings.shortcuts.borderOpacity !== undefined ? settings.shortcuts.borderOpacity : 22;

  // Layout & Position offsets
  const layout = settings.layout || DEFAULT_LAYOUT_SETTINGS;

  // Track committed positions locally so dropped positions never flicker or revert
  const [lastCommittedPositions, setLastCommittedPositions] = useState<Partial<Record<LayoutElementId, { x: number; y: number }>>>({});

  // Synchronize lastCommittedPositions with canonical settings.layout
  useEffect(() => {
    if (settings.layout) {
      setLastCommittedPositions({
        search: settings.layout.search ? { x: settings.layout.search.x || 0, y: settings.layout.search.y || 0 } : { x: 0, y: 0 },
        dock: settings.layout.dock ? { x: settings.layout.dock.x || 0, y: settings.layout.dock.y || 0 } : { x: 0, y: 0 },
        weather: settings.layout.weather ? { x: settings.layout.weather.x || 0, y: settings.layout.weather.y || 0 } : { x: 0, y: 0 },
        topRight: settings.layout.topRight ? { x: settings.layout.topRight.x || 0, y: settings.layout.topRight.y || 0 } : { x: 0, y: 0 },
      });
    }
  }, [settings.layout]);

  const dragTrackingRef = useRef<{
    elementId: LayoutElementId;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    baseLeft: number;
    baseRight: number;
    baseTop: number;
    baseBottom: number;
    canvasRect: { left: number; right: number; top: number; bottom: number };
    currentX: number;
    currentY: number;
  } | null>(null);

  // Pointer drag & resize interaction handlers
  const [activeResizing, setActiveResizing] = useState<{
    elementId: LayoutElementId;
    startX: number;
    startY: number;
    startWidth?: number;
    startHeight?: number;
    startScale?: number;
  } | null>(null);

  const handleElementPointerDown = (elementId: LayoutElementId, e: React.PointerEvent) => {
    if (isCardMode || !isLayoutEditing) return;
    const target = e.target as HTMLElement;

    // Allow resize handles and HUD toolbar action buttons to handle their own interactions
    if (target.closest('.resize-handle') || target.closest('.layout-hud-toolbar')) {
      return;
    }

    // In layout editing mode, intercept all standard element interactions (inputs, links, buttons)
    // so clicking directly anywhere on the element selects and drags it immediately
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const currentEl = layout[elementId] || { x: 0, y: 0 };
    const initX = currentEl.x || 0;
    const initY = currentEl.y || 0;

    const canvasEl = canvasRef.current;
    const targetEl = e.currentTarget as HTMLElement;
    const canvasRect = canvasEl?.getBoundingClientRect();

    // Measure the actual visual element rectangle to ensure freeform 2D travel across the entire canvas
    let visualTarget = targetEl;
    if (elementId === 'search') {
      const surface = (targetEl.querySelector('.glass-surface') || searchContainerRef.current) as HTMLElement;
      if (surface) visualTarget = surface;
    } else if (elementId === 'dock') {
      const dockContent = (targetEl.querySelector('div[style*="gap"]') || targetEl.firstElementChild) as HTMLElement;
      if (dockContent) visualTarget = dockContent;
    }
    const elRect = visualTarget.getBoundingClientRect();

    // Calculate untransformed base bounds once at pointer down to prevent coordinate drift
    const baseLeft = elRect.left - initX;
    const baseRight = elRect.right - initX;
    const baseTop = elRect.top - initY;
    const baseBottom = elRect.bottom - initY;

    dragTrackingRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: initX,
      initialY: initY,
      baseLeft,
      baseRight,
      baseTop,
      baseBottom,
      canvasRect: canvasRect
        ? {
            left: canvasRect.left,
            right: canvasRect.right,
            top: canvasRect.top,
            bottom: canvasRect.bottom,
          }
        : {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
          },
      currentX: initX,
      currentY: initY,
    };

    setActiveDraggingElement(elementId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragInitialOffset({ x: initX, y: initY });
    setLiveDragOffset({ x: initX, y: initY });

    if (onSelectLayoutElement) {
      onSelectLayoutElement(elementId);
    }
  };

  const handleElementPointerMove = (elementId: LayoutElementId, e: React.PointerEvent) => {
    if (activeDraggingElement !== elementId || !dragTrackingRef.current) return;
    e.stopPropagation();

    const tracker = dragTrackingRef.current;
    const deltaX = e.clientX - tracker.startX;
    const deltaY = e.clientY - tracker.startY;

    let targetX = Math.round(tracker.initialX + deltaX);
    let targetY = Math.round(tracker.initialY + deltaY);

    // Hard canvas boundary enforcement: complete element must remain inside canvas container
    if (tracker.canvasRect) {
      const minX = Math.round(tracker.canvasRect.left - tracker.baseLeft);
      const maxX = Math.round(tracker.canvasRect.right - tracker.baseRight);
      const minY = Math.round(tracker.canvasRect.top - tracker.baseTop);
      const maxY = Math.round(tracker.canvasRect.bottom - tracker.baseBottom);

      if (minX <= maxX) {
        targetX = Math.max(minX, Math.min(maxX, targetX));
      }
      if (minY <= maxY) {
        targetY = Math.max(minY, Math.min(maxY, targetY));
      }
    }

    // Do NOT auto-snap. Allow clean, precise pixel-perfect freeform positioning
    tracker.currentX = targetX;
    tracker.currentY = targetY;

    setLiveDragOffset({ x: targetX, y: targetY });

    if (onUpdateLayoutOffset) {
      onUpdateLayoutOffset(elementId, { x: targetX, y: targetY });
    }
  };

  const handleElementPointerUp = (elementId: LayoutElementId, e: React.PointerEvent) => {
    if (activeDraggingElement === elementId || dragTrackingRef.current?.elementId === elementId) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      const tracker = dragTrackingRef.current;
      const finalX = tracker ? tracker.currentX : (liveDragOffset?.x ?? (layout[elementId]?.x || 0));
      const finalY = tracker ? tracker.currentY : (liveDragOffset?.y ?? (layout[elementId]?.y || 0));
      const didMove = tracker ? (Math.abs(tracker.currentX - tracker.initialX) > 1 || Math.abs(tracker.currentY - tracker.initialY) > 1) : false;

      dragTrackingRef.current = null;
      setActiveDraggingElement(null);
      setDragStartPos(null);
      setIsSnappedX(false);
      setIsSnappedY(false);

      // Lock local committed position immediately to eliminate any 1-frame visual jump
      setLastCommittedPositions((prev) => ({
        ...prev,
        [elementId]: { x: finalX, y: finalY },
      }));
      setLiveDragOffset({ x: finalX, y: finalY });

      // If an actual drag occurred: commit, display ✓ Set, and return to clean editing state
      if (didMove) {
        setSetConfirmations((prev) => ({ ...prev, [elementId]: true }));
        setTimeout(() => {
          setSetConfirmations((prev) => ({ ...prev, [elementId]: false }));
          // Cleanly remove temporary editing handles/outlines after confirmation
          onSelectLayoutElement?.(null);
        }, 800);
      } else {
        // Pure click: keep element selected for HUD toolbar, corner resize handles, or sidebar inspector
        if (onSelectLayoutElement) {
          onSelectLayoutElement(elementId);
        }
      }

      // Canonical commit to settings.layout and durable persistence
      if (onUpdateSettings) {
        onUpdateSettings((prev) => {
          const prevLayout = prev.layout || DEFAULT_LAYOUT_SETTINGS;
          const prevEl = prevLayout[elementId] || { x: 0, y: 0 };
          const updatedLayout = {
            ...prevLayout,
            preset: 'custom' as const,
            [elementId]: {
              ...prevEl,
              x: finalX,
              y: finalY,
            },
          };
          const next = {
            ...prev,
            layout: updatedLayout,
          };
          saveChromeSettings(next, shortcuts);
          return next;
        });
      }

      if (onUpdateLayoutOffset) {
        onUpdateLayoutOffset(elementId, { x: finalX, y: finalY });
      }
    }
  };

  // Direct corner resize handling
  const handleResizePointerDown = (
    elementId: LayoutElementId,
    e: React.PointerEvent,
    startWidth?: number,
    startHeight?: number,
    startScale: number = 1
  ) => {
    if (isCardMode || !isLayoutEditing) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    setActiveResizing({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth,
      startHeight,
      startScale,
    });

    if (onSelectLayoutElement) {
      onSelectLayoutElement(elementId);
    }
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!activeResizing) return;
    e.stopPropagation();

    const deltaX = e.clientX - activeResizing.startX;
    const deltaY = e.clientY - activeResizing.startY;
    const elId = activeResizing.elementId;
    const currentEl = layout[elId] || { x: 0, y: 0 };

    if (elId === 'search') {
      const baseW = activeResizing.startWidth || 580;
      const newWidth = Math.max(220, Math.round(baseW + deltaX * 2));
      onUpdateSettings?.((prev) => ({
        ...prev,
        search: {
          ...prev.search,
          customWidth: newWidth,
        },
        layout: {
          ...(prev.layout || DEFAULT_LAYOUT_SETTINGS),
          search: {
            ...currentEl,
            width: newWidth,
          },
        },
      }));
    } else {
      const scaleDelta = (deltaX + deltaY) / 220;
      const baseScale = activeResizing.startScale || 1;
      const newScale = Math.max(0.5, Math.min(2.5, Number((baseScale + scaleDelta).toFixed(2))));
      onUpdateSettings?.((prev) => ({
        ...prev,
        layout: {
          ...(prev.layout || DEFAULT_LAYOUT_SETTINGS),
          [elId]: {
            ...currentEl,
            scale: newScale,
          },
        },
      }));
    }
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (activeResizing) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setActiveResizing(null);
      if (onUpdateSettings) {
        onUpdateSettings((prev) => {
          saveChromeSettings(prev, shortcuts);
          return prev;
        });
      }
    }
  };

  const handleCenterElement = (elementId: LayoutElementId) => {
    setLastCommittedPositions((prev) => ({
      ...prev,
      [elementId]: { x: 0, y: 0 },
    }));
    onUpdateSettings?.((prev) => {
      const prevLayout = prev.layout || DEFAULT_LAYOUT_SETTINGS;
      const next = {
        ...prev,
        layout: {
          ...prevLayout,
          preset: 'custom' as const,
          [elementId]: {
            ...(prevLayout[elementId] || { x: 0, y: 0 }),
            x: 0,
            y: 0,
          },
        },
      };
      saveChromeSettings(next, shortcuts);
      return next;
    });
  };

  const handleBringForward = (elementId: LayoutElementId) => {
    onUpdateSettings?.((prev) => {
      const prevLayout = prev.layout || DEFAULT_LAYOUT_SETTINGS;
      const currentZ = prevLayout[elementId]?.zIndex || 10;
      const next = {
        ...prev,
        layout: {
          ...prevLayout,
          preset: 'custom' as const,
          [elementId]: {
            ...(prevLayout[elementId] || { x: 0, y: 0 }),
            zIndex: Math.min(currentZ + 10, 100),
          },
        },
      };
      saveChromeSettings(next, shortcuts);
      return next;
    });
  };

  const handleSendBack = (elementId: LayoutElementId) => {
    onUpdateSettings?.((prev) => {
      const prevLayout = prev.layout || DEFAULT_LAYOUT_SETTINGS;
      const currentZ = prevLayout[elementId]?.zIndex || 10;
      const next = {
        ...prev,
        layout: {
          ...prevLayout,
          preset: 'custom' as const,
          [elementId]: {
            ...(prevLayout[elementId] || { x: 0, y: 0 }),
            zIndex: Math.max(currentZ - 10, 1),
          },
        },
      };
      saveChromeSettings(next, shortcuts);
      return next;
    });
  };

  const handleResetElement = (elementId: LayoutElementId) => {
    setLastCommittedPositions((prev) => ({
      ...prev,
      [elementId]: { x: 0, y: 0 },
    }));
    if (onUpdateLayoutOffset) {
      onUpdateLayoutOffset(elementId, { x: 0, y: 0 });
    }
    if (onUpdateSettings) {
      onUpdateSettings((prev) => {
        const next = {
          ...prev,
          layout: {
            ...(prev.layout || DEFAULT_LAYOUT_SETTINGS),
            preset: 'custom' as const,
            [elementId]: { x: 0, y: 0, scale: 1, zIndex: 10 },
          },
        };
        saveChromeSettings(next, shortcuts);
        return next;
      });
    }
  };

  const layoutScale = isCardMode ? 0.35 : 1;

  // Active or stored coordinates & scales with zero-latency local fallback
  const getElementCoord = (elId: LayoutElementId) => {
    if (activeDraggingElement === elId && liveDragOffset) {
      return liveDragOffset;
    }
    if (lastCommittedPositions[elId]) {
      return lastCommittedPositions[elId]!;
    }
    return layout[elId] || { x: 0, y: 0 };
  };

  const searchRaw = getElementCoord('search');
  const dockRaw = getElementCoord('dock');
  const weatherRaw = getElementCoord('weather');
  const topRightRaw = getElementCoord('topRight');

  const searchOffsetX = Math.round(searchRaw.x * layoutScale);
  const searchOffsetY = Math.round(searchRaw.y * layoutScale);
  const dockOffsetX = Math.round(dockRaw.x * layoutScale);
  const dockOffsetY = Math.round(dockRaw.y * layoutScale);
  const weatherOffsetX = Math.round(weatherRaw.x * layoutScale);
  const weatherOffsetY = Math.round(weatherRaw.y * layoutScale);
  const topRightOffsetX = Math.round(topRightRaw.x * layoutScale);
  const topRightOffsetY = Math.round(topRightRaw.y * layoutScale);

  const searchScale = isCardMode ? 1 : (layout.search?.scale || 1);
  const dockScale = isCardMode ? 1 : (layout.dock?.scale || 1);
  const weatherScale = isCardMode ? 1 : (layout.weather?.scale || 1);
  const topRightScale = isCardMode ? 1 : (layout.topRight?.scale || 1);

  const searchZIndex = selectedLayoutElement === 'search' ? 45 : (layout.search?.zIndex || 10);
  const dockZIndex = selectedLayoutElement === 'dock' ? 45 : (layout.dock?.zIndex || 10);
  const weatherZIndex = selectedLayoutElement === 'weather' ? 45 : (layout.weather?.zIndex || 10);
  const topRightZIndex = selectedLayoutElement === 'topRight' ? 45 : (layout.topRight?.zIndex || 10);

  // Theme Accent visual tokens
  const themeAccentTokens = {
    cyan: {
      accent: 'cyan' as const,
      glow: 'rgba(6, 182, 212, 0.45)',
      ring: 'ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
      badge: 'bg-cyan-500/25 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
      iconColor: 'text-cyan-400',
      borderActive: 'border-cyan-400/60',
    },
    purple: {
      accent: 'purple' as const,
      glow: 'rgba(192, 132, 252, 0.45)',
      ring: 'ring-2 ring-purple-400/50 shadow-[0_0_25px_rgba(192,132,252,0.35)]',
      badge: 'bg-purple-500/25 border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.3)]',
      iconColor: 'text-purple-400',
      borderActive: 'border-purple-400/60',
    },
    blue: {
      accent: 'blue' as const,
      glow: 'rgba(96, 165, 250, 0.45)',
      ring: 'ring-2 ring-blue-400/50 shadow-[0_0_25px_rgba(96,165,250,0.35)]',
      badge: 'bg-blue-500/25 border-blue-400/40 text-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.3)]',
      iconColor: 'text-blue-400',
      borderActive: 'border-blue-400/60',
    },
    emerald: {
      accent: 'emerald' as const,
      glow: 'rgba(52, 211, 153, 0.45)',
      ring: 'ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(52,211,153,0.35)]',
      badge: 'bg-emerald-500/25 border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]',
      iconColor: 'text-emerald-400',
      borderActive: 'border-emerald-400/60',
    },
    amber: {
      accent: 'amber' as const,
      glow: 'rgba(251, 191, 36, 0.45)',
      ring: 'ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
      badge: 'bg-amber-500/25 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]',
      iconColor: 'text-amber-400',
      borderActive: 'border-amber-400/60',
    },
    rose: {
      accent: 'rose' as const,
      glow: 'rgba(244, 63, 94, 0.45)',
      ring: 'ring-2 ring-rose-400/50 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
      badge: 'bg-rose-500/25 border-rose-400/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      iconColor: 'text-rose-400',
      borderActive: 'border-rose-400/60',
    },
  }[settings.effects.themeAccent] || {
    accent: 'purple' as const,
    glow: 'rgba(192, 132, 252, 0.45)',
    ring: 'ring-2 ring-purple-400/50 shadow-[0_0_25px_rgba(192,132,252,0.35)]',
    badge: 'bg-purple-500/25 border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.3)]',
    iconColor: 'text-purple-400',
    borderActive: 'border-purple-400/60',
  };

  const wallpaperFitClass = {
    cover: 'object-cover',
    fill: 'object-fill',
    center: 'object-contain',
  }[settings.wallpaper.fit || 'cover'];

  return (
    <div 
      ref={canvasRef}
      onMouseEnter={() => !isCardMode && onHoverSection?.('background')}
      onMouseLeave={() => !isCardMode && onHoverSection?.(null)}
      onPointerDown={(e) => {
        // If clicking empty background canvas or outside layout elements in edit mode, deselect layout element
        if (!isCardMode && isLayoutEditing) {
          const target = e.target as HTMLElement;
          if (
            !target.closest('[data-layout-element]') &&
            !target.closest('.resize-handle') &&
            !target.closest('.layout-hud-toolbar')
          ) {
            onSelectLayoutElement?.(null);
          }
        }
      }}
      onPointerMove={(e) => {
        if (activeResizing) handleResizePointerMove(e);
      }}
      onPointerUp={(e) => {
        if (activeResizing) handleResizePointerUp(e);
      }}
      className={`relative w-full h-full overflow-hidden flex flex-col select-none ${
        isCardMode 
          ? 'rounded-none bg-black' 
          : 'min-h-[500px] lg:min-h-[620px] rounded-2xl border border-white/15 shadow-2xl group/canvas bg-black'
      }`}
    >
      {/* ========================================================================= */}
      {/* LAYER 1: SEPARATE DYNAMIC WALLPAPER LAYER */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {settings.wallpaper.type === 'video' && settings.wallpaper.videoUrl ? (
          <video
            ref={videoRef}
            src={settings.wallpaper.videoUrl}
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            onError={(e) => {
              // Fallback to image if video fails to load
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallbackImg = document.getElementById('preview-wp-fallback-img');
              if (fallbackImg) fallbackImg.style.display = 'block';
            }}
            className={`w-full h-full ${wallpaperFitClass} object-center transition-transform duration-700 group-hover/canvas:scale-[1.01]`}
          />
        ) : null}
        <img
          id="preview-wp-fallback-img"
          src={settings.wallpaper.url}
          alt={settings.wallpaper.title || 'WALLIX Wallpaper'}
          style={{ display: settings.wallpaper.type === 'video' && settings.wallpaper.videoUrl ? 'none' : 'block' }}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.errored) {
              target.dataset.errored = '1';
              target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';
            }
          }}
          className={`w-full h-full ${wallpaperFitClass} object-center transition-transform duration-700 group-hover/canvas:scale-[1.01]`}
        />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: VIGNETTE & READABILITY OVERLAY */}
      {/* ========================================================================= */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none transition-all duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${settings.effects.backdropDim / 100})`,
          boxShadow: `inset 0 0 ${settings.effects.vignette * 1.8}px rgba(0, 0, 0, ${settings.effects.vignette / 100})`,
        }}
      />

      {/* ========================================================================= */}
      {/* LAYER 3: CHROME BROWSER TOP TAB STRIP (SIMULATED CHROME BROWSER) */}
      {/* ========================================================================= */}
      {!isCardMode && (
        <div className="relative z-20 flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md border-b border-white/10 text-xs text-slate-300">
          {/* Left: Window Controls & Active New Tab */}
          <div className="flex items-center gap-3">
            {/* Mac-style traffic lights */}
            <div className="flex items-center gap-1.5 pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-400/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
            </div>

            {/* Active Tab */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-t-lg bg-white/[0.08] backdrop-blur-md border-t border-x border-white/15 text-[11px] font-medium text-slate-200">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <span>New Tab</span>
            </div>

            {/* New Tab Plus Button */}
            <button className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-default">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Clean tab strip spacing */}
          <div className="flex items-center gap-2" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYER 3.2: EDIT LAYOUT ACTIVE BANNER (ONLY IN EDIT MODE) */}
      {/* ========================================================================= */}
      {isLayoutEditing && !isCardMode && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-xl border border-cyan-400/60 shadow-xl text-xs select-none pointer-events-auto animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold font-mono text-[11px] text-cyan-300">Editing Layout</span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300 text-[11px]">
            {selectedLayoutElement ? (
              <span className="text-white font-medium">
                {selectedLayoutElement === 'search'
                  ? 'Search Bar'
                  : selectedLayoutElement === 'dock'
                  ? 'Shortcut Dock'
                  : selectedLayoutElement === 'weather'
                  ? 'Weather Widget'
                  : 'Top Right Controls'}
              </span>
            ) : (
              <span className="text-slate-400 italic">Click an element to select & drag</span>
            )}
          </span>
          <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
          <button
            type="button"
            id="btn-preview-done-layout-editing"
            onClick={() => {
              onSelectLayoutElement?.(null);
              onToggleLayoutEditing?.(false);
            }}
            className="px-2 py-0.5 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 hover:text-emerald-100 border border-emerald-400/50 text-[10.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYER 3.5: MAGNETIC ALIGNMENT CROSSHAIR GUIDES (DURING DRAG) */}
      {/* ========================================================================= */}
      {!isCardMode && activeDraggingElement && (
        <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
          {/* Vertical Center Snap Line */}
          {isSnappedX && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex flex-col justify-between items-center py-2 animate-pulse">
              <span className="px-1 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[9px] font-mono text-cyan-300">Center X</span>
              <span className="px-1 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[9px] font-mono text-cyan-300">0px</span>
            </div>
          )}
          {/* Horizontal Center Snap Line */}
          {isSnappedY && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex justify-between items-center px-2 animate-pulse">
              <span className="px-1 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[9px] font-mono text-cyan-300">Center Y</span>
              <span className="px-1 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[9px] font-mono text-cyan-300">0px</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYER 4: CHROME NEW TAB UI BODY (SEARCH, GOOGLE HEADER, SHORTCUT DOCK) */}
      {/* ========================================================================= */}
      <div className={`relative z-10 flex-1 flex flex-col justify-between ${
        isCardMode ? 'p-2.5 sm:p-3.5' : 'p-4 sm:p-7'
      }`}>
        
        {/* ======================================================================= */}
        {/* TOP BAR: WEATHER WIDGET (LEFT) & GOOGLE SERVICES (RIGHT) */}
        {/* ======================================================================= */}
        <div className="flex items-start justify-between text-xs text-slate-200 font-medium relative w-full pointer-events-none">
          {/* Top Left: Weather Widget (Draggable & Resizable) */}
          <div
            data-layout-element="weather"
            onPointerDown={(e) => handleElementPointerDown('weather', e)}
            onPointerMove={(e) => handleElementPointerMove('weather', e)}
            onPointerUp={(e) => handleElementPointerUp('weather', e)}
            onPointerCancel={(e) => handleElementPointerUp('weather', e)}
            onMouseEnter={() => !isCardMode && setHoveredLayoutElement('weather')}
            onMouseLeave={() => !isCardMode && setHoveredLayoutElement(null)}
            style={{
              transform: `translate(${weatherOffsetX}px, ${weatherOffsetY}px) scale(${weatherScale})`,
              transformOrigin: 'top left',
              zIndex: weatherZIndex,
              transition: activeDraggingElement === 'weather' || activeResizing?.elementId === 'weather' ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
            }}
            className={`relative flex-shrink-0 group/weather pointer-events-auto ${
              isLayoutEditing && !isCardMode 
                ? (selectedLayoutElement === 'weather' 
                    ? (activeDraggingElement === 'weather' ? 'cursor-grabbing select-none' : 'cursor-grab select-none') 
                    : 'cursor-grab hover:cursor-grab select-none') 
                : ''
            } ${
              isLayoutEditing && !isCardMode && (selectedLayoutElement === 'weather' || activeDraggingElement === 'weather')
                ? 'border border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.3)] rounded-2xl'
                : isLayoutEditing && !isCardMode && hoveredLayoutElement === 'weather'
                ? 'border border-cyan-400/40 ring-1 ring-cyan-400/20 rounded-2xl'
                : ''
            }`}
          >
            {/* Set Confirmation Badge */}
            {isLayoutEditing && setConfirmations.weather && !isCardMode && (
              <div className="absolute top-full mt-2 left-0 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-400/80 text-[10.5px] font-mono text-emerald-300 shadow-xl pointer-events-none animate-fadeIn">
                <span>✓ Set</span>
              </div>
            )}

            {/* Contextual HUD toolbar for Weather - only when editing and selected */}
            {isLayoutEditing && !isCardMode && (selectedLayoutElement === 'weather' || activeDraggingElement === 'weather') && (
              <div 
                className="layout-hud-toolbar absolute top-full mt-2 left-0 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-400/70 text-[10.5px] font-mono text-cyan-300 shadow-2xl pointer-events-auto backdrop-blur-xl whitespace-nowrap animate-fadeIn"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Move className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-white">Weather</span>
                <span className="text-cyan-400/80">({weatherOffsetX >= 0 ? `+${weatherOffsetX}` : weatherOffsetX}, {weatherOffsetY >= 0 ? `+${weatherOffsetY}` : weatherOffsetY})</span>
                {weatherScale !== 1 && <span className="text-cyan-300/80 text-[9.5px]">×{weatherScale}</span>}
                <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCenterElement('weather');
                  }}
                  title="Snap to Center (0, 0)"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Center</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBringForward('weather');
                  }}
                  title="Bring Forward in Layer Stack"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Z:{weatherZIndex}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetElement('weather');
                  }}
                  title="Reset Position, Scale & Layer"
                  className="hover:text-white text-cyan-400/90 hover:bg-rose-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayoutElement?.(null);
                  }}
                  title="Deselect Element"
                  className="hover:text-white text-slate-400 hover:bg-white/10 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {/* Corner Resize Handles when Selected */}
            {isLayoutEditing && selectedLayoutElement === 'weather' && !isCardMode && (
              <>
                <div
                  onPointerDown={(e) => handleResizePointerDown('weather', e, undefined, undefined, weatherScale)}
                  title="Drag corner to scale weather widget"
                  className="resize-handle absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('weather', e, undefined, undefined, weatherScale)}
                  title="Drag corner to scale weather widget"
                  className="resize-handle absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('weather', e, undefined, undefined, weatherScale)}
                  title="Drag corner to scale weather widget"
                  className="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('weather', e, undefined, undefined, weatherScale)}
                  title="Drag corner to scale weather widget"
                  className="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
              </>
            )}

            <WeatherWidget 
              variant={isCardMode ? 'card' : 'full'}
              accent={settings.effects.themeAccent}
              opacity={settings.search.opacity}
              blur={settings.search.blur}
              borderOpacity={settings.search.borderOpacity}
            />
          </div>

          {/* Top Right: Google Services (Draggable & Resizable) */}
          <div 
            data-layout-element="topRight"
            onPointerDown={(e) => handleElementPointerDown('topRight', e)}
            onPointerMove={(e) => handleElementPointerMove('topRight', e)}
            onPointerUp={(e) => handleElementPointerUp('topRight', e)}
            onPointerCancel={(e) => handleElementPointerUp('topRight', e)}
            onMouseEnter={() => !isCardMode && setHoveredLayoutElement('topRight')}
            onMouseLeave={() => !isCardMode && setHoveredLayoutElement(null)}
            style={{
              transform: `translate(${topRightOffsetX}px, ${topRightOffsetY}px) scale(${topRightScale})`,
              transformOrigin: 'top right',
              zIndex: topRightZIndex,
              transition: activeDraggingElement === 'topRight' || activeResizing?.elementId === 'topRight' ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
            }}
            className={`relative flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group/topRight p-1 rounded-2xl pointer-events-auto ${
              isLayoutEditing && !isCardMode 
                ? (selectedLayoutElement === 'topRight' 
                    ? (activeDraggingElement === 'topRight' ? 'cursor-grabbing select-none' : 'cursor-grab select-none') 
                    : 'cursor-grab hover:cursor-grab select-none') 
                : ''
            } ${
              isLayoutEditing && !isCardMode && (selectedLayoutElement === 'topRight' || activeDraggingElement === 'topRight')
                ? 'border border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                : isLayoutEditing && !isCardMode && hoveredLayoutElement === 'topRight'
                ? 'border border-cyan-400/40 ring-1 ring-cyan-400/20'
                : ''
            }`}
          >
            {/* Draggable HUD badge & Layer/Center Toolbar for Top Right */}
            {/* Set Confirmation Badge */}
            {isLayoutEditing && setConfirmations.topRight && !isCardMode && (
              <div className="absolute top-full mt-2 right-0 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-400/80 text-[10.5px] font-mono text-emerald-300 shadow-xl pointer-events-none animate-fadeIn">
                <span>✓ Set</span>
              </div>
            )}

            {isLayoutEditing && !isCardMode && (selectedLayoutElement === 'topRight' || activeDraggingElement === 'topRight') && (
              <div 
                className="layout-hud-toolbar absolute top-full mt-2 right-0 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-400/70 text-[10.5px] font-mono text-cyan-300 shadow-2xl pointer-events-auto backdrop-blur-xl whitespace-nowrap animate-fadeIn"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Move className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-white">Controls</span>
                <span className="text-cyan-400/80">({topRightOffsetX >= 0 ? `+${topRightOffsetX}` : topRightOffsetX}, {topRightOffsetY >= 0 ? `+${topRightOffsetY}` : topRightOffsetY})</span>
                {topRightScale !== 1 && <span className="text-cyan-300/80 text-[9.5px]">×{topRightScale}</span>}
                <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCenterElement('topRight');
                  }}
                  title="Snap to Center (0, 0)"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Center</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBringForward('topRight');
                  }}
                  title="Bring Forward in Layer Stack"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Z:{topRightZIndex}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetElement('topRight');
                  }}
                  title="Reset Position, Scale & Layer"
                  className="hover:text-white text-cyan-400/90 hover:bg-rose-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayoutElement?.(null);
                  }}
                  title="Deselect Element"
                  className="hover:text-white text-slate-400 hover:bg-white/10 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {/* Corner Resize Handles when Selected */}
            {isLayoutEditing && selectedLayoutElement === 'topRight' && !isCardMode && (
              <>
                <div
                  onPointerDown={(e) => handleResizePointerDown('topRight', e, undefined, undefined, topRightScale)}
                  title="Drag corner to scale controls"
                  className="resize-handle absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('topRight', e, undefined, undefined, topRightScale)}
                  title="Drag corner to scale controls"
                  className="resize-handle absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('topRight', e, undefined, undefined, topRightScale)}
                  title="Drag corner to scale controls"
                  className="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handleResizePointerDown('topRight', e, undefined, undefined, topRightScale)}
                  title="Drag corner to scale controls"
                  className="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                />
              </>
            )}

            <a
              href={isCardMode || isLayoutEditing ? undefined : 'https://mail.google.com'}
              target={isCardMode || isLayoutEditing ? undefined : '_blank'}
              rel="noreferrer"
              onClick={(e) => {
                if (isLayoutEditing) {
                  e.preventDefault();
                }
              }}
              className={`${
                isCardMode
                  ? 'px-2 py-0.5 text-[10px]'
                  : 'px-3.5 py-1.5 text-[12.5px] min-h-[34px] inline-flex items-center justify-center'
              } rounded-full bg-white/[0.09] hover:bg-white/[0.18] backdrop-blur-md border border-white/20 text-slate-200 hover:text-white font-medium transition-all duration-150 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 cursor-pointer select-none`}
            >
              Gmail
            </a>
            <a
              href={isCardMode || isLayoutEditing ? undefined : 'https://www.google.com/imghp'}
              target={isCardMode || isLayoutEditing ? undefined : '_blank'}
              rel="noreferrer"
              onClick={(e) => {
                if (isLayoutEditing) {
                  e.preventDefault();
                }
              }}
              className={`${
                isCardMode
                  ? 'px-2 py-0.5 text-[10px]'
                  : 'px-3.5 py-1.5 text-[12.5px] min-h-[34px] inline-flex items-center justify-center'
              } rounded-full bg-white/[0.09] hover:bg-white/[0.18] backdrop-blur-md border border-white/20 text-slate-200 hover:text-white font-medium transition-all duration-150 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 cursor-pointer select-none`}
            >
              Images
            </a>

            {/* 3x3 Google Apps Grid Launcher (9-Dots Icon) */}
            <div className="relative" ref={appsPopoverRef}>
              <button
                type="button"
                onClick={() => {
                  if (isCardMode || isLayoutEditing) return;
                  setShowAppsPopover(!showAppsPopover);
                  setShowProfilePopover(false);
                }}
                aria-label="Google Apps"
                className={`${
                  isCardMode ? 'w-6 h-6' : 'w-8.5 h-8.5 min-w-[34px] min-h-[34px]'
                } rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center backdrop-blur-md border ${
                  showAppsPopover && !isCardMode
                    ? 'bg-white/25 text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-1 ring-white/30'
                    : 'bg-white/[0.09] hover:bg-white/[0.18] border-white/20 text-slate-200 hover:text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:-translate-y-0.5'
                }`}
              >
                {/* Authentic 9-dot 3x3 Grid SVG */}
                <svg className={`${isCardMode ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'}`} viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="5" r="2.2" />
                  <circle cx="12" cy="5" r="2.2" />
                  <circle cx="19" cy="5" r="2.2" />
                  <circle cx="5" cy="12" r="2.2" />
                  <circle cx="12" cy="12" r="2.2" />
                  <circle cx="19" cy="12" r="2.2" />
                  <circle cx="5" cy="19" r="2.2" />
                  <circle cx="12" cy="19" r="2.2" />
                  <circle cx="19" cy="19" r="2.2" />
                </svg>
              </button>

              {/* Google Apps Frosted Glass Popover (Full mode only) */}
              {!isCardMode && showAppsPopover && (
                <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-xs font-semibold text-white">Google Apps</span>
                    <span className="text-[10px] text-cyan-300 font-mono">Quick Access</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {GOOGLE_APPS.map((app) => (
                      <a
                        key={app.name}
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/15 transition-all duration-150 group text-center cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform`}>
                          {app.icon}
                        </div>
                        <span className="text-[11px] text-slate-200 group-hover:text-white font-medium truncate max-w-[64px]">
                          {app.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="relative" ref={profilePopoverRef}>
              <button
                type="button"
                onClick={() => {
                  if (isCardMode || isLayoutEditing) return;
                  setShowProfilePopover(!showProfilePopover);
                  setShowAppsPopover(false);
                }}
                aria-label="Google Account"
                className={`${
                  isCardMode ? 'w-6 h-6' : 'w-8.5 h-8.5 min-w-[34px] min-h-[34px]'
                } rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center backdrop-blur-md border text-xs font-bold ${
                  showProfilePopover && !isCardMode
                    ? 'bg-purple-500/40 text-purple-200 border-purple-400 ring-2 ring-purple-400/40 shadow-lg'
                    : 'bg-white/[0.09] hover:bg-white/[0.18] border-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:-translate-y-0.5'
                }`}
              >
                <User className={`${isCardMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-300`} />
              </button>

              {/* Profile Popover (Full mode only) */}
              {!isCardMode && showProfilePopover && (
                <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      G
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">Google Account</p>
                      <p className="text-[11px] text-slate-400 truncate">Default Chrome Profile</p>
                    </div>
                  </div>
                  <a
                    href="https://myaccount.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium text-center transition border border-white/15 cursor-pointer"
                  >
                    Manage your Google Account
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CENTER AREA: GOOGLE BRAND + TRANSLUCENT GLASS SEARCH BAR + SHORTCUT DOCK */}
        {/* ======================================================================= */}
        <div className={`w-full mx-auto flex flex-col items-center transition-all duration-300 ${
          isCardMode
            ? 'my-auto space-y-2 sm:space-y-2.5 max-w-full px-1'
            : settings.search.position === 'top'
              ? 'my-3 space-y-3.5 sm:space-y-4 max-w-3xl'
              : 'my-auto space-y-3.5 sm:space-y-4 max-w-3xl'
        }`}>
          
          {/* GOOGLE BRAND LOGO */}
          {settings.search.showLogo && (
            <div className={`flex flex-col items-center gap-1 ${isCardMode ? 'mb-0 scale-75' : 'mb-1'}`}>
              <div className={`flex items-center gap-0.5 ${
                isCardMode ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'
              } font-semibold tracking-tight select-none font-['Product_Sans',sans-serif]`}>
                <span className="text-[#4285F4] drop-shadow-[0_2px_12px_rgba(66,133,244,0.5)]">G</span>
                <span className="text-[#EA4335] drop-shadow-[0_2px_12px_rgba(234,67,53,0.5)]">o</span>
                <span className="text-[#FBBC05] drop-shadow-[0_2px_12px_rgba(251,188,5,0.5)]">o</span>
                <span className="text-[#4285F4] drop-shadow-[0_2px_12px_rgba(66,133,244,0.5)]">g</span>
                <span className="text-[#34A853] drop-shadow-[0_2px_12px_rgba(52,168,83,0.5)]">l</span>
                <span className="text-[#EA4335] drop-shadow-[0_2px_12px_rgba(234,67,53,0.5)]">e</span>
              </div>
              {!isCardMode && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300/80 drop-shadow-sm">
                  Enhanced by WALLIX
                </span>
              )}
            </div>
          )}

          {/* TRANSLUCENT FROSTED GLASS SEARCH BAR (Draggable & Resizable) */}
          <form
            data-layout-element="search"
            onSubmit={(e) => {
              if (isLayoutEditing) {
                e.preventDefault();
                return;
              }
              handleSearch(e);
            }}
            onPointerDown={(e) => handleElementPointerDown('search', e)}
            onPointerMove={(e) => handleElementPointerMove('search', e)}
            onPointerUp={(e) => handleElementPointerUp('search', e)}
            onPointerCancel={(e) => handleElementPointerUp('search', e)}
            onMouseEnter={(e) => {
              if (isCardMode) return;
              e.stopPropagation();
              setHoveredLayoutElement('search');
              onHoverSection?.('search');
            }}
            onMouseLeave={() => {
              if (!isCardMode) {
                setHoveredLayoutElement(null);
                onHoverSection?.('background');
              }
            }}
            style={{
              transform: `translate(${searchOffsetX}px, ${searchOffsetY}px) scale(${searchScale})`,
              transformOrigin: 'center center',
              zIndex: searchZIndex,
              transition: activeDraggingElement === 'search' || activeResizing?.elementId === 'search' ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
              width: isCardMode ? '100%' : `${computedSearchWidth}px`,
              maxWidth: '100%',
            }}
            className={`w-fit max-w-full mx-auto flex justify-center relative group/search pointer-events-auto ${
              isLayoutEditing && !isCardMode 
                ? (selectedLayoutElement === 'search' 
                    ? (activeDraggingElement === 'search' ? 'cursor-grabbing select-none' : 'cursor-grab select-none') 
                    : 'cursor-grab hover:cursor-grab select-none') 
                : ''
            }`}
          >
            {/* Set Confirmation Badge */}
            {isLayoutEditing && setConfirmations.search && !isCardMode && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-400/80 text-[10.5px] font-mono text-emerald-300 shadow-xl pointer-events-none animate-fadeIn">
                <span>✓ Set</span>
              </div>
            )}

            {/* Contextual HUD toolbar for Search - only when editing and selected */}
            {isLayoutEditing && !isCardMode && (selectedLayoutElement === 'search' || activeDraggingElement === 'search') && (
              <div 
                className={`layout-hud-toolbar absolute ${
                  searchOffsetY < -70 ? 'top-full mt-2' : '-top-8'
                } left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-400/70 text-[10.5px] font-mono text-cyan-300 shadow-2xl pointer-events-auto backdrop-blur-xl whitespace-nowrap animate-fadeIn`}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Move className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-white">Search Bar</span>
                <span className="text-cyan-400/80">({searchOffsetX >= 0 ? `+${searchOffsetX}` : searchOffsetX}, {searchOffsetY >= 0 ? `+${searchOffsetY}` : searchOffsetY})</span>
                <span className="text-cyan-300/80 text-[9.5px]">W:{computedSearchWidth}px</span>
                {searchScale !== 1 && <span className="text-cyan-300/80 text-[9.5px]">×{searchScale}</span>}
                <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCenterElement('search');
                  }}
                  title="Snap to Center (0, 0)"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Center</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBringForward('search');
                  }}
                  title="Bring Forward in Layer Stack"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Z:{searchZIndex}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetElement('search');
                  }}
                  title="Reset Position, Scale & Layer"
                  className="hover:text-white text-cyan-400/90 hover:bg-rose-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayoutElement?.(null);
                  }}
                  title="Deselect Element"
                  className="hover:text-white text-slate-400 hover:bg-white/10 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            <div ref={searchContainerRef} className="relative flex items-center justify-center w-full">
              <GlassSurface
                radius={computedSearchRadius}
                opacity={settings.search.opacity}
                blur={settings.search.blur}
                borderOpacity={isInputFocused ? Math.min(settings.search.borderOpacity + 25, 85) : settings.search.borderOpacity}
                shadow={settings.search.glow ? 'glow' : 'medium'}
                glowColor={themeAccentTokens.glow}
                accent={isInputFocused ? themeAccentTokens.accent : 'none'}
                glassIntensity={settings.effects.glassIntensity}
                style={{
                  maxWidth: isCardMode ? undefined : `${computedSearchWidth}px`,
                  backgroundColor: isInputFocused 
                    ? 'rgba(12, 18, 34, 0.62)' 
                    : `rgba(10, 16, 30, ${Math.max(settings.search.opacity / 100, 0.25)})`,
                  boxShadow: isInputFocused
                    ? `0 12px 36px -4px rgba(0, 0, 0, 0.6), 0 0 20px ${themeAccentTokens.glow}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)`
                    : '0 8px 30px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)',
                }}
                className={`w-full relative ${
                  isCardMode ? 'max-w-[340px] sm:max-w-[380px] py-1.5 px-3 text-xs' : searchSizeClass
                } flex items-center gap-2 sm:gap-3 transition-all duration-200 border ${
                  isLayoutEditing && !isCardMode && (selectedLayoutElement === 'search' || activeDraggingElement === 'search')
                    ? 'border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                    : isLayoutEditing && !isCardMode && hoveredLayoutElement === 'search'
                    ? 'border-cyan-400/40 ring-1 ring-cyan-400/20'
                    : isInputFocused
                    ? themeAccentTokens.ring
                    : 'border-white/25 hover:border-white/40 hover:bg-slate-900/55'
                }`}
              >
                {/* Corner Resize Handles when Selected */}
                {isLayoutEditing && selectedLayoutElement === 'search' && !isCardMode && (
                  <>
                    <div
                      onPointerDown={(e) => handleResizePointerDown('search', e, computedSearchWidth, undefined, searchScale)}
                      title="Drag to resize search bar width"
                      className="resize-handle absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown('search', e, computedSearchWidth, undefined, searchScale)}
                      title="Drag to resize search bar width"
                      className="resize-handle absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown('search', e, computedSearchWidth, undefined, searchScale)}
                      title="Drag to resize search bar width"
                      className="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown('search', e, computedSearchWidth, undefined, searchScale)}
                      title="Drag to resize search bar width"
                      className="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                    />
                  </>
                )}

                {/* Search Engine Icon (Left: Google G or Search) */}
                {settings.search.engine === 'google' ? (
                  <svg className={`${isCardMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} flex-shrink-0 drop-shadow-sm`} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                ) : (
                  <Search className={`${isCardMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-200 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`} />
                )}

                {/* Central Typing Input */}
                <input
                  type="text"
                  readOnly={isCardMode || isLayoutEditing}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => {
                    if (!isCardMode && !isLayoutEditing) {
                      setIsInputFocused(true);
                      setShowRecentSearches(true);
                    }
                  }}
                  onClick={() => {
                    if (!isCardMode && !isLayoutEditing) {
                      setShowRecentSearches(true);
                    }
                  }}
                  placeholder="Search Google or enter a web address..."
                  className={`w-full bg-transparent border-none outline-none text-white placeholder:text-slate-200/75 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] truncate ${
                    isCardMode ? 'text-xs' : 'text-sm'
                  }`}
                />

                {/* Utility Icons (Right): Voice Search, Google Lens, AI Mode Pill */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-slate-300">
                  {/* Voice / Mic Icon */}
                  <button
                    type="button"
                    onClick={isCardMode || isLayoutEditing ? undefined : handleVoiceSearch}
                    aria-label="Search by voice"
                    className={`p-1 rounded-full transition-all duration-150 cursor-pointer ${
                      isVoiceListening && !isCardMode
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                        : 'hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Mic className={`${isCardMode ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                  </button>

                  {/* Google Lens / Image Search Icon */}
                  <button
                    type="button"
                    onClick={isCardMode || isLayoutEditing ? undefined : handleLensSearch}
                    aria-label="Search by image (Google Lens)"
                    className="p-1 rounded-full hover:text-white hover:bg-white/15 transition-all duration-150 cursor-pointer"
                  >
                    <Camera className={`${isCardMode ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                  </button>

                  {/* AI Mode Compact Integrated Pill */}
                  {settings.search.showAiMode && (
                    <button
                      type="button"
                      onClick={isCardMode || isLayoutEditing ? undefined : handleAiModeClick}
                      aria-label="Ask Google AI / Gemini"
                      className={`${
                        isCardMode ? 'px-1.5 py-0.5 text-[9.5px]' : 'px-2.5 py-1 text-[11px]'
                      } rounded-full ${themeAccentTokens.badge} font-mono font-bold flex items-center gap-1 transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95`}
                    >
                      <Sparkles className={`${isCardMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${themeAccentTokens.iconColor}`} />
                      <span className="border-solid">AI</span>
                    </button>
                  )}
                </div>
              </GlassSurface>

              {/* RECENT SEARCHES DROPDOWN */}
              {showRecentSearches && !isCardMode && recentSearches.length > 0 && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-[calc(100%+8px)] left-0 right-0 mx-auto z-[80] rounded-2xl bg-[#0b0f19]/95 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden select-none animate-fadeIn"
                  style={{ maxWidth: isCardMode ? undefined : `${computedSearchWidth}px` }}
                >
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAllRecentSearches}
                      className="text-[10px] text-slate-400 hover:text-rose-300 transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="py-1">
                    {recentSearches.map((query, index) => (
                      <div
                        key={`${query}-${index}`}
                        onClick={(e) => handleSelectRecentSearch(query, e)}
                        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/10 transition-colors cursor-pointer group/query select-none text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <History className="w-3.5 h-3.5 text-slate-400 group-hover/query:text-cyan-300 transition-colors shrink-0" />
                          <span className="text-xs text-slate-200 group-hover/query:text-white truncate font-normal">
                            {query}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveRecentSearch(query, e)}
                            title="Remove from history"
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover/query:opacity-100 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <ArrowUpLeft className="w-3.5 h-3.5 text-slate-500 group-hover/query:text-cyan-400 opacity-60 group-hover/query:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* ===================================================================== */}
          {/* SHORTCUTS DOCK + DEDICATED ADD SHORTCUT (+) BUTTON (Draggable & Resizable) */}
          {/* ===================================================================== */}
          <div
            data-layout-element="dock"
            onPointerDown={(e) => handleElementPointerDown('dock', e)}
            onPointerMove={(e) => handleElementPointerMove('dock', e)}
            onPointerUp={(e) => handleElementPointerUp('dock', e)}
            onPointerCancel={(e) => handleElementPointerUp('dock', e)}
            onMouseEnter={(e) => {
              if (isCardMode) return;
              e.stopPropagation();
              setHoveredLayoutElement('dock');
              onHoverSection?.('dock');
            }}
            onMouseLeave={() => {
              if (!isCardMode) {
                setHoveredLayoutElement(null);
                onHoverSection?.('background');
              }
            }}
            style={{
              transform: `translate(${dockOffsetX}px, ${dockOffsetY}px) scale(${dockScale})`,
              transformOrigin: 'center center',
              zIndex: dockZIndex,
              transition: activeDraggingElement === 'dock' || activeResizing?.elementId === 'dock' ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
            }}
            className={`w-fit max-w-full mx-auto flex justify-center pt-2 pb-1 overflow-visible relative group/dock pointer-events-auto ${
              isLayoutEditing && !isCardMode 
                ? (selectedLayoutElement === 'dock' 
                    ? (activeDraggingElement === 'dock' ? 'cursor-grabbing select-none' : 'cursor-grab select-none') 
                    : 'cursor-grab hover:cursor-grab select-none') 
                : ''
            }`}
          >
            {/* Set Confirmation Badge */}
            {isLayoutEditing && setConfirmations.dock && !isCardMode && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-400/80 text-[10.5px] font-mono text-emerald-300 shadow-xl pointer-events-none animate-fadeIn">
                <span>✓ Set</span>
              </div>
            )}

            {/* Contextual HUD toolbar for Dock - only when editing and selected */}
            {isLayoutEditing && !isCardMode && (selectedLayoutElement === 'dock' || activeDraggingElement === 'dock') && (
              <div 
                className={`layout-hud-toolbar absolute ${
                  dockOffsetY < -70 ? 'top-full mt-2' : '-top-8'
                } left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-400/70 text-[10.5px] font-mono text-cyan-300 shadow-2xl pointer-events-auto backdrop-blur-xl whitespace-nowrap animate-fadeIn`}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Move className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-white">Shortcuts Dock</span>
                <span className="text-cyan-400/80">({dockOffsetX >= 0 ? `+${dockOffsetX}` : dockOffsetX}, {dockOffsetY >= 0 ? `+${dockOffsetY}` : dockOffsetY})</span>
                {dockScale !== 1 && <span className="text-cyan-300/80 text-[9.5px]">×{dockScale}</span>}
                <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCenterElement('dock');
                  }}
                  title="Snap to Center (0, 0)"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Center</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBringForward('dock');
                  }}
                  title="Bring Forward in Layer Stack"
                  className="hover:text-white text-cyan-400/90 hover:bg-cyan-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Z:{dockZIndex}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetElement('dock');
                  }}
                  title="Reset Position, Scale & Layer"
                  className="hover:text-white text-cyan-400/90 hover:bg-rose-500/20 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayoutElement?.(null);
                  }}
                  title="Deselect Element"
                  className="hover:text-white text-slate-400 hover:bg-white/10 px-1 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            <div 
              style={{
                gap: `${shortcutSpacingPx}px`,
              }}
              className={`flex items-center justify-center overflow-visible p-1.5 rounded-2xl relative transition-all duration-200 ${
                isLayoutEditing && !isCardMode && (selectedLayoutElement === 'dock' || activeDraggingElement === 'dock')
                  ? 'border border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.3)] bg-cyan-950/20'
                  : isLayoutEditing && !isCardMode && hoveredLayoutElement === 'dock'
                  ? 'border border-cyan-400/40 ring-1 ring-cyan-400/20 bg-cyan-950/5'
                  : ''
              } ${
                isCardMode ? 'max-w-full px-1 flex-nowrap' : 'max-w-3xl px-2 flex-wrap'
              }`}
            >
              {/* Corner Resize Handles when Dock is Selected */}
              {isLayoutEditing && selectedLayoutElement === 'dock' && !isCardMode && (
                <>
                  <div
                    onPointerDown={(e) => handleResizePointerDown('dock', e, undefined, undefined, dockScale)}
                    title="Drag corner to scale shortcuts dock"
                    className="resize-handle absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown('dock', e, undefined, undefined, dockScale)}
                    title="Drag corner to scale shortcuts dock"
                    className="resize-handle absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown('dock', e, undefined, undefined, dockScale)}
                    title="Drag corner to scale shortcuts dock"
                    className="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nesw-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown('dock', e, undefined, undefined, dockScale)}
                    title="Drag corner to scale shortcuts dock"
                    className="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-slate-950 rounded-xs shadow-md cursor-nwse-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                  />
                </>
              )}
              {(isCardMode ? shortcuts.slice(0, 6) : shortcuts).map((shortcut, index) => {
                const isHovered = hoveredShortcutId === shortcut.id;
                let currentScale = 1;
                let currentLift = 0;
                if (hoveredShortcutId !== null && !isCardMode) {
                  const activeList = isCardMode ? shortcuts.slice(0, 6) : shortcuts;
                  const hoveredIndex = activeList.findIndex(s => s.id === hoveredShortcutId);
                  if (hoveredIndex !== -1) {
                    const dist = Math.abs(index - hoveredIndex);
                    const maxScale = settings.shortcuts.hoverScale ?? 1.08;
                    const maxLift = Math.min(Math.max(settings.shortcuts.hoverLift ?? settings.shortcuts.liftDistance ?? 4, 0), 16);
                    if (dist === 0) {
                      currentScale = maxScale;
                      currentLift = maxLift;
                    } else if (dist === 1) {
                      currentScale = 1 + (maxScale - 1) * 0.45;
                      currentLift = Math.round(maxLift * 0.45);
                    } else if (dist === 2) {
                      currentScale = 1 + (maxScale - 1) * 0.18;
                      currentLift = Math.round(maxLift * 0.18);
                    }
                  }
                }
                const isLiftedOrScaled = (currentScale !== 1 || currentLift > 0) && !isCardMode;
                return (
                  <div
                    key={shortcut.id}
                    onMouseEnter={() => !isCardMode && setHoveredShortcutId(shortcut.id)}
                    onMouseLeave={() => !isCardMode && setHoveredShortcutId(null)}
                    onContextMenu={(e) => {
                      if (isCardMode || isLayoutEditing) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenuShortcut({
                        shortcut,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className={`flex flex-col items-center gap-1 group/item select-none overflow-visible ${
                      isCardMode ? 'flex-shrink-0' : ''
                    }`}
                  >
                    {/* Main Shortcut Action (Icon) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isCardMode || isLayoutEditing) return;
                        if (onOpenShortcut) onOpenShortcut(shortcut);
                        else window.open(shortcut.url, '_blank');
                      }}
                      aria-label={shortcut.title}
                      className="block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-black/50 cursor-pointer overflow-visible"
                    >
                      <GlassSurface
                        radius="full"
                        opacity={settings.shortcuts.opacity}
                        blur={settings.shortcuts.blur}
                        borderOpacity={isHovered ? Math.min(shortcutBorderOpacity + 18, 60) : shortcutBorderOpacity}
                        shadow={isHovered ? 'glow' : 'subtle'}
                        glowColor={shortcut.glowColor || 'rgba(168, 85, 247, 0.4)'}
                        glassIntensity={settings.effects.glassIntensity}
                        style={{
                          width: `${shortcutIconSize}px`,
                          height: `${shortcutIconSize}px`,
                          transform: isLiftedOrScaled
                            ? `translateY(-${currentLift}px) scale(${currentScale})`
                            : 'translateY(0px) scale(1)',
                          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1), border-color 0.2s, box-shadow 0.2s',
                          zIndex: isLiftedOrScaled ? 20 : 1,
                        }}
                        className="rounded-full flex items-center justify-center overflow-visible"
                      >
                        <div 
                          style={{
                            width: `${shortcutInnerSize}px`,
                            height: `${shortcutInnerSize}px`,
                            fontSize: `${shortcutFontSize}px`,
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                          className="rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative"
                        >
                          <img
                            src={getFaviconUrl(shortcut.url)}
                            alt={shortcut.title}
                            className="w-3/5 h-3/5 object-contain drop-shadow"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </GlassSurface>
                    </button>

                    {/* Site Label Beneath: Muted and Secondary */}
                    {settings.shortcuts.showLabels && (
                      <span 
                        onClick={() => {
                          if (isCardMode || isLayoutEditing) return;
                          if (onOpenShortcut) onOpenShortcut(shortcut);
                          else window.open(shortcut.url, '_blank');
                        }}
                        style={{
                          fontSize: `${shortcutLabelSize}px`,
                          maxWidth: `${shortcutLabelMaxWidth}px`,
                        }}
                        className={`font-medium tracking-tight truncate text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-colors cursor-pointer ${
                          isHovered && !isCardMode ? 'text-white' : 'text-slate-300/75'
                        }`}
                      >
                        {shortcut.title}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* DEDICATED ADD SHORTCUT (+) BUTTON AT END OF ROW */}
              <div
                onClick={() => {
                  if (isCardMode || isLayoutEditing) return;
                  openAddModal();
                }}
                className={`flex flex-col items-center gap-1 ${isCardMode ? 'flex-shrink-0' : 'cursor-pointer group/add select-none'}`}
              >
                <GlassSurface
                  radius="full"
                  opacity={settings.shortcuts.opacity}
                  blur={settings.shortcuts.blur}
                  borderOpacity={shortcutBorderOpacity}
                  glassIntensity={settings.effects.glassIntensity}
                  style={{
                    width: `${shortcutIconSize}px`,
                    height: `${shortcutIconSize}px`,
                  }}
                  className="rounded-full flex items-center justify-center transition-all duration-150 text-slate-300 group-hover/add:text-white group-hover/add:-translate-y-0.5"
                >
                  <div 
                    style={{
                      width: `${shortcutInnerSize}px`,
                      height: `${shortcutInnerSize}px`,
                    }}
                    className="rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-slate-300 group-hover/add:text-white group-hover/add:bg-white/15 transition-all"
                  >
                    <CirclePlusIcon color="#ffffff" duration={1.45} size={Math.round(shortcutInnerSize * 0.7)} />
                  </div>
                </GlassSurface>

                {settings.shortcuts.showLabels && (
                  <span 
                    style={{
                      fontSize: `${shortcutLabelSize}px`,
                      maxWidth: `${shortcutLabelMaxWidth}px`,
                    }}
                    className="font-medium text-slate-300/80 group-hover/add:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate text-center"
                  >
                    Add
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: NATIVE CHROME-STYLE "CUSTOMIZE CHROME" BUTTON */}
        <div className="flex items-center justify-end pt-1">
          {!isCardMode && onQuickCustomizeClick && (
            <GlassSurface
              radius="full"
              opacity={25}
              blur={16}
              borderOpacity={20}
              onClick={onQuickCustomizeClick}
              className="px-3.5 py-1.5 flex items-center gap-1.5 text-xs text-slate-200 hover:text-white hover:bg-white/15 transition cursor-pointer drop-shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 text-purple-300" />
              <span>Customize Chrome</span>
            </GlassSurface>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DELIBERATE SHORTCUT CONTEXT MENU (ON RIGHT CLICK ONLY) */}
      {/* ========================================================================= */}
      {!isCardMode && contextMenuShortcut && (
        <div 
          style={{ 
            top: `${Math.min(contextMenuShortcut.y, window.innerHeight - 110)}px`, 
            left: `${Math.min(contextMenuShortcut.x, window.innerWidth - 170)}px` 
          }}
          className="fixed z-50 py-1.5 px-1 min-w-[140px] rounded-xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/20 shadow-2xl space-y-0.5 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10 mb-1 truncate max-w-[160px]">
            {contextMenuShortcut.shortcut.title}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(contextMenuShortcut.shortcut);
              setContextMenuShortcut(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit shortcut</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveShortcut(contextMenuShortcut.shortcut.id, e);
              setContextMenuShortcut(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SHORTCUT MODAL */}
      {/* ========================================================================= */}
      {!isCardMode && isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#0e121d]/90 backdrop-blur-xl border border-white/20 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>{modalMode === 'add' ? 'Add shortcut' : 'Edit shortcut'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => {
                    setModalName(e.target.value);
                    setModalError(null);
                  }}
                  placeholder="e.g. GitHub"
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  URL
                </label>
                <input
                  type="text"
                  value={modalUrl}
                  onChange={(e) => {
                    setModalUrl(e.target.value);
                    setModalError(null);
                  }}
                  placeholder="e.g. github.com"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition"
                />
              </div>

              {modalError && (
                <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                  {modalError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{modalMode === 'add' ? 'Add' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
