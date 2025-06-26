const sound = new Audio('ding.mp3');

let timer;
let totalSeconds = 0; // start at 0:00
let running = false;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const timeInput = document.getElementById('timeInput');

function updateDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function startTimer() {
  if (running) return;
  if (totalSeconds <= 0) return; // Don't start if no time set
  running = true;
  timer = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(timer);
      running = false;
      notifyUser();
      return;
    }
    totalSeconds--;
    updateDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  running = false;
}

function resetTimer() {
  pauseTimer();
  totalSeconds = 0;
  updateDisplay();
}

function notifyUser() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'FocusForge',
    message: '⏰ Time is up!',
    priority: 2
  });
  sound.play();
}

function parseTimeInput(input) {
  input = input.trim();
  if (!input) return null;

  const parts = input.split(':');

  let minutes = 0, seconds = 0;

  if (parts.length === 1) {
    // Only minutes entered
    if (!/^\d+$/.test(parts[0])) return null;
    minutes = parseInt(parts[0], 10);
  } else if (parts.length === 2) {
    if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return null;
    minutes = parseInt(parts[0], 10);
    seconds = parseInt(parts[1], 10);
    if (seconds >= 60) return null; // seconds should be 0-59
  } else {
    return null; // invalid format
  }

  if (minutes < 0 || minutes > 100) return null;
  if (seconds < 0 || seconds > 59) return null;

  return minutes * 60 + seconds;
}

function setTimeFromInput() {
  const val = timeInput.value;
  const total = parseTimeInput(val);
  if (total === null) {
    alert('Please enter time as mm or mm:ss, max 100 minutes, seconds less than 60.');
    return false;
  }
  totalSeconds = total;
  updateDisplay();
  pauseTimer();
  startTimer();
  return true;
}

timeInput.addEventListener('keydown', (e) => {
  // Allow digits, colon, backspace, arrow keys, tab, enter
  if (!/[0-9:]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Enter' &&
      e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
    e.preventDefault();
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (setTimeFromInput()) {
      timeInput.value = '';
    }
  }
});

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;

updateDisplay();
