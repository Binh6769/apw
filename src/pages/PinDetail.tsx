import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchPhotoById, fetchRelatedPhotos } from '../api/unsplash';
import { fetchPinById } from '../services/pinsService';
import { ArrowLeft, MoreHorizontal, Share, Download, Heart, Trash2, ThumbsUp } from 'lucide-react';
import { useSavedPins } from '../hooks/useSavedPins';
import { useToast } from '../hooks/useToast';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../contexts/AuthContext';
import { useImageHistory } from '../hooks/useImageHistory';
import { MasonryGrid } from '../components/MasonryGrid';
import { Header } from '../components/Header'; // Added Header import
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { deletePin } from '../services/pinsService';
import type { Photo } from '../types';
import { usePhotoAlbums } from '../hooks/usePhotoAlbums';
import { addPhotoToAlbum, removePhotoFromAlbum, ensureAlbumForUser, removePhotoFromAlbumByPhotoId } from '../services/photoAlbumService';
import { fetchReactions, toggleReaction } from '../services/reactionsService';

interface PinDetailWrapperProps {
  isModal: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const PinDetailWrapper = ({ isModal, onClose, children }: PinDetailWrapperProps) => {
  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/80 pt-16 pb-16 cursor-zoom-out"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[1016px] mx-4 cursor-default min-h-min"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button for modal */}
          <button
            onClick={onClose}
            className="absolute -right-12 top-0 text-white p-2 hover:bg-white/10 rounded-full hidden md:block"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          {children}
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-anime-bg text-gray-200 pt-20">{children}</div>;
};

export function PinDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSaved, savePin, removePin } = useSavedPins();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { recordView } = useImageHistory();
  const { albums, createNewAlbum, loadAlbums } = usePhotoAlbums();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactions, setReactions] = useState({ likes: 0, loves: 0, isLiked: false, isLoved: false });
  const [loadingReactions, setLoadingReactions] = useState(false);
  const albumId = location.state?.albumId as string | undefined;
  const albumPhotoId = location.state?.albumPhotoId as string | undefined;
  const relatedObserverRef = useRef<HTMLDivElement | null>(null);
  const seenRelatedIds = useRef<Set<string>>(new Set());

  // Check if we are in a modal
  const isModal = !!location.state?.background;

  // Fetch Main Photo
  const cachedPhoto = location.state?.photo;

  // Safety check: only use cachedPhoto if it matches the current ID
  // This prevents displaying stale photo data when navigating between pins
  const validCachedPhoto = cachedPhoto?.id === id ? cachedPhoto : undefined;

  const { data: fetchedPhoto, isLoading } = useQuery({
    queryKey: ['photo', id],
    queryFn: async () => {
      // Try to fetch from Supabase first
      if (id) {
        const pin = await fetchPinById(id);
        if (pin) return pin;
      }
      // Fall back to external APIs
      return id ? fetchPhotoById(id) : null;
    },
    enabled: !!id && !validCachedPhoto,
  });

  const photo = validCachedPhoto || fetchedPhoto;

  // Record image view when photo loads
  useEffect(() => {
    if (photo && user) {
      recordView(photo, 'unsplash');
    }
  }, [photo, user, recordView]);

  useEffect(() => {
    if (!id) return;
    setLoadingReactions(true);
    fetchReactions(id)
      .then(setReactions)
      .catch((error) => console.error('Failed to load reactions', error))
      .finally(() => setLoadingReactions(false));
  }, [id, user?.id]);

  const { comments, addComment, deleteComment } = useComments(photo?.id || '');

  const saved = photo ? isSaved(photo) : false;

  // Check if user is the pin creator
  const isUserPin = photo?.user?.username === user?.id || photo?.id?.startsWith('local-');

  const {
    data: relatedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: relatedStatus,
  } = useInfiniteQuery({
    queryKey: ['related', id],
    queryFn: ({ pageParam = 1 }) =>
      photo ? fetchRelatedPhotos(id || '', photo, pageParam, 24, seenRelatedIds.current) : Promise.resolve({ items: [], hasMore: false }),
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length + 1 : undefined),
    initialPageParam: 1,
    enabled: !!id && !!photo,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const relatedPhotos = useMemo(() => {
    const combined = relatedPages?.pages.flatMap((page) => page.items) || [];
    const dedup = new Map<string, Photo & { _imageId?: string }>();
    combined.forEach((item) => {
      if (!dedup.has(item.id)) {
        dedup.set(item.id, { ...item, _imageId: item.id });
      }
    });
    seenRelatedIds.current = new Set(dedup.keys());
    return Array.from(dedup.values());
  }, [relatedPages]);

  useEffect(() => {
    const el = relatedObserverRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = () => {
    if (!photo) return;
    if (saved) {
      removePin(photo);
      showToast('Removed from Profile', 'info');
    } else {
      savePin(photo);
      showToast('Saved to Profile', 'success');
    }
  };

  const handleToggleReaction = async (type: 'likes' | 'loves') => {
    if (!id || !user) return;
    const isLike = type === 'likes';
    const nextState = isLike ? !reactions.isLiked : !reactions.isLoved;
    const delta = nextState ? 1 : -1;

    setReactions((prev) => ({
      ...prev,
      likes: isLike ? Math.max(0, prev.likes + delta) : prev.likes,
      loves: !isLike ? Math.max(0, prev.loves + delta) : prev.loves,
      isLiked: isLike ? nextState : prev.isLiked,
      isLoved: !isLike ? nextState : prev.isLoved,
    }));

    const success = await toggleReaction(id, type, nextState);
    
    if (success && type === 'loves' && photo) {
      ensureAlbumForUser(user.id, 'loved').then(album => {
        if (album) {
          if (nextState) {
            addPhotoToAlbum(album.id, photo).catch(console.error);
          } else {
            removePhotoFromAlbumByPhotoId(album.id, photo.id).catch(console.error);
          }
        }
      });
    }

    if (!success) {
      // revert
      setReactions((prev) => ({
        ...prev,
        likes: isLike ? Math.max(0, prev.likes - delta) : prev.likes,
        loves: !isLike ? Math.max(0, prev.loves - delta) : prev.loves,
        isLiked: isLike ? !nextState : prev.isLiked,
        isLoved: !isLike ? !nextState : prev.isLoved,
      }));
      showToast('Could not update reaction', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !isUserPin) return;

    if (!confirm('Are you sure you want to delete this pin?')) return;

    setIsDeleting(true);
    try {
      const success = await deletePin(id);
      if (success) {
        showToast('Pin deleted successfully', 'success');
        setTimeout(() => navigate('/profile'), 500);
      } else {
        showToast('Failed to delete pin', 'error');
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      showToast('Failed to delete pin', 'error');
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
    setIsMenuOpen(false);
  };

  const handleReport = () => {
    showToast('Pin reported. Thanks for your feedback.', 'success');
    setIsMenuOpen(false);
  };

  const handleRemoveFromAlbum = async () => {
    if (!albumPhotoId || !albumId) return;
    if (!confirm('Remove this image from the album?')) return;

    try {
      const success = await removePhotoFromAlbum(albumPhotoId);
      if (success) {
        showToast('Removed from album', 'success');
        navigate(`/album/${albumId}`);
      } else {
        showToast('Failed to remove from album', 'error');
      }
    } catch (error) {
      console.error('Failed to remove from album:', error);
      showToast('Failed to remove from album', 'error');
    } finally {
      setIsMenuOpen(false);
    }
  };

  const openAlbumModal = () => {
    if (!photo) return;
    loadAlbums();
    setIsAlbumModalOpen(true);
    setShowCreateAlbum(false);
    setIsMenuOpen(false);
  };

  const handleAddToAlbum = async (albumId: string) => {
    if (!photo) return;
    try {
      const success = await addPhotoToAlbum(albumId, photo);
      if (success) {
        showToast('Added to album', 'success');
        setIsAlbumModalOpen(false);
      } else {
        showToast('Failed to add to album', 'error');
      }
    } catch (error) {
      console.error('Failed to add to album:', error);
      showToast('Failed to add to album', 'error');
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      showToast('Album name is required', 'error');
      return;
    }
    if (!photo) return;

    setIsCreatingAlbum(true);
    try {
      const album = await createNewAlbum(newAlbumName.trim());
      if (!album) {
        showToast('Failed to create album', 'error');
        return;
      }
      const success = await addPhotoToAlbum(album.id, photo);
      if (success) {
        showToast('Album created and photo added', 'success');
        setNewAlbumName('');
        setShowCreateAlbum(false);
        setIsAlbumModalOpen(false);
      } else {
        showToast('Album created, but failed to add photo', 'error');
      }
    } catch (error) {
      console.error('Failed to create album:', error);
      showToast('Failed to create album', 'error');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handleAddComment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commentText.trim()) {
      addComment(commentText.trim());
      setCommentText('');
      showToast('Comment added', 'success');
    }
  };

  // Scroll to top only if NOT in modal or if it's a new pin
  // Also ensure we refetch when the ID changes
  useEffect(() => {
    if (!isModal) {
      window.scrollTo(0, 0);
    }
  }, [id, isModal]);

  const handleRelatedClick = (photo: Photo) => {
    // When clicking related pins, pass the complete photo object so the detail page displays the same image
    // Add _imageId to ensure unique identification across navigation
    const photoWithId = { ...photo, _imageId: photo.id };
    if (isModal) {
      // In modal: preserve the background and pass the photo
      navigate(`/pin/${photo.id}`, { state: { background: location.state.background, photo: photoWithId } });
    } else {
      // Not in modal: pass the photo object
      navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModal]);

  if (!photo && isLoading) {
    return (
      <div className={clsx("flex items-center justify-center", isModal ? "h-full w-full" : "min-h-screen bg-anime-bg text-anime-text")}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className={clsx("flex items-center justify-center", isModal ? "h-full w-full text-white" : "min-h-screen bg-anime-bg text-white")}>
        <p>Pin not found.</p>
        <button onClick={() => navigate('/')} className="ml-4 underline hover:text-anime-secondary">Go Home</button>
      </div>
    );
  }

  return (
    <PinDetailWrapper isModal={isModal} onClose={handleBack}>
      {!isModal && <Header />}
      <button
        onClick={handleBack}
        className={clsx(
          "fixed top-24 left-4 z-50 p-3 bg-anime-surface text-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-anime-surface-muted md:hidden transition-colors border border-anime-border",
          isModal && "top-4"
        )}
      >
        <ArrowLeft size={24} />
      </button>

      <div className="flex flex-col items-center w-full">
        {/* Main Card */}
        <div
          className={clsx(
            "bg-anime-surface text-gray-200 w-full max-w-[1016px] flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] rounded-3xl border border-anime-border",
            !isModal && "mt-8"
          )}
        >
          {/* Top: Image */}
          <div className="w-full bg-anime-bg relative flex justify-center items-center">
            <img
              src={photo.urls.full}
              alt={photo.alt_description || 'Pin'}
              className="w-full max-h-[70vh] object-contain"
            />
          </div>

          {/* Bottom: Details */}
          <div className="w-full p-6 md:p-8 flex flex-col bg-anime-surface">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-anime-surface z-10 py-2">
              <div className="flex gap-2 relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  className="p-3 bg-anime-surface-muted hover:bg-anime-surface-strong text-white rounded-full transition-colors relative"
                >
                  <MoreHorizontal size={20} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-anime-bg border border-anime-border rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                    <div onClick={handleCopyLink} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-gray-200 transition-colors">Copy link</div>
                    <a href={photo.urls.full} download target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-gray-200 transition-colors">Download image</a>
                    <div onClick={handleReport} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-gray-200 transition-colors">Report Pin</div>
                    <div className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-gray-200 transition-colors">Get embed code</div>
                    <div onClick={openAlbumModal} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-gray-200 transition-colors">Add to album</div>
                    {albumId && albumPhotoId && (
                      <div onClick={handleRemoveFromAlbum} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-anime-cta transition-colors">Remove from album</div>
                    )}
                    {isUserPin && (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 hover:bg-red-900/30 cursor-pointer text-sm font-semibold text-anime-cta flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Delete Pin
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCopyLink}
                  className="p-3 bg-anime-surface-muted hover:bg-anime-surface-strong text-white rounded-full transition-colors"
                  title="Copy Link"
                >
                  <Share size={20} />
                </button>
                <a
                  href={photo.urls.full}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-anime-surface-muted hover:bg-anime-surface-strong text-white rounded-full transition-colors"
                  title="Download Image"
                >
                  <Download size={20} />
                </a>
              </div>
              <button
                onClick={handleSave}
                className={clsx(
                  "px-6 py-3 font-bold rounded-full transition-colors shadow-[0_0_10px_rgba(244,63,94,0.4)] hover:shadow-[0_0_15px_rgba(244,63,94,0.6)]",
                  saved
                    ? "bg-anime-surface-muted text-white hover:bg-anime-surface-strong shadow-none hover:shadow-none"
                    : "bg-anime-cta text-white hover:bg-[#e11d48]"
                )}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => handleToggleReaction('likes')}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
                    reactions.isLiked
                      ? "bg-anime-primary/20 border-anime-primary text-anime-primary"
                      : "bg-anime-bg border-anime-border text-gray-300 hover:bg-anime-surface-muted"
                  )}
                  disabled={loadingReactions}
                >
                  <ThumbsUp
                    size={16}
                    className={clsx(
                      reactions.isLiked ? "text-anime-primary fill-anime-primary/20" : "text-gray-400"
                    )}
                  />
                  <span className="text-sm font-semibold">{reactions.likes}</span>
                </button>

                <button
                  onClick={() => handleToggleReaction('loves')}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
                    reactions.isLoved
                      ? "bg-anime-cta/20 border-anime-cta text-anime-cta"
                      : "bg-anime-bg border-anime-border text-gray-300 hover:bg-anime-surface-muted"
                  )}
                  disabled={loadingReactions}
                >
                  <Heart
                    size={16}
                    className={clsx(
                      reactions.isLoved ? "text-anime-cta fill-anime-cta" : "text-gray-400"
                    )}
                  />
                  <span className="text-sm font-semibold">{reactions.loves}</span>
                </button>

                {loadingReactions && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-anime-primary"></div>
                    Updating...
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-anime-text">{photo.alt_description || 'Untitled Pin'}</h1>

              <p className="text-anime-muted mb-6 text-sm leading-relaxed">
                {photo.alt_description}
              </p>

              <div className="flex items-center gap-3 mb-8">
                <img
                  src={photo.user.profile_image.medium}
                  alt={photo.user.name}
                  className="w-12 h-12 rounded-full object-cover bg-anime-bg border border-anime-border"
                />
                <div>
                  <p className="font-semibold text-sm hover:underline cursor-pointer text-anime-text">{photo.user.name}</p>
                  <p className="text-xs text-anime-muted">@{photo.user.username}</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-anime-surface hover:bg-anime-surface-muted border border-anime-border text-anime-text rounded-full font-semibold text-sm transition-colors">
                  Follow
                </button>
              </div>

              <div className="mb-8">
                <a
                  href={photo.urls.raw}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-anime-secondary underline hover:text-anime-primary transition-colors"
                >
                  View Original Image Source
                </a>
                <div className="text-xs text-gray-500 mt-2 font-mono bg-anime-bg inline-block px-2 py-1 rounded">
                  ID: {photo.id}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4 text-anime-text">{comments.length} Comments</h3>
                <div className="flex gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-anime-surface-muted flex-shrink-0 border border-anime-border">
                    {user && (
                      <img src={user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} alt={user.email} className="rounded-full w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={handleAddComment}
                      placeholder="Add a comment"
                      className="w-full bg-anime-bg text-white border border-anime-border rounded-full px-4 py-3 focus:outline-none focus:border-anime-primary focus:ring-1 focus:ring-anime-primary placeholder-gray-500 transition-colors"
                    />
                  </div>
                </div>
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                      <img src={comment.userImage} alt={comment.userName} className="w-8 h-8 rounded-full bg-anime-surface-muted object-cover" />
                      <div className="flex-1">
                        <p className="text-sm text-anime-text"><span className="font-semibold text-anime-text">{comment.userName}</span> {comment.text}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1 items-center">
                          <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                          <span className="cursor-pointer hover:text-white transition-colors">Reply</span>
                          <Heart size={14} className="cursor-pointer hover:fill-anime-cta hover:text-anime-cta transition-colors" />
                          {comment.userId === user?.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-anime-cta ml-auto"
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Pins Section - Optimized with loading state */}
        <div className="w-full max-w-[1440px] px-4 py-12">
          <h2 className="text-center text-xl font-semibold mb-8 text-anime-text tracking-wider">MORE LIKE THIS</h2>
          {relatedStatus === 'pending' ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-anime-primary"></div>
            </div>
          ) : relatedPhotos.length === 0 ? (
            <p className="text-center text-gray-400">No related images found.</p>
          ) : (
            <>
              <MasonryGrid photos={relatedPhotos} onPinClick={handleRelatedClick} />
              <div ref={relatedObserverRef} className="h-10 w-full" />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-anime-primary"></div>
                </div>
              )}
              {!hasNextPage && (
                <p className="text-center text-gray-400 text-sm mt-2">End of recommendations</p>
              )}
            </>
          )}
        </div>
      </div>

      {isAlbumModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsAlbumModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-anime-surface border border-anime-border shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-anime-border">
              <h3 className="text-lg font-semibold text-anime-text">Add to album</h3>
              <button
                onClick={() => setShowCreateAlbum((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-anime-bg hover:bg-anime-primary text-white flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(124,58,237,0)] hover:shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                title="Create new album"
                type="button"
              >
                +
              </button>
            </div>

            {showCreateAlbum && (
              <div className="px-5 py-4 border-b border-anime-border bg-anime-bg">
                <label className="block text-sm font-medium text-gray-300 mb-2">Album name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="New album name"
                    className="flex-1 px-3 py-2 rounded-lg bg-anime-surface text-white border border-anime-border focus:outline-none focus:border-anime-primary focus:ring-1 focus:ring-anime-primary placeholder-gray-500 transition-colors"
                  />
                  <button
                    onClick={handleCreateAlbum}
                    disabled={isCreatingAlbum}
                    className="px-4 py-2 rounded-lg bg-anime-primary text-white hover:bg-anime-secondary disabled:opacity-50 transition-colors font-semibold"
                    type="button"
                  >
                    {isCreatingAlbum ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto px-2 py-2">
              {albums.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">
                  No albums yet. Create one to get started.
                </div>
              ) : (
                albums.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-anime-surface-muted group transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{album.name}</span>
                    <button
                      onClick={() => handleAddToAlbum(album.id)}
                      className="w-8 h-8 rounded-full bg-anime-bg hover:bg-anime-primary text-white flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(124,58,237,0)] hover:shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                      title="Add to album"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PinDetailWrapper>
  );
}
