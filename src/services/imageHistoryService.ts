import { supabase } from './supabase';
import type { Photo } from '../types';

export interface ImageHistoryRecord {
  id: string;
  user_id: string;
  image_id: string;
  image_url: string;
  image_title: string | null;
  image_width: number | null;
  image_height: number | null;
  image_color: string | null;
  image_description: string | null;
  source: string;
  viewed_at: string;
  created_at: string;
}

/**
 * Record a viewed image in the user's history
 */
export const recordImageView = async (
  photo: Photo,
  source: string = 'unsplash'
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('image_history')
      .upsert({
        user_id: user.id,
        image_id: photo.id,
        image_url: photo.urls.full || photo.urls.regular,
        image_title: photo.alt_description,
        image_width: photo.width,
        image_height: photo.height,
        image_color: photo.color,
        image_description: photo.alt_description,
        source: source,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,image_id'
      });

    if (error) {
      console.error('Error recording image view:', error);
      return false;
    }

    console.log('Image view recorded successfully');
    return true;
  } catch (error) {
    console.error('Error in recordImageView:', error);
    return false;
  }
};

/**
 * Fetch user's image history with pagination
 */
export const fetchImageHistory = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ImageHistoryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('image_history')
      .select('*')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching image history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchImageHistory:', error);
    return [];
  }
};

/**
 * Get total count of images in history
 */
export const getImageHistoryCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('image_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching history count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getImageHistoryCount:', error);
    return 0;
  }
};

/**
 * Delete a single image from history
 */
export const deleteImageFromHistory = async (historyId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('image_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting image from history:', error);
      return false;
    }

    console.log('Image deleted from history successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteImageFromHistory:', error);
    return false;
  }
};

/**
 * Clear entire image history for user
 */
export const clearImageHistory = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('image_history')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing image history:', error);
      return false;
    }

    console.log('Image history cleared successfully');
    return true;
  } catch (error) {
    console.error('Error in clearImageHistory:', error);
    return false;
  }
};

/**
 * Search image history by title or description
 */
export const searchImageHistory = async (
  userId: string,
  query: string,
  limit: number = 50
): Promise<ImageHistoryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('image_history')
      .select('*')
      .eq('user_id', userId)
      .or(`image_title.ilike.%${query}%,image_description.ilike.%${query}%`)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching image history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchImageHistory:', error);
    return [];
  }
};

/**
 * Get recently viewed images (last N images)
 */
export const getRecentlyViewed = async (userId: string, limit: number = 10): Promise<ImageHistoryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('image_history')
      .select('*')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recently viewed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentlyViewed:', error);
    return [];
  }
};
