// =========================
// DOM Elements
// =========================
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const greetingEl = document.getElementById('greeting');
const searchForm = document.getElementById('search-form');
const searchInput = searchForm.querySelector('input[type="search"]');
const engineButtons = searchForm.querySelectorAll('.engine-icons button');

const appsToggle = document.getElementById('google-apps-btn');
const appsPanel = document.getElementById('google-apps-popup');

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");

const colorPicker = document.getElementById("color-picker");
const bgPicker = document.getElementById("bg-picker");

// FIX: todoIcon was used but never declared — caused silent errors
const todoIcon = document.getElementById("todo-icon");

// Toggle settings panel
settingsBtn.onclick = () => {
  const isFlex = settingsPanel.style.display === "flex";
  settingsPanel.style.display = isFlex ? "none" : "flex";
};

// Background change
bgPicker.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const bg = `url(${ev.target.result})`;
    document.documentElement.style.setProperty("--bg-image", bg);
    localStorage.setItem("bgImage", bg);
  };
  reader.readAsDataURL(file);
});

// Load saved settings
window.addEventListener("DOMContentLoaded", () => {
  const savedColor = localStorage.getItem("accentColor");
  const savedBg = localStorage.getItem("bgImage");
  const todoVisible = localStorage.getItem("todoPanelVisible") === "true";

  if (savedColor) {
    document.documentElement.style.setProperty("--accent", savedColor);
    colorPicker.value = savedColor;
    const hover = getHoverColor(savedColor, -15);
    document.documentElement.style.setProperty("--accent-hover", hover);
    // FIX: todoIcon now properly declared above
    if (todoIcon) {
      const path = todoIcon.querySelector("path");
      if (path) path.setAttribute("fill", savedColor);
    }
  }

  if (savedBg) {
    document.documentElement.style.setProperty("--bg-image", savedBg);
  }

  // FEATURE: persist todo panel open/closed state across reloads & browser restarts
  setPanelVisibility(todoVisible, false);
});

// Consolidated Accent Color Listener
let colorTimeout;
colorPicker.addEventListener("input", (e) => {
  const color = e.target.value;

  requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--accent", color);
    const hover = getHoverColor(color, -15);
    document.documentElement.style.setProperty("--accent-hover", hover);
    if (todoIcon) {
      const path = todoIcon.querySelector("path");
      if (path) path.setAttribute("fill", color);
    }
  });

  // Debounce localStorage saves to avoid excessive writes
  clearTimeout(colorTimeout);
  colorTimeout = setTimeout(() => {
    localStorage.setItem("accentColor", color);
  }, 200);
});

// Function to darken a hex color slightly using HSL
function getHoverColor(hex, amount = -15) {
  if (!hex.startsWith('#')) return hex;

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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


// Make appsPanel focusable for accessibility
appsPanel.setAttribute('tabindex', '-1');
appsPanel.style.display = 'none';
appsToggle.setAttribute('aria-expanded', 'false');
appsPanel.setAttribute('aria-hidden', 'true');

let isAppsPanelOpen = false;

const quotes = [
  "Self-pity is a death sentence. Get up.",
  "Your excuses are well-planned lies.",
  "Kill the version of you that is lazy.",
  "Discipline or regret. Pick one.",
  "Comfort is where dreams go to die.",
  "Nobody cares. Work harder.",
  "Deserve it or don't get it.",
  "Burn the boats. No retreat.",
  "Weakness is a choice. Don't make it.",
  "Be the person your enemies fear.",
  "Don't talk. Just execute.",
  "Consistency is the only superpower.",
  "Average is the enemy. Kill it.",
  "The world owes you zero. Earn it.",
  "Feelings are for losers. Results matter.",
  "Stop negotiating with yourself.",
  "Ambition is nothing without sweat.",
  "Obsession beats talent every time.",
  "Make your results do the talking.",
  "Stay hungry. Stay dangerous.",
  "Excuses are for the forgotten.",
  "Winners find a way. Losers find a 'but'.",
  "Your best wasn't good enough. Do more.",
  "The clock is ticking. Move.",
  "Soft people don't make history.",
  "Pain is the tax for greatness.",
  "Earn your sleep. Every day.",
  "Quit being a spectator in your life.",
  "If it's not hard, it's not worth it.",
  "Shut up. Put in the work."
];

const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start;
const oneDay = 1000 * 60 * 60 * 24;
const dayOfYear = Math.floor(diff / oneDay);

const quote = quotes[dayOfYear % quotes.length];
document.getElementById("motivation").textContent = quote;


// =========================
// Google Apps popup toggle
// =========================
appsToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isAppsPanelOpen) {
    appsPanel.style.display = 'none';
    appsToggle.setAttribute('aria-expanded', 'false');
    appsPanel.setAttribute('aria-hidden', 'true');
    isAppsPanelOpen = false;
  } else {
    appsPanel.style.display = 'grid';
    appsToggle.setAttribute('aria-expanded', 'true');
    appsPanel.setAttribute('aria-hidden', 'false');
    appsPanel.focus();
    isAppsPanelOpen = true;
  }
});

document.addEventListener('click', (e) => {
  if (!appsToggle.contains(e.target) && !appsPanel.contains(e.target)) {
    appsPanel.style.display = 'none';
    appsToggle.setAttribute('aria-expanded', 'false');
    appsPanel.setAttribute('aria-hidden', 'true');
    isAppsPanelOpen = false;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isAppsPanelOpen) {
    appsPanel.style.display = 'none';
    appsToggle.setAttribute('aria-expanded', 'false');
    appsPanel.setAttribute('aria-hidden', 'true');
    appsToggle.focus();
    isAppsPanelOpen = false;
  }
});

// =========================
// Clock + Greeting
// PERF: Only update DOM when minute actually changes (not every second)
// =========================
function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

let lastMinute = -1;
let lastDateStr = '';

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();

  // Only touch the DOM when the minute changes
  if (mins !== lastMinute) {
    lastMinute = mins;

    clockEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const dateStr = formatDate(now);
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      dateEl.textContent = dateStr;
    }

    if (hours < 12) greetingEl.textContent = 'Good Morning Hash...';
    else if (hours < 18) greetingEl.textContent = 'Good Afternoon Hash...';
    else greetingEl.textContent = 'Good Evening Hash...';
  }
}

// PERF: Use a smarter tick — check every 10s instead of every 1s.
// This reduces DOM checks by 6x with no visible difference.
updateTime();
setInterval(updateTime, 10000);

// One immediate 1s tick to catch the first minute boundary quickly on load
setTimeout(() => {
  updateTime();
  // after that, 10s is fine
}, 1000);


// =========================
// Search Engine Switching
// =========================
let currentEngine = 'google';
engineButtons[0].classList.add('active');

engineButtons.forEach(button => {
  button.addEventListener('click', () => {
    engineButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const key = button.textContent.trim().toUpperCase();
    switch (key) {
      case 'G': currentEngine = 'google'; break;
      case 'B': currentEngine = 'bing'; break;
      case 'D': currentEngine = 'duckduckgo'; break;
      case 'Y': currentEngine = 'youtube'; break;
      case 'I': currentEngine = 'google-images'; break;
      case 'YA': currentEngine = 'yandex'; break;
      case 'YI': currentEngine = 'yandex-images'; break;
      case 'S': currentEngine = 'shodan'; break;
      default: currentEngine = 'google';
    }
  });
});

// =========================
// Search form submit
// =========================
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();

  let url = '';

  switch (currentEngine) {
    case 'google':
      url = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
      break;
    case 'bing':
      url = query ? `https://www.bing.com/search?q=${encodeURIComponent(query)}` : 'https://www.bing.com';
      break;
    case 'duckduckgo':
      url = query ? `https://duckduckgo.com/?q=${encodeURIComponent(query)}` : 'https://duckduckgo.com';
      break;
    case 'youtube':
      url = query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : 'https://www.youtube.com';
      break;
    case 'google-images':
      url = query ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}` : 'https://www.google.com/imghp';
      break;
    case 'yandex':
      url = query ? `https://yandex.com/search/?text=${encodeURIComponent(query)}` : 'https://yandex.com';
      break;
    case 'yandex-images':
      url = query ? `https://yandex.com/images/search?text=${encodeURIComponent(query)}` : 'https://yandex.com/images';
      break;
    case 'shodan':
      url = query ? `https://www.shodan.io/search?query=${encodeURIComponent(query)}` : 'https://www.shodan.io';
      break;
  }

  window.location.href = url;
  searchInput.value = '';
});

// =========================
// Bookmark clicks
// =========================
document.querySelectorAll('.bookmark-card').forEach(card => {
  card.addEventListener('click', () => {
    const link = card.getAttribute('data-link');
    if (link) window.location.href = link;
  });
});

// =========================
// Todo Panel Logic
// FEATURE: Panel state (open/closed) persists across reloads and browser restarts via localStorage
// Close by clicking the task toggle icon
// =========================
// Updated Todo toggle behavior: single click shows panel without input form, double click shows panel with input form
const toggleBtn = document.getElementById("todo-toggle");
const panel = document.getElementById("todo-panel");
const todoForm = document.getElementById("todo-form");

let clickTimeout = null;

// Helper to set panel and form visibility
function setPanelVisibility(show, showForm) {
  panel.style.display = show ? "flex" : "none";
  // Persist visibility state
  localStorage.setItem("todoPanelVisible", String(show));
  todoForm.style.display = showForm ? "flex" : "none";
}

// Single click: toggle panel visibility, hide form
toggleBtn.addEventListener("click", (e) => {
  // Use timeout to allow double-click detection
  if (clickTimeout) clearTimeout(clickTimeout);
  clickTimeout = setTimeout(() => {
    const isVisible = panel.style.display === "flex";
    if (isVisible) {
      // hide panel
      setPanelVisibility(false, false);
    } else {
      // show panel without form
      setPanelVisibility(true, false);
    }
  }, 250);
});

// Double click: show panel with form (input field and add button)
// Also ensures panel stays open
toggleBtn.addEventListener("dblclick", (e) => {
  if (clickTimeout) clearTimeout(clickTimeout);
  // Show panel and form
  setPanelVisibility(true, true);
});


// Duplicate todoForm definition removed
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let todoChecked = JSON.parse(localStorage.getItem("todoChecked")) || [];

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
  localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
}

// PERF: Build fragment off-DOM, append once — avoids multiple reflows
function renderTodos() {
  const fragment = document.createDocumentFragment();

  todos.forEach((todo, idx) => {
    const li = document.createElement("li");

    // Checkbox indicator
    const checkbox = document.createElement("span");
    checkbox.className = "task-checkbox";
    checkbox.innerHTML = todoChecked[idx]
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="0.5" width="13" height="13" rx="3.5" fill="rgba(255,169,169,0.2)" stroke="var(--accent)"/><path d="M3 7l3 3 5-5" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="0.5" width="13" height="13" rx="3.5" stroke="rgba(255,255,255,0.25)"/></svg>`;

    const span = document.createElement("span");
    span.textContent = todo;
    span.classList.add("task-text");

    if (todoChecked[idx]) li.classList.add("checked");

    li.appendChild(checkbox);
    li.appendChild(span);

    const btn = document.createElement("button");
    btn.innerHTML = "×";
    btn.title = "Delete task";
    btn.onclick = e => {
      e.stopPropagation();
      todos.splice(idx, 1);
      todoChecked.splice(idx, 1);
      saveTodos();
      renderTodos();
    };
    li.appendChild(btn);

    li.addEventListener('click', () => {
      todoChecked[idx] = !todoChecked[idx];
      saveTodos();
      renderTodos();
    });

    fragment.appendChild(li);
  });

  todoList.innerHTML = "";
  todoList.appendChild(fragment);
}

todoForm.addEventListener("submit", e => {
  e.preventDefault();
  const val = todoInput.value.trim();
  if (val !== "") {
    todos.push(val);
    todoChecked.push(false);
    saveTodos();
    todoInput.value = '';
    renderTodos();
  }
});

renderTodos();

// =========================
// Bookmark URL + Image Edit
// =========================
const bookmarkCards = document.querySelectorAll('.bookmark-card');
const bookmarkSelect = document.getElementById('bookmark-select');
const bookmarkUrlInput = document.getElementById('bookmark-url-input'); // may be null if not in HTML
const bookmarkImgUrl = document.getElementById('bookmark-img-url');
const bookmarkImgFile = document.getElementById('bookmark-img-file');
const bookmarkSaveBtn = document.getElementById('bookmark-save-btn');
const bookmarkResetBtn = document.getElementById('bookmark-reset-btn');
// New input for editing bookmark title
const bookmarkTitleInput = document.getElementById('bookmark-title-input');

// Capture original defaults from HTML before any overrides
const bookmarkDefaults = [];
bookmarkCards.forEach((card, i) => {
  bookmarkDefaults.push({
    label: card.getAttribute('title') || `Bookmark ${i + 1}`,
    url: card.getAttribute('data-link') || '',
    img: card.querySelector('img') ? card.querySelector('img').getAttribute('src') : ''
  });
});

// Populate the select dropdown
bookmarkCards.forEach((card, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = card.getAttribute('title') || `Bookmark ${i + 1}`;
  bookmarkSelect.appendChild(opt);
});

// Load saved overrides from localStorage
function getSavedBookmarks() {
  return JSON.parse(localStorage.getItem('bookmarkOverrides') || '{}');
}

function applyBookmarkOverrides() {
  const saved = getSavedBookmarks();
  bookmarkCards.forEach((card, i) => {
    const override = saved[i];
    if (!override) return;
    if (override.label) card.setAttribute('title', override.label);
    if (override.url) card.setAttribute('data-link', override.url);
    const img = card.querySelector('img');
    if (img && override.img) img.src = override.img;
    // Update select option text
    const opt = bookmarkSelect.options[i];
    if (opt) opt.textContent = override.label || card.getAttribute('title') || `Bookmark ${i + 1}`;
  });
}

applyBookmarkOverrides();

// When selection changes, fill current values into inputs
bookmarkSelect.addEventListener('change', () => {
  const i = parseInt(bookmarkSelect.value);
  const card = bookmarkCards[i];
  const saved = getSavedBookmarks();
  const override = saved[i] || {};

  if (bookmarkUrlInput) bookmarkUrlInput.value = override.url || card.getAttribute('data-link') || '';
  bookmarkImgUrl.value = (override.img && !override.img.startsWith('data:')) ? override.img : '';
  bookmarkTitleInput.value = override.label || card.getAttribute('title') || '';
  bookmarkImgFile.value = '';
  pendingImgData = null;
});

// Init fill on page load
bookmarkSelect.dispatchEvent(new Event('change'));

let pendingImgData = null;

bookmarkImgFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) { pendingImgData = null; return; }
  const reader = new FileReader();
  reader.onload = ev => {
    pendingImgData = ev.target.result;
    bookmarkImgUrl.value = '';
  };
  reader.readAsDataURL(file);
});

bookmarkImgUrl.addEventListener('input', () => {
  pendingImgData = null;
  bookmarkImgFile.value = '';
});

bookmarkSaveBtn.addEventListener('click', () => {
  const i = parseInt(bookmarkSelect.value);
  const card = bookmarkCards[i];
  const saved = getSavedBookmarks();

  const newUrl = bookmarkUrlInput ? bookmarkUrlInput.value.trim() : '';
  const newImg = pendingImgData || bookmarkImgUrl.value.trim();
  const newLabel = bookmarkTitleInput.value.trim();

  if (!saved[i]) saved[i] = {};
  if (newUrl) saved[i].url = newUrl;
  if (newImg) saved[i].img = newImg;
  if (newLabel) saved[i].label = newLabel;

  localStorage.setItem('bookmarkOverrides', JSON.stringify(saved));

  if (newUrl) card.setAttribute('data-link', newUrl);
  if (newLabel) card.setAttribute('title', newLabel);
  const img = card.querySelector('img');
  if (img && newImg) img.src = newImg;
  // Update select option text
  const opt = bookmarkSelect.options[i];
  if (opt) opt.textContent = newLabel || card.getAttribute('title') || `Bookmark ${i + 1}`;

  bookmarkSaveBtn.textContent = 'Saved!';
  setTimeout(() => bookmarkSaveBtn.textContent = 'Save', 1500);

  pendingImgData = null;
  bookmarkImgFile.value = '';
});

bookmarkResetBtn.addEventListener('click', () => {
  const i = parseInt(bookmarkSelect.value);
  const card = bookmarkCards[i];
  const saved = getSavedBookmarks();

  delete saved[i];
  localStorage.setItem('bookmarkOverrides', JSON.stringify(saved));

  // Restore defaults
  card.setAttribute('data-link', bookmarkDefaults[i].url);
  card.setAttribute('title', bookmarkDefaults[i].label);
  const img = card.querySelector('img');
  if (img) img.src = bookmarkDefaults[i].img;

  // Reset inputs
  if (bookmarkUrlInput) bookmarkUrlInput.value = bookmarkDefaults[i].url;
  bookmarkImgUrl.value = '';
  bookmarkImgFile.value = '';
  bookmarkTitleInput.value = bookmarkDefaults[i].label;
  pendingImgData = null;

  // Reset option text
  const opt = bookmarkSelect.options[i];
  if (opt) opt.textContent = bookmarkDefaults[i].label;

  bookmarkResetBtn.textContent = 'Reset!';
  setTimeout(() => bookmarkResetBtn.textContent = 'Reset to Default', 1500);
});

// =========================
// Todo Panel — Drag to Reposition
// Only active in view mode (when todoForm is hidden)
// Position persists across reloads via localStorage
// =========================
(function initTodoDrag() {
  let dragging = false;
  let startX, startY, origLeft, origTop;

  // Restore saved position
  const savedPos = JSON.parse(localStorage.getItem('todoPanelPos') || 'null');
  if (savedPos) {
    panel.style.position = 'fixed';
    panel.style.left = savedPos.left + 'px';
    panel.style.top = savedPos.top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function isViewMode() {
    return todoForm.style.display === 'none' || todoForm.style.display === '';
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  panel.addEventListener('mousedown', (e) => {
    // Only drag in view mode; ignore clicks on buttons/inputs/checkboxes
    if (!isViewMode()) return;
    if (e.target.closest('button, input, a, .task-checkbox')) return;

    dragging = true;
    panel.style.position = 'fixed';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    const rect = panel.getBoundingClientRect();
    // Ensure left/top reflect current position before dragging
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';

    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;

    panel.style.cursor = 'grabbing';
    panel.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = clamp(origLeft + dx, 0, window.innerWidth - panel.offsetWidth);
    const newTop = clamp(origTop + dy, 0, window.innerHeight - panel.offsetHeight);

    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.cursor = '';
    panel.style.userSelect = '';

    // Persist position
    localStorage.setItem('todoPanelPos', JSON.stringify({
      left: parseFloat(panel.style.left),
      top: parseFloat(panel.style.top)
    }));
  });

  // Touch support
  panel.addEventListener('touchstart', (e) => {
    if (!isViewMode()) return;
    if (e.target.closest('button, input, a, .task-checkbox')) return;

    const touch = e.touches[0];
    dragging = true;
    panel.style.position = 'fixed';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    const rect = panel.getBoundingClientRect();
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';

    startX = touch.clientX;
    startY = touch.clientY;
    origLeft = rect.left;
    origTop = rect.top;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    const newLeft = clamp(origLeft + dx, 0, window.innerWidth - panel.offsetWidth);
    const newTop = clamp(origTop + dy, 0, window.innerHeight - panel.offsetHeight);

    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;

    localStorage.setItem('todoPanelPos', JSON.stringify({
      left: parseFloat(panel.style.left),
      top: parseFloat(panel.style.top)
    }));
  });

  // Show grab cursor on hover in view mode
  panel.addEventListener('mouseover', () => {
    if (isViewMode()) panel.style.cursor = 'grab';
  });
  panel.addEventListener('mouseout', () => {
    if (!dragging) panel.style.cursor = '';
  });
})();