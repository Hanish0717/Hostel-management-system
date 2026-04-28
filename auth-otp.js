
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
    validateEmail,
    validatePassword,
    validatePhone,
    validateFullName,
    validateRegistrationData,
    validateLoginData,
    sanitizeInput
} = require("../utils/validation");
const {
    sendOTP,
    verifyOTP,
    resendOTP,
    isPhoneVerified
} = require("../controllers/otpController");



/**
 * PHONE-FIRST OTP FLOW
 */

// Step 1: Send OTP to phone number
router.post("/send-otp", sendOTP);

// Step 1b: Resend OTP (with rate limiting)
router.post("/resend-otp", resendOTP);

// Step 2: Verify OTP
router.post("/verify-otp", verifyOTP);

/**
 * REGISTRATION WITH PHONE VERIFICATION
 */
router.post("/register", isPhoneVerified, async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            password, 
            confirmPassword, 
            studentId,
            verificationToken 
        } = req.body;

        // Phone is already verified via middleware (req.verifiedPhone)
        const phone = req.verifiedPhone;

        // Force the role to 'student'
        const finalRole = "student";

        // Validate required fields for student
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
                error: "MISSING_FIELD"
            });
        }

        // Sanitize input
        const sanitizedData = {
            fullName: sanitizeInput(fullName),
            email: sanitizeInput(email)?.toLowerCase(),
            password: password,
            phone: phone,
            studentId: sanitizeInput(studentId)?.toUpperCase()
        };

        // Validate all inputs
        const validation = validateRegistrationData({
            fullName: sanitizedData.fullName,
            email: sanitizedData.email,
            password: sanitizedData.password,
            phone: sanitizedData.phone,
            studentId: sanitizedData.studentId,
            role: finalRole
        });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: "VALIDATION_ERROR",
                details: validation.errors
            });
        }

        // Check password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
                error: "PASSWORD_MISMATCH"
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: sanitizedData.email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered",
                error: "EMAIL_ALREADY_EXISTS"
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone: sanitizedData.phone });
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "This phone number is already registered",
                error: "PHONE_ALREADY_EXISTS"
            });
        }

        // Check if student ID already exists
        if (sanitizedData.studentId) {
            const existingStudent = await User.findOne({ studentId: sanitizedData.studentId });
            if (existingStudent) {
                return res.status(409).json({
                    success: false,
                    message: "This student ID is already registered",
                    error: "STUDENT_ID_ALREADY_EXISTS"
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(sanitizedData.password, salt);

        // Create user
        const newUser = new User({
            fullName: sanitizedData.fullName,
            email: sanitizedData.email,
            password: hashedPassword,
            phone: sanitizedData.phone,
            studentId: sanitizedData.studentId,
            role: finalRole,
            isVerified: true // Phone verified via OTP
        });

        await newUser.save();

        // Clean up OTP record
        const OTP = require("../models/OTP");
        await OTP.deleteOne({ phone: sanitizedData.phone });

        res.status(201).json({
            success: true,
            message: "Registration successful!",
            data: {
                userId: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                registeredAt: newUser.createdAt
            }
        });

        console.log(`✅ New user registered: ${newUser.email}`);

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({
            success: false,
            message: "Error during registration",
            error: error.message
        });
    }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        const validation = validateLoginData({ email, password });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: "VALIDATION_ERROR",
                details: validation.errors
            });
        }

        const sanitizedEmail = sanitizeInput(email)?.toLowerCase();

        // Find user
        const user = await User.findOne({ email: sanitizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                error: "INVALID_CREDENTIALS"
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                error: "INVALID_CREDENTIALS"
            });
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                studentId: user.studentId
            }
        });

        console.log(`✅ User logged in: ${user.email}`);

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message
        });
    }
});

/**
 * GET ALL STUDENTS
 */
router.get("/students", async (req, res) => {
    try {
        const students = await User.find({ role: "student" }).select(
            "fullName email phone studentId room createdAt"
        );

        res.status(200).json({
            success: true,
            message: "Students retrieved successfully",
            data: students
        });
    } catch (error) {
        console.error("Fetch Students Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching students",
            error: error.message
        });
    }
});

module.exports = router;
