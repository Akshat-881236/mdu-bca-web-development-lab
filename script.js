// ==========================================================================
// MDU Rohtak BCA Web Application Development Lab Portal
// Full-Stack React 18 Single Page Application
// Multi-Server Orchestrator, Line-by-Line Code Search, Inbuilt Code Editor,
// IndexedDB & Cookie Persistence, Deep-Linking & Creator Ecosystem Integration
// ==========================================================================

const { useState, useEffect, useMemo, useRef, createElement: h } = window.React;

// Theme Definitions with Icons
const THEMES = [
    { id: "dark-pro", name: "Dark Pro", icon: "🌙" },
    { id: "academic-light", name: "Academic Light", icon: "☀️" },
    { id: "cyber-matrix", name: "Cyber Matrix", icon: "⚡" },
    { id: "solarized", name: "Solarized Warm", icon: "📜" }
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
    
    // Inbuilt Code Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [editorMessage, setEditorMessage] = useState(null);

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

                    // Resilient Fallback 2: If files or readme still missing, load from /data/programs-data.json
                    if (!data.readme || !data.files || data.files.length === 0) {
                        try {
                            const manifestRes = await fetch("/data/programs-data.json");
                            if (manifestRes.ok) {
                                const manifest = await manifestRes.json();
                                if (manifest[selectedId]) {
                                    if (!data.readme && manifest[selectedId].readme) data.readme = manifest[selectedId].readme;
                                    if ((!data.files || data.files.length === 0) && manifest[selectedId].files) data.files = manifest[selectedId].files;
                                    if ((!data.tree || data.tree.length === 0) && manifest[selectedId].tree) data.tree = manifest[selectedId].tree;
                                }
                            }
                        } catch (e) {}
                    }

                    setProgramDetail(data);
                    if (data.files && data.files.length > 0) {
                        // Keep current active file if it belongs to this program, else pick default
                        const exists = activeFile && data.files.some(f => f.path === activeFile);
                        if (!exists) {
                            const defaultFile = data.files.find(f => f.name === "server.js" || f.name === "script.js" || f.name === "index.html") || data.files[0];
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

        // Local Development: Point directly to sub-server port
        if (isLocal && prog.hasServer && prog.port) {
            return `http://localhost:${prog.port}`;
        }

        // Production / Vercel: If bound to remote service, use bound URL
        if (currentSubServer && currentSubServer.liveUrl && !currentSubServer.liveUrl.includes("localhost")) {
            return currentSubServer.liveUrl;
        }

        // Production / Vercel: Point to web app interface on current host
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

    // Save File Changes via Inbuilt Code Editor
    const handleSaveFile = async (andRestart = false) => {
        if (!selectedId || !activeFile) return;
        setIsSaving(true);
        setEditorMessage(null);

        try {
            const saveRes = await fetch(`/api/programs/${selectedId}/file`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: activeFile, content: editContent })
            });
            const saveJson = await saveRes.json();

            if (!saveJson.success) {
                throw new Error(saveJson.message || "Failed to save file.");
            }

            setFileContent(editContent);
            setEditorMessage({ type: "success", text: `✓ ${saveJson.message}` });

            if (andRestart && currentProg && currentProg.hasServer) {
                setEditorMessage({ type: "info", text: "Restarting sub-server with updated configuration..." });
                const restartRes = await fetch(`/api/servers/restart/${selectedId}`, { method: "POST" });
                const restartJson = await restartRes.json();
                await fetchServers();
                await fetchLiveLogs(selectedId);
                setActiveTab("orchestrator");
                setEditorMessage({ type: "success", text: "✓ Saved & Server restarted successfully!" });
            }
        } catch (err) {
            setEditorMessage({ type: "error", text: `Error: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
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

    // 1. Top Header with Creator Ecosystem Backlinks
    const renderHeader = () => {
        return h("header", { className: "app-header" },
            h("div", { className: "header-left" },
                h("button", {
                    className: "mobile-menu-toggle mobile-only",
                    onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                    "aria-label": "Toggle navigation drawer"
                }, "☰"),
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
                    THEMES.map(t => h("option", { key: t.id, value: t.id }, `${t.icon} ${t.name}`))
                ),

                // Mobile/Tablet Icon-Only Theme Button (Shown on < 1024px)
                h("button", {
                    className: "header-icon-btn mobile-only theme-btn",
                    onClick: cycleTheme,
                    title: `Theme: ${currentTheme.name}. Tap to cycle theme.`
                }, currentTheme.icon),

                // Desktop Scale/Smartboard Button (Shown on >= 1024px)
                h("button", {
                    className: `scale-toggle desktop-only ${scale === "smartboard" ? "active" : ""}`,
                    onClick: () => setScale(scale === "normal" ? "smartboard" : "normal"),
                    title: "Toggle Presentation / Smartboard Large Font Mode"
                }, scale === "normal" ? "🖥️ Smartboard View" : "💻 Standard View"),

                // Mobile/Tablet Icon-Only Smartboard Toggle (Shown on < 1024px)
                h("button", {
                    className: `header-icon-btn mobile-only scale-icon-btn ${scale === "smartboard" ? "active" : ""}`,
                    onClick: () => setScale(scale === "normal" ? "smartboard" : "normal"),
                    title: "Toggle Smartboard / Presentation Mode"
                }, "🖥️")
            )
        );
    };

    // 2. Sidebar with NLP Search, Code Search Results & Program List
    const renderSidebar = () => {
        const queryTokens = processNLPQuery(searchQuery);

        return h("aside", { className: `sidebar ${isMobileMenuOpen ? "open" : ""}` },
            // Mobile-Only Drawer Header with Explicit Close Button
            h("div", { className: "mobile-drawer-header mobile-only" },
                h("div", { className: "drawer-title" }, "🎓 Lab Manual Practicals (15)"),
                h("button", {
                    className: "drawer-close-btn",
                    onClick: () => setIsMobileMenuOpen(false),
                    "aria-label": "Close navigation drawer"
                }, "✕")
            ),
            h("div", { className: "search-container" },
                h("div", { className: "search-input-wrapper" },
                    h("span", { className: "search-icon-symbol" }, "🔍"),
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
                    h("span", null, `🧠 NLP Expanded: [${queryTokens.slice(0, 4).join(", ")}${queryTokens.length > 4 ? "..." : ""}]`)
                )
            ),

            // Line-by-Line Code Search Results Panel
            codeSearchResults.length > 0 && h("div", { className: "code-search-pane" },
                h("div", { className: "code-search-header" },
                    h("span", null, `⚡ Code Line Matches (${codeSearchResults.length})`),
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

        return h("div", { className: "prog-banner" },
            h("div", { className: "prog-banner-left" },
                h("h2", null, `Practical ${currentProg.num}: ${currentProg.title}`),
                h("p", { className: "prog-syllabus-text" }, currentProg.syllabus)
            ),
            h("div", { className: "banner-actions-cluster" },
                // Universal Live URL Button (Enabled for ALL 15 Programs)
                h("a", {
                    href: universalUrl,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "live-url-link prominent",
                    title: `Open ${currentProg.title} live in a new browser tab`
                },
                    h("span", { className: "live-url-icon" }, "🌐"),
                    h("span", null, "Open Live URL ↗")
                ),

                // Server Controller for Full-Stack Programs
                currentProg.hasServer && h("div", { className: "server-control-panel" },
                    h("span", {
                        className: `server-status-badge ${isRunning ? "running" : "stopped"}`
                    }, isRunning ? `● Port ${currentProg.port} Online` : "○ Server Offline"),
                    !isRunning ? h("button", {
                        className: "btn-ctrl start",
                        disabled: serverActionLoading,
                        onClick: () => handleServerAction("start", currentProg.id)
                    }, serverActionLoading ? "Starting..." : "▶ Start Server") : h("button", {
                        className: "btn-ctrl stop",
                        disabled: serverActionLoading,
                        onClick: () => handleServerAction("stop", currentProg.id)
                    }, serverActionLoading ? "Stopping..." : "⏹ Stop Server")
                )
            )
        );
    };

    // 4. Tab Navigation
    const renderTabs = () => {
        return h("div", { className: "tab-navbar" },
            h("button", {
                className: `tab-btn ${activeTab === "readme" ? "active" : ""}`,
                onClick: () => setActiveTab("readme")
            }, "📖 Lab Manual Readme & Theory"),
            h("button", {
                className: `tab-btn ${activeTab === "code" ? "active" : ""}`,
                onClick: () => setActiveTab("code")
            }, "💻 Code Explorer & Inbuilt Editor"),
            h("button", {
                className: `tab-btn ${activeTab === "structure" ? "active" : ""}`,
                onClick: () => setActiveTab("structure")
            }, "📁 Folder Structure"),
            currentProg && currentProg.hasServer && h("button", {
                className: `tab-btn ${activeTab === "orchestrator" ? "active" : ""}`,
                onClick: () => setActiveTab("orchestrator")
            }, "⚡ Sub-Server Process Logs"),
            h("button", {
                className: `tab-btn ${activeTab === "runner" ? "active" : ""}`,
                onClick: () => setActiveTab("runner")
            }, "🚀 Interactive Live App Runner")
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

        const ext = activeFile ? activeFile.split(".").pop() : "javascript";
        const prismLang = ext === "js" ? "javascript" : (ext === "html" ? "markup" : ext);

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
                        }, f.name);
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
                        h("span", { className: "btn-icon" }, "🐙"),
                        h("span", { className: "desktop-only-inline" }, " View on GitHub ↗")
                    ),

                    // Inbuilt Editor Toggle Button (Only for Editable Frontend / .env Files)
                    isCurrentFileEditable ? h("button", {
                        className: `btn-ctrl ${isEditing ? "stop" : "start"}`,
                        onClick: () => setIsEditing(!isEditing),
                        title: isEditing ? "Switch back to Syntax Highlighted View" : "Edit this file in browser"
                    },
                        h("span", { className: "btn-icon" }, isEditing ? "👁️" : "✏️"),
                        h("span", { className: "desktop-only-inline" }, isEditing ? " View Code" : " Edit File")
                    ) : h("span", {
                        className: "editor-badge readonly",
                        title: "Protected file: Only Frontend files and .env are editable"
                    },
                        h("span", { className: "btn-icon" }, "🔒"),
                        h("span", { className: "desktop-only-inline" }, " Read Only")
                    ),

                    // Copy Code
                    h("button", {
                        className: "btn-copy",
                        onClick: copyCodeToClipboard,
                        title: copySuccess ? "Copied to clipboard!" : "Copy code"
                    },
                        h("span", { className: "btn-icon" }, copySuccess ? "✓" : "📋"),
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
                        onClick: () => handleSaveFile(false),
                        title: "Save changes to file"
                    },
                        h("span", { className: "btn-icon" }, isSaving ? "⏳" : "💾"),
                        h("span", { className: "desktop-only-inline" }, isSaving ? " Saving..." : " Save")
                    ),

                    currentProg && currentProg.hasServer && h("button", {
                        className: "btn-restart-server",
                        disabled: isSaving,
                        onClick: () => handleSaveFile(true),
                        title: "Save changes and immediately restart Node.js server with new configuration"
                    },
                        h("span", { className: "btn-icon" }, isSaving ? "⏳" : "⚡"),
                        h("span", { className: "desktop-only-inline" }, isSaving ? " Saving..." : " Save & Restart")
                    ),

                    h("button", {
                        className: "btn-console",
                        onClick: () => setEditContent(fileContent),
                        title: "Reset file content"
                    },
                        h("span", { className: "btn-icon" }, "↺"),
                        h("span", { className: "desktop-only-inline" }, " Reset")
                    ),

                    h("button", {
                        className: "btn-console",
                        onClick: () => setIsEditing(false),
                        title: "Close Editor"
                    },
                        h("span", { className: "btn-icon" }, "✕"),
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

    // 7. Tab Content: Folder Structure Tree Viewer
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
                            h("span", null, isDir ? "📁" : (node.ext === ".js" ? "⚡" : (node.ext === ".html" ? "🌐" : (node.ext === ".css" ? "🎨" : "📄")))),
                            h("span", { style: { fontWeight: isDir ? "700" : "400" } }, node.name),
                            !isDir && h("span", { style: { fontSize: "0.75rem", color: "var(--text-muted)" } }, `(${Math.round(node.size / 1024 * 10) / 10} KB)`)
                        ),
                        isDir && node.children && renderTreeNodes(node.children)
                    );
                })
            );
        };

        return h("div", { className: "folder-explorer-card" },
            h("h3", { style: { marginBottom: "16px", color: "var(--primary)" } }, `📂 Project Directory Hierarchy: ${selectedId}`),
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
        const logs = (serverLogs[selectedId] && serverLogs[selectedId].length > 0)
            ? serverLogs[selectedId]
            : ((currentSubServer && currentSubServer.logs && currentSubServer.logs.length > 0) ? currentSubServer.logs : []);

        return h("div", { className: "orchestrator-view" },
            h("div", { className: "orchestrator-card" },
                h("h3", null, `⚡ Process Orchestration Dashboard: ${selectedId}`),
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
                    h("div", { className: "server-card-box" },
                        h("strong", null, "Live Endpoint:"),
                        isRunning
                            ? h("a", { href: currentSubServer.liveUrl, target: "_blank", rel: "noreferrer", className: "live-url-link" }, `${currentSubServer.liveUrl} ↗`)
                            : h("span", { style: { color: "var(--text-muted)" } }, "Start server to activate live URL"),
                        h("div", { style: { display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" } },
                            !isRunning ? h("button", {
                                className: "btn-ctrl start",
                                onClick: () => handleServerAction("start", selectedId)
                            }, "▶ Start Server") : h("button", {
                                className: "btn-ctrl stop",
                                onClick: () => handleServerAction("stop", selectedId)
                            }, "⏹ Stop Server"),

                            isRunning && h("button", {
                                className: "btn-restart-server",
                                onClick: () => handleServerAction("restart", selectedId)
                            }, "⚡ Restart Server")
                        )
                    )
                )
            ),
            h("div", { className: "orchestrator-card" },
                h("div", { className: "console-toolbar" },
                    h("h4", { style: { margin: 0 } }, "📡 Live Process Terminal & Stdout Logs"),
                    h("div", { className: "console-actions" },
                        h("button", {
                            className: "btn-console",
                            onClick: () => fetchLiveLogs(selectedId)
                        }, "🔄 Refresh"),
                        h("button", {
                            className: "btn-console",
                            onClick: () => handleServerAction("clear-logs", selectedId)
                        }, "🗑 Clear Logs")
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

    // 9. Tab Content: Interactive Live App Runner
    const renderRunnerTab = () => {
        if (!currentProg) {
            return h("div", { style: { padding: "40px", textAlign: "center", color: "var(--text-secondary)" } }, "Loading interactive live runner...");
        }

        const universalUrl = getUniversalLiveUrl(currentProg);
        const iframeWidth = runnerViewport === "mobile" ? "375px" : (runnerViewport === "tablet" ? "768px" : "100%");

        return h("div", { className: "runner-container" },
            h("div", { className: "runner-header" },
                h("div", { className: "runner-target-info" },
                    h("span", null, "Target: "),
                    h("a", {
                        href: universalUrl,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "runner-target-link"
                    }, universalUrl, " ↗")
                ),
                h("div", { className: "viewport-simulators" },
                    h("button", {
                        className: `sim-btn ${runnerViewport === "mobile" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("mobile")
                    }, "📱 Mobile (375px)"),
                    h("button", {
                        className: `sim-btn ${runnerViewport === "tablet" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("tablet")
                    }, "📟 Tablet (768px)"),
                    h("button", {
                        className: `sim-btn ${runnerViewport === "desktop" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("desktop")
                    }, "💻 Responsive (100%)")
                )
            ),
            h("div", { className: "runner-iframe-frame" },
                h("iframe", {
                    key: `${currentProg.id}-${universalUrl}`,
                    src: universalUrl,
                    title: `Interactive Runner - ${currentProg.title}`,
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
