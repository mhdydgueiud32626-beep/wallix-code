import fs from 'fs';
import path from 'path';

export interface ProjectDiscoveryMetadata {
  projectId: 'PROJECT-03';
  projectName: string;
  version: string;
  buildVersion: string;
  gitRevision: string;
  summary: string;
  pages: Array<{
    id: string;
    title: string;
    route: string;
    component: string;
    description: string;
  }>;
  routes: Array<{
    path: string;
    type: 'SPA_CLIENT' | 'API_CONNECTOR' | 'SYSTEM_HEALTH';
    authRequired: boolean;
  }>;
  components: Array<{
    name: string;
    category: '3D_SHADERS' | 'CHROME_WORKSPACE' | 'WIDGETS' | 'NAVIGATION' | 'MODALS' | 'SIMULATOR';
    filePath: string;
    description: string;
  }>;
  services: Array<{
    name: string;
    scope: 'CLIENT' | 'SERVER' | 'SHARED';
    description: string;
    status: 'ACTIVE' | 'OPERATIONAL';
  }>;
  apis: Array<{
    endpoint: string;
    method: 'GET' | 'POST';
    operation: string;
    description: string;
    authRequired: boolean;
  }>;
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  tests: Array<{
    suite: string;
    type: 'TYPECHECK' | 'LINT' | 'BUILD' | 'UNIT' | 'CONNECTOR_INTEGRATION';
    command: string;
  }>;
  configurationCategories: Array<{
    category: string;
    description: string;
    keys: string[];
    secured: boolean;
  }>;
}

export function getProjectDiscoveryMetadata(): ProjectDiscoveryMetadata {
  let pkg: any = {};
  try {
    const pkgRaw = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');
    pkg = JSON.parse(pkgRaw);
  } catch {
    // fallback
  }

  return {
    projectId: 'PROJECT-03',
    projectName: 'WALLIX - 3D Wallpapers & Chrome Workspace',
    version: pkg.version || '1.0.0',
    buildVersion: '2026.09-r9',
    gitRevision: 'rev-3a9f20c',
    summary:
      'High-performance 3D Wallpaper Engine with interactive WebGL shaders, desktop simulators, and Chrome Extension Studio with locked bidirectional New Tab & Side Panel synchronization.',
    pages: [
      {
        id: 'home-dashboard',
        title: 'Home Discovery Dashboard',
        route: '/',
        component: 'HomeDashboardView',
        description: 'Primary discovery feed with Hero Carousel, featured 4K/8K wallpapers, and live tag filtering.'
      },
      {
        id: 'live-wallpapers',
        title: 'Live 3D & Shader Wallpapers',
        route: '/live',
        component: 'LiveWallpapersView',
        description: 'Interactive real-time Three.js/WebGL live wallpaper engine and fluid physics shaders.'
      },
      {
        id: 'live-studio',
        title: 'Live Wallpaper Studio',
        route: '/studio',
        component: 'LiveWallpaperStudioView',
        description: 'Custom 3D model import, lighting controls, post-processing filters, and live shader presets.'
      },
      {
        id: 'chrome-extension',
        title: 'Chrome Extension Workspace',
        route: '/chrome',
        component: 'ChromeExtensionStudioView',
        description: 'Chrome Manifest V3 New Tab & Side Panel customization engine with live storage synchronization.'
      },
      {
        id: 'community-marketplace',
        title: 'Community Marketplace',
        route: '/marketplace',
        component: 'CommunityMarketplaceView',
        description: 'User-published visual presets, color palettes, and desktop widget configurations.'
      },
      {
        id: 'collections',
        title: 'Curated Collections',
        route: '/collections',
        component: 'CollectionsView',
        description: 'Curated sets categorized by Cyberpunk, Anime, AMOLED, Nature, and Minimal themes.'
      },
      {
        id: 'downloads',
        title: 'Saved & Download History',
        route: '/downloads',
        component: 'DownloadsView',
        description: 'Local caching and download record manager for 4K/8K assets and extension zip packages.'
      }
    ],
    routes: [
      { path: '/', type: 'SPA_CLIENT', authRequired: false },
      { path: '/api/health', type: 'SYSTEM_HEALTH', authRequired: false },
      { path: '/api/connector/identity', type: 'API_CONNECTOR', authRequired: false },
      { path: '/api/connector/inspect', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/search', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/file/read', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/code/analyze', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/dependency/inspect', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/test/run', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/build/run', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/diff/preview', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/staging/apply', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/staging/rollback', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/deploy/production', type: 'API_CONNECTOR', authRequired: true },
      { path: '/api/connector/telemetry', type: 'API_CONNECTOR', authRequired: false },
      { path: '/api/connector/errors', type: 'API_CONNECTOR', authRequired: false },
      { path: '/api/connector/validate', type: 'API_CONNECTOR', authRequired: false }
    ],
    components: [
      {
        name: 'ThreeLiveWallpaper',
        category: '3D_SHADERS',
        filePath: 'src/components/LiveShaders/ThreeLiveWallpaper.tsx',
        description: 'Three.js particle field, interactive ripple effect, and vertex distortion engine.'
      },
      {
        name: 'DepthParallaxCanvas',
        category: '3D_SHADERS',
        filePath: 'src/components/LiveShaders/DepthParallaxCanvas.tsx',
        description: 'Gyroscope and pointer-driven multi-layer 2.5D depth parallax canvas renderer.'
      },
      {
        name: 'Model3DViewer',
        category: '3D_SHADERS',
        filePath: 'src/components/LiveShaders/Model3DViewer.tsx',
        description: 'Full 3D object and glTF viewer with ambient lighting and rotation damping.'
      },
      {
        name: 'ChromeNewTabPreview',
        category: 'CHROME_WORKSPACE',
        filePath: 'src/modules/chrome/ChromeNewTabPreview.tsx',
        description: 'High-fidelity simulation of Chrome New Tab with floating frosted Customize Chrome button.'
      },
      {
        name: 'ChromeControlsPanel',
        category: 'CHROME_WORKSPACE',
        filePath: 'src/modules/chrome/ChromeControlsPanel.tsx',
        description: 'Side Panel studio containing wallpaper, glass blur, dock, and theme tuning controls.'
      },
      {
        name: 'DesktopSimulatorModal',
        category: 'SIMULATOR',
        filePath: 'src/components/DesktopSimulatorModal.tsx',
        description: 'Interactive macOS Sequoia and Windows 11 desktop environment simulators.'
      },
      {
        name: 'Navbar',
        category: 'NAVIGATION',
        filePath: 'src/components/Navbar.tsx',
        description: 'Primary top bar with 3D logo, instant debounced search, and workspace quick links.'
      },
      {
        name: 'Sidebar',
        category: 'NAVIGATION',
        filePath: 'src/components/Sidebar.tsx',
        description: 'Left drawer navigation across views, categories, and marketplace.'
      }
    ],
    services: [
      {
        name: 'Project02ConnectorService',
        scope: 'SERVER',
        description: 'Controlled server-side integration boundary for PROJECT-02 autonomous agents.',
        status: 'OPERATIONAL'
      },
      {
        name: 'TelemetryService',
        scope: 'SERVER',
        description: 'Operational telemetry logger and dispatcher for agent lifecycle events.',
        status: 'ACTIVE'
      },
      {
        name: 'StagingSnapshotManager',
        scope: 'SERVER',
        description: 'Atomic file-level snapshot and rollback engine for safe staging deployments.',
        status: 'OPERATIONAL'
      },
      {
        name: 'ExtensionZipExporter',
        scope: 'CLIENT',
        description: 'Client-side JSZip builder creating installable Chrome Manifest V3 packages.',
        status: 'ACTIVE'
      },
      {
        name: 'MediaStorage',
        scope: 'SHARED',
        description: 'Client-side IndexedDB and local storage cache for custom wallpapers.',
        status: 'ACTIVE'
      }
    ],
    apis: [
      {
        endpoint: '/api/health',
        method: 'GET',
        operation: 'SYSTEM_HEALTH',
        description: 'Returns safe health status without exposing credentials or internal secrets.',
        authRequired: false
      },
      {
        endpoint: '/api/connector/identity',
        method: 'GET',
        operation: 'PROJECT_IDENTITY',
        description: 'Returns PROJECT-03 registered identity, version, environment, and git revision.',
        authRequired: false
      },
      {
        endpoint: '/api/connector/inspect',
        method: 'POST',
        operation: 'PROJECT_INSPECT',
        description: 'Provides structured application metadata, discovery manifest, and dependency map.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/search',
        method: 'POST',
        operation: 'PROJECT_SEARCH',
        description: 'Executes controlled symbol, component, API, or text search across project files.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/file/read',
        method: 'POST',
        operation: 'FILE_READ',
        description: 'Safely reads source files with content hashing and full audit trail.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/code/analyze',
        method: 'POST',
        operation: 'CODE_ANALYZE',
        description: 'Returns AST imports, exports, dependencies, and complexity indicators for a file.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/dependency/inspect',
        method: 'POST',
        operation: 'DEPENDENCY_INSPECT',
        description: 'Audits package dependencies, versions, and scripts.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/test/run',
        method: 'POST',
        operation: 'TEST_RUN',
        description: 'Triggers real execution of type-checking, linting, or test suites.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/build/run',
        method: 'POST',
        operation: 'BUILD_RUN',
        description: 'Runs build verification and outputs execution state and logs.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/diff/preview',
        method: 'POST',
        operation: 'DIFF_PREVIEW',
        description: 'Generates unified diffs and risk assessment for proposed code modifications.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/staging/apply',
        method: 'POST',
        operation: 'STAGING_APPLY',
        description: 'Applies validated change proposal to DEVELOPMENT or STAGING with automatic snapshot.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/staging/rollback',
        method: 'POST',
        operation: 'STAGING_ROLLBACK',
        description: 'Restores codebase state using a previously created snapshot ID.',
        authRequired: true
      },
      {
        endpoint: '/api/connector/deploy/production',
        method: 'POST',
        operation: 'PRODUCTION_RELEASE_GATE',
        description: 'Production release gate endpoint. Enforces PRODUCTION_GATE_REQUIRED protection.',
        authRequired: true
      }
    ],
    dependencies: {
      production: pkg.dependencies || {},
      development: pkg.devDependencies || {}
    },
    tests: [
      {
        suite: 'Type Safety Verification',
        type: 'TYPECHECK',
        command: 'tsc --noEmit'
      },
      {
        suite: 'ESLint Code Standard',
        type: 'LINT',
        command: 'npm run lint'
      },
      {
        suite: 'Production Bundle Compilation',
        type: 'BUILD',
        command: 'npm run build'
      },
      {
        suite: 'PROJECT-02 Development Connector Integration Test',
        type: 'CONNECTOR_INTEGRATION',
        command: 'POST /api/connector/validate'
      }
    ],
    configurationCategories: [
      {
        category: 'THEME_AND_STYLING',
        description: 'Tailwind 4, custom glass surface opacity, blur, and chromatic aberration constants.',
        keys: ['GLASS_BLUR', 'GLASS_OPACITY', 'ACCENT_COLOR', 'DARK_MODE'],
        secured: false
      },
      {
        category: 'STORAGE_ENGINE',
        description: 'Client-side IndexedDB, Chrome storage bridge, and local storage limits.',
        keys: ['STORAGE_QUOTA', 'MAX_SAVED_PRESETS', 'CHROME_STORAGE_LOCAL'],
        secured: false
      },
      {
        category: 'ENVIRONMENT_SECRETS',
        description: 'Secured server-side environment credentials. Never exposed via connector APIs.',
        keys: ['GEMINI_API_KEY', 'CONNECTOR_SECRET'],
        secured: true
      }
    ]
  };
}
