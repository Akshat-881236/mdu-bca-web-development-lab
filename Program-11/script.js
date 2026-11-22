const STORAGE_KEY = "mdu_todo_tasks_v1";

// Default initial tasks
const DEFAULT_TASKS = [
    { id: 1, title: "Complete MDU Rohtak BCA Web Dev Lab Manual", category: "Lab", priority: "High", dueDate: "2026-11-25", completed: false },
    { id: 2, title: "Review Asynchronous JavaScript & REST APIs", category: "Study", priority: "Medium", dueDate: "2026-11-26", completed: true },
    { id: 3, title: "Implement MongoDB Database Schema Validation", category: "Project", priority: "High", dueDate: "2026-11-28", completed: false }
];

// State
let tasks = [];
let currentFilter = "all";
let searchQuery = "";

// DOM Elements
const todoForm = document.getElementById("todoForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");
const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar");
const progressSummary = document.getElementById("progressSummary");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const searchInput = document.getElementById("searchInput");
const tabButtons = document.querySelectorAll(".tab-btn");

// Storage Helpers
function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        tasks = DEFAULT_TASKS;
        saveTasks();
    } else {
        try {
            tasks = JSON.parse(raw);
        } catch (e) {
            tasks = DEFAULT_TASKS;
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateProgress();
    renderTasks();
}

// Update Progress Bar
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressBar.style.width = `${percentage}%`;
    progressSummary.textContent = `${completed} of ${total} tasks completed (${percentage}%)`;
}

// Render Tasks
function renderTasks() {
    taskList.replaceChildren();

    // Filter by Tab and Search
    const filtered = tasks.filter(task => {
        const matchesFilter = (currentFilter === "all") ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesSearch = !searchQuery || 
            task.title.toLowerCase().includes(searchQuery) ||
            task.category.toLowerCase().includes(searchQuery);

        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-list";
        empty.textContent = searchQuery ? "No tasks matching your search." : "No tasks found in this view.";
        taskList.appendChild(empty);
        return;
    }

    filtered.forEach(task => {
        const li = document.createElement("li");
        li.className = `task-item ${task.completed ? "completed" : ""}`;

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task as complete">
            <div class="task-body">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="badge category-tag">${task.category}</span>
                    <span class="badge priority-${task.priority}">Priority: ${task.priority}</span>
                    ${task.dueDate ? `<span>📅 Due: ${task.dueDate}</span>` : ""}
                </div>
            </div>
            <button class="delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
        `;

        // Checkbox toggle
        const checkbox = li.querySelector(".task-checkbox");
        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveTasks();
        });

        // Delete button
        const delBtn = li.querySelector(".delete-btn");
        delBtn.addEventListener("click", () => {
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
        });

        taskList.appendChild(li);
    });
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Add New Task
todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) return;

    const newTask = {
        id: Date.now(),
        title,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDueDate.value || null,
        completed: false
    };

    tasks.unshift(newTask);
    saveTasks();
    todoForm.reset();
    taskDueDate.value = "";
});

// Clear Completed
clearCompletedBtn.addEventListener("click", () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    if (confirm(`Remove all ${completedCount} completed tasks?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
    }
});

// Filter Tabs
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        renderTasks();
    });
});

// Search input
searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTasks();
});

// Initial load
loadTasks();
updateProgress();
renderTasks();
