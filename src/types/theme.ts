export interface ThemeConfig {
  id: string;
  name: string;
  tagline?: string;
  background: string;
  videoBackground?: string;
  accent: string;
  searchStyle: 'glass' | 'minimal' | 'cyber' | 'frosted';
  searchBorderGlow: string;
  dockStyle: 'spring' | 'dock-glow' | 'minimal' | 'glass';
  showClock: boolean;
  showAnimations: boolean;
  badge?: string;
}

export const WALLIX_THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'sakura-spirit',
    name: 'Sakura Spirit',
    tagline: 'Cyberpunk Anime with drifting cherry blossom petals and warm rose neon radiance',
    background: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=2400',
    videoBackground: '/videos/flower.webm',
    accent: '#F472B6',
    searchStyle: 'glass',
    searchBorderGlow: 'rgba(244, 114, 182, 0.5)',
    dockStyle: 'spring',
    showClock: true,
    showAnimations: true,
    badge: 'CYBERPUNK ANIME'
  },
  {
    id: 'neon-abyss',
    name: 'Neon Abyss',
    tagline: 'Dark futuristic Neo Tokyo skyscrapers with electric cyan rain reflections',
    background: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=2400&q=85',
    videoBackground: '/videos/cinematic_trailer.mp4',
    accent: '#06B6D4',
    searchStyle: 'cyber',
    searchBorderGlow: 'rgba(6, 182, 212, 0.5)',
    dockStyle: 'dock-glow',
    showClock: true,
    showAnimations: true,
    badge: 'DARK FUTURISTIC'
  },
  {
    id: 'minimal-glass',
    name: 'Minimal Glass',
    tagline: 'Clean frosted glass acrylic aesthetic with pure typography and monochrome dock',
    background: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85',
    accent: '#94A3B8',
    searchStyle: 'minimal',
    searchBorderGlow: 'rgba(255, 255, 255, 0.3)',
    dockStyle: 'minimal',
    showClock: true,
    showAnimations: false,
    badge: 'CLEAN MACOS STYLE'
  },
  {
    id: 'deep-nebula',
    name: 'Deep Nebula',
    tagline: 'Cosmic quantum stellar clusters and deep ultraviolet stardust vortex',
    background: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=85',
    videoBackground: '/videos/sample_loop.mp4',
    accent: '#A855F7',
    searchStyle: 'frosted',
    searchBorderGlow: 'rgba(168, 85, 247, 0.5)',
    dockStyle: 'spring',
    showClock: true,
    showAnimations: true,
    badge: 'SPACE SHADER'
  }
];
