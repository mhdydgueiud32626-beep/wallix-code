import { InstalledApp } from '../../types/nativeApp';

export class AppNormalizer {
  /**
   * Normalizes an array of installed applications:
   * - Deduplicates by normalized name
   * - Ensures required fields are present
   * - Sanitizes display names
   * - Assigns intelligent categories
   */
  static normalizeList(apps: InstalledApp[]): InstalledApp[] {
    const seenNames = new Set<string>();
    const normalized: InstalledApp[] = [];

    for (const app of apps) {
      if (!app || !app.name) continue;
      const cleanName = this.cleanAppName(app.name);
      const lowerKey = cleanName.toLowerCase();

      if (seenNames.has(lowerKey)) continue;
      seenNames.add(lowerKey);

      normalized.push({
        ...app,
        id: app.id || `app_${lowerKey.replace(/[^a-z0-9]/g, '_')}`,
        name: cleanName,
        category: app.category || this.inferCategory(cleanName),
        isAvailable: app.isAvailable !== false
      });
    }

    // Sort alphabetically by name
    return normalized.sort((a, b) => a.name.localeCompare(b.name));
  }

  static cleanAppName(name: string): string {
    return name
      .replace(/\.(app|exe|lnk|url)$/i, '')
      .replace(/ - (Shortcut|Raccourci)$/i, '')
      .replace(/ x64| x86|\(64-bit\)|\(32-bit\)/gi, '')
      .trim();
  }

  static inferCategory(name: string): string {
    const lower = name.toLowerCase();
    if (/chrome|safari|edge|firefox|brave|arc|opera|browser/.test(lower)) return 'Web Browsers';
    if (/code|terminal|iterm|warp|git|studio|intellij|sublime|webstorm/.test(lower)) return 'Developer Tools';
    if (/spotify|music|vlc|netflix|capcut|inshot|podcast|audacity|youtube|tv/.test(lower)) return 'Media & Entertainment';
    if (/discord|slack|telegram|whatsapp|zoom|teams|messages|mail/.test(lower)) return 'Communication & Social';
    if (/photoshop|illustrator|figma|blender|sketch|canva|ibispaint|pinterest|procreate/.test(lower)) return 'Design & Creative';
    if (/notion|obsidian|notes|calendar|reminders|word|excel|powerpoint|pages|keynote/.test(lower)) return 'Productivity & Office';
    if (/steam|epic|game|battle\.net|minecraft|roblox/.test(lower)) return 'Gaming';
    return 'Utilities & System';
  }

  /**
   * Returns a consistent fallback color gradient based on app name hash
   */
  static getAppGradient(name: string): string {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-700',
      'from-violet-500 to-purple-700',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-pink-700'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }
}
