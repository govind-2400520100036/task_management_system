const API = "";

// ================ HELPER: GET AUTH HEADER ================
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// ================ TOGGLE PASSWORD VISIBILITY ================
function togglePasswordVisibility() {
  const passwordField = document.getElementById("password");
  const toggleIcon = document.getElementById("togglePassword");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    toggleIcon.textContent = "🙈"; // Change icon to "hidden" state
  } else {
    passwordField.type = "password";
    toggleIcon.textContent = "👁️"; // Change icon back to "visible" state
  }
}

// ================ SIGNUP ================
async function signup() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const res = await fetch(API + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Signup successful! Please sign in.");
    window.location.href = "/";

  } catch (err) {
    alert("Server error. Make sure the backend is running.");
    console.error(err);
  }
}

// ================ LOGIN ================
async function login() {
  const username = document.getElementById("identifier").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(API + "/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Backend User model requires email, sending empty string as filler
      body: JSON.stringify({ username, password, email: "" })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // Store JWT Token and Username
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", username);

    window.location.href = "/home";

  } catch (err) {
    alert("Server error.");
    console.error(err);
  }
}

// ================ LOGOUT ================
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

// ================ HOME PAGE INIT ================
function initHomePage() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!token) {
    window.location.href = "/";
    return;
  }

  const greetingEl = document.getElementById("user-greeting");
  if (greetingEl) greetingEl.textContent = "Hello, " + username;

  loadTasks();
}

// ================ LOAD TASKS ================
async function loadTasks() {
  try {
    const res = await fetch(API + "/task/show", {
      method: "GET",
      headers: getAuthHeader()
    });
    
    if (res.status === 401) logout(); // Token expired or invalid

    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

// ================ RENDER TASKS ================
function renderTasks(tasks) {
  const todoEl = document.getElementById("todo");
  const progressEl = document.getElementById("progress");
  const doneEl = document.getElementById("done");

  todoEl.innerHTML = "";
  progressEl.innerHTML = "";
  doneEl.innerHTML = "";

  tasks.forEach(task => {
    const card = createTaskCard(task);
    if (task.status === "To Do") todoEl.appendChild(card);
    else if (task.status === "In Progress") progressEl.appendChild(card);
    else if (task.status === "Done") doneEl.appendChild(card);
  });
}

// ================ CREATE TASK CARD ================
function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task priority-" + task.priority.toLowerCase();
  card.draggable = true;
  
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", task.task_id);
  });

  card.innerHTML = `
    <div class="task-title">${escapeHtml(task.task_name)}</div>
    <div class="task-deadline" style="font-size: 0.8rem; color: #666;">Due: ${task.deadline}</div>
    <span class="priority">${task.priority.toUpperCase()}</span>
    <button class="delete" onclick="deleteTask(${task.task_id})" title="Delete task">&times;</button>
  `;

  return card;
}

// ================ ADD TASK (UPDATED) ================
async function addTask() {
  const titleInput = document.getElementById("task-title");
  const prioritySelect = document.getElementById("task-priority");
  const dateInput = document.getElementById("task-deadline"); // Get date element
  
  const title = titleInput.value.trim();
  const deadlineStr = dateInput.value; // This will be in yyyy-mm-dd format

  if (!title) {
    alert("Please enter a task title");
    return;
  }

  if (!deadlineStr) {
    alert("Please select a deadline");
    return;
  }

  try {
    const res = await fetch(API + "/task/add", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...getAuthHeader()
      },
      body: JSON.stringify({
        task_name: title,
        priority: prioritySelect.value,
        deadline: deadlineStr // Now sends the user-selected date
      })
    });

    if (res.ok) {
      titleInput.value = "";
      dateInput.value = ""; // Clear the date after adding
      loadTasks();
    } else {
      const data = await res.json();
      alert("Error: " + (data.error || "Could not add task"));
    }
  } catch (err) {
    console.error("Failed to add task:", err);
  }
}

// ================ DELETE TASK ================
async function deleteTask(taskId) {
  try {
    const res = await fetch(`${API}/task/delete?task_id=${taskId}`, {
      method: "POST",
      headers: getAuthHeader()
    });

    if (res.ok) loadTasks();
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}

// ================ SEARCH TASKS ================
async function searchTasks() {
  const query = document.getElementById("search-input").value.trim();
  if (!query) {
    loadTasks();
    return;
  }

  try {
    const res = await fetch(`${API}/task/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: getAuthHeader()
    });
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Failed to search tasks:", err);
  }
}

// ================ DROP (UPDATE STATUS) ================
async function drop(e, newStatus) {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("text/plain");

  try {
    const res = await fetch(API + "/task/update_status", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...getAuthHeader()
      },
      body: JSON.stringify({ 
        task_id: parseInt(taskId), 
        status: newStatus 
      })
    });

    if (res.ok) loadTasks();
  } catch (err) {
    console.error("Failed to update task status:", err);
  }
}

// ================ DRAG & DROP ================
function allowDrop(e) {
  e.preventDefault(); // Necessary to allow a drop
}

function dragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function dragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

async function handleDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  const taskId = e.dataTransfer.getData("text/plain");

  try {
    const res = await fetch(API + "/task/update_status", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...getAuthHeader()
      },
      body: JSON.stringify({ 
        task_id: parseInt(taskId), 
        status: newStatus 
      })
    });

    const data = await res.json();

    if (res.ok) {
      loadTasks(); // Refresh UI
    } else {
      alert(data.detail || "Failed to update status");
    }
  } catch (err) {
    console.error("Failed to update task status:", err);
  }
}

// ================ UTILITY & INIT ================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

if (document.getElementById("todo")) {
  initHomePage();
}
