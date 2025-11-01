const note = document.getElementById('note');
const status = document.getElementById('status');

function setStatus(msg) {
  status.textContent = msg;
  if (msg === 'Saved') status.style.color = '#9ca3af';
  else status.style.color = '#3b82f6';
}

// load note
chrome.storage.local.get('popnote_text', data => {
  note.value = data.popnote_text || '';
});

// auto-save while typing
let timer;
note.addEventListener('input', () => {
  setStatus('Saving...');
  clearTimeout(timer);
  timer = setTimeout(() => {
    chrome.storage.local.set({ popnote_text: note.value }, () => {
      setStatus('Saved');
    });
  }, 700);
});

// save once more when popup closes
window.addEventListener('unload', () => {
  chrome.storage.local.set({ popnote_text: note.value });
});
