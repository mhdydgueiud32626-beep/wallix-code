import { ChromeNewTabSettings, ThemeAccent } from './types';

export interface WallpaperAdaptivePreset {
  id: string;
  name: string;
  title: string;
  tagline: string;
  category: string;
  tags: string[];
  imageUrl: string;
  image?: string;
  thumbnail: string;
  fit: 'cover' | 'fill' | 'center';
  themeAccent: ThemeAccent;
  theme: string;
  effects: {
    vignette: number;
    backdropDim: number;
  };
  search: {
    blur: number;
    opacity: number;
    borderOpacity: number;
    glow: boolean;
  };
  shortcuts: {
    opacity: number;
    blur: number;
  };
  description: string;
  recommendation: string;
}

export const WALLPAPER_ADAPTIVE_PRESETS: WallpaperAdaptivePreset[] = [
  {
    id: 'samurai-spider-lily',
    name: 'Samurai',
    title: 'Samurai & Spider Lily Blood Moon',
    tagline: 'Crimson & Spider Lily',
    category: 'Anime & Concept Art',
    tags: ['anime', 'red', 'samurai', 'dark', 'fantasy'],
    imageUrl: '/samurai_spider_lily.jpg',
    image: '/samurai_spider_lily.jpg',
    thumbnail: '/samurai_spider_lily.jpg',
    fit: 'cover',
    themeAccent: 'rose',
    theme: 'samurai-crimson',
    effects: {
      vignette: 26,
      backdropDim: 14,
    },
    search: {
      blur: 16,
      opacity: 28,
      borderOpacity: 32,
      glow: true,
    },
    shortcuts: {
      opacity: 38,
      blur: 18,
    },
    description: 'Blood-red sunset with floating petals. Enhanced glass opacity and crimson glow maintain crisp text readability.',
    recommendation: 'Brighter glass UI + Rose/Crimson accent for high-contrast over vivid red tones.',
  },
  {
    id: 'azure-reverie',
    name: 'Azure Reverie',
    title: 'Azure Reverie: Butterfly Meadow',
    tagline: 'Butterfly Meadow',
    category: 'Anime & Concept Art',
    tags: ['anime', 'blue', 'fantasy', 'nature'],
    imageUrl: '/images/azure_butterfly_maiden.jpg',
    image: '/images/azure_butterfly_maiden.jpg',
    thumbnail: '/images/azure_butterfly_maiden.jpg',
    fit: 'cover',
    themeAccent: 'cyan',
    theme: 'azure-reverie',
    effects: {
      vignette: 18,
      backdropDim: 8,
    },
    search: {
      blur: 16,
      opacity: 22,
      borderOpacity: 28,
      glow: true,
    },
    shortcuts: {
      opacity: 34,
      blur: 16,
    },
    description: 'Serene blue-haired maiden in a blooming meadow surrounded by sapphire butterflies.',
    recommendation: 'Cyan neon glass UI with high-contrast text over vibrant sky tones.',
  },
  {
    id: 'silver-surfer-oled',
    name: 'Surfer',
    title: 'Silver Surfer OLED Cosmic Void',
    tagline: 'OLED Chrome Void',
    category: 'Dark AMOLED & Void',
    tags: ['space', 'oled', 'dark', 'minimal', 'cosmic'],
    imageUrl: '/silver_surfer_oled.jpg',
    image: '/silver_surfer_oled.jpg',
    thumbnail: '/silver_surfer_oled.jpg',
    fit: 'cover',
    themeAccent: 'cyan',
    theme: 'oled-space',
    effects: {
      vignette: 10,
      backdropDim: 4,
    },
    search: {
      blur: 24,
      opacity: 14,
      borderOpacity: 20,
      glow: false,
    },
    shortcuts: {
      opacity: 22,
      blur: 16,
    },
    description: 'Pitch black OLED space background with reflective chrome. Ultra-clean minimal glass lets pure blacks shine.',
    recommendation: 'Deep black OLED mode + Cyan neon accent with subtle minimal frosted glass.',
  },
  {
    id: 'porsche-wall-street',
    name: 'Porsche',
    title: 'Porsche 911 GT3 Wall Street Noir',
    tagline: 'Wall Street Noir',
    category: 'Dark AMOLED & Void',
    tags: ['cars', 'dark', 'luxury', 'noir', 'urban'],
    imageUrl: '/porsche_wall_street.jpg',
    image: '/porsche_wall_street.jpg',
    thumbnail: '/porsche_wall_street.jpg',
    fit: 'cover',
    themeAccent: 'amber',
    theme: 'wallstreet-noir',
    effects: {
      vignette: 28,
      backdropDim: 18,
    },
    search: {
      blur: 20,
      opacity: 30,
      borderOpacity: 34,
      glow: true,
    },
    shortcuts: {
      opacity: 42,
      blur: 18,
    },
    description: 'Gloss black GT3 with Wall Street money collage. High glass prominence with gold/amber reflections.',
    recommendation: 'Dark luxury noir + Amber accent with enhanced frosted glass visibility.',
  },
  {
    id: 'toji-fushiguro',
    name: 'Toji',
    title: 'Toji Fushiguro Emerald Ink Slash',
    tagline: 'Inverted Spear Ink',
    category: 'Anime & Concept Art',
    tags: ['anime', 'green', 'ink', 'action', 'dark'],
    imageUrl: '/toji_fushiguro_emerald.jpg',
    image: '/toji_fushiguro_emerald.jpg',
    thumbnail: '/toji_fushiguro_emerald.jpg',
    fit: 'cover',
    themeAccent: 'emerald',
    theme: 'toji-emerald',
    effects: {
      vignette: 20,
      backdropDim: 12,
    },
    search: {
      blur: 18,
      opacity: 24,
      borderOpacity: 28,
      glow: true,
    },
    shortcuts: {
      opacity: 32,
      blur: 16,
    },
    description: 'Monochrome Japanese ink splash with glowing green eyes. Subtle emerald aura reflected throughout frosted glass.',
    recommendation: 'Monochrome ink + Emerald theme with subtle green reflection.',
  },
  {
    id: 'anime-train-spring',
    name: 'Spring Train',
    title: 'Anime Train Spring Sakura Canal',
    tagline: 'Sakura Blossom Canal',
    category: 'Anime & Concept Art',
    tags: ['anime', 'nature', 'spring', 'sakura', 'scenery', 'blue'],
    imageUrl: '/anime_train_wallpaper.jpg',
    image: '/anime_train_wallpaper.jpg',
    thumbnail: '/anime_train_wallpaper.jpg',
    fit: 'cover',
    themeAccent: 'purple',
    theme: 'anime-purple',
    effects: {
      vignette: 15,
      backdropDim: 6,
    },
    search: {
      blur: 14,
      opacity: 18,
      borderOpacity: 25,
      glow: false,
    },
    shortcuts: {
      opacity: 30,
      blur: 16,
    },
    description: 'Daylight cherry blossom stream with Japanese commuter train. Balanced translucent frosted glass.',
    recommendation: 'Daylight aesthetic + Purple/Magenta accent with balanced translucency.',
  },
];

/**
 * Apply wallpaper and automatically adapt UI settings to perfectly complement the wallpaper.
 */
export function adaptSettingsToWallpaper(
  currentSettings: ChromeNewTabSettings,
  preset: WallpaperAdaptivePreset,
  customFit?: 'cover' | 'fill' | 'center',
  autoReadability = true
): ChromeNewTabSettings {
  if (!autoReadability) {
    // Only update image without altering effects
    return {
      ...currentSettings,
      wallpaper: {
        type: 'image',
        url: preset.imageUrl,
        title: preset.tagline ? `${preset.name}: ${preset.tagline}` : preset.name,
      },
      theme: preset.theme,
    };
  }

  return {
    ...currentSettings,
    wallpaper: {
      type: 'image',
      url: preset.imageUrl,
      title: preset.tagline ? `${preset.name}: ${preset.tagline}` : preset.name,
    },
    theme: preset.theme,
    effects: {
      ...currentSettings.effects,
      themeAccent: preset.themeAccent,
      vignette: preset.effects.vignette,
      backdropDim: preset.effects.backdropDim,
    },
    search: {
      ...currentSettings.search,
      blur: preset.search.blur,
      opacity: preset.search.opacity,
      borderOpacity: preset.search.borderOpacity,
      glow: preset.search.glow,
    },
    shortcuts: {
      ...currentSettings.shortcuts,
      opacity: preset.shortcuts.opacity,
      blur: preset.shortcuts.blur,
    },
  };
}
