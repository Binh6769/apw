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
import { addPhotoToAlbum, removePhotoFromAlbum } from '../services/photoAlbumService';
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
  return <div className="min-h-screen bg-white pt-20">{children}</div>;
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
  }, [photo?.id, user?.id]);

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
    const dedup = new Map<string, any>();
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
      <div className={clsx("flex items-center justify-center", isModal ? "h-full w-full" : "min-h-screen bg-white")}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className={clsx("flex items-center justify-center", isModal ? "h-full w-full" : "min-h-screen bg-white")}>
         <p>Pin not found.</p>
         <button onClick={() => navigate('/')} className="ml-4 underline">Go Home</button>
      </div>
    );
  }

  return (
    <PinDetailWrapper isModal={isModal} onClose={handleBack}>
      {!isModal && <Header />}
      <button 
        onClick={handleBack} 
        className={clsx(
           "fixed top-24 left-4 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 md:hidden",
           isModal && "top-4"
        )}
      >
        <ArrowLeft size={24} />
      </button>

      <div className="flex flex-col items-center w-full">
        {/* Main Card */}
        <div 
            className={clsx(
               "bg-white w-full max-w-[1016px] flex flex-col md:flex-row overflow-hidden shadow-sm rounded-3xl border border-gray-100",
               !isModal && "mt-8"
            )}
        >
            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-gray-50 relative group">
            <img 
                src={photo.urls.full} 
                alt={photo.alt_description || 'Pin'} 
                className="w-full h-full object-contain md:object-cover" 
            />
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10">
                <div className="flex gap-2 relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-3 hover:bg-gray-100 rounded-full transition-colors relative"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                           <div onClick={handleCopyLink} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Copy link</div>
                           <a href={photo.urls.full} download target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold text-black">Download image</a>
                           <div onClick={handleReport} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Report Pin</div>
                           <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Get embed code</div>
                           <div onClick={openAlbumModal} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Add to album</div>
                           {albumId && albumPhotoId && (
                             <div onClick={handleRemoveFromAlbum} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold text-red-600">Remove from album</div>
                           )}
                           {isUserPin && (
                             <button 
                               onClick={handleDelete}
                               disabled={isDeleting}
                               className="w-full text-left px-4 py-2 hover:bg-red-50 cursor-pointer text-sm font-semibold text-red-600 flex items-center gap-2"
                             >
                               <Trash2 size={16} />
                               Delete Pin
                             </button>
                           )}
                        </div>
                    )}

                    <button 
                        onClick={handleCopyLink}
                        className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                        title="Copy Link"
                    >
                        <Share size={20} />
                    </button>
                    <a 
                    href={photo.urls.full} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                    title="Download Image"
                    >
                        <Download size={20} />
                    </a>
                </div>
                <button 
                    onClick={handleSave}
                    className={clsx(
                    "px-6 py-3 font-bold rounded-full transition-colors",
                    saved 
                        ? "bg-black text-white hover:bg-gray-800" 
                        : "bg-[#E60023] text-white hover:bg-[#ad081b]"
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
                        ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                        : "bg-white border-gray-200 text-gray-800 hover:bg-yellow-50 hover:border-yellow-300"
                    )}
                    disabled={loadingReactions}
                  >
                    <ThumbsUp
                      size={16}
                      className={clsx(
                        reactions.isLiked ? "text-yellow-600 fill-yellow-400" : "text-gray-700"
                      )}
                    />
                    <span className="text-sm font-semibold">{reactions.likes}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction('loves')}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
                      reactions.isLoved
                        ? "bg-red-100 border-red-400 text-red-800"
                        : "bg-white border-gray-200 text-gray-800 hover:bg-red-50 hover:border-red-300"
                    )}
                    disabled={loadingReactions}
                  >
                    <Heart
                      size={16}
                      className={clsx(
                        reactions.isLoved ? "text-red-600 fill-red-400" : "text-gray-700"
                      )}
                    />
                    <span className="text-sm font-semibold">{reactions.loves}</span>
                  </button>

                  {loadingReactions && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Updating...
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-4">{photo.alt_description || 'Untitled Pin'}</h1>
                
                <p className="text-gray-700 mb-6 text-sm">
                    {photo.alt_description}
                </p>

                <div className="flex items-center gap-3 mb-8">
                    <img 
                    src={photo.user.profile_image.medium} 
                    alt={photo.user.name} 
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    />
                    <div>
                    <p className="font-semibold text-sm hover:underline cursor-pointer">{photo.user.name}</p>
                    <p className="text-xs text-gray-500">@{photo.user.username}</p>
                    </div>
                    <button className="ml-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full font-semibold text-sm transition-colors">
                    Follow
                    </button>
                </div>

                <div className="mb-8">
                    <a 
                      href={photo.urls.raw} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-semibold underline hover:no-underline"
                    >
                      View Original Image Source
                    </a>
                    <div className="text-xs text-gray-500 mt-2 font-mono">
                      ID: {photo.id}
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="font-semibold text-lg mb-4">{comments.length} Comments</h3>
                    <div className="flex gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0">
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
                            className="w-full bg-gray-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>
                    </div>
                    {/* Comments List */}
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 group">
                            <img src={comment.userImage} alt={comment.userName} className="w-8 h-8 rounded-full bg-gray-100" />
                            <div className="flex-1">
                                <p className="text-sm"><span className="font-semibold">{comment.userName}</span> {comment.text}</p>
                                <div className="flex gap-2 text-xs text-gray-500 mt-1 items-center">
                                    <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                                    <span className="cursor-pointer hover:underline">Reply</span>
                                    <Heart size={12} className="cursor-pointer hover:fill-red-500 hover:text-red-500 transition-colors" />
                                    {comment.userId === user?.id && (
                                      <button 
                                        onClick={() => deleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ml-auto"
                                        title="Delete comment"
                                      >
                                        <Trash2 size={12} />
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
        <div className="w-full max-w-[1440px] px-4 py-8">
          <h2 className="text-center text-xl font-semibold mb-6 text-black">More like this</h2>
          {relatedStatus === 'pending' ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : relatedPhotos.length === 0 ? (
            <p className="text-center text-gray-400">No related images found.</p>
          ) : (
            <>
              <MasonryGrid photos={relatedPhotos} onPinClick={handleRelatedClick} />
              <div ref={relatedObserverRef} className="h-10 w-full" />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsAlbumModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add to album</h3>
              <button
                onClick={() => setShowCreateAlbum((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center"
                title="Create new album"
                type="button"
              >
                +
              </button>
            </div>

            {showCreateAlbum && (
              <div className="px-5 py-4 border-b bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Album name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="New album name"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateAlbum}
                    disabled={isCreatingAlbum}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                    type="button"
                  >
                    {isCreatingAlbum ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto px-2 py-2">
              {albums.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                  No albums yet. Create one to get started.
                </div>
              ) : (
                albums.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-800 truncate">{album.name}</span>
                    <button
                      onClick={() => handleAddToAlbum(album.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center"
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
