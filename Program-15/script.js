// Question Bank
const QUIZ_DATA = {
    web: [
        {
            q: "Which HTTP status code signifies that a resource was successfully created on the server?",
            options: ["200 OK", "201 Created", "204 No Content", "304 Not Modified"],
            answer: 1,
            exp: "HTTP status code 201 Created indicates that the request has succeeded and led to the creation of a new resource."
        },
        {
            q: "Which browser API provides high-performance asynchronous detection of element visibility in viewport?",
            options: ["ResizeObserver", "MutationObserver", "IntersectionObserver", "PerformanceObserver"],
            answer: 2,
            exp: "IntersectionObserver asynchronously observes changes in the intersection of a target element with an ancestor element or viewport."
        },
        {
            q: "In OAuth 2.0 protocol, which parameter is primarily utilized to prevent CSRF attacks?",
            options: ["client_id", "redirect_uri", "state", "scope"],
            answer: 2,
            exp: "The state parameter is a cryptographically random token used to bind the request to the client session, preventing Cross-Site Request Forgery."
        },
        {
            q: "Which JavaScript method is safest for rendering untrusted user strings into DOM without risking XSS?",
            options: ["element.innerHTML", "element.outerHTML", "element.textContent", "document.write()"],
            answer: 2,
            exp: "element.textContent safely treats all incoming data as raw textual literals, neutralizing any embedded script tags."
        },
        {
            q: "What is the maximum typical storage capacity per origin for HTML5 localStorage?",
            options: ["4 Kilobytes", "5 to 10 Megabytes", "50 Megabytes", "Unlimited"],
            answer: 1,
            exp: "HTML5 localStorage provides approximately 5MB to 10MB per origin, compared to cookies which are limited to 4KB."
        }
    ],
    dbms: [
        {
            q: "Which normal form eliminates partial functional dependencies on candidate keys?",
            options: ["1NF", "2NF", "3NF", "BCNF"],
            answer: 1,
            exp: "Second Normal Form (2NF) requires that the table is in 1NF and all non-prime attributes are fully functionally dependent on candidate keys."
        },
        {
            q: "What guarantee does the 'I' in the ACID properties of database transactions represent?",
            options: ["Integrity", "Isolation", "Immutability", "Indexing"],
            answer: 1,
            exp: "Isolation ensures that concurrent execution of transactions leaves the database in the same state that would have been obtained if transactions were executed sequentially."
        },
        {
            q: "Which MongoDB method corresponds to the SQL statement 'SELECT * FROM users'?",
            options: ["db.users.get()", "db.users.fetch()", "db.users.find()", "db.users.scan()"],
            answer: 2,
            exp: "db.collection.find() selects documents in a collection and returns a cursor to the matching documents."
        },
        {
            q: "What is the primary vulnerability prevented by parameterized SQL queries?",
            options: ["Cross-Site Scripting", "SQL Injection", "Distributed Denial of Service", "Buffer Overflow"],
            answer: 1,
            exp: "Parameterized queries separate SQL instructions from user inputs, rendering SQL injection attacks impossible."
        },
        {
            q: "In relational algebra, which operator filters rows based on a given condition?",
            options: ["Project (π)", "Select (σ)", "Cartesian Product (×)", "Join (⨝)"],
            answer: 1,
            exp: "The Select operator (represented by lowercase sigma σ) selects tuples that satisfy a given predicate."
        }
    ],
    os: [
        {
            q: "Which scheduling algorithm can potentially lead to starvation of long processes?",
            options: ["First-Come, First-Served", "Round Robin", "Shortest Job First (SJF)", "Priority without aging"],
            answer: 2,
            exp: "Shortest Job First (SJF) or Priority without aging can starve longer processes if shorter jobs continually arrive."
        },
        {
            q: "What is the condition where a process holds resources while waiting to acquire additional resources?",
            options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait"],
            answer: 1,
            exp: "Hold and Wait is one of Coffman's four necessary conditions for deadlock, where a process holds at least one resource and is waiting for others."
        },
        {
            q: "What type of fragment occurs when memory blocks allocated to processes contain unused space?",
            options: ["Internal Fragmentation", "External Fragmentation", "Virtual Fragmentation", "Segmental Fragmentation"],
            answer: 0,
            exp: "Internal fragmentation occurs when allocated storage is larger than requested storage, leaving unused bytes inside the allocated partition."
        },
        {
            q: "What hardware component handles virtual address translation into physical addresses?",
            options: ["ALU", "Control Unit", "Memory Management Unit (MMU)", "DMA Controller"],
            answer: 2,
            exp: "The Memory Management Unit (MMU) translates virtual addresses generated by the CPU into physical RAM addresses using page tables."
        },
        {
            q: "What is a major advantage of threads over processes?",
            options: ["Separate address spaces", "Lower context switching overhead", "Zero shared memory", "Immunity from deadlocks"],
            answer: 1,
            exp: "Threads share the same process address space and file descriptors, resulting in significantly lighter context switching and communication overhead."
        }
    ]
};

const LEADERBOARD_KEY = "mdu_quiz_leaderboard_v1";

// State
let selectedCategory = "web";
let currentQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let timerSeconds = 20;
let timerInterval = null;
let userAnswers = [];
let quizStartTime = 0;

// DOM Elements
const startScreen = document.getElementById("startScreen");
const questionScreen = document.getElementById("questionScreen");
const resultScreen = document.getElementById("resultScreen");

const catButtons = document.querySelectorAll(".cat-btn");
const startQuizBtn = document.getElementById("startQuizBtn");
const leaderboardList = document.getElementById("leaderboardList");

const currentQuestionNum = document.getElementById("currentQuestionNum");
const totalQuestionsNum = document.getElementById("totalQuestionsNum");
const timerBadge = document.getElementById("timerBadge");
const timerSecondsEl = document.getElementById("timerSeconds");
const quizProgressBar = document.getElementById("quizProgressBar");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const explanationBox = document.getElementById("explanationBox");
const expTitle = document.getElementById("expTitle");
const expText = document.getElementById("expText");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

const scorePercent = document.getElementById("scorePercent");
const resultGrade = document.getElementById("resultGrade");
const resultDetails = document.getElementById("resultDetails");
const reviewContainer = document.getElementById("reviewContainer");
const retakeBtn = document.getElementById("retakeBtn");
const homeBtn = document.getElementById("homeBtn");

// Category Selection
catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        catButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedCategory = btn.getAttribute("data-category");
    });
});

// Start Quiz
function startQuiz() {
    currentQuestions = [...QUIZ_DATA[selectedCategory]];
    currentQuestionIndex = 0;
    userScore = 0;
    userAnswers = [];
    quizStartTime = Date.now();

    totalQuestionsNum.textContent = currentQuestions.length;

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    questionScreen.classList.remove("hidden");

    loadQuestion();
}

startQuizBtn.addEventListener("click", startQuiz);

// Load Question
function loadQuestion() {
    clearInterval(timerInterval);
    explanationBox.classList.add("hidden");

    const qData = currentQuestions[currentQuestionIndex];
    currentQuestionNum.textContent = currentQuestionIndex + 1;

    const progressPct = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    quizProgressBar.style.width = `${progressPct}%`;

    questionText.textContent = qData.q;
    optionsContainer.replaceChildren();

    // Reset Timer
    timerSeconds = 20;
    timerSecondsEl.textContent = timerSeconds;
    timerBadge.classList.remove("urgent");

    timerInterval = setInterval(() => {
        timerSeconds--;
        timerSecondsEl.textContent = timerSeconds;

        if (timerSeconds <= 5) {
            timerBadge.classList.add("urgent");
        }

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            handleOptionSelect(-1); // Time expired
        }
    }, 1000);

    // Render Options
    qData.options.forEach((optText, idx) => {
        const btn = document.createElement("button");
        btn.className = "opt-btn";
        btn.innerHTML = `<span style="font-weight:700; color:#7c3aed;">${String.fromCharCode(65 + idx)}.</span> <span>${optText}</span>`;
        btn.addEventListener("click", () => handleOptionSelect(idx));
        optionsContainer.appendChild(btn);
    });
}

// Option Selected
function handleOptionSelect(selectedIndex) {
    clearInterval(timerInterval);

    const qData = currentQuestions[currentQuestionIndex];
    const isCorrect = (selectedIndex === qData.answer);

    if (isCorrect) userScore++;

    userAnswers.push({
        question: qData.q,
        options: qData.options,
        correctIndex: qData.answer,
        selectedIndex,
        isCorrect,
        explanation: qData.exp
    });

    // Disable all options and show colors
    const buttons = optionsContainer.querySelectorAll(".opt-btn");
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === qData.answer) {
            btn.classList.add("correct");
        } else if (idx === selectedIndex) {
            btn.classList.add("wrong");
        }
    });

    // Show Explanation
    expTitle.textContent = isCorrect ? "✅ Correct Answer!" : (selectedIndex === -1 ? "⏱️ Time Expired!" : "❌ Incorrect Answer!");
    expTitle.style.color = isCorrect ? "#15803d" : "#b91c1c";
    expText.textContent = qData.exp;
    explanationBox.classList.remove("hidden");
}

// Next Button Handler
nextQuestionBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
});

// Finish Quiz & Render Results
function finishQuiz() {
    clearInterval(timerInterval);
    questionScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    const total = currentQuestions.length;
    const pct = Math.round((userScore / total) * 100);
    const duration = Math.round((Date.now() - quizStartTime) / 1000);

    scorePercent.textContent = `${pct}%`;

    let grade = "Distinction! Outstanding performance.";
    if (pct < 40) grade = "Needs Revision. Keep practicing!";
    else if (pct < 70) grade = "Good Effort! Solid foundation.";
    else if (pct < 90) grade = "Very Good! High proficiency.";

    resultGrade.textContent = grade;
    resultDetails.textContent = `You correctly answered ${userScore} out of ${total} questions in ${duration} seconds.`;

    // Render Answers Review
    reviewContainer.replaceChildren();
    userAnswers.forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "review-card";
        const selectedText = item.selectedIndex >= 0 ? item.options[item.selectedIndex] : "Time expired / None";
        const correctText = item.options[item.correctIndex];

        card.innerHTML = `
            <div class="review-q">Q${idx + 1}: ${item.question}</div>
            <div style="font-size:0.85rem; margin-bottom:4px; color:${item.isCorrect ? '#15803d' : '#dc2626'};">
                Your Answer: <strong>${selectedText}</strong> ${item.isCorrect ? "✓" : "✗"}
            </div>
            ${!item.isCorrect ? `<div class="review-ans">Correct: <strong>${correctText}</strong></div>` : ""}
            <div style="font-size:0.8rem; color:#64748b; margin-top:4px;">💡 ${item.explanation}</div>
        `;
        reviewContainer.appendChild(card);
    });

    // Save to Persistent Leaderboard
    saveScore(pct, duration);
    loadLeaderboard();
}

// Leaderboard Storage
function saveScore(pct, duration) {
    const list = getLeaderboard();
    const entry = {
        category: selectedCategory.toUpperCase(),
        score: pct,
        duration: `${duration}s`,
        date: new Date().toLocaleDateString()
    };
    list.unshift(entry);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list.slice(0, 5)));
}

function getLeaderboard() {
    try {
        return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function loadLeaderboard() {
    const list = getLeaderboard();
    leaderboardList.replaceChildren();

    if (list.length === 0) {
        leaderboardList.innerHTML = `<li class="muted-item">No quiz scores recorded yet. Complete your first test!</li>`;
        return;
    }

    list.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "leaderboard-item";
        li.innerHTML = `
            <span><strong>#${idx + 1}</strong> [${item.category}] Score: <strong>${item.score}%</strong></span>
            <span style="color:#64748b;">${item.duration} • ${item.date}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

// Navigation Listeners
retakeBtn.addEventListener("click", startQuiz);
homeBtn.addEventListener("click", () => {
    resultScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    loadLeaderboard();
});

// Initial boot
loadLeaderboard();
