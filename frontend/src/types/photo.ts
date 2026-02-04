/**
 * Photo Types
 * 
 * Photos are captured during inspections and can be annotated.
 * They store both the original image and the annotated version.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
}

export interface Photo {
  /** Unique identifier */
  id: string;
  /** Reference to the inspection this photo belongs to */
  inspectionId: string;
  /** Reference to the section (if attached to a section) */
  sectionId?: string;
  /** Reference to the item (if attached to an item) */
  itemId?: string;
  /** Original image data as base64 */
  imageData: string;
  /** Annotated image data as base64 (if annotated) */
  annotatedImageData?: string;
  /** Whether the photo has been annotated */
  hasAnnotations: boolean;
  /** When the photo was taken */
  timestamp: Date;
  /** Geolocation when photo was taken (if available) */
  geolocation?: GeoLocation;
  /** Caption/description for the photo */
  caption?: string;
  /** Thumbnail for faster loading in lists */
  thumbnailData?: string;
  /** File size in bytes (for storage management) */
  fileSize: number;
  /** MIME type of the image */
  mimeType: string;
}

/**
 * Helper to create a new photo
 */
export function createPhoto(
  inspectionId: string,
  imageData: string,
  options: {
    sectionId?: string;
    itemId?: string;
    geolocation?: GeoLocation;
    caption?: string;
    thumbnailData?: string;
    mimeType?: string;
  } = {}
): Photo {
  // Estimate file size from base64 (rough calculation)
  const base64Length = imageData.length - (imageData.indexOf(',') + 1);
  const fileSize = Math.round((base64Length * 3) / 4);

  return {
    id: crypto.randomUUID(),
    inspectionId,
    sectionId: options.sectionId,
    itemId: options.itemId,
    imageData,
    hasAnnotations: false,
    timestamp: new Date(),
    geolocation: options.geolocation,
    caption: options.caption,
    thumbnailData: options.thumbnailData,
    fileSize,
    mimeType: options.mimeType || 'image/jpeg',
  };
}

/**
 * Format geolocation for display
 */
export function formatGeolocation(geo: GeoLocation): string {
  const lat = geo.latitude.toFixed(6);
  const lng = geo.longitude.toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

