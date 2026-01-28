/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Photo } from '../types';
import { ensurePinExists, fetchSavedPins, fetchUserPins, savePin as savePinService, unsavePin as unsavePinService } from '../services/pinsService';
import { addPhotoToAlbum, addPhotosToAlbum, ensureAlbumForUser, removePhotoFromAlbumByPhotoId } from '../services/photoAlbumService';
import { useAuth } from './AuthContext';

interface SavedPinsContextType {
  savedPins: Photo[];
  savePin: (photo: Photo) => void;
  removePin: (photo: Photo) => void;
  isSaved: (photo: Photo) => boolean;
  loading: boolean;
}

export const SavedPinsContext = createContext<SavedPinsContextType | undefined>(undefined);

export function SavedPinsProvider({ children }: { children: ReactNode }) {
  const [savedPins, setSavedPins] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedAlbumId, setSavedAlbumId] = useState<string | null>(null);
  const { user } = useAuth();
  const storageKey = user ? `saved_images_${user.id}` : null;

  const getPhotoUrlCandidates = (photo: Photo) => {
    return [photo.urls.full, photo.urls.regular, photo.urls.raw, photo.urls.small, photo.urls.thumb].filter(Boolean);
  };

  const findSavedPin = (photo: Photo) => {
    if (savedIds.has(photo.id)) {
      return savedPins.find(pin => pin.id === photo.id) || null;
    }

    const candidates = getPhotoUrlCandidates(photo);
    return savedPins.find(pin => {
      const pinUrls = [pin.urls.full, pin.urls.regular, pin.urls.raw, pin.urls.small, pin.urls.thumb].filter(Boolean);
      return candidates.some(url => pinUrls.includes(url));
    }) || null;
  };

  // Load saved pins from Supabase when user changes
  // Exclude the user's own created pins from saved pins
  useEffect(() => {
    if (!user) {
      setSavedPins([]);
      setSavedIds(new Set());
      setSavedAlbumId(null);
      setLoading(false);
      return;
    }

    // Seed from localStorage for instant UI on reload
    if (storageKey) {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed: Photo[] = JSON.parse(cached);
          setSavedPins(parsed);
          setSavedIds(new Set(parsed.map(p => p.id)));
        }
      } catch (error) {
        console.warn('Failed to read cached saved pins', error);
      }
    }

    const loadPins = async () => {
      setLoading(true);
      try {
        const album = await ensureAlbumForUser(user.id, 'saved');
        setSavedAlbumId(album?.id ?? null);

        // Fetch both saved and created pins
        const savedPinsData = await fetchSavedPins(user.id);
        const createdPinsData = await fetchUserPins(user.id);
        
        // Filter out any saved pins that are actually the user's own created pins
        const createdPinIds = new Set(createdPinsData.map(p => p.id));
        const filteredSavedPins = savedPinsData.filter(pin => !createdPinIds.has(pin.id));
        
        setSavedPins(filteredSavedPins);
        setSavedIds(new Set(filteredSavedPins.map(p => p.id)));

        // Keep system Saved album in sync with saved pins
        if (album?.id && filteredSavedPins.length > 0) {
          await addPhotosToAlbum(album.id, filteredSavedPins);
        }
      } catch (error) {
        console.error('Failed to load saved pins', error);
        setSavedPins([]);
        setSavedIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    loadPins();
  }, [user, storageKey]);

  // Persist saved pins per user for reloads
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedPins));
    } catch (error) {
      console.warn('Failed to cache saved pins', error);
    }
  }, [savedPins, storageKey]);

  const resolveSavedAlbumId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (savedAlbumId) return savedAlbumId;
    const album = await ensureAlbumForUser(user.id, 'saved');
    if (album?.id) setSavedAlbumId(album.id);
    return album?.id ?? null;
  }, [savedAlbumId, user]);

  const savePin = async (photo: Photo) => {
    if (findSavedPin(photo)) {
      console.log('Pin already saved:', photo.id);
      return;
    }

    console.log('Starting save process for pin:', photo.id);
    const pinId = await ensurePinExists(photo);
    if (!pinId) {
      console.error('Failed to resolve pin for saving');
      return;
    }

    console.log('Resolved pin ID:', pinId);
    const savedPhoto = pinId === photo.id ? photo : { ...photo, id: pinId };

    // Add to local state immediately for UI responsiveness
    setSavedPins(prev => [savedPhoto, ...prev]);
    setSavedIds(prev => new Set(prev).add(pinId));
    console.log('Updated local state for pin:', pinId);

    // Save to Supabase
    try {
      const success = await savePinService(pinId);
      if (success) {
        console.log('Successfully saved to Supabase:', pinId);
        const albumId = await resolveSavedAlbumId();
        if (albumId) {
          await addPhotoToAlbum(albumId, savedPhoto);
        }
      } else {
        console.error('Failed to save to Supabase, reverting...');
        // Revert on error
        setSavedPins(prev => prev.filter(p => p.id !== pinId));
        setSavedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(pinId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to save pin', error);
      // Revert on error
      setSavedPins(prev => prev.filter(p => p.id !== pinId));
      setSavedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pinId);
        return newSet;
      });
    }
  };

  const removePin = async (photo: Photo) => {
    const savedPin = findSavedPin(photo);
    if (!savedPin) {
      console.log('Pin not found in saved pins:', photo.id);
      return;
    }

    const pinId = savedPin.id;
    console.log('Removing pin from saved:', pinId);
    
    // Remove from local state
    setSavedPins(prev => prev.filter(p => p.id !== pinId));
    setSavedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(pinId);
      return newSet;
    });

    // Unsave from Supabase
    try {
      const success = await unsavePinService(pinId);
      if (success) {
        console.log('Successfully removed from Supabase:', pinId);
        const albumId = await resolveSavedAlbumId();
        if (albumId) {
          await removePhotoFromAlbumByPhotoId(albumId, pinId);
        }
      } else {
        console.error('Failed to remove from Supabase');
      }
    } catch (error) {
      console.error('Failed to unsave pin', error);
      // Optionally reload pins on error
    }
  };

  const isSaved = (photo: Photo) => {
    return !!findSavedPin(photo);
  };

  return (
    <SavedPinsContext.Provider value={{ savedPins, savePin, removePin, isSaved, loading }}>
      {children}
    </SavedPinsContext.Provider>
  );
}
