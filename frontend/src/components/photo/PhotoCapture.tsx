import { useRef, useState } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { photoService } from '../../services/photoService';
import type { GeoLocation } from '../../types/photo';

interface PhotoCaptureProps {
  inspectionId: string;
  sectionId?: string;
  itemId?: string;
  onPhotoAdded: (photoId: string) => void;
  onClose?: () => void;
}

export function PhotoCapture({
  inspectionId,
  sectionId,
  itemId,
  onPhotoAdded,
  onClose,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [geolocation, setGeolocation] = useState<GeoLocation | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessing(true);

    try {
      // Convert file to base64
      const imageData = await photoService.fileToBase64(file);
      
      // Get geolocation
      setLocationStatus('pending');
      const location = await photoService.getCurrentLocation();
      if (location) {
        setGeolocation(location);
        setLocationStatus('granted');
      } else {
        setLocationStatus('unavailable');
      }

      // Show preview
      setPreviewImage(imageData);
    } catch (err) {
      console.error('Error processing photo:', err);
      setError('Failed to process photo. Please try again.');
      setProcessing(false);
    }
  }

  async function handleSavePhoto() {
    if (!previewImage) return;

    setProcessing(true);
    setError(null);

    try {
      // Compress the image
      const compressedImage = await photoService.compressImage(previewImage, 1920, 0.8);

      // Create the photo
      const photo = await photoService.create(inspectionId, compressedImage, {
        sectionId,
        itemId,
        geolocation: geolocation || undefined,
      });

      onPhotoAdded(photo.id);
      
      // Reset state
      setPreviewImage(null);
      setGeolocation(null);
      setProcessing(false);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error saving photo:', err);
      setError('Failed to save photo. Please try again.');
      setProcessing(false);
    }
  }

  function handleCancel() {
    setPreviewImage(null);
    setGeolocation(null);
    setError(null);
    setProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose?.();
  }

  function triggerCapture() {
    fileInputRef.current?.click();
  }

  // Preview mode - show captured image with save/cancel options
  if (previewImage) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80">
          <button
            onClick={handleCancel}
            className="text-white p-2"
            aria-label="Cancel"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <span className="text-white font-medium">Preview</span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Image Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Location Status */}
        <div className="p-4 bg-black/80">
          <div className="flex items-center gap-2 text-sm mb-4">
            <MapPinIcon className="w-4 h-4 text-white" />
            {locationStatus === 'pending' && (
              <span className="text-yellow-400">Getting location...</span>
            )}
            {locationStatus === 'granted' && geolocation && (
              <span className="text-green-400">
                {geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)}
              </span>
            )}
            {locationStatus === 'denied' && (
              <span className="text-red-400">Location denied</span>
            )}
            {locationStatus === 'unavailable' && (
              <span className="text-gray-400">Location unavailable</span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl font-semibold bg-white/20 text-white"
              disabled={processing}
            >
              Retake
            </button>
            <button
              onClick={handleSavePhoto}
              disabled={processing}
              className="flex-1 py-3 rounded-xl font-semibold bg-primary-500 text-white disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Use Photo'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Capture mode - show capture button
  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-danger-500 text-sm p-3 bg-danger-50 rounded-lg">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Capture buttons */}
      <div className="flex gap-2">
        <button
          onClick={triggerCapture}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {processing ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CameraIcon className="w-5 h-5" />
              Take Photo
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Photos include timestamp and location (if permitted)
      </p>
    </div>
  );
}

/**
 * Compact photo capture button for inline use
 */
interface PhotoCaptureButtonProps {
  inspectionId: string;
  sectionId?: string;
  itemId?: string;
  photoCount: number;
  onPhotoAdded: (photoId: string) => void;
}

export function PhotoCaptureButton({
  inspectionId,
  sectionId,
  itemId,
  photoCount,
  onPhotoAdded,
}: PhotoCaptureButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      // Convert and compress in one go
      const imageData = await photoService.fileToBase64(file);
      const compressedImage = await photoService.compressImage(imageData, 1920, 0.8);
      
      // Get geolocation (non-blocking)
      const location = await photoService.getCurrentLocation();

      // Create the photo
      const photo = await photoService.create(inspectionId, compressedImage, {
        sectionId,
        itemId,
        geolocation: location || undefined,
      });

      onPhotoAdded(photo.id);
    } catch (err) {
      console.error('Error capturing photo:', err);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={processing}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          photoCount > 0
            ? 'bg-primary-50 text-primary-600'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {processing ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <CameraIcon className="w-4 h-4" />
        )}
        {photoCount > 0 ? `${photoCount} Photo${photoCount > 1 ? 's' : ''}` : 'Photo'}
      </button>
    </>
  );
}

