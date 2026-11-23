// ==========================================================================
// MDU Rohtak BCA Web Application Development Lab Portal
// Full-Stack React 18 Single Page Application
// Multi-Server Orchestrator, Line-by-Line Code Search, Inbuilt Code Editor,
// IndexedDB & Cookie Persistence, Deep-Linking & Creator Ecosystem Integration
// ==========================================================================

const { useState, useEffect, useMemo, useRef, createElement: h } = window.React;

// Theme Definitions with Bootstrap Icons
const THEMES = [
    { id: "dark-pro", name: "Dark Pro", icon: "bi-moon-stars" },
    { id: "academic-light", name: "Academic Light", icon: "bi-sun" },
    { id: "cyber-matrix", name: "Cyber Matrix", icon: "bi-terminal" },
    { id: "solarized", name: "Solarized Warm", icon: "bi-journal-richtext" }
];

// GitHub Repository Base URL
const GITHUB_REPO_URL = "https://github.com/Akshat-881236/mdu-bca-web-development-lab";

// Synonym Dictionary for NLP Query Expansion
const NLP_SYNONYMS = {
    "api": ["rest", "endpoint", "fetch", "json", "express", "get", "post", "http"],
    "rest": ["api", "endpoint", "crud", "express", "json", "mysql"],
    "database": ["db", "mongo", "mongodb", "mysql", "sqlite", "sql", "crud", "schema", "records"],
    "db": ["database", "mongo", "mongodb", "mysql", "sqlite", "sql"],
    "mongo": ["mongodb", "nosql", "mongoose", "database", "schema", "admission"],
    "mongodb": ["mongo", "nosql", "mongoose", "database", "schema", "admission"],
    "sql": ["mysql", "sqlite", "relational", "database", "table", "schema"],
    "auth": ["oauth", "login", "session", "google", "security", "token", "authentication"],
    "login": ["auth", "oauth", "session", "google", "security", "token"],
    "oauth": ["auth", "login", "google", "token", "csrf", "security"],
    "scroll": ["infinite", "intersectionobserver", "observer", "lazy", "pagination", "feed"],
    "infinite": ["scroll", "intersectionobserver", "lazy", "observer"],
    "weather": ["forecast", "meteo", "temperature", "celsius", "climate", "geocoding"],
    "quiz": ["exam", "test", "mcq", "questions", "timer", "score", "leaderboard"],
    "todo": ["task", "list", "checklist", "progress", "tracker"],
    "search": ["filter", "debounce", "highlight", "regex", "catalog"],
    "form": ["input", "validation", "regex", "contact", "submit", "admission"],
    "cookies": ["cookie", "localstorage", "preferences", "storage", "cache"],
    "storage": ["cookies", "localstorage", "preferences", "cache"],
    "nav": ["navbar", "menu", "dropdown", "hamburger", "responsive", "drawer"],
    "menu": ["nav", "navbar", "dropdown", "hamburger", "drawer"]
};

// Common English Stop Words
const STOP_WORDS = new Set([
    "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below",
    "to", "from", "up", "down", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "and", "but", "if", "or", "because",
    "as", "until", "while", "of", "it", "this", "that", "these", "those"
]);

// --------------------------------------------------------------------------
// Storage Manager: IndexedDB + Cookies + LocalStorage Bridge
// --------------------------------------------------------------------------
const StorageManager = {
    DB_NAME: "MDULabPortalDB",
    DB_VERSION: 1,
    STORE_NAME: "preferences",

    setCookie(name, value, days = 365) {
        try {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
        } catch (e) {}
    },

    getCookie(name) {
        try {
            const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
            return match ? decodeURIComponent(match[2]) : null;
        } catch (e) {
            return null;
        }
    },

    async openDB() {
        if (!window.indexedDB) return null;
        return new Promise((resolve) => {
            try {
                const req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME, { keyPath: "key" });
                    }
                };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    },

    async getPref(key) {
        // Try IndexedDB first
        try {
            const db = await this.openDB();
            if (db) {
                const val = await new Promise((resolve) => {
                    const tx = db.transaction(this.STORE_NAME, "readonly");
                    const store = tx.objectStore(this.STORE_NAME);
                    const req = store.get(key);
                    req.onsuccess = () => resolve(req.result ? req.result.val : null);
                    req.onerror = () => resolve(null);
                });
                if (val !== null && val !== undefined) return val;
            }
        } catch (e) {}

        // Fallback to Cookie
        const cookieVal = this.getCookie(`mdu_${key}`);
        if (cookieVal) return cookieVal;

        // Fallback to LocalStorage
        try {
            return localStorage.getItem(`mdu_${key}`);
        } catch (e) {
            return null;
        }
    },

    async setPref(key, val) {
        // 1. Cookie
        this.setCookie(`mdu_${key}`, typeof val === "object" ? JSON.stringify(val) : String(val));

        // 2. LocalStorage
        try {
            localStorage.setItem(`mdu_${key}`, typeof val === "object" ? JSON.stringify(val) : String(val));
        } catch (e) {}

        // 3. IndexedDB
        try {
            const db = await this.openDB();
            if (db) {
                const tx = db.transaction(this.STORE_NAME, "readwrite");
                const store = tx.objectStore(this.STORE_NAME);
                store.put({ key, val, updatedAt: Date.now() });
            }
        } catch (e) {}
    }
};

// --------------------------------------------------------------------------
// URL Parameter Parser & Deep Linking Helper
// --------------------------------------------------------------------------
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prog") || params.get("p");
    let progId = null;
    if (p) {
        if (p.toLowerCase().startsWith("program-")) {
            progId = p;
        } else if (!isNaN(p)) {
            progId = `Program-${p}`;
        }
    }
    return {
        prog: progId,
        tab: params.get("tab") || params.get("t"),
        file: params.get("file") || params.get("f"),
        q: params.get("q") || params.get("search"),
        theme: params.get("theme")
    };
}

function syncUrlParams({ prog, tab, file, q }) {
    try {
        const url = new URL(window.location.href);
        if (prog) url.searchParams.set("prog", prog);
        if (tab) url.searchParams.set("tab", tab);
        if (file) url.searchParams.set("file", file);
        else url.searchParams.delete("file");
        if (q && q.trim().length > 0) url.searchParams.set("q", q.trim());
        else url.searchParams.delete("q");
        window.history.replaceState({}, "", url.toString());
    } catch (e) {}
}

// NLP Preprocessor: Tokenization & Query Expansion
function processNLPQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== "string") return [];
    
    const cleanTokens = rawQuery
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(t => t.length > 1 && !STOP_WORDS.has(t));

    const expandedTokens = new Set(cleanTokens);

    cleanTokens.forEach(token => {
        if (NLP_SYNONYMS[token]) {
            NLP_SYNONYMS[token].forEach(syn => expandedTokens.add(syn));
        }
        Object.keys(NLP_SYNONYMS).forEach(key => {
            if (token.startsWith(key) || key.startsWith(token)) {
                NLP_SYNONYMS[key].forEach(syn => expandedTokens.add(syn));
            }
        });
    });

    return Array.from(expandedTokens);
}

// Compute BM25/TF-IDF Relevance Score
function calculateRelevanceScore(program, queryTokens) {
    if (queryTokens.length === 0) return 0;

    let score = 0;
    const titleLower = (program.title || "").toLowerCase();
    const syllabusLower = (program.syllabus || "").toLowerCase();
    const tagsLower = (program.tags || []).join(" ").toLowerCase();
    const typeLower = (program.type || "").toLowerCase();

    queryTokens.forEach(token => {
        if (titleLower.includes(token)) score += 10;
        if (syllabusLower.includes(token)) score += 6;
        if (tagsLower.includes(token)) score += 5;
        if (typeLower.includes(token)) score += 3;
    });

    return score;
}

// Helper: Check if a file is editable according to lab guidelines
function isFileEditable(filePath, isFullStack) {
    if (!filePath) return false;
    const name = filePath.split("/").pop().toLowerCase();
    const ext = name.includes(".") ? "." + name.split(".").pop() : "";

    if (name === ".env") return true;
    if ([".html", ".css", ".json", ".sql", ".txt", ".md"].includes(ext)) return true;
    if (ext === ".js") {
        if (filePath.startsWith("public/") || !isFullStack) return true;
    }
    return false;
}

// Ecosystem & Academic Projects Directory
const ECOSYSTEM_PROJECTS = [
    {
        name: "Akshat Network Hub",
        url: "https://akshat-881236.github.io/AkshatNetworkHub/",
        desc: "Unified developer portfolio, tools directory & personal software showcase",
        badge: "Portfolio",
        icon: "bi-globe2"
    },
    {
        name: "DPGNotes Academic Portal",
        url: "https://dpgnotes.web.app/",
        desc: "Curriculum-aligned BCA study notes, practical guides, PYQs, and cover generator",
        badge: "Academic",
        icon: "bi-mortarboard-fill"
    },
    {
        name: "DigiIndia Search",
        url: "https://digiindia-studentcollaboration.web.app/search.html",
        desc: "Student collaboration search engine & educational resource portal",
        badge: "Search Engine",
        icon: "bi-search"
    },
    {
        name: "Web Lab Manual on DPGNotes",
        url: "https://dpgnotes.web.app/PracticalSolution/index.html?id=prac_1795020824041_bq1os",
        desc: "Official practical solution manuals, theory notes & code references",
        badge: "Lab Manual",
        icon: "bi-journal-code"
    }
];

// Helper: Map file name to Bootstrap Icons
function getBootstrapFileIcon(fileName, isDir = false) {
    if (isDir) return "bi bi-folder-fill";
    if (!fileName) return "bi bi-file-earmark-code";
    const name = fileName.toLowerCase();
    if (name === "readme.md" || name.endsWith(".md")) return "bi bi-filetype-md";
    if (name === "schema.sql" || name.endsWith(".sql")) return "bi bi-filetype-sql";
    if (name === "package.json" || name.endsWith(".json")) return "bi bi-filetype-json";
    if (name.endsWith(".html") || name.endsWith(".htm")) return "bi bi-filetype-html";
    if (name.endsWith(".css")) return "bi bi-filetype-css";
    if (name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".mjs")) return "bi bi-filetype-js";
    if (name === ".env" || name.startsWith(".env")) return "bi bi-gear-wide-connected";
    if (name.endsWith(".txt") || name.endsWith(".log")) return "bi bi-file-earmark-text";
    return "bi bi-file-earmark-code";
}

// Helper: Color class for file icons
function getFileIconColor(fileName, isDir = false) {
    if (isDir) return "icon-folder";
    if (!fileName) return "icon-default";
    const name = fileName.toLowerCase();
    if (name === "readme.md" || name.endsWith(".md")) return "icon-md";
    if (name === "schema.sql" || name.endsWith(".sql")) return "icon-sql";
    if (name === "package.json" || name.endsWith(".json")) return "icon-json";
    if (name.endsWith(".html") || name.endsWith(".htm")) return "icon-html";
    if (name.endsWith(".css")) return "icon-css";
    if (name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".mjs")) return "icon-js";
    if (name === ".env" || name.startsWith(".env")) return "icon-env";
    return "icon-default";
}

// IndexedDB Sandbox Storage Manager for User Edits
const ExperimentDB = {
    dbName: "MDULabExperimentsDB",
    dbVersion: 1,
    db: null,

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve) => {
            if (typeof indexedDB === "undefined") return resolve(null);
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("edits")) {
                    const store = db.createObjectStore("edits", { keyPath: "key" });
                    store.createIndex("progId", "progId", { unique: false });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => {
                console.warn("IndexedDB init failed, falling back to localStorage", e);
                resolve(null);
            };
        });
    },

    async saveFile(progId, filePath, content) {
        const db = await this.init();
        if (!db) {
            try {
                localStorage.setItem(`exp_${progId}_${filePath}`, content);
                return true;
            } catch (e) { return false; }
        }
        return new Promise((resolve) => {
            const tx = db.transaction("edits", "readwrite");
            const store = tx.objectStore("edits");
            const key = `${progId}:${filePath}`;
            store.put({ key, progId, filePath, content, updatedAt: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    },

    async getFile(progId, filePath) {
        const db = await this.init();
        if (!db) {
            return localStorage.getItem(`exp_${progId}_${filePath}`);
        }
        return new Promise((resolve) => {
            const tx = db.transaction("edits", "readonly");
            const store = tx.objectStore("edits");
            const key = `${progId}:${filePath}`;
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ? req.result.content : null);
            req.onerror = () => resolve(null);
        });
    },

    async getProgramEdits(progId) {
        const db = await this.init();
        if (!db) {
            const res = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith(`exp_${progId}_`)) {
                    res[k.replace(`exp_${progId}_`, "")] = localStorage.getItem(k);
                }
            }
            return res;
        }
        return new Promise((resolve) => {
            const tx = db.transaction("edits", "readonly");
            const store = tx.objectStore("edits");
            const index = store.index("progId");
            const req = index.getAll(progId);
            req.onsuccess = () => {
                const result = {};
                (req.result || []).forEach(item => {
                    result[item.filePath] = item.content;
                });
                resolve(result);
            };
            req.onerror = () => resolve({});
        });
    },

    async clearProgramEdits(progId) {
        const db = await this.init();
        if (!db) {
            const toRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith(`exp_${progId}_`)) toRemove.push(k);
            }
            toRemove.forEach(k => localStorage.removeItem(k));
            return true;
        }
        return new Promise((resolve) => {
            const tx = db.transaction("edits", "readwrite");
            const store = tx.objectStore("edits");
            const index = store.index("progId");
            const req = index.getAllKeys(progId);
            req.onsuccess = () => {
                const keys = req.result || [];
                keys.forEach(k => store.delete(k));
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }
};

// Runtime Live Blob URL Generator from IndexedDB modifications
async function buildExperimentLiveUrl(progId, manifestData) {
    const edits = await ExperimentDB.getProgramEdits(progId);
    let htmlPath = "index.html";
    let cssPath = "style.css";
    let jsPath = "script.js";

    if (manifestData && manifestData.files) {
        const hf = manifestData.files.find(f => f.name.toLowerCase() === "index.html");
        if (hf) htmlPath = hf.path;
        const cf = manifestData.files.find(f => f.name.toLowerCase() === "style.css");
        if (cf) cssPath = cf.path;
        const jf = manifestData.files.find(f => f.name.toLowerCase() === "script.js");
        if (jf) jsPath = jf.path;
    }

    let html = edits[htmlPath] || (manifestData && manifestData.fileContents && manifestData.fileContents[htmlPath]);
    if (!html) {
        try {
            const res = await fetch(`/api/programs/${progId}/file?path=${encodeURIComponent(htmlPath)}`);
            const j = await res.json();
            if (j.success) html = j.content;
        } catch (e) {}
    }
    if (!html) {
        try {
            const r2 = await fetch(`/apps/${progId}/${htmlPath}`);
            if (r2.ok) html = await r2.text();
        } catch (e) {}
    }
    if (!html) html = "<!DOCTYPE html><html><head><title>Experiment Sandbox</title></head><body><h1>Experiment Sandbox</h1></body></html>";

    let css = edits[cssPath] || (manifestData && manifestData.fileContents && manifestData.fileContents[cssPath]);
    if (!css && cssPath) {
        try {
            const res = await fetch(`/api/programs/${progId}/file?path=${encodeURIComponent(cssPath)}`);
            const j = await res.json();
            if (j.success) css = j.content;
        } catch (e) {}
    }

    let js = edits[jsPath] || (manifestData && manifestData.fileContents && manifestData.fileContents[jsPath]);
    if (!js && jsPath) {
        try {
            const res = await fetch(`/api/programs/${progId}/file?path=${encodeURIComponent(jsPath)}`);
            const j = await res.json();
            if (j.success) js = j.content;
        } catch (e) {}
    }

    let fullHtml = html;
    if (css && css.trim().length > 0) {
        const linkRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*style\.css["'][^>]*\/?>/gi;
        const fallbackLinkRegex = /<link\b[^>]*href=["'][^"']*style\.css["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi;
        const styleTag = `<style id="experiment-style">\n${css}\n</style>`;
        if (linkRegex.test(fullHtml)) {
            fullHtml = fullHtml.replace(linkRegex, styleTag);
        } else if (fallbackLinkRegex.test(fullHtml)) {
            fullHtml = fullHtml.replace(fallbackLinkRegex, styleTag);
        } else if (fullHtml.includes("</head>")) {
            fullHtml = fullHtml.replace("</head>", `${styleTag}\n</head>`);
        } else {
            fullHtml = styleTag + "\n" + fullHtml;
        }
    }

    if (js && js.trim().length > 0) {
        const scriptRegex = /<script\b[^>]*src=["'][^"']*script\.js["'][^>]*>\s*<\/script>/gi;
        const scriptTag = `<script id="experiment-script">\n${js}\n<\/script>`;
        if (scriptRegex.test(fullHtml)) {
            fullHtml = fullHtml.replace(scriptRegex, scriptTag);
        } else if (fullHtml.includes("</body>")) {
            fullHtml = fullHtml.replace("</body>", `${scriptTag}\n</body>`);
        } else {
            fullHtml = fullHtml + "\n" + scriptTag;
        }
    }

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
}

// Main React App Component
function App() {
    const initialParams = useMemo(() => getUrlParams(), []);

    // Core State
    const [programs, setPrograms] = useState([]);
    const [selectedId, setSelectedId] = useState(initialParams.prog || "Program-1");
    const [programDetail, setProgramDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    const [activeTab, setActiveTab] = useState(initialParams.tab || "readme");
    const [activeFile, setActiveFile] = useState(initialParams.file || null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    
    // Inbuilt Code Editor & Experimented Sandbox State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [editorMessage, setEditorMessage] = useState(null);
    const [hasExperimentEdits, setHasExperimentEdits] = useState(false);
    const [experimentBlobUrl, setExperimentBlobUrl] = useState(null);
    const [runnerMode, setRunnerMode] = useState("original"); // "original" | "experiment"

    // Header Projects Dropdown State & Timers
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isProjectsClickLocked, setIsProjectsClickLocked] = useState(false);
    const projectsClickTimerRef = useRef(null);
    const projectsHoverTimerRef = useRef(null);
    const projectsRef = useRef(null);

    const closeProjectsMenu = () => {
        if (projectsClickTimerRef.current) {
            clearTimeout(projectsClickTimerRef.current);
            projectsClickTimerRef.current = null;
        }
        if (projectsHoverTimerRef.current) {
            clearTimeout(projectsHoverTimerRef.current);
            projectsHoverTimerRef.current = null;
        }
        setIsProjectsClickLocked(false);
        setIsProjectsOpen(false);
    };

    const handleProjectsMouseEnter = () => {
        // Cancel any pending hover close debounce
        if (projectsHoverTimerRef.current) {
            clearTimeout(projectsHoverTimerRef.current);
            projectsHoverTimerRef.current = null;
        }
        // If click-locked, keep it open and pause the auto-close timer while user is hovering over card/icon
        if (projectsClickTimerRef.current) {
            clearTimeout(projectsClickTimerRef.current);
            projectsClickTimerRef.current = null;
        }
        setIsProjectsOpen(true);
    };

    const handleProjectsMouseLeave = () => {
        // If locked by click, resume the 8-second auto-close countdown so user has full time after moving away
        if (isProjectsClickLocked) {
            if (projectsClickTimerRef.current) clearTimeout(projectsClickTimerRef.current);
            projectsClickTimerRef.current = setTimeout(() => {
                closeProjectsMenu();
            }, 8000);
            return;
        }

        // If not click-locked (pure hover mode):
        // Give a generous 400ms debounce so user moving between button and card or deciding what to click never loses the card
        if (projectsHoverTimerRef.current) clearTimeout(projectsHoverTimerRef.current);
        projectsHoverTimerRef.current = setTimeout(() => {
            closeProjectsMenu();
        }, 400);
    };

    const handleProjectsClick = (e) => {
        e.stopPropagation();
        if (isProjectsOpen && isProjectsClickLocked) {
            // Clicking again toggles it closed
            closeProjectsMenu();
        } else {
            // Click activates the 8-second lock
            if (projectsHoverTimerRef.current) clearTimeout(projectsHoverTimerRef.current);
            if (projectsClickTimerRef.current) clearTimeout(projectsClickTimerRef.current);
            setIsProjectsClickLocked(true);
            setIsProjectsOpen(true);
            projectsClickTimerRef.current = setTimeout(() => {
                closeProjectsMenu();
            }, 8000);
        }
    };

    // Search & Line-by-Line Code Search
    const [searchQuery, setSearchQuery] = useState(initialParams.q || "");
    const [filterType, setFilterType] = useState("all");
    const [codeSearchResults, setCodeSearchResults] = useState([]);
    const [isSearchingCode, setIsSearchingCode] = useState(false);
    const [showCodeSearchResults, setShowCodeSearchResults] = useState(true);

    // Server Orchestrator & Live Logs Telemetry
    const [subServers, setSubServers] = useState([]);
    const [serverLogs, setServerLogs] = useState({});
    const [serverActionLoading, setServerActionLoading] = useState(false);
    
    // UI Appearance, Accessibility & Scroll State
    const [theme, setTheme] = useState(initialParams.theme || "dark-pro");
    const [scale, setScale] = useState("normal");
    const [runnerViewport, setRunnerViewport] = useState("desktop");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [scrollPercent, setScrollPercent] = useState(0);

    const logBoxRef = useRef(null);
    const codeRef = useRef(null);
    const viewportRef = useRef(null);

    // Click outside listener for Header Projects Dropdown
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (projectsRef.current && !projectsRef.current.contains(e.target)) {
                closeProjectsMenu();
            }
        };
        document.addEventListener("click", handleGlobalClick);
        return () => {
            document.removeEventListener("click", handleGlobalClick);
            if (projectsClickTimerRef.current) clearTimeout(projectsClickTimerRef.current);
            if (projectsHoverTimerRef.current) clearTimeout(projectsHoverTimerRef.current);
        };
    }, []);

    // Check IndexedDB edits on program change or detail load
    useEffect(() => {
        let active = true;
        (async () => {
            const edits = await ExperimentDB.getProgramEdits(selectedId);
            const hasEdits = Object.keys(edits).length > 0;
            if (active) {
                setHasExperimentEdits(hasEdits);
                if (hasEdits) {
                    const blobUrl = await buildExperimentLiveUrl(selectedId, programDetail);
                    if (active) {
                        setExperimentBlobUrl(blobUrl);
                        setRunnerMode("experiment");
                    }
                } else {
                    setExperimentBlobUrl(null);
                    setRunnerMode("original");
                }
            }
        })();
        return () => { active = false; };
    }, [selectedId, programDetail]);

    // 1. Initialize User Preferences from IndexedDB / Cookies on Boot
    useEffect(() => {
        (async () => {
            const savedTheme = initialParams.theme || await StorageManager.getPref("theme");
            if (savedTheme) setTheme(savedTheme);

            const savedScale = await StorageManager.getPref("scale");
            if (savedScale) setScale(savedScale);

            if (!initialParams.prog) {
                const savedProg = await StorageManager.getPref("last_prog");
                if (savedProg) setSelectedId(savedProg);
            }

            if (!initialParams.tab) {
                const savedTab = await StorageManager.getPref("last_tab");
                if (savedTab) setActiveTab(savedTab);
            }
        })();
    }, []);

    // 2. Persist Preferences to IndexedDB + Cookies whenever key state updates
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        StorageManager.setPref("theme", theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute("data-scale", scale);
        StorageManager.setPref("scale", scale);
    }, [scale]);

    useEffect(() => {
        if (selectedId) {
            StorageManager.setPref("last_prog", selectedId);
            syncUrlParams({ prog: selectedId, tab: activeTab, file: activeFile, q: searchQuery });
        }
    }, [selectedId]);

    useEffect(() => {
        if (activeTab) {
            StorageManager.setPref("last_tab", activeTab);
            syncUrlParams({ prog: selectedId, tab: activeTab, file: activeFile, q: searchQuery });
        }
    }, [activeTab]);

    useEffect(() => {
        syncUrlParams({ prog: selectedId, tab: activeTab, file: activeFile, q: searchQuery });
    }, [activeFile, searchQuery]);

    // 3. Scroll Percentage Tracking & Viewport Mapping
    useEffect(() => {
        const handleScroll = (e) => {
            const el = e.target;
            const scrollable = el.scrollHeight - el.clientHeight;
            if (scrollable > 0) {
                const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollable) * 100)));
                setScrollPercent(pct);
                StorageManager.setPref("last_scroll_pct", pct);
            }
        };

        const target = viewportRef.current;
        if (target) {
            target.addEventListener("scroll", handleScroll, { passive: true });
            return () => target.removeEventListener("scroll", handleScroll);
        }
    }, []);

    // 4. Touch Swipe Gesture Handling for Mobile & Tablet
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
                if (deltaX > 0 && touchStartX < 60) {
                    setIsMobileMenuOpen(true);
                } else if (deltaX < 0 && isMobileMenuOpen) {
                    setIsMobileMenuOpen(false);
                }
            }
        };

        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isMobileMenuOpen]);

    // 5. Fetch Programs Catalog
    const fetchPrograms = async () => {
        try {
            const res = await fetch("/api/programs");
            const json = await res.json();
            if (json.success) {
                setPrograms(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch programs:", err);
        }
    };

    // 6. Fetch Sub-Server Statuses & Logs
    const fetchServers = async () => {
        try {
            const res = await fetch("/api/servers");
            const json = await res.json();
            if (json.success) {
                setSubServers(json.data);
                // Sync logs from server cluster status
                const logsMap = {};
                json.data.forEach(s => {
                    if (s.logs && s.logs.length > 0) {
                        logsMap[s.id] = s.logs;
                    }
                });
                setServerLogs(prev => ({ ...prev, ...logsMap }));
            }
        } catch (err) {
            console.error("Failed to fetch server statuses:", err);
        }
    };

    // 7. Fetch Live Logs for Active Full-Stack Program
    const fetchLiveLogs = async (progId) => {
        if (!progId) return;
        try {
            const res = await fetch(`/api/servers/logs/${progId}`);
            const json = await res.json();
            if (json.success && json.logs) {
                setServerLogs(prev => ({ ...prev, [progId]: json.logs }));
            }
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
    };

    // Polling Intervals: Server statuses + Logs polling when on orchestrator tab
    useEffect(() => {
        fetchPrograms();
        fetchServers();

        const serverTimer = setInterval(fetchServers, 3500);
        return () => clearInterval(serverTimer);
    }, []);

    useEffect(() => {
        if (activeTab === "orchestrator" && selectedId) {
            fetchLiveLogs(selectedId);
            const logTimer = setInterval(() => fetchLiveLogs(selectedId), 1500);
            return () => clearInterval(logTimer);
        }
    }, [activeTab, selectedId]);

    // Auto-scroll terminal log box to bottom on update
    useEffect(() => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [serverLogs, activeTab]);

    // 8. Fetch Full Details of Selected Program
    useEffect(() => {
        if (!selectedId) return;

        let isMounted = true;
        setLoadingDetail(true);
        setIsEditing(false);
        setEditorMessage(null);

        fetch(`/api/programs/${selectedId}`)
            .then(res => res.json())
            .then(async json => {
                if (isMounted) {
                    let data = json && json.success ? json.data : null;
                    if (!data) {
                        const matched = programs.find(p => p.id === selectedId) || { id: selectedId, title: selectedId };
                        data = { ...matched, readme: "", tree: [], files: [] };
                    }

                    // Resilient Fallback 1: If Readme is empty, fetch statically via /apps/:id/README.md or /:id/README.md
                    if (!data.readme || data.readme.trim().length === 0) {
                        try {
                            let rRes = await fetch(`/apps/${selectedId}/README.md`);
                            if (!rRes.ok) rRes = await fetch(`/${selectedId}/README.md`);
                            if (rRes.ok) {
                                data.readme = await rRes.text();
                            }
                        } catch (e) {}
                    }

                    // Resilient Fallback 2: If files or readme missing or incomplete (e.g. missing README.md or frontend assets)
                    const isFilesMissing = !data.files || data.files.length < 2 || !data.files.some(f => f.name.toLowerCase() === "readme.md");
                    if (!data.readme || isFilesMissing) {
                        try {
                            const manifestRes = await fetch("/data/programs-data.json");
                            if (manifestRes.ok) {
                                const manifest = await manifestRes.json();
                                if (manifest[selectedId]) {
                                    if (!data.readme && manifest[selectedId].readme) data.readme = manifest[selectedId].readme;
                                    if (!data.files || data.files.length === 0) {
                                        data.files = manifest[selectedId].files ? [...manifest[selectedId].files] : [];
                                    } else if (manifest[selectedId].files) {
                                        const existing = new Set(data.files.map(f => f.path.replace(/\\/g, "/")));
                                        manifest[selectedId].files.forEach(mf => {
                                            const norm = mf.path.replace(/\\/g, "/");
                                            if (!existing.has(norm)) {
                                                data.files.push(mf);
                                                existing.add(norm);
                                            }
                                        });
                                    }
                                    if ((!data.tree || data.tree.length === 0) && manifest[selectedId].tree) {
                                        data.tree = manifest[selectedId].tree;
                                    } else if (manifest[selectedId].tree && manifest[selectedId].files && manifest[selectedId].files.length > (data.tree || []).length) {
                                        data.tree = manifest[selectedId].tree;
                                    }
                                }
                            }
                        } catch (e) {}
                    }

                    // Always ensure README.md is in files list
                    if (data.files && !data.files.some(f => f.name.toLowerCase() === "readme.md")) {
                        data.files.unshift({ name: "README.md", path: "README.md", type: "file", ext: ".md" });
                    }

                    setProgramDetail(data);
                    if (data.files && data.files.length > 0) {
                        // Keep current active file if it belongs to this program, else pick default
                        const exists = activeFile && data.files.some(f => f.path === activeFile);
                        if (!exists) {
                            const defaultFile = data.files.find(f => f.name === "index.html" || f.name === "server.js" || f.name === "script.js") || data.files[0];
                            setActiveFile(defaultFile.path);
                        }
                    }
                }
            })
            .catch(async err => {
                console.error("Detail fetch error:", err);
                if (isMounted) {
                    try {
                        const manifestRes = await fetch("/data/programs-data.json");
                        if (manifestRes.ok) {
                            const manifest = await manifestRes.json();
                            if (manifest[selectedId]) {
                                setProgramDetail(manifest[selectedId]);
                                if (manifest[selectedId].files && manifest[selectedId].files.length > 0) {
                                    setActiveFile(manifest[selectedId].files[0].path);
                                }
                            }
                        }
                    } catch (e) {}
                }
            })
            .finally(() => {
                if (isMounted) setLoadingDetail(false);
            });

        return () => { isMounted = false; };
    }, [selectedId]);

    // 9. Fetch File Content When Active File Changes (with Resilient Static Fallback)
    useEffect(() => {
        if (!selectedId || !activeFile) return;

        setLoadingFile(true);
        setIsEditing(false);
        setEditorMessage(null);

        fetch(`/api/programs/${selectedId}/file?path=${encodeURIComponent(activeFile)}`)
            .then(res => res.json())
            .then(async json => {
                if (json.success) {
                    setFileContent(json.content);
                    setEditContent(json.content);
                } else {
                    // Fallback 1: Attempt direct static fetch from /apps/:id/
                    try {
                        const staticRes = await fetch(`/apps/${selectedId}/${activeFile}`);
                        if (staticRes.ok) {
                            const txt = await staticRes.text();
                            setFileContent(txt);
                            setEditContent(txt);
                            return;
                        }
                    } catch (e) {}

                    // Fallback 2: Check embedded data manifest
                    try {
                        const manifestRes = await fetch("/data/programs-data.json");
                        if (manifestRes.ok) {
                            const manifest = await manifestRes.json();
                            if (manifest[selectedId] && manifest[selectedId].fileContents && manifest[selectedId].fileContents[activeFile] !== undefined) {
                                const txt = manifest[selectedId].fileContents[activeFile];
                                setFileContent(txt);
                                setEditContent(txt);
                                return;
                            }
                        }
                    } catch (e) {}

                    setFileContent(`// Error reading file: ${json.message}`);
                    setEditContent("");
                }
            })
            .catch(async err => {
                try {
                    const staticRes = await fetch(`/apps/${selectedId}/${activeFile}`);
                    if (staticRes.ok) {
                        const txt = await staticRes.text();
                        setFileContent(txt);
                        setEditContent(txt);
                        return;
                    }
                } catch (e) {}

                try {
                    const manifestRes = await fetch("/data/programs-data.json");
                    if (manifestRes.ok) {
                        const manifest = await manifestRes.json();
                        if (manifest[selectedId] && manifest[selectedId].fileContents && manifest[selectedId].fileContents[activeFile] !== undefined) {
                            const txt = manifest[selectedId].fileContents[activeFile];
                            setFileContent(txt);
                            setEditContent(txt);
                            return;
                        }
                    }
                } catch (e) {}

                setFileContent(`// Failed to fetch file content: ${err.message}`);
                setEditContent("");
            })
            .finally(() => {
                setLoadingFile(false);
            });
    }, [selectedId, activeFile]);

    // 10. Line-by-Line Code Search Debounce
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setCodeSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingCode(true);
            try {
                const res = await fetch(`/api/search-code?q=${encodeURIComponent(searchQuery.trim())}`);
                const json = await res.json();
                if (json.success) {
                    setCodeSearchResults(json.results || []);
                }
            } catch (e) {
                console.error("Code search error:", e);
            } finally {
                setIsSearchingCode(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Re-highlight with Prism.js on code or tab change
    useEffect(() => {
        if (window.Prism && (activeTab === "code" || activeTab === "readme") && !isEditing) {
            setTimeout(() => {
                try { window.Prism.highlightAll(); } catch (e) {}
            }, 50);
        }
    }, [fileContent, activeTab, isEditing, programDetail]);

    // Current Selected Objects
    const currentProg = useMemo(() => {
        return programs.find(p => p.id === selectedId) || null;
    }, [programs, selectedId]);

    const currentSubServer = useMemo(() => {
        return subServers.find(s => s.id === selectedId) || null;
    }, [subServers, selectedId]);

    const isCurrentFileEditable = useMemo(() => {
        return isFileEditable(activeFile, currentProg && currentProg.hasServer);
    }, [activeFile, currentProg]);

    // Universal Live URL Resolver: Dynamically resolves for Development and Production
    const getUniversalLiveUrl = (prog) => {
        if (!prog) return "#";

        const isLocal = typeof window !== "undefined" && 
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

        // Local Development: Point directly to sub-server port if running
        if (isLocal && prog.hasServer && prog.port && currentSubServer && currentSubServer.status === "running") {
            return `http://localhost:${prog.port}`;
        }

        // Production / Vercel: Always point to the public web application URL on current origin
        if (typeof window !== "undefined") {
            return `${window.location.origin}/apps/${prog.id}/index.html`;
        }

        return `/apps/${prog.id}/index.html`;
    };

    // GitHub Source URL for Active File
    const currentGithubFileUrl = useMemo(() => {
        if (!selectedId || !activeFile) return GITHUB_REPO_URL;
        return `${GITHUB_REPO_URL}/blob/main/${selectedId}/${activeFile}`;
    }, [selectedId, activeFile]);

    // Save File Changes via Inbuilt Code Editor & IndexedDB Sandbox
    const handleSaveFile = async (andRestart = false, andRunExperiment = false) => {
        if (!selectedId || !activeFile) return;
        setIsSaving(true);
        setEditorMessage(null);

        try {
            // 1. Save to IndexedDB (Instant client-side offline persistence)
            await ExperimentDB.saveFile(selectedId, activeFile, editContent);
            setHasExperimentEdits(true);

            // 2. Generate updated runtime Blob URL
            const newBlobUrl = await buildExperimentLiveUrl(selectedId, programDetail);
            setExperimentBlobUrl(newBlobUrl);

            // 3. Attempt server-side save in background
            let serverMsg = "";
            try {
                const saveRes = await fetch(`/api/programs/${selectedId}/file`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: activeFile, content: editContent })
                });
                const saveJson = await saveRes.json();
                if (saveJson.success) serverMsg = " & synced to server";
            } catch (err) {}

            setFileContent(editContent);
            setEditorMessage({
                type: "success",
                text: `Saved to IndexedDB${serverMsg}! Live experiment runtime updated.`
            });

            if (andRunExperiment) {
                setRunnerMode("experiment");
                setActiveTab("runner");
            }

            if (andRestart && currentProg && currentProg.hasServer) {
                setEditorMessage({ type: "info", text: "Restarting sub-server with updated configuration..." });
                await fetch(`/api/servers/restart/${selectedId}`, { method: "POST" });
                await fetchServers();
                await fetchLiveLogs(selectedId);
                setActiveTab("orchestrator");
                setEditorMessage({ type: "success", text: "Saved to IndexedDB & Server restarted successfully!" });
            }
        } catch (err) {
            setEditorMessage({ type: "error", text: `Error: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    // Discard user edits and reset back to original source code
    const handleResetExperiment = async () => {
        await ExperimentDB.clearProgramEdits(selectedId);
        setHasExperimentEdits(false);
        setExperimentBlobUrl(null);
        setRunnerMode("original");
        try {
            const res = await fetch(`/api/programs/${selectedId}/file?path=${encodeURIComponent(activeFile)}`);
            const j = await res.json();
            if (j.success) {
                setFileContent(j.content);
                setEditContent(j.content);
            }
        } catch (e) {}
        setEditorMessage({ type: "success", text: "Reset all experiments for this practical to original code." });
    };

    // Sub-Server Actions (Start, Stop, Restart, Clear Logs)
    const handleServerAction = async (action, progId) => {
        setServerActionLoading(true);
        try {
            let endpoint = "";
            if (action === "start") endpoint = `/api/servers/start/${progId}`;
            else if (action === "stop") endpoint = `/api/servers/stop/${progId}`;
            else if (action === "restart") endpoint = `/api/servers/restart/${progId}`;
            else if (action === "clear-logs") endpoint = `/api/servers/clear-logs/${progId}`;

            const res = await fetch(endpoint, { method: "POST" });
            const json = await res.json();
            
            await fetchServers();
            await fetchPrograms();
            if (progId) await fetchLiveLogs(progId);
        } catch (err) {
            alert(`Server Action Failed: ${err.message}`);
        } finally {
            setServerActionLoading(false);
        }
    };

    // Copy Code Helper
    const copyCodeToClipboard = () => {
        const textToCopy = isEditing ? editContent : fileContent;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    // Cycle themes
    const cycleTheme = () => {
        const currentIndex = THEMES.findIndex(t => t.id === theme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        setTheme(THEMES[nextIndex].id);
    };

    // NLP Search Filtering
    const filteredPrograms = useMemo(() => {
        let result = programs;

        if (filterType === "frontend") {
            result = result.filter(p => !p.hasServer);
        } else if (filterType === "fullstack") {
            result = result.filter(p => p.hasServer);
        }

        if (searchQuery.trim().length > 0) {
            const queryTokens = processNLPQuery(searchQuery);
            if (queryTokens.length > 0) {
                const scored = result.map(p => ({
                    program: p,
                    score: calculateRelevanceScore(p, queryTokens)
                }));
                result = scored
                    .filter(item => item.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(item => item.program);
            }
        }

        return result;
    }, [programs, searchQuery, filterType]);

    const runningServerCount = subServers.filter(s => s.status === "running").length;
    const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

    // --------------------------------------------------------------------------
    // Render Functions
    // --------------------------------------------------------------------------

    // 1. Top Header with Creator Ecosystem Backlinks & Projects Menu
    const renderHeader = () => {
        return h("header", { className: "app-header" },
            h("div", { className: "header-left" },
                h("button", {
                    className: "mobile-menu-toggle mobile-only",
                    onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                    "aria-label": "Toggle navigation drawer"
                }, h("i", { className: "bi bi-list" })),
                h("div", { className: "header-brand-badge" },
                    h("span", { className: "brand-full" }, "MDU ROHTAK"),
                    h("span", { className: "brand-short" }, "MDU")
                ),
                h("div", { className: "header-title" },
                    h("h1", null,
                        h("span", { className: "title-full" }, "BCA Web Application Development Lab"),
                        h("span", { className: "title-short" }, "BCA Web Dev Lab")
                    ),
                    h("p", { className: "header-subtitle" }, "Official Practical Manual Portal & Multi-Server Orchestrator")
                )
            ),
            h("div", { className: "header-right" },
                // Active Server Cluster Pill
                h("div", {
                    className: "server-cluster-pill",
                    title: `${runningServerCount} of ${subServers.length} Full-Stack Sub-Servers Online`
                },
                    h("span", { className: runningServerCount > 0 ? "pulse-dot" : "pulse-dot stopped" }),
                    h("span", { className: "cluster-text-full" }, `${runningServerCount} of ${subServers.length} Servers Online`),
                    h("span", { className: "cluster-text-short" }, `${runningServerCount}/${subServers.length}`)
                ),

                // Desktop Theme Dropdown (Shown on >= 1024px)
                h("select", {
                    className: "theme-dropdown desktop-only",
                    value: theme,
                    onChange: (e) => setTheme(e.target.value),
                    "aria-label": "Select Portal Theme"
                },
                    THEMES.map(t => h("option", { key: t.id, value: t.id }, `${t.name}`))
                ),

                // Mobile/Tablet Icon-Only Theme Button (Shown on < 1024px)
                h("button", {
                    className: "header-icon-btn mobile-only theme-btn",
                    onClick: cycleTheme,
                    title: `Theme: ${currentTheme.name}. Tap to cycle theme.`
                }, h("i", { className: "bi bi-palette" })),

                // Header Projects Dropdown (Ecosystem Links: Akshat Network Hub, DPGNotes, DigiIndia Search, Lab Manual)
                h("div", {
                    className: "projects-dropdown-wrapper",
                    ref: projectsRef,
                    onMouseEnter: handleProjectsMouseEnter,
                    onMouseLeave: handleProjectsMouseLeave
                },
                    h("button", {
                        className: `projects-toggle-btn ${isProjectsOpen ? "active" : ""}`,
                        onClick: handleProjectsClick,
                        "aria-label": "Explore Related Projects & Portals",
                        title: "Related Projects & Portals (Click to keep open 8s)"
                    },
                        h("i", { className: "bi bi-globe" }),
                        h("span", { className: "projects-btn-text desktop-only-inline" }, " Portals"),
                        h("i", { className: "bi bi-chevron-down projects-arrow-icon desktop-only-inline" })
                    ),

                    isProjectsOpen && h("div", {
                        className: "projects-menu-card",
                        onMouseEnter: handleProjectsMouseEnter,
                        onMouseLeave: handleProjectsMouseLeave,
                        onClick: (e) => e.stopPropagation()
                    },
                        h("div", { className: "projects-card-header" },
                            h("div", { className: "projects-card-title" },
                                h("i", { className: "bi bi-grid-fill", style: { color: "var(--primary)" } }),
                                h("span", null, "Ecosystem Projects")
                            ),
                            h("span", { className: "projects-card-badge" }, "Official Links")
                        ),
                        h("div", { className: "projects-list" },
                            ECOSYSTEM_PROJECTS.map(proj => {
                                return h("a", {
                                    key: proj.name,
                                    href: proj.url,
                                    target: "_blank",
                                    rel: "noreferrer",
                                    className: "project-link-item"
                                },
                                    h("div", { className: "project-item-icon" },
                                        h("i", { className: `bi ${proj.icon}` })
                                    ),
                                    h("div", { className: "project-item-content" },
                                        h("div", { className: "project-item-header" },
                                            h("span", { className: "project-item-name" },
                                                proj.name,
                                                h("i", { className: "bi bi-box-arrow-up-right", style: { fontSize: "0.68rem", opacity: 0.7, marginLeft: "4px" } })
                                            ),
                                            h("span", { className: "project-item-tag" }, proj.badge)
                                        ),
                                        h("p", { className: "project-item-desc" }, proj.desc)
                                    )
                                );
                            })
                        )
                    )
                ),

                // Desktop Scale/Smartboard Button (Shown on >= 1024px)
                h("button", {
                    className: `scale-toggle desktop-only ${scale === "smartboard" ? "active" : ""}`,
                    onClick: () => setScale(scale === "normal" ? "smartboard" : "normal"),
                    title: "Toggle Presentation / Smartboard Large Font Mode"
                },
                    h("i", { className: "bi bi-display", style: { marginRight: "6px" } }),
                    scale === "normal" ? "Smartboard View" : "Standard View"
                ),

                // Mobile/Tablet Icon-Only Smartboard Toggle (Shown on < 1024px)
                h("button", {
                    className: `header-icon-btn mobile-only scale-icon-btn ${scale === "smartboard" ? "active" : ""}`,
                    onClick: () => setScale(scale === "normal" ? "smartboard" : "normal"),
                    title: "Toggle Smartboard / Presentation Mode"
                }, h("i", { className: "bi bi-display" }))
            )
        );
    };

    // 2. Sidebar with NLP Search, Code Search Results & Program List
    const renderSidebar = () => {
        const queryTokens = processNLPQuery(searchQuery);

        return h("aside", { className: `sidebar ${isMobileMenuOpen ? "open" : ""}` },
            // Mobile-Only Drawer Header with Explicit Close Button
            h("div", { className: "mobile-drawer-header mobile-only" },
                h("div", { className: "drawer-title" },
                    h("i", { className: "bi bi-mortarboard-fill", style: { marginRight: "6px" } }),
                    "Lab Manual Practicals (15)"
                ),
                h("button", {
                    className: "drawer-close-btn",
                    onClick: () => setIsMobileMenuOpen(false),
                    "aria-label": "Close navigation drawer"
                }, h("i", { className: "bi bi-x-lg" }))
            ),
            h("div", { className: "search-container" },
                h("div", { className: "search-input-wrapper" },
                    h("i", { className: "bi bi-search search-icon-symbol" }),
                    h("input", {
                        type: "text",
                        className: "search-input",
                        placeholder: "NLP Search: e.g. 'mongoose', 'oauth', 'weather', 'localStorage'...",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value)
                    }),
                    searchQuery && h("button", {
                        className: "clear-search-btn",
                        onClick: () => setSearchQuery("")
                    }, "×")
                ),
                // Category Filter Pills
                h("div", { className: "filter-pills" },
                    h("button", {
                        className: `pill-btn ${filterType === "all" ? "active" : ""}`,
                        onClick: () => setFilterType("all")
                    }, "All (15)"),
                    h("button", {
                        className: `pill-btn ${filterType === "frontend" ? "active" : ""}`,
                        onClick: () => setFilterType("frontend")
                    }, "Frontend (10)"),
                    h("button", {
                        className: `pill-btn ${filterType === "fullstack" ? "active" : ""}`,
                        onClick: () => setFilterType("fullstack")
                    }, "Full Stack (5)")
                ),
                queryTokens.length > 0 && h("div", { className: "nlp-badge" },
                    h("i", { className: "bi bi-cpu", style: { marginRight: "6px" } }),
                    h("span", null, `NLP Expanded: [${queryTokens.slice(0, 4).join(", ")}${queryTokens.length > 4 ? "..." : ""}]`)
                )
            ),

            // Line-by-Line Code Search Results Panel
            codeSearchResults.length > 0 && h("div", { className: "code-search-pane" },
                h("div", { className: "code-search-header" },
                    h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                        h("i", { className: "bi bi-lightning-charge-fill", style: { color: "var(--primary)" } }),
                        `Code Line Matches (${codeSearchResults.length})`
                    ),
                    h("button", {
                        className: "btn-console",
                        onClick: () => setShowCodeSearchResults(!showCodeSearchResults)
                    }, showCodeSearchResults ? "Hide" : "Show")
                ),
                showCodeSearchResults && codeSearchResults.slice(0, 8).map((match, idx) => (
                    h("div", {
                        key: `${match.progId}-${match.file}-${match.lineNum}-${idx}`,
                        className: "code-match-item",
                        onClick: () => {
                            setSelectedId(match.progId);
                            setActiveTab("code");
                            setActiveFile(match.file);
                            setIsMobileMenuOpen(false);
                        }
                    },
                        h("div", { className: "code-match-meta" },
                            h("span", null, `Prac #${match.progNum.toString().padStart(2, "0")} • ${match.progId}`),
                            h("span", { className: "code-match-file" }, `${match.file}:L${match.lineNum}`)
                        ),
                        h("div", { className: "code-match-snippet" }, match.snippet)
                    )
                ))
            ),

            // Main Practicals List
            h("div", { className: "program-list" },
                filteredPrograms.length === 0 && h("div", {
                    style: { padding: "30px 15px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }
                }, "No practicals matching your query. Try 'API', 'Database', 'Scroll', 'Weather', or 'Quiz'."),
                filteredPrograms.map(p => {
                    const isSelected = p.id === selectedId;
                    const serverObj = subServers.find(s => s.id === p.id);
                    const isRunning = serverObj && serverObj.status === "running";

                    return h("div", {
                        key: p.id,
                        className: `program-item ${isSelected ? "active" : ""}`,
                        onClick: () => {
                            setSelectedId(p.id);
                            setIsMobileMenuOpen(false);
                        }
                    },
                        h("div", { className: "item-top" },
                            h("span", { className: "item-num" }, `PRAC #${p.num.toString().padStart(2, "0")}`),
                            h("span", { className: `type-tag ${p.type}` }, p.type === "fullstack" ? "Full Stack" : "Frontend")
                        ),
                        h("div", { className: "item-title" }, p.title),
                        h("div", { className: "item-tags" },
                            p.tags.slice(0, 3).map(tag => h("span", { key: tag, className: "mini-tag" }, tag)),
                            p.hasServer && h("span", {
                                className: `server-dot-status ${isRunning ? "running" : ""}`
                            }, isRunning ? `Port ${p.port} (Live)` : `Port ${p.port}`)
                        )
                    );
                })
            )
        );
    };

    // 3. Program Header & Universal Live URL Banner
    const renderBanner = () => {
        if (!currentProg) return null;

        const isRunning = currentSubServer && currentSubServer.status === "running";
        const universalUrl = getUniversalLiveUrl(currentProg);
        const activeLiveTarget = (runnerMode === "experiment" && experimentBlobUrl) ? experimentBlobUrl : universalUrl;

        return h("div", { className: "prog-banner" },
            h("div", { className: "prog-banner-left" },
                h("h2", null, `Practical ${currentProg.num}: ${currentProg.title}`),
                h("p", { className: "prog-syllabus-text" }, currentProg.syllabus)
            ),
            h("div", { className: "banner-actions-cluster" },
                // Universal Live URL Button (Enabled for ALL 15 Programs + Runtime Experiment URL)
                h("a", {
                    href: activeLiveTarget,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "live-url-link prominent",
                    title: (runnerMode === "experiment" && experimentBlobUrl)
                        ? `Open ${currentProg.title} (IndexedDB Experiment Sandbox) in new tab`
                        : `Open ${currentProg.title} live in a new browser tab`
                },
                    h("i", {
                        className: (runnerMode === "experiment" && experimentBlobUrl) ? "bi bi-magic live-url-icon" : "bi bi-globe2 live-url-icon",
                        style: { marginRight: "6px" }
                    }),
                    h("span", null, (runnerMode === "experiment" && experimentBlobUrl) ? "Open Experiment " : "Open Live URL "),
                    h("i", { className: "bi bi-box-arrow-up-right", style: { fontSize: "0.8em" } })
                ),

                // Server Controller for Full-Stack Programs
                currentProg.hasServer && h("div", { className: "server-control-panel" },
                    h("span", {
                        className: `server-status-badge ${isRunning ? "running" : "stopped"}`
                    },
                        h("i", { className: `bi ${isRunning ? "bi-record-fill" : "bi-circle"}`, style: { marginRight: "5px" } }),
                        isRunning ? `Port ${currentProg.port} Online` : "Server Offline"
                    ),
                    !isRunning ? h("button", {
                        className: "btn-ctrl start",
                        disabled: serverActionLoading,
                        onClick: () => handleServerAction("start", currentProg.id)
                    },
                        h("i", { className: "bi bi-play-fill" }),
                        h("span", null, serverActionLoading ? " Starting..." : " Start Server")
                    ) : h("button", {
                        className: "btn-ctrl stop",
                        disabled: serverActionLoading,
                        onClick: () => handleServerAction("stop", currentProg.id)
                    },
                        h("i", { className: "bi bi-stop-fill" }),
                        h("span", null, serverActionLoading ? " Stopping..." : " Stop Server")
                    )
                )
            )
        );
    };

    // 4. Tab Navigation (Professional Bootstrap Icons)
    const renderTabs = () => {
        return h("div", { className: "tab-navbar" },
            h("button", {
                className: `tab-btn ${activeTab === "readme" ? "active" : ""}`,
                onClick: () => setActiveTab("readme")
            },
                h("i", { className: "bi bi-journal-text", style: { marginRight: "6px" } }),
                "Lab Manual Readme & Theory"
            ),
            h("button", {
                className: `tab-btn ${activeTab === "code" ? "active" : ""}`,
                onClick: () => setActiveTab("code")
            },
                h("i", { className: "bi bi-code-slash", style: { marginRight: "6px" } }),
                "Code Explorer & Inbuilt Editor"
            ),
            h("button", {
                className: `tab-btn ${activeTab === "structure" ? "active" : ""}`,
                onClick: () => setActiveTab("structure")
            },
                h("i", { className: "bi bi-folder2", style: { marginRight: "6px" } }),
                "Folder Structure"
            ),
            currentProg && currentProg.hasServer && h("button", {
                className: `tab-btn ${activeTab === "orchestrator" ? "active" : ""}`,
                onClick: () => setActiveTab("orchestrator")
            },
                h("i", { className: "bi bi-cpu", style: { marginRight: "6px" } }),
                "Sub-Server Process Logs"
            ),
            h("button", {
                className: `tab-btn ${activeTab === "runner" ? "active" : ""}`,
                onClick: () => setActiveTab("runner")
            },
                h("i", { className: "bi bi-play-circle", style: { marginRight: "6px" } }),
                "Interactive Live App Runner",
                hasExperimentEdits && h("span", { className: "experiment-badge-dot", style: { marginLeft: "6px" }, title: "Has active edits in IndexedDB" })
            )
        );
    };

    // 5. Tab Content: Readme Viewer
    const renderReadmeTab = () => {
        if (loadingDetail) {
            return h("div", { style: { padding: "40px", textAlign: "center" } }, "Loading documentation...");
        }

        const rawMarkdown = programDetail && programDetail.readme ? programDetail.readme : "# No README.md available.";
        const renderedHtml = window.marked ? window.marked.parse(rawMarkdown) : rawMarkdown;

        return h("div", {
            className: "readme-viewer",
            dangerouslySetInnerHTML: { __html: renderedHtml }
        });
    };

    // 6. Tab Content: Code Explorer & Inbuilt Editor
    const renderCodeTab = () => {
        if (!programDetail || !programDetail.files) return null;

        const ext = activeFile ? activeFile.split(".").pop().toLowerCase() : "javascript";
        const prismLang = ext === "js" ? "javascript" : (ext === "html" ? "markup" : (ext === "md" ? "markdown" : ext));

        return h("div", { className: "code-explorer-container" },
            // Toolbar
            h("div", { className: "code-toolbar" },
                h("div", { className: "file-tabs-scroll" },
                    programDetail.files.map(f => {
                        const isFileActive = f.path === activeFile;
                        return h("button", {
                            key: f.path,
                            className: `file-tab ${isFileActive ? "active" : ""}`,
                            onClick: () => {
                                setActiveFile(f.path);
                                setIsEditing(false);
                            }
                        },
                            h("i", { className: `${getBootstrapFileIcon(f.name)} ${getFileIconColor(f.name)}`, style: { marginRight: "6px" } }),
                            f.name
                        );
                    })
                ),
                h("div", { className: "code-actions" },
                    // GitHub Source Link
                    h("a", {
                        href: currentGithubFileUrl,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "btn-github-link",
                        title: "Inspect source code on GitHub"
                    },
                        h("i", { className: "bi bi-github btn-icon" }),
                        h("span", { className: "desktop-only-inline" }, " GitHub"),
                        h("i", { className: "bi bi-box-arrow-up-right desktop-only-inline", style: { fontSize: "0.75rem", marginLeft: "4px" } })
                    ),

                    // Inbuilt Editor Toggle Button (Only for Editable Frontend / .env Files)
                    isCurrentFileEditable ? h("button", {
                        className: `btn-ctrl ${isEditing ? "stop" : "start"}`,
                        onClick: () => setIsEditing(!isEditing),
                        title: isEditing ? "Switch back to Syntax Highlighted View" : "Edit this file in browser"
                    },
                        h("i", { className: `bi ${isEditing ? "bi-eye" : "bi-pencil-square"} btn-icon` }),
                        h("span", { className: "desktop-only-inline" }, isEditing ? " View Code" : " Edit File")
                    ) : h("span", {
                        className: "editor-badge readonly",
                        title: "Protected file: Only Frontend files and .env are editable"
                    },
                        h("i", { className: "bi bi-lock-fill btn-icon" }),
                        h("span", { className: "desktop-only-inline" }, " Read Only")
                    ),

                    // Copy Code
                    h("button", {
                        className: "btn-copy",
                        onClick: copyCodeToClipboard,
                        title: copySuccess ? "Copied to clipboard!" : "Copy code"
                    },
                        h("i", { className: `bi ${copySuccess ? "bi-check2" : "bi-clipboard"} btn-icon` }),
                        h("span", { className: "desktop-only-inline" }, copySuccess ? " Copied!" : " Copy Code")
                    )
                )
            ),

            // Inbuilt Editor Status / Action Bar
            isEditing && h("div", { className: "editor-status-bar" },
                h("div", { className: "editor-status-left" },
                    h("span", { className: "editor-badge editable" }, "Editable Mode"),
                    h("span", null, `File: ${activeFile}`),
                    h("span", { className: "desktop-only-inline" }, `• ${editContent.split("\n").length} lines`),
                    h("span", { className: "desktop-only-inline" }, `• ${editContent.length} chars`)
                ),
                h("div", { className: "editor-actions" },
                    h("button", {
                        className: "btn-save-code",
                        disabled: isSaving,
                        onClick: () => handleSaveFile(false, false),
                        title: "Save changes to IndexedDB"
                    },
                        h("i", { className: `bi ${isSaving ? "bi-hourglass-split" : "bi-floppy"} btn-icon` }),
                        h("span", { className: "desktop-only-inline" }, isSaving ? " Saving..." : " Save")
                    ),

                    h("button", {
                        className: "btn-run-experiment",
                        disabled: isSaving,
                        onClick: () => handleSaveFile(false, true),
                        title: "Save changes to IndexedDB and immediately view live in interactive runner"
                    },
                        h("i", { className: `bi ${isSaving ? "bi-hourglass-split" : "bi-play-fill"} btn-icon` }),
                        h("span", { className: "desktop-only-inline" }, " Run Experiment")
                    ),

                    currentProg && currentProg.hasServer && h("button", {
                        className: "btn-restart-server",
                        disabled: isSaving,
                        onClick: () => handleSaveFile(true, false),
                        title: "Save changes and immediately restart Node.js server with new configuration"
                    },
                        h("i", { className: `bi ${isSaving ? "bi-hourglass-split" : "bi-arrow-repeat"} btn-icon` }),
                        h("span", { className: "desktop-only-inline" }, isSaving ? " Saving..." : " Save & Restart")
                    ),

                    h("button", {
                        className: "btn-console",
                        onClick: () => setEditContent(fileContent),
                        title: "Reset unsaved file content in editor"
                    },
                        h("i", { className: "bi bi-arrow-counterclockwise btn-icon" }),
                        h("span", { className: "desktop-only-inline" }, " Reset")
                    ),

                    h("button", {
                        className: "btn-console",
                        onClick: () => setIsEditing(false),
                        title: "Close Editor"
                    },
                        h("i", { className: "bi bi-x-lg btn-icon" }),
                        h("span", { className: "desktop-only-inline" }, " Close")
                    )
                )
            ),

            // Notification message for editor
            editorMessage && h("div", {
                style: {
                    padding: "8px 16px",
                    background: editorMessage.type === "success" ? "var(--success-bg)" : (editorMessage.type === "error" ? "var(--danger-bg)" : "rgba(56, 189, 248, 0.1)"),
                    color: editorMessage.type === "success" ? "var(--success)" : (editorMessage.type === "error" ? "var(--danger)" : "var(--primary)"),
                    fontSize: "0.82rem",
                    fontWeight: "600"
                }
            }, editorMessage.text),

            // Main Editor or Prism.js Viewer Pane
            isEditing ? h("div", { className: "code-editor-pane" },
                h("textarea", {
                    className: "editor-textarea",
                    value: editContent,
                    onChange: (e) => setEditContent(e.target.value),
                    spellCheck: "false",
                    "aria-label": `Edit content of ${activeFile}`
                })
            ) : h("div", { className: "code-scroll-pane" },
                loadingFile
                    ? h("div", { style: { padding: "30px", color: "var(--text-muted)" } }, "Streaming file content...")
                    : h("pre", { className: `line-numbers language-${prismLang}` },
                        h("code", {
                            ref: codeRef,
                            className: `language-${prismLang}`
                        }, fileContent)
                    )
            )
        );
    };

    // 7. Tab Content: Folder Structure Tree Viewer (Bootstrap Icons)
    const renderStructureTab = () => {
        if (!programDetail || !programDetail.tree) return null;

        const renderTreeNodes = (nodes) => {
            return h("ul", { className: "tree-list" },
                nodes.map(node => {
                    const isDir = node.type === "directory";
                    return h("li", { key: node.path },
                        h("div", {
                            className: "tree-item",
                            onClick: () => {
                                if (!isDir) {
                                    setActiveFile(node.path);
                                    setActiveTab("code");
                                }
                            }
                        },
                            h("i", { className: `${getBootstrapFileIcon(node.name, isDir)} ${getFileIconColor(node.name, isDir)}`, style: { marginRight: "6px" } }),
                            h("span", { style: { fontWeight: isDir ? "700" : "400" } }, node.name),
                            !isDir && h("span", { style: { fontSize: "0.75rem", color: "var(--text-muted)" } }, `(${Math.round(node.size / 1024 * 10) / 10} KB)`)
                        ),
                        isDir && node.children && renderTreeNodes(node.children)
                    );
                })
            );
        };

        return h("div", { className: "folder-explorer-card" },
            h("h3", { style: { marginBottom: "16px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" } },
                h("i", { className: "bi bi-folder2-open" }),
                `Project Directory Hierarchy: ${selectedId}`
            ),
            h("p", { style: { fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "20px" } }, "Click any code or configuration file to immediately inspect or edit its source."),
            renderTreeNodes(programDetail.tree)
        );
    };

    // 8. Tab Content: Sub-Server Process Orchestrator & Live Terminal Logs
    const renderOrchestratorTab = () => {
        if (!currentProg) {
            return h("div", { style: { padding: "40px", textAlign: "center", color: "var(--text-secondary)" } }, "Loading process orchestrator details...");
        }

        const isRunning = currentSubServer && currentSubServer.status === "running";
        const universalUrl = getUniversalLiveUrl(currentProg);
        const logs = (serverLogs[selectedId] && serverLogs[selectedId].length > 0)
            ? serverLogs[selectedId]
            : ((currentSubServer && currentSubServer.logs && currentSubServer.logs.length > 0) ? currentSubServer.logs : []);

        return h("div", { className: "orchestrator-view" },
            h("div", { className: "orchestrator-card" },
                h("h3", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    h("i", { className: "bi bi-cpu", style: { color: "var(--primary)" } }),
                    `Process Orchestration Dashboard: ${selectedId}`
                ),
                h("p", { style: { fontSize: "0.9rem", color: "var(--text-secondary)", margin: "8px 0 16px" } }, "Independent Node.js Express child process execution with stdout/stderr telemetry."),
                h("div", { className: "server-master-grid" },
                    h("div", { className: "server-card-box" },
                        h("div", null,
                            h("strong", null, "Target Server Port: "),
                            h("span", null, currentProg.port)
                        ),
                        h("div", null,
                            h("strong", null, "Process ID (PID): "),
                            h("span", null, currentSubServer && currentSubServer.pid ? currentSubServer.pid : "None (Process Idle)")
                        ),
                        h("div", null,
                            h("strong", null, "Process State: "),
                            h("span", { style: { color: isRunning ? "var(--success)" : "var(--danger)", fontWeight: "700" } }, isRunning ? "RUNNING" : "STOPPED")
                        )
                    ),
                    h("div", { className: "server-card-box endpoint-card-box" },
                        h("div", { className: "endpoint-header" },
                            h("strong", null, "Live Endpoint:"),
                            currentSubServer && currentSubServer.isVercelService && h("span", { className: "badge-vercel-service" },
                                h("i", { className: "bi bi-cloud-check", style: { marginRight: "4px" } }),
                                "Vercel Cloud Cluster"
                            )
                        ),
                        h("div", { className: "endpoint-value-wrapper" },
                            isRunning
                                ? h("a", {
                                    href: universalUrl,
                                    target: "_blank",
                                    rel: "noreferrer",
                                    className: "live-endpoint-link",
                                    title: "Open live project application in new tab"
                                },
                                    h("i", { className: "bi bi-globe2 endpoint-icon", style: { marginRight: "6px" } }),
                                    h("span", { className: "endpoint-text" }, universalUrl),
                                    h("i", { className: "bi bi-box-arrow-up-right endpoint-ext-icon", style: { marginLeft: "6px" } })
                                )
                                : h("span", { className: "endpoint-idle" }, "Start server to activate live URL")
                        ),
                        h("div", { className: "server-controls-row" },
                            !isRunning ? h("button", {
                                className: "btn-ctrl start",
                                onClick: () => handleServerAction("start", selectedId)
                            },
                                h("i", { className: "bi bi-play-fill" }),
                                " Start Server"
                            ) : h("button", {
                                className: "btn-ctrl stop",
                                onClick: () => handleServerAction("stop", selectedId)
                            },
                                h("i", { className: "bi bi-stop-fill" }),
                                " Stop Server"
                            ),

                            isRunning && h("button", {
                                className: "btn-restart-server",
                                onClick: () => handleServerAction("restart", selectedId)
                            },
                                h("i", { className: "bi bi-arrow-repeat" }),
                                " Restart Server"
                            )
                        )
                    )
                )
            ),
            h("div", { className: "orchestrator-card" },
                h("div", { className: "console-toolbar" },
                    h("h4", { style: { margin: 0, display: "flex", alignItems: "center", gap: "8px" } },
                        h("i", { className: "bi bi-terminal" }),
                        "Live Process Terminal & Stdout Logs"
                    ),
                    h("div", { className: "console-actions" },
                        h("button", {
                            className: "btn-console",
                            onClick: () => fetchLiveLogs(selectedId)
                        },
                            h("i", { className: "bi bi-arrow-clockwise", style: { marginRight: "4px" } }),
                            "Refresh"
                        ),
                        h("button", {
                            className: "btn-console",
                            onClick: () => handleServerAction("clear-logs", selectedId)
                        },
                            h("i", { className: "bi bi-trash", style: { marginRight: "4px" } }),
                            "Clear Logs"
                        )
                    )
                ),
                h("div", {
                    ref: logBoxRef,
                    className: "console-log-box"
                },
                    logs.length === 0
                        ? "// No active logs yet. Click 'Start Server' or 'Restart Server' to initiate child process..."
                        : logs.join("\n")
                )
            )
        );
    };

    // 9. Tab Content: Interactive Live App Runner (IndexedDB Runtime Sandbox + Mode Switch)
    const renderRunnerTab = () => {
        if (!currentProg) {
            return h("div", { style: { padding: "40px", textAlign: "center", color: "var(--text-secondary)" } }, "Loading interactive live runner...");
        }

        const universalUrl = getUniversalLiveUrl(currentProg);
        const activeLiveUrl = (runnerMode === "experiment" && experimentBlobUrl) ? experimentBlobUrl : universalUrl;
        const iframeWidth = runnerViewport === "mobile" ? "375px" : (runnerViewport === "tablet" ? "768px" : "100%");

        return h("div", { className: "runner-container" },
            h("div", { className: "runner-header" },
                h("div", { className: "runner-mode-switch" },
                    h("button", {
                        className: `runner-mode-btn ${runnerMode === "original" ? "active" : ""}`,
                        onClick: () => setRunnerMode("original"),
                        title: "View original, untouched code output"
                    },
                        h("i", { className: "bi bi-globe" }),
                        h("span", null, " Original Live App")
                    ),
                    h("button", {
                        className: `runner-mode-btn ${runnerMode === "experiment" ? "active" : ""}`,
                        onClick: async () => {
                            if (!experimentBlobUrl) {
                                const bUrl = await buildExperimentLiveUrl(selectedId, programDetail);
                                setExperimentBlobUrl(bUrl);
                            }
                            setRunnerMode("experiment");
                        },
                        title: "View output of your edits saved in IndexedDB"
                    },
                        h("i", { className: "bi bi-magic" }),
                        h("span", null, " Experimented Version"),
                        hasExperimentEdits && h("span", { className: "experiment-badge-dot", title: "Active edits in IndexedDB" })
                    )
                ),

                h("div", { className: "viewport-simulators" },
                    h("button", {
                        className: `sim-btn ${runnerViewport === "mobile" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("mobile")
                    },
                        h("i", { className: "bi bi-phone" }),
                        h("span", { className: "desktop-only-inline" }, " Mobile (375px)")
                    ),
                    h("button", {
                        className: `sim-btn ${runnerViewport === "tablet" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("tablet")
                    },
                        h("i", { className: "bi bi-tablet" }),
                        h("span", { className: "desktop-only-inline" }, " Tablet (768px)")
                    ),
                    h("button", {
                        className: `sim-btn ${runnerViewport === "desktop" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("desktop")
                    },
                        h("i", { className: "bi bi-display" }),
                        h("span", { className: "desktop-only-inline" }, " Responsive (100%)")
                    )
                )
            ),

            // Experimented Version Alert & Action Bar
            runnerMode === "experiment" && h("div", { className: "experiment-alert-bar" },
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    h("i", { className: "bi bi-lightbulb-fill", style: { color: "#10b981", fontSize: "1.1rem" } }),
                    h("span", null,
                        hasExperimentEdits
                            ? "Running your custom modifications saved in IndexedDB (Runtime Blob URL)."
                            : "Running live in-memory experiment sandbox. Edit any .html, .css, or .js file in Code Explorer to see updates here."
                    )
                ),
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    experimentBlobUrl && h("a", {
                        href: experimentBlobUrl,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "btn-experiment-action",
                        title: "Open Experimented Sandbox in independent new browser tab"
                    },
                        h("i", { className: "bi bi-box-arrow-up-right" }),
                        h("span", null, " Open in New Tab")
                    ),
                    hasExperimentEdits && h("button", {
                        className: "btn-experiment-reset",
                        onClick: handleResetExperiment,
                        title: "Discard all IndexedDB edits and restore original code"
                    },
                        h("i", { className: "bi bi-arrow-counterclockwise" }),
                        h("span", null, " Reset to Original")
                    )
                )
            ),

            h("div", { className: "runner-iframe-frame" },
                h("iframe", {
                    key: `${currentProg.id}-${runnerMode}-${activeLiveUrl}`,
                    src: activeLiveUrl,
                    title: `Interactive Runner - ${currentProg.title} (${runnerMode})`,
                    className: "runner-iframe",
                    style: { width: iframeWidth },
                    sandbox: "allow-scripts allow-forms allow-same-origin allow-modals"
                })
            )
        );
    };

    // --------------------------------------------------------------------------
    // Main App Shell
    // --------------------------------------------------------------------------
    return h("div", { className: "app-shell" },
        // Top Reading Scroll Progress Bar
        h("div", {
            className: "scroll-progress-bar",
            style: { width: `${scrollPercent}%` }
        }),

        renderHeader(),

        h("div", { className: "main-workspace" },
            // Mobile Backdrop for Drawer Occlusion
            h("div", {
                className: `sidebar-backdrop ${isMobileMenuOpen ? "active" : ""}`,
                onClick: () => setIsMobileMenuOpen(false),
                "aria-hidden": "true"
            }),

            renderSidebar(),

            h("main", {
                ref: viewportRef,
                className: "main-viewport"
            },
                renderBanner(),
                renderTabs(),
                h("div", { className: "tab-content-area" },
                    activeTab === "readme" && renderReadmeTab(),
                    activeTab === "code" && renderCodeTab(),
                    activeTab === "structure" && renderStructureTab(),
                    activeTab === "orchestrator" && renderOrchestratorTab(),
                    activeTab === "runner" && renderRunnerTab()
                )
            )
        )
    );
}

// Mount React Root
const rootElement = document.getElementById("root");
if (rootElement) {
    const root = window.ReactDOM.createRoot(rootElement);
    root.render(h(App));
}
