(() => {
  if (document.getElementById("my-task-sidebar")) {
    document.getElementById("my-task-sidebar").remove();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("panel.html");
  iframe.id = "my-task-sidebar";
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100vh;
    z-index: 2147483647;
    border: none;
    background: #0c0c26;
    box-shadow: -3px 0 10px rgba(0, 191, 255, 0.7);
  `;
  document.body.appendChild(iframe);
})();
