const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

let tasks = [];

function loadTasks() {
  chrome.storage.local.get(["tasks"], (result) => {
    tasks = result.tasks || [];
    renderTasks();
  });
}

function saveTasks() {
  chrome.storage.local.set({ tasks });
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.marginBottom = "10px";

    if (task.completed) li.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.onchange = () => {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
    };
    checkbox.style.marginRight = "15px";

    const span = document.createElement("span");
    span.textContent = task.text;
    span.style.flex = "1";

    const editBtn = document.createElement("button");
    editBtn.style.background = "none";
    editBtn.style.border = "none";
    editBtn.style.cursor = "pointer";
    editBtn.style.marginLeft = "10px";

    const pencilIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pencilIcon.setAttribute("viewBox", "0 0 24 24");
    pencilIcon.setAttribute("width", "20");
    pencilIcon.setAttribute("height", "20");
    const pencilPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pencilPath.setAttribute("fill", "#00bfff");
    pencilPath.setAttribute("d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34a1.25 1.25 0 0 0 0-1.77l-2-2a1.25 1.25 0 0 0-1.77 0l-1.83 1.83 3.75 3.75 1.85-1.81z");
    pencilIcon.appendChild(pencilPath);
    editBtn.appendChild(pencilIcon);

    editBtn.onclick = () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = task.text;
      input.style.flex = "1";
      input.style.marginRight = "10px";
      li.replaceChild(input, span);
      input.focus();

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
          tasks[index].text = newText;
          saveTasks();
          renderTasks();
        }
      };

      input.addEventListener("keypress", e => {
        if (e.key === "Enter") saveEdit();
      });

      input.addEventListener("blur", saveEdit);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.marginLeft = "10px";

    const binIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    binIcon.setAttribute("viewBox", "0 0 24 24");
    binIcon.setAttribute("width", "22");
    binIcon.setAttribute("height", "22");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "#00bfff");
    path.setAttribute("d", "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z");
    binIcon.appendChild(path);
    deleteBtn.appendChild(binIcon);

    deleteBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

taskInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && taskInput.value.trim() !== "") {
    tasks.unshift({ text: taskInput.value.trim(), completed: false });
    taskInput.value = "";
    saveTasks();
    renderTasks();
  }
});

loadTasks(); // Initial load
