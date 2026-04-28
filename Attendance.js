const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        default: () => new Date().toDateString(),
        required: true
    },
    status: {
        type: String,
        enum: ["present", "absent"],
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    markedAt: {
        type: Date,
        default: Date.now
    },
    remarks: String
}, { timestamps: true });


attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
