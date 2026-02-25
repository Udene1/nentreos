'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

export type UserRole = 'owner' | 'manager' | 'staff';

export function useRole() {
    const [role, setRole] = useState<UserRole>('owner'); // Default to owner for now to prevent menu lockout
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRole('staff'); // Nobody logged in
                setLoading(false);
                return;
            }

            // Attempt to get specific role from settings
            const { data, error } = await supabase
                .from('app_settings')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (!error && data?.role) {
                setRole(data.role as UserRole);
            }
            // If error or no data, we stay as 'owner' (the default) to ensure the user sees their pages
            setLoading(false);
        };

        fetchRole();
    }, [supabase]);

    const isOwner = role === 'owner';
    const isManager = role === 'manager' || role === 'owner';
    const isStaff = role === 'staff' || role === 'manager' || role === 'owner';

    return { role, isOwner, isManager, isStaff, loading };
}
