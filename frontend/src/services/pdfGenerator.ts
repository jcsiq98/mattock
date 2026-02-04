/**
 * PDF Generator Service
 * 
 * Generates professional PDF inspection reports client-side using jsPDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Inspection, InspectionSection } from '../types/inspection';
import { calculateInspectionSummary } from '../types/inspection';
import type { Photo } from '../types/photo';
import { formatGeolocation } from '../types/photo';
import { photoService } from './photoService';

// Extend jsPDF type for autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

// Colors
const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // blue-600
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [245, 158, 11] as [number, number, number], // amber-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  gray: [100, 116, 139] as [number, number, number], // slate-500
  lightGray: [241, 245, 249] as [number, number, number], // slate-100
  dark: [15, 23, 42] as [number, number, number], // slate-900
};

export interface PDFGeneratorOptions {
  includePhotos?: boolean;
  compressPhotos?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export interface PDFGeneratorResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

/**
 * Generate a PDF report for an inspection
 */
export async function generateInspectionPDF(
  inspection: Inspection,
  options: PDFGeneratorOptions = {}
): Promise<PDFGeneratorResult> {
  const {
    includePhotos = true,
    compressPhotos = true,
    onProgress = () => {},
  } = options;

  try {
    onProgress(0, 'Initializing...');

    // Create PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }) as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Load photos if needed
    let photos: Photo[] = [];
    if (includePhotos) {
      onProgress(5, 'Loading photos...');
      photos = await loadInspectionPhotos(inspection);
    }

    // Calculate summary
    const summary = calculateInspectionSummary(inspection, photos.length);

    // ========== COVER PAGE ==========
    onProgress(10, 'Creating cover page...');
    renderCoverPage(doc, inspection, summary, pageWidth, pageHeight, margin);

    // ========== EXECUTIVE SUMMARY ==========
    doc.addPage();
    onProgress(20, 'Creating summary...');
    let yPos = renderExecutiveSummary(doc, inspection, summary, margin, contentWidth);

    // ========== DETAILED SECTIONS ==========
    onProgress(30, 'Creating detailed sections...');
    const totalSections = inspection.sections.length;
    
    for (let i = 0; i < inspection.sections.length; i++) {
      const section = inspection.sections[i];
      const progress = 30 + (i / totalSections) * 40;
      onProgress(progress, `Processing section: ${section.name}...`);

      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      yPos = renderSection(doc, section, yPos, margin, contentWidth, pageHeight);
    }

    // ========== PHOTO EVIDENCE ==========
    if (includePhotos && photos.length > 0) {
      onProgress(70, 'Adding photos...');
      doc.addPage();
      await renderPhotos(doc, photos, inspection, margin, contentWidth, pageHeight, compressPhotos, onProgress);
    }

    // ========== ADD PAGE NUMBERS ==========
    onProgress(95, 'Finalizing...');
    addPageNumbers(doc, pageWidth, pageHeight);

    // Generate blob
    onProgress(100, 'Complete!');
    const blob = doc.output('blob');
    const filename = generateFilename(inspection);

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Render the cover page
 */
function renderCoverPage(
  doc: jsPDF,
  inspection: Inspection,
  summary: ReturnType<typeof calculateInspectionSummary>,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  // Background header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Inspection Report', pageWidth / 2, 35, { align: 'center' });

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Condition Assessment', pageWidth / 2, 50, { align: 'center' });

  // Property Address Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 95, pageWidth - margin * 2, 50, 5, 5, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PROPERTY ADDRESS', margin + 10, 108);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const addressText = inspection.unit 
    ? `${inspection.address} #${inspection.unit}`
    : inspection.address;
  doc.text(addressText, margin + 10, 122);

  if (inspection.tenantName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(`Tenant: ${inspection.tenantName}`, margin + 10, 135);
  }

  // Info Grid
  const infoY = 165;
  const colWidth = (pageWidth - margin * 2) / 2;

  // Left column
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.text('INSPECTOR', margin, infoY);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.inspectorName, margin, infoY + 8);

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INSPECTION DATE', margin, infoY + 25);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(inspection.startedAt), margin, infoY + 33);

  // Right column
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TEMPLATE', margin + colWidth, infoY);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.templateName, margin + colWidth, infoY + 8);

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('STATUS', margin + colWidth, infoY + 25);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const statusText = inspection.status === 'completed' ? 'Completed' : 'In Progress';
  doc.text(statusText, margin + colWidth, infoY + 33);

  // Summary Stats Box
  const statsY = 220;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, statsY, pageWidth - margin * 2, 45, 5, 5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('INSPECTION SUMMARY', margin + 10, statsY + 12);

  // Stats
  const statsColWidth = (pageWidth - margin * 2 - 20) / 4;
  const statsDataY = statsY + 30;

  // OK
  doc.setFillColor(...COLORS.success);
  doc.circle(margin + 15, statsDataY - 3, 4, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(summary.okCount), margin + 25, statsDataY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('OK', margin + 25, statsDataY + 7);

  // Attention
  doc.setFillColor(...COLORS.warning);
  doc.circle(margin + 15 + statsColWidth, statsDataY - 3, 4, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(summary.attentionCount), margin + 25 + statsColWidth, statsDataY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Attention', margin + 25 + statsColWidth, statsDataY + 7);

  // N/A
  doc.setFillColor(...COLORS.gray);
  doc.circle(margin + 15 + statsColWidth * 2, statsDataY - 3, 4, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(summary.naCount), margin + 25 + statsColWidth * 2, statsDataY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('N/A', margin + 25 + statsColWidth * 2, statsDataY + 7);

  // Photos
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(summary.photoCount), margin + 25 + statsColWidth * 3, statsDataY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Photos', margin + 25 + statsColWidth * 3, statsDataY + 7);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    `Generated on ${formatDateTime(new Date())} • Property Inspector App`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
}

/**
 * Render executive summary page
 */
function renderExecutiveSummary(
  doc: jsPDFWithAutoTable,
  inspection: Inspection,
  summary: ReturnType<typeof calculateInspectionSummary>,
  margin: number,
  contentWidth: number
): number {
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Executive Summary', margin, yPos + 10);
  yPos += 20;

  // Items needing attention
  if (summary.attentionCount > 0) {
    doc.setFillColor(...COLORS.warning);
    doc.rect(margin, yPos, 3, 20, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Items Requiring Attention', margin + 8, yPos + 8);
    
    yPos += 15;

    // List attention items
    const attentionItems: string[][] = [];
    inspection.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.status === 'attention') {
          attentionItems.push([
            section.name,
            item.text,
            item.notes || '-',
          ]);
        }
      });
    });

    if (attentionItems.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Section', 'Item', 'Notes']],
        body: attentionItems,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: COLORS.warning,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 'auto' },
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }
  } else {
    // No issues message
    doc.setFillColor(...COLORS.success);
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ No items require immediate attention', margin + 10, yPos + 15);
    yPos += 35;
  }

  return yPos;
}

/**
 * Render a section with its items
 */
function renderSection(
  doc: jsPDFWithAutoTable,
  section: InspectionSection,
  startY: number,
  margin: number,
  contentWidth: number,
  _pageHeight: number
): number {
  let yPos = startY;

  // Section header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(section.name.toUpperCase(), margin + 5, yPos + 7);
  yPos += 15;

  // Items table
  const items: string[][] = section.items.map(item => [
    getStatusSymbol(item.status),
    item.text,
    item.notes || '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Item', 'Notes']],
    body: items,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.lightGray,
      textColor: COLORS.dark,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 'auto' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    didParseCell: (data) => {
      // Color the status cell based on value
      if (data.column.index === 0 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === '✓') {
          data.cell.styles.textColor = COLORS.success;
        } else if (status === '⚠') {
          data.cell.styles.textColor = COLORS.warning;
        } else if (status === '—') {
          data.cell.styles.textColor = COLORS.gray;
        }
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 12;
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

/**
 * Render photos section
 */
async function renderPhotos(
  doc: jsPDF,
  photos: Photo[],
  inspection: Inspection,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  compress: boolean,
  onProgress: (progress: number, message: string) => void
): Promise<void> {
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Photo Evidence', margin, yPos + 10);
  yPos += 20;

  const photoWidth = (contentWidth - 10) / 2; // 2 photos per row
  const photoHeight = 60;
  let xPos = margin;
  let photosInRow = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const progress = 70 + (i / photos.length) * 25;
    onProgress(progress, `Adding photo ${i + 1} of ${photos.length}...`);

    // Check if we need a new page
    if (yPos + photoHeight + 20 > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
      xPos = margin;
      photosInRow = 0;
    }

    try {
      // Get image data (use annotated if available)
      const imageData = photo.annotatedImageData || photo.imageData;
      
      // Add image
      doc.addImage(
        imageData,
        'JPEG',
        xPos,
        yPos,
        photoWidth,
        photoHeight,
        undefined,
        compress ? 'MEDIUM' : undefined
      );

      // Photo info
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);
      
      const timestamp = formatDateTime(new Date(photo.timestamp));
      doc.text(timestamp, xPos, yPos + photoHeight + 5);
      
      if (photo.geolocation) {
        doc.text(formatGeolocation(photo.geolocation), xPos, yPos + photoHeight + 9);
      }

      // Find which section/item this photo belongs to
      const location = findPhotoLocation(photo, inspection);
      if (location) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(location, xPos, yPos + photoHeight + 13, { maxWidth: photoWidth });
      }

    } catch (error) {
      console.error('Failed to add photo:', error);
      // Draw placeholder
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(xPos, yPos, photoWidth, photoHeight, 'F');
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(10);
      doc.text('Photo unavailable', xPos + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' });
    }

    photosInRow++;
    if (photosInRow === 2) {
      yPos += photoHeight + 25;
      xPos = margin;
      photosInRow = 0;
    } else {
      xPos += photoWidth + 10;
    }
  }
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

/**
 * Load all photos for an inspection
 */
async function loadInspectionPhotos(inspection: Inspection): Promise<Photo[]> {
  const photos = await photoService.getByInspection(inspection.id);
  return photos;
}

/**
 * Find which section/item a photo belongs to
 */
function findPhotoLocation(photo: Photo, inspection: Inspection): string | null {
  if (!photo.sectionId && !photo.itemId) return null;

  for (const section of inspection.sections) {
    if (photo.sectionId === section.sectionId) {
      if (photo.itemId) {
        const item = section.items.find(i => i.itemId === photo.itemId);
        if (item) {
          return `${section.name} › ${item.text}`;
        }
      }
      return section.name;
    }
  }
  return null;
}

/**
 * Get status symbol for display
 */
function getStatusSymbol(status: string): string {
  switch (status) {
    case 'ok': return '✓';
    case 'attention': return '⚠';
    case 'na': return '—';
    default: return '○';
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Generate filename for the PDF
 */
function generateFilename(inspection: Inspection): string {
  const address = inspection.address
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);
  const date = new Date(inspection.startedAt).toISOString().split('T')[0];
  return `inspection-${address}-${date}.pdf`;
}

/**
 * Download the PDF
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share the PDF using Web Share API
 */
export async function sharePDF(blob: Blob, filename: string): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  const file = new File([blob], filename, { type: 'application/pdf' });
  
  if (!navigator.canShare({ files: [file] })) {
    return false;
  }

  try {
    await navigator.share({
      files: [file],
      title: 'Inspection Report',
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

