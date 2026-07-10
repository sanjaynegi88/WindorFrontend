'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getTransactionCounts } from '@/lib/db/transaction-manager';
import { triggerManualSync } from '@/lib/db/sync-engine';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing pending submissions...');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline. Submissions will be saved locally.');
    };

    // Update pending count periodically
    const updateCount = () => {
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending submissions every 5 seconds
    const interval = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const counts = await getTransactionCounts();
      setPendingCount(counts.pending);
    } catch (error) {
      console.error('Failed to get transaction counts:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await triggerManualSync();
      await updatePendingCount();
      toast.success('All submissions synced successfully!');
    } catch (error) {
      toast.error('Failed to sync some submissions. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online with no pending items
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 shadow-lg">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Pending Submissions */}
        {pendingCount > 0 && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <Badge variant="secondary" className="text-xs">
                {pendingCount} pending
              </Badge>
            </div>
          </>
        )}

        {/* Sync Button */}
        {isOnline && pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 px-2 text-xs"
          >
            {isSyncing ? (
              <Upload className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Sync
          </Button>
        )}
      </div>
    </div>
  );
}