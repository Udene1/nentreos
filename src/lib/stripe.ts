import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
    typescript: true,
});

// Price IDs from environment
export const PRICE_IDS = {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
    lifetime: process.env.STRIPE_PRICE_ID_LIFETIME!,
};

// Subscription types
export type PlanType = 'monthly' | 'lifetime';

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(
    userId: string,
    email: string,
    plan: PlanType,
    successUrl: string,
    cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
        throw new Error(`Invalid plan type: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
        customer_email: email,
        client_reference_id: userId,
        mode: plan === 'lifetime' ? 'payment' : 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId,
            plan,
        },
    });

    return {
        sessionId: session.id,
        url: session.url!,
    };
}

/**
 * Create Stripe customer portal session for managing subscription
 */
export async function createPortalSession(
    customerId: string,
    returnUrl: string
): Promise<{ url: string }> {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return { url: session.url };
}

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateCustomer(
    email: string,
    userId: string,
    existingCustomerId?: string
): Promise<string> {
    // Return existing customer if we have one
    if (existingCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(existingCustomerId);
            if (!customer.deleted) {
                return existingCustomerId;
            }
        } catch (error) {
            // Customer doesn't exist, create new one
        }
    }

    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });

    return customer.id;
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(
    customerId: string
): Promise<{
    active: boolean;
    plan: 'free' | 'monthly' | 'lifetime';
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
}> {
    try {
        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
        });

        if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            return {
                active: true,
                plan: 'monthly',
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
            };
        }

        // Check for lifetime purchases (one-time payments)
        const payments = await stripe.paymentIntents.list({
            customer: customerId,
            limit: 10,
        });

        const lifetimePayment = payments.data.find(
            (p) => p.status === 'succeeded' && p.metadata?.plan === 'lifetime'
        );

        if (lifetimePayment) {
            return {
                active: true,
                plan: 'lifetime',
            };
        }

        return { active: false, plan: 'free' };
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        return { active: false, plan: 'free' };
    }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}

/**
 * Resume cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
}

/**
 * Construct Stripe webhook event
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );
}

/**
 * Get relevant data from Stripe events
 */
export function getEventData(event: Stripe.Event): {
    customerId?: string;
    userId?: string;
    plan?: PlanType;
    subscriptionId?: string;
} {
    const data: Record<string, unknown> = {};

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            data.customerId = session.customer as string;
            data.userId = session.client_reference_id || session.metadata?.userId;
            data.plan = session.metadata?.plan as PlanType;
            data.subscriptionId = session.subscription as string;
            break;
        }
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            data.customerId = subscription.customer as string;
            data.subscriptionId = subscription.id;
            break;
        }
        case 'invoice.paid':
        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            data.customerId = invoice.customer as string;
            data.subscriptionId = invoice.subscription as string;
            break;
        }
    }

    return data;
}
