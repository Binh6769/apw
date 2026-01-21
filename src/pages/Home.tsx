import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPhotos } from '../api/unsplash'; 
import { MasonryGrid } from '../components/MasonryGrid';
import { Header } from '../components/Header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = searchParams.get('q') || '';
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState('anime');
  const [showTopicBar, setShowTopicBar] = useState(false);

  const DEFAULT_TOPIC = 'anime';
  const TOPIC_OPTIONS = [
    { id: 'anime', label: 'Anime' },
    { id: 'shonen', label: 'Shonen' },
    { id: 'romance', label: 'Romance' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'slice of life', label: 'Slice of Life' },
    { id: 'mecha', label: 'Mecha' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
  ];

  const preferredTopic = (user?.user_metadata?.preferredTopic as string | undefined) || DEFAULT_TOPIC;
  const isNewUser = Boolean(user?.user_metadata?.isNewUser);
  const effectiveQuery = query || selectedTopic || DEFAULT_TOPIC;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['photos', effectiveQuery],
    queryFn: ({ pageParam = 1 }) => fetchPhotos(pageParam, effectiveQuery),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Reset scroll when query changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  useEffect(() => {
    if (query) {
      setSelectedTopic(query);
      return;
    }
    setSelectedTopic(preferredTopic);
  }, [query, preferredTopic]);

  useEffect(() => {
    setShowTopicBar(isNewUser);
  }, [isNewUser]);

  const photos = useMemo(() => {
    const allPhotos = data?.pages.flatMap((page) => page) || [];
    const uniqueIds = new Set();
    return allPhotos.filter(photo => {
      const isDuplicate = uniqueIds.has(photo.id);
      uniqueIds.add(photo.id);
      return !isDuplicate;
    });
  }, [data]);

  // Intersection Observer for Infinite Scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "500px", 
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [handleObserver]);

  const handlePinClick = (photo: any) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  };

  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopic(topicId);
    if (topicId && topicId !== query) {
      navigate(`/?q=${encodeURIComponent(topicId)}`, { replace: true });
    }
    if (user && isNewUser) {
      try {
        await supabase.auth.updateUser({
          data: {
            preferredTopic: topicId,
            isNewUser: false,
          },
        });
      } catch (error) {
        console.error('Failed to update preferred topic', error);
      } finally {
        setShowTopicBar(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <Header />
      
      <div className="container mx-auto">
        {showTopicBar && (
          <div className="px-4 pt-6 pb-2">
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Welcome</p>
                  <h2 className="text-xl font-semibold text-gray-900">Choose an anime topic to personalize your feed</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_OPTIONS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        selectedTopic === topic.id
                          ? 'bg-black text-white'
                          : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
                      }`}
                      type="button"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {query && (
           <div className="px-4 py-4 text-center">
              <h2 className="text-xl font-semibold">Results for "{query}"</h2>
           </div>
        )}

        {status === 'pending' ? (
           <div className="flex justify-center items-center h-[50vh]">
             <Loader2 className="animate-spin text-gray-500" size={32} />
           </div>
        ) : status === 'error' ? (
           <div className="text-center py-10 text-red-500">
             Error loading content. API might be rate limited.
             <button onClick={() => refetch()} className="ml-2 underline">Retry</button>
           </div>
        ) : photos.length === 0 ? (
           <div className="text-center py-20 text-gray-500">
             {query ? 'No results found. Try a different keyword.' : 'No suggested content available at the moment.'}
           </div>
        ) : (
           <>
             <MasonryGrid 
               photos={photos} 
               onPinClick={handlePinClick} 
             />
             {/* Sentry div for IntersectionObserver */}
             <div ref={observerTarget} className="h-10 w-full" />
           </>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-500" size={24} />
          </div>
        )}
        
        {!hasNextPage && photos.length > 0 && (
          <div className="text-center py-8 text-gray-400">
            You've reached the end!
          </div>
        )}
      </div>
    </div>
  );
}
