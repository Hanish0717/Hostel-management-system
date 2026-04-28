const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in environment variables.");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection failure:", err.message);
        process.exit(1); // Stop server if DB fails
    }
};

module.exports = connectDB;
