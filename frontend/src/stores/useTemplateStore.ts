/**
 * Template Store
 * 
 * Zustand store for managing template state and operations.
 */

import { create } from 'zustand';
import { templateService } from '../services/templateService';
import type { ChecklistTemplate, PropertyType } from '../types/template';

interface TemplateState {
  // Data
  templates: ChecklistTemplate[];
  currentTemplate: ChecklistTemplate | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  filterPropertyType: PropertyType | 'all';

  // Actions
  loadTemplates: () => Promise<void>;
  loadTemplate: (id: string) => Promise<void>;
  createTemplate: (template: ChecklistTemplate) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<ChecklistTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<string | null>;
  setCurrentTemplate: (template: ChecklistTemplate | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterPropertyType: (type: PropertyType | 'all') => void;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterPropertyType: 'all',

  // Load all templates
  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await templateService.getAll();
      set({ templates, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to load templates',
        isLoading: false 
      });
    }
  },

  // Load a single template
  loadTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const template = await templateService.getById(id);
      set({ currentTemplate: template || null, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to load template',
        isLoading: false 
      });
    }
  },

  // Create a new template
  createTemplate: async (template: ChecklistTemplate) => {
    set({ isLoading: true, error: null });
    try {
      const id = await templateService.create(template);
      // Refresh the list
      await get().loadTemplates();
      set({ isLoading: false });
      return id;
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to create template',
        isLoading: false 
      });
      throw err;
    }
  },

  // Update a template
  updateTemplate: async (id: string, updates: Partial<ChecklistTemplate>) => {
    try {
      await templateService.update(id, updates);
      // Update local state
      set(state => ({
        templates: state.templates.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        ),
        currentTemplate: state.currentTemplate?.id === id 
          ? { ...state.currentTemplate, ...updates, updatedAt: new Date() }
          : state.currentTemplate,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update template' });
      throw err;
    }
  },

  // Delete a template
  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await templateService.hardDelete(id);
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false,
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to delete template',
        isLoading: false 
      });
      throw err;
    }
  },

  // Duplicate a template
  duplicateTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const newId = await templateService.duplicate(id);
      await get().loadTemplates();
      set({ isLoading: false });
      return newId;
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to duplicate template',
        isLoading: false 
      });
      return null;
    }
  },

  // Set current template (for editing)
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // Set search query
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Set property type filter
  setFilterPropertyType: (type) => set({ filterPropertyType: type }),

  // Clear error
  clearError: () => set({ error: null }),
}));

/**
 * Selector for filtered templates
 */
export function useFilteredTemplates() {
  const { templates, searchQuery, filterPropertyType } = useTemplateStore();
  
  return templates.filter(template => {
    // Filter by active status
    if (!template.isActive) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!template.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Filter by property type
    if (filterPropertyType !== 'all' && template.propertyType !== filterPropertyType) {
      return false;
    }
    
    return true;
  });
}

