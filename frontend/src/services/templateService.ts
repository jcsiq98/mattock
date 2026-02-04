/**
 * Template Service
 * 
 * CRUD operations for checklist templates.
 */

import { db } from './database';
import { syncQueueService } from './syncQueueService';
import type { ChecklistTemplate, PropertyType } from '../types/template';

export const templateService = {
  /**
   * Get all templates
   */
  async getAll(): Promise<ChecklistTemplate[]> {
    return db.templates.orderBy('updatedAt').reverse().toArray();
  },

  /**
   * Get only active templates
   */
  async getActive(): Promise<ChecklistTemplate[]> {
    return db.templates
      .where('isActive')
      .equals(1) // Dexie stores booleans as 0/1
      .reverse()
      .sortBy('updatedAt');
  },

  /**
   * Get templates by property type
   */
  async getByPropertyType(propertyType: PropertyType): Promise<ChecklistTemplate[]> {
    return db.templates
      .where('propertyType')
      .equals(propertyType)
      .toArray();
  },

  /**
   * Get a single template by ID
   */
  async getById(id: string): Promise<ChecklistTemplate | undefined> {
    return db.templates.get(id);
  },

  /**
   * Create a new template
   */
  async create(template: ChecklistTemplate): Promise<string> {
    const id = await db.templates.add(template);
    
    // Add to sync queue
    await syncQueueService.add('create', 'template', template.id, template);
    
    return id;
  },

  /**
   * Update an existing template
   */
  async update(id: string, updates: Partial<ChecklistTemplate>): Promise<void> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    await db.templates.update(id, updatedData);
    
    // Add to sync queue
    const template = await db.templates.get(id);
    if (template) {
      await syncQueueService.add('update', 'template', id, template);
    }
  },

  /**
   * Delete a template (soft delete by setting isActive to false)
   */
  async softDelete(id: string): Promise<void> {
    await db.templates.update(id, { 
      isActive: false,
      updatedAt: new Date(),
    });
    
    await syncQueueService.add('update', 'template', id, { isActive: false });
  },

  /**
   * Permanently delete a template
   */
  async hardDelete(id: string): Promise<void> {
    await db.templates.delete(id);
    await syncQueueService.add('delete', 'template', id);
  },

  /**
   * Duplicate a template
   */
  async duplicate(id: string, newName?: string): Promise<string | null> {
    const original = await db.templates.get(id);
    if (!original) return null;

    const now = new Date();
    const duplicate: ChecklistTemplate = {
      ...original,
      id: crypto.randomUUID(),
      name: newName || `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      // Generate new IDs for sections and items
      sections: original.sections.map(section => ({
        ...section,
        id: crypto.randomUUID(),
        items: section.items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      })),
    };

    return this.create(duplicate);
  },

  /**
   * Search templates by name
   */
  async search(query: string): Promise<ChecklistTemplate[]> {
    const lowerQuery = query.toLowerCase();
    const all = await db.templates.toArray();
    return all.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.propertyType.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Count templates
   */
  async count(): Promise<number> {
    return db.templates.count();
  },

  /**
   * Count active templates
   */
  async countActive(): Promise<number> {
    return db.templates.where('isActive').equals(1).count();
  },
};

