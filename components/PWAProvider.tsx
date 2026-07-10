'use client';

import { useEffect } from 'react';
import { initOfflineSync } from '@/lib/db/offline-actions';

export function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initOfflineSync();
    }, []);

    return <>{children}</>;
}
