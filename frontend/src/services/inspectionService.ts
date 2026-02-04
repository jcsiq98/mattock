/**
 * Inspection Service
 * 
 * CRUD operations for property inspections.
 */

import { db } from './database';
import { syncQueueService } from './syncQueueService';
import type { Inspection, InspectionStatus, InspectionItem } from '../types/inspection';

export const inspectionService = {
  /**
   * Get all inspections
   */
  async getAll(): Promise<Inspection[]> {
    return db.inspections.orderBy('updatedAt').reverse().toArray();
  },

  /**
   * Get inspections by status
   */
  async getByStatus(status: InspectionStatus): Promise<Inspection[]> {
    return db.inspections
      .where('status')
      .equals(status)
      .reverse()
      .sortBy('updatedAt');
  },

  /**
   * Get in-progress inspections
   */
  async getInProgress(): Promise<Inspection[]> {
    return db.inspections
      .where('status')
      .anyOf(['draft', 'in_progress'])
      .reverse()
      .sortBy('updatedAt');
  },

  /**
   * Get completed inspections
   */
  async getCompleted(): Promise<Inspection[]> {
    return db.inspections
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('completedAt');
  },

  /**
   * Get a single inspection by ID
   */
  async getById(id: string): Promise<Inspection | undefined> {
    return db.inspections.get(id);
  },

  /**
   * Create a new inspection
   */
  async create(inspection: Inspection): Promise<string> {
    const id = await db.inspections.add(inspection);
    
    // Add to sync queue
    await syncQueueService.add('create', 'inspection', inspection.id, inspection);
    
    return id;
  },

  /**
   * Update an existing inspection
   */
  async update(id: string, updates: Partial<Inspection>): Promise<void> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    await db.inspections.update(id, updatedData);
    
    // Add to sync queue
    const inspection = await db.inspections.get(id);
    if (inspection) {
      await syncQueueService.add('update', 'inspection', id, inspection);
    }
  },

  /**
   * Update a specific item within an inspection
   */
  async updateItem(
    inspectionId: string,
    sectionId: string,
    itemId: string,
    updates: Partial<InspectionItem>
  ): Promise<void> {
    const inspection = await db.inspections.get(inspectionId);
    if (!inspection) return;

    // Find and update the item
    const sectionIndex = inspection.sections.findIndex(s => s.sectionId === sectionId);
    if (sectionIndex === -1) return;

    const itemIndex = inspection.sections[sectionIndex].items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return;

    inspection.sections[sectionIndex].items[itemIndex] = {
      ...inspection.sections[sectionIndex].items[itemIndex],
      ...updates,
    };

    // Update status to in_progress if it was draft
    if (inspection.status === 'draft') {
      inspection.status = 'in_progress';
    }

    inspection.updatedAt = new Date();
    await db.inspections.put(inspection);
    
    // Add to sync queue
    await syncQueueService.add('update', 'inspection', inspectionId, inspection);
  },

  /**
   * Add a photo ID to an item
   */
  async addPhotoToItem(
    inspectionId: string,
    sectionId: string,
    itemId: string,
    photoId: string
  ): Promise<void> {
    const inspection = await db.inspections.get(inspectionId);
    if (!inspection) return;

    const section = inspection.sections.find(s => s.sectionId === sectionId);
    if (!section) return;

    const item = section.items.find(i => i.itemId === itemId);
    if (!item) return;

    if (!item.photoIds.includes(photoId)) {
      item.photoIds.push(photoId);
      inspection.updatedAt = new Date();
      await db.inspections.put(inspection);
    }
  },

  /**
   * Add a photo ID to a section
   */
  async addPhotoToSection(
    inspectionId: string,
    sectionId: string,
    photoId: string
  ): Promise<void> {
    const inspection = await db.inspections.get(inspectionId);
    if (!inspection) return;

    const section = inspection.sections.find(s => s.sectionId === sectionId);
    if (!section) return;

    if (!section.photoIds.includes(photoId)) {
      section.photoIds.push(photoId);
      inspection.updatedAt = new Date();
      await db.inspections.put(inspection);
    }
  },

  /**
   * Mark inspection as completed
   */
  async complete(id: string): Promise<void> {
    const now = new Date();
    await db.inspections.update(id, {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });
    
    const inspection = await db.inspections.get(id);
    if (inspection) {
      await syncQueueService.add('update', 'inspection', id, inspection);
    }
  },

  /**
   * Reopen a completed inspection
   */
  async reopen(id: string): Promise<void> {
    await db.inspections.update(id, {
      status: 'in_progress',
      completedAt: undefined,
      updatedAt: new Date(),
    });
    
    const inspection = await db.inspections.get(id);
    if (inspection) {
      await syncQueueService.add('update', 'inspection', id, inspection);
    }
  },

  /**
   * Delete an inspection and its photos
   */
  async delete(id: string): Promise<void> {
    // Delete associated photos
    await db.photos.where('inspectionId').equals(id).delete();
    
    // Delete the inspection
    await db.inspections.delete(id);
    
    await syncQueueService.add('delete', 'inspection', id);
  },

  /**
   * Search inspections by address or tenant name
   */
  async search(query: string): Promise<Inspection[]> {
    const lowerQuery = query.toLowerCase();
    const all = await db.inspections.toArray();
    return all.filter(i => 
      i.address.toLowerCase().includes(lowerQuery) ||
      i.tenantName?.toLowerCase().includes(lowerQuery) ||
      i.unit?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Count inspections
   */
  async count(): Promise<number> {
    return db.inspections.count();
  },

  /**
   * Count by status
   */
  async countByStatus(status: InspectionStatus): Promise<number> {
    return db.inspections.where('status').equals(status).count();
  },

  /**
   * Get recent inspections (last 7 days)
   */
  async getRecent(days: number = 7): Promise<Inspection[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return db.inspections
      .where('updatedAt')
      .above(cutoff)
      .reverse()
      .sortBy('updatedAt');
  },
};

