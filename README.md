# BCA Web Application Development Lab
### Maharshi Dayanand University (MDU) Rohtak — Practical Manual Portal

> **Academic Year 2025–26 | BCA Semester V | Web Application Development Lab**  
> An interactive multi-program portal covering all 15 prescribed practicals with live demos, code exploration, and built-in editing.

[![Live Demo](https://img.shields.io/badge/Live-Vercel-black?logo=vercel)](https://mdu-bca-web-application-development.vercel.app)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?logo=github)](https://github.com/Akshat-881236/mdu-bca-web-development-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## Lab Syllabus — All 15 Practicals

| # | Program | Type | Technology Stack |
|---|---------|------|-----------------|
| 1 | Responsive Webpage with Form Input Validation | Frontend | HTML5, CSS3, JavaScript |
| 2 | REST API with Node.js and Express (GET & POST) | Full Stack | Node.js, Express, REST API |
| 3 | Basic Blogging Website (Add, View, Edit Posts) | Frontend | SPA, LocalStorage, CRUD |
| 4 | Dynamically Load Content from External API | Frontend | Fetch API, Async/Await, Promises |
| 5 | Contact Form with Express Backend Server | Full Stack | Express, POST Requests, CORS |
| 6 | Weather App with External API Integration | Frontend | OpenWeatherMap API, Fetch |
| 7 | Infinite Scrolling on a Webpage | Frontend | IntersectionObserver, Lazy Load |
| 8 | CRUD Web App with Database Records | Full Stack | Node.js, Express, MongoDB |
| 9 | Form Validation with MongoDB Storage | Full Stack | Node.js, MongoDB, Mongoose |
| 10 | OAuth 2.0 User Authentication | Full Stack | OAuth2, Passport.js, Sessions |
| 11 | To-Do List Web Application | Frontend | LocalStorage, CRUD, React Hooks |
| 12 | Search Functionality with Filters | Frontend | JavaScript, DOM Manipulation |
| 13 | Responsive Navigation Menu with Dropdowns | Frontend | HTML, CSS, JavaScript |
| 14 | User Preferences with Cookies / LocalStorage | Frontend | Web Storage, Cookies API |
| 15 | Dynamic Quiz Web Application | Frontend | JSON, Timer, Score Tracking |

---

## Portal Architecture

```
mdu-bca-web-development-lab/
├── index.html          ← Single Page Application shell
├── script.js           ← React 18 (CDN) SPA — full portal UI
├── style.css           ← Responsive CSS with 5 themes
├── server.js           ← Express orchestrator — multi-server manager
├── vercel.json         ← Vercel multi-service deployment config
├── data/
│   └── programs-data.json  ← Pre-built static manifest (serverless fallback)
├── Program-1/          ← Practical 1 source
├── Program-2/          ← Practical 2 source (Express server)
│   ├── server.js
│   ├── public/
│   └── README.md
├── ...Program-15/
└── api/
    └── index.js        ← Vercel serverless function entry point
```

---

## Features

- **NLP-Powered Search** — fuzzy/keyword search across program titles, tags, and source code lines
- **Code Explorer** — syntax-highlighted file viewer with Prism.js for all 15 practicals
- **Inbuilt File Editor** — in-browser editing of frontend assets and `.env` files
- **Live App Runner** — interactive iframe runner for frontend programs
- **Sub-Server Orchestrator** — start/stop/monitor Node.js servers per program
- **5 UI Themes** — Cyber Matrix, Dark Pro, Solarized Warm, Ocean Breeze, Light Academic
- **Full Responsiveness** — optimised for phones (360px) through smartboards (2560px+)
- **IndexedDB Persistence** — remembers last-viewed program, theme, and scroll position
- **Deep Linking** — URL params for direct program, tab, and file access (`?prog=Program-2&tab=code&file=server.js`)
- **GitHub Source Links** — every file links to its corresponding GitHub source

---

## Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/Akshat-881236/mdu-bca-web-development-lab.git
cd mdu-bca-web-development-lab

# 2. Install root dependencies
npm install

# 3. Install dependencies for Full Stack programs
cd Program-2 && npm install && cd ..
cd Program-5 && npm install && cd ..
cd Program-8 && npm install && cd ..
cd Program-9 && npm install && cd ..
cd Program-10 && npm install && cd ..

# 4. Configure environment variables for each Full Stack program
# Copy .env.example to .env in each program directory and fill credentials

# 5. Start the portal
npm start
# Server starts at http://localhost:5000
```

---

## Environment Variables

Each full-stack program has its own `.env` file (excluded from Git). Copy `.env.example` → `.env` and fill:

| Program | Required Variables |
|---------|--------------------|
| Program-2 | `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB` |
| Program-5 | `PORT` |
| Program-8 | `MONGODB_URI` |
| Program-9 | `MONGODB_URI` |
| Program-10 | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `CALLBACK_URL` |

---

## Vercel Deployment

This project deploys as a **multi-service Vercel project** using `vercel.json`:

- **`app`** — the main Express portal (serves the SPA + API)
- **`program-two`** — Program-2 Express backend
- **`program-five`** — Program-5 Express backend
- **`program-eight`** — Program-8 Express backend
- **`program-nine`** — Program-9 Express backend
- **`program-ten`** — Program-10 Express backend

```bash
# Deploy via Vercel CLI
npm i -g vercel
vercel --prod
```

Or connect the GitHub repository at [vercel.com/new](https://vercel.com/new) and select **Services** as the Application Preset.

---

## About

**Student:** Akshat Prasad  
**Course:** Bachelor of Computer Applications (BCA)  
**University:** Maharshi Dayanand University (MDU), Rohtak  
**Subject:** Web Application Development Lab  

---

## License

This project is released under the [MIT License](./LICENSE). Academic use encouraged.
