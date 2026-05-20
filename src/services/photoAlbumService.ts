import { supabase } from './supabase';
import type { Photo } from '../types';
import { ensureSystemAlbum, isSystemAlbumName } from './systemAlbums';

export interface PhotoAlbum {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  photo_id: string;
  photo_url: string;
  photo_title: string | null;
  photo_width: number | null;
  photo_height: number | null;
  photo_color: string | null;
  added_at: string;
}

/**
 * Create a new photo album
 */
export const createAlbum = async (
  name: string,
  description?: string,
  coverImageUrl?: string
): Promise<PhotoAlbum | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('photo_albums')
      .insert({
        user_id: user.id,
        name,
        description,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating album:', error);
      return null;
    }

    return data as PhotoAlbum;
  } catch (error) {
    console.error('Error in createAlbum:', error);
    return null;
  }
};

/**
 * Get all albums for the current user
 */
export const fetchUserAlbums = async (userId: string): Promise<PhotoAlbum[]> => {
  try {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching albums:', error);
      return [];
    }

    return (data || []) as PhotoAlbum[];
  } catch (error) {
    console.error('Error in fetchUserAlbums:', error);
    return [];
  }
};

/**
 * Get a single album with its photos
 */
export const fetchAlbumWithPhotos = async (
  albumId: string
): Promise<{ album: PhotoAlbum | null; photos: AlbumPhoto[] }> => {
  try {
    const { data: albumData, error: albumError } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('id', albumId)
      .single();

    if (albumError) {
      console.error('Error fetching album:', albumError);
      return { album: null, photos: [] };
    }

    const { data: photosData, error: photosError } = await supabase
      .from('album_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('added_at', { ascending: false });

    if (photosError) {
      console.error('Error fetching album photos:', photosError);
      return { album: albumData as PhotoAlbum, photos: [] };
    }

    return {
      album: albumData as PhotoAlbum,
      photos: (photosData || []) as AlbumPhoto[],
    };
  } catch (error) {
    console.error('Error in fetchAlbumWithPhotos:', error);
    return { album: null, photos: [] };
  }
};

/**
 * Add a photo to an album
 */
export const addPhotoToAlbum = async (
  albumId: string,
  photo: Photo
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('album_photos')
      .upsert({
        album_id: albumId,
        photo_id: photo.id,
        photo_url: photo.urls.full || photo.urls.regular,
        photo_title: photo.alt_description,
        photo_width: photo.width,
        photo_height: photo.height,
        photo_color: photo.color,
      }, {
        onConflict: 'album_id,photo_id'
      });

    if (error) {
      console.error('Error adding photo to album:', error);
      return false;
    }

    // Update album's updated_at and cover_image_url only if not already set
    const { data: albumData } = await supabase
      .from('photo_albums')
      .select('cover_image_url')
      .eq('id', albumId)
      .single();

    if (!albumData?.cover_image_url) {
      await supabase
        .from('photo_albums')
        .update({
          updated_at: new Date().toISOString(),
          cover_image_url: photo.urls.full || photo.urls.regular,
        })
        .eq('id', albumId);
    } else {
      // Just update timestamp
      await supabase
        .from('photo_albums')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', albumId);
    }

    return true;
  } catch (error) {
    console.error('Error in addPhotoToAlbum:', error);
    return false;
  }
};

/**
 * Remove a photo from an album
 */
export const removePhotoFromAlbum = async (
  albumPhotoId: string
): Promise<boolean> => {
  try {
    // Get album_id before deleting
    const { data: row } = await supabase
      .from('album_photos')
      .select('album_id')
      .eq('id', albumPhotoId)
      .maybeSingle();

    const { error } = await supabase
      .from('album_photos')
      .delete()
      .eq('id', albumPhotoId);

    if (error) {
      console.error('Error removing photo from album:', error);
      return false;
    }

    // If album had a cover, check if it should be cleared
    if (row?.album_id) {
      const { count } = await supabase
        .from('album_photos')
        .select('*', { count: 'exact', head: true })
        .eq('album_id', row.album_id);

      if (count === 0) {
        await supabase
          .from('photo_albums')
          .update({ cover_image_url: null, updated_at: new Date().toISOString() })
          .eq('id', row.album_id);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in removePhotoFromAlbum:', error);
    return false;
  }
};

/**
 * Update album details
 */
export const updateAlbum = async (
  albumId: string,
  updates: Partial<Pick<PhotoAlbum, 'name' | 'description' | 'cover_image_url' | 'is_public'>>
): Promise<PhotoAlbum | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('photo_albums')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', albumId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating album:', error);
      return null;
    }

    return data as PhotoAlbum;
  } catch (error) {
    console.error('Error in updateAlbum:', error);
    return null;
  }
};

/**
 * Delete an album
 */
export const deleteAlbum = async (albumId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Prevent system albums from being deleted
    const { data: albumRecord } = await supabase
      .from('photo_albums')
      .select('name')
      .eq('id', albumId)
      .maybeSingle();

    if (albumRecord && isSystemAlbumName(albumRecord.name)) {
      console.warn('Attempt to delete system album was blocked');
      return false;
    }

    const { error } = await supabase
      .from('photo_albums')
      .delete()
      .eq('id', albumId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAlbum:', error);
    return false;
  }
};

/**
 * Get album photo count
 */
export const getAlbumPhotoCount = async (albumId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('album_photos')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', albumId);

    if (error) {
      console.error('Error fetching photo count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getAlbumPhotoCount:', error);
    return 0;
  }
};

/**
 * Search albums by name
 */
export const searchAlbums = async (
  userId: string,
  query: string
): Promise<PhotoAlbum[]> => {
  try {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error searching albums:', error);
      return [];
    }

    return (data || []) as PhotoAlbum[];
  } catch (error) {
    console.error('Error in searchAlbums:', error);
    return [];
  }
};

/**
 * Bulk add photos to an album (idempotent via upsert)
 */
export const addPhotosToAlbum = async (
  albumId: string,
  photos: Photo[]
): Promise<boolean> => {
  if (photos.length === 0) return true;

  try {
    const rows = photos.map((photo) => ({
      album_id: albumId,
      photo_id: photo.id,
      photo_url: photo.urls.full || photo.urls.regular,
      photo_title: photo.alt_description,
      photo_width: photo.width,
      photo_height: photo.height,
      photo_color: photo.color,
    }));

const { error } = await supabase
      .from('album_photos')
      .upsert(rows, { onConflict: 'album_id,photo_id' });

    if (error) {
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.warn('album_photos table write forbidden, trying insert');
        // Try insert as fallback — skip duplicates row by row
        for (const row of rows) {
          const { error: insertError } = await supabase
            .from('album_photos')
            .upsert(row, { onConflict: 'album_id,photo_id', ignoreDuplicates: true });
          
          if (insertError) {
            console.error('Error adding photo to album:', insertError);
          }
        }
      } else {
        console.error('Error bulk adding photos to album:', error);
        return false;
      }
    }

    const { data: albumData } = await supabase
      .from('photo_albums')
      .select('cover_image_url')
      .eq('id', albumId)
      .single();

    if (!albumData?.cover_image_url) {
      await supabase
        .from('photo_albums')
        .update({
          updated_at: new Date().toISOString(),
          cover_image_url: rows[0]?.photo_url,
        })
        .eq('id', albumId);
    } else {
      await supabase
        .from('photo_albums')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', albumId);
    }

    return true;
  } catch (error) {
    console.error('Error in addPhotosToAlbum:', error);
    return false;
  }
};

/**
 * Remove a photo from an album using photo_id (helper for sync)
 */
export const removePhotoFromAlbumByPhotoId = async (
  albumId: string,
  photoId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('album_photos')
      .delete()
      .eq('album_id', albumId)
      .eq('photo_id', photoId);

    if (error) {
      console.error('Error removing photo by id from album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removePhotoFromAlbumByPhotoId:', error);
    return false;
  }
};

/**
 * Ensure a system album exists and return it.
 */
export const ensureAlbumForUser = async (
  userId: string,
  type: 'saved' | 'history' | 'loved'
): Promise<PhotoAlbum | null> => ensureSystemAlbum(userId, type);
