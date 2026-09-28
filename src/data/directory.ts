import { Wallpaper } from '../types';

export interface DirectoryItem {
  id: string;
  name: string;
  countDisplay?: string;
  countSup?: string;
  count?: number;
  categoryMatch: string;
  tagsMatch: string[];
}

export const BASE_DIRECTORY_DEFINITIONS: DirectoryItem[] = [
  { id: 'all', name: 'All Directory', categoryMatch: 'all', tagsMatch: [] },
  { id: 'anime', name: 'Anime & Concept Art', categoryMatch: 'Anime', tagsMatch: ['Anime', 'Concept', 'Japan', 'Fantasy', 'Samurai', 'Suzume', 'Koi', 'Girl', 'Manga'] },
  { id: 'cyberpunk', name: 'Cyberpunk & Synth', categoryMatch: 'Cyberpunk', tagsMatch: ['Cyberpunk', 'Synthwave', 'Neon', 'Matrix', 'Night', 'City', 'Sci-Fi'] },
  { id: 'abstract-3d', name: 'Abstract 3D & Shaders', categoryMatch: 'Abstract 3D', tagsMatch: ['Shader', 'Matrix', 'Void', 'Code', 'Live', 'Torus', 'Wireframe', 'Geometry', '3D', 'Waves', 'Fractal', 'Gaming'] },
  { id: 'nature', name: 'Nature & Landscapes', categoryMatch: 'Nature', tagsMatch: ['Nature', 'Mountains', 'Forest', 'Mist', 'Butterfly', 'Meadow', 'Clouds', 'Landscape', 'Lake', 'Plant'] },
  { id: 'space', name: 'Space & Nebula Abyss', categoryMatch: 'Deep Space', tagsMatch: ['Space', 'Nebula', 'Cosmic', 'Star', 'Galaxy', 'Astronomy', 'Planet'] },
  { id: 'cars', name: 'Car & Supercars', categoryMatch: 'Cyberpunk', tagsMatch: ['Car', 'Vehicle', 'Supercar', 'Racing', 'Automotive', 'GTR', 'Porsche'] },
  { id: 'heroes', name: 'Spiderman & Heroes', categoryMatch: 'Cyberpunk', tagsMatch: ['Spiderman', 'Hero', 'Comics', 'Avenger', 'Superhero', 'Warrior'] },
  { id: 'amoled', name: 'Dark AMOLED & Void', categoryMatch: 'Deep Space', tagsMatch: ['Dark', 'AMOLED', 'Void', 'Black', 'OLED', 'Minimal', 'Shadow'] },
  { id: 'gaming', name: 'Gaming & Shaders', categoryMatch: 'Abstract 3D', tagsMatch: ['Gaming', 'Controller', 'Playstation', 'Xbox', 'Esports', 'Live'] },
  { id: 'minimal', name: 'Minimalist 3D', categoryMatch: 'Minimalist 3D', tagsMatch: ['Minimal', 'Geometry', 'Clean', 'Simple', 'Modern', 'Abstract'] },
];

export function formatCountDisplay(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`.replace('.0M', 'M');
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`.replace('.0K', 'K');
  return `${n}`;
}

export function formatSupCount(n: number): string {
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'K': 'ᵏ', 'k': 'ᵏ', 'M': 'ᵐ', 'm': 'ᵐ', '.': '˙'
  };
  const str = formatCountDisplay(n);
  return str.split('').map(char => superscripts[char] || char).join('');
}

export function matchesDirectoryItem(wallpaper: Wallpaper, item: DirectoryItem): boolean {
  if (item.id === 'all' || item.categoryMatch === 'all') return true;

  // 1. Direct Category Match
  if (wallpaper.category && wallpaper.category.toLowerCase() === item.categoryMatch.toLowerCase()) {
    return true;
  }

  // 2. Tag or Title / Description Match
  if (item.tagsMatch && item.tagsMatch.length > 0) {
    const qTags = item.tagsMatch.map(t => t.toLowerCase());
    const wpTags = (wallpaper.tags || []).map(t => t.toLowerCase());
    const hasTagMatch = wpTags.some(t => qTags.some(qt => t.includes(qt) || qt.includes(t)));
    if (hasTagMatch) return true;

    const titleLower = (wallpaper.title || '').toLowerCase();
    const descLower = (wallpaper.description || '').toLowerCase();
    const catLower = (wallpaper.category || '').toLowerCase();

    return qTags.some(qt => titleLower.includes(qt) || descLower.includes(qt) || catLower.includes(qt));
  }

  return false;
}

/**
 * Dynamically computes categories and real counts.
 * Only returns categories that actually have at least 1 existing asset (count > 0).
 */
export function getDynamicDirectoryItems(wallpapers: Wallpaper[]): (DirectoryItem & { count: number; countDisplay: string; countSup: string })[] {
  const results: (DirectoryItem & { count: number; countDisplay: string; countSup: string })[] = [];

  // All Directory (total)
  const totalCount = wallpapers.length;
  results.push({
    id: 'all',
    name: 'All Directory',
    categoryMatch: 'all',
    tagsMatch: [],
    count: totalCount,
    countDisplay: formatCountDisplay(totalCount),
    countSup: formatSupCount(totalCount),
  });

  // Track matched wallpapers
  const matchedWallpaperIds = new Set<string>();

  for (const def of BASE_DIRECTORY_DEFINITIONS) {
    if (def.id === 'all') continue;
    const matching = wallpapers.filter(w => matchesDirectoryItem(w, def));
    if (matching.length > 0) {
      matching.forEach(w => matchedWallpaperIds.add(w.id));
      results.push({
        ...def,
        count: matching.length,
        countDisplay: formatCountDisplay(matching.length),
        countSup: formatSupCount(matching.length),
      });
    }
  }

  // Auto-detect custom categories from custom/uploaded wallpapers
  const customCategories = new Map<string, number>();
  wallpapers.forEach(w => {
    if (w.category && !matchedWallpaperIds.has(w.id)) {
      const cat = w.category.trim();
      if (cat) {
        customCategories.set(cat, (customCategories.get(cat) || 0) + 1);
      }
    }
  });

  customCategories.forEach((count, catName) => {
    if (count > 0) {
      const id = 'custom-' + catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (!results.some(r => r.id === id)) {
        results.push({
          id,
          name: catName,
          categoryMatch: catName,
          tagsMatch: [catName],
          count,
          countDisplay: formatCountDisplay(count),
          countSup: formatSupCount(count),
        });
      }
    }
  });

  return results;
}

export interface FormatFilterCount {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
  isDisabled: boolean;
}

export function getDynamicFormatCounts(wallpapers: Wallpaper[], selectedResolution: string): FormatFilterCount[] {
  const count4K = wallpapers.filter(w => (w.resolution && w.resolution.includes('4K')) || (w.resolutionText && w.resolutionText.includes('4K'))).length;
  const count8K = wallpapers.filter(w => (w.resolution && w.resolution.includes('8K')) || (w.resolutionText && w.resolutionText.includes('8K'))).length;
  const countLive = wallpapers.filter(w => w.isLive || w.is3D || w.isModel3D || !!w.videoUrl).length;
  const countAll = wallpapers.length;

  return [
    { id: 'all', label: 'All Formats', count: countAll, isActive: selectedResolution === 'all', isDisabled: countAll === 0 },
    { id: '4K', label: '4K UHD', count: count4K, isActive: selectedResolution === '4K', isDisabled: count4K === 0 },
    { id: '8K', label: '8K Ultra', count: count8K, isActive: selectedResolution === '8K', isDisabled: count8K === 0 },
    { id: 'Live', label: '3D Live', count: countLive, isActive: selectedResolution === 'Live', isDisabled: countLive === 0 },
  ];
}

// Backward-compatible static export
export const DIRECTORY_ITEMS: DirectoryItem[] = BASE_DIRECTORY_DEFINITIONS;
