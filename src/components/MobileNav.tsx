import { Home, Plus, User, Bookmark } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userProfileService';

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 md:hidden z-40 pb-safe">
      <button 
        onClick={() => navigate('/')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full",
          isActive('/') ? "text-black" : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Home size={24} fill={isActive('/') ? "currentColor" : "none"} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>

      <button 
        onClick={() => navigate('/create-pin')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full",
          isActive('/create-pin') ? "text-black" : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Plus size={24} />
        <span className="text-[10px] mt-1 font-medium">Create</span>
      </button>

      <button 
        onClick={() => navigate('/saved')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full",
          isActive('/saved') ? "text-black" : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Bookmark size={24} fill={isActive('/saved') ? "currentColor" : "none"} />
        <span className="text-[10px] mt-1 font-medium">Saved</span>
      </button>

      <button 
        onClick={() => navigate('/profile')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full",
          isActive('/profile') ? "text-black" : "text-gray-500 hover:text-gray-900"
        )}
      >
        {user?.id ? (
            <div className={clsx("w-6 h-6 rounded-full overflow-hidden border-2", isActive('/profile') ? "border-black" : "border-transparent")}>
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
