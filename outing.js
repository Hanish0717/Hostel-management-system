const express = require("express");
const router = express.Router();
const Outing = require("../models/Outing");
const User = require("../models/User");


router.post("/request", async (req, res) => {
    try {
        const { studentId, jntuNumber, name, year, room, from, to, reason } = req.body;

        if (!studentId || !from || !to || !reason) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate >= toDate) {
            return res.status(400).json({ message: "From time must be before To time" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromDateStart = new Date(fromDate);
        fromDateStart.setHours(0, 0, 0, 0);

        if (fromDateStart < today) {
            return res.status(400).json({ message: "Cannot request for past dates" });
        }

        
        const existing = await Outing.findOne({
            studentId,
            status: "pending"
        });

        if (existing) {
            return res.status(400).json({ message: "You already have a pending outing request" });
        }

        const outing = new Outing({
            studentId,
            jntuNumber,
            name,
            year,
            room,
            from: fromDate,
            to: toDate,
            reason,
            status: "pending"
        });

        const saved = await outing.save();
        await saved.populate("studentId", "fullName email");

        res.json({ 
            message: "Outing request submitted successfully", 
            data: saved 
        });

    } catch (err) {
        console.error("OUTING REQUEST ERROR:", err);
        res.status(500).json({ message: "Error submitting outing request", error: err.message });
    }
});


router.get("/", async (req, res) => {
    try {
        const data = await Outing.find()
            .populate("studentId", "fullName email phone")
            .populate("approvedBy", "fullName")
            .sort({ createdAt: -1 });
        
        res.json(data);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Error fetching outings" });
    }
});


router.get("/pending/list", async (req, res) => {
    try {
        const pending = await Outing.find({ status: "pending" })
            .populate("studentId", "fullName email phone")
            .sort({ createdAt: -1 });

        res.json({
            count: pending.length,
            data: pending
        });
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Error fetching pending outings" });
    }
});


router.get("/student/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        const outings = await Outing.find({ studentId })
            .sort({ createdAt: -1 })
            .limit(10);

        
        const now = new Date();
        const activeOuting = outings.find(o => 
            o.status === "approved" && 
            o.from <= now && 
            now <= o.to
        );

        
        const latestRequest = outings[0] || null;

        res.json({
            latestRequest,
            activeOuting,
            allOutings: outings
        });

    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Error fetching outing status" });
    }
});


router.get("/active/now", async (req, res) => {
    try {
        const now = new Date();

        const activeOutings = await Outing.find({
            status: "approved",
            from: { $lte: now },
            to: { $gte: now }
        })
        .populate("studentId", "fullName email phone")
        .sort({ to: 1 });

        res.json({
            count: activeOutings.length,
            data: activeOutings
        });

    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Error fetching active outings" });
    }
});


router.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedBy, remarks } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        let updateData = {
            status,
            remarks
        };

        
        if (status === "approved") {
            const passId = `OP${Date.now().toString().slice(-6)}`;
            updateData.passId = passId;
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = new Date();
        }

        const updated = await Outing.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate("studentId", "fullName email")
        .populate("approvedBy", "fullName");

        res.json({ 
            message: `Outing ${status} successfully`, 
            data: updated 
        });

    } catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(500).json({ message: "Error updating outing", error: err.message });
    }
});


router.get("/details/:id", async (req, res) => {
    try {
        const outing = await Outing.findById(req.params.id)
            .populate("studentId", "fullName email phone")
            .populate("approvedBy", "fullName");

        if (!outing) {
            return res.status(404).json({ message: "Outing not found" });
        }

        res.json(outing);

    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Error fetching outing details" });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        await Outing.findByIdAndDelete(req.params.id);
        res.json({ message: "Outing deleted successfully" });

    } catch (err) {
        console.error("DELETE ERROR:", err);
        res.status(500).json({ message: "Error deleting outing" });
    }
});

module.exports = router;