/**
 * Sync Queue Service
 * 
 * Manages the queue of changes to be synced when online.
 * Enables offline-first functionality.
 */

import { db } from './database';
import type { SyncQueueItem, SyncAction, SyncEntityType, SyncStatus } from '../types/sync';
import { createSyncQueueItem } from '../types/sync';

export const syncQueueService = {
  /**
   * Add an item to the sync queue
   */
  async add(
    action: SyncAction,
    entityType: SyncEntityType,
    entityId: string,
    data?: unknown
  ): Promise<string> {
    // Check if there's already a pending item for this entity
    const existing = await db.syncQueue
      .where(['entityType', 'entityId'])
      .equals([entityType, entityId])
      .and(item => item.status === 'pending')
      .first();

    if (existing) {
      // Update existing queue item
      await db.syncQueue.update(existing.id, {
        action: action === 'delete' ? 'delete' : existing.action === 'create' ? 'create' : action,
        data: action !== 'delete' ? data : undefined,
        createdAt: new Date(),
      });
      return existing.id;
    }

    // Create new queue item
    const item = createSyncQueueItem(action, entityType, entityId, data);
    await db.syncQueue.add(item);
    return item.id;
  },

  /**
   * Get all pending sync items
   */
  async getPending(): Promise<SyncQueueItem[]> {
    return db.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('createdAt');
  },

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals('pending').count();
  },

  /**
   * Get all items in the queue
   */
  async getAll(): Promise<SyncQueueItem[]> {
    return db.syncQueue.orderBy('createdAt').toArray();
  },

  /**
   * Update status of a sync item
   */
  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const updates: Partial<SyncQueueItem> = {
      status,
      lastAttemptAt: new Date(),
    };

    if (error) {
      updates.lastError = error;
      const item = await db.syncQueue.get(id);
      if (item) {
        updates.retryCount = item.retryCount + 1;
      }
    }

    await db.syncQueue.update(id, updates);
  },

  /**
   * Mark item as synced and remove from queue
   */
  async markSynced(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  },

  /**
   * Mark item as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.updateStatus(id, 'failed', error);
  },

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0 });
  },

  /**
   * Clear all synced items
   */
  async clearSynced(): Promise<void> {
    await db.syncQueue.where('status').equals('synced').delete();
  },

  /**
   * Clear entire queue
   */
  async clearAll(): Promise<void> {
    await db.syncQueue.clear();
  },

  /**
   * Process sync queue (called when online)
   * In MVP, this just marks items as synced or logs them
   * Real implementation would send to backend
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    const pending = await this.getPending();
    let success = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        // In MVP, we just simulate sync
        // Real implementation would call backend API here
        console.log(`[Sync] Processing: ${item.action} ${item.entityType} ${item.entityId}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mark as synced (remove from queue)
        await this.markSynced(item.id);
        success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.markFailed(item.id, errorMessage);
        failed++;
      }
    }

    return { success, failed };
  },

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    pending: number;
    failed: number;
    total: number;
  }> {
    const all = await db.syncQueue.toArray();
    return {
      pending: all.filter(i => i.status === 'pending').length,
      failed: all.filter(i => i.status === 'failed').length,
      total: all.length,
    };
  },
};

