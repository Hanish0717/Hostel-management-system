const OTP = require("../models/OTP");
const User = require("../models/User");
const smsService = require("../services/sms");
const { validatePhone, sanitizeInput } = require("../utils/validation");
const crypto = require("crypto");

/**
 * Generate random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        // Validate input
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
                error: "MISSING_PHONE"
            });
        }

        const sanitizedPhone = sanitizeInput(phone)?.trim();

        // Validate phone format
        const phoneValidation = validatePhone(sanitizedPhone);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: phoneValidation.error,
                error: "INVALID_PHONE"
            });
        }

        const cleanPhone = phoneValidation.cleanPhone;

        // Check if phone is already registered
        const existingUser = await User.findOne({ phone: cleanPhone });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This phone number is already registered. Please login or use a different phone.",
                error: "PHONE_ALREADY_REGISTERED"
            });
        }

        // Check rate limiting
        let otpRecord = await OTP.findOne({ phone: cleanPhone });
        if (otpRecord) {
            const rateLimit = otpRecord.canResend();
            if (!rateLimit.canSend) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${rateLimit.secondsRemaining} seconds before requesting a new OTP`,
                    error: "RATE_LIMIT_EXCEEDED",
                    retryAfter: rateLimit.secondsRemaining
                });
            }
        }

        // Generate OTP
        const otp = generateOTP();

        // Create/update OTP record in database
        otpRecord = await OTP.createOTP(cleanPhone, otp);

        // Send SMS
        const smsResult = await smsService.sendOTP(cleanPhone, otp);

        if (!smsResult.success && process.env.SMS_PROVIDER !== 'console') {
            // Only fail for real SMS providers, not console
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again.",
                error: "SMS_SEND_FAILED"
            });
        }

        const responseData = {
            phone: cleanPhone,
            expiresIn: 5,
            nextRetry: 60
        };

        // For development/testing with console provider, include OTP in response
        if (process.env.SMS_PROVIDER === 'console') {
            responseData.otp = otp;
        }

        res.status(200).json({
            success: true,
            message: "OTP sent successfully to your mobile number",
            data: responseData
        });

        console.log(`✅ OTP sent to ${cleanPhone} | OTP Record: ${otpRecord._id}`);

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Error sending OTP",
            error: error.message
        });
    }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // Validate input
        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP are required",
                error: "MISSING_FIELDS"
            });
        }

        const sanitizedPhone = sanitizeInput(phone)?.trim();
        const sanitizedOTP = sanitizeInput(otp)?.toString().trim();

        // Validate phone format
        const phoneValidation = validatePhone(sanitizedPhone);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: phoneValidation.error,
                error: "INVALID_PHONE"
            });
        }

        const cleanPhone = phoneValidation.cleanPhone;

        // Validate OTP format
        if (!/^[0-9]{6}$/.test(sanitizedOTP)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be 6 digits",
                error: "INVALID_OTP_FORMAT"
            });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({ phone: cleanPhone });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this phone. Please request a new OTP.",
                error: "OTP_NOT_FOUND"
            });
        }

        // Verify OTP
        const verification = await otpRecord.verify(sanitizedOTP);

        if (!verification.isValid) {
            return res.status(400).json({
                success: false,
                message: verification.error,
                error: "INVALID_OTP",
                attempts: verification.attempts,
                remaining: verification.remaining
            });
        }

        // Generate verification token (for registration)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        otpRecord.verificationToken = verificationToken;
        otpRecord.tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // Valid for 30 minutes
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now register.",
            data: {
                phone: cleanPhone,
                verified: true,
                verificationToken: verificationToken
            }
        });

        console.log(`✅ OTP verified for ${cleanPhone}`);

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying OTP",
            error: error.message
        });
    }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
exports.resendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        // Validate input
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
                error: "MISSING_PHONE"
            });
        }

        const sanitizedPhone = sanitizeInput(phone)?.trim();

        // Validate phone format
        const phoneValidation = validatePhone(sanitizedPhone);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: phoneValidation.error,
                error: "INVALID_PHONE"
            });
        }

        const cleanPhone = phoneValidation.cleanPhone;

        // Find existing OTP
        let otpRecord = await OTP.findOne({ phone: cleanPhone });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this phone. Please request a new OTP.",
                error: "OTP_NOT_FOUND"
            });
        }

        if (otpRecord.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Phone is already verified. Please proceed to registration.",
                error: "PHONE_ALREADY_VERIFIED"
            });
        }

        // Check rate limiting
        const rateLimit = otpRecord.canResend();
        if (!rateLimit.canSend) {
            return res.status(429).json({
                success: false,
                message: `Please wait ${rateLimit.secondsRemaining} seconds before requesting a new OTP`,
                error: "RATE_LIMIT_EXCEEDED",
                retryAfter: rateLimit.secondsRemaining
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Update OTP record
        otpRecord.otpHash = await OTP.hashOTP(otp);
        otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        otpRecord.attempts = 0;
        otpRecord.isVerified = false;
        otpRecord.sentCount = (otpRecord.sentCount || 1) + 1;
        otpRecord.lastSentAt = new Date();
        await otpRecord.save();

        // Send SMS
        const smsResult = await smsService.sendOTP(cleanPhone, otp);

        if (!smsResult.success && process.env.SMS_PROVIDER !== 'console') {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again.",
                error: "SMS_SEND_FAILED"
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP resent successfully to your mobile number",
            data: {
                phone: cleanPhone,
                expiresIn: 5,
                sentCount: otpRecord.sentCount
            }
        });

        console.log(`✅ OTP resent to ${cleanPhone} (${otpRecord.sentCount} times)`);

    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Error resending OTP",
            error: error.message
        });
    }
};

/**
 * Verify phone before registration
 * Middleware to check if phone is verified
 */
exports.isPhoneVerified = async (req, res, next) => {
    try {
        const { phone, verificationToken } = req.body;

        if (!phone || !verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Phone and verification token are required",
                error: "MISSING_VERIFICATION"
            });
        }

        const sanitizedPhone = sanitizeInput(phone)?.trim();
        const phoneValidation = validatePhone(sanitizedPhone);
        
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: phoneValidation.error,
                error: "INVALID_PHONE"
            });
        }

        const cleanPhone = phoneValidation.cleanPhone;

        // Find OTP record
        const otpRecord = await OTP.findOne({ 
            phone: cleanPhone,
            isVerified: true
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Phone verification required. Please verify your OTP first.",
                error: "PHONE_NOT_VERIFIED"
            });
        }

        // Check verification token
        if (otpRecord.verificationToken !== verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification token",
                error: "INVALID_TOKEN"
            });
        }

        // Check token expiry
        if (Date.now() > otpRecord.tokenExpiresAt?.getTime()) {
            return res.status(400).json({
                success: false,
                message: "Verification token expired. Please verify OTP again.",
                error: "TOKEN_EXPIRED"
            });
        }

        // Attach to request
        req.verifiedPhone = cleanPhone;
        next();

    } catch (error) {
        console.error("Phone Verification Middleware Error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying phone",
            error: error.message
        });
    }
};
