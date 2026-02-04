/**
 * Inspection Types
 * 
 * Inspections are instances created from templates.
 * They contain the actual inspection data: statuses, notes, and photos.
 */

export type InspectionStatus = 'draft' | 'in_progress' | 'completed';
export type ItemStatus = 'pending' | 'ok' | 'attention' | 'na';

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  'pending': 'Pending',
  'ok': 'OK',
  'attention': 'Needs Attention',
  'na': 'N/A',
};

export const ITEM_STATUS_COLORS: Record<ItemStatus, { bg: string; text: string }> = {
  'pending': { bg: 'bg-slate-100', text: 'text-slate-600' },
  'ok': { bg: 'bg-success-50', text: 'text-success-600' },
  'attention': { bg: 'bg-warning-50', text: 'text-warning-600' },
  'na': { bg: 'bg-slate-100', text: 'text-slate-500' },
};

export interface InspectionItem {
  /** Reference to the template item ID */
  itemId: string;
  /** Item text (copied from template for offline access) */
  text: string;
  /** Current status */
  status: ItemStatus;
  /** Inspector notes */
  notes: string;
  /** IDs of photos attached to this item */
  photoIds: string[];
  /** Order within the section */
  order: number;
}

export interface InspectionSection {
  /** Reference to the template section ID */
  sectionId: string;
  /** Section name (copied from template) */
  name: string;
  /** Items in this section */
  items: InspectionItem[];
  /** IDs of photos attached to this section (not specific items) */
  photoIds: string[];
  /** Order within the inspection */
  order: number;
}

export interface Inspection {
  /** Unique identifier */
  id: string;
  /** Reference to the template used */
  templateId: string;
  /** Template name (copied for display when offline) */
  templateName: string;
  /** Property address */
  address: string;
  /** Unit number (optional) */
  unit?: string;
  /** Tenant name (optional) */
  tenantName?: string;
  /** Inspector name */
  inspectorName: string;
  /** Current status of the inspection */
  status: InspectionStatus;
  /** Sections with inspection data */
  sections: InspectionSection[];
  /** When the inspection was started */
  startedAt: Date;
  /** When the inspection was completed (if completed) */
  completedAt?: Date;
  /** When the inspection was last updated */
  updatedAt: Date;
  /** General notes for the entire inspection */
  generalNotes?: string;
}

/**
 * Summary statistics for an inspection
 */
export interface InspectionSummary {
  totalItems: number;
  completedItems: number;
  okCount: number;
  attentionCount: number;
  naCount: number;
  pendingCount: number;
  photoCount: number;
  completionPercentage: number;
}

/**
 * Calculate summary statistics for an inspection
 */
export function calculateInspectionSummary(inspection: Inspection, photoCount: number = 0): InspectionSummary {
  let totalItems = 0;
  let okCount = 0;
  let attentionCount = 0;
  let naCount = 0;
  let pendingCount = 0;

  for (const section of inspection.sections) {
    for (const item of section.items) {
      totalItems++;
      switch (item.status) {
        case 'ok':
          okCount++;
          break;
        case 'attention':
          attentionCount++;
          break;
        case 'na':
          naCount++;
          break;
        case 'pending':
          pendingCount++;
          break;
      }
    }
  }

  const completedItems = okCount + attentionCount + naCount;
  const completionPercentage = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 0;

  return {
    totalItems,
    completedItems,
    okCount,
    attentionCount,
    naCount,
    pendingCount,
    photoCount,
    completionPercentage,
  };
}

/**
 * Helper to create a new inspection from a template
 */
export function createInspectionFromTemplate(
  template: { id: string; name: string; sections: Array<{ id: string; name: string; order: number; items: Array<{ id: string; text: string; order: number; defaultNotes?: string }> }> },
  inspectorName: string,
  address: string,
  unit?: string,
  tenantName?: string
): Inspection {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    templateName: template.name,
    address,
    unit,
    tenantName,
    inspectorName,
    status: 'draft',
    sections: template.sections.map((section) => ({
      sectionId: section.id,
      name: section.name,
      order: section.order,
      photoIds: [],
      items: section.items.map((item) => ({
        itemId: item.id,
        text: item.text,
        status: 'pending' as ItemStatus,
        notes: item.defaultNotes || '',
        photoIds: [],
        order: item.order,
      })),
    })),
    startedAt: now,
    updatedAt: now,
  };
}

