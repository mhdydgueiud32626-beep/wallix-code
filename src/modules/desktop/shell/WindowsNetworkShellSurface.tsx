import React from 'react';
import { WindowsNetworkFlyout, WindowsNetworkFlyoutProps } from '../../../components/topbar/actionCenter/WindowsNetworkFlyout';

export interface WindowsNetworkShellSurfaceProps extends WindowsNetworkFlyoutProps {}

export const WindowsNetworkShellSurface: React.FC<WindowsNetworkShellSurfaceProps> = (props) => {
  return <WindowsNetworkFlyout {...props} />;
};

export default WindowsNetworkShellSurface;
