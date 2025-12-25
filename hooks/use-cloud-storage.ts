/**
 * Cloud Storage Hook
 * Piano Emotion Manager
 * 
 * Hook for uploading images and files to Cloudflare R2 with compression.
 * Integrates with subscription system to check storage access.
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { trpc } from '@/lib/trpc';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  originalSize?: number;
  compressionRatio?: number;
  mimeType: string;
  filename: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseCloudStorageOptions {
  /** Folder prefix for organizing files */
  folder?: string;
  /** Whether to compress images before upload */
  compress?: boolean;
  /** Maximum image width after compression */
  maxWidth?: number;
  /** Maximum image height after compression */
  maxHeight?: number;
  /** Image quality (0-100) */
  quality?: number;
}

const DEFAULT_OPTIONS: UseCloudStorageOptions = {
  folder: 'uploads',
  compress: true,
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
};

export function useCloudStorage(options: UseCloudStorageOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { checkFeatureAccess, hasFeature } = useSubscriptionContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // tRPC mutation for uploading
  const uploadMutation = trpc.storage.uploadImage.useMutation();
  const deleteMutation = trpc.storage.deleteFile.useMutation();
  const getUrlMutation = trpc.storage.getSignedUrl.useMutation();
  
  /**
   * Check if user has storage access
   */
  const hasStorageAccess = useCallback(() => {
    return hasFeature('image_storage');
  }, [hasFeature]);
  
  /**
   * Request storage access (shows upgrade modal if not available)
   */
  const requestStorageAccess = useCallback(() => {
    return checkFeatureAccess('image_storage');
  }, [checkFeatureAccess]);
  
  /**
   * Pick an image from the device gallery
   */
  const pickImage = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    // Check storage access first
    if (!requestStorageAccess()) {
      return null;
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Se requiere permiso para acceder a la galería');
      return null;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: opts.quality ? opts.quality / 100 : 0.8,
    });
    
    if (result.canceled || !result.assets[0]) {
      return null;
    }
    
    return result.assets[0];
  }, [opts.quality, requestStorageAccess]);
  
  /**
   * Take a photo with the camera
   */
  const takePhoto = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    // Check storage access first
    if (!requestStorageAccess()) {
      return null;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Se requiere permiso para acceder a la cámara');
      return null;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: opts.quality ? opts.quality / 100 : 0.8,
    });
    
    if (result.canceled || !result.assets[0]) {
      return null;
    }
    
    return result.assets[0];
  }, [opts.quality, requestStorageAccess]);
  
  /**
   * Upload an image to R2 storage
   */
  const uploadImage = useCallback(async (
    asset: ImagePicker.ImagePickerAsset,
    customFilename?: string
  ): Promise<UploadedFile | null> => {
    // Check storage access
    if (!hasStorageAccess()) {
      requestStorageAccess();
      return null;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 });
    
    try {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      const originalSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;
      
      // Determine filename and mime type
      const extension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = getMimeType(extension);
      const filename = customFilename || `image_${Date.now()}.${extension}`;
      
      setUploadProgress({ loaded: 30, total: 100, percentage: 30 });
      
      // Upload via tRPC
      const result = await uploadMutation.mutateAsync({
        base64Data: base64,
        filename,
        mimeType,
        folder: opts.folder || 'uploads',
        compress: opts.compress,
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
        quality: opts.quality,
      });
      
      setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
      
      return {
        key: result.key,
        url: result.url,
        size: result.size,
        originalSize: originalSize || undefined,
        compressionRatio: originalSize ? originalSize / result.size : undefined,
        mimeType,
        filename,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [hasStorageAccess, requestStorageAccess, uploadMutation, opts]);
  
  /**
   * Pick and upload an image in one step
   */
  const pickAndUpload = useCallback(async (
    customFilename?: string
  ): Promise<UploadedFile | null> => {
    const asset = await pickImage();
    if (!asset) return null;
    return uploadImage(asset, customFilename);
  }, [pickImage, uploadImage]);
  
  /**
   * Take a photo and upload it in one step
   */
  const captureAndUpload = useCallback(async (
    customFilename?: string
  ): Promise<UploadedFile | null> => {
    const asset = await takePhoto();
    if (!asset) return null;
    return uploadImage(asset, customFilename);
  }, [takePhoto, uploadImage]);
  
  /**
   * Delete a file from storage
   */
  const deleteFile = useCallback(async (key: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync({ key });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el archivo';
      setError(message);
      return false;
    }
  }, [deleteMutation]);
  
  /**
   * Get a signed URL for a file
   */
  const getSignedUrl = useCallback(async (
    key: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    try {
      const result = await getUrlMutation.mutateAsync({ key, expiresIn });
      return result.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener URL';
      setError(message);
      return null;
    }
  }, [getUrlMutation]);
  
  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // State
    isUploading,
    uploadProgress,
    error,
    
    // Access checks
    hasStorageAccess,
    requestStorageAccess,
    
    // Image picking
    pickImage,
    takePhoto,
    
    // Upload operations
    uploadImage,
    pickAndUpload,
    captureAndUpload,
    
    // File operations
    deleteFile,
    getSignedUrl,
    
    // Utilities
    clearError,
  };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export default useCloudStorage;
