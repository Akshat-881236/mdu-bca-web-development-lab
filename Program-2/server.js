require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET: Retrieve all users
app.get("/api/users", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT id, name, email, created_at FROM users ORDER BY id DESC"
        );

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("GET error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve users"
        });
    }
});

// POST: Add a new user
app.post("/api/users", async (req, res) => {
    try {
        const { name, email } = req.body;

        // Input validation
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            !name.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must not exceed 100 characters"
            });
        }

        if (
            cleanEmail.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // Insert user into MySQL
        const [result] = await db.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            [cleanName, cleanEmail]
        );

        res.status(201).json({
            success: true,
            message: "User added successfully",
            data: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail
            }
        });
    } catch (error) {
        console.error("POST error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to save user"
        });
    }
});

// Start server after verifying database connection
async function startServer() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL connected successfully");

        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        process.exit(1);
    }
}

startServer();