/**
 * Console SMS Provider (Development/Testing)
 * Logs OTP to console instead of sending SMS
 */

class ConsoleProvider {
    async send(phone, otp) {
        try {
            const toPhone = phone.startsWith('91') ? phone : `91${phone}`;
            const message = `Your hostel verification code is: ${otp}. Valid for 5 minutes.`;

            console.log(`\n${'='.repeat(60)}`);
            console.log(`📱 SMS SIMULATION - Console Provider`);
            console.log(`📲 To: ${toPhone}`);
            console.log(`📋 Message: ${message}`);
            console.log(`🔐 OTP: ${otp}`);
            console.log(`⏱️  Expires in: 5 minutes`);
            console.log(`${'='.repeat(60)}\n`);

            return { success: true, message: "OTP logged to console (dev mode)" };
        } catch (error) {
            console.error("❌ Console Provider Error:", error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = ConsoleProvider;
