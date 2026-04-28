const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log request body, excluding passwords for security
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[HIDDEN]';

    console.log(`\n➡️  [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (Object.keys(sanitizedBody).length > 0) {
        console.log(`📦 Payload:`, sanitizedBody);
    }

    // Capture the original send to log the response status
    const originalSend = res.send;
    res.send = function (body) {
        const duration = Date.now() - startTime;
        const statusColor = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`${statusColor} [${res.statusCode}] ${req.method} ${req.originalUrl} - ${duration}ms`);
        originalSend.call(this, body);
    };

    next();
};

module.exports = requestLogger;
