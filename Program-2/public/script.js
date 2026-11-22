const userForm = document.getElementById("userForm");
const usersList = document.getElementById("usersList");
const message = document.getElementById("message");
const refreshButton = document.getElementById("refreshButton");

// GET request: Fetch users from the REST API
async function loadUsers() {
    usersList.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading users...";
    usersList.appendChild(loading);

    try {
        const response = await fetch("/api/users");
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to load users");
        }

        usersList.replaceChildren();

        const users = result.data;

        if (users.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No users registered yet.";
            usersList.appendChild(emptyMessage);
            return;
        }

        users.forEach(user => {
            const card = document.createElement("div");
            card.className = "user-card";

            const name = document.createElement("h3");
            name.textContent = user.name;

            const email = document.createElement("p");
            email.textContent = `Email: ${user.email}`;

            const id = document.createElement("p");
            id.textContent = `User ID: ${user.id}`;

            card.append(name, email, id);
            usersList.appendChild(card);
        });
    } catch (error) {
        usersList.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent = error.message;
        usersList.appendChild(errorMessage);
    }
}

// POST request: Send user data to the REST API
userForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    message.textContent = "";

    try {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to add user");
        }

        message.textContent = result.message;
        message.style.color = "green";

        userForm.reset();

        // Refresh the list after successful insertion
        await loadUsers();
    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});

// Refresh user list
refreshButton.addEventListener("click", loadUsers);

// Load users when webpage opens
loadUsers();