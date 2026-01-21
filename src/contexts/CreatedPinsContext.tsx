/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Photo } from '../types';
import { fetchUserPins, deletePin as deletePinService } from '../services/pinsService';
import { deleteImage } from '../services/storageService';
import { useAuth } from './AuthContext';

interface CreatedPinsContextType {
  createdPins: Photo[];
  addPin: (pin: Photo) => void;
  removePin: (pin: Photo) => Promise<boolean>;
  loading: boolean;
}

export const CreatedPinsContext = createContext<CreatedPinsContextType | undefined>(undefined);

export function CreatedPinsProvider({ children }: { children: ReactNode }) {
  const [createdPins, setCreatedPins] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load created pins from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setCreatedPins([]);
      setLoading(false);
      return;
    }

    // Only treat pins backed by our own uploads as "created"
    const isUserUploadedPin = (pin: Photo) =>
      !!pin.urls.full && pin.urls.full.includes('/pin-images/');

    const loadPins = async () => {
      setLoading(true);
      try {
        const pins = await fetchUserPins(user.id);
        setCreatedPins(pins.filter(isUserUploadedPin));
      } catch (error) {
        console.error('Failed to load created pins', error);
        setCreatedPins([]);
      } finally {
        setLoading(false);
      }
    };

    loadPins();
  }, [user]);

  const addPin = async (pin: Photo) => {
    // Add to local state immediately for UI responsiveness
    setCreatedPins(prev => [pin, ...prev]);
  };

  const removePin = async (pin: Photo) => {
    // Remove from local state
    setCreatedPins(prev => prev.filter(p => p.id !== pin.id));

    const imageUrl = pin.urls.full || pin.urls.regular;

    // Delete from Supabase storage (if this is a user-uploaded pin)
    try {
      let imageDeleted = true;
      if (imageUrl && imageUrl.includes('/pin-images/')) {
        imageDeleted = await deleteImage(imageUrl);
      }
      const deleted = await deletePinService(pin.id);
      return imageDeleted && deleted;
    } catch (error) {
      console.error('Failed to delete pin', error);
      return false;
    }
  };

  return (
    <CreatedPinsContext.Provider value={{ createdPins, addPin, removePin, loading }}>
      {children}
    </CreatedPinsContext.Provider>
  );
}
