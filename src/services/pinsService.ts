import { supabase } from './supabase';
import type { Photo } from '../types';
import { getCategoriesForPins, setPinCategories, ensureCategoriesExist, type Category } from './categoriesService';

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

import { generateTagsForImage } from '../utils/aiTagger';

// Convert Pin to Photo format for display
const convertPinToPhoto = (pin: Pin, userProfile?: UserProfile, categories?: Category[]): Photo => {
  const userName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Anonymous'
    : 'Anonymous';

  const tags = categories
    ? categories.map(c => c.name)
    : pin.category
      ? pin.category.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

  const categoryStr = categories
    ? categories.map(c => c.name).join(', ')
    : pin.category || '';

  return {
    id: pin.id,
    title: pin.title || '',
    description: pin.description || '',
    category: categoryStr,
    source_url: pin.source_url || '',
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
    alt_description: pin.title || pin.description || 'Pin image',
    user: {
      name: userName,
      username: userProfile?.user_id || 'user',
      profile_image: {
        small: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        medium: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        large: userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      },
    },
    tags: tags?.length ? tags : undefined,
    created_at: pin.created_at,
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

    const pinIds = data.map(pin => pin.id);
    const categoriesMap = await getCategoriesForPins(pinIds);

    return data.map((pin: Pin) =>
      convertPinToPhoto(
        pin,
        profileMap.get(pin.user_id) || undefined,
        categoriesMap.get(pin.id)
      )
    );
  } catch (error) {
    console.error('Error in fetchPinsFromSupabase:', error);
    return [];
  }
};

// Fetch pins by category (for "More like this" section)
export const fetchPinsByCategory = async (
  category: string,
  excludePinId: string,
  limit: number = 12
): Promise<Photo[]> => {
  if (!category) return [];
  
  try {
    // Find matching category IDs
    const { data: matchingCategories } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${category}%`);

    const categoryIds = (matchingCategories || []).map(c => c.id);
    if (categoryIds.length === 0) return [];

    // Find pin IDs with those categories
    const { data: pinCategoryData } = await supabase
      .from('pin_categories')
      .select('pin_id')
      .in('category_id', categoryIds);

    const matchingPinIds = [...new Set((pinCategoryData || []).map(pc => pc.pin_id))]
      .filter(id => id !== excludePinId);

    if (matchingPinIds.length === 0) return [];

    // Fetch pins
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
      .in('id', matchingPinIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching pins by category:', error);
      return [];
    }

    if (!data) return [];

    // Fetch user profiles
    const userIds = [...new Set(data.map(pin => pin.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Fetch categories for these pins
    const pinIds = data.map(pin => pin.id);
    const categoriesMap = await getCategoriesForPins(pinIds);

    return data.map((pin: Pin) =>
      convertPinToPhoto(
        pin,
        profileMap.get(pin.user_id) || undefined,
        categoriesMap.get(pin.id)
      )
    );
  } catch (error) {
    console.error('Error in fetchPinsByCategory:', error);
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

    const pinIds = data.map(pin => pin.id);
    const categoriesMap = await getCategoriesForPins(pinIds);

    return data.map((pin: Pin) =>
      convertPinToPhoto(
        pin,
        profileData || undefined,
        categoriesMap.get(pin.id)
      )
    );
  } catch (error) {
    console.error('Error in fetchUserPins:', error);
    return [];
  }
};

// Fetch user's saved pins (persisted in saved_pins table)
export const fetchSavedPins = async (userId: string): Promise<Photo[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_pins')
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

    if (error) {
      console.error('Error fetching saved pins:', error);
      return [];
    }

    if (!data) return [];

    // Define saved pin type - pins is array from Supabase join
    interface SavedPinRow {
      pin_id: string;
      pins: Pin[] | null;
    }

    // Get all unique user IDs from pins
    const userIds = [...new Set((data || []).map((saved: SavedPinRow) => saved.pins?.[0]?.user_id).filter(Boolean))] as string[];

    // Fetch all user profiles in one query
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    const validPins = data
      .map((saved: SavedPinRow) => saved.pins?.[0])
      .filter((pin): pin is Pin => pin != null);
    const pinIds = validPins.map(pin => pin.id);
    const categoriesMap = await getCategoriesForPins(pinIds);

    return validPins.map((pin: Pin) =>
      convertPinToPhoto(
        pin,
        profileMap.get(pin.user_id) || undefined,
        categoriesMap.get(pin.id)
      )
    );
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
  sourceUrl?: string,
  categoryIds?: string[]
): Promise<Pin | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let finalCategory = category;
    let finalCategoryIds = categoryIds;

    if (!finalCategory && (!finalCategoryIds || finalCategoryIds.length === 0)) {
      const aiTags = await generateTagsForImage(imageUrl, title, description);
      finalCategory = aiTags.join(', ');
      finalCategoryIds = await ensureCategoriesExist(aiTags);
    } else if (finalCategoryIds && finalCategoryIds.length > 0 && !finalCategory) {
      // Build comma-separated string from category IDs for backward compat
      const { data: cats } = await supabase
        .from('categories')
        .select('name')
        .in('id', finalCategoryIds);
      finalCategory = (cats || []).map(c => c.name).join(', ');
    }

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
        category: finalCategory,
        source_url: sourceUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pin:', error);
      return null;
    }

    // Write to junction table
    if (finalCategoryIds && finalCategoryIds.length > 0 && data) {
      await setPinCategories(data.id, finalCategoryIds);
    }

    return data;
  } catch (error) {
    console.error('Error in createPin:', error);
    return null;
  }
};

// Update an existing pin
export const updatePin = async (
  pinId: string,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    sourceUrl?: string;
    altDescription?: string;
    categoryIds?: string[];
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
  }
): Promise<Pin | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.sourceUrl !== undefined) updateData.source_url = updates.sourceUrl;
    if (updates.altDescription !== undefined) updateData.alt_description = updates.altDescription;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.imageWidth !== undefined) updateData.image_width = updates.imageWidth;
    if (updates.imageHeight !== undefined) updateData.image_height = updates.imageHeight;

    // Handle category updates - build comma string for backward compat
    if (updates.categoryIds !== undefined) {
      const { data: cats } = await supabase
        .from('categories')
        .select('name')
        .in('id', updates.categoryIds);
      updateData.category = (cats || []).map(c => c.name).join(', ');
    } else if (updates.category !== undefined) {
      updateData.category = updates.category;
    }

    const { data, error } = await supabase
      .from('pins')
      .update(updateData)
      .eq('id', pinId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pin:', error);
      return null;
    }

    // Update junction table
    if (updates.categoryIds !== undefined && data) {
      await setPinCategories(pinId, updates.categoryIds);
    }

    return data;
  } catch (error) {
    console.error('Error in updatePin:', error);
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

    const { data: existing } = await supabase
      .from('saved_pins')
      .select('id')
      .eq('user_id', user.id)
      .eq('pin_id', pinId)
      .maybeSingle();

    if (existing) {
      console.log('Pin already saved');
      return true;
    }

    const { data, error } = await supabase
      .from('saved_pins')
      .insert({
        user_id: user.id,
        pin_id: pinId,
      })
      .select()
      .single();

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

    const { error } = await supabase
      .from('saved_pins')
      .delete()
      .eq('pin_id', pinId)
      .eq('user_id', user.id);

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

    const { data, error } = await supabase
      .from('saved_pins')
      .select('id')
      .eq('pin_id', pinId)
      .eq('user_id', user.id)
      .maybeSingle();

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

    // Fetch categories for this pin
    const categoriesMap = await getCategoriesForPins([data.id]);

    return convertPinToPhoto(
      data,
      profileData || undefined,
      categoriesMap.get(data.id)
    );
  } catch (error) {
    console.error('Error in fetchPinById:', error);
    return null;
  }
};
