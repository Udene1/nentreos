'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

export type UserRole = 'owner' | 'manager' | 'staff';

export function useRole() {
    const [role, setRole] = useState<UserRole>('staff');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('settings')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                const settings = data.settings as any;
                setRole(settings?.role || 'owner'); // Default to owner if not set
            }
            setLoading(false);
        };

        fetchRole();
    }, [supabase]);

    const isOwner = role === 'owner';
    const isManager = role === 'manager' || role === 'owner';
    const isStaff = role === 'staff' || role === 'manager' || role === 'owner';

    return { role, isOwner, isManager, isStaff, loading };
}
