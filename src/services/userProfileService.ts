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
