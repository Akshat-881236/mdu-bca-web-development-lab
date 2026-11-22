-- Database Schema for Program 8 (CRUD System)
-- Works in both SQLite and MySQL

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    cgpa REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data for Testing & Demonstration
INSERT OR IGNORE INTO students (id, roll_no, name, course, semester, email, cgpa) VALUES
(1, '23BCA101', 'Aman Sharma', 'BCA', 4, 'aman.sharma@mdu.ac.in', 8.75),
(2, '23BCA102', 'Pooja Verma', 'BCA', 4, 'pooja.verma@mdu.ac.in', 9.10),
(3, '23BCA103', 'Vikram Singh', 'BCA', 4, 'vikram.singh@mdu.ac.in', 8.20);
