// WALLIX Production Runtime Engine for Chrome New Tab
import { getSettings, saveSettings, DEFAULT_SETTINGS, DEFAULT_SHORTCUTS } from './storage.js';

let currentSettings = { ...DEFAULT_SETTINGS };
let currentShortcuts = [...DEFAULT_SHORTCUTS];
let isCelsius = true;

// DOM Element References
const bgVideo = document.getElementById('bg-video');
const bgImg = document.getElementById('bg-img');
const vignetteOverlay = document.getElementById('vignette-overlay');
const wallpaperTitle = document.getElementById('wallpaper-title');

// Weather
const weatherDate = document.getElementById('weather-date');
const weatherTemp = document.getElementById('weather-temp');
const weatherUnit = document.getElementById('weather-unit');
const weatherFeels = document.getElementById('weather-feels');
const weatherHigh = document.getElementById('weather-high');
const weatherLow = document.getElementById('weather-low');
const weatherTempBtn = document.getElementById('weather-temp-btn');

// Top Right Popovers
const appsBtn = document.getElementById('apps-btn');
const appsPopover = document.getElementById('apps-popover');
const profileBtn = document.getElementById('profile-btn');
const profilePopover = document.getElementById('profile-popover');

// Center Search
const centerContent = document.getElementById('center-content');
const googleBrand = document.getElementById('google-brand');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const micBtn = document.getElementById('mic-btn');
const lensBtn = document.getElementById('lens-btn');
const aiBadge = document.getElementById('ai-badge');
const shortcutDock = document.getElementById('shortcut-dock');

// Modal
const shortcutModal = document.getElementById('shortcut-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const shortcutForm = document.getElementById('shortcut-form');
const shortcutName = document.getElementById('shortcut-name');
const shortcutUrl = document.getElementById('shortcut-url');
const modalError = document.getElementById('modal-error');
const modalTitle = document.getElementById('modal-title');
const customizeBtn = document.getElementById('customize-btn');

let editingShortcutId = null;

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function safeUrl(url) {
  const s = String(url || '').trim();
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://' + s;
}

const FALLBACK_ONLINE_WALLPAPER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=85';

function resolveSafeWallpaperUrl(url) {
  if (!url) return 'samurai_spider_lily.jpg';
  const clean = String(url).trim();

  // If absolute web or data url
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(clean)) {
    return clean;
  }

  // If in Chrome Extension runtime
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    const assetPath = clean.replace(/^\.?\//, '');
    return chrome.runtime.getURL(assetPath);
  }

  // If in standard web context
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('null')) {
    try {
      return new URL(clean.replace(/^\.?\//, '/'), window.location.origin).href;
    } catch {}
  }

  return clean.replace(/^\//, '');
}

function updateWeatherUI() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (weatherDate) {
    weatherDate.textContent = `${days[now.getDay()]} ${now.getDate()}, ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  const baseC = 28;
  const feelsC = 26;
  const highC = 28;
  const lowC = 23;

  if (isCelsius) {
    if (weatherTemp) weatherTemp.textContent = `${baseC}°`;
    if (weatherUnit) weatherUnit.textContent = 'C';
    if (weatherFeels) weatherFeels.textContent = `Feels like ${feelsC}°`;
    if (weatherHigh) weatherHigh.textContent = `${highC}°`;
    if (weatherLow) weatherLow.textContent = `${lowC}°`;
  } else {
    const toF = (c) => Math.round((c * 9/5) + 32);
    if (weatherTemp) weatherTemp.textContent = `${toF(baseC)}°`;
    if (weatherUnit) weatherUnit.textContent = 'F';
    if (weatherFeels) weatherFeels.textContent = `Feels like ${toF(feelsC)}°`;
    if (weatherHigh) weatherHigh.textContent = `${toF(highC)}°`;
    if (weatherLow) weatherLow.textContent = `${toF(lowC)}°`;
  }
}

function applyDesign(settings, shortcuts) {
  if (!settings) return;
  const root = document.documentElement;
  const effects = settings.effects || DEFAULT_SETTINGS.effects;
  const search = settings.search || DEFAULT_SETTINGS.search;
  const shortcutsConfig = settings.shortcuts || DEFAULT_SETTINGS.shortcuts;
  const wallpaper = settings.wallpaper || DEFAULT_SETTINGS.wallpaper;

  // 1. Accent Color
  const accentKey = effects.themeAccent || 'purple';
  let accentColor = '#c084fc';
  let accentGlow = 'rgba(192, 132, 252, 0.45)';
  let accentRing = 'rgba(192, 132, 252, 0.6)';
  let bgTint = 'rgba(28, 18, 48, 0.4)';

  if (accentKey === 'cyan') {
    accentColor = '#06b6d4';
    accentGlow = 'rgba(6, 182, 212, 0.45)';
    accentRing = 'rgba(6, 182, 212, 0.6)';
    bgTint = 'rgba(6, 35, 52, 0.4)';
  } else if (accentKey === 'blue') {
    accentColor = '#60a5fa';
    accentGlow = 'rgba(96, 165, 250, 0.45)';
    accentRing = 'rgba(96, 165, 250, 0.6)';
    bgTint = 'rgba(15, 28, 56, 0.4)';
  } else if (accentKey === 'emerald') {
    accentColor = '#34d399';
    accentGlow = 'rgba(52, 211, 153, 0.45)';
    accentRing = 'rgba(52, 211, 153, 0.6)';
    bgTint = 'rgba(6, 40, 32, 0.4)';
  } else if (accentKey === 'amber') {
    accentColor = '#fbbf24';
    accentGlow = 'rgba(251, 191, 36, 0.45)';
    accentRing = 'rgba(251, 191, 36, 0.6)';
    bgTint = 'rgba(45, 28, 10, 0.4)';
  } else if (accentKey === 'rose') {
    accentColor = '#f43f5e';
    accentGlow = 'rgba(244, 63, 94, 0.45)';
    accentRing = 'rgba(244, 63, 94, 0.6)';
    bgTint = 'rgba(48, 15, 22, 0.4)';
  }

  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--accent-glow', accentGlow);
  root.style.setProperty('--accent-ring', accentRing);
  root.style.setProperty('--accent-tint', bgTint);

  // Search Variables
  root.style.setProperty('--search-blur', `${search.blur ?? 14}px`);
  root.style.setProperty('--search-opacity', `${(search.opacity ?? 18) / 100}`);
  root.style.setProperty('--search-border', `${(search.borderOpacity ?? 25) / 100}`);

  // Shortcut Variables
  root.style.setProperty('--shortcut-blur', `${shortcutsConfig.blur ?? 16}px`);
  root.style.setProperty('--shortcut-opacity', `${(shortcutsConfig.opacity ?? 30) / 100}`);

  // Layout Offset Variables
  const layout = settings.layout || DEFAULT_SETTINGS.layout || {};
  const searchPos = layout.search || { x: 0, y: 0 };
  const dockPos = layout.dock || { x: 0, y: 0 };
  const weatherPos = layout.weather || { x: 0, y: 0 };
  const topRightPos = layout.topRight || { x: 0, y: 0 };

  root.style.setProperty('--search-offset-x', `${searchPos.x || 0}px`);
  root.style.setProperty('--search-offset-y', `${searchPos.y || 0}px`);
  root.style.setProperty('--dock-offset-x', `${dockPos.x || 0}px`);
  root.style.setProperty('--dock-offset-y', `${dockPos.y || 0}px`);
  root.style.setProperty('--weather-offset-x', `${weatherPos.x || 0}px`);
  root.style.setProperty('--weather-offset-y', `${weatherPos.y || 0}px`);
  root.style.setProperty('--topright-offset-x', `${topRightPos.x || 0}px`);
  root.style.setProperty('--topright-offset-y', `${topRightPos.y || 0}px`);

  // 2. Wallpaper Media
  if (wallpaperTitle) {
    wallpaperTitle.textContent = wallpaper.title || 'Samurai: Crimson Lily';
  }

  if (wallpaper.type === 'video' && wallpaper.videoUrl) {
    if (bgImg) bgImg.style.display = 'none';
    if (bgVideo) {
      bgVideo.style.display = 'block';
      const resolvedVideo = resolveSafeWallpaperUrl(wallpaper.videoUrl);
      if (bgVideo.src !== resolvedVideo) {
        bgVideo.src = resolvedVideo;
      }
      bgVideo.onerror = () => {
        bgVideo.style.display = 'none';
        if (bgImg) {
          bgImg.style.display = 'block';
          bgImg.src = resolveSafeWallpaperUrl(wallpaper.url || 'samurai_spider_lily.jpg');
        }
      };
      bgVideo.play().catch(() => {});
    }
  } else {
    if (bgVideo) bgVideo.style.display = 'none';
    if (bgImg) {
      bgImg.style.display = 'block';
      const safeImg = resolveSafeWallpaperUrl(wallpaper.url || 'samurai_spider_lily.jpg');
      bgImg.onerror = () => {
        if (!bgImg.dataset.errored) {
          bgImg.dataset.errored = '1';
          bgImg.src = FALLBACK_ONLINE_WALLPAPER;
        }
      };
      if (bgImg.src !== safeImg && bgImg.getAttribute('src') !== safeImg) {
        bgImg.src = safeImg;
      }
    }
  }

  // 3. Vignette & Backdrop Dim
  if (vignetteOverlay) {
    const dim = (effects.backdropDim ?? 10) / 100;
    const vignette = effects.vignette ?? 20;
    vignetteOverlay.style.backgroundColor = `rgba(0, 0, 0, ${dim})`;
    vignetteOverlay.style.boxShadow = `inset 0 0 ${vignette * 2.5}px rgba(0, 0, 0, ${vignette / 100})`;
  }

  // 4. Search Form
  if (centerContent) {
    if (search.position === 'top') centerContent.classList.add('position-top');
    else centerContent.classList.remove('position-top');
  }

  if (googleBrand) {
    googleBrand.style.display = search.showLogo ? 'flex' : 'none';
  }

  if (searchForm) {
    searchForm.classList.remove('radius-rounded', 'radius-minimal');
    if (search.style === 'rounded') searchForm.classList.add('radius-rounded');
    else if (search.style === 'minimal') searchForm.classList.add('radius-minimal');

    searchForm.classList.remove('size-compact', 'size-spacious');
    if (search.size === 'compact') searchForm.classList.add('size-compact');
    else if (search.size === 'spacious') searchForm.classList.add('size-spacious');

    if (search.customWidth) {
      searchForm.style.maxWidth = `${search.customWidth}px`;
    }

    if (search.engine === 'duckduckgo') {
      searchForm.action = 'https://duckduckgo.com/';
    } else if (search.engine === 'bing') {
      searchForm.action = 'https://www.bing.com/search';
    } else {
      searchForm.action = 'https://www.google.com/search';
    }
  }

  if (aiBadge) {
    aiBadge.style.display = search.showAiMode !== false ? 'flex' : 'none';
  }

  renderShortcuts(shortcuts);
}

function renderShortcuts(shortcuts) {
  if (!shortcutDock) return;
  shortcutDock.innerHTML = '';

  const list = Array.isArray(shortcuts) ? shortcuts : DEFAULT_SHORTCUTS;

  list.forEach((sc) => {
    const item = document.createElement('a');
    item.className = 'shortcut-item scale-hover';
    item.href = safeUrl(sc.url);
    item.target = '_blank';
    item.rel = 'noreferrer';
    item.title = sc.title;

    let gradientStyle = sc.gradient || 'linear-gradient(135deg, #06B6D4, #2563EB)';
    if (gradientStyle.startsWith('from-')) {
      // Tailwind gradient class fallback translation
      if (gradientStyle.includes('blue')) gradientStyle = 'linear-gradient(135deg, #3B82F6, #4F46E5)';
      else if (gradientStyle.includes('red') || gradientStyle.includes('rose')) gradientStyle = 'linear-gradient(135deg, #DC2626, #E11D48)';
      else if (gradientStyle.includes('slate') || gradientStyle.includes('zinc')) gradientStyle = 'linear-gradient(135deg, #334155, #09090B)';
      else if (gradientStyle.includes('orange')) gradientStyle = 'linear-gradient(135deg, #F97316, #DC2626)';
      else if (gradientStyle.includes('purple')) gradientStyle = 'linear-gradient(135deg, #A855F7, #DB2777)';
      else gradientStyle = 'linear-gradient(135deg, #06B6D4, #2563EB)';
    }

    item.innerHTML = `
      <div class="shortcut-glass-card">
        <div class="shortcut-inner-icon" style="background: ${gradientStyle};">
          ${escapeHtml(sc.initials || sc.title.slice(0, 2).toUpperCase())}
        </div>
      </div>
      <span class="shortcut-label">${escapeHtml(sc.title)}</span>
      <button type="button" class="shortcut-menu-btn" title="Edit or Remove">⋮</button>
    `;

    // Right-click or Menu click handling
    const menuBtn = item.querySelector('.shortcut-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditModal(sc);
      });
    }

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openEditModal(sc);
    });

    shortcutDock.appendChild(item);
  });

  // Dedicated + Add Shortcut Button
  const addBtn = document.createElement('div');
  addBtn.className = 'shortcut-item scale-hover';
  addBtn.setAttribute('role', 'button');
  addBtn.setAttribute('title', 'Add shortcut');
  addBtn.innerHTML = `
    <div class="shortcut-glass-card shortcut-add-card">
      <div class="shortcut-add-inner">+</div>
    </div>
    <span class="shortcut-label">Add shortcut</span>
  `;
  addBtn.addEventListener('click', () => openAddModal());
  shortcutDock.appendChild(addBtn);
}

function openAddModal() {
  editingShortcutId = null;
  if (modalTitle) modalTitle.textContent = 'Add shortcut';
  if (shortcutName) shortcutName.value = '';
  if (shortcutUrl) shortcutUrl.value = '';
  if (modalError) modalError.style.display = 'none';
  if (shortcutModal) shortcutModal.style.display = 'flex';
  if (shortcutName) shortcutName.focus();
}

function openEditModal(sc) {
  editingShortcutId = sc.id;
  if (modalTitle) modalTitle.textContent = 'Edit shortcut';
  if (shortcutName) shortcutName.value = sc.title || '';
  if (shortcutUrl) shortcutUrl.value = sc.url || '';
  if (modalError) modalError.style.display = 'none';
  if (shortcutModal) shortcutModal.style.display = 'flex';
  if (shortcutName) shortcutName.focus();
}

function closeModal() {
  if (shortcutModal) shortcutModal.style.display = 'none';
  editingShortcutId = null;
}

// Voice Search Support
function initVoiceSearch() {
  if (!micBtn) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let isListening = false;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    if (searchInput) searchInput.placeholder = 'Listening...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (searchInput) {
      searchInput.value = transcript;
      if (searchForm) searchForm.submit();
    }
  };

  recognition.onerror = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    if (searchInput) searchInput.placeholder = 'Search Google or enter a web address...';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    if (searchInput) searchInput.placeholder = 'Search Google or enter a web address...';
  };

  micBtn.addEventListener('click', () => {
    if (isListening) recognition.stop();
    else recognition.start();
  });
}

// Google Lens Click
if (lensBtn) {
  lensBtn.addEventListener('click', () => {
    window.open('https://lens.google.com', '_blank');
  });
}

// AI Mode Pill Click
if (aiBadge) {
  aiBadge.addEventListener('click', () => {
    const q = searchInput && searchInput.value ? encodeURIComponent(searchInput.value.trim()) : '';
    if (q) {
      window.open(`https://www.google.com/search?q=${q}+%28ai%29`, '_blank');
    } else {
      window.open('https://gemini.google.com', '_blank');
    }
  });
}

// Weather unit click toggle
if (weatherTempBtn) {
  weatherTempBtn.addEventListener('click', () => {
    isCelsius = !isCelsius;
    updateWeatherUI();
  });
}

// Google Apps Popover Toggle
if (appsBtn && appsPopover) {
  appsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = appsPopover.style.display === 'block';
    appsPopover.style.display = isOpen ? 'none' : 'block';
    appsBtn.classList.toggle('active', !isOpen);
    if (profilePopover) profilePopover.style.display = 'none';
  });
}

// Profile Popover Toggle
if (profileBtn && profilePopover) {
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = profilePopover.style.display === 'block';
    profilePopover.style.display = isOpen ? 'none' : 'block';
    profileBtn.classList.toggle('active', !isOpen);
    if (appsPopover) appsPopover.style.display = 'none';
  });
}

// Close popovers on click outside
window.addEventListener('click', (e) => {
  if (appsPopover && !appsPopover.contains(e.target) && e.target !== appsBtn) {
    appsPopover.style.display = 'none';
    if (appsBtn) appsBtn.classList.remove('active');
  }
  if (profilePopover && !profilePopover.contains(e.target) && e.target !== profileBtn) {
    profilePopover.style.display = 'none';
    if (profileBtn) profileBtn.classList.remove('active');
  }
});

// Modal Events
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

if (shortcutForm) {
  shortcutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = shortcutName ? shortcutName.value.trim() : '';
    let url = shortcutUrl ? shortcutUrl.value.trim() : '';

    if (!title || !url) {
      if (modalError) {
        modalError.textContent = 'Please fill out all fields.';
        modalError.style.display = 'block';
      }
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (editingShortcutId) {
      currentShortcuts = currentShortcuts.map((s) => 
        s.id === editingShortcutId ? { ...s, title, url, initials: title.slice(0, 2).toUpperCase() } : s
      );
    } else {
      const newSc = {
        id: `sc-${Date.now()}`,
        title,
        url,
        initials: title.slice(0, 2).toUpperCase(),
        gradient: 'linear-gradient(135deg, #06B6D4, #2563EB)',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        isDefault: false
      };
      currentShortcuts.push(newSc);
    }

    await saveSettings(currentSettings, currentShortcuts);
    renderShortcuts(currentShortcuts);
    closeModal();
  });
}

if (customizeBtn) {
  customizeBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel?.open) {
      chrome.sidePanel.open({ windowId: chrome.windows?.WINDOW_ID_CURRENT }).catch(() => {});
    } else {
      window.location.href = '/';
    }
  });
}

// Storage Listener for live synchronization
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.wallix_chrome_newtab_settings || changes.wallix_chrome_settings) {
      const newSettings = changes.wallix_chrome_newtab_settings?.newValue || changes.wallix_chrome_settings?.newValue;
      if (newSettings) {
        currentSettings = { ...currentSettings, ...newSettings };
        if (Array.isArray(newSettings.shortcutsList)) {
          currentShortcuts = newSettings.shortcutsList;
        }
        applyDesign(currentSettings, currentShortcuts);
      }
    }
  });
}

window.addEventListener('storage', (e) => {
  if (e.key === 'wallix_chrome_newtab_settings' && e.newValue) {
    try {
      currentSettings = JSON.parse(e.newValue);
      applyDesign(currentSettings, currentShortcuts);
    } catch {}
  }
});

// Initialization
async function init() {
  updateWeatherUI();
  initVoiceSearch();
  
  const { settings, shortcuts } = await getSettings();
  currentSettings = settings;
  currentShortcuts = shortcuts;
  applyDesign(currentSettings, currentShortcuts);
}

document.addEventListener('DOMContentLoaded', init);
init();
