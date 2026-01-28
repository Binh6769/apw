import axios from 'axios';
import type { Photo } from '../types';
import { generateMockPhotos } from '../data/mockData';
import { fetchPinById, fetchPinsFromSupabase } from '../services/pinsService';

// Interfaces
interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    }
  };
  studios?: { name: string }[];
}

interface WaifuImage {
  image_id: number;
  width: number;
  height: number;
  url: string;
  dominant_color: string;
  tags?: { name: string }[];
}

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  avg_color: string | null;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

interface PixabayPhoto {
  id: number;
  pageURL: string;
  largeImageURL: string;
  webformatURL: string;
  previewURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
  userImageURL: string;
  tags: string;
}

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';

// Helper: Generate consistent pastel color from string
const getColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 80%)`;
};

const TOPIC_TAGS: Record<string, string[]> = {
  anime: ['waifu', 'smile', 'wink'],
  shonen: ['waifu', 'happy', 'dance'],
  romance: ['waifu', 'blush', 'smile'],
  fantasy: ['waifu', 'smile', 'wink'],
  'slice of life': ['waifu', 'happy', 'smile'],
  mecha: ['waifu', 'wink', 'smug'],
  cyberpunk: ['waifu', 'smug', 'wink'],
};

const getWaifuTags = (query: string) => {
  const normalized = query.trim().toLowerCase();
  const tags = TOPIC_TAGS[normalized] || ['waifu'];
  return tags.filter(Boolean);
};

const isLikelyImageId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
  /^(mal|art|top|unsplash|pexels|pixabay|mock|pin|local)-/i.test(value);

// MOCK DATA for Fallback - Initial set
const getFallbackPhotos = (page: number, query: string = ''): Photo[] => {
  const startId = page * 20;
  const photos = generateMockPhotos(20, startId);
  if (query) {
     // Simple client-side filtering simulation
     return photos.filter(p => 
        p.alt_description?.toLowerCase().includes(query.toLowerCase()) || 
        p.user.name.toLowerCase().includes(query.toLowerCase())
     );
  }
  return photos;
};

// Mode 1: Search Anime via Jikan API (MyAnimeList)
const searchAnime = async (query: string, page: number): Promise<Photo[]> => {
  try {
    // Artificial delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));

    const response = await axios.get(`https://api.jikan.moe/v4/anime`, {
      params: {
        q: query,
        page: page,
        limit: 20, 
        sfw: true,
      }
    });

    const data = response.data.data;
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: JikanAnime) => ({
      id: `mal-${item.mal_id}`,
      width: 225, 
      height: 318, 
      color: getColorFromString(item.title), 
      alt_description: item.title,
      urls: {
        raw: item.images.jpg.large_image_url,
        full: item.images.jpg.large_image_url,
        regular: item.images.jpg.image_url,
        small: item.images.jpg.small_image_url,
        thumb: item.images.jpg.small_image_url,
      },
      user: {
        name: item.studios?.[0]?.name || 'Unknown Studio',
        username: 'myanimelist',
        profile_image: {
          small: 'https://cdn.myanimelist.net/images/favicon.ico',
          medium: 'https://cdn.myanimelist.net/images/favicon.ico',
          large: 'https://cdn.myanimelist.net/images/favicon.ico',
        }
      }
    }));
  } catch (error) {
    console.warn("Jikan Search API Error (using mock):", error);
    // Return mock data filtered by query
    return getFallbackPhotos(page, query);
  }
};

// Mode 2: Suggested Anime (Top Popular) via Jikan API
const fetchSuggestedAnime = async (page: number): Promise<Photo[]> => {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/top/anime`, {
      params: {
        page: page,
        limit: 10,
        filter: 'bypopularity'
      }
    });

    const data = response.data.data;
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: JikanAnime) => ({
      id: `top-${item.mal_id}`,
      width: 225, 
      height: 318,
      color: getColorFromString(item.title),
      alt_description: item.title,
      urls: {
        raw: item.images.jpg.large_image_url,
        full: item.images.jpg.large_image_url,
        regular: item.images.jpg.image_url,
        small: item.images.jpg.small_image_url,
        thumb: item.images.jpg.small_image_url,
      },
      user: {
        name: item.studios?.[0]?.name || 'Top Anime',
        username: 'myanimelist',
        profile_image: {
          small: 'https://cdn.myanimelist.net/images/favicon.ico',
          medium: 'https://cdn.myanimelist.net/images/favicon.ico',
          large: 'https://cdn.myanimelist.net/images/favicon.ico',
        }
      }
    }));
  } catch (error) {
    console.warn("Jikan Top API Error:", error);
    return [];
  }
};

// Mode 3: Fanart & Art via Waifu.im
const fetchWaifuArt = async (tags: string[] = ['waifu']): Promise<Photo[]> => {
  try {
    const response = await axios.get('https://api.waifu.im/search', {
      params: {
        many: true,
        is_nsfw: false,
        included_tags: tags, // Expanded tags for anime themes
        height: '>=500', 
        limit: 20,
      }
    });

    if (!response.data.images) return [];

    return response.data.images.map((img: WaifuImage) => ({
      id: `art-${img.image_id}`,
      width: img.width || 200,
      height: img.height || 300,
      color: img.dominant_color || getColorFromString(img.image_id.toString()),
      alt_description: img.tags ? img.tags.map((t: { name: string }) => t.name).join(', ') : 'Anime Art',
      urls: {
        raw: img.url,
        full: img.url,
        regular: img.url,
        small: img.url,
        thumb: img.url,
      },
      user: {
        name: 'Waifu.im Artist',
        username: 'waifu_im',
        profile_image: {
          small: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
          medium: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
          large: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
        }
      }
    }));
  } catch (error) {
    console.warn("Waifu.im failed", error);
    return [];
  }
};

// Mode 4: Unsplash
const fetchUnsplashPhotos = async (page: number, query: string): Promise<Photo[]> => {
  if (!UNSPLASH_ACCESS_KEY) return [];
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        page,
        per_page: 20,
        orientation: 'portrait',
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const results = response.data?.results as UnsplashPhoto[] | undefined;
    if (!results || !Array.isArray(results)) return [];

    return results.map((item) => ({
      id: `unsplash-${item.id}`,
      width: item.width,
      height: item.height,
      color: item.color || getColorFromString(item.id),
      alt_description: item.alt_description,
      urls: item.urls,
      user: {
        name: item.user.name,
        username: item.user.username,
        profile_image: item.user.profile_image,
      },
    }));
  } catch (error) {
    console.warn('Unsplash API Error:', error);
    return [];
  }
};

// Mode 5: Pexels
const fetchPexelsPhotos = async (page: number, query: string): Promise<Photo[]> => {
  if (!PEXELS_API_KEY) return [];
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query,
        page,
        per_page: 20,
        orientation: 'portrait',
      },
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    const results = response.data?.photos as PexelsPhoto[] | undefined;
    if (!results || !Array.isArray(results)) return [];

    return results.map((item) => ({
      id: `pexels-${item.id}`,
      width: item.width,
      height: item.height,
      color: item.avg_color || getColorFromString(item.id.toString()),
      alt_description: item.url,
      urls: {
        raw: item.src.original,
        full: item.src.large,
        regular: item.src.medium,
        small: item.src.small,
        thumb: item.src.tiny,
      },
      user: {
        name: item.photographer,
        username: item.photographer_url,
        profile_image: {
          small: item.src.tiny,
          medium: item.src.small,
          large: item.src.medium,
        },
      },
    }));
  } catch (error) {
    console.warn('Pexels API Error:', error);
    return [];
  }
};

// Mode 6: Pixabay
const fetchPixabayPhotos = async (page: number, query: string): Promise<Photo[]> => {
  if (!PIXABAY_API_KEY) return [];
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        page,
        per_page: 20,
        image_type: 'photo',
        orientation: 'vertical',
        safesearch: true,
      },
    });

    const results = response.data?.hits as PixabayPhoto[] | undefined;
    if (!results || !Array.isArray(results)) return [];

    return results.map((item) => ({
      id: `pixabay-${item.id}`,
      width: item.imageWidth,
      height: item.imageHeight,
      color: getColorFromString(item.id.toString()),
      alt_description: item.tags || null,
      urls: {
        raw: item.largeImageURL,
        full: item.largeImageURL,
        regular: item.webformatURL,
        small: item.previewURL,
        thumb: item.previewURL,
      },
      user: {
        name: item.user,
        username: item.pageURL,
        profile_image: {
          small: item.userImageURL || item.previewURL,
          medium: item.userImageURL || item.webformatURL,
          large: item.userImageURL || item.largeImageURL,
        },
      },
    }));
  } catch (error) {
    console.warn('Pixabay API Error:', error);
    return [];
  }
};

const mergeUnique = (...lists: Photo[][]) => {
  const seen = new Set<string>();
  const result: Photo[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
  }
  return result;
};

// Helper to shuffle/interleave arrays with bias
const interleaveWeighted = (animeList: Photo[], artList: Photo[]) => {
  const result: Photo[] = [];
  let animeIdx = 0;
  let artIdx = 0;

  while (artIdx < artList.length || animeIdx < animeList.length) {
    if (artIdx < artList.length) result.push(artList[artIdx++]);
    if (artIdx < artList.length) result.push(artList[artIdx++]);
    if (animeIdx < animeList.length) result.push(animeList[animeIdx++]);
  }
  return result;
};

// Fetch single photo by ID
export const fetchPhotoById = async (id: string): Promise<Photo | null> => {
  try {
    if (id.startsWith('mock-')) {
       // Extract seed if possible
       const parts = id.split('-');
       const seed = parts.length > 2 ? parseInt(parts[2]) : 0;
       // We can regenerate the specific mock item deterministically
       const mocks = generateMockPhotos(1, seed);
       return mocks[0] || null;
    }

    if (id.startsWith('mal-') || id.startsWith('top-')) {
      const malId = id.split('-')[1];
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${malId}`);
      const item = response.data.data;
      return {
        id: id,
        width: 225, 
        height: 318,
        color: getColorFromString(item.title),
        alt_description: item.title,
        urls: {
          raw: item.images.jpg.large_image_url,
          full: item.images.jpg.large_image_url,
          regular: item.images.jpg.image_url,
          small: item.images.jpg.small_image_url,
          thumb: item.images.jpg.small_image_url,
        },
        user: {
          name: item.studios?.[0]?.name || 'Anime Studio',
          username: 'myanimelist',
          profile_image: {
            small: 'https://cdn.myanimelist.net/images/favicon.ico',
            medium: 'https://cdn.myanimelist.net/images/favicon.ico',
            large: 'https://cdn.myanimelist.net/images/favicon.ico',
          }
        }
      };
    } else if (id.startsWith('art-')) {
      const artId = id.split('-')[1];
      const response = await axios.get('https://api.waifu.im/search', {
        params: {
            included_files: [artId]
        }
      });
      
      if (response.data.images && response.data.images.length > 0) {
          const img = response.data.images[0];
          return {
              id: `art-${img.image_id}`,
              width: img.width || 200,
              height: img.height || 300,
              color: img.dominant_color || getColorFromString(img.image_id.toString()),
              alt_description: img.tags ? img.tags.map((t: { name: string }) => t.name).join(', ') : 'Anime Art',
              urls: {
                raw: img.url,
                full: img.url,
                regular: img.url,
                small: img.url,
                thumb: img.url,
              },
              user: {
                name: 'Waifu.im Artist',
                username: 'waifu_im',
                profile_image: {
                  small: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
                  medium: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
                  large: `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.image_id}`,
                }
              }
          };
      }
    }
    return null;
  } catch (error) {
    console.error("Fetch Photo By ID Error:", error);
    return generateMockPhotos(1)[0];
  }
};

export const fetchRelatedPhotos = async (
  _id: string,
  photo?: Photo,
  page: number = 1,
  pageSize: number = 30,
  seenIds: Set<string> = new Set()
): Promise<{ items: Photo[]; hasMore: boolean }> => {
  try {
    let searchQuery = '';
    
    if (photo?.alt_description) {
      const words = photo.alt_description.split(' ').slice(0, 3).join(' ');
      searchQuery = words || 'photography';
    }
    
    if (!searchQuery) {
      searchQuery = 'photography';
    }
    
    const [page1, page2, page3] = await Promise.all([
      fetchPhotos(page, searchQuery),
      fetchPhotos(page + 1, searchQuery),
      fetchPhotos(page + 2, searchQuery),
    ]);

    const combinedPool = mergeUnique(page1, page2, page3);
    const withoutCurrent = combinedPool.filter(p => p.id !== _id && !seenIds.has(p.id));

    const targetRatio = photo?.width ? (photo.height || photo.width) / photo.width : 1;
    const scorePhoto = (p: Photo) => {
      const ratio = p.width ? (p.height || p.width) / p.width : targetRatio;
      const ratioPenalty = Math.abs(ratio - targetRatio);
      const area = (p.width || 1) * (p.height || 1);
      return ratioPenalty * 1000 + area / 1_000_000;
    };

    const prioritized = [...withoutCurrent].sort((a, b) => scorePhoto(a) - scorePhoto(b));

    const start = (page - 1) * pageSize;
    const items = prioritized.slice(start, start + pageSize);
    const hasMore = prioritized.length > start + pageSize;

    return { items, hasMore };
  } catch (error) {
    console.error("Fetch Related Photos Error:", error);
    return { items: [], hasMore: false };
  }
};

// Main Export - Now checks Supabase first, then falls back to external APIs
export const fetchPhotos = async (page: number = 1, query: string = ''): Promise<Photo[]> => {
  try {
    if (query && isLikelyImageId(query) && page === 1) {
      const [pinMatch, externalMatch] = await Promise.all([
        fetchPinById(query).catch(() => null),
        fetchPhotoById(query).catch(() => null),
      ]);
      const resolved = pinMatch || externalMatch;
      if (resolved) {
        return [resolved];
      }
    }

    // First, try to get data from Supabase
    const supabasePins = await fetchPinsFromSupabase(page, 20, query);
    
    // If we have pins from Supabase, return them
    if (supabasePins.length >= 20) {
      return supabasePins;
    }

    // Artificial delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));

    if (query && query.trim().length > 0) {
      const waifuTags = getWaifuTags(query);
      const [animeResults, waifuResults, unsplashResults, pexelsResults, pixabayResults] = await Promise.all([
        searchAnime(query, page),
        fetchWaifuArt(waifuTags),
        fetchUnsplashPhotos(page, query),
        fetchPexelsPhotos(page, query),
        fetchPixabayPhotos(page, query),
      ]);
      const combined = mergeUnique(supabasePins, animeResults, waifuResults, unsplashResults, pexelsResults, pixabayResults);
      if (combined.length === 0 && page === 1) return getFallbackPhotos(page, query); 
      return combined;
    } else {
      const defaultQuery = 'anime';
      const [anime, art, unsplashResults, pexelsResults, pixabayResults] = await Promise.all([
        fetchSuggestedAnime(page).catch(e => { console.error('Anime fetch failed', e); return []; }),
        fetchWaifuArt(getWaifuTags(defaultQuery)).catch(e => { console.error('Waifu fetch failed', e); return []; }),
        fetchUnsplashPhotos(page, defaultQuery),
        fetchPexelsPhotos(page, defaultQuery),
        fetchPixabayPhotos(page, defaultQuery),
      ]);
      const combined = mergeUnique(supabasePins, interleaveWeighted(anime, art), unsplashResults, pexelsResults, pixabayResults);
      
      if (combined.length === 0) {
         console.warn("Both APIs failed or returned empty. Using Mock Data.");
         return getFallbackPhotos(page);
      }
      
      return combined;
    }
  } catch (e) {
    console.error("Critical Error in fetchPhotos, using fallback:", e);
    return getFallbackPhotos(page);
  }
};
