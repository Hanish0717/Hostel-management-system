const mongoose = require("mongoose");

const outingSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    jntuNumber: String,       
    name: String,             
    year: String,             
    room: String,             
    
    from: Date,               
    to: Date,                 
    reason: String,           
    
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    passId: String,           
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    approvedAt: Date,         
    
    remarks: String           
}, { timestamps: true });


outingSchema.index({ studentId: 1, createdAt: -1 });
outingSchema.index({ status: 1 });

module.exports = mongoose.model("Outing", outingSchema);