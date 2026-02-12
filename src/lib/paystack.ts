import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

export const paystack = axios.create({
    baseURL: PAYSTACK_API_URL,
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

export interface PaystackTransactionResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

/**
 * Initialize a Paystack transaction
 */
export async function initializeTransaction({
    email,
    amount,
    plan,
    metadata,
    callback_url,
}: {
    email: string;
    amount: number; // In Major unit (e.g. 2999)
    plan?: string;
    metadata?: any;
    callback_url?: string;
}): Promise<PaystackTransactionResponse> {
    const response = await paystack.post('/transaction/initialize', {
        email,
        amount: amount * 100, // Paystack expects Kobo (amount * 100)
        plan,
        metadata,
        callback_url,
    });

    return response.data;
}

/**
 * Verify a Paystack transaction
 */
export async function verifyTransaction(reference: string) {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data;
}

/**
 * Cancel a Paystack subscription
 */
export async function cancelSubscription(subscriptionCode: string, emailToken: string) {
    const response = await paystack.post('/subscription/disable', {
        code: subscriptionCode,
        token: emailToken,
    });
    return response.data;
}

/**
 * Fetch subscription details
 */
export async function fetchSubscription(subscriptionCode: string) {
    const response = await paystack.get(`/subscription/${subscriptionCode}`);
    return response.data;
}
