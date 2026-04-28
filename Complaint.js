const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    name: String,
    room: String,
    issueType: String,
    priority: String,
    description: String,
    status: { type: String, default: "Open" }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);