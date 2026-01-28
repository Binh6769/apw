import { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, type UserProfile } from '../services/userProfileService';

export function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, savedAccounts, switchAccount, updateAccountProfile } = useAuth();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load user profile from Supabase
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
        if (profile) {
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || 'User';
          updateAccountProfile(user.id, profile.avatar_url ?? null, name);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, [user, updateAccountProfile]);

  const suggestions = [
    'Anime Wallpaper',
    'Modern Architecture',
    'Cyberpunk City',
    'Japanese Food',
    'Minimalist Interior',
    'Street Photography',
    'Digital Art',
  ];

  // Sync input with URL when URL changes (e.g. back button)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    // Defer update to avoid synchronous render warning
    const t = setTimeout(() => {
       setSearchValue(q);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setIsCreateOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowAccounts(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchValue.trim()) {
        navigate(`/?q=${encodeURIComponent(searchValue.trim())}`);
        setIsSearchFocused(false);
      } else {
        navigate('/');
      }
    }
  };

  const selectSuggestion = (term: string) => {
     setSearchValue(term);
     navigate(`/?q=${encodeURIComponent(term)}`);
     setIsSearchFocused(false);
  };

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchValue('');
    navigate('/');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const otherAccounts = savedAccounts.filter((account) => account.userId !== user?.id);

  const getAccountName = (account: { email: string | null; userMetadata: Record<string, string> | null; displayName: string | null }) => {
    if (account.displayName) return account.displayName;
    const meta = account.userMetadata || {};
    const firstName = meta.first_name || meta.firstName || '';
    const lastName = meta.last_name || meta.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || account.email || 'User';
  };

  const getAccountAvatar = (account: { userId: string; userMetadata: Record<string, string> | null; avatarUrl: string | null }) => {
    if (account.avatarUrl) return account.avatarUrl;
    const meta = account.userMetadata || {};
    return meta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.userId}`;
  };

  const handleSwitchAccount = async (accountId: string) => {
    const { error } = await switchAccount(accountId);
    if (error) {
      console.error('Failed to switch account:', error);
      return;
    }
    setShowAccounts(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-white z-50 flex items-center px-4 gap-4 shadow-sm">
      {/* Logo */}
      <a href="/" onClick={goHome} className="p-3 hover:bg-gray-100 rounded-full cursor-pointer flex-shrink-0">
        <svg height="24" width="24" viewBox="0 0 24 24" aria-label="Pinterest" role="img">
          <path d="M0 12c0 5.123 3.211 9.497 7.73 11.218-.11-.937-.227-2.482.025-3.566.217-.932 1.401-5.938 1.401-5.938s-.357-.715-.357-1.774c0-1.66.962-2.9 2.161-2.9 1.02 0 1.512.765 1.512 1.682 0 1.025-.653 2.557-.99 3.978-.281 1.189.597 2.159 1.769 2.159 2.123 0 3.756-2.239 3.756-5.471 0-2.861-2.056-4.86-4.991-4.86-3.398 0-5.393 2.549-5.393 5.184 0 1.027.395 2.127.894 2.741a.361.361 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.646 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12" fill="#E60023"></path>
        </svg>
      </a>

      {/* Nav Links - Desktop */}
      <div className="hidden md:flex gap-2 items-center">
        <button 
          onClick={goHome} 
          className={`px-4 py-3 rounded-full font-semibold ${!searchParams.get('q') ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
        >
          Home
        </button>
        <div className="relative" ref={createRef}>
          <button 
             onClick={() => setIsCreateOpen(!isCreateOpen)}
             className={`px-4 py-3 rounded-full font-semibold flex items-center gap-1 ${isCreateOpen ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Create <ChevronDown size={20} />
          </button>
          {isCreateOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
               <div onClick={() => { navigate('/create-pin'); setIsCreateOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Create Idea Pin</div>
               <div onClick={() => { navigate('/create-pin'); setIsCreateOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Create Pin</div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 relative" ref={searchRef}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearch}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search Anime, Manga..." 
          className="w-full bg-[#E9E9E9] hover:bg-[#e1e1e1] focus:bg-white border border-transparent focus:border-blue-400 focus:outline-none rounded-full py-3 pl-10 pr-4 text-base transition-colors"
        />

        {/* Search Suggestions Dropdown */}
        {isSearchFocused && (
           <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden z-50 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 mb-2 text-sm text-gray-500 font-semibold">Suggested searches</div>
              <div className="flex flex-col">
                 {suggestions.map((term) => (
                    <div 
                      key={term}
                      onClick={() => selectSuggestion(term)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                       <Search size={16} className="text-gray-400" />
                       <span className="font-semibold">{term}</span>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-1 text-gray-500">
        <button className="p-3 hover:bg-gray-100 rounded-full relative" title="Notifications">
          <Bell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#E60023] rounded-full"></span>
        </button>
        {user && (
          <>
            <button 
              onClick={() => navigate('/profile')}
              className="p-1 hover:bg-gray-100 rounded-full" 
              title="Your Profile"
            >
               <img 
                 src={userProfile?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} 
                 alt={user.email} 
                 className="w-6 h-6 rounded-full object-cover" 
               />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button 
                 onClick={() => setIsMenuOpen(!isMenuOpen)}
                 className={`p-1 rounded-full ${isMenuOpen ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
              >
                 <ChevronDown size={20} />
              </button>
              
              {isMenuOpen && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3">
                       <p className="text-xs text-gray-500 mb-2">Currently in</p>
                       <div 
                          onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer bg-gray-100"
                       >
                          <img 
                            src={userProfile?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} 
                            alt={user.email} 
                            className="w-10 h-10 rounded-full" 
                          />
                          <div className="flex-1 min-w-0">
                             <p className="font-semibold text-sm truncate">
                               {userProfile 
                                 ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
                                 : user.user_metadata?.first_name && user.user_metadata?.last_name
                                 ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                                 : (user.user_metadata?.first_name || user.email?.split('@')[0] || 'User')}
                             </p>
                             <p className="text-xs text-gray-500 truncate">
                               {user.email}
                             </p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                       </div>
                    </div>
                    
                    <div className="border-t my-1"></div>
                    <div className="px-4 py-1 text-xs text-gray-500 font-semibold mt-1">Your accounts</div>
                    <div onClick={() => { navigate('/saved'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Saved Pins</div>
                    <div onClick={() => { navigate('/history'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">View History</div>
                    <div onClick={() => { navigate('/albums'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Photo Albums</div>
                    <button
                      onClick={() => setShowAccounts((prev) => !prev)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold"
                    >
                      Change account
                    </button>
                    {showAccounts && (
                      <div className="px-2 pb-2">
                        {otherAccounts.length === 0 ? (
                          <div className="px-2 py-2 text-xs text-gray-500">
                            No other accounts saved
                          </div>
                        ) : (
                          otherAccounts.map((account) => (
                            <button
                              key={account.userId}
                              onClick={() => handleSwitchAccount(account.userId)}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded-lg text-left"
                            >
                              <img
                                src={getAccountAvatar(account)}
                                alt={account.email || 'Account'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{getAccountName(account)}</p>
                                <p className="text-xs text-gray-500 truncate">{account.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    <div
                      onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold"
                    >
                      Add account
                    </div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Convert to business</div>

                    <div className="border-t my-1"></div>
                    <div className="px-4 py-1 text-xs text-gray-500 font-semibold mt-1">More options</div>
                    <div onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Settings</div>
                    <div onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Tune your home feed</div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Install the Windows app</div>
                    <div onClick={() => { navigate('/help'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">Get help</div>
                    <div onClick={() => { navigate('/terms'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">See terms of service</div>
                    <div onClick={() => { navigate('/privacy'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">See privacy policy</div>
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoggingOut && <Loader2 size={16} className="animate-spin" />}
                      Log out
                    </button>
                 </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
