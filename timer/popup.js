const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const timeInput = document.getElementById('timeInput');

let localSeconds = 0;
let localTimer = null;

function updateDisplay(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

function startLocalCountdown(initialSeconds) {
  clearInterval(localTimer);
  localSeconds = initialSeconds;
  updateDisplay(localSeconds);

  localTimer = setInterval(() => {
    if (localSeconds <= 0) {
      clearInterval(localTimer);
      return;
    }
    localSeconds--;
    updateDisplay(localSeconds);
  }, 1000);
}

function parseTimeInput(input) {
  const parts = input.trim().split(':');
  let m = 0, s = 0;

  if (parts.length === 1 && /^\d+$/.test(parts[0])) {
    m = parseInt(parts[0], 10);
  } else if (
    parts.length === 2 &&
    /^\d+$/.test(parts[0]) &&
    /^\d+$/.test(parts[1]) &&
    parseInt(parts[1], 10) < 60
  ) {
    m = parseInt(parts[0], 10);
    s = parseInt(parts[1], 10);
  } else {
    return null;
  }

  if (m < 0 || m > 100) return null;
  return m * 60 + s;
}

// Load saved timer state
chrome.runtime.sendMessage({ command: 'get' }, (res) => {
  if (res) {
    updateDisplay(res.seconds);
    if (res.running) startLocalCountdown(res.seconds);
  }
});

startBtn.onclick = () => {
  const val = timeInput.value;
  const seconds = parseTimeInput(val);
  if (seconds === null) {
    alert("Enter time in mm or mm:ss (0–100 mins)");
    return;
  }
  chrome.runtime.sendMessage({ command: 'start', seconds });
  startLocalCountdown(seconds);
  timeInput.value = '';
};

pauseBtn.onclick = () => {
  chrome.runtime.sendMessage({ command: 'pause' });
  clearInterval(localTimer);
};

resetBtn.onclick = () => {
  chrome.runtime.sendMessage({ command: 'reset' });
  clearInterval(localTimer);
  updateDisplay(0);
};

timeInput.addEventListener('keydown', (e) => {
  if (!/[0-9:]/.test(e.key) && !['Backspace', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    startBtn.click();
  }
});
