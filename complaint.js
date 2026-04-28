const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");


router.post("/", async (req, res) => {
    try {
        console.log("Incoming data:", req.body); 

        const complaint = new Complaint(req.body);

        const saved = await complaint.save(); 

        console.log("Saved to DB:", saved); 

        res.json({ message: "Complaint submitted", data: saved });

    } catch (err) {
        console.error("SAVE ERROR:", err); 
        res.status(500).json({ message: "Error saving complaint" });
    }
});


router.get("/", async (req, res) => {
    try {
        const data = await Complaint.find();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching complaints" });
    }
});


router.put("/:id", async (req, res) => {
    try {
        await Complaint.findByIdAndUpdate(req.params.id, {
            status: req.body.status
        });

        res.json({ message: "Updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating complaint" });
    }
});

module.exports = router;