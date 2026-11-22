// Vercel Serverless Function Entry Point
const path = require("path");
const fs = require("fs");

// Ensure Vercel NFT traces and bundles the static manifest
try {
    const manifestPath = path.join(__dirname, "..", "data", "programs-data.json");
    if (fs.existsSync(manifestPath)) {
        require("../data/programs-data.json");
    }
} catch (e) {}

const app = require("../server.js");

module.exports = app;
