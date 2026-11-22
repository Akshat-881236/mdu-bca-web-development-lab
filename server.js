require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn, exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Root SPA Static Assets
app.use(express.static(path.join(__dirname)));

// Program Metadata Master Catalog (Prescribed by MDU Rohtak BCA Lab)
const PROGRAMS_METADATA = [
    {
        id: "Program-1",
        num: 1,
        title: "Responsive Webpage with Form Input Validation",
        syllabus: "Build a responsive webpage with a form that includes input validation for user data.",
        type: "frontend",
        tags: ["HTML5", "CSS3", "JavaScript", "Regex", "Input Validation", "Responsive"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-2",
        num: 2,
        title: "REST API with Node.js & Express (GET & POST)",
        syllabus: "Create a simple REST API using Node.js and Express that handles GET and POST requests.",
        type: "fullstack",
        tags: ["Node.js", "Express", "REST API", "MySQL", "Connection Pool", "GET/POST"],
        hasServer: true,
        port: 3300
    },
    {
        id: "Program-3",
        num: 3,
        title: "Basic Blogging Website (Add, View, Edit Posts)",
        syllabus: "Develop a basic blogging website with pages for adding, viewing, and editing blog posts.",
        type: "frontend",
        tags: ["SPA", "LocalStorage", "CRUD", "DOM Manipulation", "JavaScript"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-4",
        num: 4,
        title: "Dynamically Load Content from External API into Webpage",
        syllabus: "Write a JavaScript program to dynamically load content from an external API into a webpage.",
        type: "frontend",
        tags: ["Fetch API", "Async/Await", "Promises", "REST API", "DOM Injection", "JSONPlaceholder"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-5",
        num: 5,
        title: "Contact Form with Express Backend Server Integration",
        syllabus: "Create a simple contact form using HTML, CSS, and JavaScript that sends data to a backend server.",
        type: "fullstack",
        tags: ["Full Stack", "Express", "POST Request", "Double Validation", "CORS", "Inquiry Portal"],
        hasServer: true,
        port: 3005
    },
    {
        id: "Program-6",
        num: 6,
        title: "Live Weather Application with External REST API",
        syllabus: "Write a program to Build a weather application that fetches weather data from an external API and displays it.",
        type: "frontend",
        tags: ["Weather API", "Open-Meteo", "Geocoding", "Unit Conversion", "Async JS", "Forecast"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-7",
        num: 7,
        title: "Infinite Scrolling Webpage with IntersectionObserver",
        syllabus: "Write a JavaScript program to implement infinite scrolling on a webpage.",
        type: "frontend",
        tags: ["IntersectionObserver", "Infinite Scroll", "Lazy Loading", "DocumentFragment", "Performance"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-8",
        num: 8,
        title: "CRUD Web Application with Relational Database Integration",
        syllabus: "Create a CRUD web application where users can create, read, update, and delete records from a database.",
        type: "fullstack",
        tags: ["Full Stack", "CRUD", "Express", "Database", "Student Records", "RESTful"],
        hasServer: true,
        port: 3008
    },
    {
        id: "Program-9",
        num: 9,
        title: "Form Validation & Storage in MongoDB via Node.js",
        syllabus: "Build a form with validation that stores user input in a database (using Node.js and MongoDB).",
        type: "fullstack",
        tags: ["MongoDB", "Mongoose", "NoSQL", "Schema Validation", "Admission Portal", "Express"],
        hasServer: true,
        port: 3009
    },
    {
        id: "Program-10",
        num: 10,
        title: "OAuth 2.0 User Authentication Web Application",
        syllabus: "Write a program to implement user authentication using OAuth 2.0 for logging into a web application.",
        type: "fullstack",
        tags: ["OAuth 2.0", "Authentication", "Google Identity", "CSRF State", "Session Management", "Security"],
        hasServer: true,
        port: 3010
    },
    {
        id: "Program-11",
        num: 11,
        title: "To-Do List Web Application with State & Progress Tracking",
        syllabus: "Create a to-do list web application that allows users to add, remove, and mark tasks as completed.",
        type: "frontend",
        tags: ["To-Do App", "State Management", "LocalStorage", "Filters", "Progress Bar", "Productivity"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-12",
        num: 12,
        title: "Real-Time Search Functionality with Dynamic Filtering",
        syllabus: "Write a program to implement a search functionality that filters results based on user input.",
        type: "frontend",
        tags: ["Search Engine", "Debouncing", "Highlighting", "Regex", "Multi-Criteria Filter", "Catalog"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-13",
        num: 13,
        title: "Responsive Navigation Menu with Dropdowns & Mobile Drawer",
        syllabus: "Build a responsive navigation menu with dropdowns using HTML, CSS, and JavaScript.",
        type: "frontend",
        tags: ["Responsive Navbar", "Dropdown Menu", "Hamburger Drawer", "WCAG ARIA", "CSS Animations"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-14",
        num: 14,
        title: "User Preferences Storage using Cookies & LocalStorage",
        syllabus: "Write a program to store user preferences using cookies or local storage in the browser.",
        type: "frontend",
        tags: ["Cookies", "LocalStorage", "Theme Customizer", "Dynamic CSS Variables", "Web Audio API"],
        hasServer: false,
        port: null
    },
    {
        id: "Program-15",
        num: 15,
        title: "Dynamic Academic Quiz Web Application with Score Analytics",
        syllabus: "Create a dynamic quiz web application that stores questions and answers and tracks user scores.",
        type: "frontend",
        tags: ["Quiz Engine", "Timer Countdown", "Score Tracking", "Leaderboard", "Answer Review", "Interactive"],
        hasServer: false,
        port: null
    }
];

// Mount static file serving for all programs (for interactive live runners)
PROGRAMS_METADATA.forEach(prog => {
    const progPath = path.join(__dirname, prog.id);
    const publicPath = path.join(progPath, "public");
    if (fs.existsSync(publicPath)) {
        app.use(`/apps/${prog.id}`, express.static(publicPath));
    } else if (fs.existsSync(progPath)) {
        app.use(`/apps/${prog.id}`, express.static(progPath));
    }
});

// Multi-Server Process Orchestrator State
const subServers = {};

// Initialize sub-server tracker
PROGRAMS_METADATA.filter(p => p.hasServer).forEach(p => {
    subServers[p.id] = {
        id: p.id,
        num: p.num,
        title: p.title,
        port: p.port,
        liveUrl: `http://localhost:${p.port}`,
        status: "stopped", // "running", "stopped", "error"
        pid: null,
        child: null,
        startTime: null,
        logs: []
    };
});

// Helper: Append log line
function appendLog(progId, text) {
    if (!subServers[progId]) return;
    const timestamp = new Date().toLocaleTimeString();
    subServers[progId].logs.push(`[${timestamp}] ${text}`);
    if (subServers[progId].logs.length > 50) {
        subServers[progId].logs.shift();
    }
}

// Function to start a sub-server
function startSubServer(progId) {
    return new Promise((resolve, reject) => {
        const s = subServers[progId];
        if (!s) return reject(new Error("Unknown server program ID: " + progId));
        if (s.status === "running") return resolve({ message: "Server is already running", server: s });

        const progDir = path.join(__dirname, progId);
        const serverFile = path.join(progDir, "server.js");

        if (!fs.existsSync(serverFile)) {
            return reject(new Error(`server.js not found in ${progId}`));
        }

        appendLog(progId, `Spawning process: node server.js on port ${s.port}...`);

        try {
            const child = spawn("node", ["server.js"], {
                cwd: progDir,
                env: { ...process.env, PORT: s.port },
                shell: true
            });

            s.child = child;
            s.pid = child.pid;
            s.status = "running";
            s.startTime = new Date().toISOString();

            child.stdout.on("data", (data) => {
                const lines = data.toString().trim().split("\n");
                lines.forEach(line => appendLog(progId, line));
            });

            child.stderr.on("data", (data) => {
                const lines = data.toString().trim().split("\n");
                lines.forEach(line => appendLog(progId, `[STDERR] ${line}`));
            });

            child.on("close", (code) => {
                appendLog(progId, `Process exited with code ${code}`);
                s.status = "stopped";
                s.pid = null;
                s.child = null;
                s.startTime = null;
            });

            child.on("error", (err) => {
                appendLog(progId, `Process error: ${err.message}`);
                s.status = "error";
            });

            appendLog(progId, `Server started successfully (PID: ${s.pid}). Live URL: ${s.liveUrl}`);
            resolve({ message: "Server launched successfully", server: s });
        } catch (err) {
            s.status = "error";
            appendLog(progId, `Failed to launch: ${err.message}`);
            reject(err);
        }
    });
}

// Function to stop a sub-server
function stopSubServer(progId) {
    return new Promise((resolve, reject) => {
        const s = subServers[progId];
        if (!s) return reject(new Error("Unknown server program ID: " + progId));
        if (s.status !== "running" || !s.pid) {
            s.status = "stopped";
            return resolve({ message: "Server is not running", server: s });
        }

        appendLog(progId, `Stopping server (PID ${s.pid})...`);

        try {
            if (process.platform === "win32") {
                // Windows taskkill to ensure child tree termination
                exec(`taskkill /pid ${s.pid} /T /F`, (err) => {
                    s.status = "stopped";
                    s.pid = null;
                    s.child = null;
                    s.startTime = null;
                    appendLog(progId, "Server terminated.");
                    resolve({ message: "Server stopped successfully", server: s });
                });
            } else {
                s.child.kill("SIGTERM");
                s.status = "stopped";
                s.pid = null;
                s.child = null;
                s.startTime = null;
                appendLog(progId, "Server terminated.");
                resolve({ message: "Server stopped successfully", server: s });
            }
        } catch (err) {
            appendLog(progId, `Error stopping process: ${err.message}`);
            reject(err);
        }
    });
}

// Helper: Recursively scan folder structure
function getFolderTree(dirPath, relativeTo) {
    const items = fs.readdirSync(dirPath);
    const nodes = [];

    items.forEach(item => {
        if (item === "node_modules" || item === ".git") return; // Skip heavy folders
        const fullPath = path.join(dirPath, item);
        const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, "/");
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            nodes.push({
                name: item,
                path: relPath,
                type: "directory",
                children: getFolderTree(fullPath, relativeTo)
            });
        } else {
            nodes.push({
                name: item,
                path: relPath,
                type: "file",
                size: stat.size,
                ext: path.extname(item).toLowerCase()
            });
        }
    });

    return nodes;
}

// ================= REST API Routes =================

// 1. Get List of all 15 Programs
app.get("/api/programs", (req, res) => {
    const list = PROGRAMS_METADATA.map(p => {
        const serverInfo = p.hasServer && subServers[p.id] ? {
            status: subServers[p.id].status,
            port: subServers[p.id].port,
            liveUrl: subServers[p.id].liveUrl,
            pid: subServers[p.id].pid,
            startTime: subServers[p.id].startTime
        } : null;

        return {
            ...p,
            serverInfo,
            liveAppUrl: p.hasServer && serverInfo && serverInfo.status === "running" 
                ? serverInfo.liveUrl 
                : `/apps/${p.id}/index.html`
        };
    });

    res.status(200).json({ success: true, count: list.length, data: list });
});

// 2. Get Single Program Detail (Tree, Readme, Files)
app.get("/api/programs/:id", (req, res) => {
    const progId = req.params.id;
    const progMeta = PROGRAMS_METADATA.find(p => p.id === progId);

    if (!progMeta) {
        return res.status(404).json({ success: false, message: `Program ${progId} not found` });
    }

    const progDir = path.join(__dirname, progId);
    if (!fs.existsSync(progDir)) {
        return res.status(404).json({ success: false, message: `Directory for ${progId} does not exist` });
    }

    // Read Readme.md
    let readmeContent = "";
    const readmePath = path.join(progDir, "README.md");
    if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, "utf8");
    }

    // Generate folder structure
    const tree = getFolderTree(progDir, progDir);

    // List all files
    const fileList = [];
    function collectFiles(nodes) {
        nodes.forEach(n => {
            if (n.type === "file") fileList.push(n);
            if (n.children) collectFiles(n.children);
        });
    }
    collectFiles(tree);

    const serverInfo = progMeta.hasServer && subServers[progId] ? {
        status: subServers[progId].status,
        port: subServers[progId].port,
        liveUrl: subServers[progId].liveUrl,
        pid: subServers[progId].pid,
        logs: subServers[progId].logs
    } : null;

    res.status(200).json({
        success: true,
        data: {
            ...progMeta,
            serverInfo,
            readme: readmeContent,
            tree,
            files: fileList,
            liveAppUrl: progMeta.hasServer && serverInfo && serverInfo.status === "running"
                ? serverInfo.liveUrl
                : `/apps/${progId}/index.html`
        }
    });
});

// 3. Read specific file content from a program
app.get("/api/programs/:id/file", (req, res) => {
    const progId = req.params.id;
    const filePath = req.query.path;

    if (!filePath) {
        return res.status(400).json({ success: false, message: "Query parameter 'path' is required" });
    }

    const progDir = path.join(__dirname, progId);
    const targetFile = path.resolve(progDir, filePath);

    // Security: Ensure path does not escape program folder
    if (!targetFile.startsWith(progDir)) {
        return res.status(403).json({ success: false, message: "Access forbidden: Directory traversal attempt" });
    }

    if (!fs.existsSync(targetFile)) {
        return res.status(404).json({ success: false, message: "File not found" });
    }

    try {
        const content = fs.readFileSync(targetFile, "utf8");
        const ext = path.extname(targetFile).toLowerCase().replace(".", "");
        res.status(200).json({
            success: true,
            path: filePath,
            ext,
            content
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Sub-Servers Status List
app.get("/api/servers", (req, res) => {
    const list = Object.values(subServers).map(s => ({
        id: s.id,
        num: s.num,
        title: s.title,
        port: s.port,
        liveUrl: s.liveUrl,
        status: s.status,
        pid: s.pid,
        startTime: s.startTime
    }));
    res.status(200).json({ success: true, count: list.length, data: list });
});

// 5. Start a specific sub-server
app.post("/api/servers/start/:id", async (req, res) => {
    try {
        const result = await startSubServer(req.params.id);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Stop a specific sub-server
app.post("/api/servers/stop/:id", async (req, res) => {
    try {
        const result = await stopSubServer(req.params.id);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Start all fullstack sub-servers
app.post("/api/servers/start-all", async (req, res) => {
    const serverIds = Object.keys(subServers);
    const results = [];

    for (const id of serverIds) {
        try {
            const r = await startSubServer(id);
            results.push({ id, status: "started", message: r.message });
        } catch (err) {
            results.push({ id, status: "error", error: err.message });
        }
    }

    res.status(200).json({ success: true, results });
});

// 8. Stop all fullstack sub-servers
app.post("/api/servers/stop-all", async (req, res) => {
    const serverIds = Object.keys(subServers);
    const results = [];

    for (const id of serverIds) {
        try {
            const r = await stopSubServer(id);
            results.push({ id, status: "stopped", message: r.message });
        } catch (err) {
            results.push({ id, status: "error", error: err.message });
        }
    }

    res.status(200).json({ success: true, results });
});

// 9. Read logs for a sub-server
app.get("/api/servers/logs/:id", (req, res) => {
    const s = subServers[req.params.id];
    if (!s) return res.status(404).json({ success: false, message: "Server not found" });
    res.status(200).json({ success: true, id: s.id, status: s.status, logs: s.logs });
});

// 10. Fallback route for SPA
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/apps")) {
        return next();
    }
    res.sendFile(path.join(__dirname, "index.html"));
});

// Clean termination of all spawned child processes on exit
function cleanup() {
    console.log("\nShutting down master server & terminating all active sub-servers...");
    Object.keys(subServers).forEach(id => {
        const s = subServers[id];
        if (s.pid) {
            try {
                if (process.platform === "win32") {
                    exec(`taskkill /pid ${s.pid} /T /F`);
                } else {
                    s.child.kill("SIGKILL");
                }
            } catch (e) {}
        }
    });
    process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🏛️  MDU Rohtak BCA Lab Portal Server running at: http://localhost:${PORT}`);
    console.log(`📡  Multi-Server Process Orchestrator Ready`);
    console.log(`⚡  Live API Routes: /api/programs, /api/servers`);
    console.log(`================================================================`);
});
