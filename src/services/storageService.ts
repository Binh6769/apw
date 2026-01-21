import { supabase } from './supabase';

// Upload image to Supabase storage
export const uploadImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('pin-images')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pin-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

// Upload image from data URL
export const uploadImageFromDataUrl = async (dataUrl: string, userId: string): Promise<string | null> => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const file = new File([blob], `pin-${Date.now()}.png`, { type: 'image/png' });
    return uploadImage(file, userId);
  } catch (error) {
    console.error('Error in uploadImageFromDataUrl:', error);
    return null;
  }
};

// Delete image from storage
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('pin-images') + 1).join('/');

    const { error } = await supabase.storage
      .from('pin-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};
