import { CustomizationTarget } from '../types/target';

export const CUSTOMIZATION_TARGETS: CustomizationTarget[] = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    type: 'New Tab customization',
    badge: 'Browser',
    description: 'Customize your Chrome New Tab with backgrounds, search and shortcuts.',
    previewImage: '/anime_train_wallpaper.jpg',
    iconType: 'chrome',
    capabilities: [
      'Background',
      'Search',
      'Shortcuts',
      'Themes'
    ],
    route: 'chrome',
    available: true,
    statusText: 'Ready',
    primaryActionText: 'Customize →'
  },
  {
    id: 'windows',
    name: 'Windows 11 / 10',
    type: 'Desktop environment',
    badge: 'Desktop OS',
    description: 'Set live desktop wallpapers with taskbar styling and multi-monitor support.',
    previewImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    iconType: 'windows',
    capabilities: [
      'Live Wallpapers',
      'Taskbar',
      'Audio Reactive',
      'Multi-Monitor'
    ],
    route: 'windows',
    available: true,
    statusText: 'Ready',
    primaryActionText: 'Customize →'
  }
];
