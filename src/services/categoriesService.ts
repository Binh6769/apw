import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export const fetchAllCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const createCategory = async (name: string): Promise<Category | null> => {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

export const updateCategory = async (id: string, name: string): Promise<Category | null> => {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

export const getPinCategories = async (pinId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('pin_categories')
      .select('categories(*)')
      .eq('pin_id', pinId);

    if (error) throw error;
    return (data || []).map((item: any) => item.categories).filter(Boolean);
  } catch (error) {
    console.error('Error getting pin categories:', error);
    return [];
  }
};

export const getCategoriesForPins = async (pinIds: string[]): Promise<Map<string, Category[]>> => {
  if (pinIds.length === 0) return new Map();

  try {
    const { data, error } = await supabase
      .from('pin_categories')
      .select('pin_id, categories(*)')
      .in('pin_id', pinIds);

    if (error) throw error;

    const map = new Map<string, Category[]>();
    for (const item of data || []) {
      const existing = map.get(item.pin_id) || [];
      if (item.categories) {
        existing.push(item.categories as unknown as Category);
      }
      map.set(item.pin_id, existing);
    }
    return map;
  } catch (error) {
    console.error('Error getting categories for pins:', error);
    return new Map();
  }
};

export const ensureCategoriesExist = async (names: string[]): Promise<string[]> => {
  const ids: string[] = [];
  for (const name of names) {
    if (!name.trim()) continue;
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) {
      ids.push(existing.id);
    } else {
      const created = await createCategory(name.trim());
      if (created) ids.push(created.id);
    }
  }
  return ids;
};

export const setPinCategories = async (pinId: string, categoryIds: string[]): Promise<boolean> => {
  try {
    const { error: deleteError } = await supabase
      .from('pin_categories')
      .delete()
      .eq('pin_id', pinId);

    if (deleteError) throw deleteError;

    if (categoryIds.length === 0) return true;

    const inserts = categoryIds.map(categoryId => ({
      pin_id: pinId,
      category_id: categoryId,
    }));

    const { error: insertError } = await supabase
      .from('pin_categories')
      .insert(inserts);

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('Error setting pin categories:', error);
    return false;
  }
};
