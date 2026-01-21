/**
 * Image Identifier and Synchronization System
 * Ensures consistent image tracking across page navigation
 * Fixes: Images changing when navigating between pages
 */

import type { Photo } from '../types';

/**
 * Generate consistent unique image ID based on source
 * This ensures the SAME image ID across all pages and navigations
 */
export const generateImageId = (photo: Photo): string => {
  // Use source-specific ID generation to ensure consistency
  const sources = {
    unsplash: () => `unsplash-${photo.id}`,
    jikan: () => `jikan-${photo.id}`,
    waifu: () => `waifu-${photo.id}`,
    pexels: () => `pexels-${photo.id}`,
    pixabay: () => `pixabay-${photo.id}`,
    supabase: () => `pin-${photo.id}`,
    mock: () => `mock-${photo.id}`,
    default: () => `img-${btoa(photo.urls?.regular || (photo as any).image_url || '').substring(0, 16)}`,
  };

  // Determine source and generate ID
  if (photo.id?.includes('mock')) return sources.mock();
  if ((photo as any).user?.username) return sources.unsplash();
  if ((photo as any).mal_id) return sources.jikan();
  if ((photo as any).image_id) return sources.waifu();
  if ((photo as any).created_at) return sources.supabase();

  return sources.default();
};

/**
 * Photo signature: Unique, immutable identifier for image content
 * Used to verify photo consistency across navigation
 */
export interface PhotoSignature {
  id: string; // Unique image ID
  contentHash: string; // Hash of image content metadata
  sourceId: string; // Original source ID
  imageUrl: string; // URL of image
  timestamp: number; // When tracked
  pageSource: string; // Page where image was loaded
  checksum: string; // Verification checksum
}

/**
 * Generate a signature for a photo - immutable identifier
 * This ensures image consistency across page navigations
 */
export const generatePhotoSignature = (
  photo: Photo,
  pageSource: string = 'unknown'
): PhotoSignature => {
  const imageId = generateImageId(photo);
  const imageUrl = photo.urls?.regular || (photo as any).image_url || '';
  
  // Create content hash from photo metadata
  const contentData = JSON.stringify({
    id: photo.id,
    title: (photo as any).title,
    color: (photo as any).color,
    width: photo.width,
    height: photo.height,
  });

  // Simple hash function for content
  const contentHash = btoa(contentData).substring(0, 32);
  
  // Create checksum for verification
  const checksumData = `${imageId}${imageUrl}${contentHash}`;
  const checksum = btoa(checksumData).substring(0, 16);

  return {
    id: imageId,
    contentHash,
    sourceId: photo.id,
    imageUrl,
    timestamp: Date.now(),
    pageSource,
    checksum,
  };
};

/**
 * Verify photo consistency using signature
 * Ensures photo hasn't changed between page navigations
 */
export const verifyPhotoSignature = (
  photo: Photo,
  signature: PhotoSignature
): boolean => {
  const newSignature = generatePhotoSignature(photo);
  
  return (
    newSignature.id === signature.id &&
    newSignature.contentHash === signature.contentHash &&
    newSignature.checksum === signature.checksum
  );
};

/**
 * Photo Cache Key - for consistent caching
 * Format: source|id|url_hash
 */
export const getPhotoCacheKey = (photo: Photo): string => {
  const imageId = generateImageId(photo);
  const imageUrl = photo.urls?.regular || (photo as any).image_url || '';
  const urlHash = btoa(imageUrl).substring(0, 12);
  
  return `${imageId}|${urlHash}`;
};

/**
 * Track image through navigation
 */
export interface ImageTracker {
  cacheKey: string;
  signature: PhotoSignature;
  loadedAt: number;
  viewedPages: string[];
  lastAccessedPage: string;
  accessCount: number;
}

/**
 * Create image tracker for monitoring across pages
 */
export const createImageTracker = (
  photo: Photo,
  currentPage: string
): ImageTracker => {
  const cacheKey = getPhotoCacheKey(photo);
  const signature = generatePhotoSignature(photo, currentPage);

  return {
    cacheKey,
    signature,
    loadedAt: Date.now(),
    viewedPages: [currentPage],
    lastAccessedPage: currentPage,
    accessCount: 1,
  };
};

/**
 * Update tracker on page navigation
 */
export const updateImageTracker = (
  tracker: ImageTracker,
  newPage: string
): ImageTracker => {
  const viewedPages = tracker.viewedPages.includes(newPage)
    ? tracker.viewedPages
    : [...tracker.viewedPages, newPage];

  return {
    ...tracker,
    lastAccessedPage: newPage,
    viewedPages,
    accessCount: tracker.accessCount + 1,
  };
};

/**
 * Image Metadata Marker - Mark images with consistency labels
 */
export interface ImageMarker {
  imageId: string;
  label: 'primary' | 'thumbnail' | 'preview' | 'detail' | 'original';
  size: { width: number; height: number };
  format: 'jpg' | 'png' | 'gif' | 'webp' | 'svg';
  markedAt: number;
  markedBy: string; // Component/page that marked it
  tags: string[];
}

/**
 * Mark image with metadata for consistent identification
 */
export const markImage = (
  photo: Photo,
  label: ImageMarker['label'],
  markedBy: string,
  tags: string[] = []
): ImageMarker => {
  const imageId = generateImageId(photo);
  
  const sizeMap: Record<string, { width: number; height: number }> = {
    thumbnail: { width: 200, height: 150 },
    preview: { width: 400, height: 300 },
    primary: { width: 800, height: 600 },
    detail: { width: 1200, height: 900 },
    original: { width: photo.width || 1200, height: photo.height || 900 },
  };

  return {
    imageId,
    label,
    size: sizeMap[label],
    format: 'jpg',
    markedAt: Date.now(),
    markedBy,
    tags: ['synced', ...tags],
  };
};

/**
 * Standardized Photo Object with Identity
 * Ensures same data structure across all pages
 */
export interface StandardizedPhoto extends Photo {
  _imageId: string; // Consistent image ID
  _signature: PhotoSignature; // Photo signature
  _marker?: ImageMarker; // Marking info
  _tracker?: ImageTracker; // Navigation tracking
  _synced: boolean; // Sync status
}

/**
 * Standardize photo object for consistency
 * This is applied to every photo when fetched
 */
export const standardizePhoto = (
  photo: Photo,
  context: {
    page: string;
    source: 'grid' | 'detail' | 'recommend' | 'search' | 'home';
    label?: ImageMarker['label'];
  }
): StandardizedPhoto => {
  const imageId = generateImageId(photo);
  const signature = generatePhotoSignature(photo, context.page);
  const marker = markImage(photo, context.label || 'primary', context.page);
  const tracker = createImageTracker(photo, context.page);

  return {
    ...photo,
    _imageId: imageId,
    _signature: signature,
    _marker: marker,
    _tracker: tracker,
    _synced: true,
  };
};

/**
 * Verify photo is properly synced across navigation
 */
export const isPhotoSynced = (photo: StandardizedPhoto): boolean => {
  if (!photo._synced || !photo._signature) return false;
  
  // Verify signature consistency
  return verifyPhotoSignature(photo, photo._signature);
};

/**
 * Image Consistency Repository
 * In-memory cache for tracking images across navigations
 */
class ImageConsistencyRepository {
  private imageCache: Map<string, StandardizedPhoto> = new Map();
  private signatureMap: Map<string, PhotoSignature> = new Map();
  private trackerMap: Map<string, ImageTracker> = new Map();
  private maxCacheSize = 500; // Keep last 500 viewed images

  /**
   * Store or retrieve image from cache
   */
  public getOrStorePhoto(photo: Photo, context: any): StandardizedPhoto {
    const cacheKey = getPhotoCacheKey(photo);

    // Try to retrieve from cache
    const cached = this.imageCache.get(cacheKey);
    if (cached) {
      // Update tracker with new page navigation
      if (cached._tracker) {
        cached._tracker = updateImageTracker(cached._tracker, context.page);
      }
      return cached;
    }

    // Not in cache, standardize and store
    const standardized = standardizePhoto(photo, context);
    this.storePhoto(cacheKey, standardized);

    return standardized;
  }

  /**
   * Store photo in cache
   */
  private storePhoto(cacheKey: string, photo: StandardizedPhoto): void {
    // Maintain max cache size
    if (this.imageCache.size >= this.maxCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
        this.signatureMap.delete(firstKey);
        this.trackerMap.delete(firstKey);
      }
    }

    this.imageCache.set(cacheKey, photo);
    if (photo._signature) {
      this.signatureMap.set(cacheKey, photo._signature);
    }
    if (photo._tracker) {
      this.trackerMap.set(cacheKey, photo._tracker);
    }
  }

  /**
   * Get photo stats for debugging
   */
  public getStats() {
    return {
      cachedImages: this.imageCache.size,
      totalSignatures: this.signatureMap.size,
      totalTrackers: this.trackerMap.size,
      cacheSize: Array.from(this.imageCache.values()).length,
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.imageCache.clear();
    this.signatureMap.clear();
    this.trackerMap.clear();
  }

  /**
   * Get cache keys with filters
   */
  public getCacheKeys(
    filter?: (photo: StandardizedPhoto) => boolean
  ): string[] {
    const keys = Array.from(this.imageCache.keys());
    if (!filter) return keys;

    return keys.filter((key) => {
      const photo = this.imageCache.get(key);
      return photo && filter(photo);
    });
  }

  /**
   * Get all cached photos
   */
  public getAllPhotos(): StandardizedPhoto[] {
    return Array.from(this.imageCache.values());
  }
}

// Singleton instance
export const imageRepository = new ImageConsistencyRepository();

/**
 * Synchronize photo across pages
 * Main function to use when loading/displaying photos
 */
export const syncPhotoAcrossPages = (
  photo: Photo,
  context: {
    page: string;
    source: 'grid' | 'detail' | 'recommend' | 'search' | 'home';
    label?: ImageMarker['label'];
  }
): StandardizedPhoto => {
  // Use repository to get consistent photo
  const synced = imageRepository.getOrStorePhoto(photo, context);

  // Verify it's properly synced
  if (!isPhotoSynced(synced)) {
    console.warn('Photo sync verification failed:', synced._imageId);
  }

  return synced;
};
