import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPinsFromSupabase } from '../services/pinsService';
import { fetchAllCategories, type Category } from '../services/categoriesService';
import { MasonryGrid } from '../components/MasonryGrid';
import { Header } from '../components/Header';
import { SidebarFilter } from '../components/SidebarFilter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import type { Photo } from '../types';

export function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = searchParams.get('q') || '';
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState('anime');
  const [showTopicBar, setShowTopicBar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const DEFAULT_TOPIC = 'anime';

  const topicOptions = [
    { id: 'all', label: 'All' },
    ...dbCategories.map(c => ({ id: c.name.toLowerCase(), label: c.name })),
  ];

  useEffect(() => {
    fetchAllCategories().then(setDbCategories);
  }, []);

  const preferredTopic = (user?.user_metadata?.preferredTopic as string | undefined) || DEFAULT_TOPIC;
  const isNewUser = Boolean(user?.user_metadata?.isNewUser);
  const effectiveQuery = query || (selectedTopic === 'all' ? '' : selectedTopic) || '';

  // Only fetch user uploads from Supabase - NO external APIs
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['pins', effectiveQuery],
    queryFn: ({ pageParam = 1 }) => fetchPinsFromSupabase(pageParam, 20, effectiveQuery),
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
    if (preferredTopic && preferredTopic !== 'anime') {
      setSelectedTopic(preferredTopic);
    } else {
      setSelectedTopic('all');
    }
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

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    photos.forEach(p => {
      if (p.tags) {
        p.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).slice(0, 30); // limit to 30 dynamic tags
  }, [photos]);

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

  const handlePinClick = (photo: Photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  };

  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopic(topicId);
    if (topicId === 'all' || topicId === '') {
      navigate('/', { replace: true });
    } else if (topicId !== query) {
      navigate(`/?q=${encodeURIComponent(topicId)}`, { replace: true });
    }
    if (user && isNewUser && topicId !== 'all') {
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
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
      <Header />

      {/* Category Filter Tabs */}
      <div className="sticky top-[64px] z-30 bg-anime-bg/95 backdrop-blur-sm border-b border-anime-border">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {topicOptions.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicSelect(topic.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedTopic === topic.id
                  ? 'bg-anime-primary text-white shadow-md'
                  : 'bg-anime-surface border border-anime-border text-anime-muted hover:bg-anime-surface-muted'
              }`}
              type="button"
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        <SidebarFilter 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          availableTags={availableTags}
        />

        <div className="flex-1 min-w-0 md:container md:mx-auto">
        {showTopicBar && (
          <div className="px-4 pt-6 pb-2">
            <div className="bg-anime-surface border border-anime-border rounded-3xl p-4 md:p-6 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-anime-secondary font-semibold">Welcome</p>
                  <h2 className="text-xl font-semibold text-anime-text">Choose an anime topic to personalize your feed</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topicOptions.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedTopic === topic.id
                          ? 'bg-anime-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                          : 'bg-anime-bg border border-anime-border text-anime-muted hover:bg-anime-surface'
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
            <h2 className="text-xl font-semibold text-anime-text">Results for "{query}"</h2>
          </div>
        )}

        {status === 'pending' ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin text-anime-primary" size={32} />
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-10 text-anime-cta">
            Error loading content. API might be rate limited.
            <button onClick={() => refetch()} className="ml-2 underline">Retry</button>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-anime-muted">
            {query ? 'no image available' : 'No images found. Upload your own!'}
            <div className="mt-4 flex justify-center gap-3">
              <button 
                onClick={() => navigate('/create-pin')}
                className="px-6 py-3 bg-anime-primary hover:bg-anime-secondary text-white rounded-full font-semibold transition-colors"
              >
                Upload Image
              </button>
              <button 
                onClick={() => navigate('/saved')}
                className="px-6 py-3 bg-anime-surface border border-anime-border text-anime-text rounded-full font-semibold transition-colors hover:bg-anime-surface-muted"
              >
                View Saved
              </button>
            </div>
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
            <Loader2 className="animate-spin text-anime-primary" size={24} />
          </div>
        )}

        {!hasNextPage && photos.length > 0 && (
          <div className="text-center py-8 text-anime-muted">
            You've reached the end!
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
