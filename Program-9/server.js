require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3009;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mdu_admissions_db";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Embedded backup storage if MongoDB is not running locally
const BACKUP_FILE = path.join(__dirname, "admissions_backup.json");
let isMongoConnected = false;

function loadBackup() {
    try {
        if (!fs.existsSync(BACKUP_FILE)) fs.writeFileSync(BACKUP_FILE, "[]");
        return JSON.parse(fs.readFileSync(BACKUP_FILE, "utf8") || "[]");
    } catch (e) {
        return [];
    }
}

function saveBackup(list) {
    try {
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2));
    } catch (e) {
        console.error("Backup save error:", e.message);
    }
}

// Mongoose Admission Schema Definition
const admissionSchema = new mongoose.Schema({
    applicationNo: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    fatherName: {
        type: String,
        required: [true, "Father's name is required"],
        trim: true
    },
    dob: {
        type: Date,
        required: [true, "Date of birth is required"]
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: [true, "Gender selection is required"]
    },
    email: {
        type: String,
        required: [true, "Email address is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    mobile: {
        type: String,
        required: [true, "Mobile number is required"],
        match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"]
    },
    course: {
        type: String,
        enum: ["BCA", "MCA", "B.Tech CSE", "M.Tech CSE", "BBA"],
        required: [true, "Course selection is required"]
    },
    tenthPercentage: {
        type: Number,
        required: [true, "10th Percentage is required"],
        min: [33, "Minimum qualifying percentage is 33%"],
        max: [100, "Percentage cannot exceed 100%"]
    },
    twelfthPercentage: {
        type: Number,
        required: [true, "12th Percentage is required"],
        min: [33, "Minimum qualifying percentage is 33%"],
        max: [100, "Percentage cannot exceed 100%"]
    },
    address: {
        type: String,
        required: [true, "Residential address is required"],
        minlength: [10, "Address must contain at least 10 characters"]
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

let AdmissionModel = null;
try {
    AdmissionModel = mongoose.model("Admission", admissionSchema);
} catch (e) {
    AdmissionModel = mongoose.models.Admission;
}

// Connect to MongoDB with timeout
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 3000
        });
        isMongoConnected = true;
        console.log("✅ Successfully connected to MongoDB database:", MONGODB_URI);
    } catch (err) {
        isMongoConnected = false;
        console.warn("⚠️ MongoDB connection failed. Running in Graceful Local Storage Fallback Mode:", err.message);
    }
}
connectDB();

// 1. GET: Retrieve all submitted admissions
app.get("/api/admissions", async (req, res) => {
    try {
        if (isMongoConnected && AdmissionModel) {
            const list = await AdmissionModel.find().sort({ submittedAt: -1 });
            return res.status(200).json({
                success: true,
                storageEngine: "MongoDB (Mongoose)",
                count: list.length,
                data: list
            });
        } else {
            const backupList = loadBackup();
            return res.status(200).json({
                success: true,
                storageEngine: "Local Fallback (MongoDB Offline)",
                count: backupList.length,
                data: backupList
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. POST: Store new validated admission application
app.post("/api/admissions", async (req, res) => {
    try {
        const {
            fullName, fatherName, dob, gender,
            email, mobile, course, tenthPercentage,
            twelfthPercentage, address
        } = req.body;

        // Generate application reference number
        const applicationNo = "MDU-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);

        const applicationData = {
            applicationNo,
            fullName,
            fatherName,
            dob,
            gender,
            email,
            mobile,
            course,
            tenthPercentage: parseFloat(tenthPercentage),
            twelfthPercentage: parseFloat(twelfthPercentage),
            address,
            submittedAt: new Date()
        };

        if (isMongoConnected && AdmissionModel) {
            // Check email uniqueness
            const existing = await AdmissionModel.findOne({ email: email.toLowerCase().trim() });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "An application with this email address has already been submitted."
                });
            }

            const doc = new AdmissionModel(applicationData);
            await doc.save();

            return res.status(201).json({
                success: true,
                message: "Admission application registered successfully in MongoDB!",
                storageEngine: "MongoDB (Mongoose)",
                applicationNo: doc.applicationNo,
                data: doc
            });
        } else {
            // Fallback storage
            const backupList = loadBackup();
            if (backupList.some(item => item.email.toLowerCase() === email.toLowerCase().trim())) {
                return res.status(409).json({
                    success: false,
                    message: "An application with this email address has already been submitted."
                });
            }

            backupList.unshift(applicationData);
            saveBackup(backupList);

            return res.status(201).json({
                success: true,
                message: "Admission application registered successfully (Saved to Local Storage Fallback)!",
                storageEngine: "Local Fallback",
                applicationNo: applicationData.applicationNo,
                data: applicationData
            });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Program-9 Admission Server running at http://localhost:${PORT}`);
});
