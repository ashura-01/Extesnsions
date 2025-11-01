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

// Make appsPanel focusable for accessibility
appsPanel.setAttribute('tabindex', '-1');
appsPanel.style.display = 'none';
appsToggle.setAttribute('aria-expanded', 'false');
appsPanel.setAttribute('aria-hidden', 'true');

let isAppsPanelOpen = false;

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
