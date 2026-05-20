import { supabase } from './supabase';
import type { Photo } from '../types';

export type UserRole = 'user' | 'admin' | 'banned';
export type BanDuration = 1 | 7 | 30 | -1; // -1 = permanent

export interface AdminUserProfile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  birth_date: string | null;
  age: number | null;
  role: UserRole;
  banned_until: string | null;
  updated_at: string;
  created_at: string;
}

export interface UserWithAuth {
  user_id: string;
  email: string;
  role: UserRole;
  banned_until: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  post_count: number;
}

export interface UserSearchResult {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  banned_until: string | null;
}

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

const ADMIN_ACCESS_KEY = import.meta.env.VITE_ADMIN_ACCESS_KEY || '123456789';

const convertPinToPhoto = (pin: Pin): Photo => {
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
    alt_description: pin.description || pin.title,
    user: {
      name: 'Anonymous',
      username: pin.user_id,
      profile_image: {
        small: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        medium: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        large: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      },
    },
  };
};

export const validateAdminAccessKey = (accessKey: string): boolean => {
  return accessKey === ADMIN_ACCESS_KEY;
};

export const upgradeToAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Try RPC first, fall back to direct table update
    const { data, error } = await supabase.rpc('upgrade_to_admin', {
      target_user_id: userId,
    });

    if (error) {
      if (error.message?.includes('404') || error.message?.includes('does not exist')) {
        console.log('RPC not available, using direct table update');
        // Fallback: direct update
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'admin' })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Direct update failed:', updateError);
          return false;
        }
        return true;
      }
      console.error('Error upgrading to admin:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in upgradeToAdmin:', error);
    return false;
  }
};

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  try {
    const searchTerm = `%${query}%`;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, avatar_url, role, banned_until')
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(50);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
};

export const getAllUsersWithStats = async (): Promise<UserWithAuth[]> => {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return [];
    }

    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at');

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return [];
    }

    const authMap = new Map(
      (authUsers || []).map(u => [u.id, { email: u.email, created_at: u.created_at }])
    );

    const pinCountMap = new Map<string, number>();
    if (profiles?.length) {
      for (const p of profiles) {
        const { count } = await supabase
          .from('pins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', p.user_id);
        pinCountMap.set(p.user_id, count || 0);
      }
    }

    const result: UserWithAuth[] = (profiles || []).map(p => {
      const authData = authMap.get(p.user_id);
      return {
        user_id: p.user_id,
        email: authData?.email || '',
        role: (p.role as UserRole) || 'user',
        banned_until: p.banned_until,
        first_name: p.first_name,
        last_name: p.last_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        location: p.location,
        created_at: authData?.created_at || p.updated_at,
        post_count: pinCountMap.get(p.user_id) || 0,
      };
    });

    return result;
  } catch (error) {
    console.error('Error in getAllUsersWithStats:', error);
    return [];
  }
};

export const getUserDetails = async (userId: string): Promise<UserWithAuth | null> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    const { data: authUser } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single();

    const { count } = await supabase
      .from('pins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      user_id: profile.user_id,
      email: authUser?.email || '',
      role: (profile.role as UserRole) || 'user',
      banned_until: profile.banned_until,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      location: profile.location,
      created_at: authUser?.created_at || profile.updated_at,
      post_count: count || 0,
    };
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    return null;
  }
};

export const getUserPosts = async (userId: string): Promise<Photo[]> => {
  try {
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }

    return (data || []).map(convertPinToPhoto);
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    return [];
  }
};

export const banUser = async (userId: string, duration: BanDuration): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('ban_user', {
      target_user_id: userId,
      duration_days: duration,
    });

    if (error) {
      if (error.message?.includes('404') || error.message?.includes('does not exist')) {
        // Fallback: direct update
        const bannedUntil = duration === -1 ? null : new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'banned', banned_until: bannedUntil })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Direct ban failed:', updateError);
          return false;
        }
        return true;
      }
      console.error('Error banning user:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in banUser:', error);
    return false;
  }
};

export const unbanUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('unban_user', {
      target_user_id: userId,
    });

    if (error) {
      if (error.message?.includes('404') || error.message?.includes('does not exist')) {
        // Fallback: direct update
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'user', banned_until: null })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Direct unban failed:', updateError);
          return false;
        }
        return true;
      }
      console.error('Error unbanning user:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in unbanUser:', error);
    return false;
  }
};

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    await supabase.from('pins').delete().eq('user_id', userId);
    await supabase.from('saved_images').delete().eq('user_id', userId);
    await supabase.from('likes').delete().eq('user_id', userId);
    await supabase.from('loves').delete().eq('user_id', userId);
    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('user_profiles').delete().eq('user_id', userId);
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Error deleting auth user:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    return false;
  }
};

export const deletePosts = async (postIds: string[]): Promise<boolean> => {
  try {
    if (postIds.length === 0) return true;

    const { error } = await supabase
      .from('pins')
      .delete()
      .in('id', postIds);

    if (error) {
      console.error('Error deleting posts:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePosts:', error);
    return false;
  }
};

export const getAllPosts = async (): Promise<Photo[]> => {
  try {
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching all posts:', error);
      return [];
    }

    const userIds = [...new Set((data || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    return (data || []).map((pin: Pin) => {
      const profile = profileMap.get(pin.user_id);
      const photo = convertPinToPhoto(pin);
      if (profile) {
        photo.user = {
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous',
          username: profile.user_id,
          profile_image: {
            small: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            medium: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            large: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          },
        };
      }
      return photo;
    });
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    return [];
  }
};

export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Table/column doesn't exist or no profile - user is regular user
      return 'user';
    }

    return (data?.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'user';
  }
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'admin';
};
