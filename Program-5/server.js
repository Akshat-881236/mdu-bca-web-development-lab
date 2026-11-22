require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_FILE = path.join(__dirname, "submissions.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Helper function to read persistent submissions
function getSubmissions() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data || "[]");
    } catch (err) {
        console.error("Error reading submissions:", err.message);
        return [];
    }
}

// Helper function to save submissions
function saveSubmissions(submissions) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
    } catch (err) {
        console.error("Error saving submissions:", err.message);
    }
}

// GET: Retrieve recent contact submissions
app.get("/api/contact/submissions", (req, res) => {
    const list = getSubmissions();
    res.status(200).json({
        success: true,
        count: list.length,
        data: list
    });
});

// POST: Process incoming contact form submission
app.post("/api/contact", (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Server-side Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and message are required fields."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 3 characters."
            });
        }

        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: "Message must be at least 10 characters long."
            });
        }

        // New Submission Record
        const newRecord = {
            id: "INQ-" + Date.now().toString(36).toUpperCase(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : "N/A",
            subject: subject ? subject.trim() : "General Inquiry",
            message: message.trim(),
            createdAt: new Date().toISOString()
        };

        const currentList = getSubmissions();
        currentList.unshift(newRecord);
        saveSubmissions(currentList);

        console.log(`[Contact Form] New submission received: ${newRecord.id} from ${newRecord.email}`);

        res.status(201).json({
            success: true,
            message: "Thank you! Your inquiry has been successfully transmitted to the server.",
            referenceId: newRecord.id,
            timestamp: newRecord.createdAt
        });
    } catch (error) {
        console.error("Contact API Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error while processing your submission."
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Program-5 Contact Server running at http://localhost:${PORT}`);
});
