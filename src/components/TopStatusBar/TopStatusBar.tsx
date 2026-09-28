import React from 'react';
import { TopBar, ActiveMenuType } from '../topbar/TopBar';

export interface TopStatusBarProps {
  platformTitle?: string;
  className?: string;
  onOpenSettings?: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  platformTitle = 'WALLIX Native Discovery',
  className = '',
  onOpenSettings,
}) => {
  return (
    <TopBar
      platformTitle={platformTitle}
      className={className}
      onOpenSettings={onOpenSettings}
    />
  );
};

export default TopStatusBar;
