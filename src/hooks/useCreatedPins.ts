import { useContext } from 'react';
import { CreatedPinsContext } from '../contexts/CreatedPinsContext';

export function useCreatedPins() {
  const context = useContext(CreatedPinsContext);
  if (context === undefined) {
    throw new Error('useCreatedPins must be used within a CreatedPinsProvider');
  }
  return context;
}
