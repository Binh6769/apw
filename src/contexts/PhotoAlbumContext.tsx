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
} from '../services/photoAlbumService';
import { useAuth } from './AuthContext';
import type { Photo } from '../types';

interface PhotoAlbumContextType {
  albums: PhotoAlbum[];
  currentAlbum: PhotoAlbum | null;
  currentAlbumPhotos: AlbumPhoto[];
  loading: boolean;
  creating: boolean;

  loadAlbums: () => Promise<void>;
  loadAlbum: (albumId: string) => Promise<void>;
  createNewAlbum: (name: string, description?: string) => Promise<PhotoAlbum | null>;
  updateAlbumDetails: (albumId: string, updates: Partial<Pick<PhotoAlbum, 'name' | 'description' | 'is_public'>>) => Promise<void>;
  deleteCurrentAlbum: (albumId: string) => Promise<void>;
  addPhotoToCurrentAlbum: (photo: Photo) => Promise<void>;
  removePhotoFromCurrentAlbum: (albumPhotoId: string) => Promise<void>;
  searchUserAlbums: (query: string) => Promise<void>;
  getPhotoCount: (albumId: string) => Promise<number>;
  addPhotoToAlbum: (albumId: string, photo: Photo) => Promise<void>;
}

export const PhotoAlbumContext = createContext<PhotoAlbumContextType | undefined>(undefined);

export function PhotoAlbumProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<PhotoAlbum | null>(null);
  const [currentAlbumPhotos, setCurrentAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const loadAlbums = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userAlbums = await fetchUserAlbums(user.id);
      setAlbums(userAlbums);
    } catch (error) {
      console.error('Failed to load albums', error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const addPhotoToAlbumById = useCallback(async (albumId: string, photo: Photo) => {
    try {
      const success = await addPhotoToAlbum(albumId, photo);
      if (success && currentAlbum?.id === albumId) {
        await loadAlbum(albumId);
      }
    } catch (error) {
      console.error('Failed to add photo to album', error);
      throw error;
    }
  }, [currentAlbum?.id, loadAlbum]);

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
        loadAlbums,
        loadAlbum,
        createNewAlbum,
        updateAlbumDetails,
        deleteCurrentAlbum,
        addPhotoToCurrentAlbum,
        removePhotoFromCurrentAlbum,
        searchUserAlbums,
        getPhotoCount,
        addPhotoToAlbum: addPhotoToAlbumById,
      }}
    >
      {children}
    </PhotoAlbumContext.Provider>
  );
}
