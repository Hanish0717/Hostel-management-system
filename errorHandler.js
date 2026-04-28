const errorHandler = (err, req, res, next) => {
    console.error(`\n❌ [${new Date().toISOString()}] Global Error Handler Triggered:`);
    console.error(`Route: ${req.method} ${req.originalUrl}`);
    console.error(`Message: ${err.message}`);
    if (process.env.NODE_ENV === "development") {
        console.error(err.stack);
    }
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            error: "VALIDATION_FAILED",
            details: errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate field value entered",
            error: "DUPLICATE_KEY_ERROR"
        });
    }

    // Cast error (e.g. invalid MongoDB ID)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid resource ID: ${err.value}`,
            error: "CAST_ERROR"
        });
    }
    
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

module.exports = errorHandler;
