// Legacy wrapper for compatibility - images are user-uploaded and stored in Supabase only
import { fetchPinsFromSupabase, fetchPinById, fetchUserPins, fetchSavedPins, fetchPinsByCategory, createPin, deletePin, savePin, unsavePin, isPinSaved, updatePin } from '../services/pinsService';
import type { Photo } from '../types';

export const fetchPhotos = async (page: number = 1, query: string = ''): Promise<Photo[]> => {
  return fetchPinsFromSupabase(page, 20, query);
};

export const fetchPhotoById = async (id: string): Promise<Photo | null> => {
  return fetchPinById(id);
};

// Fetch related photos by category (More like this)
export const fetchRelatedPhotos = async (id: string): Promise<{ items: Photo[]; hasMore: boolean }> => {
  const pin = await fetchPinById(id);
  if (!pin) return { items: [], hasMore: false };
  
  // Fetch pins with same category
  const category = pin.category || pin.tags?.[0] || '';
  if (!category) {
    // If no category, fetch recent pins as fallback
    const recentPins = await fetchPinsFromSupabase(1, 12, '');
    return {
      items: recentPins.filter(p => p.id !== id).slice(0, 12),
      hasMore: false,
    };
  }
  
  const relatedPins = await fetchPinsByCategory(category, id, 12);
  
  return {
    items: relatedPins,
    hasMore: false,
  };
};

export { fetchUserPins, fetchSavedPins, createPin, deletePin, savePin, unsavePin, isPinSaved, updatePin };