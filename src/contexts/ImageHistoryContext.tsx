/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Photo } from '../types';
import type { ImageHistoryRecord } from '../services/imageHistoryService';
import {
  recordImageView,
  fetchImageHistory,
  getImageHistoryCount,
  deleteImageFromHistory,
  clearImageHistory,
  searchImageHistory,
  getRecentlyViewed,
} from '../services/imageHistoryService';
import { useAuth } from './AuthContext';
import { addPhotoToAlbum, ensureAlbumForUser, addPhotosToAlbum, removePhotoFromAlbumByPhotoId } from '../services/photoAlbumService';
import { supabase } from '../services/supabase';

interface ImageHistoryContextType {
  history: ImageHistoryRecord[];
  recentlyViewed: ImageHistoryRecord[];
  historyCount: number;
  loading: boolean;
  isRecording: boolean;
  historyAlbumId: string | null;
  recordView: (photo: Photo, source?: string) => Promise<void>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
  loadRecentlyViewed: (limit?: number) => Promise<void>;
  deleteHistoryItem: (historyId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  searchHistory: (query: string) => Promise<void>;
  refreshCount: () => Promise<void>;
}

export const ImageHistoryContext = createContext<ImageHistoryContextType | undefined>(undefined);

export function ImageHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<ImageHistoryRecord[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ImageHistoryRecord[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [historyAlbumId, setHistoryAlbumId] = useState<string | null>(null);
  const { user } = useAuth();

  const resolveHistoryAlbumId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (historyAlbumId) return historyAlbumId;
    const album = await ensureAlbumForUser(user.id, 'history');
    if (album?.id) setHistoryAlbumId(album.id);
    return album?.id ?? null;
  }, [historyAlbumId, user]);

  // Record a viewed image
  const recordView = useCallback(
    async (photo: Photo, source: string = 'unsplash') => {
      if (!user) return;

      setIsRecording(true);
      try {
        const success = await recordImageView(photo, source);
        if (success) {
          // Update the count
          const newCount = await getImageHistoryCount(user.id);
          setHistoryCount(newCount);
          const albumId = await resolveHistoryAlbumId();
          if (albumId) {
            await addPhotoToAlbum(albumId, photo);
          }
        }
      } catch (error) {
        console.error('Failed to record image view', error);
      } finally {
        setIsRecording(false);
      }
    },
    [user, resolveHistoryAlbumId]
  );

  // Load history with pagination
  const loadHistory = useCallback(
    async (limit: number = 50, offset: number = 0) => {
      if (!user) return;

      setLoading(true);
      try {
        const records = await fetchImageHistory(user.id, limit, offset);
        setHistory(records);
        const albumId = await resolveHistoryAlbumId();
        if (albumId && records.length > 0) {
          const photos = records.map((record) => ({
            id: record.image_id,
            urls: {
              raw: record.image_url,
              full: record.image_url,
              regular: record.image_url,
              small: record.image_url,
              thumb: record.image_url,
            },
            width: record.image_width || 0,
            height: record.image_height || 0,
            color: record.image_color || '#e5e5e5',
            alt_description: record.image_description || record.image_title,
            user: {
              name: 'History',
              username: 'history',
              profile_image: { small: '', medium: '', large: '' },
            },
          }));
          await addPhotosToAlbum(albumId, photos);
        }
      } catch (error) {
        console.error('Failed to load history', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [user, resolveHistoryAlbumId]
  );

  // Load recently viewed
  const loadRecentlyViewed = useCallback(
    async (limit: number = 10) => {
      if (!user) return;

      try {
        const records = await getRecentlyViewed(user.id, limit);
        setRecentlyViewed(records);
      } catch (error) {
        console.error('Failed to load recently viewed', error);
        setRecentlyViewed([]);
      }
    },
    [user, resolveHistoryAlbumId]
  );

  // Delete a history item
  const deleteHistoryItem = useCallback(
    async (historyId: string) => {
      try {
        const success = await deleteImageFromHistory(historyId);
        if (success) {
          let removed: ImageHistoryRecord | undefined;
          setHistory((prev) => {
            removed = prev.find((item) => item.id === historyId);
            return prev.filter((item) => item.id !== historyId);
          });
          setRecentlyViewed((prev) => prev.filter((item) => item.id !== historyId));
          const newCount = await getImageHistoryCount(user!.id);
          setHistoryCount(newCount);
          const albumId = await resolveHistoryAlbumId();
          if (albumId && removed?.image_id) {
            await removePhotoFromAlbumByPhotoId(albumId, removed.image_id);
          }
        }
      } catch (error) {
        console.error('Failed to delete history item', error);
      }
    },
    [user, resolveHistoryAlbumId]
  );

  // Clear all history
  const clearAll = useCallback(async () => {
    try {
      const success = await clearImageHistory();
      if (success) {
        setHistory([]);
        setRecentlyViewed([]);
        setHistoryCount(0);
        const albumId = await resolveHistoryAlbumId();
        if (albumId) {
          // Clear album photos tied to history
          await supabase
            .from('album_photos')
            .delete()
            .eq('album_id', albumId);
        }
      }
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  }, [resolveHistoryAlbumId]);

  // Search history
  const searchHistory = useCallback(
    async (query: string) => {
      if (!user || !query.trim()) {
        await loadHistory();
        return;
      }

      setLoading(true);
      try {
        const records = await searchImageHistory(user.id, query);
        setHistory(records);
      } catch (error) {
        console.error('Failed to search history', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [user, loadHistory]
  );

  // Refresh count
  const refreshCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await getImageHistoryCount(user.id);
      setHistoryCount(count);
    } catch (error) {
      console.error('Failed to refresh count', error);
    }
  }, [user]);

  // Load history when user changes
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setRecentlyViewed([]);
      setHistoryCount(0);
      return;
    }

    loadHistory();
    loadRecentlyViewed();
    refreshCount();
  }, [user, loadHistory, loadRecentlyViewed, refreshCount]);

  return (
    <ImageHistoryContext.Provider
      value={{
      history,
      recentlyViewed,
      historyCount,
      loading,
      isRecording,
      historyAlbumId,
      recordView,
      loadHistory,
      loadRecentlyViewed,
      deleteHistoryItem,
      clearAll,
        searchHistory,
        refreshCount,
      }}
    >
      {children}
    </ImageHistoryContext.Provider>
  );
}
