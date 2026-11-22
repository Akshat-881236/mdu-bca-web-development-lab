const admissionForm = document.getElementById("admissionForm");
const submitBtn = document.getElementById("submitBtn");
const alertBox = document.getElementById("alertBox");
const refreshBtn = document.getElementById("refreshBtn");
const recordsFeed = document.getElementById("recordsFeed");
const engineStatus = document.getElementById("engineStatus");

// Error Spans
const errors = {
    fullName: document.getElementById("fullNameErr"),
    fatherName: document.getElementById("fatherNameErr"),
    dob: document.getElementById("dobErr"),
    gender: document.getElementById("genderErr"),
    email: document.getElementById("emailErr"),
    mobile: document.getElementById("mobileErr"),
    course: document.getElementById("courseErr"),
    tenthPercentage: document.getElementById("tenthErr"),
    twelfthPercentage: document.getElementById("twelfthErr"),
    address: document.getElementById("addressErr")
};

function clearErrors() {
    Object.values(errors).forEach(el => el.textContent = "");
    alertBox.className = "alert-box hidden";
    alertBox.textContent = "";
}

// Client Validation
function validate(data) {
    clearErrors();
    let valid = true;

    if (!data.fullName || data.fullName.trim().length < 3) {
        errors.fullName.textContent = "Full name must be at least 3 characters.";
        valid = false;
    }
    if (!data.fatherName || data.fatherName.trim().length < 3) {
        errors.fatherName.textContent = "Father's name must be at least 3 characters.";
        valid = false;
    }
    if (!data.dob) {
        errors.dob.textContent = "Please select a valid date of birth.";
        valid = false;
    }
    if (!data.gender) {
        errors.gender.textContent = "Please select gender.";
        valid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email.trim())) {
        errors.email.textContent = "Please enter a valid email address.";
        valid = false;
    }
    if (!data.mobile || !/^[0-9]{10}$/.test(data.mobile.trim())) {
        errors.mobile.textContent = "Mobile number must be exactly 10 digits.";
        valid = false;
    }
    if (!data.course) {
        errors.course.textContent = "Please select a course.";
        valid = false;
    }
    const t = parseFloat(data.tenthPercentage);
    if (isNaN(t) || t < 33 || t > 100) {
        errors.tenthPercentage.textContent = "10th percentage must be between 33% and 100%.";
        valid = false;
    }
    const tw = parseFloat(data.twelfthPercentage);
    if (isNaN(tw) || tw < 33 || tw > 100) {
        errors.twelfthPercentage.textContent = "12th percentage must be between 33% and 100%.";
        valid = false;
    }
    if (!data.address || data.address.trim().length < 10) {
        errors.address.textContent = "Residential address must be at least 10 characters.";
        valid = false;
    }

    return valid;
}

// Submit Form
admissionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        fullName: document.getElementById("fullName").value,
        fatherName: document.getElementById("fatherName").value,
        dob: document.getElementById("dob").value,
        gender: document.getElementById("gender").value,
        email: document.getElementById("email").value,
        mobile: document.getElementById("mobile").value,
        course: document.getElementById("course").value,
        tenthPercentage: document.getElementById("tenthPercentage").value,
        twelfthPercentage: document.getElementById("twelfthPercentage").value,
        address: document.getElementById("address").value
    };

    if (!validate(formData)) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>⏳ Transmitting &amp; Validating in MongoDB...</span>";

    try {
        const res = await fetch("/api/admissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.message || "Failed to submit admission form.");
        }

        alertBox.className = "alert-box success";
        alertBox.innerHTML = `<strong>Registration Successful!</strong> ${json.message}<br>Application Number: <code>${json.applicationNo}</code> (Saved via ${json.storageEngine})`;
        alertBox.classList.remove("hidden");

        admissionForm.reset();
        await loadRecords();
    } catch (err) {
        alertBox.className = "alert-box error";
        alertBox.innerHTML = `<strong>Submission Rejected:</strong> ${err.message}`;
        alertBox.classList.remove("hidden");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>📝 Submit Application</span>";
    }
});

// Load Submitted Records
async function loadRecords() {
    try {
        const res = await fetch("/api/admissions");
        const json = await res.json();

        engineStatus.textContent = `Storage Engine: ${json.storageEngine || "Active"} (${json.count || 0} Registered Records)`;

        recordsFeed.replaceChildren();

        if (!json.data || json.data.length === 0) {
            recordsFeed.innerHTML = `<p class="muted-text">No admission applications stored yet. Fill the form to submit.</p>`;
            return;
        }

        json.data.forEach(item => {
            const card = document.createElement("div");
            card.className = "app-card";
            card.innerHTML = `
                <div class="app-card-top">
                    <span class="app-no">App No: ${item.applicationNo}</span>
                    <span style="color:#64748b; font-size:0.8rem;">Submitted: ${new Date(item.submittedAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="app-grid">
                    <div><strong>Candidate:</strong> ${item.fullName}</div>
                    <div><strong>Course:</strong> <span style="color:#15803d; font-weight:700;">${item.course}</span></div>
                    <div><strong>Email:</strong> ${item.email}</div>
                    <div><strong>Mobile:</strong> ${item.mobile}</div>
                    <div><strong>10th / 12th:</strong> ${item.tenthPercentage}% / ${item.twelfthPercentage}%</div>
                    <div><strong>DOB:</strong> ${new Date(item.dob).toLocaleDateString()}</div>
                </div>
            `;
            recordsFeed.appendChild(card);
        });
    } catch (err) {
        engineStatus.textContent = `Server Connection Offline: ${err.message}`;
    }
}

refreshBtn.addEventListener("click", loadRecords);

// Initial Load
loadRecords();
