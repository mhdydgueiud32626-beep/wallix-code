export const STATUS_GLASS_TOKENS = {
  // Ultra-refined liquid glass container styling (translucent wallpaper diffusion)
  panelContainer: `
    bg-white/[0.80] dark:bg-[#181c24]/[0.80] 
    backdrop-blur-2xl backdrop-saturate-150
    border border-white/50 dark:border-white/15 
    shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.4)] 
    text-slate-800 dark:text-slate-100
    rounded-2xl
  `,
  // Active/Hover highlights for internal rows
  rowHover: `
    hover:bg-black/5 dark:hover:bg-white/10 
    transition-colors duration-150 rounded-xl
  `,
  rowActive: `
    bg-blue-500/10 dark:bg-blue-400/15 
    text-blue-600 dark:text-blue-400
  `,
  // Section headers within panels
  sectionHeader: `
    text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 select-none
  `,
  // Subtle dividers
  divider: `
    border-b border-black/[0.06] dark:border-white/[0.08]
  `,
  // Switch styling
  switchActive: 'bg-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.5)]',
  switchInactive: 'bg-slate-300 dark:bg-slate-700',
  // Spring transition definitions
  panelSpring: {
    type: 'spring' as const,
    stiffness: 440,
    damping: 32,
    mass: 0.6,
  },
  buttonSpring: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
};

