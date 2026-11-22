// DOM Elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const errorBanner = document.getElementById("errorBanner");
const logoutBtn = document.getElementById("logoutBtn");

// Profile elements
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const inspProvider = document.getElementById("inspProvider");
const inspUid = document.getElementById("inspUid");
const inspScope = document.getElementById("inspScope");
const inspTokenType = document.getElementById("inspTokenType");
const inspAccessToken = document.getElementById("inspAccessToken");
const inspAuthTime = document.getElementById("inspAuthTime");

// Helper: Check URL query parameters for errors
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
        errorBanner.textContent = `Authentication Notice: ${decodeURIComponent(error)}`;
        errorBanner.classList.remove("hidden");
    }
}

// 1. Check Current Authentication Status via API
async function checkAuthStatus() {
    try {
        const res = await fetch("/api/me");
        if (res.ok) {
            const data = await res.json();
            renderDashboard(data.user);
        } else {
            showLogin();
        }
    } catch (err) {
        console.warn("Auth check failed:", err.message);
        showLogin();
    }
}

// 2. Render Protected User Dashboard
function renderDashboard(user) {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    userName.textContent = user.name;
    userEmail.textContent = user.email;
    userAvatar.src = user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=MDU";
    userAvatar.alt = `${user.name}'s profile avatar`;

    inspProvider.textContent = user.provider;
    inspUid.textContent = user.id;
    inspScope.textContent = user.scope || "openid profile email";
    inspTokenType.textContent = user.tokenType || "Bearer";

    // Mask the access token for security display
    const rawToken = user.accessToken || "ya29.sample_token_data";
    inspAccessToken.textContent = rawToken.slice(0, 10) + "••••••••••••••••" + rawToken.slice(-6);

    inspAuthTime.textContent = new Date(user.authenticatedAt || Date.now()).toLocaleString();
}

function showLogin() {
    dashboardSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
}

// 3. Logout Handler
logoutBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("/auth/logout", { method: "POST" });
        if (res.ok) {
            window.location.href = "/";
        } else {
            alert("Logout operation failed.");
        }
    } catch (err) {
        alert("Logout error: " + err.message);
    }
});

// Run on page load
checkUrlParams();
checkAuthStatus();
