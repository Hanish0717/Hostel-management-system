require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Safely catch uncaught exceptions (e.g. syntax errors outside express)
process.on("uncaughtException", (err) => {
    console.error("❌ UNCAUGHT EXCEPTION - Server shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});

// Safely catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION - Server shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health Check Routes
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running 🚀" });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/api/auth", require("./routes/auth-otp"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/outing", require("./routes/outing"));
app.use("/api/complaint", require("./routes/complaint"));
app.use("/api/token", require("./routes/foodtoken"));
app.use("/api/rooms", require("./routes/rooms"));

// Global Error Handler Middleware
app.use(errorHandler);

// Initialize DB and Start Server
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });

    // Handle Port Conflicts specifically
    server.on("error", (error) => {
        if (error.syscall !== "listen") throw error;
        if (error.code === "EADDRINUSE") {
            console.error(`❌ ERROR: Port ${PORT} is already in use.`);
            console.error("Please terminate the existing process or use a different port.");
            process.exit(1);
        }
    });
});