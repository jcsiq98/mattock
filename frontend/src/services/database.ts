/**
 * Database Service
 * 
 * Uses Dexie.js to provide a typed IndexedDB wrapper.
 * All data is stored locally for offline-first functionality.
 */

import Dexie, { type Table } from 'dexie';
import type { ChecklistTemplate } from '../types/template';
import type { Inspection } from '../types/inspection';
import type { Photo } from '../types/photo';
import type { SyncQueueItem, AppSettings } from '../types/sync';

export class InspectorDatabase extends Dexie {
  // Typed tables
  templates!: Table<ChecklistTemplate, string>;
  inspections!: Table<Inspection, string>;
  photos!: Table<Photo, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PropertyInspectorDB');

    // Define schema
    // Note: Only indexed fields need to be listed, not all fields
    this.version(1).stores({
      templates: 'id, name, propertyType, createdAt, updatedAt, isActive',
      inspections: 'id, templateId, address, inspectorName, status, startedAt, completedAt, updatedAt',
      photos: 'id, inspectionId, sectionId, itemId, timestamp',
      syncQueue: 'id, entityType, entityId, status, createdAt',
      settings: 'id',
    });
  }
}

// Singleton database instance
export const db = new InspectorDatabase();

/**
 * Initialize database with default data if empty
 */
export async function initializeDatabase(): Promise<void> {
  // Ensure settings exist (use put to handle race conditions)
  const existingSettings = await db.settings.get('main');
  if (!existingSettings) {
    // Use put instead of add to handle race conditions
    await db.settings.put({
      id: 'main',
      inspectorName: '',
      autoSync: true,
      photoQuality: 0.8,
      maxPhotoDimension: 1920,
    });
  }

  // Check if we need to seed sample templates
  const templateCount = await db.templates.count();
  if (templateCount === 0) {
    await seedSampleTemplates();
  }
}

/**
 * Seed sample templates for demo purposes
 */
async function seedSampleTemplates(): Promise<void> {
  const now = new Date();

  const studioTemplate: ChecklistTemplate = {
    id: crypto.randomUUID(),
    name: 'Studio Apartment',
    propertyType: 'studio',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    sections: [
      {
        id: crypto.randomUUID(),
        name: 'Entrance & General',
        order: 0,
        items: [
          { id: crypto.randomUUID(), text: 'Front door condition', order: 0 },
          { id: crypto.randomUUID(), text: 'Door locks working', order: 1 },
          { id: crypto.randomUUID(), text: 'Doorbell/intercom', order: 2 },
          { id: crypto.randomUUID(), text: 'Light switches working', order: 3 },
          { id: crypto.randomUUID(), text: 'Electrical outlets', order: 4 },
          { id: crypto.randomUUID(), text: 'Smoke detectors', order: 5 },
          { id: crypto.randomUUID(), text: 'Windows condition', order: 6 },
          { id: crypto.randomUUID(), text: 'Window locks', order: 7 },
          { id: crypto.randomUUID(), text: 'Flooring condition', order: 8 },
          { id: crypto.randomUUID(), text: 'Walls & ceiling', order: 9 },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'Kitchen',
        order: 1,
        items: [
          { id: crypto.randomUUID(), text: 'Refrigerator working', order: 0 },
          { id: crypto.randomUUID(), text: 'Stove/oven working', order: 1 },
          { id: crypto.randomUUID(), text: 'Microwave (if provided)', order: 2 },
          { id: crypto.randomUUID(), text: 'Dishwasher (if provided)', order: 3 },
          { id: crypto.randomUUID(), text: 'Sink & faucet', order: 4 },
          { id: crypto.randomUUID(), text: 'Garbage disposal', order: 5 },
          { id: crypto.randomUUID(), text: 'Cabinets & drawers', order: 6 },
          { id: crypto.randomUUID(), text: 'Countertops', order: 7 },
          { id: crypto.randomUUID(), text: 'Exhaust fan/hood', order: 8 },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'Bathroom',
        order: 2,
        items: [
          { id: crypto.randomUUID(), text: 'Toilet flushing properly', order: 0 },
          { id: crypto.randomUUID(), text: 'Toilet seat condition', order: 1 },
          { id: crypto.randomUUID(), text: 'Sink & faucet', order: 2 },
          { id: crypto.randomUUID(), text: 'Shower/tub condition', order: 3 },
          { id: crypto.randomUUID(), text: 'Showerhead working', order: 4 },
          { id: crypto.randomUUID(), text: 'Hot water working', order: 5 },
          { id: crypto.randomUUID(), text: 'Drain functioning', order: 6 },
          { id: crypto.randomUUID(), text: 'Exhaust fan', order: 7 },
          { id: crypto.randomUUID(), text: 'Mirror condition', order: 8 },
          { id: crypto.randomUUID(), text: 'Towel bars/hooks', order: 9 },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'Closets & Storage',
        order: 3,
        items: [
          { id: crypto.randomUUID(), text: 'Closet doors', order: 0 },
          { id: crypto.randomUUID(), text: 'Closet shelving', order: 1 },
          { id: crypto.randomUUID(), text: 'Closet rods', order: 2 },
          { id: crypto.randomUUID(), text: 'Additional storage', order: 3 },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'HVAC & Utilities',
        order: 4,
        items: [
          { id: crypto.randomUUID(), text: 'Heating working', order: 0 },
          { id: crypto.randomUUID(), text: 'Air conditioning', order: 1 },
          { id: crypto.randomUUID(), text: 'Thermostat', order: 2 },
          { id: crypto.randomUUID(), text: 'Water heater access', order: 3 },
          { id: crypto.randomUUID(), text: 'Circuit breaker access', order: 4 },
        ],
      },
    ],
  };

  const bedroomTemplate: ChecklistTemplate = {
    id: crypto.randomUUID(),
    name: '1 Bedroom Apartment',
    propertyType: '1-bedroom',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    sections: [
      ...studioTemplate.sections.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        items: s.items.map(i => ({ ...i, id: crypto.randomUUID() })),
      })),
      {
        id: crypto.randomUUID(),
        name: 'Bedroom',
        order: 5,
        items: [
          { id: crypto.randomUUID(), text: 'Bedroom door', order: 0 },
          { id: crypto.randomUUID(), text: 'Windows', order: 1 },
          { id: crypto.randomUUID(), text: 'Window coverings', order: 2 },
          { id: crypto.randomUUID(), text: 'Closet', order: 3 },
          { id: crypto.randomUUID(), text: 'Light fixtures', order: 4 },
          { id: crypto.randomUUID(), text: 'Electrical outlets', order: 5 },
          { id: crypto.randomUUID(), text: 'Flooring', order: 6 },
          { id: crypto.randomUUID(), text: 'Walls & ceiling', order: 7 },
        ],
      },
    ],
  };

  // Use bulkPut to handle race conditions (won't fail if key exists)
  await db.templates.bulkPut([studioTemplate, bedroomTemplate]);
  console.log('Sample templates seeded');
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  await db.templates.clear();
  await db.inspections.clear();
  await db.photos.clear();
  await db.syncQueue.clear();
  // Re-initialize with defaults
  await initializeDatabase();
}

/**
 * Export all data as JSON (for backup/transfer)
 */
export async function exportAllData(): Promise<string> {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    templates: await db.templates.toArray(),
    inspections: await db.inspections.toArray(),
    photos: await db.photos.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON backup
 */
export async function importData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.version || !data.templates || !data.inspections) {
      return { success: false, message: 'Invalid data format' };
    }

    // Clear existing data
    await db.templates.clear();
    await db.inspections.clear();
    await db.photos.clear();

    // Import new data
    if (data.templates.length > 0) {
      // Convert date strings back to Date objects
      const templates = data.templates.map((t: ChecklistTemplate) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
      await db.templates.bulkAdd(templates);
    }

    if (data.inspections.length > 0) {
      const inspections = data.inspections.map((i: Inspection) => ({
        ...i,
        startedAt: new Date(i.startedAt),
        updatedAt: new Date(i.updatedAt),
        completedAt: i.completedAt ? new Date(i.completedAt) : undefined,
      }));
      await db.inspections.bulkAdd(inspections);
    }

    if (data.photos && data.photos.length > 0) {
      const photos = data.photos.map((p: Photo) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      }));
      await db.photos.bulkAdd(photos);
    }

    return { 
      success: true, 
      message: `Imported ${data.templates.length} templates, ${data.inspections.length} inspections, ${data.photos?.length || 0} photos` 
    };
  } catch (error) {
    return { success: false, message: `Import failed: ${error}` };
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number; percentage: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;
    return { used, quota, percentage };
  }
  return { used: 0, quota: 0, percentage: 0 };
}

