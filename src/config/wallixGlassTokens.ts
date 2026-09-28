/**
 * WALLIX Centralized Liquid Glass Visual Design Tokens
 * 
 * Single source of truth for:
 * - --glass-background
 * - --glass-border
 * - --glass-blur
 * - --glass-shadow
 * - --glass-highlight
 * - --glass-radius
 */
export const WALLIX_GLASS_TOKENS = {
  // CSS Variable Strings
  cssVars: {
    background: 'var(--glass-background, rgba(255, 255, 255, 0.13))',
    border: 'var(--glass-border, rgba(255, 255, 255, 0.2))',
    blur: 'var(--glass-blur, 24px)',
    shadow: 'var(--glass-shadow, 0 16px 40px -10px rgba(0, 0, 0, 0.32))',
    highlight: 'var(--glass-highlight, inset 0 1px 1px 0 rgba(255, 255, 255, 0.3))',
    radius: 'var(--glass-radius, 1.5rem)',
  },

  // Tailwind Class Combinations for Component Usage
  card: 'relative rounded-[24px] bg-white/[0.13] dark:bg-black/[0.24] backdrop-blur-2xl backdrop-saturate-150 border border-white/20 dark:border-white/12 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.32),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-300',
  
  dock: 'relative rounded-[28px] bg-white/[0.15] dark:bg-black/[0.28] backdrop-blur-2xl backdrop-saturate-150 border border-white/25 dark:border-white/18 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.35)] px-3 py-2 flex items-center gap-2.5 transition-all duration-300',
  
  statusPill: 'px-2.5 py-1 rounded-full bg-white/[0.11] dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.25)] flex items-center gap-1.5 text-xs text-white/95',
  
  liveBadge: 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold tracking-wide flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
  
  subtleHeader: 'text-[11px] font-semibold tracking-widest text-white/60 uppercase select-none',
  
  divider: 'border-t border-white/10 dark:border-white/[0.08]',
  
  specularReflection: 'before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:pointer-events-none',
};

