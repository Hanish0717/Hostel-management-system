/**
 * MSG91 SMS Provider
 * Requires: MSG91_AUTH_KEY env variable
 */

class MSG91Provider {
    constructor() {
        if (!process.env.MSG91_AUTH_KEY) {
            throw new Error('MSG91 auth key missing in environment variables');
        }

        this.authKey = process.env.MSG91_AUTH_KEY;
        this.baseURL = 'https://api.msg91.com/api/sendhttp.php';
    }

    async send(phone, otp) {
        try {
            const fetch = (await import('node-fetch')).default;
            
            const message = `Your hostel verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
            
            // Format Indian phone number
            const toPhone = phone.startsWith('91') ? phone : `91${phone}`;

            const params = new URLSearchParams({
                authkey: this.authKey,
                mobiles: toPhone,
                message: message,
                sender: 'HOSTEL',
                route: '4',
                unicode: '0',
                country: '0'
            });

            const response = await fetch(`${this.baseURL}?${params}`, {
                method: 'POST'
            });

            const result = await response.text();

            if (result.includes('Success') || result.includes('success')) {
                console.log(`✅ SMS sent to ${toPhone} via MSG91`);
                return { success: true, message: "OTP sent successfully" };
            } else {
                throw new Error(result || 'MSG91 request failed');
            }
        } catch (error) {
            console.error("❌ MSG91 Error:", error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MSG91Provider;
