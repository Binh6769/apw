import { useContext } from 'react';
import { ImageHistoryContext } from '../contexts/ImageHistoryContext';

export function useImageHistory() {
  const context = useContext(ImageHistoryContext);
  if (!context) {
    throw new Error('useImageHistory must be used within an ImageHistoryProvider');
  }
  return context;
}
