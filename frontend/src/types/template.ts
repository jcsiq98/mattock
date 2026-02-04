/**
 * Template Types
 * 
 * Templates define the structure of property inspection checklists.
 * Each template has sections (e.g., Kitchen, Bathroom) and items within sections.
 */

export interface TemplateItem {
  /** Unique identifier for the item */
  id: string;
  /** Item text/description (e.g., "Check sink for leaks") */
  text: string;
  /** Optional default notes that pre-populate during inspection */
  defaultNotes?: string;
  /** Order within the section */
  order: number;
}

export interface TemplateSection {
  /** Unique identifier for the section */
  id: string;
  /** Section name (e.g., "Kitchen", "Bathroom") */
  name: string;
  /** Items within this section */
  items: TemplateItem[];
  /** Order within the template */
  order: number;
}

export interface ChecklistTemplate {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Template name (e.g., "Studio Apartment Inspection") */
  name: string;
  /** Property type this template is for */
  propertyType: PropertyType;
  /** Sections in this template */
  sections: TemplateSection[];
  /** When the template was created */
  createdAt: Date;
  /** When the template was last updated */
  updatedAt: Date;
  /** Whether this template is active/usable */
  isActive: boolean;
}

export type PropertyType = 
  | 'studio'
  | '1-bedroom'
  | '2-bedroom'
  | '3-bedroom'
  | '4-bedroom'
  | 'house'
  | 'commercial'
  | 'other';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'studio': 'Studio',
  '1-bedroom': '1 Bedroom',
  '2-bedroom': '2 Bedroom',
  '3-bedroom': '3 Bedroom',
  '4-bedroom': '4+ Bedroom',
  'house': 'House',
  'commercial': 'Commercial',
  'other': 'Other',
};

/**
 * Helper to create a new template with defaults
 */
export function createTemplate(partial: Partial<ChecklistTemplate> = {}): ChecklistTemplate {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name: '',
    propertyType: 'other',
    sections: [],
    createdAt: now,
    updatedAt: now,
    isActive: true,
    ...partial,
  };
}

/**
 * Helper to create a new section with defaults
 */
export function createSection(partial: Partial<TemplateSection> = {}): TemplateSection {
  return {
    id: crypto.randomUUID(),
    name: '',
    items: [],
    order: 0,
    ...partial,
  };
}

/**
 * Helper to create a new item with defaults
 */
export function createItem(partial: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: crypto.randomUUID(),
    text: '',
    order: 0,
    ...partial,
  };
}

