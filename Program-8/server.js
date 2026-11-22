require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Database directory setup
const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const JSON_DB_FILE = path.join(dbDir, "records.json");

// Seed records
const DEFAULT_STUDENTS = [
    { id: 1, roll_no: "23BCA101", name: "Aman Sharma", course: "BCA", semester: 4, email: "aman.sharma@mdu.ac.in", cgpa: 8.75, created_at: new Date().toISOString() },
    { id: 2, roll_no: "23BCA102", name: "Pooja Verma", course: "BCA", semester: 4, email: "pooja.verma@mdu.ac.in", cgpa: 9.10, created_at: new Date().toISOString() },
    { id: 3, roll_no: "23BCA103", name: "Vikram Singh", course: "BCA", semester: 4, email: "vikram.singh@mdu.ac.in", cgpa: 8.20, created_at: new Date().toISOString() },
    { id: 4, roll_no: "23BCA104", name: "Neha Malik", course: "BCA", semester: 4, email: "neha.malik@mdu.ac.in", cgpa: 9.45, created_at: new Date().toISOString() }
];

// Helper database functions (High-speed embedded persistence)
function loadStudents() {
    try {
        if (!fs.existsSync(JSON_DB_FILE)) {
            fs.writeFileSync(JSON_DB_FILE, JSON.stringify(DEFAULT_STUDENTS, null, 2));
            return DEFAULT_STUDENTS;
        }
        const data = fs.readFileSync(JSON_DB_FILE, "utf8");
        return JSON.parse(data || "[]");
    } catch (e) {
        console.error("DB Load Error:", e.message);
        return DEFAULT_STUDENTS;
    }
}

function saveStudents(students) {
    try {
        fs.writeFileSync(JSON_DB_FILE, JSON.stringify(students, null, 2));
    } catch (e) {
        console.error("DB Save Error:", e.message);
    }
}

// 1. READ ALL (GET /api/students)
app.get("/api/students", (req, res) => {
    try {
        const query = (req.query.q || "").toLowerCase().trim();
        let students = loadStudents();

        if (query) {
            students = students.filter(s => 
                s.name.toLowerCase().includes(query) ||
                s.roll_no.toLowerCase().includes(query) ||
                s.course.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query)
            );
        }

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. READ ONE (GET /api/students/:id)
app.get("/api/students/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const students = loadStudents();
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ success: false, message: "Student record not found." });
    }

    res.status(200).json({ success: true, data: student });
});

// 3. CREATE (POST /api/students)
app.post("/api/students", (req, res) => {
    try {
        const { roll_no, name, course, semester, email, cgpa } = req.body;

        if (!roll_no || !name || !course || !semester || !email || cgpa === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields (roll_no, name, course, semester, email, cgpa) are required."
            });
        }

        const students = loadStudents();

        // Check unique constraints
        if (students.some(s => s.roll_no.toLowerCase() === roll_no.trim().toLowerCase())) {
            return res.status(409).json({ success: false, message: "Roll Number already registered." });
        }
        if (students.some(s => s.email.toLowerCase() === email.trim().toLowerCase())) {
            return res.status(409).json({ success: false, message: "Email address already exists." });
        }

        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        const newStudent = {
            id: newId,
            roll_no: roll_no.trim().toUpperCase(),
            name: name.trim(),
            course: course.trim().toUpperCase(),
            semester: parseInt(semester, 10),
            email: email.trim().toLowerCase(),
            cgpa: parseFloat(cgpa),
            created_at: new Date().toISOString()
        };

        students.unshift(newStudent);
        saveStudents(students);

        res.status(201).json({
            success: true,
            message: "Student record created successfully.",
            data: newStudent
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. UPDATE (PUT /api/students/:id)
app.put("/api/students/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { roll_no, name, course, semester, email, cgpa } = req.body;

        const students = loadStudents();
        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Student record not found." });
        }

        // Uniqueness check excluding current record
        if (roll_no && students.some(s => s.id !== id && s.roll_no.toLowerCase() === roll_no.trim().toLowerCase())) {
            return res.status(409).json({ success: false, message: "Roll Number belongs to another student." });
        }
        if (email && students.some(s => s.id !== id && s.email.toLowerCase() === email.trim().toLowerCase())) {
            return res.status(409).json({ success: false, message: "Email belongs to another student." });
        }

        students[index] = {
            ...students[index],
            roll_no: roll_no ? roll_no.trim().toUpperCase() : students[index].roll_no,
            name: name ? name.trim() : students[index].name,
            course: course ? course.trim().toUpperCase() : students[index].course,
            semester: semester ? parseInt(semester, 10) : students[index].semester,
            email: email ? email.trim().toLowerCase() : students[index].email,
            cgpa: cgpa !== undefined ? parseFloat(cgpa) : students[index].cgpa,
            updated_at: new Date().toISOString()
        };

        saveStudents(students);

        res.status(200).json({
            success: true,
            message: "Student record updated successfully.",
            data: students[index]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. DELETE (DELETE /api/students/:id)
app.delete("/api/students/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        let students = loadStudents();
        const exists = students.some(s => s.id === id);

        if (!exists) {
            return res.status(404).json({ success: false, message: "Student record not found." });
        }

        students = students.filter(s => s.id !== id);
        saveStudents(students);

        res.status(200).json({
            success: true,
            message: `Student record ID #${id} deleted successfully.`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Initialize database on launch
loadStudents();

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Program-8 Student CRUD Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
