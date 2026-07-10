'use client';

import Dexie, { type EntityTable } from 'dexie';

export interface LocalProperty {
    id: string;
    address: string;
    latitude: number;
    longitude: number;
    reportCount: number;
    lastUpdated: number;
}

// Single Transaction Model - Core PWA Pattern
export interface PropertyTransaction {
    id?: number;
    tempPropertyId: string;
    status: 'draft' | 'pending' | 'syncing' | 'failed' | 'completed';
    createdAt: number;
    updatedAt: number;


    property: {
        address: string;
        city?: string;
        city_id: string;
        state?: string;
        zip: string;
        property_owner_id: string;
        latitude?: number;
        longitude?: number;
    };

    // All installations in one array
    installations: Array<{
        type: 'roofing' | 'siding' | 'window' | 'door';
        data: any;
        files: Array<{
            name: string;
            data: string; // base64
            type: string;
        }>;
    }>;

    shouldGenerateReport: boolean;

    // Sync metadata
    realPropertyId?: string;
    syncAttempts?: number;
    retryCount?: number;
    errorMessage?: string;
}

// Legacy queue interface (keep for migration)
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

const db = new Dexie('ProjectWinDB') as Dexie & {
    properties: EntityTable<LocalProperty, 'id'>;
    transactions: EntityTable<PropertyTransaction, 'id'>;
    syncQueue: EntityTable<OfflineSyncQueue, 'id'>; // Keep for backward compatibility
};

// Schema versioning - increment version to force schema update and clear cache
db.version(6).stores({
    properties: 'id, address, lastUpdated',
    transactions: '++id, tempPropertyId, status, createdAt, updatedAt',
    syncQueue: '++id, endpoint, timestamp, type, installType, tempId, dependencyId'
});

// Clear old data on version upgrade
db.version(6).upgrade(async (tx) => {

    await tx.table('syncQueue').clear();

});

// Handle database errors gracefully
db.on('ready', () => {
    console.log('Database initialized successfully');
});

db.on('versionchange', () => {
    console.log('Database schema updated');
});

export { db };
