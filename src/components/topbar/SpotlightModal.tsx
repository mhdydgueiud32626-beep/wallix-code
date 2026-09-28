import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  AppWindow, 
  Settings, 
  Calendar, 
  Image, 
  Music, 
  Calculator, 
  Folder, 
  Terminal, 
  Globe,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp?: (appId: string) => void;
  onOpenSettings?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'Applications' | 'System Settings' | 'Calculations' | 'Quick Actions';
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle calculation if query is a math expression
  let mathResult: number | null = null;
  if (/^[0-9+\-*/().\s^%]+$/.test(query.trim()) && /[0-9]/.test(query) && /[+\-*/^%]/.test(query)) {
    try {
      // Safe simple math evaluation
      const sanitized = query.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const res = Function(`"use strict"; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        mathResult = res;
      }
    } catch {
      mathResult = null;
    }
  }

  const defaultApps: SearchItem[] = [
    {
      id: 'settings',
      title: 'System Settings',
      category: 'System Settings',
      subtitle: 'Wallpaper, Appearance, Display, Sounds',
      icon: <Settings className="w-5 h-5 text-blue-400" />,
      action: () => {
        onClose();
        onOpenSettings?.();
      },
    },
    {
      id: 'wallpapers',
      title: 'Wallpapers & Themes',
      category: 'Applications',
      subtitle: 'Dynamic 4K & macOS Sequoia Live Wallpapers',
      icon: <Image className="w-5 h-5 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenApp?.('wallpapers');
      },
    },
    {
      id: 'calendar',
      title: 'Calendar & Agenda',
      category: 'Applications',
      subtitle: 'Schedule, Events, and Date Viewer',
      icon: <Calendar className="w-5 h-5 text-rose-400" />,
      action: () => {
        onClose();
        onOpenApp?.('calendar');
      },
    },
    {
      id: 'music',
      title: 'Music & Ambience',
      category: 'Applications',
      subtitle: 'Lo-Fi beats, soundscapes, audio player',
      icon: <Music className="w-5 h-5 text-purple-400" />,
      action: () => {
        onClose();
        onOpenApp?.('music');
      },
    },
    {
      id: 'finder',
      title: 'Finder & Files',
      category: 'Applications',
      subtitle: 'Browse files, downloads, and storage',
      icon: <Folder className="w-5 h-5 text-sky-400" />,
      action: () => {
        onClose();
        onOpenApp?.('finder');
      },
    },
    {
      id: 'terminal',
      title: 'Terminal',
      category: 'Applications',
      subtitle: 'Command line shell & developer tools',
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      action: () => {
        onClose();
        onOpenApp?.('terminal');
      },
    },
    {
      id: 'browser',
      title: 'Safari Web Browser',
      category: 'Applications',
      subtitle: 'Explore the web with privacy and speed',
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      action: () => {
        onClose();
        onOpenApp?.('browser');
      },
    },
  ];

  const results: SearchItem[] = [];

  if (mathResult !== null) {
    results.push({
      id: 'math-calc',
      title: `= ${mathResult.toLocaleString()}`,
      category: 'Calculations',
      subtitle: `Calculator result for "${query}"`,
      icon: <Calculator className="w-5 h-5 text-emerald-400" />,
      action: () => {
        navigator.clipboard?.writeText(String(mathResult));
        onClose();
      },
    });
  }

  if (query.trim() === '') {
    results.push(...defaultApps);
  } else {
    const q = query.toLowerCase().trim();
    const filtered = defaultApps.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
    results.push(...filtered);

    // Fallback Web Search Action
    if (results.length === 0 || !results.some((r) => r.id === 'web-search')) {
      results.push({
        id: 'web-search',
        title: `Search Google for "${query}"`,
        category: 'Quick Actions',
        subtitle: 'Search the web in default browser',
        icon: <Globe className="w-5 h-5 text-blue-400" />,
        action: () => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
          onClose();
        },
      });
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex justify-center items-start pt-[14vh] px-4 pointer-events-auto">
          {/* Backdrop Click Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Spotlight Floating Glass Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="relative w-[560px] max-w-[94vw] bg-slate-900/85 dark:bg-black/80 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white select-none z-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div className="flex items-center px-4 py-3.5 gap-3 border-b border-white/10 bg-white/5">
              <Search className="w-5 h-5 text-white/60 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Spotlight Search: apps, files, math, web..."
                className="w-full bg-transparent text-base md:text-lg text-white placeholder-white/40 focus:outline-hidden font-normal tracking-wide"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/40 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                <span>ESC</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {results.length > 0 ? (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-600/85 text-white shadow-md'
                          : 'hover:bg-white/10 text-white/90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20' : 'bg-white/10'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium tracking-tight truncate">{item.title}</div>
                          <div
                            className={`text-xs truncate ${
                              isSelected ? 'text-white/80' : 'text-white/50'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                            isSelected
                              ? 'border-white/30 text-white/90 bg-white/15'
                              : 'border-white/10 text-white/40 bg-white/5'
                          }`}
                        >
                          {item.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white/90" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-white/40 text-xs flex flex-col items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-white/30" />
                  <span>No matching results for "{query}"</span>
                </div>
              )}
            </div>

            {/* Footer status tip */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
              <div className="flex items-center gap-2">
                <span>Select <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px] text-white/70">↑</kbd> <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px] text-white/70">↓</kbd></span>
                <span>•</span>
                <span>Open <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px] text-white/70">↵</kbd></span>
              </div>
              <div className="font-mono text-[10px]">
                Spotlight (Cmd + Space)
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SpotlightModal;
