/**
 * Twilio SMS Provider
 * Requires: TWILIO_SID, TWILIO_AUTH_TOKEN env variables
 */

class TwilioProvider {
    constructor() {
        const twilio = require('twilio');
        
        if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) {
            throw new Error('Twilio credentials missing in environment variables');
        }

        this.client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        this.fromPhone = process.env.TWILIO_PHONE;
    }

    async send(phone, otp) {
        try {
            const message = `Your hostel verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
            
            // Format Indian phone number
            const toPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

            await this.client.messages.create({
                body: message,
                from: this.fromPhone,
                to: toPhone
            });

            console.log(`✅ SMS sent to ${toPhone} via Twilio`);
            return { success: true, message: "OTP sent successfully" };
        } catch (error) {
            console.error("❌ Twilio SMS Error:", error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TwilioProvider;
