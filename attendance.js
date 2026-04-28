const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");


router.post("/mark", async (req, res) => {
    try {
        const { studentId, status, remarks } = req.body;

        if (!studentId || !status) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!["present", "absent"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const today = new Date().toDateString();

        
        const existing = await Attendance.findOne({
            studentId,
            date: today
        });

        if (existing) {
            
            existing.status = status;
            existing.remarks = remarks;
            existing.markedAt = new Date();
            await existing.save();
            return res.json({ message: "Attendance updated", data: existing });
        }

        
        const attendance = new Attendance({
            studentId,
            status,
            remarks,
            date: today
        });

        await attendance.save();
        res.json({ message: "Attendance marked", data: attendance });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/dashboard", async (req, res) => {
    try {
        const today = new Date().toDateString();

        const totalStudents = await User.countDocuments({ role: "student" });
        const presentCount = await Attendance.countDocuments({ date: today, status: "present" });
        const absentCount = await Attendance.countDocuments({ date: today, status: "absent" });
        const markedCount = presentCount + absentCount;
        const pendingCount = totalStudents - markedCount;

        const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

        res.json({
            totalStudents,
            present: presentCount,
            absent: absentCount,
            pending: pendingCount,
            percentage: parseFloat(percentage),
            markedAt: new Date()
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/weekly", async (req, res) => {
    try {
        const weeklyData = [];
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayAbbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const totalStudents = await User.countDocuments({ role: "student" });
            const presentCount = await Attendance.countDocuments({ date: dateStr, status: "present" });

            const percentage = totalStudents > 0 ? parseFloat(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

            weeklyData.push({
                date: dayAbbr[date.getDay()],
                fullDate: dateStr,
                percentage,
                present: presentCount,
                total: totalStudents
            });
        }

        res.json(weeklyData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/absent", async (req, res) => {
    try {
        const today = new Date().toDateString();

        const absentStudents = await Attendance.find({ date: today, status: "absent" })
            .populate("studentId", "fullName studentId");

        const absentList = absentStudents.map(record => ({
            name: record.studentId.fullName,
            studentId: record.studentId.studentId,
            markedAt: record.markedAt
        }));

        res.json(absentList);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/present", async (req, res) => {
    try {
        const today = new Date().toDateString();

        const presentStudents = await Attendance.find({ date: today, status: "present" })
            .populate("studentId", "fullName studentId");

        const presentList = presentStudents.map(record => ({
            name: record.studentId.fullName,
            studentId: record.studentId.studentId,
            markedAt: record.markedAt
        }));

        res.json(presentList);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/history/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        const records = await Attendance.find({ studentId })
            .sort({ date: -1 })
            .limit(30);

        res.json(records);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await Attendance.findByIdAndDelete(id);
        res.json({ message: "Attendance record deleted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
