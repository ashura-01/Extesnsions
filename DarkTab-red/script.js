// DOM elements
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const greetingEl = document.getElementById('greeting');
const searchForm = document.getElementById('search-form');
const searchInput = searchForm.querySelector('input[type="search"]');
const engineButtons = searchForm.querySelectorAll('.engine-icons button');

const appsToggle = document.getElementById('google-apps-btn');
const appsPanel = document.getElementById('google-apps-popup');


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

    const engineKey = button.textContent.trim().toUpperCase();
    switch (engineKey) {
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

// Search form submit
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();

  let url = '';

  switch (currentEngine) {
    case 'google':
      url = query
        ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
        : 'https://www.google.com';
      break;
    case 'bing':
      url = query
        ? `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        : 'https://www.bing.com';
      break;
    case 'duckduckgo':
      url = query
        ? `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
        : 'https://duckduckgo.com';
      break;
    case 'youtube':
      url = query
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        : 'https://www.youtube.com';
      break;
    case 'google-images':
      url = query
        ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
        : 'https://www.google.com/imghp';
      break;
    case 'yandex':
      url = query
        ? `https://yandex.com/search/?text=${encodeURIComponent(query)}`
        : 'https://yandex.com';
      break;
    case 'yandex-images':
      url = query
        ? `https://yandex.com/images/search?text=${encodeURIComponent(query)}`
        : 'https://yandex.com/images';
      break;
    case 'shodan':
      url = query
        ? `https://www.shodan.io/search?query=${encodeURIComponent(query)}`
        : 'https://www.shodan.io';
      break;
  }

  // ✅ open homepage in same tab when empty
  window.location.href = url;
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
