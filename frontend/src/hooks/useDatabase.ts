/**
 * Database initialization hook
 * 
 * Ensures the database is initialized before the app renders.
 */

import { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/database';
import { syncQueueService } from '../services/syncQueueService';
import { useAppStore } from '../stores/useAppStore';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPendingSyncCount } = useAppStore();

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        
        // Update sync count
        const pendingCount = await syncQueueService.getPendingCount();
        setPendingSyncCount(pendingCount);
        
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      }
    }

    init();
  }, [setPendingSyncCount]);

  return { isReady, error };
}

