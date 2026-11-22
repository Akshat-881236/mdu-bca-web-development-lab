// DOM Elements
const studentsTableBody = document.getElementById("studentsTableBody");
const totalRecordsEl = document.getElementById("totalRecords");
const searchInput = document.getElementById("searchInput");
const statusAlert = document.getElementById("statusAlert");
const studentModal = document.getElementById("studentModal");
const addStudentBtn = document.getElementById("addStudentBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const studentForm = document.getElementById("studentForm");
const modalTitle = document.getElementById("modalTitle");

// Form inputs
const studentIdInput = document.getElementById("studentId");
const rollNoInput = document.getElementById("rollNo");
const nameInput = document.getElementById("name");
const courseInput = document.getElementById("course");
const semesterInput = document.getElementById("semester");
const emailInput = document.getElementById("email");
const cgpaInput = document.getElementById("cgpa");

let studentsData = [];

// Helper: Show Alert
function showAlert(message, isError = false) {
    statusAlert.className = isError ? "alert error" : "alert success";
    statusAlert.textContent = message;
    statusAlert.classList.remove("hidden");
    setTimeout(() => {
        statusAlert.classList.add("hidden");
    }, 4000);
}

// 1. Fetch Students from Server
async function loadStudents(query = "") {
    try {
        const url = query ? `/api/students?q=${encodeURIComponent(query)}` : "/api/students";
        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) throw new Error(json.message || "Failed to load students");

        studentsData = json.data;
        totalRecordsEl.textContent = json.count;
        renderTable(studentsData);
    } catch (err) {
        studentsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:#ef4444;">Error: ${err.message}</td></tr>`;
    }
}

// 2. Render Table Rows
function renderTable(list) {
    studentsTableBody.replaceChildren();

    if (!list || list.length === 0) {
        studentsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">No student records found. Click "+ Add New Student" to create one.</td></tr>`;
        return;
    }

    list.forEach(student => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><strong>${student.roll_no}</strong></td>
            <td>${student.name}</td>
            <td>${student.course}</td>
            <td>Sem ${student.semester}</td>
            <td>${student.email}</td>
            <td><span class="cgpa-badge">${student.cgpa.toFixed(2)}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="action-btn edit-btn" onclick="openEditModal(${student.id})">✏️ Edit</button>
                    <button class="action-btn del-btn" onclick="deleteStudent(${student.id}, '${student.name}')">🗑️ Delete</button>
                </div>
            </td>
        `;
        studentsTableBody.appendChild(tr);
    });
}

// 3. Modal Controllers
function openCreateModal() {
    studentForm.reset();
    studentIdInput.value = "";
    modalTitle.textContent = "Add New Student Record";
    rollNoInput.removeAttribute("readonly");
    studentModal.classList.remove("hidden");
}

function openEditModal(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) return;

    studentIdInput.value = student.id;
    rollNoInput.value = student.roll_no;
    nameInput.value = student.name;
    courseInput.value = student.course;
    semesterInput.value = student.semester;
    emailInput.value = student.email;
    cgpaInput.value = student.cgpa;

    modalTitle.textContent = `Edit Record: ${student.roll_no}`;
    studentModal.classList.remove("hidden");
}

function closeModal() {
    studentModal.classList.add("hidden");
    studentForm.reset();
}

// 4. Save Form (Create or Update)
studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = studentIdInput.value;
    const isEdit = Boolean(id);

    const payload = {
        roll_no: rollNoInput.value.trim(),
        name: nameInput.value.trim(),
        course: courseInput.value,
        semester: semesterInput.value,
        email: emailInput.value.trim(),
        cgpa: cgpaInput.value
    };

    const endpoint = isEdit ? `/api/students/${id}` : "/api/students";
    const method = isEdit ? "PUT" : "POST";

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Operation failed.");

        closeModal();
        showAlert(json.message);
        await loadStudents(searchInput.value.trim());
    } catch (err) {
        alert(`Validation / Database Error: ${err.message}`);
    }
});

// 5. Delete Student Record
async function deleteStudent(id, name) {
    if (!confirm(`Are you sure you want to delete student "${name}" (ID #${id}) from the database?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
        const json = await res.json();

        if (!res.ok) throw new Error(json.message || "Deletion failed.");

        showAlert(json.message);
        await loadStudents(searchInput.value.trim());
    } catch (err) {
        showAlert(err.message, true);
    }
}

// Search Filter with Debounce
let searchTimeout;
searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadStudents(e.target.value.trim());
    }, 250);
});

// Listeners
addStudentBtn.addEventListener("click", openCreateModal);
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

// Close modal on click outside
studentModal.addEventListener("click", (e) => {
    if (e.target === studentModal) closeModal();
});

// Expose globals for inline event handlers
window.openEditModal = openEditModal;
window.deleteStudent = deleteStudent;

// Initial Load
loadStudents();
