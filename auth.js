const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");


router.post("/register", async (req, res) => {
    try {
        const { fullName, studentId, phone, email, password, role } = req.body;

        const finalRole = role || "student";
        if (finalRole === "student") {
            if (!studentId) return res.status(400).json({ message: "Student ID is required for Students" });
            if (!phone) return res.status(400).json({ message: "Phone number is required for Students" });
        } else if (finalRole === "warden") {
            if (!phone) return res.status(400).json({ message: "Phone number is required for Wardens" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            studentId,
            phone,
            email,
            password: hashedPassword,
            role: role || "student"   
        });

        await user.save();

        res.json({ message: "Registration successful" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not registered" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.fullName,
                role: user.role   
            }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


router.get("/students", async (req, res) => {
    try {
        
        
        const students = await User.find({
            $or: [
                { role: "student" },
                { role: { $exists: false } },
                { role: null }
            ]
        }).select("_id fullName studentId room");
        
        
        students.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/debug/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const studentRoleCount = await User.countDocuments({ role: "student" });
        const adminCount = await User.countDocuments({ role: "admin" });
        const wardenCount = await User.countDocuments({ role: "warden" });
        const noRoleCount = await User.countDocuments({ role: { $exists: false } });
        const nullRoleCount = await User.countDocuments({ role: null });
        
        const totalStudents = await User.countDocuments({
            $or: [
                { role: "student" },
                { role: { $exists: false } },
                { role: null }
            ]
        });

        res.json({
            totalUsers,
            breakdown: {
                studentRole: studentRoleCount,
                admin: adminCount,
                warden: wardenCount,
                noRole: noRoleCount,
                nullRole: nullRoleCount
            },
            totalStudentsAvailable: totalStudents,
            message: totalStudents + " students will be loaded in attendance"
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.post("/fix/set-student-roles", async (req, res) => {
    try {
        
        const result = await User.updateMany(
            {
                $or: [
                    { role: { $exists: false } },
                    { role: null }
                ]
            },
            { $set: { role: "student" } }
        );

        res.json({
            message: "Student roles updated successfully",
            updated: result.modifiedCount,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                acknowledged: result.acknowledged
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;