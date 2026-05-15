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
// Secure API Key Storage
// Keys are obfuscated with btoa — not encryption, but stops casual shoulder-surf
// and plain-text grep in DevTools. Never log or expose via innerHTML.
// =========================
const secureStore = {
  _encode(val) { try { return btoa(unescape(encodeURIComponent(val))); } catch { return ''; } },
  _decode(val) { try { return decodeURIComponent(escape(atob(val))); } catch { return ''; } },
  set(key, val) { return store.set('_s_' + key, this._encode(val)); },
  get(key, fallback = '') { const v = store.get('_s_' + key, null); return v ? this._decode(v) : fallback; },
  remove(key) { store.remove('_s_' + key); }
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
// DOMContentLoaded — Settings wiring
// =========================
let userName = store.get('userName', 'there');

window.addEventListener('DOMContentLoaded', () => {
  const colorPicker   = document.getElementById('color-picker');
  const bgPicker      = document.getElementById('bg-picker');
  const themeSaveBtn  = document.getElementById('theme-save-btn');
  const userNameInput = document.getElementById('user-name');

  // Apply saved accent
  const savedColor = store.get('accentColor');
  if (savedColor) { applyAccent(savedColor); if (colorPicker) colorPicker.value = savedColor; }

  // Apply saved bg
  const savedBg = store.get('bgImage');
  if (savedBg) document.documentElement.style.setProperty('--bg-image', savedBg);

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
    const newName = userNameInput?.value.trim();
    if (newName) {
      store.set('userName', newName);
      userName = newName;
      updateTime(true);
    }
    themeSaveBtn.textContent = 'Saved!';
    setTimeout(() => themeSaveBtn.textContent = 'Save Theme', 1500);
  });

  // Tab switching
  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });

  // Todo panel restore
  const todoVisible = store.get('todoPanelVisible') === 'true';
  setPanelVisibility(todoVisible, false);

  // AI settings — use secureStore for API key, regular store for others
  const aiBaseUrl    = document.getElementById('ai-base-url');
  const aiApiKey     = document.getElementById('ai-api-key');
  const aiModel      = document.getElementById('ai-model');
  const aiQuoteStyle = document.getElementById('ai-quote-style');
  const aiSaveBtn    = document.getElementById('ai-save-btn');

  if (aiBaseUrl)    aiBaseUrl.value    = store.get('aiBaseUrl', '');
  if (aiApiKey)     aiApiKey.value     = secureStore.get('aiApiKey', '');  // ← secure
  if (aiModel)      aiModel.value      = store.get('aiModel', '');
  if (aiQuoteStyle) aiQuoteStyle.value = store.get('aiQuoteStyle', 'motivational');

  if (userNameInput) userNameInput.value = store.get('userName', '');

  aiSaveBtn?.addEventListener('click', () => {
    store.set('aiBaseUrl', aiBaseUrl?.value.trim() || '');
    secureStore.set('aiApiKey', aiApiKey?.value.trim() || '');  // ← secure
    store.set('aiModel', aiModel?.value.trim() || '');
    store.set('aiQuoteStyle', aiQuoteStyle?.value.trim() || 'motivational');
    store.remove('aiQuoteCache');
    aiSaveBtn.textContent = 'Fetching...';
    loadQuote(true).then(() => {
      aiSaveBtn.textContent = 'Saved!';
      setTimeout(() => aiSaveBtn.textContent = 'Save & Refresh', 1500);
    });
  });
});

// =========================
// AI Quote System
// =========================
function getAISettings() {
  return {
    baseUrl: store.get('aiBaseUrl', ''),
    apiKey:  secureStore.get('aiApiKey', ''),  // ← secure read
    model:   store.get('aiModel', ''),
    style:   store.get('aiQuoteStyle', 'motivational')
  };
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function fetchAIQuote(forceRefresh) {
  const { baseUrl, apiKey, model, style } = getAISettings();
  if (!baseUrl || !apiKey || !model) return null;

  // Validate baseUrl is a safe URL before fetching
  if (!isSafeUrl(baseUrl)) return null;

  const todayKey = getTodayKey();
  if (!forceRefresh) {
    const cached = store.getJSON('aiQuoteCache');
    if (cached?.key === todayKey && cached?.quote) return cached.quote;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 60,
        messages: [{
          role: 'user',
          content: `Give me one short ${style} quote. Max 12 words. Reply with ONLY the quote, no quote marks, no attribution, no explanation.`
        }]
      })
    });

    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const quote = data?.choices?.[0]?.message?.content?.trim();
    if (quote) {
      store.setJSON('aiQuoteCache', { key: todayKey, quote });
      return quote;
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name !== 'AbortError') console.warn('[NewTab] Quote fetch failed:', err.message);
  }
  return null;
}

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

async function loadQuote(forceRefresh = false) {
  if (!motivationEl) return;
  const aiQuote = await fetchAIQuote(forceRefresh);
  if (aiQuote) { motivationEl.textContent = aiQuote; return; }

  const cached = store.getJSON('aiQuoteCache');
  if (cached?.quote) { motivationEl.textContent = cached.quote; return; }

  const d = new Date();
  motivationEl.textContent = FALLBACK_QUOTES[(d.getDate() + d.getMonth()) % FALLBACK_QUOTES.length];
}

loadQuote(false);

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