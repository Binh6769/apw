import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchComments as fetchCommentsService, addComment as addCommentService, deleteComment as deleteCommentService } from '../services/commentsService';

export interface Comment {
  id: string;
  pinId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  timestamp: number;
}

export function useComments(pinId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load comments from Supabase
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      if (!pinId) {
        setComments([]);
        setLoading(false);
        return;
      }
      try {
        const supabaseComments = await fetchCommentsService(pinId);
        const transformedComments: Comment[] = supabaseComments.map(c => ({
          id: c.id,
          pinId: c.pin_id,
          userId: c.user_id,
          userName: c.user_name || 'Anonymous',
          userImage: c.user_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          text: c.content,
          timestamp: new Date(c.created_at).getTime(),
        }));
        setComments(transformedComments);
      } catch (error) {
        console.error('Failed to load comments', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [pinId]);

  const addComment = useCallback(async (text: string) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Add to local state immediately
    const tempComment: Comment = {
      id: crypto.randomUUID(),
      pinId,
      userId: user.id,
      userName: user.user_metadata?.first_name || user.email || 'Anonymous',
      userImage: user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id,
      text,
      timestamp: Date.now(),
    };

    setComments(prev => [tempComment, ...prev]);

    // Save to Supabase
    try {
      const result = await addCommentService(pinId, text);
      if (result) {
        // Replace temp comment with actual one
        setComments(prev =>
          prev.map(c =>
            c.id === tempComment.id
              ? {
                  ...c,
                  id: result.id,
                  timestamp: new Date(result.created_at).getTime(),
                  userName: result.user_name || c.userName,
                  userImage: result.user_avatar || c.userImage,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to add comment', error);
      // Remove temp comment on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
  }, [pinId, user]);

  const deleteComment = useCallback(async (commentId: string) => {
    // Remove from local state
    setComments(prev => prev.filter(c => c.id !== commentId));

    // Delete from Supabase
    try {
      await deleteCommentService(commentId);
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  }, []);

  return { comments, addComment, deleteComment, loading };
}
