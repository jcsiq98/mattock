/**
 * Photo Service
 * 
 * CRUD operations for inspection photos.
 * Handles image compression, thumbnail generation, and storage.
 */

import { db } from './database';
import { syncQueueService } from './syncQueueService';
import type { Photo, GeoLocation } from '../types/photo';
import { createPhoto } from '../types/photo';

export const photoService = {
  /**
   * Get all photos for an inspection
   */
  async getByInspection(inspectionId: string): Promise<Photo[]> {
    return db.photos
      .where('inspectionId')
      .equals(inspectionId)
      .sortBy('timestamp');
  },

  /**
   * Get photos for a specific section
   */
  async getBySection(inspectionId: string, sectionId: string): Promise<Photo[]> {
    return db.photos
      .where(['inspectionId', 'sectionId'])
      .equals([inspectionId, sectionId])
      .toArray();
  },

  /**
   * Get photos for a specific item
   */
  async getByItem(inspectionId: string, itemId: string): Promise<Photo[]> {
    return db.photos
      .where(['inspectionId', 'itemId'])
      .equals([inspectionId, itemId])
      .toArray();
  },

  /**
   * Get a single photo by ID
   */
  async getById(id: string): Promise<Photo | undefined> {
    return db.photos.get(id);
  },

  /**
   * Create a new photo from image data
   */
  async create(
    inspectionId: string,
    imageData: string,
    options: {
      sectionId?: string;
      itemId?: string;
      geolocation?: GeoLocation;
      caption?: string;
    } = {}
  ): Promise<Photo> {
    // Generate thumbnail
    const thumbnailData = await this.generateThumbnail(imageData);
    
    const photo = createPhoto(inspectionId, imageData, {
      ...options,
      thumbnailData,
    });

    await db.photos.add(photo);
    
    // Add to sync queue
    await syncQueueService.add('create', 'photo', photo.id, photo);
    
    return photo;
  },

  /**
   * Update photo (e.g., add annotations)
   */
  async update(id: string, updates: Partial<Photo>): Promise<void> {
    await db.photos.update(id, updates);
    
    const photo = await db.photos.get(id);
    if (photo) {
      await syncQueueService.add('update', 'photo', id, photo);
    }
  },

  /**
   * Save annotated version of a photo
   */
  async saveAnnotation(id: string, annotatedImageData: string): Promise<void> {
    await db.photos.update(id, {
      annotatedImageData,
      hasAnnotations: true,
    });
    
    const photo = await db.photos.get(id);
    if (photo) {
      await syncQueueService.add('update', 'photo', id, photo);
    }
  },

  /**
   * Update photo caption
   */
  async updateCaption(id: string, caption: string): Promise<void> {
    await db.photos.update(id, { caption });
  },

  /**
   * Delete a photo
   */
  async delete(id: string): Promise<void> {
    await db.photos.delete(id);
    await syncQueueService.add('delete', 'photo', id);
  },

  /**
   * Delete all photos for an inspection
   */
  async deleteByInspection(inspectionId: string): Promise<number> {
    return db.photos.where('inspectionId').equals(inspectionId).delete();
  },

  /**
   * Count photos for an inspection
   */
  async countByInspection(inspectionId: string): Promise<number> {
    return db.photos.where('inspectionId').equals(inspectionId).count();
  },

  /**
   * Get total storage used by photos (in bytes)
   */
  async getTotalSize(): Promise<number> {
    const photos = await db.photos.toArray();
    return photos.reduce((total, photo) => total + photo.fileSize, 0);
  },

  /**
   * Compress an image to specified dimensions and quality
   */
  async compressImage(
    imageData: string,
    maxDimension: number = 1920,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  },

  /**
   * Generate a thumbnail from image data
   */
  async generateThumbnail(imageData: string, size: number = 200): Promise<string> {
    return this.compressImage(imageData, size, 0.6);
  },

  /**
   * Request geolocation permission and get current position
   */
  async getCurrentLocation(): Promise<GeoLocation | null> {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation not supported');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  },

  /**
   * Convert file to base64 data URL
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },
};

