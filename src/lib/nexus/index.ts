/**
 * Nexus SDK - The Integration Layer for NEntreOS
 * 
 * This SDK provides a unified interface for the monolith to interact with
 * Track-It (Inventory), Tax1 (Finance), and ChaseAI (Intelligence).
 * 
 * Phase 1: Local Wrappers & Auditing
 */

import { createClient } from '../supabase-client';

export type IntegrationProvider = 'track-it' | 'tax1' | 'chaseai';

export interface NexusEvent {
    id?: string;
    provider: IntegrationProvider;
    action: string;
    payload: any;
    status: 'pending' | 'synced' | 'failed';
    error?: string;
    createdAt?: string;
}

class NexusSDK {
    private static instance: NexusSDK;
    private supabase = createClient();

    private constructor() { }

    public static getInstance(): NexusSDK {
        if (!NexusSDK.instance) {
            NexusSDK.instance = new NexusSDK();
        }
        return NexusSDK.instance;
    }

    /**
     * Internal audit logger to keep track of every integration attempt.
     */
    private async logEvent(event: Omit<NexusEvent, 'id' | 'createdAt'>) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            await this.supabase.from('audit_integration').insert({
                user_id: user.id,
                provider: event.provider,
                action: event.action,
                payload: event.payload,
                status: event.status,
                error_message: event.error
            });
        } catch (err) {
            console.error('Nexus Audit Logger Failed:', err);
        }
    }

    /**
     * Secure Handshake: Generates a SHA-256 hash with salt for secure communication.
     */
    private async generateSecureHash(data: string): Promise<string> {
        const salt = process.env.AI_SALT || 'default_nexus_salt';
        const msgUint8 = new TextEncoder().encode(data + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * 1. TRACK-IT: Inventory Management
     * Use this when stock levels change in the monolith.
     */
    public async trackInventory(itemId: string, quantityChange: number, reason: string) {
        // Optimistic UI happens in the component. 
        // Here we record the intent to sync with Track-It.
        await this.logEvent({
            provider: 'track-it',
            action: 'inventory_update',
            payload: { itemId, quantityChange, reason },
            status: 'pending'
        });

        // Trigger background sync (non-blocking)
        this.syncPendingEvents('track-it').catch(err => console.error('Immediate sync failed:', err));
    }

    /**
     * 2. TAX1: Financial Compliance
     * Use this when an invoice is finalized or a purchase is recorded.
     */
    public async recordTransaction(type: 'sale' | 'purchase' | 'expense', data: any) {
        await this.logEvent({
            provider: 'tax1',
            action: `record_${type}`,
            payload: data,
            status: 'pending'
        });

        // Trigger background sync for Tax1
        this.syncPendingEvents('tax1').catch(err => console.error('Tax1 sync failed:', err));
    }

    /**
     * 3. INTELLIGENCE: ChaseAI vs ML Microservice
     */
    public async getIntelligence(type: 'invoice_chasing' | 'business_insights', payload: any) {
        if (type === 'invoice_chasing') {
            // ROUTE: NEntre -> ChaseAI Engine (Public API w/ Bearer Token)
            await this.logEvent({
                provider: 'chaseai',
                action: 'reminder_generation',
                payload,
                status: 'pending'
            });

            // Phase 2: Call the real ChaseAI Public API
            try {
                const res = await fetch(`${process.env.CHASEAI_PUBLIC_API_URL || 'https://api.chaseai.com/v1'}/invoices`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.CHASEAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    return await res.json();
                }
            } catch (err) {
                console.error('ChaseAI Public API Call failed:', err);
            }
            return null;
        } else {
            // ROUTE: NEntre -> ML Microservice (Direct with SHA/Salt)
            const secureHash = await this.generateSecureHash(JSON.stringify(payload));

            await this.logEvent({
                provider: 'chaseai', // Listed under chaseai/intelligence for now
                action: 'fetch_insights',
                payload: { ...payload, hash_description: 'SHA-256 Verified' },
                status: 'pending'
            });

            // Example of how we'd call the FastAPI microservice directly
            // return fetch(`${process.env.ML_MICROSERVICE_URL}/insights`, { 
            //    headers: { 'X-Nexus-Auth': secureHash } 
            // });
            return null;
        }
    }

    /**
     * SYNC ENGINE: Processes pending events for external engines.
     * This is designed for "Latency-Zero" operation - the UI never waits for this.
     */
    public async syncPendingEvents(provider?: IntegrationProvider) {
        try {
            // Get current user to propagate identity
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const query = this.supabase
                .from('audit_integration')
                .select('*')
                .eq('status', 'pending');

            if (provider) {
                query.eq('provider', provider);
            }

            const { data: pendingEvents, error } = await query;
            if (error || !pendingEvents || pendingEvents.length === 0) return;

            for (const event of pendingEvents) {
                try {
                    // Inject user identity into the payload before sending
                    const enrichedPayload = {
                        ...event.payload,
                        external_user_id: user.id,
                        user_email: user.email
                    };

                    console.log(`[NEXUS] Syncing ${event.provider} | User: ${user.email}`);

                    if (event.provider === 'chaseai') {
                        await fetch(`${process.env.CHASEAI_PUBLIC_API_URL || 'https://api.chaseai.com/v1'}/sync`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.CHASEAI_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(enrichedPayload)
                        });
                    } else if (event.provider === 'track-it') {
                        // Phase 5: Live Track-It Integration
                        await fetch(`${process.env.TRACKIT_URL || 'https://track-it-olive-delta.vercel.app'}/api/inventory/sync`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.TRACKIT_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(enrichedPayload)
                        });
                    }

                    await this.supabase
                        .from('audit_integration')
                        .update({ status: 'synced', error_message: null })
                        .eq('id', event.id);

                } catch (syncErr: any) {
                    await this.supabase
                        .from('audit_integration')
                        .update({
                            status: 'failed',
                            error_message: `Sync failed: ${syncErr.message}`
                        })
                        .eq('id', event.id);
                }
            }
        } catch (err) {
            console.error('Nexus Background Sync Failed:', err);
        }
    }
}

export const nexus = NexusSDK.getInstance();
