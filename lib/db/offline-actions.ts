// DEPRECATED: This file is replaced by the new transaction-manager system
// All functions here are disabled to prevent conflicts

'use client';

// Legacy interfaces kept for compatibility
export interface OfflineSyncQueue {
    id?: number;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    payload: any;
    timestamp: number;
    type: 'PROPERTY' | 'INSTALLATION' | 'IMAGE';
    installType?: string;
    tempId?: string;
    dependencyId?: string;
}

/**
 * DEPRECATED: Use transaction-manager instead
 */
export async function queueRequest(request: Omit<OfflineSyncQueue, 'id' | 'timestamp'>) {
    console.warn('queueRequest is deprecated. Use transaction-manager instead.');
    return false;
}

/**
 * DEPRECATED: Use sync-engine instead
 */
export async function processSyncQueue() {
    console.warn('processSyncQueue is deprecated. Use sync-engine instead.');
    return;
}

/**
 * DEPRECATED: Use sync-engine instead
 */
export function initOfflineSync() {
    console.warn('initOfflineSync is deprecated. Use sync-engine instead.');
    return;
}
