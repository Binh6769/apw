/**
 * Image Synchronization Hook
 * Ensures images remain consistent across page navigation
 * Fixes: Images changing when navigating between pages
 */

import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  syncPhotoAcrossPages,
  imageRepository,
  getPhotoCacheKey,
  verifyPhotoSignature,
  type StandardizedPhoto,
} from '../services/imageConsistencyService';
import type { Photo } from '../types';

interface UseImageSyncOptions {
  enableCache?: boolean;
  enableTracking?: boolean;
  enableVerification?: boolean;
  debugMode?: boolean;
}

/**
 * Hook to synchronize images across pages
 * Ensures clicked images maintain their identity during navigation
 */
export function useImageSync(
  currentPage: string,
  source: 'grid' | 'detail' | 'recommend' | 'search' | 'home' = 'home',
  options: UseImageSyncOptions = {}
) {
  const {
    enableCache = true,
    enableTracking = true,
    enableVerification = true,
    debugMode = false,
  } = options;

  const navigate = useNavigate();
  const syncedPhotosRef = useRef<Map<string, StandardizedPhoto>>(new Map());
  const navigationHistoryRef = useRef<string[]>([currentPage]);

  /**
   * Sync photo for consistency
   */
  const syncPhoto = useCallback(
    (photo: Photo): StandardizedPhoto => {
      if (!enableCache) {
        // Direct standardization without caching
        const standardized = syncPhotoAcrossPages(photo, {
          page: currentPage,
          source,
          label: 'primary',
        });
        return standardized;
      }

      // Use caching for consistency
      const cacheKey = getPhotoCacheKey(photo);
      const cached = syncedPhotosRef.current.get(cacheKey);

      if (cached && enableVerification) {
        // Verify cached photo still matches
        if (verifyPhotoSignature(photo, cached._signature)) {
          if (debugMode) {
            console.log('✅ Photo found in sync cache:', cacheKey);
          }
          return cached;
        }
      }

      // Not in cache, sync new photo
      const synced = syncPhotoAcrossPages(photo, {
        page: currentPage,
        source,
        label: 'primary',
      });

      syncedPhotosRef.current.set(cacheKey, synced);

      if (debugMode) {
        console.log('📌 Photo synced and cached:', cacheKey);
      }

      return synced;
    },
    [enableCache, enableVerification, currentPage, source, debugMode]
  );

  /**
   * Get synced photo from cache or sync it
   */
  const getSyncedPhoto = useCallback(
    (photo: Photo): StandardizedPhoto | null => {
      const cacheKey = getPhotoCacheKey(photo);
      return syncedPhotosRef.current.get(cacheKey) || null;
    },
    []
  );

  /**
   * Navigate to detail page with image synchronization
   */
  const navigateWithImageSync = useCallback(
    (photo: StandardizedPhoto, targetPath: string) => {
      if (enableTracking && photo._tracker) {
        // Update tracker before navigation
        const updatedTracker = {
          ...photo._tracker,
          viewedPages: [...photo._tracker.viewedPages, targetPath],
          lastAccessedPage: targetPath,
          accessCount: photo._tracker.accessCount + 1,
        };

        if (debugMode) {
          console.log('🔄 Tracking navigation to:', targetPath);
          console.log('📊 Tracker:', updatedTracker);
        }
      }

      // Update navigation history
      navigationHistoryRef.current.push(targetPath);

      // Navigate
      navigate(targetPath);
    },
    [navigate, enableTracking, debugMode]
  );

  /**
   * Batch sync multiple photos (for grid/list rendering)
   */
  const syncPhotoBatch = useCallback(
    (photos: Photo[]): StandardizedPhoto[] => {
      return photos.map((photo) => syncPhoto(photo));
    },
    [syncPhoto]
  );

  /**
   * Verify multiple photos are synced
   */
  const verifyPhotosBatch = useCallback(
    (photos: StandardizedPhoto[]): {
      allSynced: boolean;
      syncedCount: number;
      unsyncedPhotos: StandardizedPhoto[];
    } => {
      const results = {
        allSynced: true,
        syncedCount: 0,
        unsyncedPhotos: [] as StandardizedPhoto[],
      };

      for (const photo of photos) {
        if (
          photo._signature &&
          verifyPhotoSignature(photo, photo._signature)
        ) {
          results.syncedCount++;
        } else {
          results.allSynced = false;
          results.unsyncedPhotos.push(photo);
        }
      }

      return results;
    },
    []
  );

  /**
   * Clear specific photo from sync cache
   */
  const clearSyncedPhoto = useCallback((photo: Photo | string) => {
    const cacheKey =
      typeof photo === 'string'
        ? photo
        : getPhotoCacheKey(photo as Photo);
    syncedPhotosRef.current.delete(cacheKey);

    if (debugMode) {
      console.log('🗑️ Photo removed from sync cache:', cacheKey);
    }
  }, [debugMode]);

  /**
   * Clear all synced photos
   */
  const clearAllSyncedPhotos = useCallback(() => {
    syncedPhotosRef.current.clear();
    if (debugMode) {
      console.log('🗑️ All synced photos cleared');
    }
  }, [debugMode]);

  /**
   * Get sync statistics
   */
  const getSyncStats = useCallback(() => {
    return {
      localCacheSize: syncedPhotosRef.current.size,
      repositoryCacheSize: imageRepository.getStats().cachedImages,
      navigationHistory: navigationHistoryRef.current,
      totalSynced: syncedPhotosRef.current.size,
    };
  }, []);

  /**
   * Log sync information (debug)
   */
  const logSyncInfo = useCallback(() => {
    if (!debugMode) {
      console.warn('Debug mode not enabled');
      return;
    }

    const stats = getSyncStats();
    console.group('📊 Image Sync Statistics');
    console.log('Local Cache:', stats.localCacheSize);
    console.log('Repository Cache:', stats.repositoryCacheSize);
    console.log('Navigation History:', stats.navigationHistory);
    console.table(Array.from(syncedPhotosRef.current.values()));
    console.groupEnd();
  }, [debugMode, getSyncStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: clear cache on page change
      // syncedPhotosRef.current.clear();
    };
  }, []);

  return {
    // Core methods
    syncPhoto,
    getSyncedPhoto,
    syncPhotoBatch,
    navigateWithImageSync,

    // Verification
    verifyPhotosBatch,

    // Cache management
    clearSyncedPhoto,
    clearAllSyncedPhotos,

    // Diagnostics
    getSyncStats,
    logSyncInfo,
  };
}

/**
 * Hook to restore image from previous navigation
 * Useful for back button functionality
 */
export function useImageNavigation(enableLogging?: boolean) {
  const previousImageRef = useRef<StandardizedPhoto | null>(null);
  const navigationStackRef = useRef<StandardizedPhoto[]>([]);

  const pushImage = useCallback((photo: StandardizedPhoto) => {
    previousImageRef.current = photo;
    navigationStackRef.current.push(photo);

    if (enableLogging) {
      console.log('📍 Image pushed to stack:', photo._imageId);
    }
  }, [enableLogging]);

  const popImage = useCallback((): StandardizedPhoto | null => {
    const image = navigationStackRef.current.pop();

    if (enableLogging) {
      console.log('⬅️ Image popped from stack:', image?._imageId);
    }

    return image || null;
  }, [enableLogging]);

  const getPreviousImage = useCallback((): StandardizedPhoto | null => {
    return previousImageRef.current;
  }, []);

  const peekStack = useCallback((): StandardizedPhoto[] => {
    return [...navigationStackRef.current];
  }, []);

  return {
    pushImage,
    popImage,
    getPreviousImage,
    peekStack,
  };
}
