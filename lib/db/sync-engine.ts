'use client';

import { db, PropertyTransaction } from './index';
import {
    getPendingTransactions,
    getFailedTransactions,
    updateTransactionStatus,
    retryFailedTransaction,
    deleteTransaction,
    base64ToFile
} from './transaction-manager';
import { postProperty, postInstallation, uploadInstallationImages, postReport } from '@/lib/actions';
import { toast } from 'sonner';

let isSyncing = false;

/**
 * Main sync engine - processes all pending transactions
 * This is the ONLY place where API calls should happen
 */
export async function syncPendingTransactions(): Promise<void> {
    if (isSyncing || !navigator.onLine) {
        return;
    }

    try {
        isSyncing = true;
        const pendingTransactions = await getPendingTransactions();

        if (pendingTransactions.length === 0) {
            return;
        }

        toast.info(`Syncing ${pendingTransactions.length} property submissions...`);

        let successCount = 0;

        for (const transaction of pendingTransactions) {
            try {
                await syncSingleTransaction(transaction);
                successCount++;
            } catch (error: any) {
                console.error(`Failed to sync transaction ${transaction.tempPropertyId}:`, error);

                const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    'Something went wrong';

                const status = error?.response?.status;
                const isNetworkError = !error?.response;

                if (isNetworkError) {

                    await updateTransactionStatus(
                        transaction.tempPropertyId,
                        'pending',
                        undefined,
                        'Network error - will retry automatically'
                    );

                    return; // 🚨 IMPORTANT
                }

                //  2. CLIENT ERROR (400–499) → DO NOT RETRY
                if (status >= 400 && status < 500) {
                    await updateTransactionStatus(
                        transaction.tempPropertyId,
                        'failed',
                        undefined,
                        errorMessage
                    );

                    toast.error(`Invalid submission: ${errorMessage}`, {
                        description: "Fix the data and resubmit. This will not retry automatically.",
                        duration: 6000
                    });

                    return;
                }

                //  3. SERVER ERROR (500+) → RETRY LIMITED
                if (status >= 500) {
                    const retryCount = transaction.retryCount || 0;

                    if (retryCount < 2) {

                        await updateTransactionStatus(
                            transaction.tempPropertyId,
                            'pending',
                            undefined,
                            `Server error - Retrying... (${retryCount + 1}/2)`,
                            { retryCount: retryCount + 1 }
                        );

                    } else {
                        await updateTransactionStatus(
                            transaction.tempPropertyId,
                            'failed',
                            undefined,
                            'Server error after multiple retries'
                        );

                        toast.error('Server error. Please try again later.', {
                            duration: 6000
                        });
                    }

                    return;
                }

                //  fallback (rare)
                await updateTransactionStatus(
                    transaction.tempPropertyId,
                    'failed',
                    undefined,
                    errorMessage
                );

                toast.error(`Sync failed: ${errorMessage}`);
            }
        }

        if (successCount > 0) {
            toast.success(` Successfully synced ${successCount} property submissions!`);
        }

        if (successCount < pendingTransactions.length && successCount > 0) {
            const failedCount = pendingTransactions.length - successCount;
            toast.error(`${failedCount} submissions failed to sync. Check error messages for details.`);
        } else if (successCount === 0 && pendingTransactions.length > 0) {
            toast.error(`All ${pendingTransactions.length} submissions failed to sync. Check error messages.`);
        }

    } catch (error) {
        console.error('Sync engine error:', error);
        toast.error('Failed to sync offline data');
    } finally {
        isSyncing = false;
    }
}

async function syncSingleTransaction(transaction: PropertyTransaction): Promise<void> {
    const { tempPropertyId, property, installations, shouldGenerateReport } = transaction;

    // Mark as syncing
    await updateTransactionStatus(tempPropertyId, 'syncing');

    try {

        // Transform property data for API - ONLY send what the backend expects
        const apiProperty = {
            address: property.address,
            city_id: property.city_id,
            zip: property.zip,
            property_owner_id: property.property_owner_id,
            latitude: property.latitude,
            longitude: property.longitude
        };


        const propertyResult = await postProperty(apiProperty);
        if (!propertyResult.success) {
            throw new Error(propertyResult.message || 'Property creation failed');
        }
        const realPropertyId = propertyResult.data?.data?.id || propertyResult.data?.id;

        if (!realPropertyId) {
            throw new Error('Property creation failed - no ID returned');
        }

        // Update transaction with real property ID
        await updateTransactionStatus(tempPropertyId, 'syncing', realPropertyId);

        for (const installation of installations) {

            // Transform form data to API format
            const apiData = transformInstallationDataForAPI(installation.type, installation.data);

            // Create installation
            const installationResult = await postInstallation(
                realPropertyId,
                installation.type,
                apiData
            );
            if (!installationResult.success) {
                throw new Error(installationResult.message || `Failed to create ${installation.type} installation`);
            }
            const installationId = installationResult.data?.data?.id || installationResult.data?.id;

            if (installation.files && installation.files.length > 0 && installationId) {

                try {
                    const files = installation.files.map(f =>
                        base64ToFile(f.data, f.name, f.type)
                    );

                    const uploadResult = await uploadInstallationImages(installation.type, installationId, files);
                    if (!uploadResult.success) {
                        console.error(` Failed to upload images for ${installation.type}:`, uploadResult.message);
                    }
                    
                } catch (imageError) {
                    console.error(` Failed to upload images for ${installation.type}:`, imageError);
                }
            } else {
                console.log(` No images to upload for ${installation.type}`);
            }
        }
      
        if (shouldGenerateReport) {
            const reportResult = await postReport(realPropertyId);
            if (!reportResult.success) {
                throw new Error(reportResult.message || 'Failed to generate report');
            }
        }

        // Success - delete the transaction
        await deleteTransaction(tempPropertyId);

    } catch (error) {
        // Re-throw to be handled by caller
        throw error;
    }
}

/**
 * Transform form data to API-expected format
 * This handles the camelCase to snake_case conversion and field mapping
 */
function transformInstallationDataForAPI(type: string, formData: any): any {
    // Base fields that all installations have
    const baseData = {
        description: formData.description,
        install_date: formData.installDate,
        supplier: formData.supplier,
        installer: formData.installer,
        brand: formData.brand,
    };

    // Type-specific transformations
    if (type === 'roofing') {
        return {
            ...baseData,
            style: formData.style,
            color: formData.color,
            material: formData.material,
            impact_resistant: formData.impactResistant,
            class_rating: formData.classRating,
        };
    } else if (type === 'siding') {
        const result: any = {
            ...baseData,
            style: formData.style,
            color: formData.color,
            material: formData.material,
        };

        // Handle elevation data
        if (formData.elevationdata) {
            try {
                result.elevation_data = Array.isArray(formData.elevationdata)
                    ? formData.elevationdata
                    : JSON.parse(formData.elevationdata);
            } catch (e) {
                result.elevation_data = formData.elevationdata;
            }
        }

        return result;
    } else if (type === 'window' || type === 'door') {
        return {
            ...baseData,
            production_line: formData.productionLine,
            order_number: formData.orderNumber,
            component_type: type.toUpperCase(),
        };
    }

    // Fallback - return base data
    return baseData;
}

/**
 * Initialize sync engine with automatic triggers
 */
export function initSyncEngine(): void {
    if (typeof window === 'undefined') return;

    // Sync when coming online
    window.addEventListener('online', () => {
        setTimeout(syncPendingTransactions, 1000);
    });

    // Initial sync if online (delayed to allow app to load)
    if (navigator.onLine) {
        setTimeout(syncPendingTransactions, 3000);
    }

    // Periodic sync every 30 seconds when online
    setInterval(() => {
        if (navigator.onLine) {
            syncPendingTransactions();
        }
    }, 30000);
}

/**
 * Manual sync trigger (for UI buttons)
 */
export async function triggerManualSync(): Promise<void> {
    if (!navigator.onLine) {
        toast.error('Cannot sync while offline');
        return;
    }

    await syncPendingTransactions();
}

export { getFailedTransactions, retryFailedTransaction, deleteTransaction };

/**
 * Get sync status for UI
 */
export async function getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
}> {
    const [pending, failed] = await Promise.all([
        db.transactions.where('status').equals('pending').count(),
        db.transactions.where('status').equals('failed').count(),
    ]);

    return {
        isOnline: typeof window !== 'undefined' ? navigator.onLine : false,
        isSyncing,
        pendingCount: pending,
        failedCount: failed,
    };
}