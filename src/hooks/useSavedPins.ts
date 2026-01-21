import { useContext } from 'react';
import { SavedPinsContext } from '../contexts/SavedPinsContext';

export function useSavedPins() {
  const context = useContext(SavedPinsContext);
  
  if (context === undefined) {
    throw new Error('useSavedPins must be used within a SavedPinsProvider');
  }

  return context;
}
