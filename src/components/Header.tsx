import { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userProfileService';

export function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, savedAccounts, switchAccount, updateAccountProfile } = useAuth();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load user profile from Supabase
  useEffect(() => {
    if (!user) return;
    const cached = localStorage.getItem(`avatar_cache_${user.id}`);
    if (cached) setAvatarUrl(cached);
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
        if (profile) {
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || 'User';
          updateAccountProfile(user.id, profile.avatar_url ?? null, name);
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            localStorage.setItem(`avatar_cache_${user.id}`, profile.avatar_url);
          }
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

  // Debounced auto-search
  useEffect(() => {
    if (!isSearchFocused) return;

    const debounceTimeout = setTimeout(() => {
      const trimmed = searchValue.trim();
      if (trimmed === (searchParams.get('q') || '')) return; // No change

      if (trimmed) {
        if (!isLikelyImageId(trimmed)) {
          navigate(`/?q=${encodeURIComponent(trimmed)}`);
        }
      } else {
        navigate('/');
      }
    }, 800);

    return () => clearTimeout(debounceTimeout);
  }, [searchValue, isSearchFocused, navigate, searchParams]);

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

  const isLikelyImageId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed) ||
      /^(mal|art|top|unsplash|pexels|pixabay|mock|pin|local)-/i.test(trimmed)
    );
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchValue.trim()) {
        if (isLikelyImageId(searchValue)) {
          navigate(`/pin/${searchValue.trim()}`);
        } else {
          navigate(`/?q=${encodeURIComponent(searchValue.trim())}`);
        }
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

  const getAccountName = (account: { email: string | null; userMetadata: any; displayName: string | null }) => {
    if (account.displayName) return account.displayName;
    const meta = account.userMetadata || {};
    const firstName = meta.first_name || meta.firstName || '';
    const lastName = meta.last_name || meta.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || account.email || 'User';
  };

  const getAccountAvatar = (account: { userId: string; userMetadata: any; avatarUrl: string | null }) => {
    if (account.avatarUrl) return account.avatarUrl;
    const meta = account.userMetadata || {};
    return meta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.userId}`;
  };

  const resolvedAvatar =
    avatarUrl ||
    userProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    (user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : '');

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
    <div className="fixed top-0 left-0 right-0 h-20 bg-anime-bg backdrop-blur-md border-b border-anime-border z-50 flex items-center px-4 gap-4 shadow-sm text-anime-text">
      {/* Logo */}
      <a href="/" onClick={goHome} className="p-3 hover:bg-anime-surface-muted rounded-full cursor-pointer flex-shrink-0 transition-colors">
        <img
          src="/logo.png"
          alt="Anime pins logo"
          className="h-8 w-auto select-none"
          draggable={false}
        />
      </a>

      {/* Nav Links - Desktop */}
      <div className="hidden md:flex gap-2 items-center">
        <button
          onClick={goHome}
          className={`px-4 py-3 rounded-full font-semibold transition-colors ${!searchParams.get('q') ? 'bg-anime-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-transparent text-anime-muted hover:text-anime-text hover:bg-anime-surface-muted'}`}
        >
          Home
        </button>
        <div className="relative" ref={createRef}>
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className={`px-4 py-3 rounded-full font-semibold flex items-center gap-1 transition-colors ${isCreateOpen ? 'bg-anime-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-transparent text-anime-muted hover:text-anime-text hover:bg-anime-surface-muted'}`}
          >
            Create <ChevronDown size={20} />
          </button>
          {isCreateOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-anime-surface-muted border border-anime-border rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div onClick={() => { navigate('/create-pin'); setIsCreateOpen(false); }} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-anime-text transition-colors">Upload New Pin</div>
              <div onClick={() => { navigate('/profile?tab=created'); setIsCreateOpen(false); }} className="px-4 py-2 hover:bg-anime-surface cursor-pointer text-sm font-semibold text-anime-text transition-colors">My Posted Pins</div>
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
          className="w-full bg-anime-surface-muted hover:bg-anime-surface focus:bg-anime-bg text-anime-text border border-anime-border focus:border-anime-primary focus:outline-none rounded-full py-3 pl-10 pr-4 text-base transition-colors placeholder:text-anime-muted"
        />

        {/* Search Suggestions Dropdown */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-anime-surface-muted border border-anime-border rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 mb-2 text-sm text-anime-muted font-semibold">Suggested searches</div>
            <div className="flex flex-col">
              {suggestions.map((term) => (
                <div
                  key={term}
                  onClick={() => selectSuggestion(term)}
                  className="px-4 py-2 hover:bg-anime-surface cursor-pointer flex items-center gap-3 transition-colors text-anime-text"
                >
                  <Search size={16} className="text-anime-muted" />
                  <span className="font-semibold">{term}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-1 text-anime-muted">
        <button className="p-3 hover:bg-anime-surface-muted rounded-full relative transition-colors" title="Notifications">
          <Bell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-anime-cta rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
        </button>
        {user && (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="p-1 hover:bg-anime-surface-muted rounded-full transition-colors"
              title="Your Profile"
            >
              <img
                src={resolvedAvatar}
                alt={user.email}
                className="w-6 h-6 rounded-full object-cover"
              />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-[#334155] text-white' : 'hover:bg-anime-surface-muted'}`}
              >
                <ChevronDown size={20} />
              </button>

              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-anime-surface-muted border border-anime-border rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3">
                    <p className="text-xs text-anime-muted mb-2">Currently in</p>
                    <div
                      onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                      className="flex items-center gap-2 p-2 hover:bg-anime-surface rounded-lg cursor-pointer bg-transparent transition-colors"
                    >
                      <img
                        src={resolvedAvatar}
                        alt={user.email}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-anime-text truncate">
                          {userProfile
                            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
                            : user.user_metadata?.first_name && user.user_metadata?.last_name
                              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                              : (user.user_metadata?.first_name || user.email?.split('@')[0] || 'User')}
                        </p>
                        <p className="text-xs text-anime-muted truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>

                  <div className="border-t border-anime-border my-1"></div>
                  <div className="px-4 py-1 text-xs text-anime-muted font-semibold mt-1">Your accounts</div>
                  <div onClick={() => { navigate('/saved'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Saved Pins</div>
                  <div onClick={() => { navigate('/history'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">View History</div>
                  <div onClick={() => { navigate('/albums'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Photo Albums</div>
                  <button
                    onClick={() => setShowAccounts((prev) => !prev)}
                    className="w-full text-left px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors"
                  >
                    Change account
                  </button>
                  {showAccounts && (
                    <div className="px-2 pb-2">
                      {otherAccounts.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-anime-muted">
                          No other accounts saved
                        </div>
                      ) : (
                        otherAccounts.map((account) => (
                          <button
                            key={account.userId}
                            onClick={() => handleSwitchAccount(account.userId)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-anime-surface rounded-lg text-left transition-colors"
                          >
                            <img
                              src={getAccountAvatar(account)}
                              alt={account.email || 'Account'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-anime-text truncate">{getAccountName(account)}</p>
                              <p className="text-xs text-anime-muted truncate">{account.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div
                    onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                    className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors"
                  >
                    Add account
                  </div>
                  <div className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Convert to business</div>

                  <div className="border-t border-anime-border my-1"></div>
                  <div className="px-4 py-1 text-xs text-anime-muted font-semibold mt-1">More options</div>
                  <div onClick={() => { navigate('/categories'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Manage Categories</div>
                  <div onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Settings</div>
                  <div onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Tune your home feed</div>
                  <div className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Install the Windows app</div>
                  <div onClick={() => { navigate('/help'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">Get help</div>
                  <div onClick={() => { navigate('/terms'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">See terms of service</div>
                  <div onClick={() => { navigate('/privacy'); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold transition-colors">See privacy policy</div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 hover:bg-anime-surface text-anime-text cursor-pointer text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
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
