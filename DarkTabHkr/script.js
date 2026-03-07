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


// toggle settings panel
settingsBtn.onclick = () => {

  if(settingsPanel.style.display === "flex"){
    settingsPanel.style.display = "none";
  }else{
    settingsPanel.style.display = "flex";
  }

};


// accent color change
colorPicker.addEventListener("input",(e)=>{

  const color = e.target.value;

  document.documentElement.style.setProperty("--accent",color);

  localStorage.setItem("accentColor",color);

});


// background change
bgPicker.addEventListener("change",(e)=>{

  const file = e.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(ev){

    const bg = `url(${ev.target.result})`;

    document.documentElement.style.setProperty("--bg-image",bg);

    localStorage.setItem("bgImage",bg);

  };

  reader.readAsDataURL(file);

});


// load saved settings
// load saved settings
window.addEventListener("DOMContentLoaded", () => {
  const savedColor = localStorage.getItem("accentColor");
  const savedBg = localStorage.getItem("bgImage");

  if (savedColor) {
    document.documentElement.style.setProperty("--accent", savedColor);
    // also update hover immediately
    const hover = getHoverColor(savedColor, -15);
    document.documentElement.style.setProperty("--accent-hover", hover);
  }

  if (savedBg) {
    document.documentElement.style.setProperty("--bg-image", savedBg);
  }
});

// when color picker changes
colorPicker.addEventListener("input", (e) => {
  const color = e.target.value;
  document.documentElement.style.setProperty("--accent", color);

  // update hover
  const hover = getHoverColor(color, -15);
  document.documentElement.style.setProperty("--accent-hover", hover);

  // save accent
  localStorage.setItem("accentColor", color);
});

// function to darken a hex color slightly using HSL
function getHoverColor(hex, amount = -15) {
  // convert hex to RGB
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);

  // convert RGB to HSL
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max + min) / 2;

  if(max === min){ h = s = 0; }
  else{
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b)/d + (g < b ? 6 : 0); break;
      case g: h = (b - r)/d + 2; break;
      case b: h = (r - g)/d + 4; break;
    }
    h /= 6;
  }

  // adjust lightness
  l = Math.min(1, Math.max(0, l + amount/100));

  // convert back to RGB
  let r1, g1, b1;
  if(s === 0){ r1 = g1 = b1 = l; }
  else {
    function hue2rgb(p,q,t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p)*6*t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p)*(2/3 - t)*6;
      return p;
    }
    let q = l < 0.5 ? l*(1+s) : l+s-l*s;
    let p = 2*l - q;
    r1 = hue2rgb(p,q,h + 1/3);
    g1 = hue2rgb(p,q,h);
    b1 = hue2rgb(p,q,h - 1/3);
  }

  r1 = Math.round(r1*255);
  g1 = Math.round(g1*255);
  b1 = Math.round(b1*255);

  return `rgb(${r1},${g1},${b1})`;
}

// sync hover color whenever accent changes
function syncHoverColor() {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const hoverColor = getHoverColor(accent, -15); // -15 makes hover slightly darker
  document.documentElement.style.setProperty("--accent-hover", hoverColor);
}

// run on page load
syncHoverColor();

// also run whenever accent color changes
colorPicker.addEventListener("input", (e)=>{
  syncHoverColor();
});

const todoIcon = document.getElementById("todo-icon");

colorPicker.addEventListener("input", (e) => {
  const accent = e.target.value;
  document.documentElement.style.setProperty("--accent", accent);
  todoIcon.querySelector("path").setAttribute("fill", accent);
});


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
  "If it’s not hard, it’s not worth it.",
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
// =========================
function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();

  clockEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  dateEl.textContent = formatDate(now);

  if (hours < 12) greetingEl.textContent = 'Good Morning Hash...';
  else if (hours < 18) greetingEl.textContent = 'Good Afternoon Hash...';
  else greetingEl.textContent = 'Good Evening Hash...';
}

updateTime();
setInterval(updateTime, 1000);

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
// =========================
const toggleBtn = document.getElementById("todo-toggle");
const panel = document.getElementById("todo-panel");

toggleBtn.addEventListener("click", () => {
  panel.style.display = (panel.style.display === "flex") ? "none" : "flex";
});

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let todoChecked = JSON.parse(localStorage.getItem("todoChecked")) || [];

function renderTodos() {
  todoList.innerHTML = "";
  todos.forEach((todo, idx) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = todo;
    span.classList.add("task-text");
    if (todoChecked[idx]) li.classList.add("checked");
    li.appendChild(span);

    const btn = document.createElement("button");
    btn.innerHTML = "×";
    btn.title = "Delete task";
    btn.onclick = e => {
      e.stopPropagation();
      todos.splice(idx, 1);
      todoChecked.splice(idx, 1);
      localStorage.setItem("todos", JSON.stringify(todos));
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
      renderTodos();
    };
    li.appendChild(btn);

    li.addEventListener('click', () => {
      li.classList.toggle('checked');
      todoChecked[idx] = !todoChecked[idx];
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
    });

    todoList.appendChild(li);
  });
}

todoForm.addEventListener("submit", e => {
  e.preventDefault();
  const val = todoInput.value.trim();
  if (val !== "") {
    todos.push(val);
    todoChecked.push(false);
    localStorage.setItem("todos", JSON.stringify(todos));
    localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
    todoInput.value = '';
    renderTodos();
  }
});

renderTodos();
