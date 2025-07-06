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

  // Format clock: HH:MM (24-hour)
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  clockEl.textContent = `${hours}:${mins}`;

  // Format date
  dateEl.textContent = formatDate(now);

  // Update greeting based on hour
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

// Handle search engine buttons
engineButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove 'active' from all buttons
    engineButtons.forEach(btn => btn.classList.remove('active'));
    // Add active to clicked button
    button.classList.add('active');

    // Set current engine by button text
    switch (button.textContent.toUpperCase()) {
      case 'G':
        currentEngine = 'google';
        break;
      case 'B':
        currentEngine = 'bing';
        break;
      case 'D':
        currentEngine = 'duckduckgo';
        break;
      case 'Y':
        currentEngine = 'yahoo';
        break;
      default:
        currentEngine = 'google';
    }
  });
});

// Set default active engine button (Google)
engineButtons[0].classList.add('active');

// Handle form submit to search selected engine
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
    case 'yahoo':
      url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
      break;
  }

  // Open the search in a new tab
  window.open(url, '_blank');
  searchInput.value = '';
});

// Attach bookmark card click handlers once on load
document.querySelectorAll('.bookmark-card').forEach(card => {
  card.style.cursor = 'pointer'; // show pointer on hover
  card.addEventListener('click', () => {
    const url = card.getAttribute('data-link');
    if (url) {
      window.open(url, '_blank');
    }
  });
});
