import { useEffect } from 'react';
import { useSavedPins } from '../hooks/useSavedPins';
import { useAuth } from '../contexts/AuthContext';
import { MasonryGrid } from '../components/MasonryGrid';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { BookmarkX, Loader2 } from 'lucide-react';
import type { Photo } from '../types';

export function Saved() {
  const { savedPins, loading } = useSavedPins();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePinClick = (photo: Photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { from: 'saved', photo: photoWithId } });
  };

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
      <Header />

      <div className="container mx-auto">
        <div className="px-4 py-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Saved Pins</h1>
          <p className="text-gray-600">
            {savedPins.length} pin{savedPins.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : savedPins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookmarkX size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No saved pins yet</h2>
            <p className="text-gray-500 mb-6">Save pins from the home page to see them here</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-anime-primary text-white rounded-full hover:bg-anime-secondary transition-colors mt-4"
              type="button"
            >
              Browse Pins
            </button>
          </div>
        ) : (
          <MasonryGrid
            photos={savedPins}
            onPinClick={handlePinClick}
          />
        )}
      </div>
    </div>
  );
}
