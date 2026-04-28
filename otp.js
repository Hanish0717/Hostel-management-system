

const crypto = require("crypto");


const otpStore = new Map();


function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


function generateSecureOTP() {
    const buffer = crypto.randomBytes(3);
    const number = buffer.readUInt32BE(0) % 1000000;
    return String(number).padStart(6, '0');
}


async function sendOTPEmail(email, otp) {
    try {
        
        
        

        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📧 OTP sent to: ${email}`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Expires in: 5 minutes`);
        console.log(`${'='.repeat(50)}\n`);

        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
}

async function sendOTPSMS(phoneNumber, otp) {
    try {
        // SMS integration would go here (Twilio, AWS SNS, etc.)
        // For now, we'll log it to console for testing
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 OTP sent to phone: ${phoneNumber}`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Expires in: 5 minutes`);
        console.log(`💡 In production, integrate with SMS service (Twilio, AWS SNS, etc.)`);
        console.log(`${'='.repeat(50)}\n`);

        return true;
    } catch (error) {
        console.error("Error sending OTP SMS:", error);
        return false;
    }
}


function storeOTP(email, otp, expiryMinutes = 5) {
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    otpStore.set(email, {
        otp: otp,
        expiresAt: expiresAt,
        attempts: 0,
        createdAt: Date.now()
    });

    console.log(`✅ OTP stored for ${email}, expires at ${new Date(expiresAt).toLocaleString()}`);
}


function verifyOTP(email, otp) {
    
    if (!otpStore.has(email)) {
        return { isValid: false, error: "OTP not found for this email. Please request a new OTP." };
    }

    const otpData = otpStore.get(email);

    
    if (Date.now() > otpData.expiresAt) {
        otpStore.delete(email);
        return { isValid: false, error: "OTP has expired. Please request a new OTP." };
    }

    
    if (otpData.attempts >= 3) {
        otpStore.delete(email);
        return { isValid: false, error: "Too many failed attempts. Please request a new OTP." };
    }

    
    otpData.attempts++;
    otpStore.set(email, otpData);

    
    if (otpData.otp !== otp.toString()) {
        const remaining = 3 - otpData.attempts;
        return { 
            isValid: false, 
            error: `Invalid OTP. ${remaining} attempts remaining.`
        };
    }

    
    otpData.verified = true;
    otpStore.set(email, otpData);
    console.log(`✅ OTP verified successfully for ${email}`);

    return { isValid: true, error: null };
}


function getOTPExpiry(email) {
    if (!otpStore.has(email)) {
        return null;
    }

    const otpData = otpStore.get(email);
    const remainingSeconds = Math.ceil((otpData.expiresAt - Date.now()) / 1000);

    if (remainingSeconds <= 0) {
        otpStore.delete(email);
        return null;
    }

    return {
        expiresAt: otpData.expiresAt,
        remainingSeconds: remainingSeconds,
        remainingMinutes: Math.ceil(remainingSeconds / 60),
        createdAt: otpData.createdAt
    };
}


function hasValidOTP(email) {
    if (!otpStore.has(email)) {
        return false;
    }

    const otpData = otpStore.get(email);

    
    if (Date.now() > otpData.expiresAt) {
        otpStore.delete(email);
        return false;
    }

    return true;
}


function clearOTP(email) {
    otpStore.delete(email);
    console.log(`🗑️  OTP cleared for ${email}`);
}


function clearExpiredOTPs() {
    let clearedCount = 0;
    const now = Date.now();

    for (let [email, otpData] of otpStore) {
        if (now > otpData.expiresAt) {
            otpStore.delete(email);
            clearedCount++;
        }
    }

    if (clearedCount > 0) {
        console.log(`🧹 Cleared ${clearedCount} expired OTPs`);
    }

    return clearedCount;
}


function getOTPStats() {
    let totalOTPs = 0;
    let expiredOTPs = 0;
    let validOTPs = 0;
    const now = Date.now();

    for (let otpData of otpStore.values()) {
        totalOTPs++;
        if (now > otpData.expiresAt) {
            expiredOTPs++;
        } else {
            validOTPs++;
        }
    }

    return {
        totalOTPs: totalOTPs,
        validOTPs: validOTPs,
        expiredOTPs: expiredOTPs,
        storeSize: otpStore.size
    };
}


function initializeCleanupJob() {
    setInterval(() => {
        clearExpiredOTPs();
    }, 5 * 60 * 1000); 

    console.log("🔄 OTP cleanup job initialized (runs every 5 minutes)");
}


async function sendOTPSMS(phone, otp) {
    try {
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 OTP sent via SMS to: ${phone}`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Expires in: 5 minutes`);
        console.log(`${'='.repeat(50)}\n`);

        return true;
    } catch (error) {
        console.error("Error sending OTP SMS:", error);
        return false;
    }
}


initializeCleanupJob();

module.exports = {
    generateOTP,
    generateSecureOTP,
    sendOTPEmail,
    sendOTPSMS,
    storeOTP,
    verifyOTP,
    getOTPExpiry,
    hasValidOTP,
    clearOTP,
    clearExpiredOTPs,
    getOTPStats,
    initializeCleanupJob,
    otpStore 
};
