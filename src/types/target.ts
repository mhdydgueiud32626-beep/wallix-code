import { NavTab } from '../types';

export type TargetEnvironmentId = 'chrome' | 'windows' | 'macos' | 'mobile';

export interface CustomizationTarget {
  id: TargetEnvironmentId;
  name: string;
  type: string;
  badge: string;
  description: string;
  previewImage: string;
  iconType: 'chrome' | 'windows' | 'apple' | 'mobile';
  capabilities: string[];
  route: NavTab;
  available: boolean;
  statusText: string;
  primaryActionText: string;
}
