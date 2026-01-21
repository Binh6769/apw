import { useContext } from 'react';
import { PhotoAlbumContext } from '../contexts/PhotoAlbumContext';

export function usePhotoAlbums() {
  const context = useContext(PhotoAlbumContext);
  if (!context) {
    throw new Error('usePhotoAlbums must be used within a PhotoAlbumProvider');
  }
  return context;
}
