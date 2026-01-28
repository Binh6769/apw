import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import type { Photo } from '../types';
import { useMediaColumns } from '../hooks/useMediaColumns';
import { useUiSettings } from '../hooks/useUiSettings';
import { useMasonry } from '../hooks/useMasonry';
import { PinCard } from './PinCard';
import clsx from 'clsx';

interface MasonryGridProps {
  photos: Photo[];
  onPinClick: (photo: Photo) => void;
  onPinDelete?: (photo: Photo) => void;
}

function MasonryGridComponent({ photos, onPinClick, onPinDelete }: MasonryGridProps) {
  const { settings } = useUiSettings();
  const columnCount = useMediaColumns(settings.gridColumns);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const densityGap =
    settings.feedDensity === 'compact'
      ? 'gap-2'
      : settings.feedDensity === 'spacious'
        ? 'gap-6'
        : 'gap-4';
  const densityPadding =
    settings.feedDensity === 'compact'
      ? 'py-3'
      : settings.feedDensity === 'spacious'
        ? 'py-6'
        : 'py-4';

  // Optimize loaded tracking
  useEffect(() => {
    if (loadedIds.size === 0) return;
    const next = new Set<string>();
    for (const photo of photos) {
      if (loadedIds.has(photo.id)) {
        next.add(photo.id);
      }
    }
    if (next.size !== loadedIds.size) {
      setLoadedIds(next);
    }
  }, [photos, loadedIds]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Memoize ordered photos to prevent unnecessary recalculations
  const orderedPhotos = useMemo(() => {
    if (photos.length === 0) return [];
    if (loadedIds.size === 0) return photos;
    
    const loaded: Photo[] = [];
    const pending: Photo[] = [];
    
    for (const photo of photos) {
      if (loadedIds.has(photo.id)) {
        loaded.push(photo);
      } else {
        pending.push(photo);
      }
    }
    return [...loaded, ...pending];
  }, [photos, loadedIds]);

  // Compute masonry columns via hook (already memoized internally)
  const columns = useMasonry(orderedPhotos, columnCount);

  // Memoize callback to prevent child re-renders
  const memoizedOnPinClick = useCallback(
    (photo: Photo) => onPinClick(photo),
    [onPinClick]
  );
  const memoizedOnPinDelete = useCallback(
    (photo: Photo) => onPinDelete?.(photo),
    [onPinDelete]
  );

  return (
    <div className={clsx("flex justify-center px-2 md:px-4 w-full max-w-[2000px] mx-auto", densityGap, densityPadding)}>
      {columns.map((col, colIndex) => (
        <div 
          key={colIndex} 
          className={clsx("flex flex-col flex-1 min-w-0", densityGap)}
        >
          {col.map((photo) => (
            <PinCard 
              key={photo.id} 
              photo={photo} 
              onClick={() => memoizedOnPinClick(photo)}
              onDelete={onPinDelete ? memoizedOnPinDelete : undefined}
              onImageLoad={handleImageLoad}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Memoize the entire component to prevent unnecessary re-renders from parent
export const MasonryGrid = memo(MasonryGridComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if photos array changed or callbacks changed
  return (
    prevProps.photos === nextProps.photos &&
    prevProps.onPinClick === nextProps.onPinClick &&
    prevProps.onPinDelete === nextProps.onPinDelete
  );
});
