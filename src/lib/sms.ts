import twilio from 'twilio';

interface SMSOptions {
    to: string;
    message: string;
}

interface SMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

interface TwilioSettings {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
}

/**
 * Get Twilio client
 */
function getTwilioClient(settings?: TwilioSettings) {
    const accountSid = settings?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = settings?.authToken || process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        return null;
    }

    return twilio(accountSid, authToken);
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(
    options: SMSOptions,
    settings?: TwilioSettings
): Promise<SMSResult> {
    const client = getTwilioClient(settings);

    if (!client) {
        return {
            success: false,
            error: 'Twilio not configured. Please add account SID and auth token.',
        };
    }

    const fromNumber = settings?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
        return {
            success: false,
            error: 'No Twilio phone number configured.',
        };
    }

    try {
        // Format phone number (ensure it has country code)
        let toNumber = options.to.replace(/\s+/g, '');
        if (!toNumber.startsWith('+')) {
            // Assume Nigerian number if starts with 0
            if (toNumber.startsWith('0')) {
                toNumber = '+234' + toNumber.slice(1);
            } else {
                toNumber = '+' + toNumber;
            }
        }

        const message = await client.messages.create({
            body: options.message,
            from: fromNumber,
            to: toNumber,
        });

        return {
            success: true,
            messageId: message.sid,
        };
    } catch (error) {
        console.error('SMS send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
    }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
    options: SMSOptions,
    settings?: TwilioSettings
): Promise<SMSResult> {
    const client = getTwilioClient(settings);

    if (!client) {
        return {
            success: false,
            error: 'Twilio not configured. Please add account SID and auth token.',
        };
    }

    const fromNumber = settings?.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!fromNumber) {
        return {
            success: false,
            error: 'No Twilio WhatsApp number configured.',
        };
    }

    try {
        // Format phone number for WhatsApp
        let toNumber = options.to.replace(/\s+/g, '');
        if (!toNumber.startsWith('+')) {
            if (toNumber.startsWith('0')) {
                toNumber = '+234' + toNumber.slice(1);
            } else {
                toNumber = '+' + toNumber;
            }
        }

        // WhatsApp format
        const whatsappTo = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber}`;
        const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

        const message = await client.messages.create({
            body: options.message,
            from: whatsappFrom,
            to: whatsappTo,
        });

        return {
            success: true,
            messageId: message.sid,
        };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
        };
    }
}

/**
 * Test Twilio configuration
 */
export async function testTwilioConfig(settings?: TwilioSettings): Promise<{
    success: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    error?: string;
}> {
    const client = getTwilioClient(settings);

    if (!client) {
        return {
            success: false,
            smsEnabled: false,
            whatsappEnabled: false,
            error: 'Twilio credentials not configured',
        };
    }

    const hasPhoneNumber = !!(settings?.phoneNumber || process.env.TWILIO_PHONE_NUMBER);
    const hasWhatsAppNumber = !!(settings?.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER);

    try {
        // Verify credentials by fetching account info
        await client.api.accounts(settings?.accountSid || process.env.TWILIO_ACCOUNT_SID!).fetch();

        return {
            success: true,
            smsEnabled: hasPhoneNumber,
            whatsappEnabled: hasWhatsAppNumber,
        };
    } catch (error) {
        return {
            success: false,
            smsEnabled: false,
            whatsappEnabled: false,
            error: error instanceof Error ? error.message : 'Invalid Twilio credentials',
        };
    }
}
