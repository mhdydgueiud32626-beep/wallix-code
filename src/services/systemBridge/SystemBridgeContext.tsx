import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SystemBridgeContextType,
  NetworkState,
  AudioState,
  PowerState,
  QuickSettingsState,
  NotificationItem,
  CalendarEventItem,
  PowerPlanMode,
  FocusAssistMode,
  ProjectDisplayMode,
  NearbyNetworkItem,
  HostMode,
  CapabilityMap,
  HostCapabilityName,
  CapabilityDescriptor,
  ActionResult,
  AuditLogEntry,
  ProviderSource,
} from './types';
import { HostBridgeService } from './HostBridgeService';

const STORAGE_KEYS = {
  NETWORK: 'wallix_bridge_network_v2',
  AUDIO: 'wallix_bridge_audio_v2',
  POWER: 'wallix_bridge_power_v2',
  QUICK_SETTINGS: 'wallix_bridge_quick_settings_v2',
  NOTIFICATIONS: 'wallix_bridge_notifications_v2',
  CALENDAR: 'wallix_bridge_calendar_v2',
};

const DEFAULT_NEARBY_NETWORKS: NearbyNetworkItem[] = [
  { id: 'net-1', ssid: 'Starlight_Corp_5G', is5G: true, isLocked: true, signal: 'high', security: 'WPA3-Enterprise', frequency: '5 GHz', channel: 36, macAddress: 'F0:2F:74:91:AA:01' },
  { id: 'net-2', ssid: 'Cafe_Neon_5G', is5G: true, isLocked: true, signal: 'high', security: 'WPA2-Personal', frequency: '5 GHz', channel: 48, macAddress: '88:DE:A9:3B:5C:10' },
  { id: 'net-3', ssid: 'Synth_Hub_Guest', is5G: false, isLocked: false, signal: 'medium', security: 'Open', frequency: '2.4 GHz', channel: 6, macAddress: '00:1A:2B:3C:4D:5E' },
  { id: 'net-4', ssid: 'Azure_Network_5G', is5G: true, isLocked: true, signal: 'high', security: 'WPA3-Personal', frequency: '5 GHz', channel: 149, macAddress: 'E4:A7:A0:88:99:BB' },
  { id: 'net-5', ssid: 'The_Terminal_IoT', is5G: false, isLocked: true, signal: 'low', security: 'WPA2-Personal', frequency: '2.4 GHz', channel: 11, macAddress: 'AC:84:C6:12:34:56' },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    appId: 'messages',
    appName: 'iMessage',
    appIconCategory: 'messages',
    title: 'Sarah Jenkins',
    message: 'Hey, did you finish the new Wallix glass UI design for Windows?',
    timestamp: '12m ago',
    read: false,
    priority: 'high',
    actions: [
      { id: 'reply', label: 'Reply', actionType: 'reply' },
      { id: 'dismiss', label: 'Dismiss', actionType: 'dismiss' },
    ],
  },
  {
    id: 'notif-2',
    appId: 'reminders',
    appName: 'Reminders',
    appIconCategory: 'reminders',
    title: 'Design Review Deadline',
    message: 'Product sync & Sequoia top capsule design check at 5:00 PM today.',
    timestamp: '45m ago',
    read: false,
    priority: 'normal',
    actions: [
      { id: 'complete', label: 'Mark as Completed', actionType: 'dismiss' },
    ],
  },
  {
    id: 'notif-3',
    appId: 'calendar',
    appName: 'Calendar',
    appIconCategory: 'calendar',
    title: 'Upcoming: Design Systems Review',
    message: 'In 30 minutes with the Engineering Architecture team (Room 4B).',
    timestamp: '1h ago',
    read: true,
    priority: 'normal',
  },
  {
    id: 'notif-4',
    appId: 'system',
    appName: 'Windows Security',
    appIconCategory: 'security',
    title: 'System Protected',
    message: 'Virus & threat protection definition updates are up to date.',
    timestamp: '3h ago',
    read: true,
    priority: 'low',
  },
];

const DEFAULT_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: 'evt-1',
    title: 'Wallix Core Sprint Review',
    time: '10:00 AM',
    endTime: '11:00 AM',
    location: 'Microsoft Teams / Room 4A',
    category: 'work',
    color: '#38bdf8',
  },
  {
    id: 'evt-2',
    title: 'UI Liquid Glass Sync',
    time: '2:30 PM',
    endTime: '3:15 PM',
    location: 'Design Studio B',
    category: 'work',
    color: '#818cf8',
  },
  {
    id: 'evt-3',
    title: 'Evening Run & Workout',
    time: '6:30 PM',
    endTime: '7:30 PM',
    location: 'City Park Fitness',
    category: 'personal',
    color: '#34d399',
  },
];

const SystemBridgeContext = createContext<SystemBridgeContextType | null>(null);

export const SystemBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bridge = useRef(HostBridgeService.getInstance()).current;

  // Host and Capability Discovery State
  const [hostMode, setHostModeState] = useState<HostMode>(() => bridge.getHostMode());
  const [capabilities, setCapabilities] = useState<CapabilityMap>(() => bridge.getCapabilities());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => bridge.getAuditLogs());

  // Provider Source determination
  const providerSource: ProviderSource = 
    hostMode === 'WINDOWS_HOST_BRIDGE' || hostMode === 'WINDOWS_NATIVE_DESKTOP'
      ? 'REAL_WINDOWS'
      : hostMode === 'MOCK_DEVELOPMENT'
      ? 'MOCK'
      : hostMode === 'WEB_ONLY'
      ? 'HOST_BRIDGE'
      : 'UNAVAILABLE';

  // 1. Network State
  const [network, setNetwork] = useState<NetworkState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NETWORK);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      status: 'connected',
      currentSsid: 'Starlight_Corp_5G',
      signalStrength: 'high',
      isMetered: false,
      ipAddress: '192.168.1.142',
      gateway: '192.168.1.1',
      dns: '1.1.1.1, 8.8.8.8',
      adapterName: 'Intel(R) Wi-Fi 6E AX211 160MHz',
      macAddress: '3C:E9:0E:8F:A1:6D',
      networks: DEFAULT_NEARBY_NETWORKS,
      isScanning: false,
    };
  });

  // 2. Audio State
  const [audio, setAudio] = useState<AudioState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIO);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      volume: 75,
      isMuted: false,
      activeDeviceId: 'speakers',
      devices: [
        { id: 'speakers', name: 'Realtek High Definition Audio (Built-in)', type: 'speakers', isDefault: true, sampleRate: '48.0 kHz', bitDepth: '24-bit' },
        { id: 'airpods', name: 'AirPods Pro (Bluetooth Stereo)', type: 'headphones', isDefault: false, sampleRate: '44.1 kHz', bitDepth: '16-bit' },
        { id: 'hdmi', name: 'Dell UltraSharp 4K Display (Intel Display Audio)', type: 'hdmi', isDefault: false, sampleRate: '48.0 kHz', bitDepth: '24-bit' },
      ],
      spatialAudio: true,
      soundEnhancements: true,
    };
  });

  // 3. Power State
  const [power, setPower] = useState<PowerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POWER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      batteryLevel: 89,
      isCharging: false,
      chargingTimeRemaining: null,
      dischargingTimeRemaining: 340,
      powerPlan: 'balanced',
      batterySaverActive: false,
      healthPercentage: 98,
      cycleCount: 142,
      temperatureDisplay: '31°C / Normal',
      estimatedTimeLeft: '5 hrs 40 mins remaining',
    };
  });

  // 4. Quick Settings State
  const [quickSettings, setQuickSettings] = useState<QuickSettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUICK_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      wifi: true,
      bluetooth: true,
      bluetoothDevices: [
        { id: 'bt-1', name: 'AirPods Pro', connected: true, type: 'audio', batteryPercentage: 92 },
        { id: 'bt-2', name: 'MX Master 3S Mouse', connected: true, type: 'input', batteryPercentage: 85 },
        { id: 'bt-3', name: 'Keychron K3 Pro Keyboard', connected: true, type: 'input', batteryPercentage: 78 },
      ],
      nightLight: false,
      nightLightIntensity: 45,
      focusAssist: 'priority_only',
      airplaneMode: false,
      mobileHotspot: false,
      nearbySharing: true,
      projectMode: 'pc_screen_only',
      screenBrightness: 85,
      keyboardBacklight: true,
      trueTone: true,
      darkMode: true,
      liveSyncHealth: 'optimal',
    };
  });

  // 5. Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  // 6. Calendar Events State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CALENDAR_EVENTS;
  });

  // Initialize bridge and capability discovery on startup
  useEffect(() => {
    bridge.initialize().then((caps) => {
      setCapabilities(caps);
      setHostModeState(bridge.getHostMode());
      setAuditLogs(bridge.getAuditLogs());
    });
  }, [bridge]);

  // Subscribe to host events via bridge
  useEffect(() => {
    const unsubAudio = bridge.subscribe('audio.volume.changed', (evt) => {
      if (evt.payload && typeof evt.payload === 'object') {
        const p = evt.payload as any;
        if (typeof p.volume === 'number') {
          setAudio((prev) => ({ ...prev, volume: p.volume }));
        }
      }
    });

    const unsubNetwork = bridge.subscribe('network.connection.changed', (evt) => {
      if (evt.payload && typeof evt.payload === 'object') {
        const p = evt.payload as any;
        if (typeof p.status === 'string') {
          setNetwork((prev) => ({ ...prev, status: p.status, enabled: p.status !== 'disconnected' }));
        }
      }
    });

    return () => {
      unsubAudio();
      unsubNetwork();
    };
  }, [bridge]);

  // Real Browser Battery API detection (if available)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((batteryObj: any) => {
        const updateBattery = () => {
          const level = Math.round(batteryObj.level * 100);
          const charging = Boolean(batteryObj.charging);
          setPower((prev) => ({
            ...prev,
            batteryLevel: level,
            isCharging: charging,
            estimatedTimeLeft: charging 
              ? 'Fast charging connected' 
              : `${Math.round(batteryObj.dischargingTime / 60 || 320)} mins remaining`,
          }));
        };

        updateBattery();
        batteryObj.addEventListener('levelchange', updateBattery);
        batteryObj.addEventListener('chargingchange', updateBattery);

        return () => {
          batteryObj.removeEventListener('levelchange', updateBattery);
          batteryObj.removeEventListener('chargingchange', updateBattery);
        };
      }).catch(() => {});
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(network)); } catch {}
  }, [network]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(audio)); } catch {}
  }, [audio]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.POWER, JSON.stringify(power)); } catch {}
  }, [power]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.QUICK_SETTINGS, JSON.stringify(quickSettings)); } catch {}
  }, [quickSettings]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); } catch {}
  }, [notifications]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarEvents)); } catch {}
  }, [calendarEvents]);

  // Capability checks
  const getCapability = useCallback((name: HostCapabilityName): CapabilityDescriptor => {
    return bridge.getCapability(name);
  }, [bridge]);

  const isCapabilityAvailable = useCallback((name: HostCapabilityName): boolean => {
    return bridge.isCapabilityAvailable(name);
  }, [bridge]);

  const setHostMode = useCallback(async (mode: HostMode) => {
    const caps = await bridge.setHostMode(mode);
    setCapabilities(caps);
    setHostModeState(mode);
    setAuditLogs(bridge.getAuditLogs());
  }, [bridge]);

  // Network Actions crossing Host Boundary
  const setWifiEnabled = useCallback(async (enabled: boolean): Promise<ActionResult> => {
    const res = await bridge.executeAction('WIFI_TOGGLE', { enabled }, 'NETWORK_CONTROL');
    if (res.success || hostMode === 'MOCK_DEVELOPMENT') {
      setNetwork((prev) => ({
        ...prev,
        enabled,
        status: enabled ? 'connected' : 'disconnected',
      }));
      setQuickSettings((prev) => ({ ...prev, wifi: enabled }));
    }
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge, hostMode]);

  const connectToNetwork = useCallback(async (ssid: string, password?: string): Promise<ActionResult> => {
    setNetwork((prev) => ({ ...prev, status: 'connecting' }));
    const res = await bridge.executeAction('WIFI_CONNECT', { ssid, password }, 'NETWORK_CONTROL');
    if (res.success || hostMode === 'MOCK_DEVELOPMENT') {
      setNetwork((prev) => {
        const match = prev.networks.find((n) => n.ssid === ssid);
        return {
          ...prev,
          enabled: true,
          status: 'connected',
          currentSsid: ssid,
          signalStrength: match ? match.signal : 'high',
        };
      });
    }
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge, hostMode]);

  const disconnectNetwork = useCallback(async (): Promise<ActionResult> => {
    const res = await bridge.executeAction('WIFI_DISCONNECT', {}, 'NETWORK_CONTROL');
    if (res.success || hostMode === 'MOCK_DEVELOPMENT') {
      setNetwork((prev) => ({
        ...prev,
        status: 'disconnected',
        currentSsid: '',
      }));
    }
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge, hostMode]);

  const scanNetworks = useCallback(async (): Promise<ActionResult> => {
    setNetwork((prev) => ({ ...prev, isScanning: true }));
    const res = await bridge.executeAction('NETWORK_REFRESH', {}, 'NETWORK_READ');
    setNetwork((prev) => ({ ...prev, isScanning: false }));
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  // Audio Actions crossing Host Boundary
  const setVolume = useCallback(async (val: number | ((prev: number) => number)): Promise<ActionResult> => {
    let targetVol = 0;
    setAudio((prev) => {
      const nextVal = typeof val === 'function' ? val(prev.volume) : val;
      targetVol = Math.max(0, Math.min(100, nextVal));
      return {
        ...prev,
        volume: targetVol,
        isMuted: targetVol === 0 ? true : prev.isMuted && targetVol > 0 ? false : prev.isMuted,
      };
    });

    const res = await bridge.executeAction('AUDIO_SET_VOLUME', { volume: targetVol }, 'AUDIO_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const setIsMuted = useCallback(async (val: boolean | ((prev: boolean) => boolean)): Promise<ActionResult> => {
    let nextMuted = false;
    setAudio((prev) => {
      nextMuted = typeof val === 'function' ? val(prev.isMuted) : val;
      return { ...prev, isMuted: nextMuted };
    });

    const res = await bridge.executeAction('AUDIO_SET_MUTE', { muted: nextMuted }, 'AUDIO_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const toggleMute = useCallback(async (): Promise<ActionResult> => {
    return setIsMuted((prev) => !prev);
  }, [setIsMuted]);

  const setActiveAudioDevice = useCallback(async (deviceId: string): Promise<ActionResult> => {
    setAudio((prev) => ({ ...prev, activeDeviceId: deviceId }));
    const res = await bridge.executeAction('AUDIO_SELECT_OUTPUT', { deviceId }, 'AUDIO_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const toggleSpatialAudio = useCallback(() => {
    setAudio((prev) => ({ ...prev, spatialAudio: !prev.spatialAudio }));
  }, []);

  // Power Actions
  const setBatteryLevel = useCallback((val: number | ((prev: number) => number)) => {
    setPower((prev) => {
      const nextVal = typeof val === 'function' ? val(prev.batteryLevel) : val;
      return { ...prev, batteryLevel: Math.max(0, Math.min(100, nextVal)) };
    });
  }, []);

  const setIsCharging = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setPower((prev) => {
      const nextVal = typeof val === 'function' ? val(prev.isCharging) : val;
      return {
        ...prev,
        isCharging: nextVal,
        estimatedTimeLeft: nextVal ? 'Power Adapter (Charging)' : `${Math.round(prev.batteryLevel * 3.8)} mins remaining`,
      };
    });
  }, []);

  const setPowerPlan = useCallback(async (plan: PowerPlanMode): Promise<ActionResult> => {
    setPower((prev) => ({
      ...prev,
      powerPlan: plan,
      batterySaverActive: plan === 'power_saver',
    }));
    const res = await bridge.executeAction('ENERGY_SAVER_TOGGLE', { plan }, 'POWER_READ');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const setBatterySaver = useCallback(async (active: boolean): Promise<ActionResult> => {
    setPower((prev) => ({
      ...prev,
      batterySaverActive: active,
      powerPlan: active ? 'power_saver' : prev.powerPlan === 'power_saver' ? 'balanced' : prev.powerPlan,
    }));
    const res = await bridge.executeAction('ENERGY_SAVER_TOGGLE', { active }, 'POWER_READ');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  // Quick Settings Actions
  const toggleQuickSetting = useCallback((key: keyof QuickSettingsState) => {
    setQuickSettings((prev) => {
      const curr = prev[key];
      if (typeof curr === 'boolean') {
        const nextBool = !curr;
        if (key === 'wifi') {
          setWifiEnabled(nextBool);
        }
        return { ...prev, [key]: nextBool };
      }
      return prev;
    });
  }, [setWifiEnabled]);

  const setQuickSettingValue = useCallback(<K extends keyof QuickSettingsState>(key: K, value: QuickSettingsState[K]) => {
    setQuickSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setScreenBrightness = useCallback((brightness: number) => {
    setQuickSettings((prev) => ({
      ...prev,
      screenBrightness: Math.max(10, Math.min(100, brightness)),
    }));
  }, []);

  const setFocusAssist = useCallback((mode: FocusAssistMode) => {
    setQuickSettings((prev) => ({ ...prev, focusAssist: mode }));
  }, []);

  const setProjectMode = useCallback((mode: ProjectDisplayMode) => {
    setQuickSettings((prev) => ({ ...prev, projectMode: mode }));
  }, []);

  // Notification Actions crossing Host Boundary
  const dismissNotification = useCallback(async (id: string): Promise<ActionResult> => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const res = await bridge.executeAction('NOTIFICATION_DISMISS', { notificationId: id }, 'NOTIFICATION_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const clearAllNotifications = useCallback(async (): Promise<ActionResult> => {
    setNotifications([]);
    const res = await bridge.executeAction('NOTIFICATION_DISMISS_ALL', {}, 'NOTIFICATION_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const sendNotificationReply = useCallback(async (id: string, text: string): Promise<ActionResult> => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, message: `You: ${text}`, read: true } : n))
    );
    const res = await bridge.executeAction('NOTIFICATION_OPEN', { notificationId: id, replyText: text }, 'NOTIFICATION_CONTROL');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Calendar Actions crossing Host Boundary
  const addCalendarEvent = useCallback(async (event: Omit<CalendarEventItem, 'id'>): Promise<ActionResult> => {
    const newEvent: CalendarEventItem = {
      ...event,
      id: `evt-${Date.now()}`,
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    const res = await bridge.executeAction('CALENDAR_SELECT_DATE', { event: newEvent }, 'CALENDAR_READ');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const deleteCalendarEvent = useCallback(async (id: string): Promise<ActionResult> => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    const res = await bridge.executeAction('CALENDAR_REFRESH', { deletedId: id }, 'CALENDAR_READ');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const openWindowsSettings = useCallback(async (subpage?: string): Promise<ActionResult> => {
    const res = await bridge.executeAction('NETWORK_OPEN_SETTINGS', { subpage }, 'NETWORK_READ');
    setAuditLogs(bridge.getAuditLogs());
    return res;
  }, [bridge]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;
  const isNativeBridgeConnected = hostMode === 'WINDOWS_HOST_BRIDGE' || hostMode === 'WINDOWS_NATIVE_DESKTOP';

  const value: SystemBridgeContextType = {
    hostMode,
    bridgeVersion: bridge.getVersion(),
    capabilities,
    providerSource,
    auditLogs,
    setHostMode,
    getCapability,
    isCapabilityAvailable,

    network,
    audio,
    power,
    quickSettings,
    notifications,
    calendarEvents,
    unreadNotificationCount,
    isNativeBridgeConnected,

    setWifiEnabled,
    connectToNetwork,
    disconnectNetwork,
    scanNetworks,

    setVolume,
    setIsMuted,
    toggleMute,
    setActiveAudioDevice,
    toggleSpatialAudio,

    setBatteryLevel,
    setIsCharging,
    setPowerPlan,
    setBatterySaver,

    toggleQuickSetting,
    setQuickSettingValue,
    setScreenBrightness,
    setFocusAssist,
    setProjectMode,

    dismissNotification,
    clearAllNotifications,
    markNotificationAsRead,
    sendNotificationReply,
    addNotification,

    addCalendarEvent,
    deleteCalendarEvent,

    openWindowsSettings,
  };

  return (
    <SystemBridgeContext.Provider value={value}>
      {children}
    </SystemBridgeContext.Provider>
  );
};

export const useSystemBridge = (): SystemBridgeContextType => {
  const context = useContext(SystemBridgeContext);
  if (!context) {
    throw new Error('useSystemBridge must be used within a SystemBridgeProvider');
  }
  return context;
};
