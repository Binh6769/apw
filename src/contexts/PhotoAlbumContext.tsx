/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PhotoAlbum, AlbumPhoto } from '../services/photoAlbumService';
import {
  createAlbum,
  fetchUserAlbums,
  fetchAlbumWithPhotos,
  addPhotoToAlbum,
  removePhotoFromAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumPhotoCount,
  searchAlbums,
  ensureAlbumForUser,
} from '../services/photoAlbumService';
import { useAuth } from './AuthContext';
import type { Photo } from '../types';
import { isHistoryAlbumName, isSystemAlbumName } from '../services/systemAlbums';

interface PhotoAlbumContextType {
  albums: PhotoAlbum[];
  currentAlbum: PhotoAlbum | null;
  currentAlbumPhotos: AlbumPhoto[];
  loading: boolean;
  creating: boolean;
  systemAlbumIds: { saved: string | null; history: string | null; loved: string | null };
  
  loadAlbums: () => Promise<void>;
  loadAlbum: (albumId: string) => Promise<void>;
  createNewAlbum: (name: string, description?: string) => Promise<PhotoAlbum | null>;
  updateAlbumDetails: (albumId: string, updates: Partial<Pick<PhotoAlbum, 'name' | 'description' | 'is_public'>>) => Promise<void>;
  deleteCurrentAlbum: (albumId: string) => Promise<void>;
  addPhotoToCurrentAlbum: (photo: Photo) => Promise<void>;
  addPhotoToAlbum: (albumId: string, photo: Photo) => Promise<boolean>;
  removePhotoFromCurrentAlbum: (albumPhotoId: string) => Promise<void>;
  searchUserAlbums: (query: string) => Promise<void>;
  getPhotoCount: (albumId: string) => Promise<number>;
}

export const PhotoAlbumContext = createContext<PhotoAlbumContextType | undefined>(undefined);

export function PhotoAlbumProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<PhotoAlbum | null>(null);
  const [currentAlbumPhotos, setCurrentAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [systemAlbumIds, setSystemAlbumIds] = useState<{ saved: string | null; history: string | null; loved: string | null }>({
    saved: null,
    history: null,
    loved: null,
  });
  const { user } = useAuth();

  const ensureSystemAlbums = useCallback(async () => {
    if (!user) return { saved: null, history: null, loved: null };

    const [savedAlbum, historyAlbum, lovedAlbum] = await Promise.all([
      ensureAlbumForUser(user.id, 'saved'),
      ensureAlbumForUser(user.id, 'history'),
      ensureAlbumForUser(user.id, 'loved'),
    ]);

    setSystemAlbumIds({
      saved: savedAlbum?.id ?? null,
      history: historyAlbum?.id ?? null,
      loved: lovedAlbum?.id ?? null,
    });

    return { savedAlbum, historyAlbum, lovedAlbum };
  }, [user]);

  const loadAlbums = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { savedAlbum, historyAlbum, lovedAlbum } = await ensureSystemAlbums();
      const userAlbums = await fetchUserAlbums(user.id);
      const merged = [
        ...userAlbums,
        ...(savedAlbum ? [savedAlbum] : []),
        ...(historyAlbum ? [historyAlbum] : []),
        ...(lovedAlbum ? [lovedAlbum] : []),
      ];

      // Deduplicate by id
      const unique = Array.from(
        new Map(merged.map((album) => [album.id, album])).values()
      );

      // Hide system history album from general listing
      const visibleAlbums = unique.filter((album) => !isHistoryAlbumName(album.name));
      setAlbums(visibleAlbums);
    } catch (error) {
      console.error('Failed to load albums', error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [user, ensureSystemAlbums]);

  const loadAlbum = useCallback(async (albumId: string) => {
    setLoading(true);
    try {
      const { album, photos } = await fetchAlbumWithPhotos(albumId);
      setCurrentAlbum(album);
      setCurrentAlbumPhotos(photos);
    } catch (error) {
      console.error('Failed to load album', error);
      setCurrentAlbum(null);
      setCurrentAlbumPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewAlbum = useCallback(
    async (name: string, description?: string): Promise<PhotoAlbum | null> => {
      setCreating(true);
      try {
        const newAlbum = await createAlbum(name, description);
        if (newAlbum) {
          setAlbums((prev) => [newAlbum, ...prev]);
          return newAlbum;
        }
        return null;
      } catch (error) {
        console.error('Failed to create album', error);
        return null;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const updateAlbumDetails = useCallback(
    async (albumId: string, updates: Partial<Pick<PhotoAlbum, 'name' | 'description' | 'is_public'>>) => {
      try {
        const updated = await updateAlbum(albumId, updates);
        if (updated) {
          setAlbums((prev) =>
            prev.map((album) => (album.id === albumId ? updated : album))
          );
          if (currentAlbum?.id === albumId) {
            setCurrentAlbum(updated);
          }
        }
      } catch (error) {
        console.error('Failed to update album', error);
      }
    },
    [currentAlbum?.id]
  );

  const deleteCurrentAlbum = useCallback(async (albumId: string) => {
    try {
      const album = albums.find((a) => a.id === albumId);
      if (album && isSystemAlbumName(album.name)) {
        console.warn('System albums cannot be deleted');
        return;
      }

      const success = await deleteAlbum(albumId);
      if (success) {
        setAlbums((prev) => prev.filter((album) => album.id !== albumId));
        if (currentAlbum?.id === albumId) {
          setCurrentAlbum(null);
          setCurrentAlbumPhotos([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete album', error);
    }
  }, [currentAlbum?.id]);

  const addPhotoToCurrentAlbum = useCallback(async (photo: Photo) => {
    if (!currentAlbum) return;

    try {
      const success = await addPhotoToAlbum(currentAlbum.id, photo);
      if (success) {
        await loadAlbum(currentAlbum.id);
      }
    } catch (error) {
      console.error('Failed to add photo to album', error);
    }
  }, [currentAlbum, loadAlbum]);

  const addPhotoToAlbumById = useCallback(async (albumId: string, photo: Photo): Promise<boolean> => {
    try {
      const success = await addPhotoToAlbum(albumId, photo);
      if (success) {
        // Refresh albums to keep counts in sync when available
        await loadAlbums();
      }
      return success;
    } catch (error) {
      console.error('Failed to add photo to album', error);
      return false;
    }
  }, [loadAlbums]);

  const removePhotoFromCurrentAlbum = useCallback(async (albumPhotoId: string) => {
    try {
      const success = await removePhotoFromAlbum(albumPhotoId);
      if (success) {
        setCurrentAlbumPhotos((prev) =>
          prev.filter((photo) => photo.id !== albumPhotoId)
        );
      }
    } catch (error) {
      console.error('Failed to remove photo from album', error);
    }
  }, []);

  const searchUserAlbums = useCallback(
    async (query: string) => {
      if (!user) return;

      setLoading(true);
      try {
        if (!query.trim()) {
          await loadAlbums();
        } else {
          const results = await searchAlbums(user.id, query);
          setAlbums(results);
        }
      } catch (error) {
        console.error('Failed to search albums', error);
      } finally {
        setLoading(false);
      }
    },
    [user, loadAlbums]
  );

  const getPhotoCount = useCallback(async (albumId: string): Promise<number> => {
    try {
      return await getAlbumPhotoCount(albumId);
    } catch (error) {
      console.error('Failed to get photo count', error);
      return 0;
    }
  }, []);

  // Load albums on user change
  useEffect(() => {
    if (!user) {
      setAlbums([]);
      setCurrentAlbum(null);
      setCurrentAlbumPhotos([]);
      return;
    }

    loadAlbums();
  }, [user, loadAlbums]);

  return (
    <PhotoAlbumContext.Provider
      value={{
        albums,
        currentAlbum,
        currentAlbumPhotos,
        loading,
      creating,
      systemAlbumIds,
      loadAlbums,
      loadAlbum,
      createNewAlbum,
      updateAlbumDetails,
      deleteCurrentAlbum,
        addPhotoToCurrentAlbum,
        addPhotoToAlbum: addPhotoToAlbumById,
        removePhotoFromCurrentAlbum,
        searchUserAlbums,
        getPhotoCount,
      }}
    >
      {children}
    </PhotoAlbumContext.Provider>
  );
}
