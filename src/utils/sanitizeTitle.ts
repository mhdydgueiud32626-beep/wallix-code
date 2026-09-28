/**
 * Utility to dynamically sanitize and clean wallpaper titles
 * Strips URL slugs, file extensions, and noisy domain prefixes
 */
export function sanitizeWallpaperTitle(rawTitle: string): string {
  if (!rawTitle) return 'Live Wallpaper';
  const lower = rawTitle.toLowerCase();
  
  if (lower.includes('klickpin') || lower.includes('gift ideas')) {
    return 'Crimson Katana Vision';
  }
  if (lower.includes('hoat-hinh') || lower.includes('hoathinh') || lower.includes('nhat-ky')) {
    return 'Sakura Spirit Realm';
  }
  if (lower.includes('de-thuong') || lower.includes('dethuong') || lower.includes('ban-ve')) {
    return 'Cyber Blade Maiden';
  }
  
  // General cleanup
  let clean = rawTitle
    .replace(/^From\s+[\w\.\-]+[-_]*/i, '')
    .replace(/\.(mp4|webm|mov|mkv|jpg|png|jpeg|webp)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (clean.length > 32) {
    clean = clean.substring(0, 32).trim();
  }
  
  return clean || 'Custom Live Wallpaper';
}
