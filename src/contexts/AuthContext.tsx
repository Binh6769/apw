/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface SavedAccount {
  userId: string;
  email: string | null;
  accessToken: string;
  refreshToken: string;
  userMetadata: SupabaseUser['user_metadata'] | null;
  avatarUrl: string | null;
  displayName: string | null;
  lastUsedAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  loading: boolean;
  savedAccounts: SavedAccount[];
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
  switchAccount: (userId: string) => Promise<{ error: string | null }>;
  updateAccountProfile: (userId: string, avatarUrl: string | null, displayName: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SAVED_ACCOUNTS_KEY = 'saved_accounts_v1';

const readSavedAccounts = (): SavedAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read saved accounts', error);
    return [];
  }
};

const writeSavedAccounts = (accounts: SavedAccount[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to store saved accounts', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    setSavedAccounts(readSavedAccounts());
  }, []);

  useEffect(() => {
    writeSavedAccounts(savedAccounts);
  }, [savedAccounts]);

  const upsertSavedAccount = (session: Session | null) => {
    if (!session?.user || !session.access_token || !session.refresh_token) return;

    setSavedAccounts((prev) => {
      const existing = prev.find((account) => account.userId === session.user.id);
      const nextAccount: SavedAccount = {
        userId: session.user.id,
        email: session.user.email ?? null,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        userMetadata: session.user.user_metadata ?? null,
        avatarUrl: existing?.avatarUrl ?? (session.user.user_metadata?.avatar_url ?? null),
        displayName: existing?.displayName ?? null,
        lastUsedAt: new Date().toISOString(),
      };
      const filtered = prev.filter((account) => account.userId !== nextAccount.userId);
      return [nextAccount, ...filtered];
    });
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          upsertSavedAccount(session);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          upsertSavedAccount(session);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      if (data.session) {
        upsertSavedAccount(data.session);
      }
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      return { error: errorMessage };
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            preferredTopic: 'anime',
            isNewUser: true,
          },
        },
      });

      if (signupError) {
        return { error: signupError.message };
      }

      // After signup, log the user in automatically
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        return { error: loginError.message };
      }
      if (loginData.session) {
        upsertSavedAccount(loginData.session);
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      return { error: errorMessage };
    }
  };

  const switchAccount = async (userId: string) => {
    const target = savedAccounts.find((account) => account.userId === userId);
    if (!target) return { error: 'Account not found' };
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: target.accessToken,
        refresh_token: target.refreshToken,
      });
      if (error) {
        return { error: error.message };
      }
      if (data.session) {
        upsertSavedAccount(data.session);
      }
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch account';
      return { error: errorMessage };
    }
  };

  const updateAccountProfile = useCallback((userId: string, avatarUrl: string | null, displayName: string | null) => {
    setSavedAccounts((prev) =>
      prev.map((account) =>
        account.userId === userId
          ? {
              ...account,
              avatarUrl: avatarUrl ?? account.avatarUrl,
              displayName: displayName ?? account.displayName,
            }
          : account
      )
    );
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, savedAccounts, login, signup, switchAccount, updateAccountProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
