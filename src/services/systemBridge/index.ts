import { useSystemBridge } from './SystemBridgeContext';
import { HostCapabilityName } from './contracts';

export * from './contracts';
export * from './types';
export * from './HostBridgeService';
export * from './SystemBridgeContext';

/**
 * Host Environment & Capability Hook
 */
export const useHostEnvironment = () => {
  const {
    hostMode,
    bridgeVersion,
    capabilities,
    providerSource,
    auditLogs,
    setHostMode,
    getCapability,
    isCapabilityAvailable,
    isNativeBridgeConnected,
  } = useSystemBridge();

  return {
    hostMode,
    bridgeVersion,
    capabilities,
    providerSource,
    auditLogs,
    setHostMode,
    getCapability,
    isCapabilityAvailable,
    isNativeBridgeConnected,
    isWebOnly: hostMode === 'WEB_ONLY',
    isMock: hostMode === 'MOCK_DEVELOPMENT',
    isWindowsNative: hostMode === 'WINDOWS_HOST_BRIDGE' || hostMode === 'WINDOWS_NATIVE_DESKTOP',
  };
};

/**
 * Network Status Hook
 */
export const useNetworkStatus = () => {
  const {
    network,
    getCapability,
    setWifiEnabled,
    connectToNetwork,
    disconnectNetwork,
    scanNetworks,
  } = useSystemBridge();

  const readCapability = getCapability('NETWORK_READ');
  const controlCapability = getCapability('NETWORK_CONTROL');

  return {
    network,
    enabled: network.enabled,
    status: network.status,
    currentSsid: network.currentSsid,
    signalStrength: network.signalStrength,
    isMetered: network.isMetered,
    ipAddress: network.ipAddress,
    gateway: network.gateway,
    dns: network.dns,
    adapterName: network.adapterName,
    macAddress: network.macAddress,
    networks: network.networks,
    isScanning: network.isScanning,
    readCapability,
    controlCapability,
    isControlAvailable: controlCapability.status === 'AVAILABLE',
    setWifiEnabled,
    connectToNetwork,
    disconnectNetwork,
    scanNetworks,
  };
};

/**
 * Audio Output Hook
 */
export const useAudioOutput = () => {
  const {
    audio,
    getCapability,
    setVolume,
    setIsMuted,
    toggleMute,
    setActiveAudioDevice,
    toggleSpatialAudio,
  } = useSystemBridge();

  const audioCapability = getCapability('AUDIO_CONTROL');

  return {
    audio,
    volume: audio.volume,
    isMuted: audio.isMuted,
    activeDeviceId: audio.activeDeviceId,
    devices: audio.devices,
    spatialAudio: audio.spatialAudio,
    soundEnhancements: audio.soundEnhancements,
    audioCapability,
    isControlAvailable: audioCapability.status === 'AVAILABLE',
    setVolume,
    setIsMuted,
    toggleMute,
    setActiveAudioDevice,
    toggleSpatialAudio,
  };
};

/**
 * Power Status Hook
 */
export const usePowerStatus = () => {
  const {
    power,
    getCapability,
    setBatteryLevel,
    setIsCharging,
    setPowerPlan,
    setBatterySaver,
  } = useSystemBridge();

  const powerCapability = getCapability('POWER_READ');

  return {
    power,
    batteryLevel: power.batteryLevel,
    isCharging: power.isCharging,
    powerPlan: power.powerPlan,
    batterySaverActive: power.batterySaverActive,
    healthPercentage: power.healthPercentage,
    cycleCount: power.cycleCount,
    temperatureDisplay: power.temperatureDisplay,
    estimatedTimeLeft: power.estimatedTimeLeft,
    powerCapability,
    isPowerAvailable: powerCapability.status === 'AVAILABLE',
    setBatteryLevel,
    setIsCharging,
    setPowerPlan,
    setBatterySaver,
  };
};

/**
 * Quick Settings Hook
 */
export const useQuickSettings = () => {
  const {
    quickSettings,
    toggleQuickSetting,
    setQuickSettingValue,
    setScreenBrightness,
    setFocusAssist,
    setProjectMode,
  } = useSystemBridge();

  return {
    quickSettings,
    toggleQuickSetting,
    setQuickSettingValue,
    setScreenBrightness,
    setFocusAssist,
    setProjectMode,
  };
};

/**
 * Windows Notifications Hook
 */
export const useWindowsNotifications = () => {
  const {
    notifications,
    unreadNotificationCount,
    getCapability,
    dismissNotification,
    clearAllNotifications,
    markNotificationAsRead,
    sendNotificationReply,
    addNotification,
  } = useSystemBridge();

  const notifCapability = getCapability('NOTIFICATION_CONTROL');

  return {
    notifications,
    unreadNotificationCount,
    hasUnread: unreadNotificationCount > 0,
    notifCapability,
    isControlAvailable: notifCapability.status === 'AVAILABLE',
    dismissNotification,
    clearAllNotifications,
    markNotificationAsRead,
    sendNotificationReply,
    addNotification,
  };
};

/**
 * System Calendar Hook
 */
export const useSystemCalendar = () => {
  const {
    calendarEvents,
    getCapability,
    addCalendarEvent,
    deleteCalendarEvent,
  } = useSystemBridge();

  const calendarCapability = getCapability('CALENDAR_READ');

  return {
    calendarEvents,
    calendarCapability,
    isAvailable: calendarCapability.status === 'AVAILABLE',
    addCalendarEvent,
    deleteCalendarEvent,
  };
};
