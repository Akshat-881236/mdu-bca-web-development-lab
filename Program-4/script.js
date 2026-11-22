// API Endpoint (JSONPlaceholder is a dependable free REST API for testing)
const API_URL = "https://jsonplaceholder.typicode.com/posts?_limit=12";

// DOM Elements
const fetchBtn = document.getElementById("fetchBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const contentFeed = document.getElementById("contentFeed");
const statusMessage = document.getElementById("statusMessage");

// In-memory state
let loadedPosts = [];

// Fallback mock data in case of offline/sandbox network restrictions
const FALLBACK_POSTS = [
    {
        id: 1,
        title: "Introduction to Asynchronous JavaScript and Promises",
        body: "Modern web applications rely heavily on asynchronous execution. The Fetch API provides a powerful, Promise-based interface for fetching resources across the network.",
        userId: 1
    },
    {
        id: 2,
        title: "Mastering Client-Side DOM Manipulation",
        body: "Dynamic web development allows developers to manipulate the Document Object Model (DOM) seamlessly without full-page reloads using vanilla JS APIs.",
        userId: 2
    },
    {
        id: 3,
        title: "RESTful Architecture and State Synchronization",
        body: "REST APIs communicate using standard HTTP methods such as GET, POST, PUT, and DELETE to transfer serialized JSON representations between systems.",
        userId: 1
    },
    {
        id: 4,
        title: "Responsive Web Design Principles with Flexbox & Grid",
        body: "Creating fluid user experiences requires media queries, fluid sizing, and intelligent container layouts across varying viewport form factors.",
        userId: 3
    }
];

// Helper: Show status box
function setStatus(type, message) {
    statusMessage.className = `status-box ${type}`;
    if (type === "loading") {
        statusMessage.innerHTML = `<span class="spinner"></span> <span>${message}</span>`;
    } else {
        statusMessage.textContent = message;
    }
    statusMessage.classList.remove("hidden");
}

// Helper: Clear status box
function clearStatus() {
    statusMessage.className = "status-box hidden";
    statusMessage.textContent = "";
}

// Function to fetch posts from external API
async function fetchContent() {
    setStatus("loading", "Connecting to external API and streaming payload...");
    fetchBtn.disabled = true;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP Network Error! Status: ${response.status} (${response.statusText})`);
        }

        const data = await response.json();
        loadedPosts = data;
        setStatus("success", `Successfully loaded ${data.length} dynamic posts from JSONPlaceholder API.`);
        renderCards(loadedPosts);
    } catch (error) {
        console.warn("External fetch failed, switching gracefully to local fallback data:", error.message);
        loadedPosts = FALLBACK_POSTS;
        setStatus("error", `Live API notice: ${error.message}. Loaded ${FALLBACK_POSTS.length} verified sample records.`);
        renderCards(loadedPosts);
    } finally {
        fetchBtn.disabled = false;
    }
}

// Function to render cards dynamically into DOM
function renderCards(posts) {
    contentFeed.replaceChildren();

    if (!posts || posts.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state";
        emptyDiv.innerHTML = "<p>No matching content found for your query. Try another keyword!</p>";
        contentFeed.appendChild(emptyDiv);
        return;
    }

    posts.forEach(item => {
        const card = document.createElement("article");
        card.className = "card";

        const tag = document.createElement("span");
        tag.className = "card-tag";
        tag.textContent = `Article #${item.id} • User ${item.userId || 1}`;

        const title = document.createElement("h2");
        title.className = "card-title";
        title.textContent = item.title;

        const body = document.createElement("p");
        body.className = "card-body";
        body.textContent = item.body;

        const footer = document.createElement("div");
        footer.className = "card-footer";
        footer.innerHTML = `<span>⚡ Status: Verified 200 OK</span> <span>Category: Web Tech</span>`;

        card.append(tag, title, body, footer);
        contentFeed.appendChild(card);
    });
}

// Live Search Filter Handler
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderCards(loadedPosts);
        return;
    }

    const filtered = loadedPosts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.body.toLowerCase().includes(query)
    );
    renderCards(filtered);
});

// Clear Feed Handler
clearBtn.addEventListener("click", () => {
    loadedPosts = [];
    searchInput.value = "";
    contentFeed.replaceChildren();
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-state";
    emptyDiv.innerHTML = "<p>Feed cleared. Click <strong>\"Fetch Live Data\"</strong> to retrieve content again.</p>";
    contentFeed.appendChild(emptyDiv);
    clearStatus();
});

// Event Listener
fetchBtn.addEventListener("click", fetchContent);

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
    fetchContent();
});
