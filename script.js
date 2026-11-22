// ==========================================================================
// MDU Rohtak BCA Lab Portal - React 18 Single Page Application
// Multi-Server Orchestrator, NLP-Level Search Engine, & Code Explorer
// Touch Gesture & Multi-Device Mobile-Responsive Architecture
// ==========================================================================

const { useState, useEffect, useMemo, useRef, createElement: h } = window.React;

// Theme Definitions with Icons
const THEMES = [
    { id: "dark-pro", name: "Dark Pro", icon: "🌙" },
    { id: "academic-light", name: "Academic Light", icon: "☀️" },
    { id: "cyber-matrix", name: "Cyber Matrix", icon: "⚡" },
    { id: "solarized", name: "Solarized Warm", icon: "📜" }
];

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

// Common English Stop Words to Filter Out
const STOP_WORDS = new Set([
    "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below",
    "to", "from", "up", "down", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "and", "but", "if", "or", "because",
    "as", "until", "while", "of", "it", "this", "that", "these", "those"
]);

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

// Main React App Component
function App() {
    // Application State
    const [programs, setPrograms] = useState([]);
    const [selectedId, setSelectedId] = useState("Program-1");
    const [programDetail, setProgramDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    const [activeTab, setActiveTab] = useState("readme"); // "readme", "code", "structure", "orchestrator", "runner"
    const [activeFile, setActiveFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    
    // Search & Filtering State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all"); // "all", "frontend", "fullstack"
    
    // Server Orchestrator State
    const [subServers, setSubServers] = useState([]);
    const [serverLogs, setServerLogs] = useState({});
    const [serverActionLoading, setServerActionLoading] = useState(false);
    
    // UI Appearance & Accessibility
    const [theme, setTheme] = useState("dark-pro");
    const [scale, setScale] = useState("normal");
    const [runnerViewport, setRunnerViewport] = useState("desktop");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const codeRef = useRef(null);

    // Apply Theme & Scale to HTML Root
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute("data-scale", scale);
    }, [scale]);

    // Touch Swipe Gesture Handling for Mobile & Tablet Sidebar
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

            // Trigger horizontal swipe if movement is greater than vertical scroll
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
                if (deltaX > 0 && touchStartX < 60) {
                    // Swipe Right near left edge: OPEN sidebar
                    setIsMobileMenuOpen(true);
                } else if (deltaX < 0 && isMobileMenuOpen) {
                    // Swipe Left when open: CLOSE sidebar
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

    // Cycle themes when clicking icon-based theme button
    const cycleTheme = () => {
        const currentIndex = THEMES.findIndex(t => t.id === theme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        setTheme(THEMES[nextIndex].id);
    };

    // Current Theme Object
    const currentTheme = useMemo(() => {
        return THEMES.find(t => t.id === theme) || THEMES[0];
    }, [theme]);

    // 1. Fetch Master Programs Catalog via AJAX
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

    // 2. Fetch Server Orchestrator Statuses
    const fetchServers = async () => {
        try {
            const res = await fetch("/api/servers");
            const json = await res.json();
            if (json.success) {
                setSubServers(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch server statuses:", err);
        }
    };

    // Initial Load & Server Polling Interval
    useEffect(() => {
        fetchPrograms();
        fetchServers();

        const timer = setInterval(() => {
            fetchServers();
        }, 3500);

        return () => clearInterval(timer);
    }, []);

    // 3. Fetch Full Details of Selected Program
    useEffect(() => {
        if (!selectedId) return;

        let isMounted = true;
        setLoadingDetail(true);

        fetch(`/api/programs/${selectedId}`)
            .then(res => res.json())
            .then(json => {
                if (isMounted && json.success) {
                    setProgramDetail(json.data);
                    if (json.data.files && json.data.files.length > 0) {
                        const defaultFile = json.data.files.find(f => f.name === "server.js" || f.name === "script.js" || f.name === "index.html") || json.data.files[0];
                        setActiveFile(defaultFile.path);
                    }
                }
            })
            .catch(err => console.error("Detail fetch error:", err))
            .finally(() => {
                if (isMounted) setLoadingDetail(false);
            });

        return () => { isMounted = false; };
    }, [selectedId]);

    // 4. Fetch File Content When Active File Changes
    useEffect(() => {
        if (!selectedId || !activeFile) return;

        setLoadingFile(true);
        fetch(`/api/programs/${selectedId}/file?path=${encodeURIComponent(activeFile)}`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setFileContent(json.content);
                } else {
                    setFileContent(`// Error reading file: ${json.message}`);
                }
            })
            .catch(err => {
                setFileContent(`// Failed to fetch file content: ${err.message}`);
            })
            .finally(() => {
                setLoadingFile(false);
            });
    }, [selectedId, activeFile]);

    // Re-highlight with Prism.js on code / tab change
    useEffect(() => {
        if (window.Prism && (activeTab === "code" || activeTab === "readme")) {
            setTimeout(() => {
                window.Prism.highlightAll();
            }, 50);
        }
    }, [fileContent, activeTab, programDetail]);

    // Sub-Server Actions (Start, Stop, Start All, Stop All)
    const handleServerAction = async (action, progId) => {
        setServerActionLoading(true);
        try {
            let endpoint = "";
            if (action === "start") endpoint = `/api/servers/start/${progId}`;
            else if (action === "stop") endpoint = `/api/servers/stop/${progId}`;
            else if (action === "start-all") endpoint = "/api/servers/start-all";
            else if (action === "stop-all") endpoint = "/api/servers/stop-all";

            const res = await fetch(endpoint, { method: "POST" });
            const json = await res.json();
            
            await fetchServers();
            await fetchPrograms();

            if (progId) {
                const logRes = await fetch(`/api/servers/logs/${progId}`);
                const logJson = await logRes.json();
                if (logJson.success) {
                    setServerLogs(prev => ({ ...prev, [progId]: logJson.logs }));
                }
            }
        } catch (err) {
            alert(`Server Action Failed: ${err.message}`);
        } finally {
            setServerActionLoading(false);
        }
    };

    // Copy Code Helper
    const copyCodeToClipboard = () => {
        if (!fileContent) return;
        navigator.clipboard.writeText(fileContent).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    // NLP Search Filtering & Ranking
    const filteredPrograms = useMemo(() => {
        const queryTokens = processNLPQuery(searchQuery);

        let list = programs.map(p => {
            const relScore = queryTokens.length > 0 ? calculateRelevanceScore(p, queryTokens) : 1;
            return { ...p, relevanceScore: relScore };
        });

        if (filterType !== "all") {
            list = list.filter(p => p.type === filterType);
        }

        if (queryTokens.length > 0) {
            list = list.filter(p => p.relevanceScore > 0);
            list.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else {
            list.sort((a, b) => a.num - b.num);
        }

        return list;
    }, [programs, searchQuery, filterType]);

    // Active program object
    const currentProg = useMemo(() => {
        return programs.find(p => p.id === selectedId) || programs[0] || null;
    }, [programs, selectedId]);

    // Active sub-server info
    const currentSubServer = useMemo(() => {
        return subServers.find(s => s.id === selectedId) || null;
    }, [subServers, selectedId]);

    // Count of running fullstack servers
    const runningServerCount = useMemo(() => {
        return subServers.filter(s => s.status === "running").length;
    }, [subServers]);

    // Determine Live App URL (Universal for ALL 15 Programs!)
    const getUniversalLiveUrl = (prog) => {
        if (!prog) return "#";
        if (prog.hasServer && currentSubServer && currentSubServer.status === "running") {
            return currentSubServer.liveUrl;
        }
        return `/apps/${prog.id}/index.html`;
    };

    // ---------------- Render Sub-Components ----------------

    // 1. Header Bar (Media Responsive & Icon-based on Small Devices)
    const renderHeader = () => {
        return h("header", { className: "app-header" },
            h("div", { className: "header-left" },
                h("button", {
                    className: `mobile-menu-toggle ${isMobileMenuOpen ? "active" : ""}`,
                    onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                    "aria-label": "Toggle Program Navigation Drawer"
                }, "☰"),
                h("span", { className: "brand-badge" },
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

    // 2. Sidebar with NLP Search & Dedicated Mobile Header
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
                        placeholder: "NLP Search: e.g. 'mongo validation', 'oauth login', 'weather'...",
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
            // Actions Cluster: Universal Live URL + Sub-Server Controls
            h("div", { className: "banner-actions-cluster" },
                // Universal Live URL Button (Enabled for ALL 15 Programs!)
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
            }, "💻 Code Explorer"),
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

    // 6. Tab Content: Code Explorer
    const renderCodeTab = () => {
        if (!programDetail || !programDetail.files) return null;

        const ext = activeFile ? activeFile.split(".").pop() : "javascript";
        const prismLang = ext === "js" ? "javascript" : (ext === "html" ? "markup" : ext);

        return h("div", { className: "code-explorer-container" },
            h("div", { className: "code-toolbar" },
                h("div", { className: "file-tabs-scroll" },
                    programDetail.files.map(f => {
                        const isFileActive = f.path === activeFile;
                        return h("button", {
                            key: f.path,
                            className: `file-tab ${isFileActive ? "active" : ""}`,
                            onClick: () => setActiveFile(f.path)
                        }, f.name);
                    })
                ),
                h("div", { className: "code-actions" },
                    h("button", {
                        className: "btn-copy",
                        onClick: copyCodeToClipboard
                    }, copySuccess ? "✓ Copied!" : "📋 Copy Code")
                )
            ),
            h("div", { className: "code-scroll-pane" },
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
            h("p", { style: { fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "20px" } }, "Click any code or configuration file to immediately inspect its syntax-highlighted source."),
            renderTreeNodes(programDetail.tree)
        );
    };

    // 8. Tab Content: Sub-Server Process Orchestrator
    const renderOrchestratorTab = () => {
        const isRunning = currentSubServer && currentSubServer.status === "running";
        const logs = (currentSubServer && currentSubServer.logs) || [];

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
                        h("div", { style: { display: "flex", gap: "8px", marginTop: "10px" } },
                            !isRunning ? h("button", {
                                className: "btn-ctrl start",
                                onClick: () => handleServerAction("start", selectedId)
                            }, "Start Server") : h("button", {
                                className: "btn-ctrl stop",
                                onClick: () => handleServerAction("stop", selectedId)
                            }, "Stop Server")
                        )
                    )
                )
            ),
            h("div", { className: "orchestrator-card" },
                h("h4", { style: { marginBottom: "12px" } }, "📡 Live Process Terminal & Stdout Logs"),
                h("div", { className: "console-log-box" },
                    logs.length === 0
                        ? "// No active logs yet. Click 'Start Server' to initiate child process..."
                        : logs.join("\n")
                )
            )
        );
    };

    // 9. Tab Content: Interactive Live App Runner
    const renderRunnerTab = () => {
        if (!currentProg) return null;

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
                    }, "📱 Tablet (768px)"),
                    h("button", {
                        className: `sim-btn ${runnerViewport === "desktop" ? "active" : ""}`,
                        onClick: () => setRunnerViewport("desktop")
                    }, "🖥️ Responsive (100%)")
                )
            ),
            h("div", { className: "runner-iframe-frame" },
                h("iframe", {
                    key: `${currentProg.id}-${universalUrl}`,
                    src: universalUrl,
                    className: "runner-iframe",
                    style: { width: iframeWidth, height: "100%" },
                    title: `Interactive Live Preview of ${currentProg.title}`
                })
            )
        );
    };

    // Render Master App Shell
    return h("div", { className: "app-shell" },
        renderHeader(),
        // Fullscreen Backdrop for Mobile/Tablet Drawer
        h("div", {
            className: `sidebar-backdrop ${isMobileMenuOpen ? "active" : ""}`,
            onClick: () => setIsMobileMenuOpen(false),
            "aria-label": "Close navigation drawer"
        }),
        h("div", { className: "main-workspace" },
            renderSidebar(),
            h("main", { className: "main-viewport" },
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
if (rootElement && window.ReactDOM) {
    const root = window.ReactDOM.createRoot(rootElement);
    root.render(h(App));
}
