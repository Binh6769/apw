import { useContext } from 'react';
import { UISettingsContext } from '../contexts/UISettingsContext';

export function useUiSettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUiSettings must be used within a UISettingsProvider');
  }
  return context;
}
