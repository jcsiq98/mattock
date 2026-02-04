import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { syncQueueService } from '../services/syncQueueService';

/**
 * Hook to track online/offline status and sync queue
 */
export function useOnlineStatus() {
  const { isOnline, setIsOnline, pendingSyncCount, setPendingSyncCount } = useAppStore();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const stored = localStorage.getItem('lastSyncedAt');
    return stored ? new Date(stored) : null;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await syncQueueService.getPendingCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, [setPendingSyncCount]);

  // Process sync queue
  const processSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncQueueService.processQueue();
      console.log(`Sync complete: ${result.success} succeeded, ${result.failed} failed`);
      
      // Update last synced time
      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem('lastSyncedAt', now.toISOString());
      
      // Update pending count
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Auto-sync when coming back online
      processSync();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, processSync]);

  // Initial pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Periodic sync check (every 5 minutes when online)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      processSync();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isOnline, processSync]);

  return {
    isOnline,
    pendingSyncCount,
    lastSyncedAt,
    isSyncing,
    processSync,
    updatePendingCount,
  };
}

/**
 * Format last synced time for display
 */
export function formatLastSynced(date: Date | null): string {
  if (!date) return 'Never synced';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

