import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
import { useToast } from '../hooks/useToast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Trash2, Lock, Globe, Calendar, ImageIcon, X, Check, Shield } from 'lucide-react';
import { Header } from './Header';
import { isSavedAlbumName, isHistoryAlbumName, isLovedAlbumName } from '../services/systemAlbums';

export default function PhotoAlbumsPage() {
  const { albums, loading, creating, loadAlbums, createNewAlbum, deleteCurrentAlbum, searchUserAlbums } = usePhotoAlbums();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAlbums();
  }, []);
  
  useEffect(() => {
    if (location.state && (location.state as { openCreate?: boolean }).openCreate) {
      setCreatingNew(true);
    }
  }, [location.state]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchUserAlbums(query);
    }, 300);
  }, [searchUserAlbums]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      showToast('Album name is required', 'error');
      return;
    }

    const newAlbum = await createNewAlbum(newAlbumName, newAlbumDescription);
    if (newAlbum) {
      showToast('Album created successfully', 'success');
      setNewAlbumName('');
      setNewAlbumDescription('');
      setCreatingNew(false);
    } else {
      showToast('Failed to create album', 'error');
    }
  };

  const handleDeleteAlbum = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    const deleted = await deleteCurrentAlbum(albumId);
    if (deleted) {
      showToast('Album deleted successfully', 'success');
    } else {
      showToast('Failed to delete album', 'error');
    }
  };

  const handleAlbumClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  };

  // Filter albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => !isHistoryAlbumName(album.name));
  }, [albums]);

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20 pb-8">
      <Header />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-anime-primary to-anime-secondary flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-anime-text">My Albums</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Organize your favorite photos into beautiful albums
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-anime-border bg-anime-surface focus:outline-none focus:ring-2 focus:ring-anime-primary focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Create New Album Card (Pinterest-style compact) */}
            {!creatingNew && (
              <div
                onClick={() => setCreatingNew(true)}
                className="group relative bg-anime-surface rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-anime-primary/20 transition-all duration-300 border-2 border-dashed border-anime-border hover:border-anime-primary"
              >
                <div className="relative w-full aspect-square bg-gradient-to-br from-anime-bg to-anime-surface flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-anime-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-6 h-6 text-anime-primary" />
                  </div>
                </div>
                <div className="p-3 text-center">
                  <h3 className="text-sm font-semibold text-anime-text">New Album</h3>
                </div>
              </div>
            )}

            {/* Create New Album Input (Compact Inline) */}
            {creatingNew && (
              <div className="col-span-full bg-anime-surface rounded-2xl p-6 border-2 border-anime-primary shadow-lg">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-anime-text mb-1.5">Album Name</label>
                    <input
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="Enter album name..."
                      autoFocus
                      className="w-full px-4 py-2.5 border border-anime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-anime-primary focus:border-transparent bg-anime-bg"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-anime-text mb-1.5">Description (Optional)</label>
                    <input
                      type="text"
                      value={newAlbumDescription}
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="w-full px-4 py-2.5 border border-anime-border rounded-xl focus:outline-none focus:ring-2 focus:ring-anime-primary focus:border-transparent bg-anime-bg"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setCreatingNew(false);
                        setNewAlbumName('');
                        setNewAlbumDescription('');
                      }}
                      className="px-5 py-2.5 border border-anime-border rounded-xl hover:bg-anime-bg font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAlbum}
                      disabled={creating || !newAlbumName.trim()}
                      className="px-5 py-2.5 bg-anime-primary text-white rounded-xl hover:bg-anime-secondary disabled:bg-blue-400 font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

{/* Albums List */}
            {filteredAlbums.length === 0 && !creatingNew ? (
              <div className="col-span-full bg-anime-surface rounded-2xl p-12 text-center border border-anime-border">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-anime-bg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  {searchQuery ? 'No albums found' : 'No albums yet'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create your first album to get started'}
                </p>
              </div>
            ) : (
              filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => handleAlbumClick(album.id)}
                  className="group relative bg-anime-surface rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-anime-primary/10 transition-all duration-300 border border-anime-border hover:border-anime-primary/50"
                >
                  {/* Album Cover */}
                  <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-anime-primary/5 to-anime-secondary/5">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    {!isSavedAlbumName(album.name) && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => handleDeleteAlbum(album.id, e)}
                          className="p-3 bg-white/90 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                          title="Delete album"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-anime-text truncate flex-1">{album.name}</h3>
                      <div className="flex-shrink-0">
                        {isSavedAlbumName(album.name) || isLovedAlbumName(album.name) ? (
                          <Shield className="w-4 h-4 text-anime-primary" />
                        ) : album.is_public ? (
                          <Globe className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {album.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{album.description}</p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(album.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
