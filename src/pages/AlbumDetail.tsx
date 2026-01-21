import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
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

  useEffect(() => {
    if (!albumId) return;
    loadAlbumDetails();
  }, [albumId]);

  const loadAlbumDetails = async () => {
    try {
      setLoading(true);
      await loadAlbum(albumId!);
      // Convert album photos to Photo objects
      const photoObjects: Photo[] = (currentAlbumPhotos || []).map((p: any) => ({
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
      setPhotos(photoObjects);
    } catch (error) {
      console.error('Error loading album:', error);
      showToast('Failed to load album', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update photos when currentAlbumPhotos changes
  useEffect(() => {
    if (currentAlbumPhotos && currentAlbumPhotos.length > 0) {
      const photoObjects: Photo[] = currentAlbumPhotos.map((p: any) => ({
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
      setPhotos(photoObjects);
    }
  }, [currentAlbumPhotos]);


  const handleRemovePhoto = async (photoId: string) => {
    if (!confirm('Remove this image from album?')) return;
    
    try {
      // Find the album photo record ID to remove
      const albumPhoto = currentAlbumPhotos.find(p => p.photo_id === photoId);
      if (albumPhoto) {
        await removePhotoFromCurrentAlbum(albumPhoto.id);
        setPhotos(photos.filter(p => p.id !== photoId));
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
  let filteredPhotos = useMemo(() => {
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
        // Newest would be reversed order (or based on added_at if we had it)
        return sorted.reverse();
      case 'oldest':
        return sorted;
      case 'custom':
      default:
        return sorted;
    }
  }, [filteredPhotos, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Album not found</p>
          <button
            onClick={() => navigate('/albums')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Albums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/albums')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Albums
          </button>
          
          <div className="flex items-start gap-6">
            {/* Album Cover */}
            {currentAlbum.cover_image_url && (
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={currentAlbum.cover_image_url}
                  alt={currentAlbum.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Album Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentAlbum.name}</h1>
              {currentAlbum.description && (
                <p className="text-gray-600 mb-3">{currentAlbum.description}</p>
              )}
              <p className="text-sm text-gray-500">
                {sortedPhotos.length} image{sortedPhotos.length !== 1 ? 's' : ''} in album
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-3 flex-col md:flex-row">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search images in this album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="custom">Custom Order</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Images Grid */}
        {sortedPhotos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No images found matching your search.' : 'No images in this album yet.'}
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
