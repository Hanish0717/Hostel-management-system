/**
 * SMS Service Factory
 * Pluggable SMS provider interface
 */

const TwilioProvider = require('./twilio');
const Fast2SMSProvider = require('./fast2sms');
const MSG91Provider = require('./msg91');
const ConsoleProvider = require('./console');

class SMSService {
    constructor() {
        const provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();

        try {
            switch (provider) {
                case 'twilio':
                    this.provider = new TwilioProvider();
                    console.log('✅ SMS Provider: Twilio');
                    break;
                case 'fast2sms':
                    this.provider = new Fast2SMSProvider();
                    console.log('✅ SMS Provider: Fast2SMS');
                    break;
                case 'msg91':
                    this.provider = new MSG91Provider();
                    console.log('✅ SMS Provider: MSG91');
                    break;
                case 'console':
                default:
                    this.provider = new ConsoleProvider();
                    console.log('⚠️  SMS Provider: Console (Development Mode)');
                    break;
            }
        } catch (error) {
            console.warn(`⚠️  SMS Provider initialization failed: ${error.message}`);
            console.log('📋 Falling back to Console provider (logs OTP to console)');
            this.provider = new ConsoleProvider();
        }
    }

    async sendOTP(phone, otp) {
        if (!phone || !otp) {
            return { success: false, error: "Phone and OTP are required" };
        }

        // Validate phone format (10 digits)
        if (!/^[0-9]{10}$/.test(phone)) {
            return { success: false, error: "Invalid phone format" };
        }

        return await this.provider.send(phone, otp);
    }
}

// Singleton instance
const smsService = new SMSService();

module.exports = smsService;
