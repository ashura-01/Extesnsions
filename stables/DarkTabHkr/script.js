// DOM elements
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

// Initialize popup as hidden and ARIA attributes
appsPanel.style.display = 'none';
appsToggle.setAttribute('aria-expanded', 'false');
appsPanel.setAttribute('aria-hidden', 'true');

// Track popup open state
let isAppsPanelOpen = false;

// Toggle popup on button click
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

// Close popup when clicking outside
document.addEventListener('click', (e) => {
  if (!appsToggle.contains(e.target) && !appsPanel.contains(e.target)) {
    if (isAppsPanelOpen) {
      appsPanel.style.display = 'none';
      appsToggle.setAttribute('aria-expanded', 'false');
      appsPanel.setAttribute('aria-hidden', 'true');
      isAppsPanelOpen = false;
    }
  }
});

// Close popup on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isAppsPanelOpen) {
    appsPanel.style.display = 'none';
    appsToggle.setAttribute('aria-expanded', 'false');
    appsPanel.setAttribute('aria-hidden', 'true');
    appsToggle.focus();
    isAppsPanelOpen = false;
  }
});

let currentEngine = 'google';

function formatDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function updateTime() {
  const now = new Date();

  const hours = now.getHours();
  const mins = now.getMinutes();

  clockEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  dateEl.textContent = formatDate(now);

  if (hours < 12) {
    greetingEl.textContent = 'Good Morning Hash...';
  } else if (hours < 18) {
    greetingEl.textContent = 'Good Afternoon Hash...';
  } else {
    greetingEl.textContent = 'Good Evening Hash...';
  }
}
updateTime();
setInterval(updateTime, 1000);

// Set default search engine active
engineButtons[0].classList.add('active');

// Engine switch logic
engineButtons.forEach(button => {
  button.addEventListener('click', () => {
    engineButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const engineKey = button.textContent.trim().toUpperCase();
    switch (engineKey) {
      case 'G': currentEngine = 'google'; break;
      case 'B': currentEngine = 'bing'; break;
      case 'D': currentEngine = 'duckduckgo'; break;
      case 'Y': currentEngine = 'youtube'; break;
      case 'I': currentEngine = 'google-images'; break;
      default: currentEngine = 'google';
    }

  });
});

// Search form submit
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  let url = '';

  switch (currentEngine) {
    case 'google':
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      break;
    case 'bing':
      url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      break;
    case 'duckduckgo':
      url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      break;
    case 'youtube':
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      break;
    case 'google-images':
      url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      break;
  }


  window.open(url, '_blank');
  searchInput.value = '';
});

// Bookmark click handling
document.querySelectorAll('.bookmark-card').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    const url = card.getAttribute('data-link');
    if (url) window.location.href = url;
  });
});

// =========================
// ✅ Todo Panel Logic
// =========================

const toggleBtn = document.getElementById("todo-toggle");
const panel = document.getElementById("todo-panel");

toggleBtn.addEventListener("click", () => {
  if (panel.style.display === "flex") {
    panel.style.display = "none";
  } else {
    panel.style.display = "flex";
  }
});

// Todo state + elements
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let todoChecked = JSON.parse(localStorage.getItem("todoChecked")) || [];

// Render function
function renderTodos() {
  todoList.innerHTML = "";
  todos.forEach((todo, index) => {
    const li = document.createElement("li");

    const taskSpan = document.createElement("span");
    taskSpan.textContent = todo;
    taskSpan.classList.add("task-text");

    if (todoChecked[index]) {
      li.classList.add("checked");
    }
    li.appendChild(taskSpan);

    const btn = document.createElement("button");
    btn.innerHTML = "×";
    btn.title = "Delete task";
    btn.onclick = (e) => {
      e.stopPropagation();
      todos.splice(index, 1);
      todoChecked.splice(index, 1);
      localStorage.setItem("todos", JSON.stringify(todos));
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
      renderTodos();
    };
    li.appendChild(btn);

    li.addEventListener("click", () => {
      li.classList.toggle("checked");
      todoChecked[index] = !todoChecked[index];
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
    });

    todoList.appendChild(li);
  });
}

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (value !== "") {
    todos.push(value);
    todoChecked.push(false);
    localStorage.setItem("todos", JSON.stringify(todos));
    localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
    todoInput.value = "";
    renderTodos();
  }
});

renderTodos();
