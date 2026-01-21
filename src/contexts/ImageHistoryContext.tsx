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

interface ImageHistoryContextType {
  history: ImageHistoryRecord[];
  recentlyViewed: ImageHistoryRecord[];
  historyCount: number;
  loading: boolean;
  isRecording: boolean;
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
  const { user } = useAuth();

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
        }
      } catch (error) {
        console.error('Failed to record image view', error);
      } finally {
        setIsRecording(false);
      }
    },
    [user]
  );

  // Load history with pagination
  const loadHistory = useCallback(
    async (limit: number = 50, offset: number = 0) => {
      if (!user) return;

      setLoading(true);
      try {
        const records = await fetchImageHistory(user.id, limit, offset);
        setHistory(records);
      } catch (error) {
        console.error('Failed to load history', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [user]
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
    [user]
  );

  // Delete a history item
  const deleteHistoryItem = useCallback(
    async (historyId: string) => {
      try {
        const success = await deleteImageFromHistory(historyId);
        if (success) {
          setHistory((prev) => prev.filter((item) => item.id !== historyId));
          setRecentlyViewed((prev) => prev.filter((item) => item.id !== historyId));
          const newCount = await getImageHistoryCount(user!.id);
          setHistoryCount(newCount);
        }
      } catch (error) {
        console.error('Failed to delete history item', error);
      }
    },
    [user]
  );

  // Clear all history
  const clearAll = useCallback(async () => {
    try {
      const success = await clearImageHistory();
      if (success) {
        setHistory([]);
        setRecentlyViewed([]);
        setHistoryCount(0);
      }
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  }, []);

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
