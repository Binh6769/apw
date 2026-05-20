import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  birth_date: string | null;
  age: number | null;
  role: 'user' | 'admin' | 'banned';
  banned_until: string | null;
  updated_at: string;
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Create or update user profile
export const upsertUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'updated_at'>>
): Promise<UserProfile | null> => {
  try {
    // First, try to update existing profile
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    // If profile exists, return updated data
    if (updateData) {
      return updateData;
    }

    // If not found (no rows updated), create new profile
    if (updateError?.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting user profile:', insertError);
        return null;
      }

      return insertData;
    }

    // Other errors
    if (updateError) {
      console.error('Error upserting user profile:', updateError);
      return null;
    }

    return updateData;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'updated_at'>>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Get all user profiles (Admin)
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all user profiles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllUserProfiles:', error);
    return [];
  }
};

// Delete user profile (Admin)
export const deleteUserProfile = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }

    // Attempt to delete pins if possible (RLS might restrict, but trying is fine)
    await supabase.from('pins').delete().eq('user_id', userId);
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserProfile:', error);
    return false;
  }
};

// Search user profiles by name, email, or display name
export const searchUserProfiles = async (query: string): Promise<UserProfile[]> => {
  try {
    if (!query.trim()) {
      return getAllUserProfiles();
    }

    const searchTerm = `%${query}%`;
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching user profiles:', error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Error in searchUserProfiles:', error);
    return [];
  }
};

// Update user role (Admin)
export const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'banned'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return false;
  }
};
