// Configuration constants
const BATCH_SIZE = 6;
const MAX_ITEMS = 36;
const LOAD_DELAY_MS = 600; // Simulated latency for realistic feedback

// Application State
let currentCount = 0;
let isLoading = false;
let pageNumber = 1;

// DOM Elements
const cardsContainer = document.getElementById("cardsContainer");
const sentinel = document.getElementById("sentinel");
const loadingIndicator = document.getElementById("loadingIndicator");
const endOfFeed = document.getElementById("endOfFeed");
const itemCountEl = document.getElementById("itemCount");
const maxCountEl = document.getElementById("maxCount");
const resetBtn = document.getElementById("resetBtn");
const backToTopBtn = document.getElementById("backToTopBtn");

maxCountEl.textContent = MAX_ITEMS;

// Sample topics for generative cards
const TOPICS = [
    { tag: "Front-End", title: "Mastering Asynchronous JavaScript & Promises", desc: "Understanding the event loop, microtask queue, and Promise lifecycle in modern V8 engines." },
    { tag: "Architecture", title: "Single Page Application State Management", desc: "Decoupling presentation state from API transport layers to achieve 60fps UI performance." },
    { tag: "Database", title: "Relational vs Document Database Paradigms", desc: "Evaluating ACID transactions in SQL engines versus flexible schema scaling in NoSQL databases." },
    { tag: "Performance", title: "IntersectionObserver vs Legacy Scroll Listeners", desc: "Offloading viewport collision detection to browser layout engines for silky smooth 120Hz scrolling." },
    { tag: "Cloud", title: "Serverless Functions & Edge Computing", desc: "Deploying microservices geographically closer to end-users to reduce roundtrip latencies." },
    { tag: "Security", title: "Securing Modern Web Apps with OAuth 2.0 & JWT", desc: "Protecting REST endpoints against CSRF, XSS, and authorization bypass vulnerabilities." }
];

// Helper: Generate card element
function createCard(index) {
    const topic = TOPICS[(index - 1) % TOPICS.length];
    const card = document.createElement("article");
    card.className = "post-card";

    // Use Unsplash source or SVG geometric avatar
    const hue = (index * 47) % 360;
    const svgCover = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220"><rect width="100%" height="100%" fill="hsl(${hue}, 65%, 45%)"/><circle cx="200" cy="110" r="60" fill="rgba(255,255,255,0.15)"/><text x="50%" y="54%" font-family="sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">Module %23${index}</text></svg>`;

    card.innerHTML = `
        <img class="card-img" src="${svgCover}" alt="Cover image for ${topic.title}" loading="lazy">
        <div class="card-content">
            <span class="card-badge">${topic.tag}</span>
            <h2 class="card-title">${topic.title} (#${index})</h2>
            <p class="card-snippet">${topic.desc}</p>
            <div class="card-meta">
                <span>⏱️ 5 min read</span>
                <span>Batch Page ${pageNumber}</span>
            </div>
        </div>
    `;
    return card;
}

// Function to fetch and append next batch
async function loadMoreItems() {
    if (isLoading || currentCount >= MAX_ITEMS) return;

    isLoading = true;
    loadingIndicator.classList.remove("hidden");

    // Artificial delay to demonstrate network streaming / loading state
    await new Promise(resolve => setTimeout(resolve, LOAD_DELAY_MS));

    const remaining = MAX_ITEMS - currentCount;
    const itemsToLoad = Math.min(BATCH_SIZE, remaining);

    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= itemsToLoad; i++) {
        currentCount++;
        fragment.appendChild(createCard(currentCount));
    }
    cardsContainer.appendChild(fragment);

    itemCountEl.textContent = currentCount;
    pageNumber++;
    isLoading = false;
    loadingIndicator.classList.add("hidden");

    // Check if max items reached
    if (currentCount >= MAX_ITEMS) {
        endOfFeed.classList.remove("hidden");
        observer.unobserve(sentinel);
    }
}

// Setup IntersectionObserver
const observerOptions = {
    root: null, // default viewport
    rootMargin: "150px", // prefetch 150px before entering viewport
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && currentCount < MAX_ITEMS) {
            loadMoreItems();
        }
    });
}, observerOptions);

// Reset Feed
function resetFeed() {
    currentCount = 0;
    pageNumber = 1;
    isLoading = false;
    cardsContainer.replaceChildren();
    endOfFeed.classList.add("hidden");
    itemCountEl.textContent = "0";
    observer.observe(sentinel);
    loadMoreItems();
}

resetBtn.addEventListener("click", resetFeed);

// Back to Top button scroll handler
window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
        backToTopBtn.classList.remove("hidden");
    } else {
        backToTopBtn.classList.add("hidden");
    }
});

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Initial boot
window.addEventListener("DOMContentLoaded", () => {
    observer.observe(sentinel);
    loadMoreItems();
});
