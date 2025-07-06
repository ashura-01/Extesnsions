// DOM elements
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const greetingEl = document.getElementById('greeting');
const searchForm = document.getElementById('search-form');
const searchInput = searchForm.querySelector('input[type="search"]');
const engineButtons = searchForm.querySelectorAll('.engine-icons button');

let currentEngine = 'google';

// Format date nicely
function formatDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Update clock and date every second
function updateTime() {
  const now = new Date();

  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  clockEl.textContent = `${hours}:${mins}`;
  dateEl.textContent = formatDate(now);

  if (hours < 12) {
    greetingEl.textContent = 'Good Morning Fahim...';
  } else if (hours < 18) {
    greetingEl.textContent = 'Good Afternoon Fahim...';
  } else {
    greetingEl.textContent = 'Good Evening Fahim...';
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

    switch (button.textContent.toUpperCase()) {
      case 'G': currentEngine = 'google'; break;
      case 'B': currentEngine = 'bing'; break;
      case 'D': currentEngine = 'duckduckgo'; break;
      case 'Y': currentEngine = 'youtube'; break;
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

// Toggle panel
const toggleBtn = document.getElementById("todo-toggle");
const panel = document.getElementById("todo-panel");
toggleBtn.addEventListener("click", () => {
  panel.style.display = panel.style.display === "flex" ? "none" : "flex";
});

// Todo state + elements
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let todoChecked = JSON.parse(localStorage.getItem("todoChecked")) || []; // store checked state

// Render function
function renderTodos() {
  todoList.innerHTML = "";
  todos.forEach((todo, index) => {
    const li = document.createElement("li");

    // Task text wrapped in span
    const taskSpan = document.createElement("span");
    taskSpan.textContent = todo;
    taskSpan.classList.add("task-text");
    if (todoChecked[index]) {
      li.classList.add("checked");
    }
    li.appendChild(taskSpan);

    // Delete button
    const btn = document.createElement("button");
    btn.innerHTML = "×";
    btn.title = "Delete task";
    btn.onclick = (e) => {
      e.stopPropagation(); // prevent toggling checked
      todos.splice(index, 1);
      todoChecked.splice(index, 1);
      localStorage.setItem("todos", JSON.stringify(todos));
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
      renderTodos();
    };
    li.appendChild(btn);

    // Toggle checked state on click of li (except delete)
    li.addEventListener("click", () => {
      li.classList.toggle("checked");
      todoChecked[index] = !todoChecked[index];
      localStorage.setItem("todoChecked", JSON.stringify(todoChecked));
    });

    todoList.appendChild(li);
  });
}

// Submit handler
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

// Initial load
renderTodos();
