import { WidgetLayoutState } from '../desktop/types';
import { ColorGradePreset, THEME_PRESETS } from './colorPresets';

export type ClockDisplayMode = 'analog' | 'digital';

export interface DesktopPresetItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  sketchLabel: string;
  clockMode: ClockDisplayMode;
  colorThemeId: string;
  colorIntensity: number;
  wallpaperId?: string;
  widgetsVisibility: {
    clock: boolean;
    calendar: boolean;
    music: boolean;
    weather: boolean;
    companion: boolean;
    dock: boolean;
  };
  getLayouts: (vw: number, vh: number) => WidgetLayoutState;
}

export const DESKTOP_SKETCH_PRESETS: DesktopPresetItem[] = [
  {
    id: 'preset_1_analog_suite',
    name: 'Preset 1: Analog Suite & Weather',
    subtitle: 'Top Box Layout (Sketch 1)',
    sketchLabel: 'Preset 1 (Top Drawing)',
    description: 'Analog dial clock at top-left, live 22°C weather at top-right, calendar at middle-left, audio player and AI companion.',
    clockMode: 'analog',
    colorThemeId: 'cyberpunk',
    colorIntensity: 0.45,
    wallpaperId: 'wallix-cyberpunk-neon-city',
    widgetsVisibility: {
      clock: true,
      weather: true,
      calendar: true,
      companion: true,
      music: true,
      dock: false,
    },
    getLayouts: (vw: number, vh: number): WidgetLayoutState => ({
      clock: {
        id: 'clock',
        name: 'Digital Clock',
        x: 32,
        y: 32,
        w: 340,
        h: 200,
        zIndex: 10,
        minW: 240,
        minH: 160,
        maxW: 550,
        maxH: 450,
      },
      weather: {
        id: 'weather',
        name: 'Live Weather',
        x: 32,
        y: 248,
        w: 340,
        h: 210,
        zIndex: 13,
        minW: 240,
        minH: 160,
        maxW: 550,
        maxH: 350,
      },
      calendar: {
        id: 'calendar',
        name: 'Calendar',
        x: Math.max(320, vw - 330),
        y: 190,
        w: 290,
        h: 275,
        zIndex: 11,
        minW: 240,
        minH: 220,
        maxW: 550,
        maxH: 450,
      },
      companion: {
        id: 'companion',
        name: 'AI Companion',
        x: Math.max(320, vw - 345),
        y: 240,
        w: 315,
        h: 300,
        zIndex: 14,
        minW: 260,
        minH: 240,
        maxW: 550,
        maxH: 550,
      },
      music: {
        id: 'music',
        name: 'Audio Player',
        x: Math.max(320, vw - 312),
        y: 560,
        w: 280,
        h: 195,
        zIndex: 12,
        minW: 240,
        minH: 160,
        maxW: 550,
        maxH: 350,
      },
      dock: {
        id: 'dock',
        name: 'App Dock',
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        zIndex: 30,
        minW: 0,
        minH: 0,
      },
    }),
  },
  {
    id: 'preset_2_minimal_digital_dock',
    name: 'Preset 2: Minimal Digital & Dock',
    subtitle: 'Bottom Box Layout (Sketch 2)',
    sketchLabel: 'Preset 2 (Bottom Drawing)',
    description: 'Digital HUD clock (01:21:25) at top-left, bottom-left audio player, and quick-launch bottom dock with active icons.',
    clockMode: 'digital',
    colorThemeId: 'amoled-glow',
    colorIntensity: 0.35,
    wallpaperId: 'wallix-neon-cyber-street',
    widgetsVisibility: {
      clock: true,
      weather: true,
      calendar: false,
      companion: true,
      music: true,
      dock: true,
    },
    getLayouts: (vw: number, vh: number): WidgetLayoutState => ({
      clock: {
        id: 'clock',
        name: 'Digital Clock',
        x: 32,
        y: 32,
        w: 290,
        h: 145,
        zIndex: 10,
        minW: 220,
        minH: 120,
        maxW: 550,
        maxH: 300,
      },
      weather: {
        id: 'weather',
        name: 'Live Weather',
        x: Math.max(320, vw - 312),
        y: 32,
        w: 280,
        h: 190,
        zIndex: 13,
        minW: 240,
        minH: 150,
        maxW: 550,
        maxH: 350,
      },
      companion: {
        id: 'companion',
        name: 'AI Companion',
        x: 32,
        y: 195,
        w: 290,
        h: 290,
        zIndex: 11,
        minW: 260,
        minH: 240,
        maxW: 550,
        maxH: 550,
      },
      music: {
        id: 'music',
        name: 'Audio Player',
        x: 32,
        y: Math.max(500, vh - 225),
        w: 290,
        h: 195,
        zIndex: 12,
        minW: 240,
        minH: 160,
        maxW: 550,
        maxH: 350,
      },
      calendar: {
        id: 'calendar',
        name: 'Calendar',
        x: Math.max(320, vw - 312),
        y: 240,
        w: 280,
        h: 285,
        zIndex: 15,
        minW: 240,
        minH: 220,
        maxW: 550,
        maxH: 450,
      },
      dock: {
        id: 'dock',
        name: 'Bottom Dock',
        x: Math.max(340, Math.floor(vw / 2 - 230)),
        y: Math.max(200, vh - 85),
        w: 460,
        h: 70,
        zIndex: 30,
        minW: 200,
        minH: 50,
      },
    }),
  },
];
