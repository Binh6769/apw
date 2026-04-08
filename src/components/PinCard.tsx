import { useState, memo, useRef, useEffect, useMemo } from 'react';
import type { Photo } from '../types';
import { MoreHorizontal, Trash2, Plus, Copy } from 'lucide-react';
import { useSavedPins } from '../hooks/useSavedPins';
import { useToast } from '../hooks/useToast';
import { useUiSettings } from '../hooks/useUiSettings';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { isHistoryAlbumName } from '../services/systemAlbums';

interface PinCardProps {
  photo: Photo;
  onClick: () => void;
  onImageLoad?: (id: string) => void;
  onDelete?: (photo: Photo) => void;
}

export const PinCard = memo(function PinCard({ photo, onClick, onImageLoad, onDelete }: PinCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlbumMenuOpen, setIsAlbumMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isSaved, savePin, removePin } = useSavedPins();
  const { showToast } = useToast();
  const { settings } = useUiSettings();
  const { albums, addPhotoToAlbum } = usePhotoAlbums();
  const navigate = useNavigate();
  const selectableAlbums = useMemo(
    () => albums.filter((album) => !isHistoryAlbumName(album.name)),
    [albums]
  );

  const saved = isSaved(photo);
  const radiusClass =
    settings.cardRadius === 'crisp'
      ? 'rounded-lg'
      : settings.cardRadius === 'soft'
        ? 'rounded-xl'
        : 'rounded-2xl';
  const actionVisibilityClass =
    settings.actionVisibility === 'always'
      ? 'opacity-100'
      : settings.actionVisibility === 'hidden'
        ? 'opacity-0 pointer-events-none'
        : 'opacity-0 group-hover:opacity-100';
  const overlayVisibilityClass =
    settings.actionVisibility === 'always'
      ? 'opacity-100'
      : settings.actionVisibility === 'hidden'
        ? 'opacity-0'
        : 'opacity-0 group-hover:opacity-100';

  // Intersection Observer for lazy loading images only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' } // Start loading 50px before the image comes into view
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsAlbumMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removePin(photo);
      showToast('Removed from Profile', 'info');
    } else {
      savePin(photo);
      showToast('Saved to Profile', 'success');
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(photo);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied!', 'success');
  };

  const handleAddToAlbum = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addPhotoToAlbum(albumId, photo);
      showToast('Added to album', 'success');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error adding photo to album:', error);
      showToast('Failed to add to album', 'error');
    }
  };

  const handleCreateAlbum = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/albums', { state: { openCreate: true } });
    setIsMenuOpen(false);
    setIsAlbumMenuOpen(false);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // Aspect ratio calculation for the placeholder container
  const ratio = (photo.height && photo.width) ? (photo.height / photo.width) : 1.5;
  const aspectRatio = (isNaN(ratio) || !isFinite(ratio) ? 1.5 : ratio) * 100;

  return (
    <div
      ref={cardRef}
      className="relative mb-4 group cursor-zoom-in"
      onClick={onClick}
    >
      <div
        className={clsx("relative overflow-hidden bg-anime-surface-muted", radiusClass, !isLoaded && "animate-pulse")}
        style={{ paddingBottom: `${aspectRatio}%`, backgroundColor: photo.color }}
      >
        {isVisible && (
          <img
            src={photo.urls.regular}
            alt={photo.alt_description || 'Pin'}
            className={clsx(
              "absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => {
              setIsLoaded(true);
              onImageLoad?.(photo.id);
            }}
            loading="lazy"
          />
        )}

        {/* Overlay */}
        <div
          className={clsx(
            "absolute inset-0 bg-black/20 transition-opacity duration-200 pointer-events-none",
            overlayVisibilityClass
          )}
        />
        {/* Hover Actions */}
        <div
          className={clsx(
            "absolute inset-0 p-3 flex flex-col justify-between transition-opacity duration-200 pointer-events-none",
            actionVisibilityClass
          )}
        >
          <div className="flex justify-end pointer-events-auto">
            <button
              className={clsx(
              "font-bold px-4 py-3 rounded-full transition-colors",
              saved
                ? "bg-anime-border text-white hover:bg-anime-border"
                : "bg-anime-cta text-white hover:bg-[#e11d48] shadow-[0_0_10px_rgba(244,63,94,0.4)]"
            )}
            onClick={handleSave}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="flex justify-end items-end pointer-events-auto">
          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  className="bg-anime-surface-muted/90 backdrop-blur p-2 rounded-full hover:bg-anime-primary hover:text-white transition-colors text-gray-200"
                  onClick={handleDelete}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                className="bg-anime-surface-muted/90 backdrop-blur p-2 rounded-full hover:bg-anime-border transition-colors text-gray-200"
                onClick={handleShare}
                title="Copy link"
              >
                <Copy size={16} />
              </button>
            </div>

            {/* More Menu */}
            <div className="relative" ref={menuRef}>
              <button
                className="bg-anime-surface-muted/90 backdrop-blur p-2 rounded-full hover:bg-anime-border transition-colors text-gray-200"
                onClick={handleMoreClick}
                title="More options"
              >
                <MoreHorizontal size={16} />
              </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-anime-surface-muted rounded-lg shadow-xl border border-anime-border overflow-hidden z-50 min-w-max animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleViewDetails}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-anime-border transition-colors"
                >
                  View Details
                </button>

                <div className="border-t border-anime-border"></div>
                <div className="relative">
                  <button
                    onClick={() => setIsAlbumMenuOpen(!isAlbumMenuOpen)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-anime-border transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Plus size={14} />
                      Add to Album
                    </span>
                  </button>

                  {isAlbumMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-1 bg-anime-surface-muted rounded-lg shadow-lg border border-anime-border overflow-hidden z-50 max-h-60 overflow-y-auto min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
                      {selectableAlbums.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-400">No albums yet</div>
                      )}
                      {selectableAlbums.map(album => (
                        <button
                          key={album.id}
                          onClick={(e) => handleAddToAlbum(album.id, e)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-anime-primary/20 hover:text-anime-secondary transition-colors whitespace-nowrap"
                        >
                          {album.name}
                        </button>
                      ))}
                      <div className="border-t border-anime-border"></div>
                      <button
                        onClick={handleCreateAlbum}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-anime-border transition-colors"
                      >
                        Create album
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Info Section (Outside Image) */}
      <div className="mt-2 flex flex-col gap-1 px-1">
        {photo.alt_description && (
          <h3 className="text-sm font-semibold text-anime-text truncate" title={photo.alt_description}>
            {photo.alt_description}
          </h3>
        )}
        <div className="flex items-center justify-between mt-0.5">
          {photo.user?.name && (
            <p className="text-xs text-anime-muted truncate max-w-[60%]">{photo.user.name}</p>
          )}
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap justify-end flex-1 ml-2">
              {photo.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-anime-surface-strong text-anime-text px-2 py-0.5 rounded-md border border-anime-border truncate" title={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
