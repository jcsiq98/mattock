import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { photoService } from '../../services/photoService';
import type { Photo } from '../../types/photo';
import { formatGeolocation, formatFileSize } from '../../types/photo';

interface PhotoGalleryProps {
  inspectionId: string;
  sectionId?: string;
  itemId?: string;
  photoIds: string[];
  onPhotoDeleted?: (photoId: string) => void;
  editable?: boolean;
}

export function PhotoGallery({
  inspectionId,
  sectionId,
  itemId,
  photoIds,
  onPhotoDeleted,
  editable = true,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [photoIds]);

  async function loadPhotos() {
    if (photoIds.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const loadedPhotos = await Promise.all(
        photoIds.map((id) => photoService.getById(id))
      );
      setPhotos(loadedPhotos.filter((p): p is Photo => p !== undefined));
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await photoService.delete(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      onPhotoDeleted?.(photoId);
      setSelectedIndex(null);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-16 h-16 bg-slate-100 rounded-lg animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-primary-300 transition-colors"
          >
            <img
              src={photo.thumbnailData || photo.imageData}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {photo.hasAnnotations && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-primary-500 rounded-full" />
            )}
            {photo.geolocation && (
              <div className="absolute bottom-1 left-1">
                <MapPinIcon className="w-3 h-3 text-white drop-shadow-md" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <PhotoViewer
          photos={photos}
          currentIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
          onDelete={editable ? handleDelete : undefined}
        />
      )}
    </>
  );
}

/**
 * Full-screen photo viewer with swipe navigation
 */
interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

function PhotoViewer({
  photos,
  currentIndex,
  onIndexChange,
  onClose,
  onDelete,
}: PhotoViewerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photo = photos[currentIndex];

  function handlePrev() {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }

  function handleNext() {
    if (currentIndex < photos.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }

  function handleDelete() {
    if (onDelete && photo) {
      onDelete(photo.id);
    }
  }

  function formatTimestamp(date: Date) {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <button
          onClick={onClose}
          className="text-white p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <span className="text-white font-medium">
          {currentIndex + 1} / {photos.length}
        </span>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-white p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Delete"
            >
              <TrashIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      <div 
        className="flex-1 flex items-center justify-center"
        onClick={() => setShowInfo(!showInfo)}
      >
        <img
          src={photo.annotatedImageData || photo.imageData}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* Info Panel */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${showInfo ? 'opacity-100' : 'opacity-100'}`}>
        <div className="space-y-2 text-white text-sm">
          {/* Timestamp */}
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-white/70" />
            <span>{formatTimestamp(photo.timestamp)}</span>
          </div>

          {/* Location */}
          {photo.geolocation ? (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-white/70" />
              <span>{formatGeolocation(photo.geolocation)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/50">
              <MapPinIcon className="w-4 h-4" />
              <span>Location not available</span>
            </div>
          )}

          {/* File size */}
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <PhotoIcon className="w-4 h-4" />
            <span>{formatFileSize(photo.fileSize)}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Delete Photo?</h3>
            <p className="text-slate-600">
              This action cannot be undone. The photo will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setConfirmDelete(false);
                }}
                className="flex-1 py-2 rounded-lg font-medium bg-danger-500 text-white hover:bg-danger-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline gallery for item cards - shows ALL photos
 */
interface InlinePhotoGalleryProps {
  photoIds: string[];
  onViewAll?: () => void;
}

export function InlinePhotoGallery({ photoIds, onViewAll }: InlinePhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPhotos() {
      if (photoIds.length === 0) {
        setPhotos([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      // Load ALL photos, not just first 4
      const loaded = await Promise.all(
        photoIds.map((id) => photoService.getById(id))
      );
      setPhotos(loaded.filter((p): p is Photo => p !== undefined));
      setLoading(false);
    }
    loadPhotos();
  }, [photoIds, photoIds.length]); // Re-run when photoIds changes

  if (loading && photoIds.length > 0) {
    return (
      <div className="flex items-center gap-2 mt-2">
        {photoIds.map((_, i) => (
          <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <>
      {/* Show ALL photos as thumbnails */}
      <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-300 transition-all border border-slate-200"
          >
            <img
              src={photo.thumbnailData || photo.imageData}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Full viewer when clicking a thumbnail */}
      {selectedIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          currentIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}

