export interface ChromeShortcutItem {
  id: string;
  title: string;
  url: string;
  initials: string;
  gradient: string;
  glowColor: string;
  isDefault?: boolean;
}

export interface ChromeCustomizationState {
  backgroundType: 'image' | 'video' | 'none';
  imageUrl: string;
  videoUrl?: string;
  backgroundBlur: 'none' | 'subtle' | 'medium';
  searchStyle: {
    shape: 'pill' | 'rounded' | 'sharp';
    glassEffect: 'heavy' | 'medium' | 'light';
    borderGlow: 'cyan' | 'rose' | 'amber' | 'violet' | 'emerald';
    size: 'compact' | 'standard' | 'large';
    placeholderText: string;
    aiMode: boolean;
  };
  shortcuts: ChromeShortcutItem[];
  activeThemeId: string;
}

export type ChromeSubTab = 
  | 'new-tab' 
  | 'background' 
  | 'video' 
  | 'search' 
  | 'shortcuts' 
  | 'themes' 
  | 'extension';
