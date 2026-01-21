import type { Photo } from '../types';

// Helper to generate a consistent color from a string
const getColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 80%)`;
};

// Categories to simulate varied content
const CATEGORIES = [
  'Anime', 'Cyberpunk', 'Landscape', 'Architecture', 'Cats', 
  'Food', 'Fashion', 'Art', 'Travel', 'Cars'
];

// Diverse descriptions for variety
const DESCRIPTIONS = [
  'Beautiful scene',
  'Amazing discovery',
  'Stunning view',
  'Creative composition',
  'Artistic masterpiece',
  'Nature at its finest',
  'Urban exploration',
  'Hidden gem',
  'Moment captured',
  'Visual delight',
  'Minimalist aesthetic',
  'Bold statement',
  'Peaceful moment',
  'Action packed',
  'Serene landscape',
  'Vibrant colors',
  'Dramatic lighting',
  'Timeless classic',
  'Modern twist',
  'Classic elegance',
  'Raw beauty',
  'Refined taste',
  'Unexpected angle',
  'Symmetrical harmony',
  'Chaotic beauty'
];

// Helper to generate deterministic pseudo-random numbers
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const generateMockPhotos = (count: number = 50, startId: number = 0): Photo[] => {
  return Array.from({ length: count }).map((_, i) => {
    const seed = startId + i;
    const catIndex = Math.floor(seededRandom(seed * 1.1) * CATEGORIES.length);
    const category = CATEGORIES[catIndex];
    
    // Varying aspect ratios (approx 2:3, 3:4, 1:1, etc.)
    // Width fixed at 600 for high quality reference
    const width = 600;
    // Random height between 400 and 1000
    const height = 400 + Math.floor(seededRandom(seed * 2.2) * 600);
    
    // Image source: Picsum Photos with seed for consistency
    const imgSeed = seed + 500;
    const imageUrl = `https://picsum.photos/seed/${imgSeed}/${width}/${height}`;

    // Generate diverse descriptions: some with descriptions, some with null
    let alt_description: string | null = null;
    const descRandom = seededRandom(seed * 3.3);
    
    if (descRandom < 0.7) {
      // 70% have descriptions
      const descIndex = Math.floor(descRandom / 0.7 * DESCRIPTIONS.length);
      const description = DESCRIPTIONS[descIndex % DESCRIPTIONS.length];
      alt_description = `${description} - ${category}`;
    }
    // else: 30% have no description (null)

    return {
      id: `mock-generated-${seed}`,
      width,
      height,
      color: getColor(category + seed),
      alt_description,
      urls: {
        raw: imageUrl,
        full: imageUrl,
        regular: imageUrl,
        small: `https://picsum.photos/seed/${imgSeed}/400/${Math.floor(height * 0.66)}`,
        thumb: `https://picsum.photos/seed/${imgSeed}/200/${Math.floor(height * 0.33)}`,
      },
      user: {
        name: `${category} Lover`,
        username: `${category.toLowerCase()}_fan_${Math.floor(seededRandom(seed) * 100)}`,
        profile_image: {
          small: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
          medium: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
          large: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
        }
      },
      description: alt_description || undefined
    };
  });
};

// Pre-generate a base set
export const INITIAL_MOCK_PHOTOS = generateMockPhotos(30);
