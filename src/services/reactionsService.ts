import { supabase } from './supabase';

export interface ReactionSnapshot {
  likes: number;
  loves: number;
  isLiked: boolean;
  isLoved: boolean;
}

type ReactionType = 'likes' | 'loves';

const getTableName = (type: ReactionType) => type;

const getCount = async (table: ReactionType, pinId: string) => {
  const { count, error } = await supabase
    .from(getTableName(table))
    .select('*', { count: 'exact', head: true })
    .eq('pin_id', pinId);

  if (error) {
    console.error(`Failed to count ${table}:`, error);
    return 0;
  }
  return count || 0;
};

const getUserReaction = async (table: ReactionType, pinId: string, userId: string) => {
  const { data, error } = await supabase
    .from(getTableName(table))
    .select('id')
    .eq('pin_id', pinId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error(`Failed checking ${table} for user`, error);
  }
  return Boolean(data?.id);
};

export const fetchReactions = async (pinId: string): Promise<ReactionSnapshot> => {
  const { data: { user } } = await supabase.auth.getUser();
  const [likes, loves, isLiked, isLoved] = await Promise.all([
    getCount('likes', pinId),
    getCount('loves', pinId),
    user ? getUserReaction('likes', pinId, user.id) : false,
    user ? getUserReaction('loves', pinId, user.id) : false,
  ]);

  return { likes, loves, isLiked, isLoved };
};

export const toggleReaction = async (
  pinId: string,
  type: ReactionType,
  shouldAdd: boolean,
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const table = getTableName(type);

  if (shouldAdd) {
    const { error } = await supabase
      .from(table)
      .upsert(
        { pin_id: pinId, user_id: user.id },
        { onConflict: 'user_id,pin_id' }
      );

    if (error) {
      console.error(`Failed to add ${type}:`, error);
      return false;
    }
    return true;
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('pin_id', pinId)
    .eq('user_id', user.id);

  if (error) {
    console.error(`Failed to remove ${type}:`, error);
    return false;
  }
  return true;
};
