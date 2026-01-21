import { useMemo } from 'react';
import type { Photo } from '../types';

export function useMasonry(items: Photo[], columnCount: number) {
  return useMemo(() => {
    // Create empty buckets for each column
    const safeColumnCount = columnCount > 0 ? columnCount : 2;
    const cols = Array.from({ length: safeColumnCount }, () => [] as Photo[]);
    const colHeights = Array.from({ length: safeColumnCount }, () => 0);

    items.forEach(item => {
      // Find the shortest column
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      
      // Add item to the shortest column
      cols[shortestColIndex].push(item);
      
      // Update height of that column
      // Height unit = width / aspect_ratio. Since width is fixed per column in grid, 
      // relative height is proportional to item.height / item.width
      const aspectRatio = (item.width && item.height) ? (item.width / item.height) : 0.66;
      const relativeHeight = 1 / aspectRatio;
      
      if (!isNaN(relativeHeight) && isFinite(relativeHeight)) {
         colHeights[shortestColIndex] += relativeHeight;
      } else {
         colHeights[shortestColIndex] += 1.5; // Default increment
      }
    });

    return cols;
  }, [items, columnCount]);
}
