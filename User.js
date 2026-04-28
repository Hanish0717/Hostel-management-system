const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Name must be at least 3 characters"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    studentId: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    phone: {
        type: String,
        match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
        sparse: true,
        unique: true
    },
    email: { 
        type: String, 
        unique: true,
        required: true,
        match: [/.+@.+\..+/, "Invalid email format"],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    room: String,
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        default: null
    },
    role: {
        type: String,
        enum: ["student", "admin", "warden"],
        default: "student"
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);