export type ColorGradePresetId = 'none' | 'cyberpunk' | 'warm' | 'cool' | 'matrix';

export interface ColorGradePreset {
  id: ColorGradePresetId;
  name: string;
  className: string;
  defaultOpacity: number;
  description: string;
  previewGradient: string;
}

export const THEME_PRESETS: ColorGradePreset[] = [
  { 
    id: 'none', 
    name: 'Original', 
    className: 'bg-transparent', 
    defaultOpacity: 0,
    description: 'Raw 4K UHD Original Colors',
    previewGradient: 'bg-gradient-to-r from-slate-400 to-slate-200'
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk Neon', 
    className: 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 mix-blend-color-dodge', 
    defaultOpacity: 0.4,
    description: 'Vibrant Magenta & Cyan Glow (mix-blend-color-dodge)',
    previewGradient: 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400'
  },
  { 
    id: 'warm', 
    name: 'Warm Vintage', 
    className: 'bg-amber-700 mix-blend-overlay', 
    defaultOpacity: 0.35,
    description: 'Golden Amber & Analog Film Sepia (mix-blend-overlay)',
    previewGradient: 'bg-gradient-to-r from-amber-500 to-orange-400'
  },
  { 
    id: 'cool', 
    name: 'Cool OLED Blue', 
    className: 'bg-blue-900 mix-blend-color-burn', 
    defaultOpacity: 0.5,
    description: 'Deep Twilight OLED Contrast (mix-blend-color-burn)',
    previewGradient: 'bg-gradient-to-r from-cyan-600 via-sky-800 to-blue-950'
  },
  { 
    id: 'matrix', 
    name: 'Matrix Green', 
    className: 'bg-emerald-600 mix-blend-hard-light', 
    defaultOpacity: 0.3,
    description: 'Terminal Cyber Grid Tone (mix-blend-hard-light)',
    previewGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400'
  }
];

export interface AutoTimeLutResult {
  preset: ColorGradePreset;
  intensity: number;
  isDaytime: boolean;
  timeLabel: string;
  hour: number;
}

export function getTimeBasedLutPreset(): AutoTimeLutResult {
  const currentHour = new Date().getHours();
  // Daytime: 6:00 AM (6) to 5:59 PM (17) -> Warm Vintage / Sunlit tone at 20%
  // Evening / Night: 6:00 PM (18) to 5:59 AM (5) -> Cool OLED Blue at 40%
  const isDaytime = currentHour >= 6 && currentHour < 18;

  if (isDaytime) {
    const warmPreset = THEME_PRESETS.find((p) => p.id === 'warm') || THEME_PRESETS[2];
    return {
      preset: warmPreset,
      intensity: 0.20, // 20% Opacity
      isDaytime: true,
      timeLabel: 'Daytime Sunlit (6 AM - 6 PM)',
      hour: currentHour,
    };
  } else {
    const coolPreset = THEME_PRESETS.find((p) => p.id === 'cool') || THEME_PRESETS[3];
    return {
      preset: coolPreset,
      intensity: 0.40, // 40% Opacity
      isDaytime: false,
      timeLabel: 'Night OLED Blue (6 PM - 6 AM)',
      hour: currentHour,
    };
  }
}
