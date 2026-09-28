import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowRight, 
  Settings, 
  Calendar, 
  Image, 
  Music, 
  Calculator, 
  Folder, 
  Terminal, 
  Globe, 
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { useHostEnvironment } from '../../../services/systemBridge';
import { shellSearchModalMotion } from './shellMotion';
import { LiquidGlassSurface, LIQUID_GLASS_TOKENS } from './LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../adaptive';

interface WindowsSearchShellSurfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp?: (appId: string) => void;
  onOpenSettings?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'All' | 'Apps' | 'Documents' | 'Web' | 'Settings';
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const WindowsSearchShellSurface: React.FC<WindowsSearchShellSurfaceProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  onOpenSettings,
}) => {
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;
  const textAccent = tokens.typography.textAccent;

  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Apps' | 'Documents' | 'Web' | 'Settings'>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hostMode, isWebOnly } = useHostEnvironment();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Math evaluation support
  let mathResult: number | null = null;
  if (/^[0-9+\-*/().\s^%]+$/.test(query.trim()) && /[0-9]/.test(query) && /[+\-*/^%]/.test(query)) {
    try {
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

  const topApps: SearchItem[] = [
    {
      id: 'settings',
      title: 'Settings',
      category: 'Settings',
      subtitle: 'System, Wallpaper, Display, Personalization',
      icon: <Settings className="w-5 h-5 text-[#60cdff]" />,
      action: () => {
        onClose();
        onOpenSettings?.();
      },
    },
    {
      id: 'wallpapers',
      title: 'WALLIX Studio Wallpapers',
      category: 'Apps',
      subtitle: 'Dynamic 4K & macOS Sequoia Live Wallpapers',
      icon: <Image className="w-5 h-5 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenApp?.('wallpapers');
      },
    },
    {
      id: 'calendar',
      title: 'Calendar',
      category: 'Apps',
      subtitle: 'Schedule, Events & Agenda Viewer',
      icon: <Calendar className="w-5 h-5 text-[#60cdff]" />,
      action: () => {
        onClose();
        onOpenApp?.('calendar');
      },
    },
    {
      id: 'terminal',
      title: 'Windows Terminal',
      category: 'Apps',
      subtitle: 'PowerShell / Command Prompt',
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      action: () => {
        onClose();
        onOpenApp?.('terminal');
      },
    },
    {
      id: 'files',
      title: 'File Explorer',
      category: 'Documents',
      subtitle: 'This PC, Downloads, Documents',
      icon: <Folder className="w-5 h-5 text-amber-300" />,
      action: () => {
        onClose();
        onOpenApp?.('finder');
      },
    },
    {
      id: 'music',
      title: 'Media Player',
      category: 'Apps',
      subtitle: 'Audio player & ambient soundscapes',
      icon: <Music className="w-5 h-5 text-purple-400" />,
      action: () => {
        onClose();
        onOpenApp?.('music');
      },
    },
    {
      id: 'browser',
      title: 'Microsoft Edge',
      category: 'Web',
      subtitle: 'Fast, secure web browsing',
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
      category: 'All',
      subtitle: `Calculator result for "${query}"`,
      icon: <Calculator className="w-5 h-5 text-emerald-400" />,
      action: () => {
        navigator.clipboard?.writeText(String(mathResult));
        onClose();
      },
    });
  }

  const filteredApps = selectedFilter === 'All' 
    ? topApps 
    : topApps.filter((item) => item.category === selectedFilter);

  if (query.trim() === '') {
    results.push(...filteredApps);
  } else {
    const q = query.toLowerCase().trim();
    const matched = filteredApps.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
    results.push(...matched);

    // Web Search Fallback Action
    if (results.length === 0 || !results.some((r) => r.id === 'web-search')) {
      results.push({
        id: 'web-search',
        title: `Search the web for "${query}"`,
        category: 'Web',
        subtitle: 'Search with default browser',
        icon: <Globe className="w-5 h-5 text-[#60cdff]" />,
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

  const filterTabs: Array<'All' | 'Apps' | 'Documents' | 'Web' | 'Settings'> = [
    'All', 'Apps', 'Documents', 'Web', 'Settings'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex justify-center items-start pt-[12vh] px-4 pointer-events-auto">
          {/* Backdrop Click Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Windows Search Floating Liquid Glass Window */}
          <LiquidGlassSurface
            variant="searchModal"
            {...shellSearchModalMotion}
            className="w-[620px] max-w-[95vw] rounded-xl flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Search Box Header */}
            <div className="flex items-center px-4 py-3.5 gap-3 border-b border-white/[0.09] bg-black/25">
              <Search className="w-5 h-5 shrink-0" style={{ color: textAccent }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type here to search apps, settings, documents, web..."
                className="w-full bg-transparent text-sm md:text-base text-white placeholder-white/40 focus:outline-hidden font-normal"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="text-[10px] font-mono text-white/50 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                ESC
              </div>
            </div>

            {/* 2. Filter Category Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.08] bg-black/15 text-xs">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab);
                    setSelectedIndex(0);
                  }}
                  style={
                    selectedFilter === tab
                      ? {
                          backgroundColor: activeAccent,
                          borderColor: tokens.internalSurface.selectedBorder,
                          boxShadow: `0 2px 8px ${tokens.accent.activeAccentSoft}`,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium border ${
                    selectedFilter === tab
                      ? 'text-white shadow-xs'
                      : 'border-transparent text-white/65 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 3. Results / Top Apps Section */}
            <div className="max-h-[360px] overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {query.trim() === '' && selectedFilter === 'All' && (
                <div className="px-2 py-1 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  Top apps
                </div>
              )}

              {results.length > 0 ? (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#0078d4]/90 border-[#4ba3ff]/80 text-white shadow-[0_2px_10px_rgba(0,120,215,0.4)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.04] text-white/90'
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
                          <div className="text-xs font-semibold tracking-tight truncate">{item.title}</div>
                          <div
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-white/85' : 'text-white/50'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            isSelected
                              ? 'border-white/30 text-white bg-white/20'
                              : 'border-white/10 text-white/40 bg-white/5'
                          }`}
                        >
                          {item.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-white/40 text-xs flex flex-col items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-white/30" />
                  <span>No results found for "{query}"</span>
                </div>
              )}
            </div>

            {/* 4. Windows Search Footer */}
            <div className="px-4 py-2.5 bg-black/35 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/45 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-white/40" />
                <span>Windows Search ({hostMode})</span>
              </div>
              <div className="font-mono text-[10px] text-white/55">
                {isWebOnly ? 'Web Presentation Bridge' : 'Native Windows Bridge'}
              </div>
            </div>
          </LiquidGlassSurface>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WindowsSearchShellSurface;

