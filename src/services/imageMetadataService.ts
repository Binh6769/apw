/**
 * Image Metadata Service
 * Manages image labeling, cataloging, and retrieval for the entire application
 */

import { supabase } from './supabase';
import type {
  ImageMetadata,
  ImageLabel,
  ImageArchiveEntry,
  ImageCategory,
  ImageSource,
} from '../types/imageMetadata';

const TABLE_NAME = 'image_metadata';
const LABELS_TABLE_NAME = 'image_labels';

/**
 * Create a new image label
 */
export const createImageLabel = async (
  label: Omit<ImageLabel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ImageLabel | null> => {
  try {
    const { data, error } = await supabase
      .from(LABELS_TABLE_NAME)
      .insert({
        name: label.name,
        category: label.category,
        tags: label.tags,
        description: label.description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating image label:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createImageLabel:', error);
    return null;
  }
};

/**
 * Record image metadata
 */
export const recordImageMetadata = async (
  metadata: Omit<ImageMetadata, 'id'>
): Promise<ImageMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        url: metadata.url,
        label_id: metadata.label.id,
        source: metadata.source,
        dimensions: metadata.dimensions,
        file_size: metadata.fileSize,
        format: metadata.format,
        color: metadata.color,
        alt: metadata.alt,
        user_id: metadata.userId,
        pin_id: metadata.pinId,
        external_id: metadata.externalId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording image metadata:', error);
      return null;
    }

    return {
      ...data,
      fileSize: data.file_size,
      userId: data.user_id,
      pinId: data.pin_id,
      externalId: data.external_id,
    };
  } catch (error) {
    console.error('Error in recordImageMetadata:', error);
    return null;
  }
};

/**
 * Get all images with specific label
 */
export const getImagesByLabel = async (
  labelId: string
): Promise<ImageMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `
        *,
        image_labels (
          id,
          name,
          category,
          tags,
          description
        )
      `
      )
      .eq('label_id', labelId);

    if (error) {
      console.error('Error fetching images by label:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      label: item.image_labels,
      source: item.source,
      dimensions: item.dimensions,
      fileSize: item.file_size,
      format: item.format,
      color: item.color,
      alt: item.alt,
      uploadedAt: item.created_at,
      userId: item.user_id,
      pinId: item.pin_id,
      externalId: item.external_id,
    }));
  } catch (error) {
    console.error('Error in getImagesByLabel:', error);
    return [];
  }
};

/**
 * Get all images by category
 */
export const getImagesByCategory = async (
  category: ImageCategory
): Promise<ImageMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `
        *,
        image_labels (
          id,
          name,
          category,
          tags,
          description
        )
      `
      )
      .eq('image_labels.category', category);

    if (error) {
      console.error('Error fetching images by category:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      label: item.image_labels,
      source: item.source,
      dimensions: item.dimensions,
      fileSize: item.file_size,
      format: item.format,
      color: item.color,
      alt: item.alt,
      uploadedAt: item.created_at,
      userId: item.user_id,
      pinId: item.pin_id,
      externalId: item.external_id,
    }));
  } catch (error) {
    console.error('Error in getImagesByCategory:', error);
    return [];
  }
};

/**
 * Get all images by source
 */
export const getImagesBySource = async (
  source: ImageSource
): Promise<ImageMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `
        *,
        image_labels (
          id,
          name,
          category,
          tags,
          description
        )
      `
      )
      .eq('source', source);

    if (error) {
      console.error('Error fetching images by source:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      label: item.image_labels,
      source: item.source,
      dimensions: item.dimensions,
      fileSize: item.file_size,
      format: item.format,
      color: item.color,
      alt: item.alt,
      uploadedAt: item.created_at,
      userId: item.user_id,
      pinId: item.pin_id,
      externalId: item.external_id,
    }));
  } catch (error) {
    console.error('Error in getImagesBySource:', error);
    return [];
  }
};

/**
 * Get user's images
 */
export const getUserImages = async (userId: string): Promise<ImageMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `
        *,
        image_labels (
          id,
          name,
          category,
          tags,
          description
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user images:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      label: item.image_labels,
      source: item.source,
      dimensions: item.dimensions,
      fileSize: item.file_size,
      format: item.format,
      color: item.color,
      alt: item.alt,
      uploadedAt: item.created_at,
      userId: item.user_id,
      pinId: item.pin_id,
      externalId: item.external_id,
    }));
  } catch (error) {
    console.error('Error in getUserImages:', error);
    return [];
  }
};

/**
 * Archive image metadata
 */
export const archiveImage = async (
  imageId: string,
  notes?: string
): Promise<ImageArchiveEntry | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        notes,
      })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Error archiving image:', error);
      return null;
    }

    return {
      id: data.id,
      metadata: data,
      archived: data.archived,
      archivedAt: data.archived_at,
      notes: data.notes,
    };
  } catch (error) {
    console.error('Error in archiveImage:', error);
    return null;
  }
};

/**
 * Get archived images
 */
export const getArchivedImages = async (): Promise<ImageArchiveEntry[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `
        *,
        image_labels (
          id,
          name,
          category,
          tags,
          description
        )
      `
      )
      .eq('archived', true)
      .order('archived_at', { ascending: false });

    if (error) {
      console.error('Error fetching archived images:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      metadata: {
        id: item.id,
        url: item.url,
        label: item.image_labels,
        source: item.source,
        dimensions: item.dimensions,
        fileSize: item.file_size,
        format: item.format,
        color: item.color,
        alt: item.alt,
        uploadedAt: item.created_at,
        userId: item.user_id,
        pinId: item.pin_id,
        externalId: item.external_id,
      },
      archived: item.archived,
      archivedAt: item.archived_at,
      notes: item.notes,
    }));
  } catch (error) {
    console.error('Error in getArchivedImages:', error);
    return [];
  }
};

/**
 * Update image metadata
 */
export const updateImageMetadata = async (
  imageId: string,
  updates: Partial<ImageMetadata>
): Promise<ImageMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        alt: updates.alt,
        color: updates.color,
        dimensions: updates.dimensions,
      })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating image metadata:', error);
      return null;
    }

    return {
      ...data,
      fileSize: data.file_size,
      userId: data.user_id,
      pinId: data.pin_id,
      externalId: data.external_id,
    };
  } catch (error) {
    console.error('Error in updateImageMetadata:', error);
    return null;
  }
};

/**
 * Delete image metadata
 */
export const deleteImageMetadata = async (imageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImageMetadata:', error);
    return false;
  }
};

/**
 * Get all image labels
 */
export const getAllImageLabels = async (): Promise<ImageLabel[]> => {
  try {
    const { data, error } = await supabase
      .from(LABELS_TABLE_NAME)
      .select('*')
      .order('category');

    if (error) {
      console.error('Error fetching image labels:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllImageLabels:', error);
    return [];
  }
};

/**
 * Get stats about image usage
 */
export const getImageStats = async () => {
  try {
    const { data: totalImages, error: totalError } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('archived', false);

    // Fetch sources and aggregate manually (group_by not available in Postgrest)
    const { data: sourceData, error: sourceError } = await supabase
      .from(TABLE_NAME)
      .select('source')
      .eq('archived', false);

    const sourceAgg = sourceData && !sourceError 
      ? Object.entries(
          (sourceData as any[]).reduce((acc, item: any) => {
            acc[item.source] = (acc[item.source] || 0) + 1;
            return acc;
          }, {})
        ).map(([source, count]) => ({ source, count }))
      : [];

    // Fetch categories and aggregate manually
    const { data: categoryData, error: categoryError } = await supabase
      .from(TABLE_NAME)
      .select('label_id')
      .eq('archived', false);

    const categoryAgg = categoryData && !categoryError
      ? Object.entries(
          (categoryData as any[]).reduce((acc, item: any) => {
            acc[item.label_id] = (acc[item.label_id] || 0) + 1;
            return acc;
          }, {})
        ).map(([label_id, count]) => ({ label_id, count }))
      : [];

    if (totalError || sourceError || categoryError) {
      console.error('Error fetching stats:', { totalError, sourceError, categoryError });
      return null;
    }

    return {
      total: totalImages?.length || 0,
      bySource: sourceAgg,
      byCategory: categoryAgg,
    };
  } catch (error) {
    console.error('Error in getImageStats:', error);
    return null;
  }
};
