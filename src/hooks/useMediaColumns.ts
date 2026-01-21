import { useState, useEffect } from 'react';
import type { GridColumns } from '../contexts/UISettingsContext';

const getBaseColumns = (width: number) => {
  if (width >= 1536) return 7;      // 2xl
  if (width >= 1280) return 6;      // xl
  if (width >= 1024) return 5;      // lg
  if (width >= 768) return 3;       // md
  return 2;                         // sm/mobile
};

export function useMediaColumns(preferredColumns: GridColumns = 'auto') {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      const baseColumns = getBaseColumns(width);
      if (preferredColumns === 'auto') {
        setColumns(baseColumns);
        return;
      }
      setColumns(Math.max(2, Math.min(preferredColumns, baseColumns)));
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [preferredColumns]);

  return columns;
}
