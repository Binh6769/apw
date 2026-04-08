import { Home, Plus, User, Bookmark } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, type UserProfile } from '../services/userProfileService';

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile to get real avatar
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-anime-surface-muted border-t border-anime-border flex items-center justify-around px-2 md:hidden z-40 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      <button
        onClick={() => navigate('/')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive('/') ? "text-anime-primary" : "text-gray-400 hover:text-white"
        )}
      >
        <Home size={24} fill={isActive('/') ? "currentColor" : "none"} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>

      <button
        onClick={() => navigate('/create-pin')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive('/create-pin') ? "text-anime-primary" : "text-gray-400 hover:text-white"
        )}
      >
        <Plus size={24} />
        <span className="text-[10px] mt-1 font-medium">Create</span>
      </button>

      <button
        onClick={() => navigate('/saved')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive('/saved') ? "text-anime-primary" : "text-gray-400 hover:text-white"
        )}
      >
        <Bookmark size={24} fill={isActive('/saved') ? "currentColor" : "none"} />
        <span className="text-[10px] mt-1 font-medium">Saved</span>
      </button>

      <button
        onClick={() => navigate('/profile')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive('/profile') ? "text-anime-primary" : "text-gray-400 hover:text-white"
        )}
      >
        {user?.id ? (
          <div className={clsx("w-6 h-6 rounded-full overflow-hidden border-2", isActive('/profile') ? "border-anime-primary" : "border-transparent")}>
            <img
              src={userProfile?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
              alt={user.email}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <User size={24} fill={isActive('/profile') ? "currentColor" : "none"} />
        )}
        <span className="text-[10px] mt-1 font-medium">Profile</span>
      </button>
    </div>
  );
}
