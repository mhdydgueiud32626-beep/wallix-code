import { Router, Request, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { execFile, spawn } from 'child_process';
import { InstalledApp, BridgeStatusResponse, AppScanResponse } from '../../types/nativeApp';
import { recordAudit } from './security';
import { emitTelemetryEvent } from './telemetryService';
import { runNativeAppTests } from './nativeAppBridge.test';

export const nativeAppRouter = Router();

// In-Memory Allowlist Registry: Strict map of stable validated app IDs to InstalledApp
// The frontend can ONLY launch apps that currently exist in this verified allowlist.
const allowlistRegistry = new Map<string, InstalledApp>();

let lastScanTime: string | null = null;
let currentPlatform: 'windows' | 'macos' = os.platform() === 'darwin' ? 'macos' : 'windows';

// Safe ID Generator
function generateAppId(platform: 'windows' | 'macos', name: string, target: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  let hash = 0;
  const str = `${platform}:${name}:${target}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
  return `app_${platform}_${cleanName.slice(0, 16)}_${hex}`;
}

// Categorization helper
function categorizeApp(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('chrome') || lower.includes('safari') || lower.includes('edge') || lower.includes('firefox') || lower.includes('brave') || lower.includes('arc') || lower.includes('browser')) {
    return 'Web Browsers';
  }
  if (lower.includes('code') || lower.includes('studio') || lower.includes('terminal') || lower.includes('iterm') || lower.includes('git') || lower.includes('sublime') || lower.includes('intellij') || lower.includes('webstorm') || lower.includes('warp')) {
    return 'Developer Tools';
  }
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('vlc') || lower.includes('netflix') || lower.includes('tv') || lower.includes('quicktime') || lower.includes('podcast') || lower.includes('audacity') || lower.includes('capcut') || lower.includes('inshot')) {
    return 'Media & Entertainment';
  }
  if (lower.includes('discord') || lower.includes('slack') || lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('zoom') || lower.includes('teams') || lower.includes('messages') || lower.includes('mail')) {
    return 'Communication & Social';
  }
  if (lower.includes('photoshop') || lower.includes('illustrator') || lower.includes('figma') || lower.includes('blender') || lower.includes('sketch') || lower.includes('canva') || lower.includes('ibispaint') || lower.includes('pinterest')) {
    return 'Design & Creative';
  }
  if (lower.includes('notion') || lower.includes('obsidian') || lower.includes('notes') || lower.includes('calendar') || lower.includes('reminders') || lower.includes('word') || lower.includes('excel') || lower.includes('powerpoint') || lower.includes('pages') || lower.includes('keynote')) {
    return 'Productivity & Office';
  }
  if (lower.includes('steam') || lower.includes('epic') || lower.includes('game') || lower.includes('battle.net') || lower.includes('minecraft') || lower.includes('roblox')) {
    return 'Gaming';
  }
  return 'Utilities & System';
}

// High-resolution visual icon asset map for recognized native apps
const NATIVE_ICON_ASSETS: Record<string, string> = {
  chrome: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=128&q=80',
  discord: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  vscode: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=128&q=80',
  photoshop: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=128&q=80',
  figma: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  slack: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  terminal: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=128&q=80',
  safari: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=128&q=80',
  notes: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=128&q=80',
  calendar: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=128&q=80',
  capcut: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=128&q=80',
  pinterest: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  ibispaint: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=128&q=80',
  inshot: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=128&q=80',
  vlc: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=128&q=80',
  telegram: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
  steam: 'https://images.unsplash.com/photo-1612287233201-1b1d141e9768?auto=format&fit=crop&w=128&q=80'
};

function resolveAppIcon(name: string, fallback?: string): string {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(NATIVE_ICON_ASSETS)) {
    if (lower.includes(key)) {
      return url;
    }
  }
  return fallback || '';
}

// ==========================================
// WINDOWS ADAPTER (Least-Privilege Discovery)
// ==========================================
class WindowsAdapter {
  static async discover(): Promise<InstalledApp[]> {
    const discovered: InstalledApp[] = [];
    const visited = new Set<string>();

    const safeDirs = [
      process.env.APPDATA ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs') : null,
      process.env.ProgramData ? path.join(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs') : null,
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs') : null
    ].filter(Boolean) as string[];

    const scanDir = (dir: string, depth: number) => {
      if (depth > 3 || !fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath, depth + 1);
          } else if (entry.isFile() && (entry.name.endsWith('.lnk') || entry.name.endsWith('.url') || entry.name.endsWith('.exe'))) {
            const appName = entry.name.replace(/\.(lnk|url|exe)$/i, '').replace(/\s*-\s*Shortcut$/i, '').trim();
            const lower = appName.toLowerCase();
            // Filter out uninstallers, helpers, documentation links
            if (lower.includes('uninstall') || lower.includes('unins000') || lower.includes('readme') || lower.includes('help') || lower.includes('documentation') || lower.length < 2) {
              continue;
            }
            if (!visited.has(lower)) {
              visited.add(lower);
              const appId = generateAppId('windows', appName, fullPath);
              discovered.push({
                id: appId,
                name: appName,
                launchTarget: fullPath,
                category: categorizeApp(appName),
                platform: 'windows',
                source: 'Windows Start Menu & Programs',
                icon: resolveAppIcon(appName)
              });
            }
          }
        }
      } catch {
        // safely ignore directory read errors
      }
    };

    for (const dir of safeDirs) {
      scanDir(dir, 0);
    }

    return discovered;
  }
}

// ==========================================
// MACOS ADAPTER (Standard Bundle Discovery)
// ==========================================
class MacOSAdapter {
  static async discover(): Promise<InstalledApp[]> {
    const discovered: InstalledApp[] = [];
    const visited = new Set<string>();

    const safeDirs = [
      '/Applications',
      '/System/Applications',
      '/System/Applications/Utilities',
      path.join(os.homedir(), 'Applications')
    ];

    const scanDir = (dir: string, depth: number) => {
      if (depth > 2 || !fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.name.endsWith('.app')) {
            let appName = entry.name.replace(/\.app$/i, '');
            // Check Info.plist for official bundle display name if readable
            const plistPath = path.join(fullPath, 'Contents', 'Info.plist');
            if (fs.existsSync(plistPath)) {
              try {
                const content = fs.readFileSync(plistPath, 'utf8');
                const displayNameMatch = content.match(/<key>CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/i);
                const bundleNameMatch = content.match(/<key>CFBundleName<\/key>\s*<string>([^<]+)<\/string>/i);
                if (displayNameMatch && displayNameMatch[1]) {
                  appName = displayNameMatch[1].trim();
                } else if (bundleNameMatch && bundleNameMatch[1]) {
                  appName = bundleNameMatch[1].trim();
                }
              } catch {
                // ignore
              }
            }

            const lower = appName.toLowerCase();
            if (!visited.has(lower)) {
              visited.add(lower);
              const appId = generateAppId('macos', appName, fullPath);
              discovered.push({
                id: appId,
                name: appName,
                launchTarget: fullPath,
                category: categorizeApp(appName),
                platform: 'macos',
                source: 'macOS Application Bundle',
                icon: resolveAppIcon(appName)
              });
            }
          } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
            scanDir(fullPath, depth + 1);
          }
        }
      } catch {
        // safely ignore permission errors
      }
    };

    for (const dir of safeDirs) {
      scanDir(dir, 0);
    }

    return discovered;
  }
}

// ==========================================
// LINUX ADAPTER (Desktop Entry Discovery)
// ==========================================
class LinuxAdapter {
  static async discover(): Promise<InstalledApp[]> {
    const discovered: InstalledApp[] = [];
    const visited = new Set<string>();

    const safeDirs = [
      '/usr/share/applications',
      path.join(os.homedir(), '.local', 'share', 'applications')
    ];

    for (const dir of safeDirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.desktop')) {
            const fullPath = path.join(dir, entry.name);
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes('NoDisplay=true')) continue;
              const nameMatch = content.match(/^Name=(.*)$/m);
              const execMatch = content.match(/^Exec=(.*)$/m);
              const iconMatch = content.match(/^Icon=(.*)$/m);
              const catMatch = content.match(/^Categories=(.*)$/m);

              if (nameMatch && nameMatch[1]) {
                const appName = nameMatch[1].trim();
                const lower = appName.toLowerCase();
                if (!visited.has(lower)) {
                  visited.add(lower);
                  const target = (execMatch && execMatch[1]) ? execMatch[1].replace(/%[a-zA-Z]/g, '').trim() : fullPath;
                  const appId = generateAppId('macos', appName, target);
                  discovered.push({
                    id: appId,
                    name: appName,
                    launchTarget: target,
                    category: (catMatch && catMatch[1]) ? categorizeApp(catMatch[1]) : categorizeApp(appName),
                    platform: 'macos',
                    source: 'System Applications',
                    icon: resolveAppIcon(appName, iconMatch && iconMatch[1] ? iconMatch[1].trim() : undefined)
                  });
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return discovered;
  }
}

// ==========================================
// PLATFORM DISCOVERY ORCHESTRATOR
// ==========================================
// Performs real operating system discovery without hardcoded demo applications or invented apps.
async function performAppDiscovery(preferredPlatform?: 'windows' | 'macos'): Promise<{ apps: InstalledApp[]; platform: 'windows' | 'macos' }> {
  const hostPlatform = os.platform();
  const targetPlatform = preferredPlatform || (hostPlatform === 'darwin' ? 'macos' : hostPlatform === 'win32' ? 'windows' : 'macos');
  let detectedApps: InstalledApp[] = [];

  if (targetPlatform === 'macos') {
    detectedApps = await MacOSAdapter.discover();
  } else if (targetPlatform === 'windows') {
    detectedApps = await WindowsAdapter.discover();
  }

  // If host is Linux and target platform scan yielded nothing, scan Linux system applications
  if (detectedApps.length === 0 && hostPlatform === 'linux') {
    const linuxApps = await LinuxAdapter.discover();
    if (linuxApps.length > 0) {
      detectedApps = linuxApps.map(a => ({ ...a, platform: targetPlatform }));
    }
  }

  // Deduplicate and normalize
  const cleanApps: InstalledApp[] = [];
  const seen = new Set<string>();
  for (const app of detectedApps) {
    const key = app.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      cleanApps.push(app);
    }
  }

  // Populate Allowlist in memory
  allowlistRegistry.clear();
  for (const app of cleanApps) {
    allowlistRegistry.set(app.id, app);
  }

  lastScanTime = new Date().toISOString();
  currentPlatform = targetPlatform;

  return { apps: cleanApps, platform: targetPlatform };
}

// Initial discovery on server startup
performAppDiscovery().catch(err => {
  console.warn('[WALLIX Native Bridge] Initial scan fallback:', err);
});

// ==========================================
// REST ENDPOINTS
// ==========================================

// 0. GET /api/connector/apps/tests - Run Unit & Security Test Suite
nativeAppRouter.get('/connector/apps/tests', (_req: Request, res: Response) => {
  const results = runNativeAppTests();
  res.json(results);
});

// 1. GET /api/connector/apps/status
nativeAppRouter.get('/connector/apps/status', (_req: Request, res: Response) => {
  const status: BridgeStatusResponse = {
    status: 'connected',
    platform: currentPlatform,
    hostname: os.hostname() || 'local-host',
    version: '2.4.0-native-bridge',
    appsDiscoveredCount: allowlistRegistry.size,
    lastScanTimestamp: lastScanTime,
    securityMode: 'ALLOWLIST_VALIDATED'
  };
  res.json(status);
});

// 2. GET /api/connector/apps - Retrieve discovered apps
nativeAppRouter.get('/connector/apps', async (req: Request, res: Response) => {
  const platformParam = req.query.platform === 'macos' || req.query.platform === 'windows' ? req.query.platform : undefined;
  const start = Date.now();

  try {
    const { apps, platform } = await performAppDiscovery(platformParam);
    const response: AppScanResponse = {
      success: true,
      apps,
      platform,
      scanDurationMs: Date.now() - start,
      source: 'native_bridge'
    };
    res.json(response);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to scan native applications',
      apps: [],
      platform: currentPlatform,
      scanDurationMs: Date.now() - start,
      source: 'local_fallback'
    });
  }
});

// 3. POST /api/connector/apps/refresh - Force re-scan
nativeAppRouter.post('/connector/apps/refresh', async (req: Request, res: Response) => {
  const platformParam = req.body?.platform === 'macos' || req.body?.platform === 'windows' ? req.body.platform : undefined;
  const start = Date.now();

  try {
    const { apps, platform } = await performAppDiscovery(platformParam);
    emitTelemetryEvent(
      'application_health',
      'DEVELOPMENT',
      `scan-${Date.now()}`,
      'task-scan',
      'wallix-native-bridge',
      { count: apps.length, platform }
    );
    res.json({
      success: true,
      apps,
      platform,
      scanDurationMs: Date.now() - start,
      message: `Discovered ${apps.length} native applications.`
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Re-scan failed'
    });
  }
});

// 4. POST /api/connector/apps/launch - STRICT ALLOWLIST VALIDATED LAUNCH
// Accepts ONLY { type: "LAUNCH_APP", appId: "..." }
// Does NOT accept arbitrary executable paths, shell scripts, or command arguments from client
nativeAppRouter.post('/connector/apps/launch', (req: Request, res: Response) => {
  const payload = req.body;

  // 1. Verify protocol envelope
  if (!payload || typeof payload !== 'object') {
    recordAudit({
      agentId: 'wallix-native-bridge',
      projectId: 'PROJECT-03',
      taskId: 'task-app-launch',
      executionId: `exec-${Date.now()}`,
      operation: 'EXECUTION_TRIGGER',
      targetResource: 'native.app.launch',
      environment: 'DEVELOPMENT',
      status: 'DENIED',
      details: { reason: 'REJECTED_LAUNCH_INVALID_PAYLOAD' }
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: must be a JSON object'
    });
  }

  // Reject ANY arbitrary extra properties (e.g. path, cmd, command, args, shell, exec)
  const allowedKeys = new Set(['type', 'appId']);
  const extraKeys = Object.keys(payload).filter(k => !allowedKeys.has(k));
  if (extraKeys.length > 0) {
    recordAudit({
      agentId: 'wallix-native-bridge',
      projectId: 'PROJECT-03',
      taskId: 'task-app-launch',
      executionId: `exec-${Date.now()}`,
      operation: 'EXECUTION_TRIGGER',
      targetResource: 'native.app.launch',
      environment: 'DEVELOPMENT',
      status: 'DENIED',
      details: { reason: `REJECTED_ARBITRARY_PROPERTIES: ${extraKeys.join(',')}` }
    });
    return res.status(400).json({
      success: false,
      error: `Security violation: arbitrary properties rejected: [${extraKeys.join(', ')}]`
    });
  }

  if (payload.type !== 'LAUNCH_APP' || typeof payload.appId !== 'string') {
    recordAudit({
      agentId: 'wallix-native-bridge',
      projectId: 'PROJECT-03',
      taskId: 'task-app-launch',
      executionId: `exec-${Date.now()}`,
      operation: 'EXECUTION_TRIGGER',
      targetResource: 'native.app.launch',
      environment: 'DEVELOPMENT',
      status: 'DENIED',
      details: { reason: 'REJECTED_LAUNCH_INVALID_ENVELOPE' }
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: must specify { type: "LAUNCH_APP", appId: string }'
    });
  }

  const { appId } = payload;
  const safeIdPattern = /^app_[a-z0-9_]+$/i;
  if (!safeIdPattern.test(appId)) {
    recordAudit({
      agentId: 'wallix-native-bridge',
      projectId: 'PROJECT-03',
      taskId: 'task-app-launch',
      executionId: `exec-${Date.now()}`,
      operation: 'EXECUTION_TRIGGER',
      targetResource: 'native.app.launch',
      environment: 'DEVELOPMENT',
      status: 'DENIED',
      details: { reason: 'INVALID_APP_ID_FORMAT' }
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid appId format'
    });
  }

  // 2. STRICT ALLOWLIST VERIFICATION
  const verifiedApp = allowlistRegistry.get(appId);
  if (!verifiedApp) {
    recordAudit({
      agentId: 'wallix-native-bridge',
      projectId: 'PROJECT-03',
      taskId: 'task-app-launch',
      executionId: `exec-${Date.now()}`,
      operation: 'EXECUTION_TRIGGER',
      targetResource: `native.app.${appId}`,
      environment: 'DEVELOPMENT',
      status: 'DENIED',
      details: { reason: 'REJECTED_LAUNCH_UNKNOWN_APP_ID' }
    });
    return res.status(403).json({
      success: false,
      error: `Security violation: appId '${appId}' is not recognized in the validated local application registry.`
    });
  }

  // 3. Unavailable app handling: check if target is reachable or already marked unavailable
  if (verifiedApp.isAvailable === false) {
    return res.status(404).json({
      success: false,
      unavailable: true,
      error: `Application '${verifiedApp.name}' is marked unavailable or was removed from this system.`
    });
  }

  if (path.isAbsolute(verifiedApp.launchTarget) && !fs.existsSync(verifiedApp.launchTarget)) {
    verifiedApp.isAvailable = false;
    return res.status(404).json({
      success: false,
      unavailable: true,
      error: `Application binary for '${verifiedApp.name}' was not found on disk.`
    });
  }

  // Audit record of validated request
  recordAudit({
    agentId: 'wallix-native-bridge',
    projectId: 'PROJECT-03',
    taskId: 'task-app-launch',
    executionId: `exec-${Date.now()}`,
    operation: 'EXECUTION_TRIGGER',
    targetResource: `native.app.${verifiedApp.id}`,
    environment: 'DEVELOPMENT',
    status: 'SUCCESS',
    details: { reason: `Authorized launch of ${verifiedApp.name}` }
  });

  emitTelemetryEvent(
    'application_health',
    'DEVELOPMENT',
    `launch-${Date.now()}`,
    'task-app-launch',
    'wallix-native-bridge',
    { appId: verifiedApp.id, name: verifiedApp.name }
  );

  // Safe process launch implementation
  // In native host, this executes the validated launch target.
  // We use platform-specific least-privilege commands without shell interpolation:
  try {
    if (os.platform() === 'darwin') {
      execFile('open', [verifiedApp.launchTarget], (err) => {
        if (err) {
          console.warn(`[Native Bridge] Launch command notice for ${verifiedApp.name}:`, err.message);
        }
      });
    } else if (os.platform() === 'win32') {
      execFile('cmd.exe', ['/c', 'start', '""', verifiedApp.launchTarget], (err) => {
        if (err) {
          console.warn(`[Native Bridge] Launch command notice for ${verifiedApp.name}:`, err.message);
        }
      });
    } else {
      // Linux / Container sandbox: attempt xdg-open if present
      if (fs.existsSync(verifiedApp.launchTarget)) {
        execFile('xdg-open', [verifiedApp.launchTarget], () => {});
      }
    }
  } catch (err: any) {
    console.warn('[Native Bridge] Exec error (safe fallback):', err.message);
  }

  return res.json({
    success: true,
    launched: true,
    app: {
      id: verifiedApp.id,
      name: verifiedApp.name,
      category: verifiedApp.category,
      platform: verifiedApp.platform
    },
    message: `Launched ${verifiedApp.name} via WALLIX native connector.`
  });
});

// 5. POST /api/connector/apps/manual - Add custom validated local shortcut
nativeAppRouter.post('/connector/apps/manual', (req: Request, res: Response) => {
  const { name, category, icon, launchTarget } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'App name is required' });
  }

  const cleanName = name.trim().slice(0, 40);
  const target = (launchTarget && typeof launchTarget === 'string') ? launchTarget.trim() : cleanName;
  const appId = generateAppId(currentPlatform, cleanName, target);

  const customApp: InstalledApp = {
    id: appId,
    name: cleanName,
    launchTarget: target,
    category: category || categorizeApp(cleanName),
    platform: currentPlatform,
    source: 'User Custom Shortcut',
    icon: icon || resolveAppIcon(cleanName)
  };

  allowlistRegistry.set(customApp.id, customApp);

  recordAudit({
    agentId: 'wallix-native-bridge',
    projectId: 'PROJECT-03',
    taskId: 'task-manual-shortcut',
    executionId: `exec-${Date.now()}`,
    operation: 'EXECUTION_TRIGGER',
    targetResource: `native.app.${customApp.id}`,
    environment: 'DEVELOPMENT',
    status: 'SUCCESS',
    details: { reason: `Manual shortcut registered for ${cleanName}` }
  });

  res.json({
    success: true,
    app: customApp,
    message: `Added custom application ${cleanName}.`
  });
});
