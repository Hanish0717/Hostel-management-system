const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
        
    },
    block: {
        type: String,
        required: true,
        trim: true,
        enum: ["A", "B", "C", "D", "E"],  
        default: "A"
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 2
    },
    occupiedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    amenities: [String],  
    floor: {
        type: Number,
        default: 1
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


roomSchema.virtual("availableSlots").get(function() {
    return this.capacity - this.occupiedCount;
});


roomSchema.virtual("isFull").get(function() {
    return this.occupiedCount >= this.capacity;
});


roomSchema.index({ block: 1, roomNumber: 1 });
roomSchema.index({ occupiedCount: 1 });

module.exports = mongoose.model("Room", roomSchema);
