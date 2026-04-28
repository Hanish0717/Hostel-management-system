const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, "Phone must be 10 digits"]
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete after expiry
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    sentCount: {
        type: Number,
        default: 1
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    },
    verificationToken: {
        type: String,
        default: null
    },
    tokenExpiresAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

/**
 * Hash OTP using bcrypt
 */
otpSchema.statics.hashOTP = async function(otp) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp.toString(), salt);
};

/**
 * Compare OTP with hash
 */
otpSchema.methods.compareOTP = async function(otp) {
    return await bcrypt.compare(otp.toString(), this.otpHash);
};

/**
 * Create or update OTP record
 */
otpSchema.statics.createOTP = async function(phone, otp) {
    const otpHash = await this.hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete previous OTP for this phone
    await this.deleteOne({ phone });

    // Create new OTP record
    const otpRecord = await this.create({
        phone,
        otpHash,
        expiresAt,
        attempts: 0,
        isVerified: false,
        sentCount: 1,
        lastSentAt: new Date()
    });

    return otpRecord;
};

/**
 * Check if OTP is valid
 */
otpSchema.methods.isValid = function() {
    return !this.isExpired() && this.attempts < 3;
};

/**
 * Check if OTP is expired
 */
otpSchema.methods.isExpired = function() {
    return Date.now() > this.expiresAt.getTime();
};

/**
 * Verify OTP
 */
otpSchema.methods.verify = async function(otp) {
    // Check if expired
    if (this.isExpired()) {
        return { isValid: false, error: "OTP has expired. Please request a new OTP." };
    }

    // Check attempts
    if (this.attempts >= 3) {
        return { isValid: false, error: "Too many failed attempts. Please request a new OTP." };
    }

    // Increment attempts
    this.attempts++;
    await this.save();

    // Compare OTP
    const isMatch = await this.compareOTP(otp);
    
    if (!isMatch) {
        const remaining = 3 - this.attempts;
        return {
            isValid: false,
            error: `Invalid OTP. ${remaining} attempts remaining.`,
            attempts: this.attempts,
            remaining
        };
    }

    // Mark as verified
    this.isVerified = true;
    await this.save();

    return { isValid: true, error: null };
};

/**
 * Check rate limit (1 OTP per 60 seconds)
 */
otpSchema.methods.canResend = function() {
    const lastSent = this.lastSentAt.getTime();
    const now = Date.now();
    const secondsElapsed = (now - lastSent) / 1000;
    const canSend = secondsElapsed >= 60;

    return {
        canSend,
        secondsRemaining: canSend ? 0 : Math.ceil(60 - secondsElapsed)
    };
};

module.exports = mongoose.model("OTP", otpSchema);
