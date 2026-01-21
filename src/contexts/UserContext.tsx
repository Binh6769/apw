/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  website: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  name: 'Felix',
  username: 'felix_personal',
  bio: 'Digital artist & designer. Love anime and minimal aesthetics.',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  website: 'felix.design'
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('user_profile');
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch (error) {
      console.error('Failed to load user profile', error);
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('user_profile', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user profile', error);
    }
  }, [user]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
