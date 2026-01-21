import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { updateUserProfile } from '../services/userProfileService';

interface UseAvatarOptions {
  userId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useAvatar({
  userId,
  onSuccess,
  onError,
}: UseAvatarOptions) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      setError(null);

      try {
        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          throw new Error('Invalid file type. Please use JPG, PNG, GIF, or WebP');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size exceeds 10MB limit');
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl;
        if (!publicUrl) {
          throw new Error('Failed to get public URL');
        }

        // Update profile
        const result = await updateUserProfile(userId, {
          avatar_url: publicUrl,
        });

        if (!result) {
          throw new Error('Failed to update profile');
        }

        onSuccess?.(publicUrl);
        return publicUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [userId, onSuccess, onError]
  );

  const selectAvatarUrl = useCallback(
    async (url: string): Promise<boolean> => {
      setUploading(true);
      setError(null);

      try {
        const result = await updateUserProfile(userId, {
          avatar_url: url,
        });

        if (!result) {
          throw new Error('Failed to update avatar');
        }

        onSuccess?.(url);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return false;
      } finally {
        setUploading(false);
      }
    },
    [userId, onSuccess, onError]
  );

  return {
    uploading,
    error,
    uploadAvatar,
    selectAvatarUrl,
  };
}
