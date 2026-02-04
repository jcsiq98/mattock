/**
 * Sync Queue Types
 * 
 * Tracks changes that need to be synced to the server when online.
 * Enables offline-first functionality.
 */

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncEntityType = 'template' | 'inspection' | 'photo';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  /** Unique identifier for this sync item */
  id: string;
  /** The action to perform */
  action: SyncAction;
  /** Type of entity being synced */
  entityType: SyncEntityType;
  /** ID of the entity */
  entityId: string;
  /** The data to sync (for create/update) */
  data?: unknown;
  /** When this item was added to the queue */
  createdAt: Date;
  /** Current sync status */
  status: SyncStatus;
  /** Number of retry attempts */
  retryCount: number;
  /** Last error message if failed */
  lastError?: string;
  /** When the last sync attempt was made */
  lastAttemptAt?: Date;
}

/**
 * Helper to create a new sync queue item
 */
export function createSyncQueueItem(
  action: SyncAction,
  entityType: SyncEntityType,
  entityId: string,
  data?: unknown
): SyncQueueItem {
  return {
    id: crypto.randomUUID(),
    action,
    entityType,
    entityId,
    data,
    createdAt: new Date(),
    status: 'pending',
    retryCount: 0,
  };
}

/**
 * App settings stored locally
 */
export interface AppSettings {
  /** Unique key for settings (always 'main') */
  id: string;
  /** Default inspector name */
  inspectorName: string;
  /** Last sync timestamp */
  lastSyncAt?: Date;
  /** Whether to auto-sync when online */
  autoSync: boolean;
  /** Photo quality (0-1) */
  photoQuality: number;
  /** Max photo dimension in pixels */
  maxPhotoDimension: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'main',
  inspectorName: '',
  autoSync: true,
  photoQuality: 0.8,
  maxPhotoDimension: 1920,
};

