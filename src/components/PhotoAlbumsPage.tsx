import { useState, useEffect, useMemo } from 'react';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
import { useToast } from '../hooks/useToast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Trash2, Lock, Globe, Calendar, ImageIcon, X, Check } from 'lucide-react';
import { Header } from './Header';

export default function PhotoAlbumsPage() {
  const { albums, loading, creating, loadAlbums, createNewAlbum, deleteCurrentAlbum, searchUserAlbums } = usePhotoAlbums();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  useEffect(() => {
    loadAlbums();
  }, []);
  
  useEffect(() => {
    if (location.state && (location.state as { openCreate?: boolean }).openCreate) {
      setCreatingNew(true);
    }
  }, [location.state]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUserAlbums(query);
  };

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
    
    await deleteCurrentAlbum(albumId);
    showToast('Album deleted successfully', 'success');
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
    return albums;
  }, [albums]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-8">
      <Header />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Albums</h1>
          </div>
          <p className="text-gray-600">
            Create and organize your favorite photos into albums for easy access and review.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Create New Album Card (Like YouTube) */}
            {!creatingNew && (
              <div
                onClick={() => setCreatingNew(true)}
                className="mb-6 bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer overflow-hidden group"
              >
                <div className="relative w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                  <Plus className="w-16 h-16 text-blue-600/50 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Album</h3>
                  <p className="text-sm text-gray-500">Click to add a new album</p>
                </div>
              </div>
            )}

            {/* Create New Album Input (Inline) */}
            {creatingNew && (
              <div className="mb-6 bg-white rounded-lg shadow p-6 border-2 border-blue-500">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Album Name</label>
                    <input
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="Enter album name..."
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                      value={newAlbumDescription}
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCreatingNew(false);
                        setNewAlbumName('');
                        setNewAlbumDescription('');
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAlbum}
                      disabled={creating || !newAlbumName.trim()}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Albums List */}
            {filteredAlbums.length === 0 && !creatingNew ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {searchQuery ? 'No albums found matching your search.' : 'No albums yet. Create your first album!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => handleAlbumClick(album.id)}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                  >
                    {/* Album Cover */}
                    <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {album.cover_image_url ? (
                        <img
                          src={album.cover_image_url}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleDeleteAlbum(album.id, e)}
                          className="p-3 bg-white rounded-full hover:bg-red-50 transition-colors"
                          title="Delete album"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Album Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1 truncate">{album.name}</h3>
                        {album.is_public ? (
                          <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      {album.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{album.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(album.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
