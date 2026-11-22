// Academic Course & Library Catalog Dataset
const CATALOG = [
    {
        id: 1,
        code: "BCA-201",
        title: "Web Application Development & Architecture",
        department: "Computer Science",
        level: "Undergraduate",
        instructor: "Prof. R. K. Sharma",
        rating: 4.9,
        year: 2026,
        description: "Comprehensive coverage of HTML5, CSS3, ES6 JavaScript, REST APIs, Node.js backend services, and Single Page Application design."
    },
    {
        id: 2,
        code: "BCA-202",
        title: "Database Management Systems (SQL & Relational Models)",
        department: "Computer Science",
        level: "Undergraduate",
        instructor: "Dr. Sunita Malik",
        rating: 4.8,
        year: 2025,
        description: "Study of relational algebra, normalization up to BCNF, SQL transactions, ACID guarantees, and connection pooling in MySQL."
    },
    {
        id: 3,
        code: "BCA-203",
        title: "Data Structures and Algorithm Analysis",
        department: "Computer Science",
        level: "Undergraduate",
        instructor: "Prof. Amit Chahal",
        rating: 4.7,
        year: 2024,
        description: "Implementation of arrays, linked lists, binary search trees, heap queues, graph traversal algorithms, and Big-O computational complexity."
    },
    {
        id: 4,
        code: "MCA-104",
        title: "Full-Stack Development with Node.js & React Framework",
        department: "Information Tech",
        level: "Postgraduate",
        instructor: "Dr. Vikram Sethi",
        rating: 4.95,
        year: 2026,
        description: "Modern enterprise full-stack development with React components, hooks, Vite bundling, Express middleware, and MongoDB document modeling."
    },
    {
        id: 5,
        code: "BCA-205",
        title: "Object-Oriented Programming with Java & Design Patterns",
        department: "Computer Science",
        level: "Undergraduate",
        instructor: "Prof. Priya Hooda",
        rating: 4.6,
        year: 2023,
        description: "Core OOP paradigms: inheritance, polymorphism, abstract interfaces, multithreading, and factory singleton software design patterns."
    },
    {
        id: 6,
        code: "BCA-106",
        title: "Discrete Mathematics & Graph Theory",
        department: "Mathematics",
        level: "Undergraduate",
        instructor: "Dr. Naveen Kumar",
        rating: 4.5,
        year: 2024,
        description: "Propositional logic, set theory, recurrence relations, Eulerian cycles, Hamiltonian paths, and boolean algebra applications."
    },
    {
        id: 7,
        code: "MCA-207",
        title: "Cloud Computing & Distributed Systems",
        department: "Information Tech",
        level: "Postgraduate",
        instructor: "Prof. Deepak Verma",
        rating: 4.85,
        year: 2025,
        description: "Virtualization, microservices containerization with Docker, OAuth 2.0 security token delegation, and serverless compute models."
    },
    {
        id: 8,
        code: "BBA-108",
        title: "Principles of Management & Organizational Behavior",
        department: "Management",
        level: "Undergraduate",
        instructor: "Dr. Meenakshi Roy",
        rating: 4.4,
        year: 2023,
        description: "Fundamentals of business administration, managerial leadership, project workflows, motivational theories, and group dynamics."
    }
];

// DOM References
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const deptFilter = document.getElementById("deptFilter");
const levelFilter = document.getElementById("levelFilter");
const sortBy = document.getElementById("sortBy");
const resultsCount = document.getElementById("resultsCount");
const searchLatency = document.getElementById("searchLatency");
const resultsGrid = document.getElementById("resultsGrid");
const chips = document.querySelectorAll(".chip");

// Debounce Utility (Prevents excessive execution on every keystroke)
function debounce(func, wait = 150) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Substring Regex Highlighter (Highlights matching user query safely)
function highlightMatch(text, query) {
    if (!query || query.length === 0) return escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Core Filter & Search Function
function performSearch() {
    const startTime = performance.now();
    const query = searchInput.value.toLowerCase().trim();
    const dept = deptFilter.value;
    const level = levelFilter.value;
    const sort = sortBy.value;

    // Toggle clear button
    if (query.length > 0) {
        clearSearchBtn.classList.remove("hidden");
    } else {
        clearSearchBtn.classList.add("hidden");
    }

    // Filter Step
    let results = CATALOG.filter(item => {
        const matchesDept = (dept === "All" || item.department === dept);
        const matchesLevel = (level === "All" || item.level === level);

        const matchesQuery = !query ||
            item.title.toLowerCase().includes(query) ||
            item.code.toLowerCase().includes(query) ||
            item.department.toLowerCase().includes(query) ||
            item.instructor.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query);

        return matchesDept && matchesLevel && matchesQuery;
    });

    // Sorting Step
    if (sort === "titleAsc") {
        results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "ratingDesc") {
        results.sort((a, b) => b.rating - a.rating);
    } else if (sort === "yearDesc") {
        results.sort((a, b) => b.year - a.year);
    }

    const duration = (performance.now() - startTime).toFixed(1);
    searchLatency.textContent = `⚡ Executed in ${duration}ms`;

    renderResults(results, query);
}

// Render Results Grid
function renderResults(list, query) {
    resultsGrid.replaceChildren();

    resultsCount.textContent = `Showing ${list.length} of ${CATALOG.length} academic resources ${query ? `for "${query}"` : ""}`;

    if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-results";
        empty.innerHTML = `
            <h3>No Academic Resources Found</h3>
            <p>Try searching for broader keywords like <strong>"JavaScript"</strong>, <strong>"Database"</strong>, or reset filters.</p>
        `;
        resultsGrid.appendChild(empty);
        return;
    }

    list.forEach(item => {
        const card = document.createElement("article");
        card.className = "course-card";

        card.innerHTML = `
            <div>
                <div class="card-top">
                    <span class="dept-badge">${item.department}</span>
                    <span class="code-tag">${item.code}</span>
                </div>
                <h2 class="course-title">${highlightMatch(item.title, query)}</h2>
                <p class="course-desc">${highlightMatch(item.description, query)}</p>
            </div>
            <div class="course-footer">
                <span>👨‍🏫 ${highlightMatch(item.instructor, query)}</span>
                <span class="rating-badge">★ ${item.rating.toFixed(1)} (${item.year})</span>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

// Debounced Input Listener
const debouncedSearch = debounce(performSearch, 120);
searchInput.addEventListener("input", debouncedSearch);

// Filter Listeners
deptFilter.addEventListener("change", performSearch);
levelFilter.addEventListener("change", performSearch);
sortBy.addEventListener("change", performSearch);

// Clear Search Button
clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    performSearch();
    searchInput.focus();
});

// Clickable Query Chips
chips.forEach(chip => {
    chip.addEventListener("click", () => {
        searchInput.value = chip.getAttribute("data-query");
        performSearch();
    });
});

// Initial boot
performSearch();
