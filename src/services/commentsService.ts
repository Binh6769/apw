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

    return (data || []).map((comment: any) => ({
      id: comment.id,
      pin_id: comment.pin_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_name: comment.user_profiles
        ? `${comment.user_profiles.first_name || ''} ${comment.user_profiles.last_name || ''}`.trim()
        : 'Anonymous',
      user_avatar: comment.user_profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    }));
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
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    return {
      id: data.id,
      pin_id: data.pin_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
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
