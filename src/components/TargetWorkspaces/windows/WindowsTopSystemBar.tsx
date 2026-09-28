import React from 'react';
import { WindowsEnvironmentConfig } from './types';
import { TopBar } from '../../topbar/TopBar';

interface WindowsTopSystemBarProps {
  config: WindowsEnvironmentConfig;
  onToggleFlyout?: (flyout: 'wifi' | 'volume' | 'battery' | 'clock' | 'start') => void;
}

export const WindowsTopSystemBar: React.FC<WindowsTopSystemBarProps> = () => {
  return (
    <TopBar 
      platformTitle="" 
    />
  );
};
export default WindowsTopSystemBar;
