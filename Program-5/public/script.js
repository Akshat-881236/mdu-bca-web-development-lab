const contactForm = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const statusAlert = document.getElementById("statusAlert");
const refreshLogsBtn = document.getElementById("refreshLogsBtn");
const submissionsList = document.getElementById("submissionsList");

// Field Error Elements
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const phoneError = document.getElementById("phoneError");
const messageError = document.getElementById("messageError");

// Clear form errors
function clearErrors() {
    nameError.textContent = "";
    emailError.textContent = "";
    phoneError.textContent = "";
    messageError.textContent = "";
    statusAlert.className = "alert hidden";
    statusAlert.textContent = "";
}

// Client-side validation
function validateForm(data) {
    let isValid = true;
    clearErrors();

    if (!data.name || data.name.trim().length < 3) {
        nameError.textContent = "Full name must be at least 3 characters.";
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailPattern.test(data.email.trim())) {
        emailError.textContent = "Please enter a valid email address.";
        isValid = false;
    }

    if (data.phone && data.phone.trim() !== "") {
        if (!/^[0-9]{10}$/.test(data.phone.trim())) {
            phoneError.textContent = "Phone number must be a valid 10-digit number.";
            isValid = false;
        }
    }

    if (!data.message || data.message.trim().length < 10) {
        messageError.textContent = "Message must be at least 10 characters long.";
        isValid = false;
    }

    return isValid;
}

// Submit Form Handler
contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value
    };

    if (!validateForm(formData)) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>⏳ Transmitting to Server...</span>";

    try {
        const response = await fetch("/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to submit inquiry.");
        }

        statusAlert.className = "alert success";
        statusAlert.innerHTML = `<strong>Success!</strong> ${result.message} <br><small>Reference ID: <code>${result.referenceId}</code></small>`;
        statusAlert.classList.remove("hidden");

        contactForm.reset();
        await loadSubmissions();
    } catch (err) {
        statusAlert.className = "alert error";
        statusAlert.innerHTML = `<strong>Error:</strong> ${err.message}`;
        statusAlert.classList.remove("hidden");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>🚀 Submit Inquiry</span>";
    }
});

// Fetch submissions from backend
async function loadSubmissions() {
    try {
        const res = await fetch("/api/contact/submissions");
        const json = await res.json();

        submissionsList.replaceChildren();

        if (!json.data || json.data.length === 0) {
            const emptyP = document.createElement("p");
            emptyP.className = "placeholder-text";
            emptyP.textContent = "No inquiries received yet. Submit the form above!";
            submissionsList.appendChild(emptyP);
            return;
        }

        json.data.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "sub-item";

            const header = document.createElement("div");
            header.className = "sub-item-header";
            header.innerHTML = `<span class="sub-name">${item.name} &lt;${item.email}&gt;</span> <span class="sub-id">${item.id}</span>`;

            const subject = document.createElement("div");
            subject.style.fontWeight = "600";
            subject.style.fontSize = "0.9rem";
            subject.style.marginBottom = "4px";
            subject.textContent = `Subject: ${item.subject}`;

            const msg = document.createElement("p");
            msg.className = "sub-msg";
            msg.textContent = item.message;

            const time = document.createElement("div");
            time.style.fontSize = "0.75rem";
            time.style.color = "#94a3b8";
            time.style.marginTop = "6px";
            time.textContent = `Received: ${new Date(item.createdAt).toLocaleString()}`;

            itemDiv.append(header, subject, msg, time);
            submissionsList.appendChild(itemDiv);
        });
    } catch (err) {
        submissionsList.innerHTML = `<p class="placeholder-text" style="color:#ef4444;">Backend server is offline or unreachable: ${err.message}</p>`;
    }
}

// Refresh listener
refreshLogsBtn.addEventListener("click", loadSubmissions);

// Initial load
loadSubmissions();
