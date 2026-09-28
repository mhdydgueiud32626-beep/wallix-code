import JSZip from 'jszip';

export interface ExtensionFileTemplates {
  manifestJson: string;
  indexHtml: string;
  stylesCss: string;
  appJs: string;
  readmeMd: string;
}

export const getExtensionTemplates = (): ExtensionFileTemplates => {
  const manifestJson = JSON.stringify(
    {
      manifest_version: 3,
      name: 'WALLIX APP 3D PRO - Live New Tab',
      version: '3.0.0',
      description: 'Ultra-fast 60 FPS 4K Live Video & 3D Wallpaper New Tab Dashboard with 1-Click Wallpaper Changer, Clean Search and Quick Shortcuts.',
      action: {
        default_title: 'WALLIX APP 3D PRO'
      },
      chrome_url_overrides: {
        newtab: 'index.html'
      },
      permissions: [
        'topSites',
        'storage',
        'bookmarks',
        'favicon'
      ],
      icons: {
        '128': 'icons/icon128.png'
      }
    },
    null,
    2
  );

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WALLIX APP 3D PRO - Live New Tab</title>
  
  <!-- Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <!-- Fullscreen 60FPS Video Background & Local Image Media Layer -->
  <div class="wallpaper-container">
    <video autoplay loop muted playsinline id="bgVideo" class="bg-media">
      <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
    </video>
    <img id="bgImg" class="bg-media hidden" alt="Custom Wallpaper" />
    <div class="overlay"></div>
  </div>

  <!-- Centered Minimalist Dashboard -->
  <main class="main-dashboard">
    
    <!-- WALLIX APP 3D Geometric Brand Monogram -->
    <div class="logo-wrapper">
      <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>

    <!-- Centered Glassmorphic Google Search Bar -->
    <form id="searchForm" class="search-form">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Search Google or enter web address..." 
          autocomplete="off" 
          autofocus 
        />
        <button type="submit" class="search-btn" title="Search">→</button>
      </div>
    </form>

    <!-- 5 Clean Quick Shortcuts Tiles -->
    <div class="shortcuts-container">
      <a href="https://www.youtube.com" target="_blank" rel="noreferrer" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #FF0000, #CC0000); overflow:hidden; position:relative;">
          <img src="https://www.google.com/s2/favicons?domain=youtube.com&sz=128" alt="YouTube" style="width:60%;height:60%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">YT</span>
        </div>
        <span class="shortcut-label">YouTube</span>
      </a>

      <a href="https://www.google.com" target="_blank" rel="noreferrer" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #4285F4, #34A853); overflow:hidden; position:relative;">
          <img src="https://www.google.com/s2/favicons?domain=google.com&sz=128" alt="Google" style="width:60%;height:60%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">G</span>
        </div>
        <span class="shortcut-label">Google</span>
      </a>

      <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #06B6D4, #3B82F6); overflow:hidden; position:relative;">
          <img src="https://www.google.com/s2/favicons?domain=aistudio.google.com&sz=128" alt="AI Studio" style="width:60%;height:60%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">AI</span>
        </div>
        <span class="shortcut-label">AI Studio</span>
      </a>

      <a href="https://www.pinterest.com" target="_blank" rel="noreferrer" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #E60023, #BD081C); overflow:hidden; position:relative;">
          <img src="https://www.google.com/s2/favicons?domain=pinterest.com&sz=128" alt="Pinterest" style="width:60%;height:60%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">P</span>
        </div>
        <span class="shortcut-label">Pinterest</span>
      </a>

      <a href="https://store.steampowered.com" target="_blank" rel="noreferrer" class="shortcut-card">
        <div class="shortcut-icon" style="background: linear-gradient(135deg, #171A21, #000000); overflow:hidden; position:relative;">
          <img src="https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=128" alt="Steam" style="width:60%;height:60%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">S</span>
        </div>
        <span class="shortcut-label">Steam</span>
      </a>
    </div>

  </main>

  <!-- 1-Click Wallpaper Changer UI -->
  <div class="change-btn-wrapper">
    <input type="file" id="wallpaperPicker" accept="video/*,image/*" style="display: none;" />
    <button id="changeWallpaperBtn" class="change-btn" title="Upload local MP4/WEBM video or JPG/PNG image">
      <span class="cam-icon">📸</span>
      <span>Change Wallpaper</span>
    </button>
  </div>

  <script src="app.js"></script>
</body>
</html>`;

  const stylesCss = `/* =========================================================
   WALLIX APP 3D PRO - Chrome Extension Stylesheet
   ========================================================= */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}

body {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background-color: #0b0d14;
}

/* 1. Fullscreen 60FPS Video / Image Media Layer */
.wallpaper-container {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.bg-media {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: absolute;
  inset: 0;
  transform: scale(1.02);
  transition: opacity 0.4s ease;
}

.hidden {
  display: none !important;
}

/* Subtle Cinematic Vignette Overlay */
.overlay {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at center, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.65) 100%),
    linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 60%);
  pointer-events: none;
}

/* 2. Main Centered Minimal Dashboard */
.main-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 640px;
  padding: 0 24px;
  z-index: 10;
}

/* Brand Monogram / Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  width: 48px;
  height: 48px;
  opacity: 0.95;
  filter: drop-shadow(0 4px 18px rgba(56, 189, 248, 0.45));
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.brand-logo:hover {
  transform: scale(1.1);
}

/* 3. Glassmorphic Search Bar */
.search-form {
  width: 100%;
}

.search-box {
  width: 100%;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 6px 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-icon {
  font-size: 1.1rem;
  margin-right: 8px;
  opacity: 0.8;
}

.search-box:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.2);
}

.search-box input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 16px;
  padding: 12px 6px;
  user-select: text;
  font-family: inherit;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-btn {
  background: linear-gradient(135deg, #38bdf8, #0284c7);
  border: none;
  color: #000000;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.search-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
}

/* 4. Minimalist Shortcut Tiles Row */
.shortcuts-container {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.shortcut-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  width: 92px;
  height: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  color: #ffffff;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.shortcut-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.24);
  border-color: #38bdf8;
  box-shadow: 0 8px 24px rgba(56, 189, 248, 0.35);
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: #ffffff;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0,0,0,0.3);
}

.shortcut-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* 5. 1-Click Wallpaper Changer Button (Fixed Bottom-Right) */
.change-btn-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

.change-btn {
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.change-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(56, 189, 248, 0.4);
}

.cam-icon {
  font-size: 1.1rem;
}
`;

  const appJs = `// WALLIX APP 3D PRO - Chrome Extension Core Engine
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const wallpaperPicker = document.getElementById('wallpaperPicker');
  const changeWallpaperBtn = document.getElementById('changeWallpaperBtn');
  const bgVideo = document.getElementById('bgVideo');
  const bgImg = document.getElementById('bgImg');

  // 1. Google Web Search & Direct URL Handler
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) return;

      if (query.startsWith('http://') || query.startsWith('https://')) {
        window.location.href = query;
      } else {
        window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
      }
    });
  }

  // 2. 1-Click Local Wallpaper File Picker
  if (changeWallpaperBtn && wallpaperPicker) {
    changeWallpaperBtn.addEventListener('click', () => {
      wallpaperPicker.click();
    });

    wallpaperPicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const fileURL = URL.createObjectURL(file);

      if (file.type.startsWith('video/')) {
        bgImg.classList.add('hidden');
        bgVideo.classList.remove('hidden');
        bgVideo.src = fileURL;
        bgVideo.play();
      } else if (file.type.startsWith('image/')) {
        bgVideo.classList.add('hidden');
        bgImg.classList.remove('hidden');
        bgImg.src = fileURL;
      }
    });
  }
});
`;

  const readmeMd = `# WALLIX APP 3D PRO - Chrome Extension Manifest V3

## 🚀 How to Install in Google Chrome, Brave, or Microsoft Edge:

1. **Extract this ZIP file** into any permanent folder on your computer (e.g. \`WALLIX-Chrome-Extension\`).
2. Open Google Chrome (or Edge/Brave) and go to:  
   👉 \`chrome://extensions/\`
3. In the top-right corner, turn **ON** the toggle for **"Developer mode"**.
4. In the top-left corner, click **"Load unpacked"** (अनपैक्ड लोड करें).
5. Select the extracted folder containing \`manifest.json\`.
6. Open a **New Tab (Ctrl + T)**! 🎉  
   Your custom 60 FPS Live Video Wallpaper Dashboard will now automatically launch with the 1-Click Wallpaper Changer, clean Google search bar, and shortcuts.
`;

  return {
    manifestJson,
    indexHtml,
    stylesCss,
    appJs,
    readmeMd,
  };
};

export const exportExtensionZip = async (fileName = 'wallix-chrome-extension-v3.zip'): Promise<void> => {
  const templates = getExtensionTemplates();
  const zip = new JSZip();

  zip.file('manifest.json', templates.manifestJson);
  zip.file('index.html', templates.indexHtml);
  zip.file('styles.css', templates.stylesCss);
  zip.file('app.js', templates.appJs);
  zip.file('README.md', templates.readmeMd);

  // SVG Icon inside icons/
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    iconsFolder.file('icon128.png', svgIcon);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
