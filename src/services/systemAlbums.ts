import { supabase } from './supabase';
import type { PhotoAlbum } from './photoAlbumService';

export type SystemAlbumKey = 'saved' | 'history';

export const SYSTEM_ALBUMS: Record<SystemAlbumKey, { name: string; description: string; hidden: boolean }> = {
  saved: {
    name: 'Saved',
    description: 'System album that mirrors all pins you save.',
    hidden: false,
  },
  history: {
    name: 'History',
    description: 'System album that tracks everything you view.',
    hidden: true,
  },
};

export const isSystemAlbumName = (name: string | null | undefined) =>
  name === SYSTEM_ALBUMS.saved.name || name === SYSTEM_ALBUMS.history.name;

export const isSavedAlbumName = (name: string | null | undefined) => name === SYSTEM_ALBUMS.saved.name;
export const isHistoryAlbumName = (name: string | null | undefined) => name === SYSTEM_ALBUMS.history.name;

export const ensureSystemAlbum = async (
  userId: string,
  key: SystemAlbumKey
): Promise<PhotoAlbum | null> => {
  const target = SYSTEM_ALBUMS[key];

  // Try to find existing system album by name
  const { data: existing } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('user_id', userId)
    .eq('name', target.name)
    .maybeSingle();

  if (existing) return existing as PhotoAlbum;

  // Create if missing
  const { data, error } = await supabase
    .from('photo_albums')
    .insert({
      user_id: userId,
      name: target.name,
      description: target.description,
      is_public: false,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating system album "${target.name}":`, error);
    return null;
  }

  return data as PhotoAlbum;
};

export const ensureSystemAlbums = async (userId: string): Promise<Record<SystemAlbumKey, PhotoAlbum | null>> => {
  const [saved, history] = await Promise.all([
    ensureSystemAlbum(userId, 'saved'),
    ensureSystemAlbum(userId, 'history'),
  ]);

  return { saved, history };
};
