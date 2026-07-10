'use client';

import { db, PropertyTransaction } from './index';


async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}


export function base64ToFile(base64: string, filename: string, mimeType: string): File {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
}

/**
 * Create a new property transaction (Step 1: Address Form)
 */
export async function createPropertyTransaction(propertyData: {
    address: string;
    city?: string;
    city_id: string;
    state?: string;
    zip: string;
    property_owner_id: string;
    latitude?: number;
    longitude?: number;
}): Promise<string> {
    const tempPropertyId = crypto.randomUUID();
    const now = Date.now();

    const transaction: PropertyTransaction = {
        tempPropertyId,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        property: propertyData,
        installations: [],
        shouldGenerateReport: false,
        retryCount: 0,
    };

    await db.transactions.add(transaction);
    return tempPropertyId;
}

/**
 * Add installation to existing transaction (Step 2: Installation Forms)
 */
export async function addInstallationToTransaction(
    tempPropertyId: string,
    installationType: 'roofing' | 'siding' | 'window' | 'door',
    installationData: any,
    files: File[] | { contractorFiles: File[], ownerFiles: File[] } = []
): Promise<void> {
    // Handle both old and new file formats
    let allFiles: File[] = [];
    if (Array.isArray(files)) {
        // Old format: simple File[] array
        allFiles = files;
    } else {
        // New format: { contractorFiles, ownerFiles }
        allFiles = [...files.contractorFiles, ...files.ownerFiles];
    }

    // Convert files to base64
    const fileData = await Promise.all(
        allFiles.map(async (file) => ({
            name: file.name,
            data: await fileToBase64(file),
            type: file.type,
        }))
    );

    const installation = {
        type: installationType,
        data: installationData,
        files: fileData,
    };

    // Update the transaction
    await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .modify((transaction) => {
            // Remove existing installation of same type (if updating)
            transaction.installations = transaction.installations.filter(
                inst => inst.type !== installationType
            );
            // Add new installation
            transaction.installations.push(installation);
            transaction.updatedAt = Date.now();
        });
}

/**
 * Mark transaction as ready for sync (Step 3: Final Submit)
 */
export async function submitTransactionForSync(
    tempPropertyId: string,
    shouldGenerateReport: boolean = true
): Promise<void> {
    await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .modify({
            status: 'pending',
            shouldGenerateReport,
            updatedAt: Date.now(),
        });
}

/**
 * Get transaction by tempPropertyId
 */
export async function getTransaction(tempPropertyId: string): Promise<PropertyTransaction | undefined> {
    return await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .first();
}

/**
 * Get all pending transactions for sync
 */
export async function getPendingTransactions(): Promise<PropertyTransaction[]> {
    return await db.transactions
        .where('status')
        .equals('pending')
        .toArray();
}

/**
 * Update transaction status during sync
 */
export async function updateTransactionStatus(
    tempPropertyId: string,
    status: PropertyTransaction['status'],
    realPropertyId?: string,
    errorMessage?: string,
    extra?: Partial<PropertyTransaction>
): Promise<void> {
    const transaction = await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .first();

    if (!transaction) return;

    const updates: Partial<PropertyTransaction> = {
        status,
        updatedAt: Date.now(),
        realPropertyId: realPropertyId || transaction.realPropertyId,
        errorMessage,
        ...extra
    };

    if (errorMessage) {
        updates.syncAttempts = (transaction.syncAttempts || 0) + 1;
    }

    await db.transactions.update(transaction.id!, updates);
}

/**
 * Get all failed transactions
 */
export async function getFailedTransactions(): Promise<PropertyTransaction[]> {
    return await db.transactions
        .where('status')
        .equals('failed')
        .toArray();
}

/**
 * Retry a failed transaction
 */
export async function retryFailedTransaction(tempPropertyId: string): Promise<void> {
    await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .modify({
            status: 'pending',
            updatedAt: Date.now(),
        });
}

/**
 * Delete completed transaction
 */
export async function deleteTransaction(tempPropertyId: string): Promise<void> {
    await db.transactions
        .where('tempPropertyId')
        .equals(tempPropertyId)
        .delete();
}

/**
 * Get transaction count by status
 */
export async function getTransactionCounts(): Promise<{
    draft: number;
    pending: number;
    syncing: number;
    failed: number;
}> {
    const [draft, pending, syncing, failed] = await Promise.all([
        db.transactions.where('status').equals('draft').count(),
        db.transactions.where('status').equals('pending').count(),
        db.transactions.where('status').equals('syncing').count(),
        db.transactions.where('status').equals('failed').count(),
    ]);

    return { draft, pending, syncing, failed };
}