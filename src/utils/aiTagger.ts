// Simulate AI-based categorization logic

const ANIME_TAGS = [
  'Romance', 
  'Fantasy', 
  'Action', 
  'Sci-Fi', 
  'Slice of Life', 
  'Cyberpunk', 
  'Mecha', 
  'Waifu', 
  'Shonen', 
  'Shojo', 
  'Isekai',
  'Dark Fantasy',
  'Comedy',
  'Drama'
];

/**
 * Mocks an AI process that analyzes image content and metadata
 * to automatically discover relevant tags.
 */
export const generateTagsForImage = async (imageUrl: string, title?: string, description?: string): Promise<string[]> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const textContext = `${title || ''} ${description || ''}`.toLowerCase();
  const assigned = new Set<string>();
  
  // Keyword matching
  ANIME_TAGS.forEach(tag => {
    if (textContext.includes(tag.toLowerCase())) {
       assigned.add(tag);
    }
  });

  // Hashing algorithm to consistently apply 2 random tags for 'AI discovery' effect
  const hash = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  assigned.add(ANIME_TAGS[hash % ANIME_TAGS.length]);
  assigned.add(ANIME_TAGS[(hash * 7) % ANIME_TAGS.length]);

  return Array.from(assigned).slice(0, 4); // return max 4 tags
};
