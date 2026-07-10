'use client';

import { useEffect, useState } from 'react';
import { initSyncEngine } from '@/lib/db/sync-engine';
import { initBrandCache, fetchAndCacheBrands } from '@/lib/brand-utils';

/**
 * Initialize the sync engine and brand cache when the app starts
 * This should be included in your main layout or app component
 */
export function SyncEngineProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initializeApp = async () => {
            // Initialize sync engine
            initSyncEngine();
            
            // Initialize brand cache
            await initBrandCache();
            
            // Log initialization
        };
        
        initializeApp();
        
        // Fetch brands when coming online
        const handleOnline = async () => {
            await fetchAndCacheBrands();
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
            return () => window.removeEventListener('online', handleOnline);
        }
    }, []);

    return <>{children}</>;
}

/**
 * Hook to get sync status for UI components
 */
export function useSyncStatus() {
    const [status, setStatus] = useState({
        isOnline: typeof window !== 'undefined' ? navigator.onLine : false,
        pendingCount: 0,
        failedCount: 0,
    });

    useEffect(() => {
        const updateStatus = async () => {
            try {
                const { getSyncStatus } = await import('@/lib/db/sync-engine');
                const newStatus = await getSyncStatus();
                setStatus(newStatus);
            } catch (error) {
                console.error('Failed to get sync status:', error);
            }
        };

        // Update status on mount
        updateStatus();

        // Update status when online/offline
        const handleOnline = () => {
            setStatus(prev => ({ ...prev, isOnline: true }));
            updateStatus();
        };
        
        const handleOffline = () => {
            setStatus(prev => ({ ...prev, isOnline: false }));
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Update status periodically
            const interval = setInterval(updateStatus, 10000);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                clearInterval(interval);
            };
        }
    }, []);

    return status;
}