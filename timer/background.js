let totalSeconds = 0;
let running = false;
let timer = null;

function startTimer() {
  if (running || totalSeconds <= 0) return;
  running = true;

  timer = setInterval(() => {
    totalSeconds--;
    chrome.storage.local.set({ timerSeconds: totalSeconds, timerRunning: true });

    if (totalSeconds <= 0) {
      clearInterval(timer);
      running = false;
      chrome.storage.local.set({ timerRunning: false });
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'FocusForge',
        message: '⏰ Time is up!',
        priority: 2
      });

      chrome.runtime.sendMessage({ command: 'finished' });
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  running = false;
  chrome.storage.local.set({ timerRunning: false });
}

function resetTimer() {
  pauseTimer();
  totalSeconds = 0;
  chrome.storage.local.set({ timerSeconds: 0, timerRunning: false });
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['timerSeconds', 'timerRunning'], (data) => {
    totalSeconds = data.timerSeconds || 0;
    running = data.timerRunning || false;
    if (running) startTimer();
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.command === 'start') {
    totalSeconds = msg.seconds;
    chrome.storage.local.set({ timerSeconds: totalSeconds, timerRunning: true });
    startTimer();
  } else if (msg.command === 'pause') {
    pauseTimer();
  } else if (msg.command === 'reset') {
    resetTimer();
  } else if (msg.command === 'get') {
    sendResponse({ seconds: totalSeconds, running });
  }
});
