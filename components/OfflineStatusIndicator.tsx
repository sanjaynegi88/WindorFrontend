'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, Trash2, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    triggerManualSync,
    getSyncStatus,
    getFailedTransactions,
    retryFailedTransaction,
    deleteTransaction,
} from '@/lib/db/sync-engine';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineStatusIndicator() {
    const [status, setStatus] = useState({
        isOnline: typeof window !== 'undefined' ? navigator.onLine : false,
        isSyncing: false,
        pendingCount: 0,
        failedCount: 0,
    });
    const [failedTransactions, setFailedTransactions] = useState<any[]>([]);
    const [showDetails, setShowDetails] = useState(false);

    const updateStatus = async () => {
        try {
            const newStatus = await getSyncStatus();
            setStatus(newStatus);

            if (newStatus.failedCount > 0) {
                const failed = await getFailedTransactions();
                setFailedTransactions(failed);
            } else {
                setFailedTransactions([]);
            }
        } catch (error) {
            console.error('Failed to get sync status:', error);
        }
    };

    useEffect(() => {
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
            const interval = setInterval(updateStatus, 5000);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                clearInterval(interval);
            };
        }
    }, []);

    const handleManualSync = async () => {
        try {
            await triggerManualSync();
            toast.success('Sync process started');
            updateStatus();
        } catch (error) {
            toast.error('Sync failed. Please try again.');
        }
    };

    const handleRetryItem = async (tempId: string) => {
        try {
            await retryFailedTransaction(tempId);
            toast.success('Queued for retry');
            updateStatus();
        } catch (error) {
            toast.error('Failed to queue retry');
        }
    };

    const handleRemoveItem = async (tempId: string) => {
        try {
            await deleteTransaction(tempId);
            toast.success('Submission removed');
            updateStatus();
        } catch (error) {
            toast.error('Failed to remove submission');
        }
    };

    const handleDismissError = async (tempId: string) => {
        try {
            await db.transactions
                .where('tempPropertyId')
                .equals(tempId)
                .modify({ status: 'draft' });
            toast.success('Error dismissed (saved as draft)');
            updateStatus();
        } catch (error) {
            toast.error('Failed to dismiss error');
        }
    };

    // Temporarily hidden by request
    return null;

    // Don't show anything if everything is synced and online
    if (status.isOnline && status.pendingCount === 0 && status.failedCount === 0 && !status.isSyncing) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-10 duration-500">
            <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 w-80 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {status.isOnline ? (
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                        ) : (
                            <div className="size-2 rounded-full bg-red-500" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Sync Module
                        </span>
                    </div>
                    {status.failedCount > 0 && (
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                        >
                            {showDetails ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
                            {showDetails ? "Hide Errors" : `View ${status.failedCount} Errors`}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection Status Icon */}
                    <div className={cn(
                        "shrink-0 size-10 rounded-xl flex items-center justify-center",
                        status.isOnline ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                        {status.isOnline ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
                    </div>

                    {/* Status Content */}
                    <div className="flex-1 min-w-0">
                        {!status.isOnline ? (
                            <div>
                                <p className="text-sm font-bold">Offline Mode</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                    {status.pendingCount > 0
                                        ? `${status.pendingCount} items waiting to sync`
                                        : "Changes saved locally"}
                                </p>
                            </div>
                        ) : status.isSyncing ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="size-3 animate-spin text-primary" />
                                    <p className="text-sm font-bold">Syncing Data...</p>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-progress origin-left" />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-bold">
                                    {status.pendingCount > 0 ? `${status.pendingCount} Pending Items` : "Up to Date"}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                    {status.isOnline ? "Online & Connected" : "Connection Lost"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {status.isOnline && !status.isSyncing && status.pendingCount > 0 && (
                    <Button
                        size="sm"
                        onClick={handleManualSync}
                        className="w-full mt-4 h-9 font-bold text-xs"
                    >
                        <RefreshCw className="size-3 mr-2" />
                        Sync All Now
                    </Button>
                )}

                {/* Error Details Section */}
                <AnimatePresence>
                    {showDetails && failedTransactions.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-border space-y-3 overflow-hidden pr-1"
                        >
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {failedTransactions.map((tx) => (
                                    <motion.div
                                        key={tx.tempPropertyId}
                                        layout
                                        drag="x"
                                        dragConstraints={{ left: -100, right: 0 }}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.x < -80) {
                                                handleDismissError(tx.tempPropertyId);
                                            }
                                        }}
                                        className="bg-red-500/5 rounded-xl p-3 border border-red-500/10 cursor-grab active:cursor-grabbing relative"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-red-600 uppercase break-all">
                                                    Address: {tx.property.address}
                                                </p>
                                                <p className="text-[10px] font-bold text-red-700 leading-tight mt-1">
                                                    {tx.lastSyncError || "Unknown server error"}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7 text-green-600 hover:bg-green-500/10"
                                                    onClick={() => handleRetryItem(tx.tempPropertyId)}
                                                    title="Retry"
                                                >
                                                    <RefreshCw className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7 text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleRemoveItem(tx.tempPropertyId)}
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="absolute right-[-60px] top-0 bottom-0 flex items-center justify-center bg-amber-500 text-white w-[50px] rounded-r-xl">
                                            <X className="size-4" />
                                        </div>
                                        <div className="text-[9px] text-muted-foreground italic text-right mt-1 opacity-50">
                                            Swipe left to dismiss
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.5); }
                    100% { transform: scaleX(1); }
                }
                .animate-progress {
                    animation: progress 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}