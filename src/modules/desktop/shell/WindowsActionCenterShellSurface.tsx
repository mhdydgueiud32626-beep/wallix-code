import React from 'react';
import { WindowsActionCenterFlyout, WindowsActionCenterFlyoutProps } from '../../../components/topbar/actionCenter/WindowsActionCenterFlyout';

export interface WindowsActionCenterShellSurfaceProps extends WindowsActionCenterFlyoutProps {}

export const WindowsActionCenterShellSurface: React.FC<WindowsActionCenterShellSurfaceProps> = (props) => {
  return <WindowsActionCenterFlyout {...props} />;
};

export default WindowsActionCenterShellSurface;
