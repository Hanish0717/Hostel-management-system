const mongoose = require("mongoose");

const foodTokenSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mealType: {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
        required: true
    },
    date: {
        type: Date,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        },
        required: true
    },
    tokenId: {
        type: String,
        unique: true,
        required: true
        
    },
    status: {
        type: String,
        enum: ["valid", "used", "expired"],
        default: "valid"
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    usedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        required: true
        
    },
    remarks: String
}, { timestamps: true });


foodTokenSchema.index({ studentId: 1, mealType: 1, date: 1 }, { unique: true });


foodTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("FoodToken", foodTokenSchema);
