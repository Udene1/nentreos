'use client';

import { useEffect } from 'react';

export default function SWRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((reg) => console.log('SW registered:', reg))
                    .catch((err) => console.error('SW error:', err));
            });
        }
    }, []);

    return null;
}
