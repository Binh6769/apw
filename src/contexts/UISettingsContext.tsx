import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';

export type ColorMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'classic' | 'sunset' | 'ocean' | 'mint' | 'purple' | 'rose';
export type GridColumns = 'auto' | 2 | 3 | 4 | 5 | 6 | 7;
export type FeedDensity = 'compact' | 'comfortable' | 'spacious';
export type CardRadius = 'crisp' | 'soft' | 'pillowy';
export type ActionVisibility = 'hover' | 'always' | 'hidden';
export type ImageQuality = 'low' | 'medium' | 'high' | 'ultra';
export type BorderStyle = 'solid' | 'outlined' | 'shadowOnly';

export interface UISettings {
  colorMode: ColorMode;
  themeStyle: ThemeStyle;
  gridColumns: GridColumns;
  feedDensity: FeedDensity;
  cardRadius: CardRadius;
  actionVisibility: ActionVisibility;
  imageQuality: ImageQuality;
  borderStyle: BorderStyle;
  showLoadingSkeletons: boolean;
}

interface UISettingsContextValue {
  settings: UISettings;
  resolvedColorMode: 'light' | 'dark';
  updateSettings: (updates: Partial<UISettings>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'ui_settings_v1';
const PREFERENCES_TABLE = 'ui_preferences';

const DEFAULT_SETTINGS: UISettings = {
  colorMode: 'system',
  themeStyle: 'classic',
  gridColumns: 'auto',
  imageQuality: 'high',
  borderStyle: 'outlined',
  showLoadingSkeletons: true,
  feedDensity: 'comfortable',
  cardRadius: 'pillowy',
  actionVisibility: 'hover',
};

export const UISettingsContext = createContext<UISettingsContextValue | undefined>(undefined);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UISettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(stored) as Partial<UISettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error('Failed to load UI settings', error);
      return DEFAULT_SETTINGS;
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemPrefersDark(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const resolvedColorMode = useMemo<'light' | 'dark'>(() => {
    if (settings.colorMode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return settings.colorMode;
  }, [settings.colorMode, systemPrefersDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save UI settings', error);
    }
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorMode = resolvedColorMode;
    root.dataset.uiTheme = settings.themeStyle;
    if (resolvedColorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedColorMode, settings.themeStyle]);

  // Track auth user to sync preferences to Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setRemoteLoaded(false);
    });
    return () => data?.subscription.unsubscribe();
  }, []);

  // Pull remote preferences once per user
  useEffect(() => {
    if (!userId || remoteLoaded) return;
    let cancelled = false;
    const loadRemote = async () => {
      const { data, error } = await supabase
        .from(PREFERENCES_TABLE)
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch remote UI settings', error);
        return;
      }
      if (!cancelled && data?.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      setRemoteLoaded(true);
    };
    loadRemote();
    return () => {
      cancelled = true;
    };
  }, [userId, remoteLoaded]);

  // Push updates to Supabase after remote load to avoid overwriting
  useEffect(() => {
    if (!userId || !remoteLoaded) return;
    const persist = async () => {
      const { error } = await supabase
        .from(PREFERENCES_TABLE)
        .upsert({
          user_id: userId,
          settings,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.error('Failed to persist UI settings to Supabase', error);
      }
    };
    persist();
  }, [settings, userId, remoteLoaded]);

  const updateSettings = (updates: Partial<UISettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <UISettingsContext.Provider
      value={{
        settings,
        resolvedColorMode,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </UISettingsContext.Provider>
  );
}
