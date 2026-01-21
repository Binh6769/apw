import { useState, useCallback } from 'react';
import {
  uploadProfilePhoto,
  deleteProfilePhoto,
  compressImage,
} from '../services/photoUploadService';
import { updateUserProfile } from '../services/userProfileService';

interface UsePhotoUploadOptions {
  userId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  onProgressChange?: (progress: number) => void;
  autoCompress?: boolean;
}

export function usePhotoUpload({
  userId,
  onSuccess,
  onError,
  onProgressChange,
  autoCompress = true,
}: UsePhotoUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Step 1: Compress image if enabled (simulated progress)
        if (autoCompress) {
          setProgress(10);
          onProgressChange?.(10);
          
          const compressedBlob = await compressImage(file, 0.8);
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          });
          
          setProgress(30);
          onProgressChange?.(30);

          // Step 2: Upload to Supabase
          const result = await uploadProfilePhoto(userId, compressedFile);

          if (!result) {
            throw new Error('Failed to upload photo');
          }

          setProgress(70);
          onProgressChange?.(70);

          // Step 3: Update user profile with new photo URL
          const updated = await updateUserProfile(userId, {
            avatar_url: result.url,
          });

          if (!updated) {
            throw new Error('Failed to update profile');
          }

          setProgress(100);
          onProgressChange?.(100);

          onSuccess?.(result.url);
          return result.url;
        } else {
          // Without compression
          setProgress(20);
          onProgressChange?.(20);

          const result = await uploadProfilePhoto(userId, file);

          if (!result) {
            throw new Error('Failed to upload photo');
          }

          setProgress(60);
          onProgressChange?.(60);

          const updated = await updateUserProfile(userId, {
            avatar_url: result.url,
          });

          if (!updated) {
            throw new Error('Failed to update profile');
          }

          setProgress(100);
          onProgressChange?.(100);

          onSuccess?.(result.url);
          return result.url;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [userId, onSuccess, onError, onProgressChange, autoCompress]
  );

  const deletePhoto = useCallback(
    async (fileName: string): Promise<boolean> => {
      setUploading(true);
      setError(null);

      try {
        const success = await deleteProfilePhoto(userId, fileName);

        if (!success) {
          throw new Error('Failed to delete photo');
        }

        // Clear avatar from profile
        await updateUserProfile(userId, {
          avatar_url: null,
        });

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
    [userId, onError]
  );

  const resetProgress = useCallback(() => {
    setProgress(0);
    onProgressChange?.(0);
  }, [onProgressChange]);

  return {
    uploading,
    progress,
    error,
    uploadPhoto,
    deletePhoto,
    resetProgress,
  };
}
