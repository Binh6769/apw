import { supabase } from './supabase';
import type { Photo } from '../types';

interface Pin {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  image_width: number;
  image_height: number;
  image_color: string | null;
  source_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const craftDescription = (pin: Pin) => {
  const parts = [
    pin.title,
    pin.description,
    pin.category ? `Category: ${pin.category}` : null,
    pin.image_color ? `Palette ${pin.image_color}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return 'Visual inspiration from the community.';

  const uniqueParts = Array.from(new Set(parts.map((p) => p?.trim()))).slice(0, 3);
  return uniqueParts.join(' | ');
};

// Convert Pin to Photo format for display
const convertPinToPhoto = (pin: Pin, userProfile?: UserProfile): Photo => {
  const userName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Anonymous'
    : 'Anonymous';

  return {
    id: pin.id,
    urls: {
      raw: pin.image_url,
      full: pin.image_url,
      regular: pin.image_url,
      small: pin.image_url,
      thumb: pin.image_url,
    },
    width: pin.image_width,
    height: pin.image_height,
    color: pin.image_color || '#e8e8e8',
    alt_description: craftDescription(pin),
    user: {
      name: userName,
      username: userProfile?.user_id || 'user',
      profile_image: {
        small: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        medium: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        large: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      },
    },
  };
};

// Fetch pins with pagination
export const fetchPinsFromSupabase = async (
  page: number = 1,
  limit: number = 20,
  searchQuery?: string
): Promise<Photo[]> => {
  try {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('pins')
      .select(
        `
        id,
        user_id,
        title,
        description,
        image_url,
        image_width,
        image_height,
        image_color,
        source_url,
        category,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false })
      .range(start, end);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pins:', error);
      return [];
    }

    if (!data) return [];

    // Fetch user profiles separately
    const userIds = [...new Set(data.map(pin => pin.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    return data.map((pin: any) => 
      convertPinToPhoto(
        pin,
        profileMap.get(pin.user_id) || undefined
      )
    );
  } catch (error) {
    console.error('Error in fetchPinsFromSupabase:', error);
    return [];
  }
};

// Fetch user's created pins
export const fetchUserPins = async (userId: string): Promise<Photo[]> => {
  try {
    const { data, error } = await supabase
      .from('pins')
      .select(
        `
        id,
        user_id,
        title,
        description,
        image_url,
        image_width,
        image_height,
        image_color,
        source_url,
        category,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user pins:', error);
      return [];
    }

    if (!data) return [];

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data.map((pin: any) =>
      convertPinToPhoto(
        pin,
        profileData || undefined
      )
    );
  } catch (error) {
    console.error('Error in fetchUserPins:', error);
    return [];
  }
};

// Internal helper to allow temporary fallback while the new saved_images table rolls out
const withSavedTable = async <T extends { data?: any; error?: any }>(
  handler: (table: 'saved_images' | 'saved_pins') => Promise<T>
): Promise<T> => {
  const primary = await handler('saved_images');
  if ((primary as any)?.error && (primary as any).error.message?.includes('saved_images')) {
    console.warn('saved_images table unavailable, falling back to saved_pins');
    return handler('saved_pins');
  }
  return primary;
};

// Fetch user's saved pins (persisted in saved_images table)
export const fetchSavedPins = async (userId: string): Promise<Photo[]> => {
  try {
    const { data, error } = await withSavedTable(async (table) => {
      const response = await supabase
        .from(table)
        .select(
          `
          pin_id,
          pins (
            id,
            user_id,
            title,
            description,
            image_url,
            image_width,
            image_height,
            image_color,
            source_url,
            category,
            created_at,
            updated_at
          )
        `
        )
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });
      return response;
    });

    if (error) {
      console.error('Error fetching saved pins:', error);
      return [];
    }

    if (!data) return [];

    // Get all unique user IDs from pins
    const userIds = [...new Set((data || []).map((saved: any) => saved.pins?.user_id).filter(Boolean))];
    
    // Fetch all user profiles in one query
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    return data
      .map((saved: any) => {
        const pin = saved.pins;
        return convertPinToPhoto(
          pin,
          profileMap.get(pin.user_id) || undefined
        );
      })
      .filter((photo): photo is Photo => photo !== null);
  } catch (error) {
    console.error('Error in fetchSavedPins:', error);
    return [];
  }
};

// Create a new pin
export const createPin = async (
  title: string,
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
  description?: string,
  category?: string,
  imageColor?: string,
  sourceUrl?: string
): Promise<Pin | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pins')
      .insert({
        user_id: user.id,
        title,
        description,
        image_url: imageUrl,
        image_width: imageWidth,
        image_height: imageHeight,
        image_color: imageColor,
        category,
        source_url: sourceUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pin:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPin:', error);
    return null;
  }
};

// Ensure a photo exists as a pin and return the pin ID
export const ensurePinExists = async (photo: Photo): Promise<string | null> => {
  try {
    if (UUID_REGEX.test(photo.id)) {
      const { data, error } = await supabase
        .from('pins')
        .select('id')
        .eq('id', photo.id)
        .single();

      if (data?.id) return data.id;
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pin existence:', error);
      }
    }

    const title = photo.alt_description?.trim() || 'Untitled Pin';
    const imageUrl = photo.urls.full || photo.urls.regular;
    const sourceUrl = photo.urls.raw || photo.urls.full || null;

    const created = await createPin(
      title,
      imageUrl,
      photo.width,
      photo.height,
      undefined,
      undefined,
      photo.color,
      sourceUrl || undefined
    );

    return created?.id || null;
  } catch (error) {
    console.error('Error ensuring pin exists:', error);
    return null;
  }
};

// Delete a pin
export const deletePin = async (pinId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId);

    if (error) {
      console.error('Error deleting pin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePin:', error);
    return false;
  }
};

// Save a pin
export const savePin = async (pinId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if already saved
    const { data: existing } = await withSavedTable(async (table) => {
      const response = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id)
        .eq('pin_id', pinId)
        .maybeSingle();
      return response;
    });

    if (existing) {
      console.log('Pin already saved');
      return true;
    }

    const { data, error } = await withSavedTable(async (table) => {
      const response = await supabase
        .from(table)
        .insert({
          user_id: user.id,
          pin_id: pinId,
        })
        .select()
        .single();
      return response;
    });

    if (error) {
      console.error('Error saving pin:', error);
      return false;
    }

    console.log('Pin saved successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in savePin:', error);
    return false;
  }
};

// Unsave a pin
export const unsavePin = async (pinId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await withSavedTable(async (table) => {
      const response = await supabase
        .from(table)
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', user.id);
      return response;
    });

    if (error) {
      console.error('Error unsaving pin:', error);
      return false;
    }

    console.log('Pin unsaved successfully');
    return true;
  } catch (error) {
    console.error('Error in unsavePin:', error);
    return false;
  }
};

// Check if pin is saved
export const isPinSaved = async (pinId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await withSavedTable(async (table) => {
      const response = await supabase
        .from(table)
        .select('id')
        .eq('pin_id', pinId)
        .eq('user_id', user.id)
        .maybeSingle();
      return response;
    });

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if pin is saved:', error);
    }

    return !!data;
  } catch (error) {
    console.error('Error in isPinSaved:', error);
    return false;
  }
};

// Fetch pin by ID
export const fetchPinById = async (pinId: string): Promise<Photo | null> => {
  try {
    const { data, error } = await supabase
      .from('pins')
      .select(
        `
        id,
        user_id,
        title,
        description,
        image_url,
        image_width,
        image_height,
        image_color,
        source_url,
        category,
        created_at,
        updated_at
      `
      )
      .eq('id', pinId)
      .single();

    if (error) {
      console.error('Error fetching pin:', error);
      return null;
    }

    // Fetch user profile separately
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

    return convertPinToPhoto(
      data,
      profileData || undefined
    );
  } catch (error) {
    console.error('Error in fetchPinById:', error);
    return null;
  }
};
