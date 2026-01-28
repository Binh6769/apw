import { supabase } from './supabase';

export interface Comment {
  id: string;
  pin_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

// Fetch comments for a pin
export const fetchComments = async (pinId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        pin_id,
        user_id,
        content,
        created_at,
        updated_at,
        user_profiles (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq('pin_id', pinId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Define the raw comment type from Supabase join
    interface RawComment {
      id: string;
      pin_id: string;
      user_id: string;
      content: string;
      created_at: string;
      updated_at: string;
      user_profiles: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      }[] | null;
    }

    return (data || []).map((comment: RawComment) => {
      const profile = Array.isArray(comment.user_profiles) ? comment.user_profiles[0] : comment.user_profiles;
      return {
        id: comment.id,
        pin_id: comment.pin_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_name: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous'
          : 'Anonymous',
        user_avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`,
      };
    });
  } catch (error) {
    console.error('Error in fetchComments:', error);
    return [];
  }
};

// Add comment to a pin
export const addComment = async (pinId: string, content: string): Promise<Comment | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        pin_id: pinId,
        user_id: user.id,
        content,
      })
      .select(`
        id,
        pin_id,
        user_id,
        content,
        created_at,
        updated_at,
        user_profiles (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    const record = data as any;

    return {
      id: record.id,
      pin_id: record.pin_id,
      user_id: record.user_id,
      content: record.content,
      created_at: record.created_at,
      updated_at: record.updated_at,
      user_name: record.user_profiles
        ? `${record.user_profiles.first_name || ''} ${record.user_profiles.last_name || ''}`.trim()
        : user.email || 'You',
      user_avatar: record.user_profiles?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id,
    };
  } catch (error) {
    console.error('Error in addComment:', error);
    return null;
  }
};

// Delete comment
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
};
