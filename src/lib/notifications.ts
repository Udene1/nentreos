import { createClient } from '@/lib/supabase-server';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Create a new notification for a user
 */
export async function createNotification({
    userId,
    title,
    message,
    type = 'info',
    link,
    supabaseClient,
}: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    supabaseClient?: any;
}) {
    try {
        const supabase = (supabaseClient || createClient()) as any;
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link,
            });

        if (error) {
            console.error('Error creating notification:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Notification creation failed:', error);
        return { success: false, error };
    }
}
