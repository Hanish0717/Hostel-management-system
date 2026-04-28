/**
 * Fast2SMS Provider
 * Requires: FAST2SMS_API_KEY env variable
 */

class Fast2SMSProvider {
    constructor() {
        if (!process.env.FAST2SMS_API_KEY) {
            throw new Error('Fast2SMS API key missing in environment variables');
        }

        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.baseURL = 'https://www.fast2sms.com/dev/bulkV2';
    }

    async send(phone, otp) {
        try {
            const fetch = (await import('node-fetch')).default;
            
            const message = `Your hostel verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
            
            // Format Indian phone number
            const toPhone = phone.startsWith('91') ? phone : `91${phone}`;

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'authorization': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'otp',
                    numbers: toPhone,
                    message: message
                })
            });

            const result = await response.json();

            if (result.return === true) {
                console.log(`✅ SMS sent to ${toPhone} via Fast2SMS`);
                return { success: true, message: "OTP sent successfully" };
            } else {
                throw new Error(result.message || 'Fast2SMS request failed');
            }
        } catch (error) {
            console.error("❌ Fast2SMS Error:", error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = Fast2SMSProvider;
