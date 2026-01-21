import { supabase } from './supabase';

export interface PhotoUploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Upload a profile photo to Supabase Storage
 * @param file - File object from input
 * @returns PhotoUploadResult with public URL
 */
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<PhotoUploadResult | null> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to upload a profile photo');
    }
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please use JPG, PNG, GIF, or WebP');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Create unique file name (store under the user's folder)
    const fileExt = file.name.split('.').pop();
    const fileName = `photo-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old profile photo if exists
    try {
      const { data: files } = await supabase.storage
        .from('profile-photos')
        .list(userId);  // List only the current user's files

      if (files && files.length > 0) {
        const oldFiles = files.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from('profile-photos')
          .remove(oldFiles);
      }
    } catch (error) {
      // Ignore errors when deleting old files
      console.warn('Could not delete old profile photos:', error);
    }

    // Upload new file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Return result
    return {
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

/**
 * Delete a profile photo from Supabase Storage
 * @param fileName - File name to delete
 */
export const deleteProfilePhoto = async (
  userId: string,
  fileName: string
): Promise<boolean> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to delete a profile photo');
    }

    let filePath = fileName;
    if (fileName.startsWith('http')) {
      const urlParts = fileName.split('/profile-photos/');
      filePath = urlParts.length > 1 ? urlParts[1] : fileName;
    }
    if (!filePath.includes('/')) {
      filePath = `${userId}/${filePath}`;
    }

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return false;
  }
};

/**
 * Get all profile photos for a user
 */
export const listProfilePhotos = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .list('');  // List all files in bucket root

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing profile photos:', error);
    return [];
  }
};

/**
 * Compress image before upload
 * @param file - Original file
 * @param quality - Quality level 0-1
 * @returns Compressed file as Blob
 */
export const compressImage = async (
  file: File,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 2000;
        const maxHeight = 2000;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};
