import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
import type { AlbumPhoto } from '../services/photoAlbumService';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, SortAsc, Search, ImageIcon } from 'lucide-react';
import { MasonryGrid } from '../components/MasonryGrid';
import type { Photo } from '../types';

type SortBy = 'az' | 'za' | 'newest' | 'oldest' | 'custom';

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { loadAlbum, currentAlbum, currentAlbumPhotos, removePhotoFromCurrentAlbum } = usePhotoAlbums();
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('custom');
  const [searchQuery, setSearchQuery] = useState('');

  const convertAlbumPhotosToPhotos = (albumPhotos: AlbumPhoto[]): Photo[] => {
    return albumPhotos.map((p: AlbumPhoto) => ({
      id: p.photo_id,
      urls: {
        regular: p.photo_url,
        raw: p.photo_url,
        full: p.photo_url,
        small: p.photo_url,
        thumb: p.photo_url
      },
      alt_description: p.photo_title || '',
      width: p.photo_width || 400,
      height: p.photo_height || 600,
      color: p.photo_color || '#e5e7eb',
      user: { name: 'Album', username: 'album', profile_image: { small: '', medium: '', large: '' } },
      likes: 0,
      description: p.photo_title
    } as Photo));
  };

  useEffect(() => {
    if (!albumId) return;
    setLoading(true);
    loadAlbum(albumId).finally(() => setLoading(false));
  }, [albumId, loadAlbum]);

  // Update photos when currentAlbumPhotos changes (handles both initial load and updates)
  useEffect(() => {
    if (!loading && currentAlbumPhotos) {
      setPhotos(convertAlbumPhotosToPhotos(currentAlbumPhotos));
    }
  }, [currentAlbumPhotos, loading]);


  const handleRemovePhoto = async (photoId: string) => {
    if (!confirm('Remove this image from album?')) return;

    try {
      // Find the album photo record ID to remove
      const albumPhoto = currentAlbumPhotos.find(p => p.photo_id === photoId);
      if (albumPhoto) {
        await removePhotoFromCurrentAlbum(albumPhoto.id);
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        showToast('Image removed from album', 'success');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      showToast('Failed to remove image', 'error');
    }
  };

  const handlePinClick = (photo: Photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    const albumPhoto = currentAlbumPhotos.find((p) => p.photo_id === photo.id);
    navigate(`/pin/${photo.id}`, {
      state: {
        photo: photoWithId,
        fromAlbum: true,
        albumId,
        albumPhotoId: albumPhoto?.id,
      },
    });
  };

  // Filter by search
  const filteredPhotos = useMemo(() => {
    return photos.filter(p =>
      !searchQuery ||
      p.alt_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [photos, searchQuery]);

  // Sort photos
  const sortedPhotos = useMemo(() => {
    const sorted = [...filteredPhotos];

    switch (sortBy) {
      case 'az':
        return sorted.sort((a, b) =>
          (a.alt_description || '').localeCompare(b.alt_description || '')
        );
      case 'za':
        return sorted.sort((a, b) =>
          (b.alt_description || '').localeCompare(a.alt_description || '')
        );
      case 'newest':
        return sorted;
      case 'oldest':
        return sorted.reverse();
      case 'custom':
      default:
        return sorted;
    }
  }, [filteredPhotos, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-bg flex items-center justify-center text-anime-text pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-anime-primary"></div>
          <p className="text-gray-400 text-sm">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className="min-h-screen bg-anime-bg flex items-center justify-center text-anime-text pt-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-anime-surface flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-300 text-lg mb-4 font-medium">Album not found</p>
          <button
            onClick={() => navigate('/albums')}
            className="px-5 py-2.5 bg-anime-primary text-white rounded-xl hover:bg-anime-secondary text-sm font-medium transition-colors"
          >
            Back to Albums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-bg py-6 text-anime-text pt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/albums')}
            className="inline-flex items-center gap-2 text-anime-primary hover:text-anime-secondary mb-4 font-medium transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Albums
          </button>

          <div className="flex items-center gap-4">
            {/* Album Cover */}
            {currentAlbum.cover_image_url && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                <img
                  src={currentAlbum.cover_image_url}
                  alt={currentAlbum.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Album Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-anime-text truncate">{currentAlbum.name}</h1>
              {currentAlbum.description && (
                <p className="text-gray-400 text-sm mt-1 truncate">{currentAlbum.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {sortedPhotos.length} image{sortedPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-3 flex-col sm:flex-row">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-anime-border bg-anime-surface text-anime-text text-sm focus:outline-none focus:ring-2 focus:ring-anime-primary"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <SortAsc className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-xl border border-anime-border bg-anime-surface text-anime-text text-sm focus:outline-none focus:ring-2 focus:ring-anime-primary cursor-pointer"
            >
              <option value="custom">Custom</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Images Grid */}
        {sortedPhotos.length === 0 ? (
          <div className="bg-anime-surface rounded-2xl border border-anime-border p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-anime-bg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-300 font-medium">
              {searchQuery ? 'No images found' : 'No images yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Add photos to this album from the browse page'}
            </p>
          </div>
        ) : (
          <MasonryGrid
            photos={sortedPhotos}
            onPinClick={handlePinClick}
            onPinDelete={(photo) => handleRemovePhoto(photo.id)}
          />
        )}
      </div>
    </div>
  );
}
