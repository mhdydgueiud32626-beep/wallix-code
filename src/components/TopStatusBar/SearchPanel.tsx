import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, ArrowRight, Sparkles, Layout, Image, Settings } from 'lucide-react';
import { STATUS_GLASS_TOKENS } from './statusTokens';

interface SearchPanelProps {
  onClose?: () => void;
}

interface QuickResult {
  id: string;
  title: string;
  category: 'App' | 'Wallpaper' | 'Setting';
  icon: React.ReactNode;
}

const QUICK_SUGGESTIONS: QuickResult[] = [
  { id: '1', title: 'Aesthetic Mountain Sunset', category: 'Wallpaper', icon: <Image className="w-3.5 h-3.5 text-blue-500" /> },
  { id: '2', title: 'Chrome Extension Studio', category: 'App', icon: <Layout className="w-3.5 h-3.5 text-amber-500" /> },
  { id: '3', title: 'Dock Magnification Curves', category: 'Setting', icon: <Settings className="w-3.5 h-3.5 text-purple-500" /> },
];

export const SearchPanel: React.FC<SearchPanelProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const filtered = query.trim()
    ? QUICK_SUGGESTIONS.filter(s => s.title.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase()))
    : QUICK_SUGGESTIONS;

  return (
    <div className="w-full min-w-0 space-y-3 select-none box-border">
      {/* Main Search Pill Header */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] shadow-inner focus-within:ring-2 focus-within:ring-blue-500/40 transition">
        <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && onClose) {
              onClose();
            }
          }}
          placeholder="Search WALLIX"
          className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 font-normal"
        />
        <button
          type="button"
          aria-label="Voice Search"
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick results / Suggestions */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1 py-1">
          <span className={STATUS_GLASS_TOKENS.sectionHeader}>Quick Actions</span>
          <span className="text-[10px] text-slate-400">Press ↵ to open</span>
        </div>

        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={onClose}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-left ${STATUS_GLASS_TOKENS.rowHover} group cursor-pointer`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-500 flex items-center gap-1 font-medium">
                  {item.category}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>No results for "{query}"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
