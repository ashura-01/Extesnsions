// =========================
// Safe localStorage helpers
// All reads/writes go through these — prevents crashes on corrupted data or private browsing
// =========================
const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* silent */ }
  },
  getJSON(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
};

// =========================
// Safe URL validator — prevents javascript: and data: href injection
// =========================
function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch { return false; }
}

// =========================
// DOM Elements
// =========================
const clockEl     = document.getElementById('clock');
const dateEl      = document.getElementById('date');
const greetingEl  = document.getElementById('greeting');
const searchForm  = document.getElementById('search-form');
const searchInput = searchForm?.querySelector('input[type="search"]');
const engineBtns  = searchForm?.querySelectorAll('.engine-icons button') ?? [];

const appsToggle = document.getElementById('google-apps-btn');
const appsPanel  = document.getElementById('google-apps-popup');

const settingsBtn   = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');

const todoIcon   = document.getElementById('todo-icon');
const toggleBtn  = document.getElementById('todo-toggle');
const panel      = document.getElementById('todo-panel');
const todoForm   = document.getElementById('todo-form');
const todoInput  = document.getElementById('todo-input');
const todoList   = document.getElementById('todo-list');

const motivationEl = document.getElementById('motivation');

// Guard: abort early if critical elements are missing (e.g. wrong page)
if (!clockEl || !searchForm) {
  console.warn('[NewTab] Critical DOM elements missing. Script halted.');
  throw new Error('Critical DOM missing');
}

// =========================
// Settings Panel
// =========================
if (settingsBtn && settingsPanel) {
  settingsBtn.onclick = () => {
    const open = settingsPanel.style.display === 'flex';
    settingsPanel.style.display = open ? 'none' : 'flex';
  };
}

// =========================
// Color utility
// =========================
function getHoverColor(hex, amount = -15) {
  // Normalize shorthand hex (#fff → #ffffff)
  if (typeof hex !== 'string') return '#888888';
  hex = hex.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;

  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }

  l = Math.min(1, Math.max(0, l + amount / 100));
  let r1, g1, b1;
  if (s === 0) { r1 = g1 = b1 = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1 / 3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r1 * 255)},${Math.round(g1 * 255)},${Math.round(b1 * 255)})`;
}

function applyAccent(color) {
  if (!color) return;
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-hover', getHoverColor(color, -15));
  const path = todoIcon?.querySelector('path');
  if (path) path.setAttribute('fill', color);
}

// =========================
// Text Gradient (Shade)
// =========================
function applyShade(on) {
  document.body.classList.toggle('text-shade', !!on);
}

// =========================
// Google Font loader
// =========================
const DEFAULT_FONT_STACK = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
let googleFontLinkEl = null;

// Accepts a fonts.google.com specimen URL, a fonts.googleapis.com css2 URL,
// or a plain font family name. Returns {familyName, cssHref} or null.
function parseGoogleFontInput(input) {
  if (!input || typeof input !== 'string') return null;
  input = input.trim();
  if (!input) return null;

  let familyName = null;
  let cssHref = null;

  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol)) return null;

    if (u.hostname.includes('fonts.googleapis.com')) {
      cssHref = u.toString();
      const familyParam = u.searchParams.get('family');
      familyName = familyParam ? familyParam.split(':')[0].replace(/\+/g, ' ').trim() : null;
    } else if (u.hostname.includes('fonts.google.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('specimen');
      if (idx !== -1 && parts[idx + 1]) {
        familyName = decodeURIComponent(parts[idx + 1]).replace(/\+/g, ' ').trim();
      }
    } else {
      return null; // unsupported domain — refuse rather than guess
    }
  } catch {
    // Not a valid URL — treat the raw text as a plain font family name
    familyName = input.replace(/["']/g, '').trim();
  }

  if (!familyName) return null;
  if (!cssHref) {
    const encoded = encodeURIComponent(familyName).replace(/%20/g, '+');
    cssHref = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
  }
  return { familyName, cssHref };
}

// Applies (or clears, when familyName/cssHref are falsy) the custom Google Font.
function applyGoogleFont(familyName, cssHref) {
  if (!familyName || !cssHref) {
    if (googleFontLinkEl) { googleFontLinkEl.remove(); googleFontLinkEl = null; }
    document.documentElement.style.removeProperty('--font-family');
    return;
  }
  if (!googleFontLinkEl) {
    googleFontLinkEl = document.createElement('link');
    googleFontLinkEl.rel = 'stylesheet';
    googleFontLinkEl.id = 'google-font-link';
    document.head.appendChild(googleFontLinkEl);
  }
  googleFontLinkEl.href = cssHref;
  document.documentElement.style.setProperty('--font-family', `"${familyName}", ${DEFAULT_FONT_STACK}`);
}

// =========================
// Matrix Rain — lightweight canvas effect, top-right corner only
// - No React, no per-frame allocations beyond a small drops array
// - 20fps ceiling, pauses when tab/canvas isn't visible
// - When off: no rAF, no listeners, canvas buffer freed — zero cost
// - Trail fade uses 'destination-out' compositing, which erodes the
//   alpha of previously-drawn glyphs instead of painting a dark
//   rectangle over the canvas — so there is never a dark box, only
//   the falling characters themselves.
// =========================
(function () {
  const canvas      = document.getElementById('matrix-rain-canvas');
  const toggleBtn   = document.getElementById('matrix-toggle-btn');
  const colorPicker = document.getElementById('matrix-color-picker');

  const opacityDecBtn  = document.getElementById('matrix-opacity-decrement');
  const opacityIncBtn  = document.getElementById('matrix-opacity-increment');
  const opacityValueEl = document.getElementById('matrix-opacity-value');

  const fontDecBtn  = document.getElementById('matrix-fontsize-decrement');
  const fontIncBtn  = document.getElementById('matrix-fontsize-increment');
  const fontValueEl = document.getElementById('matrix-fontsize-value');

  if (!canvas) return;

  const DEFAULT_COLOR = '#00ff41';
  // Exact glyph set from the reference React component
  const GLYPHS = '01アイウエオカキクケコサシスセソ$#+*<>[]{}';

  // Column spacing is fixed and NEVER changes with font size — only the
  // rendered glyph size changes, per spec ("only font size, not distance
  // among each rain").
  const COLUMN_PITCH = 15; // horizontal distance between rain streams
  const ROW_PITCH = 26;    // vertical distance between characters in a stream
  const FONT_MIN = 8, FONT_MAX = 28, FONT_STEP = 1;
  const OPACITY_MIN = 5, OPACITY_MAX = 100, OPACITY_STEP = 5;

  const ctx = canvas.getContext('2d', { alpha: true });
  const frameInterval = 1000 / 20; // ~20fps ceiling

  let width = 0, height = 0, drops = [];
  let rafId = null;
  let running = false;   // engine loop active
  let visible = true;    // canvas/tab currently visible
  let lastFrame = 0;
  let resizeTimer = null;
  let io = null;

  let color = DEFAULT_COLOR;
  let fontSize = parseInt(store.get('matrixFontSize'), 10);
  if (isNaN(fontSize)) fontSize = 15;
  fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize));

  let opacityPct = parseInt(store.get('matrixOpacity'), 10);
  if (isNaN(opacityPct)) opacityPct = 90;
  opacityPct = Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, opacityPct));

  function hexToRgba(hex, alpha) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    if (isNaN(num)) return `rgba(0,255,65,${alpha})`;
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function applyOpacityUI(pct) {
    if (opacityValueEl) opacityValueEl.textContent = `${pct}%`;
    if (running) canvas.style.opacity = (pct / 100).toString();
  }

  function applyFontSizeUI(px) {
    if (fontValueEl) fontValueEl.textContent = `${px}px`;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    const columns = Math.max(1, Math.floor(width / COLUMN_PITCH));
    drops = new Array(columns).fill(0).map(() => Math.random() * -40);
  }

  function draw(timestamp) {
    if (!running) return;
    rafId = requestAnimationFrame(draw);
    if (!visible) return;
    if (timestamp - lastFrame < frameInterval) return;
    lastFrame = timestamp;

    // Fade existing glyphs toward transparency (never paints a dark
    // background — only erodes what's already drawn).
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < drops.length; i++) {
      const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const x = i * COLUMN_PITCH;
      const y = drops[i] * ROW_PITCH;
      const leading = Math.random() > 0.93;
      ctx.fillStyle = leading ? 'rgba(224, 231, 255, 1)' : hexToRgba(color, 0.75);
      ctx.fillText(glyph, x, y);
      if (y > height && Math.random() > 0.975) drops[i] = 0;
      else drops[i]++;
    }
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (running) resize(); }, 200);
  }

  function onVisibility() {
    visible = document.visibilityState === 'visible';
  }

  function start() {
    if (running) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    running = true;
    canvas.style.opacity = (opacityPct / 100).toString();
    resize();
    lastFrame = 0;
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!io) {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && document.visibilityState === 'visible';
      }, { threshold: 0 });
    }
    io.observe(canvas);
    onVisibility();
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    canvas.style.opacity = '0';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    clearTimeout(resizeTimer);
    if (io) io.disconnect();
    // Free the backing buffer so an idle rain truly costs nothing
    canvas.width = 0;
    canvas.height = 0;
    drops = [];
  }

  function setToggleUI(on) {
    if (!toggleBtn) return;
    toggleBtn.textContent = on ? 'On' : 'Off';
    toggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    toggleBtn.classList.toggle('on', on);
  }

  // Restore saved color, opacity, font size, and on/off state
  color = store.get('matrixColor', DEFAULT_COLOR);
  if (colorPicker) colorPicker.value = color;
  applyOpacityUI(opacityPct);
  applyFontSizeUI(fontSize);

  const savedOn = store.get('matrixRainOn') === 'true';
  setToggleUI(savedOn);
  if (savedOn) start();

  toggleBtn?.addEventListener('click', () => {
    const next = !running;
    if (next) start(); else stop();
    setToggleUI(next);
    store.set('matrixRainOn', String(next));
  });

  // Live preview while running; persisted alongside the rest of the theme
  colorPicker?.addEventListener('input', e => { color = e.target.value; });

  opacityDecBtn?.addEventListener('click', () => {
    opacityPct = Math.max(OPACITY_MIN, opacityPct - OPACITY_STEP);
    applyOpacityUI(opacityPct);
  });
  opacityIncBtn?.addEventListener('click', () => {
    opacityPct = Math.min(OPACITY_MAX, opacityPct + OPACITY_STEP);
    applyOpacityUI(opacityPct);
  });

  fontDecBtn?.addEventListener('click', () => {
    fontSize = Math.max(FONT_MIN, fontSize - FONT_STEP);
    applyFontSizeUI(fontSize);
  });
  fontIncBtn?.addEventListener('click', () => {
    fontSize = Math.min(FONT_MAX, fontSize + FONT_STEP);
    applyFontSizeUI(fontSize);
  });

  document.getElementById('theme-save-btn')?.addEventListener('click', () => {
    if (colorPicker) store.set('matrixColor', colorPicker.value);
    store.set('matrixOpacity', String(opacityPct));
    store.set('matrixFontSize', String(fontSize));
  });
})();

// =========================
// DOMContentLoaded — Settings wiring
// =========================
let userName = store.get('userName', 'there');

window.addEventListener('DOMContentLoaded', () => {
  const colorPicker    = document.getElementById('color-picker');
  const bgPicker       = document.getElementById('bg-picker');
  const themeSaveBtn   = document.getElementById('theme-save-btn');
  const userNameInput  = document.getElementById('user-name');
  const shadeToggleBtn = document.getElementById('shade-toggle');
  const googleFontInput = document.getElementById('google-font-url');

  // Apply saved accent
  const savedColor = store.get('accentColor');
  if (savedColor) { applyAccent(savedColor); if (colorPicker) colorPicker.value = savedColor; }
  else if (colorPicker) {
    // Nothing saved yet: show the real current accent in the picker. Without this the picker
    // sits at its default (#000000) and "Save Theme" would store black as the accent.
    const cur = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    colorPicker.value = /^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffa9a9';
  }

  // Apply saved text shade (gradient) setting
  let shadeOn = store.get('textShade') === 'true';
  applyShade(shadeOn);
  if (shadeToggleBtn) {
    shadeToggleBtn.textContent = shadeOn ? 'On' : 'Off';
    shadeToggleBtn.setAttribute('aria-pressed', shadeOn ? 'true' : 'false');
    shadeToggleBtn.classList.toggle('on', shadeOn);
  }
  shadeToggleBtn?.addEventListener('click', () => {
    shadeOn = !shadeOn;
    applyShade(shadeOn);
    shadeToggleBtn.textContent = shadeOn ? 'On' : 'Off';
    shadeToggleBtn.setAttribute('aria-pressed', shadeOn ? 'true' : 'false');
    shadeToggleBtn.classList.toggle('on', shadeOn);
  });

  // Apply saved Google Font
  const savedFontFamily = store.get('googleFontFamily');
  const savedFontHref   = store.get('googleFontHref');
  if (savedFontFamily && savedFontHref) {
    applyGoogleFont(savedFontFamily, savedFontHref);
    if (googleFontInput) googleFontInput.value = savedFontFamily;
  }

  // Apply saved bg
  const savedBg = store.get('bgImage');
  if (savedBg) document.documentElement.style.setProperty('--bg-image', savedBg);

  // =========================
  // Background Blur & Black Overlay steppers
  // =========================
  const blurDecBtn     = document.getElementById('blur-decrement');
  const blurIncBtn     = document.getElementById('blur-increment');
  const blurValueEl    = document.getElementById('blur-value');
  const overlayDecBtn  = document.getElementById('overlay-decrement');
  const overlayIncBtn  = document.getElementById('overlay-increment');
  const overlayValueEl = document.getElementById('overlay-value');

  const BLUR_MIN = 0, BLUR_MAX = Infinity, BLUR_STEP = 1;
  const OVERLAY_MIN = 0, OVERLAY_MAX = 100, OVERLAY_STEP = 5;

  // Load saved values (fallback to current CSS defaults)
  let bgBlur = parseInt(store.get('bgBlur'), 10);
  if (isNaN(bgBlur)) bgBlur = 3;
  bgBlur = Math.min(BLUR_MAX, Math.max(BLUR_MIN, bgBlur));

  let overlayOpacity = parseFloat(store.get('overlayOpacity'));
  if (isNaN(overlayOpacity)) overlayOpacity = 0.192;
  let overlayPct = Math.round(overlayOpacity * 100);
  overlayPct = Math.min(OVERLAY_MAX, Math.max(OVERLAY_MIN, overlayPct));

  function applyBgBlur(px) {
    document.documentElement.style.setProperty('--bg-blur', `${px}px`);
    if (blurValueEl) blurValueEl.textContent = `${px}px`;
  }

  function applyOverlayOpacity(pct) {
    document.documentElement.style.setProperty('--overlay-opacity', (pct / 100).toString());
    if (overlayValueEl) overlayValueEl.textContent = `${pct}%`;
  }

  applyBgBlur(bgBlur);
  applyOverlayOpacity(overlayPct);

  // Clock card opacity (black card background only — text and corner brackets are untouched)
  const clockDecBtn  = document.getElementById('clockcard-decrement');
  const clockIncBtn  = document.getElementById('clockcard-increment');
  const clockValueEl = document.getElementById('clockcard-value');
  const CLOCK_MIN = 0, CLOCK_MAX = 100, CLOCK_STEP = 5;

  let clockCardOpacity = parseFloat(store.get('clockCardOpacity'));
  if (isNaN(clockCardOpacity)) clockCardOpacity = 0.7;
  let clockPct = Math.round(clockCardOpacity * 100);
  clockPct = Math.min(CLOCK_MAX, Math.max(CLOCK_MIN, clockPct));

  function applyClockCardOpacity(pct) {
    document.documentElement.style.setProperty('--clock-card-opacity', (pct / 100).toString());
    if (clockValueEl) clockValueEl.textContent = `${pct}%`;
  }
  applyClockCardOpacity(clockPct);

  clockDecBtn?.addEventListener('click', () => {
    clockPct = Math.max(CLOCK_MIN, clockPct - CLOCK_STEP);
    applyClockCardOpacity(clockPct);
  });
  clockIncBtn?.addEventListener('click', () => {
    clockPct = Math.min(CLOCK_MAX, clockPct + CLOCK_STEP);
    applyClockCardOpacity(clockPct);
  });

  function hexToRgbTripletEarly(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  // Overlay color (opacity control above keeps working; wallpaper is untouched)
  const overlayColorEl = document.getElementById('overlay-color-picker');
  const savedOverlayColor = store.get('overlayColor');
  const savedOverlayRgb = hexToRgbTripletEarly(savedOverlayColor);
  if (savedOverlayRgb) {
    document.documentElement.style.setProperty('--overlay-rgb', savedOverlayRgb);
    if (overlayColorEl) overlayColorEl.value = savedOverlayColor;
  }
  overlayColorEl?.addEventListener('input', e => {
    const t = hexToRgbTripletEarly(e.target.value);
    if (t) document.documentElement.style.setProperty('--overlay-rgb', t);
  });

  // Shared margin-top for Clock + Bookmarks (default 150px)
  const mtDecBtn  = document.getElementById('margintop-decrement');
  const mtIncBtn  = document.getElementById('margintop-increment');
  const mtValueEl = document.getElementById('margintop-value');
  const MT_MIN = 50, MT_MAX = 400, MT_STEP = 10, MT_DEFAULT = 150;
  let contentOffset = parseInt(store.get('contentMarginTop'), 10);
  if (isNaN(contentOffset)) contentOffset = MT_DEFAULT;
  contentOffset = Math.min(MT_MAX, Math.max(MT_MIN, contentOffset));
  function applyContentOffset(px) {
    document.documentElement.style.setProperty('--content-offset', `${px}px`);
    if (mtValueEl) mtValueEl.textContent = `${px}px`;
  }
  applyContentOffset(contentOffset);
  mtDecBtn?.addEventListener('click', () => {
    contentOffset = Math.max(MT_MIN, contentOffset - MT_STEP);
    applyContentOffset(contentOffset);
  });
  mtIncBtn?.addEventListener('click', () => {
    contentOffset = Math.min(MT_MAX, contentOffset + MT_STEP);
    applyContentOffset(contentOffset);
  });

  // Search input + inactive engine buttons derive from the clock/search card color:
  // a darker shade of it, with text color chosen for contrast. Card opacity is untouched.
  function applySearchFieldColors(triplet) {
    if (!triplet) return;
    const [r, g, b] = triplet.split(',').map(n => parseInt(n, 10));
    const shade = k => [r, g, b].map(c => Math.round(c * k));
    const lift  = c => [r, g, b].map(v => Math.min(255, Math.round(v * 0.75) + 18));
    const base = shade(0.75);
    const lum = (0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2]) / 255;
    const root = document.documentElement.style;
    root.setProperty('--search-field-rgb', base.join(', '));
    root.setProperty('--search-field-focus-rgb', lift().join(', '));
    root.setProperty('--search-field-text', lum > 0.55 ? '#111' : '#fff');
  }

  // Surface background colors (clock + search card, bookmark cards, tasks panel).
  // Stored as hex; applied as an "r, g, b" CSS variable so the opacity controls keep working.
  const SURFACE_COLORS = [
    { id: 'clockcard-color-picker',   cssVar: '--clock-card-rgb', key: 'clockCardColor' },
    { id: 'bookmark-bg-color-picker', cssVar: '--bookmark-rgb',   key: 'bookmarkBgColor' },
    { id: 'todo-color-picker',        cssVar: '--todo-rgb',       key: 'todoPanelColor' }
  ];
  function hexToRgbTriplet(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }
  SURFACE_COLORS.forEach(c => {
    c.el = document.getElementById(c.id);
    const saved = store.get(c.key);
    const rgb = hexToRgbTriplet(saved);
    if (rgb) {
      document.documentElement.style.setProperty(c.cssVar, rgb);
      if (c.el) c.el.value = saved;
      if (c.cssVar === '--clock-card-rgb') applySearchFieldColors(rgb);
    }
    // Live preview while picking (saved with "Save Theme")
    c.el?.addEventListener('input', e => {
      const t = hexToRgbTriplet(e.target.value);
      if (t) {
        document.documentElement.style.setProperty(c.cssVar, t);
        if (c.cssVar === '--clock-card-rgb') applySearchFieldColors(t);
      }
    });
  });

  blurDecBtn?.addEventListener('click', () => {
    bgBlur = Math.max(BLUR_MIN, bgBlur - BLUR_STEP);
    applyBgBlur(bgBlur);
  });
  blurIncBtn?.addEventListener('click', () => {
    bgBlur = Math.min(BLUR_MAX, bgBlur + BLUR_STEP);
    applyBgBlur(bgBlur);
  });

  overlayDecBtn?.addEventListener('click', () => {
    overlayPct = Math.max(OVERLAY_MIN, overlayPct - OVERLAY_STEP);
    applyOverlayOpacity(overlayPct);
  });
  overlayIncBtn?.addEventListener('click', () => {
    overlayPct = Math.min(OVERLAY_MAX, overlayPct + OVERLAY_STEP);
    applyOverlayOpacity(overlayPct);
  });

  // Live color preview
  colorPicker?.addEventListener('input', e => applyAccent(e.target.value));

  // BG picker
  let pendingBg = null;
  bgPicker?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limit file size to 5MB to prevent localStorage quota crash
    if (file.size > 5 * 1024 * 1024) {
      alert('Background image must be under 5MB.');
      bgPicker.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingBg = `url(${ev.target.result})`;
      document.documentElement.style.setProperty('--bg-image', pendingBg);
    };
    reader.onerror = () => { pendingBg = null; };
    reader.readAsDataURL(file);
  });

  // Theme save
  themeSaveBtn?.addEventListener('click', () => {
    if (colorPicker) store.set('accentColor', colorPicker.value);
    if (pendingBg) {
      const ok = store.set('bgImage', pendingBg);
      if (!ok) alert('Could not save background — storage may be full.');
      pendingBg = null;
    }
    store.set('bgBlur', String(bgBlur));
    store.set('overlayOpacity', (overlayPct / 100).toString());
    if (overlayColorEl) store.set('overlayColor', overlayColorEl.value);
    store.set('contentMarginTop', String(contentOffset));
    store.set('clockCardOpacity', (clockPct / 100).toString());
    SURFACE_COLORS.forEach(c => { if (c.el) store.set(c.key, c.el.value); });
    const newName = userNameInput?.value.trim();
    if (newName) {
      store.set('userName', newName);
      userName = newName;
      updateTime(true);
    }

    // Persist text shade (gradient) toggle
    store.set('textShade', String(shadeOn));

    // Parse & persist Google Font
    const fontRaw = googleFontInput?.value.trim();
    if (fontRaw) {
      const parsed = parseGoogleFontInput(fontRaw);
      if (parsed) {
        applyGoogleFont(parsed.familyName, parsed.cssHref);
        store.set('googleFontFamily', parsed.familyName);
        store.set('googleFontHref', parsed.cssHref);
      } else {
        alert('Could not read that as a Google Font link. Paste a link from fonts.google.com, or leave it blank for the default font.');
      }
    } else {
      // Cleared — fall back to the default font
      applyGoogleFont(null, null);
      store.remove('googleFontFamily');
      store.remove('googleFontHref');
    }

    themeSaveBtn.textContent = 'Saved!';
    setTimeout(() => themeSaveBtn.textContent = 'Save Theme', 1500);
  });

  // Tab switching (shared Save Theme bar only shows on the theme-related tabs)
  const THEME_TABS = ['tab-theme', 'tab-background', 'tab-layout', 'tab-matrix'];
  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
      const saveBar = document.getElementById('theme-save-bar');
      if (saveBar) saveBar.style.display = THEME_TABS.includes(tab.dataset.tab) ? '' : 'none';
    });
  });

  // =========================
  // Backup: export / import all saved settings
  // =========================
  const backupExportBtn  = document.getElementById('backup-export-btn');
  const backupImportBtn  = document.getElementById('backup-import-btn');
  const backupImportFile = document.getElementById('backup-import-file');
  const backupStatus     = document.getElementById('backup-status');

  function backupMsg(text, ok = true) {
    if (!backupStatus) return;
    backupStatus.textContent = text;
    backupStatus.style.color = ok ? 'var(--accent)' : '#ff6b6b';
  }

  backupExportBtn?.addEventListener('click', () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        data[k] = localStorage.getItem(k);
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `darkarash-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      backupMsg('Exported!');
    } catch {
      backupMsg('Export failed.', false);
    }
  });

  backupImportBtn?.addEventListener('click', () => backupImportFile?.click());

  backupImportFile?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad format');
        const entries = Object.entries(data).filter(([, v]) => typeof v === 'string');
        if (!entries.length) throw new Error('empty');
        if (!confirm(`Import ${entries.length} settings? This overwrites your current ones.`)) {
          backupImportFile.value = '';
          return;
        }
        let failed = false;
        entries.forEach(([k, v]) => { if (!store.set(k, v)) failed = true; });
        if (failed) { backupMsg('Some items could not be saved (storage full?).', false); backupImportFile.value = ''; return; }
        backupMsg('Imported! Reloading...');
        setTimeout(() => location.reload(), 600);
      } catch {
        backupMsg('Invalid backup file.', false);
      }
      backupImportFile.value = '';
    };
    reader.onerror = () => backupMsg('Could not read file.', false);
    reader.readAsText(file);
  });

  // Todo panel restore
  const todoVisible = store.get('todoPanelVisible') === 'true';
  setPanelVisibility(todoVisible, false);

  // Custom Quotes settings
  const quotesInput   = document.getElementById('custom-quotes-input');
  const quotesSaveBtn = document.getElementById('quotes-save-btn');
  const quotesError   = document.getElementById('quotes-error');

  if (userNameInput) userNameInput.value = store.get('userName', '');

  // Populate textarea with saved quotes
  if (quotesInput) {
    const saved = store.getJSON('customQuotes', null);
    if (Array.isArray(saved) && saved.length) {
      quotesInput.value = JSON.stringify(saved, null, 2);
    }
  }

  quotesSaveBtn?.addEventListener('click', () => {
    if (!quotesInput || !quotesError) return;
    quotesError.textContent = '';
    const raw = quotesInput.value.trim();

    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      quotesError.textContent = 'Invalid JSON — check your format.';
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      quotesError.textContent = 'Must be a non-empty JSON array of strings.';
      return;
    }

    // Filter to strings only
    const quotes = parsed.filter(q => typeof q === 'string' && q.trim().length > 0);
    if (quotes.length === 0) {
      quotesError.textContent = 'No valid string entries found in the array.';
      return;
    }

    const ok = store.setJSON('customQuotes', quotes);
    if (!ok) {
      quotesError.textContent = 'Could not save — storage may be full.';
      return;
    }

    loadQuote();
    quotesSaveBtn.textContent = 'Saved!';
    setTimeout(() => quotesSaveBtn.textContent = 'Save Quotes', 1500);
  });
});

// =========================
// Quote System — custom quotes only, no AI API
// =========================
const FALLBACK_QUOTES = [
  'Discipline or regret. Pick one.',
  'Nobody cares. Work harder.',
  'Burn the boats. No retreat.',
  'Consistency is the only superpower.',
  'The world owes you zero. Earn it.',
  'Obsession beats talent every time.',
  'Pain is the tax for greatness.',
  'Shut up. Put in the work.'
];

function loadQuote() {
  if (!motivationEl) return;

  const custom = store.getJSON('customQuotes', null);
  const pool = (Array.isArray(custom) && custom.length > 0) ? custom : FALLBACK_QUOTES;

  // Rotate by day so quote changes daily but stays consistent within the day
  const d = new Date();
  const idx = (d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate()) % pool.length;
  motivationEl.textContent = pool[idx];
}

loadQuote();

// =========================
// Google Apps panel toggle
// =========================
if (appsToggle && appsPanel) {
  let isAppsPanelOpen = false;

  appsPanel.setAttribute('tabindex', '-1');
  appsPanel.style.display = 'none';
  appsToggle.setAttribute('aria-expanded', 'false');
  appsPanel.setAttribute('aria-hidden', 'true');

  const setAppsPanel = (open) => {
    isAppsPanelOpen = open;
    appsPanel.style.display = open ? 'grid' : 'none';
    appsToggle.setAttribute('aria-expanded', String(open));
    appsPanel.setAttribute('aria-hidden', String(!open));
    if (open) appsPanel.focus();
  };

  appsToggle.addEventListener('click', e => { e.stopPropagation(); setAppsPanel(!isAppsPanelOpen); });

  document.addEventListener('click', e => {
    if (isAppsPanelOpen && !appsToggle.contains(e.target) && !appsPanel.contains(e.target))
      setAppsPanel(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isAppsPanelOpen) { setAppsPanel(false); appsToggle.focus(); }
  });
}

// =========================
// Clock + Greeting
// =========================
function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

let lastMinute = -1;
let lastDateStr = '';

function updateTime(force = false) {
  const now = new Date();
  const hours = now.getHours();
  const mins  = now.getMinutes();

  if (!force && mins === lastMinute) return;
  lastMinute = mins;

  if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  const dateStr = formatDate(now);
  if (dateStr !== lastDateStr) { lastDateStr = dateStr; if (dateEl) dateEl.textContent = dateStr; }

  if (greetingEl) {
    const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
    greetingEl.textContent = `${greeting} ${userName}...`;
  }
}

updateTime();
// Single interval at 10s — no redundant setTimeout
setInterval(updateTime, 10000);

// =========================
// Search Engine Switching
// =========================
const ENGINE_MAP = { G:'google', B:'bing', D:'duckduckgo', Y:'youtube', I:'google-images', YA:'yandex', YI:'yandex-images', S:'shodan' };
const SEARCH_URLS = {
  google: q => q ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : 'https://www.google.com',
  bing:   q => q ? `https://www.bing.com/search?q=${encodeURIComponent(q)}` : 'https://www.bing.com',
  duckduckgo: q => q ? `https://duckduckgo.com/?q=${encodeURIComponent(q)}` : 'https://duckduckgo.com',
  youtube:  q => q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com',
  'google-images': q => q ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}` : 'https://www.google.com/imghp',
  yandex: q => q ? `https://yandex.com/search/?text=${encodeURIComponent(q)}` : 'https://yandex.com',
  'yandex-images': q => q ? `https://yandex.com/images/search?text=${encodeURIComponent(q)}` : 'https://yandex.com/images',
  shodan: q => q ? `https://www.shodan.io/search?query=${encodeURIComponent(q)}` : 'https://www.shodan.io',
};

let currentEngine = 'google';
engineBtns[0]?.classList.add('active');

engineBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    engineBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentEngine = ENGINE_MAP[btn.textContent.trim().toUpperCase()] ?? 'google';
  });
});

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const query = searchInput?.value.trim() ?? '';
  const urlFn = SEARCH_URLS[currentEngine] ?? SEARCH_URLS.google;
  window.location.href = urlFn(query);
  if (searchInput) searchInput.value = '';
});

// =========================
// Bookmark clicks — safe URL guard
// =========================
document.querySelectorAll('.bookmark-card').forEach(card => {
  card.addEventListener('click', () => {
    const link = card.getAttribute('data-link');
    if (isSafeUrl(link)) window.location.href = link;
  });
});

// =========================
// Todo Panel
// =========================
function setPanelVisibility(show, showForm) {
  if (!panel || !todoForm) return;
  panel.style.display = show ? 'flex' : 'none';
  store.set('todoPanelVisible', String(show));
  todoForm.style.display = showForm ? 'flex' : 'none';
}

let clickTimeout = null;

toggleBtn?.addEventListener('click', () => {
  if (clickTimeout) clearTimeout(clickTimeout);
  clickTimeout = setTimeout(() => {
    const isVisible = panel?.style.display === 'flex';
    setPanelVisibility(!isVisible, false);
  }, 250);
});

toggleBtn?.addEventListener('dblclick', () => {
  if (clickTimeout) clearTimeout(clickTimeout);
  setPanelVisibility(true, true);
});

// =========================
// Todo Data
// Invariant: todos.length === todoChecked.length always enforced on load
// =========================
let todos       = store.getJSON('todos', []);
let todoChecked = store.getJSON('todoChecked', []);

// Repair length mismatch (corrupted state guard)
if (!Array.isArray(todos))       todos = [];
if (!Array.isArray(todoChecked)) todoChecked = [];
while (todoChecked.length < todos.length) todoChecked.push(false);
todoChecked = todoChecked.slice(0, todos.length); // trim excess

function saveTodos() {
  store.setJSON('todos', todos);
  store.setJSON('todoChecked', todoChecked);
}

// PERF: update a single item in the DOM instead of full rebuild on toggle
function renderSingleTodo(li, idx) {
  const checked = !!todoChecked[idx];
  li.classList.toggle('checked', checked);
  const checkbox = li.querySelector('.task-checkbox');
  if (checkbox) {
    checkbox.innerHTML = checked
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="0.5" width="13" height="13" rx="3.5" fill="rgba(255,169,169,0.2)" stroke="var(--accent)"/><path d="M3 7l3 3 5-5" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="0.5" width="13" height="13" rx="3.5" stroke="rgba(255,255,255,0.25)"/></svg>`;
  }
}

function renderTodos() {
  if (!todoList) return;
  const fragment = document.createDocumentFragment();

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.dataset.idx = idx;

    const checkbox = document.createElement('span');
    checkbox.className = 'task-checkbox';

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = todo; // textContent — XSS safe

    const btn = document.createElement('button');
    btn.textContent = '×'; // textContent — XSS safe
    btn.title = 'Delete task';
    btn.onclick = e => {
      e.stopPropagation();
      todos.splice(idx, 1);
      todoChecked.splice(idx, 1);
      saveTodos();
      renderTodos(); // full rebuild only on delete (index shift)
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(btn);

    li.addEventListener('click', () => {
      todoChecked[idx] = !todoChecked[idx];
      saveTodos();
      renderSingleTodo(li, idx); // ← targeted update, no full rebuild
    });

    renderSingleTodo(li, idx);
    fragment.appendChild(li);
  });

  todoList.innerHTML = '';
  todoList.appendChild(fragment);
}

todoForm?.addEventListener('submit', e => {
  e.preventDefault();
  const val = todoInput?.value.trim();
  if (val) {
    todos.push(val);
    todoChecked.push(false);
    saveTodos();
    if (todoInput) todoInput.value = '';
    renderTodos();
  }
});

renderTodos();

// =========================
// Bookmark Editing
// =========================
const bookmarkCards     = document.querySelectorAll('.bookmark-card');
const bookmarkSelect    = document.getElementById('bookmark-select');
const bookmarkUrlInput  = document.getElementById('bookmark-url-input');
const bookmarkImgUrl    = document.getElementById('bookmark-img-url');
const bookmarkImgFile   = document.getElementById('bookmark-img-file');
const bookmarkSaveBtn   = document.getElementById('bookmark-save-btn');
const bookmarkResetBtn  = document.getElementById('bookmark-reset-btn');
const bookmarkTitleInput= document.getElementById('bookmark-title-input');
const bookmarkColorInput= document.getElementById('bookmark-color-input');

const bookmarkDefaults = [];
bookmarkCards.forEach((card, i) => {
  bookmarkDefaults.push({
    label: card.getAttribute('title') || `Bookmark ${i + 1}`,
    url:   card.getAttribute('data-link') || '',
    img:   card.querySelector('img')?.getAttribute('src') || '',
    color: card.style.getPropertyValue('--border') || ''
  });
});

if (bookmarkSelect) {
  bookmarkCards.forEach((card, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = card.getAttribute('title') || `Bookmark ${i + 1}`;
    bookmarkSelect.appendChild(opt);
  });
}

function getSavedBookmarks() {
  return store.getJSON('bookmarkOverrides', {});
}

function applyBookmarkOverrides() {
  const saved = getSavedBookmarks();
  bookmarkCards.forEach((card, i) => {
    const override = saved[i];
    if (!override) return;
    if (override.label) card.setAttribute('title', override.label);
    // Guard URLs before applying
    if (override.url && isSafeUrl(override.url)) card.setAttribute('data-link', override.url);
    const img = card.querySelector('img');
    if (img && override.img) img.src = override.img;
    if (override.color) card.style.setProperty('--border', override.color);
    const opt = bookmarkSelect?.options[i];
    if (opt) opt.textContent = override.label || card.getAttribute('title') || `Bookmark ${i + 1}`;
  });
}

applyBookmarkOverrides();

let pendingImgData = null;

bookmarkSelect?.addEventListener('change', () => {
  const i = parseInt(bookmarkSelect.value);
  if (isNaN(i)) return;
  const card = bookmarkCards[i];
  if (!card) return;
  const saved = getSavedBookmarks();
  const override = saved[i] || {};

  pendingImgData = null; // clear pending on selection change
  if (bookmarkUrlInput)  bookmarkUrlInput.value  = override.url || card.getAttribute('data-link') || '';
  if (bookmarkImgUrl)    bookmarkImgUrl.value     = (override.img && !override.img.startsWith('data:')) ? override.img : '';
  if (bookmarkTitleInput)bookmarkTitleInput.value = override.label || card.getAttribute('title') || '';
  if (bookmarkImgFile)   bookmarkImgFile.value    = '';
  if (bookmarkColorInput) {
    const c = override.color || card.style.getPropertyValue('--border') || '#ffffff';
    bookmarkColorInput.value = /^#[0-9a-fA-F]{6}$/.test(c.trim()) ? c.trim() : '#ffffff';
  }
});

bookmarkSelect?.dispatchEvent(new Event('change'));

bookmarkImgFile?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) { pendingImgData = null; return; }
  if (file.size > 2 * 1024 * 1024) {
    alert('Bookmark image must be under 2MB.');
    bookmarkImgFile.value = '';
    pendingImgData = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => { pendingImgData = ev.target.result; if (bookmarkImgUrl) bookmarkImgUrl.value = ''; };
  reader.onerror = () => { pendingImgData = null; };
  reader.readAsDataURL(file);
});

bookmarkImgUrl?.addEventListener('input', () => {
  pendingImgData = null;
  if (bookmarkImgFile) bookmarkImgFile.value = '';
});

bookmarkSaveBtn?.addEventListener('click', () => {
  const i = parseInt(bookmarkSelect?.value);
  if (isNaN(i)) return;
  const card = bookmarkCards[i];
  if (!card) return;

  const saved = getSavedBookmarks();
  const newUrl   = bookmarkUrlInput?.value.trim() || '';
  const newImg   = pendingImgData || bookmarkImgUrl?.value.trim() || '';
  const newLabel = bookmarkTitleInput?.value.trim() || '';
  const newColor = bookmarkColorInput?.value || '';

  if (!saved[i]) saved[i] = {};

  // Validate URL before saving
  if (newUrl) {
    if (isSafeUrl(newUrl)) { saved[i].url = newUrl; card.setAttribute('data-link', newUrl); }
    else alert('Invalid URL. Only http/https links are allowed.');
  }
  if (newImg)   { saved[i].img   = newImg; const img = card.querySelector('img'); if (img) img.src = newImg; }
  if (newLabel) { saved[i].label = newLabel; card.setAttribute('title', newLabel); }
  if (newColor) { saved[i].color = newColor; card.style.setProperty('--border', newColor); }

  const ok = store.setJSON('bookmarkOverrides', saved);
  if (!ok) alert('Could not save bookmark — storage may be full.');

  const opt = bookmarkSelect?.options[i];
  if (opt) opt.textContent = newLabel || card.getAttribute('title') || `Bookmark ${i + 1}`;

  bookmarkSaveBtn.textContent = 'Saved!';
  setTimeout(() => bookmarkSaveBtn.textContent = 'Save', 1500);
  pendingImgData = null;
  if (bookmarkImgFile) bookmarkImgFile.value = '';
});

bookmarkResetBtn?.addEventListener('click', () => {
  const i = parseInt(bookmarkSelect?.value);
  if (isNaN(i)) return;
  const card = bookmarkCards[i];
  const def  = bookmarkDefaults[i];
  if (!card || !def) return;

  const saved = getSavedBookmarks();
  delete saved[i];
  store.setJSON('bookmarkOverrides', saved);

  card.setAttribute('data-link', def.url);
  card.setAttribute('title', def.label);
  const img = card.querySelector('img');
  if (img) img.src = def.img;
  if (def.color) card.style.setProperty('--border', def.color);

  if (bookmarkUrlInput)   bookmarkUrlInput.value   = def.url;
  if (bookmarkImgUrl)     bookmarkImgUrl.value      = '';
  if (bookmarkImgFile)    bookmarkImgFile.value     = '';
  if (bookmarkTitleInput) bookmarkTitleInput.value  = def.label;
  if (bookmarkColorInput) bookmarkColorInput.value  = /^#[0-9a-fA-F]{6}$/.test((def.color || '').trim()) ? def.color.trim() : '#ffffff';
  pendingImgData = null;

  const opt = bookmarkSelect?.options[i];
  if (opt) opt.textContent = def.label;

  bookmarkResetBtn.textContent = 'Reset!';
  setTimeout(() => bookmarkResetBtn.textContent = 'Reset to Default', 1500);
});

// =========================
// Todo Panel Drag
// =========================
(function initTodoDrag() {
  if (!panel || !todoForm) return;

  let dragging = false;
  let startX, startY, origLeft, origTop;

  const savedPos = store.getJSON('todoPanelPos', null);
  if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
    panel.style.position = 'fixed';
    panel.style.left   = savedPos.left + 'px';
    panel.style.top    = savedPos.top  + 'px';
    panel.style.right  = 'auto';
    panel.style.bottom = 'auto';
  }

  function isViewMode() { return !todoForm || todoForm.style.display === 'none' || todoForm.style.display === ''; }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  function startDrag(clientX, clientY) {
    dragging = true;
    panel.style.position = 'fixed';
    panel.style.right  = 'auto';
    panel.style.bottom = 'auto';
    const rect = panel.getBoundingClientRect();
    panel.style.left = rect.left + 'px';
    panel.style.top  = rect.top  + 'px';
    startX = clientX; startY = clientY;
    origLeft = rect.left; origTop = rect.top;
  }

  function moveDrag(clientX, clientY) {
    if (!dragging) return;
    panel.style.left = clamp(origLeft + clientX - startX, 0, window.innerWidth  - panel.offsetWidth)  + 'px';
    panel.style.top  = clamp(origTop  + clientY - startY, 0, window.innerHeight - panel.offsetHeight) + 'px';
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    panel.style.cursor = '';
    panel.style.userSelect = '';
    store.setJSON('todoPanelPos', { left: parseFloat(panel.style.left), top: parseFloat(panel.style.top) });
  }

  panel.addEventListener('mousedown', e => {
    if (!isViewMode() || e.target.closest('button,input,a,.task-checkbox')) return;
    startDrag(e.clientX, e.clientY);
    panel.style.cursor = 'grabbing';
    panel.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', endDrag);

  panel.addEventListener('touchstart', e => {
    if (!isViewMode() || e.target.closest('button,input,a,.task-checkbox')) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', endDrag);

  panel.addEventListener('mouseover', () => { if (isViewMode() && !dragging) panel.style.cursor = 'grab'; });
  panel.addEventListener('mouseout',  () => { if (!dragging) panel.style.cursor = ''; });
})();

// =========================
// Settings tab bar — horizontal scroll (wheel, touch, scrollbar) + keep active tab in view
// =========================
(function initScrollableTabs() {
  const bar = document.getElementById('settings-tabs');
  if (!bar) return;

  // Mouse wheel scrolls the tab bar sideways
  bar.addEventListener('wheel', e => {
    if (bar.scrollWidth <= bar.clientWidth) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;
    bar.scrollLeft += delta;
    e.preventDefault();
  }, { passive: false });

  // Bring the clicked tab fully into view
  bar.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      const barRect = bar.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      if (tabRect.left < barRect.left) {
        bar.scrollBy({ left: tabRect.left - barRect.left - 8, behavior: 'smooth' });
      } else if (tabRect.right > barRect.right) {
        bar.scrollBy({ left: tabRect.right - barRect.right + 8, behavior: 'smooth' });
      }
    });
  });
})();

// =========================
// Weather widget
// Providers: Open-Meteo (free, no API key — default) or OpenWeatherMap (your own API key).
// Saved in localStorage: weatherEnabled, weatherProvider, weatherCity, weatherApiKey,
// weatherUnits, weatherGeo, weatherCache — so Backup export/import covers them too.
// =========================
(function initWeather() {
  const widget   = document.getElementById('weather-widget');
  if (!widget) return;
  const iconEl   = document.getElementById('weather-icon');
  const tempEl   = document.getElementById('weather-temp');
  const cityEl   = document.getElementById('weather-city');
  const condEl   = document.getElementById('weather-cond');

  const toggleBtn   = document.getElementById('weather-toggle-btn');
  const providerSel = document.getElementById('weather-provider');
  const keyWrap     = document.getElementById('weather-key-wrap');
  const keyInput    = document.getElementById('weather-api-key');
  const cityInput   = document.getElementById('weather-city-input');
  const unitsSel    = document.getElementById('weather-units');
  const saveBtn     = document.getElementById('weather-save-btn');
  const statusEl    = document.getElementById('weather-status');

  const REFRESH_MS = 15 * 60 * 1000;
  let enabled = store.get('weatherEnabled', 'true') !== 'false';
  let timer = null;
  let reqId = 0;

  function cfg() {
    return {
      provider: store.get('weatherProvider', 'openmeteo') === 'owm' ? 'owm' : 'openmeteo',
      city:     (store.get('weatherCity', 'Dhaka') || '').trim(),
      apiKey:   (store.get('weatherApiKey', '') || '').trim(),
      units:    store.get('weatherUnits', 'c') === 'f' ? 'f' : 'c'
    };
  }

  function status(text, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = ok ? 'var(--accent)' : '#ff6b6b';
  }

  // Inline SVG icons (stroke = accent colour, no emoji, works offline)
  const ICONS = {
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon:    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    partly:  '<circle cx="8" cy="8" r="3"/><path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7"/><path d="M19 19H11a4 4 0 1 1 .8-7.9A5 5 0 0 1 19 19z"/>',
    cloud:   '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    fog:     '<path d="M3 8h18M3 12h18M5 16h14M8 20h8"/>',
    rain:    '<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/>',
    snow:    '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/>',
    storm:   '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>',
    unknown: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    warn:    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    key:     '<circle cx="8" cy="15" r="4"/><path d="M10.85 12.15L19 4M18 5l3 3M15 8l3 3"/>',
    loading: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
  };

  function iconSVG(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[key] || ICONS.unknown) + '</svg>';
  }

  function show(icon, temp, city, title, cond) {
    iconEl.innerHTML = iconSVG(icon);
    iconEl.className = 'wi-' + icon;
    tempEl.textContent = temp;
    cityEl.textContent = city || '';
    if (condEl) condEl.textContent = cond || '';
    widget.title = title || 'Weather';
  }

  function setToggleUI() {
    if (!toggleBtn) return;
    toggleBtn.textContent = enabled ? 'On' : 'Off';
    toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggleBtn.classList.toggle('on', enabled);
  }

  function updateKeyVisibility() {
    if (keyWrap && providerSel) keyWrap.style.display = providerSel.value === 'owm' ? 'flex' : 'none';
  }

  // ---- WMO weather code → emoji + label (Open-Meteo) ----
  function wmo(code, isDay) {
    if (code === 0) return [isDay ? 'sun' : 'moon', 'Clear sky'];
    if (code === 1) return [isDay ? 'partly' : 'moon', 'Mainly clear'];
    if (code === 2) return ['partly', 'Partly cloudy'];
    if (code === 3) return ['cloud', 'Overcast'];
    if (code === 45 || code === 48) return ['fog', 'Fog'];
    if (code >= 51 && code <= 57) return ['rain', 'Drizzle'];
    if (code >= 61 && code <= 67) return ['rain', 'Rain'];
    if (code >= 71 && code <= 77) return ['snow', 'Snow'];
    if (code >= 80 && code <= 82) return ['rain', 'Rain showers'];
    if (code === 85 || code === 86) return ['snow', 'Snow showers'];
    if (code >= 95) return ['storm', 'Thunderstorm'];
    return ['unknown', 'Unknown'];
  }

  function owmIcon(main, iconCode) {
    const night = typeof iconCode === 'string' && iconCode.endsWith('n');
    switch (main) {
      case 'Clear':        return night ? 'moon' : 'sun';
      case 'Clouds':       return iconCode && iconCode.startsWith('02') ? 'partly' : 'cloud';
      case 'Drizzle':      return 'rain';
      case 'Rain':         return 'rain';
      case 'Thunderstorm': return 'storm';
      case 'Snow':         return 'snow';
      default:             return 'fog'; // Mist, Fog, Haze, Smoke, Dust...
    }
  }

  async function getJSON(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  async function fetchOpenMeteo(c) {
    let geo = store.getJSON('weatherGeo', null);
    if (!geo || geo.query !== c.city.toLowerCase()) {
      const g = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(c.city)}&count=1&language=en&format=json`);
      const r = g && g.results && g.results[0];
      if (!r) throw new Error('City not found');
      geo = { query: c.city.toLowerCase(), lat: r.latitude, lon: r.longitude, name: r.name };
      store.setJSON('weatherGeo', geo);
    }
    const unit = c.units === 'f' ? 'fahrenheit' : 'celsius';
    const w = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code,is_day&temperature_unit=${unit}`);
    const cur = w && w.current;
    if (!cur) throw new Error('No data');
    const [icon, label] = wmo(cur.weather_code, cur.is_day === 1);
    return { icon, label, temp: Math.round(cur.temperature_2m), city: geo.name };
  }

  async function fetchOWM(c) {
    const unit = c.units === 'f' ? 'imperial' : 'metric';
    const w = await getJSON(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(c.city)}&appid=${encodeURIComponent(c.apiKey)}&units=${unit}`);
    const cond = w.weather && w.weather[0];
    if (!w.main || !cond) throw new Error('No data');
    const label = cond.description ? cond.description.charAt(0).toUpperCase() + cond.description.slice(1) : cond.main;
    return { icon: owmIcon(cond.main, cond.icon), label, temp: Math.round(w.main.temp), city: w.name || c.city };
  }

  function render(d, c) {
    const deg = c.units === 'f' ? '°F' : '°C';
    show(d.icon, `${d.temp}${deg}`, d.city, `${d.label} — ${d.city}\nClick to refresh`, d.label);
  }

  function cacheKey(c) { return [c.provider, c.city.toLowerCase(), c.units].join('|'); }

  async function refresh(force = false) {
    const my = ++reqId;
    clearTimeout(timer);
    if (!enabled) { widget.style.display = 'none'; return; }
    widget.style.display = 'inline-flex';

    const c = cfg();
    if (!c.city) { show('warn', '--', '', 'Set a city in Settings → Weather'); return; }
    if (c.provider === 'owm' && !c.apiKey) { show('key', 'API key', '', 'Add your OpenWeatherMap API key in Settings → Weather'); return; }

    const cache = store.getJSON('weatherCache', null);
    const cacheOk = cache && cache.key === cacheKey(c);
    if (cacheOk) {
      render(cache.data, c);
      if (!force && Date.now() - cache.t < REFRESH_MS) {
        timer = setTimeout(() => refresh(), REFRESH_MS - (Date.now() - cache.t));
        return;
      }
    } else {
      show('loading', '...', '', 'Loading weather...');
    }

    try {
      const data = c.provider === 'owm' ? await fetchOWM(c) : await fetchOpenMeteo(c);
      if (my !== reqId) return;
      store.setJSON('weatherCache', { key: cacheKey(c), t: Date.now(), data });
      render(data, c);
      status('');
    } catch (err) {
      if (my !== reqId) return;
      let msg = err && err.message ? err.message : 'Failed';
      if (err && err.name === 'AbortError') msg = 'Timed out';
      else if (err && err.status === 401) msg = 'Invalid API key';
      else if (err && err.status === 404) msg = 'City not found';
      if (!cacheOk) show('warn', '--', '', `Weather error: ${msg}\nClick to retry`);
      status(`Weather error: ${msg}`, false);
    }
    if (my === reqId) timer = setTimeout(() => refresh(), REFRESH_MS);
  }

  // Populate settings fields
  (function fill() {
    const c = cfg();
    if (providerSel) providerSel.value = c.provider;
    if (keyInput) keyInput.value = c.apiKey;
    if (cityInput) cityInput.value = c.city;
    if (unitsSel) unitsSel.value = c.units;
    setToggleUI();
    updateKeyVisibility();
  })();

  providerSel?.addEventListener('change', updateKeyVisibility);

  toggleBtn?.addEventListener('click', () => {
    enabled = !enabled;
    store.set('weatherEnabled', String(enabled));
    setToggleUI();
    refresh();
  });

  saveBtn?.addEventListener('click', () => {
    const provider = providerSel?.value === 'owm' ? 'owm' : 'openmeteo';
    const city = cityInput?.value.trim() || '';
    const apiKey = keyInput?.value.trim() || '';
    const units = unitsSel?.value === 'f' ? 'f' : 'c';

    if (!city) { status('Enter a city.', false); return; }
    if (provider === 'owm' && !apiKey) { status('Enter your OpenWeatherMap API key.', false); return; }

    store.set('weatherProvider', provider);
    store.set('weatherCity', city);
    store.set('weatherApiKey', apiKey);
    store.set('weatherUnits', units);
    store.remove('weatherCache');
    store.remove('weatherGeo');

    saveBtn.textContent = 'Saved!';
    setTimeout(() => saveBtn.textContent = 'Save Weather', 1500);
    status('Loading...');
    refresh(true);
  });

  widget.addEventListener('click', () => refresh(true));

  refresh();
})();


// =========================
// Bookmark background opacity (card background only — border and image are untouched)
// Applies live and saves on each click (separate from the per-bookmark Save button).
// =========================
(function initBookmarkOpacity() {
  const decBtn  = document.getElementById('bookmark-opacity-decrement');
  const incBtn  = document.getElementById('bookmark-opacity-increment');
  const valueEl = document.getElementById('bookmark-opacity-value');
  if (!decBtn || !incBtn || !valueEl) return;

  const MIN = 0, MAX = 100, STEP = 5;
  const DEFAULT_ALPHA = 0.443; // the original #00000071 background

  let alpha = parseFloat(store.get('bookmarkOpacity'));
  if (isNaN(alpha)) alpha = DEFAULT_ALPHA;
  let pct = Math.min(MAX, Math.max(MIN, Math.round(alpha * 100)));

  function apply(p, save) {
    document.documentElement.style.setProperty('--bookmark-opacity', (p / 100).toString());
    valueEl.textContent = `${p}%`;
    if (save) store.set('bookmarkOpacity', (p / 100).toString());
  }

  // Apply the saved value; with nothing saved, leave the original look exactly as it was
  if (store.get('bookmarkOpacity') !== null) apply(pct, false);
  else valueEl.textContent = `${pct}%`;

  decBtn.addEventListener('click', () => { pct = Math.max(MIN, pct - STEP); apply(pct, true); });
  incBtn.addEventListener('click', () => { pct = Math.min(MAX, pct + STEP); apply(pct, true); });
})();


// =========================
// Nord colour swatches (click a dot to fill the colour picker above it)
// accent  = Nord Aurora + Frost (red, orange, yellow, green, teal, cyan, blue, deep blue, purple, snow)
// dark    = Nord Polar Night (for card / panel backgrounds)
// =========================
(function initNordSwatches() {
  const PALETTES = {
    accent: [
      ['Red', '#BF616A'], ['Orange', '#D08770'], ['Yellow', '#EBCB8B'], ['Green', '#A3BE8C'],
      ['Teal', '#8FBCBB'], ['Cyan', '#88C0D0'], ['Blue', '#81A1C1'], ['Deep Blue', '#5E81AC'],
      ['Purple', '#B48EAD'], ['Snow', '#ECEFF4']
    ],
    dark: [
      ['Polar 1', '#2E3440'], ['Polar 2', '#3B4252'], ['Polar 3', '#434C5E'], ['Polar 4', '#4C566A'],
      ['Black', '#000000']
    ]
  };
  document.querySelectorAll('.swatches').forEach(box => {
    const input = document.getElementById(box.dataset.for);
    const list = PALETTES[box.dataset.palette];
    if (!input || !list) return;
    list.forEach(([name, hex]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = `${name} ${hex}`;
      b.setAttribute('aria-label', `${name} ${hex}`);
      b.style.background = hex;
      b.addEventListener('click', () => {
        input.value = hex;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      box.appendChild(b);
    });
  });
})();
