/**
 * Image Metadata and Labeling System
 * Provides types and utilities for managing image data across the application
 */

export interface ImageLabel {
  id: string;
  name: string;
  category: ImageCategory;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ImageCategory = 
  | 'avatar' 
  | 'pin' 
  | 'profile-photo' 
  | 'user-upload' 
  | 'external-api' 
  | 'placeholder' 
  | 'system';

export interface ImageMetadata {
  id: string;
  url: string;
  label: ImageLabel;
  source: ImageSource;
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  format?: 'jpg' | 'png' | 'gif' | 'webp' | 'svg';
  color?: string; // Dominant color (hex)
  alt?: string;
  uploadedAt?: string;
  userId?: string; // Owner if applicable
  pinId?: string; // Associated pin if applicable
  externalId?: string; // External API ID
}

export type ImageSource = 
  | 'dicebear' 
  | 'unsplash' 
  | 'jikan' 
  | 'waifu-im' 
  | 'supabase-storage' 
  | 'user-upload' 
  | 'gravatar' 
  | 'ui-avatars'
  | 'mock-data';

export interface ImageArchiveEntry {
  id: string;
  metadata: ImageMetadata;
  archived: boolean;
  archivedAt?: string;
  notes?: string;
}

/**
 * Standard Image Catalog for different use cases
 */
export const IMAGE_LABELS_CATALOG = {
  // Avatar Images
  avatar: {
    user_avatar_small: {
      name: 'User Avatar (Small)',
      tags: ['avatar', 'user', 'small', '6x6'],
      description: 'Small user avatar displayed in header and navigation',
    },
    user_avatar_medium: {
      name: 'User Avatar (Medium)',
      tags: ['avatar', 'user', 'medium', '10x10'],
      description: 'Medium user avatar for menus and dropdowns',
    },
    user_avatar_large: {
      name: 'User Avatar (Large)',
      tags: ['avatar', 'user', 'large', '32x32'],
      description: 'Large user avatar for profile pages',
    },
    generated_avatar: {
      name: 'Generated Avatar (DiceBear)',
      tags: ['avatar', 'generated', 'dicebear'],
      description: 'Auto-generated avatar from DiceBear API',
    },
    uploaded_avatar: {
      name: 'Uploaded Avatar',
      tags: ['avatar', 'user-upload', 'custom'],
      description: 'Custom user-uploaded avatar image',
    },
  },

  // Pin Images
  pin: {
    pin_grid_small: {
      name: 'Pin Image (Grid)',
      tags: ['pin', 'grid', 'masonry', 'small'],
      description: 'Pin image displayed in grid/masonry layout',
    },
    pin_detail_large: {
      name: 'Pin Image (Detail)',
      tags: ['pin', 'detail', 'large', 'full-size'],
      description: 'Full-size pin image displayed in detail view',
    },
    pin_placeholder: {
      name: 'Pin Placeholder',
      tags: ['pin', 'placeholder', 'color'],
      description: 'Dominant color placeholder while pin image loads',
    },
  },

  // Creator Images
  creator: {
    creator_avatar_small: {
      name: 'Creator Avatar (Small)',
      tags: ['creator', 'author', 'small'],
      description: 'Small avatar of pin creator in pin detail',
    },
    creator_avatar_medium: {
      name: 'Creator Avatar (Medium)',
      tags: ['creator', 'author', 'medium'],
      description: 'Medium avatar of pin creator in profile',
    },
  },

  // External API Images
  external_api: {
    unsplash_image: {
      name: 'Unsplash Image',
      tags: ['unsplash', 'external-api', 'photo'],
      description: 'High-quality image from Unsplash API',
    },
    anime_image_jikan: {
      name: 'Anime Image (Jikan)',
      tags: ['jikan', 'anime', 'external-api'],
      description: 'Anime artwork from Jikan API',
    },
    waifu_image: {
      name: 'Waifu Image',
      tags: ['waifu-im', 'anime', 'external-api'],
      description: 'Waifu artwork from Waifu.im API',
    },
  },

  // System Images
  system: {
    fallback_image: {
      name: 'Fallback Image',
      tags: ['system', 'fallback', 'error'],
      description: 'Fallback image when loading fails',
    },
    logo_image: {
      name: 'Logo/Branding',
      tags: ['system', 'logo', 'branding'],
      description: 'Application logo or branding image',
    },
    icon_image: {
      name: 'Icon Image',
      tags: ['system', 'icon'],
      description: 'UI icon or symbol image',
    },
  },
} as const;

/**
 * Image Source Configuration
 * Specifies where images come from and how to handle them
 */
export const IMAGE_SOURCES_CONFIG = {
  dicebear: {
    name: 'DiceBear Avatars',
    type: 'external-api',
    category: 'avatar',
    urlPattern: 'https://api.dicebear.com/7.x/{style}/svg?seed={seed}',
    requires_auth: false,
    cacheable: true,
    styles: ['avataaars', 'pixel-art', 'adventurer', 'big-ears', 'croodles', 'initials'],
  },
  unsplash: {
    name: 'Unsplash',
    type: 'external-api',
    category: 'pin',
    urlPattern: 'https://api.unsplash.com/...',
    requires_auth: true,
    cacheable: true,
    maxResults: 50,
  },
  jikan: {
    name: 'Jikan (Anime API)',
    type: 'external-api',
    category: 'pin',
    urlPattern: 'https://api.jikan.moe/v4/...',
    requires_auth: false,
    cacheable: true,
  },
  'waifu-im': {
    name: 'Waifu.im',
    type: 'external-api',
    category: 'pin',
    urlPattern: 'https://api.waifu.im/...',
    requires_auth: false,
    cacheable: true,
  },
  'supabase-storage': {
    name: 'Supabase Storage',
    type: 'cloud-storage',
    category: 'user-upload',
    buckets: ['pin-images', 'avatars', 'profile-photos'],
    requires_auth: true,
    cacheable: true,
  },
  'gravatar': {
    name: 'Gravatar',
    type: 'external-api',
    category: 'avatar',
    urlPattern: 'https://gravatar.com/avatar/{hash}',
    requires_auth: false,
    cacheable: true,
  },
  'ui-avatars': {
    name: 'UI Avatars',
    type: 'external-api',
    category: 'avatar',
    urlPattern: 'https://ui-avatars.com/api/...',
    requires_auth: false,
    cacheable: true,
  },
} as const;
