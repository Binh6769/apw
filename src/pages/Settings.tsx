import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { getUserProfile, upsertUserProfile } from '../services/userProfileService';
import { useUiSettings } from '../hooks/useUiSettings';
import type { ActionVisibility, CardRadius, ColorMode, FeedDensity, GridColumns, ThemeStyle, ImageQuality, BorderStyle } from '../contexts/UISettingsContext';
import type { Photo } from '../types';
import clsx from 'clsx';
import { Upload, Trash2, Search, Shield, ShieldCheck, Users, FileText, X, Check, Ban, Eye } from 'lucide-react';
import {
  validateAdminAccessKey,
  upgradeToAdmin,
  searchUsers,
  getAllUsersWithStats,
  getUserDetails,
  getUserPosts,
  banUser,
  unbanUser,
  deleteUserAccount,
  deletePosts,
  getAllPosts,
  type UserWithAuth,
  type BanDuration,
} from '../services/adminService';

export function Settings() {
  const { showToast } = useToast();
  const { user, isAdmin, refreshAdminRole } = useAuth();
  const { settings, resolvedColorMode, updateSettings, resetSettings } = useUiSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'tune-home-feed', label: 'Tune your home feed' },
    { id: 'claimed-accounts', label: 'Claimed accounts' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy-data', label: 'Privacy and data' },
    { id: 'security', label: 'Security' },
  ];

  if (!isAdmin) {
    tabs.push({ id: 'upgrade-admin', label: 'Upgrade to Admin' });
  } else {
    tabs.push({ id: 'admin-users', label: 'User Management' });
    tabs.push({ id: 'admin-posts', label: 'Posts Management' });
  }

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    avatarUrl: '',
    birthDate: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminAccessKey, setAdminAccessKey] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<UserWithAuth[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithAuth | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<Photo[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<Photo[]>([]);
  const [adminTab, setAdminTab] = useState<'users' | 'posts'>('users');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDuration, setBanDuration] = useState<BanDuration>(7);

  const colorModes: Array<{ id: ColorMode; label: string; description: string }> = [
    { id: 'light', label: 'Light', description: 'Bright background and standard contrast.' },
    { id: 'dark', label: 'Dark', description: 'Dimmed background for low light.' },
    { id: 'system', label: 'System', description: 'Match your device settings.' },
  ];

  const themeOptions: Array<{ id: ThemeStyle; label: string; swatches: string[] }> = [
    { id: 'classic', label: 'Classic', swatches: ['#111827', '#E60023'] },
    { id: 'sunset', label: 'Sunset', swatches: ['#f97316', '#f59e0b'] },
    { id: 'ocean', label: 'Ocean', swatches: ['#0ea5e9', '#38bdf8'] },
    { id: 'mint', label: 'Mint', swatches: ['#10b981', '#34d399'] },
    { id: 'purple', label: 'Purple', swatches: ['#8b5cf6', '#a78bfa'] },
    { id: 'rose', label: 'Rose', swatches: ['#f43f5e', '#fb7185'] },
  ];

  const gridOptions: Array<{ value: GridColumns; label: string }> = [
    { value: 'auto', label: 'Auto (responsive)' },
    { value: 2, label: '2 columns' },
    { value: 3, label: '3 columns' },
    { value: 4, label: '4 columns' },
    { value: 5, label: '5 columns' },
    { value: 6, label: '6 columns' },
    { value: 7, label: '7 columns' },
  ];

  const densityOptions: Array<{ id: FeedDensity; label: string; description: string }> = [
    { id: 'compact', label: 'Compact', description: 'Tighter gaps for seeing more pins at once.' },
    { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing for everyday browsing.' },
    { id: 'spacious', label: 'Spacious', description: 'More breathing room between pins.' },
  ];

  const radiusOptions: Array<{ id: CardRadius; label: string; description: string }> = [
    { id: 'crisp', label: 'Crisp', description: 'Sharper corners for a clean look.' },
    { id: 'soft', label: 'Soft', description: 'Gentle rounding for a modern feel.' },
    { id: 'pillowy', label: 'Pillowy', description: 'Extra round for a playful vibe.' },
  ];

  const actionOptions: Array<{ id: ActionVisibility; label: string; description: string }> = [
    { id: 'hover', label: 'On hover', description: 'Show actions when you hover a pin.' },
    { id: 'always', label: 'Always', description: 'Keep actions visible on every pin.' },
    { id: 'hidden', label: 'Hidden', description: 'Hide actions for a cleaner grid.' },
  ];

  // Photo upload hook
  const {
    uploading: photoUploading,
    progress,
    error: photoError,
    uploadPhoto,
  } = usePhotoUpload({
    userId: user?.id || '',
    onSuccess: (url) => {
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      showToast('Photo uploaded successfully', 'success');
    },
    onError: (error) => {
      showToast(`Upload failed: ${error.message}`, 'error');
    },
    autoCompress: true,
  });

  // Load user profile from Supabase
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setFormData({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            age: profile.age?.toString() || '',
            email: user.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            bio: profile.bio || '',
            website: profile.website || '',
            avatarUrl: profile.avatar_url || '',
            birthDate: profile.birth_date || ''
          });
        } else {
          // Initialize with user metadata if available
          setFormData({
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            age: '',
            email: user.email || '',
            phone: '',
            location: '',
            bio: '',
            website: '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            birthDate: ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      birthDate,
      age: calculateAge(birthDate)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const success = await upsertUserProfile(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar_url: formData.avatarUrl,
        phone: formData.phone,
        location: formData.location,
        website: formData.website,
        birth_date: formData.birthDate,
        age: formData.age ? parseInt(formData.age, 10) : null
      });

      if (success) {
        showToast('Profile updated successfully', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          age: profile.age?.toString() || '',
          email: user.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          website: profile.website || '',
          avatarUrl: profile.avatar_url || '',
          birthDate: profile.birth_date || ''
        });
      }
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  // Handle photo file selection and upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      await uploadPhoto(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle photo remove
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    showToast('Photo removed', 'success');
  };

  // Trigger file input
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleColorModeChange = (mode: ColorMode) => {
    updateSettings({ colorMode: mode });
  };

  const handleThemeChange = (theme: ThemeStyle) => {
    updateSettings({ themeStyle: theme });
  };

  const handleGridChange = (value: string) => {
    if (value === 'auto') {
      updateSettings({ gridColumns: 'auto' });
      return;
    }
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric)) return;
    updateSettings({ gridColumns: numeric as GridColumns });
  };

  const handleDensityChange = (density: FeedDensity) => {
    updateSettings({ feedDensity: density });
  };

  const handleRadiusChange = (radius: CardRadius) => {
    updateSettings({ cardRadius: radius });
  };

  const handleActionVisibilityChange = (visibility: ActionVisibility) => {
    updateSettings({ actionVisibility: visibility });
  };

  const handleImageQualityChange = (quality: ImageQuality) => {
    updateSettings({ imageQuality: quality });
  };

  const handleBorderStyleChange = (style: BorderStyle) => {
    updateSettings({ borderStyle: style });
  };

  const handleLoadingSkeletonsChange = (show: boolean) => {
    updateSettings({ showLoadingSkeletons: show });
  };

  const handleUpgradeToAdmin = async () => {
    if (!user) return;
    
    setIsUpgrading(true);
    try {
      if (!validateAdminAccessKey(adminAccessKey)) {
        showToast('Invalid admin access key', 'error');
        setIsUpgrading(false);
        return;
      }

      const success = await upgradeToAdmin(user.id);
      if (success) {
        showToast('Successfully upgraded to Admin!', 'success');
        setAdminAccessKey('');
        await refreshAdminRole();
      } else {
        showToast('Failed to upgrade to admin', 'error');
      }
    } catch (error) {
      console.error('Error upgrading to admin:', error);
      showToast('Failed to upgrade to admin', 'error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const loadAdminUsers = async () => {
    setIsLoading(true);
    try {
      const users = await getAllUsersWithStats();
      setAdminUsers(users);
    } catch (error) {
      console.error('Error loading admin users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      await loadAdminUsers();
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchUsers(query);
      const usersWithStats: UserWithAuth[] = results.map(u => ({
        user_id: u.user_id,
        email: u.email,
        role: u.role,
        banned_until: u.banned_until,
        first_name: u.first_name,
        last_name: u.last_name,
        avatar_url: u.avatar_url,
        bio: null,
        location: null,
        created_at: '',
        post_count: 0,
      }));
      setAdminUsers(usersWithStats);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (userData: UserWithAuth) => {
    setIsLoading(true);
    try {
      const details = await getUserDetails(userData.user_id);
      if (details) {
        setSelectedUser(details);
        const posts = await getUserPosts(userData.user_id);
        setSelectedUserPosts(posts);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      showToast('Failed to load user details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseUserDetail = () => {
    setSelectedUser(null);
    setSelectedUserPosts([]);
    setSelectedPosts([]);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const success = await banUser(selectedUser.user_id, banDuration);
      if (success) {
        showToast('User banned successfully', 'success');
        setShowBanModal(false);
        await loadAdminUsers();
        const updated = await getUserDetails(selectedUser.user_id);
        if (updated) setSelectedUser(updated);
      } else {
        showToast('Failed to ban user', 'error');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      showToast('Failed to ban user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const success = await unbanUser(selectedUser.user_id);
      if (success) {
        showToast('User unbanned successfully', 'success');
        await loadAdminUsers();
        const updated = await getUserDetails(selectedUser.user_id);
        if (updated) setSelectedUser(updated);
      } else {
        showToast('Failed to unban user', 'error');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      showToast('Failed to unban user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to delete user ${selectedUser.email}? This action cannot be undone.`)) return;
    
    setIsLoading(true);
    try {
      const success = await deleteUserAccount(selectedUser.user_id);
      if (success) {
        showToast('User deleted successfully', 'success');
        handleCloseUserDetail();
        await loadAdminUsers();
      } else {
        showToast('Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAllUserPosts = () => {
    if (selectedPosts.length === selectedUserPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(selectedUserPosts.map(p => p.id));
    }
  };

  const handleBulkDeleteUserPosts = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) return;
    
    setIsLoading(true);
    try {
      const success = await deletePosts(selectedPosts);
      if (success) {
        showToast('Posts deleted successfully', 'success');
        setSelectedPosts([]);
        if (selectedUser) {
          const posts = await getUserPosts(selectedUser.user_id);
          setSelectedUserPosts(posts);
        }
      } else {
        showToast('Failed to delete posts', 'error');
      }
    } catch (error) {
      console.error('Error deleting posts:', error);
      showToast('Failed to delete posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllPosts = async () => {
    setIsLoading(true);
    try {
      const posts = await getAllPosts();
      setAllPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDeleteAllPosts = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) return;
    
    setIsLoading(true);
    try {
      const success = await deletePosts(selectedPosts);
      if (success) {
        showToast('Posts deleted successfully', 'success');
        setSelectedPosts([]);
        await loadAllPosts();
      } else {
        showToast('Failed to delete posts', 'error');
      }
    } catch (error) {
      console.error('Error deleting posts:', error);
      showToast('Failed to delete posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const previewRadiusClass =
    settings.cardRadius === 'crisp'
      ? 'rounded-lg'
      : settings.cardRadius === 'soft'
        ? 'rounded-xl'
        : 'rounded-2xl';
  const previewGapClass =
    settings.feedDensity === 'compact'
      ? 'gap-2'
      : settings.feedDensity === 'spacious'
        ? 'gap-5'
        : 'gap-3';

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
      <Header />

      {/* Mobile Navigation */}
      <div className="md:hidden overflow-x-auto whitespace-nowrap px-4 py-2 border-b border-anime-border scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "inline-block px-4 py-2 mr-2 rounded-full font-semibold text-sm transition-colors",
              activeTab === tab.id
                ? "bg-anime-primary text-white"
                : "bg-anime-surface text-[var(--ui-accent-strong)] hover:bg-anime-surface-muted border border-anime-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex max-w-[1000px] mx-auto pt-4 md:pt-8">

        {/* Sidebar - Desktop */}
        <div className="w-64 hidden md:block pr-8 fixed h-[calc(100vh-80px)] overflow-y-auto">
          <div className="flex flex-col gap-1 pb-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "text-left font-semibold px-2 py-2 rounded-lg transition-colors border-l-4",
                  activeTab === tab.id
                    ? "bg-anime-surface-muted text-anime-primary border-anime-primary"
                    : "hover:bg-anime-surface text-[var(--ui-accent-strong)] hover:text-anime-primary border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 md:ml-64 px-4 pb-20">
          {activeTab === 'profile' ? (
            <>
              <h1 className="text-3xl font-semibold mb-2">Your Profile</h1>
              <p className="text-[var(--ui-accent-strong)] opacity-80 mb-8">Manage your personal information and profile settings</p>

              <div className="flex flex-col gap-8 max-w-[600px]">
                {/* Profile Photo Section */}
                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-4">Profile Photo</h2>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <img
                        src={formData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt="User"
                        className="w-24 h-24 rounded-full bg-anime-surface-muted border-4 border-anime-border shadow-md object-cover"
                      />
                      {photoUploading && (
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-xs font-semibold">{progress}%</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Upload a new photo to personalize your profile</p>
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={photoUploading}
                          className="hidden"
                        />
                        <button
                          onClick={triggerPhotoUpload}
                          disabled={photoUploading}
                          className={clsx(
                            "flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-colors w-fit",
                            photoUploading
                              ? "bg-anime-surface-muted text-gray-500 cursor-not-allowed"
                              : "bg-anime-surface-strong text-anime-text hover:bg-anime-surface-muted"
                          )}
                        >
                          <Upload size={16} />
                          {photoUploading ? `Uploading... ${progress}%` : 'Upload Photo'}
                        </button>
                        {formData.avatarUrl && (
                          <button
                            onClick={handleRemovePhoto}
                            disabled={photoUploading}
                            className={clsx(
                              "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors",
                              photoUploading
                                ? "bg-anime-surface-muted text-gray-500 cursor-not-allowed"
                                : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            )}
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        )}
                      </div>
                      {photoError && (
                        <p className="text-sm text-red-600">{photoError.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-6">Personal Information</h2>

                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-[var(--ui-accent-strong)] block mb-2">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors placeholder:text-gray-400"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-anime-text block mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    {/* Birth Date & Age */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-anime-text block mb-2">Birth Date</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleBirthDateChange}
                          className="w-full border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-anime-text block mb-2">Age</label>
                        <input
                          type="text"
                          name="age"
                          value={formData.age}
                          disabled
                          className="w-full border border-anime-border rounded-xl px-4 py-3 bg-anime-surface border border-anime-border text-gray-300"
                          placeholder="Auto-calculated"
                        />
                        <p className="text-xs text-gray-400 mt-1">Auto-calculated from birth date</p>
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-anime-text block mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full border border-anime-border rounded-xl px-4 py-3 bg-anime-surface border border-anime-border text-gray-300"
                        />
                        <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-anime-text block mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-sm font-semibold text-anime-text block mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                        placeholder="City, Country"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="text-sm font-semibold text-anime-text block mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-sm font-semibold text-[var(--ui-accent-strong)] block mb-2">About You</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell people about yourself..."
                        className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-xl px-4 py-3 h-28 focus:ring-2 focus:ring-anime-primary focus:outline-none resize-none transition-colors placeholder:text-gray-400"
                      ></textarea>
                      <p className="text-xs text-[var(--ui-accent-strong)] opacity-60 mt-1">{formData.bio.length}/500 characters</p>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-lg text-blue-400 mb-4">Account Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-anime-primary mb-1">Full Name</p>
                      <p className="font-semibold text-blue-400">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-anime-primary mb-1">Age</p>
                      <p className="font-semibold text-blue-400">{formData.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-anime-primary mb-1">Location</p>
                      <p className="font-semibold text-blue-400">{formData.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-anime-primary mb-1">Account Email</p>
                      <p className="font-semibold text-blue-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4 border-t border-anime-border">
                  <button
                    onClick={handleReset}
                    className="bg-anime-surface-muted hover:bg-anime-border text-[var(--ui-accent-strong)] px-6 py-3 rounded-full font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className={`text-white px-6 py-3 rounded-full font-bold transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed bg-anime-primary' : 'bg-anime-primary hover:bg-anime-secondary'}`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'appearance' ? (
            <>
              <h1 className="text-3xl font-semibold mb-2">Appearance</h1>
              <p className="text-[var(--ui-accent-strong)] opacity-80 mb-8">Personalize the look of your home feed and interface</p>

              <div className="flex flex-col gap-8 max-w-[600px]">
                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Quick Preview</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Live sample that reflects your current settings.</p>
                  <div className={clsx("mt-4 grid grid-cols-3", previewGapClass)}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`preview-${index}`}
                        className={clsx(
                          "relative bg-anime-surface border border-anime-border",
                          previewRadiusClass
                        )}
                        style={{ paddingBottom: '130%' }}
                      >
                        <div className="absolute inset-3 flex flex-col justify-between">
                          <div className="h-10 w-10 rounded-full bg-anime-surface-muted" />
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Pin</span>
                            <span className="font-semibold" style={{ color: 'var(--ui-accent)' }}>Save</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--ui-accent-strong)]">
                    <div>
                      <p className="text-xs uppercase tracking-wide opacity-60">Density</p>
                      <p className="font-semibold">{settings.feedDensity}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide opacity-60">Corners</p>
                      <p className="font-semibold">{settings.cardRadius}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Color Mode</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Choose how the app looks on this device.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    {colorModes.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleColorModeChange(mode.id)}
                        className={clsx(
                          "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                          settings.colorMode === mode.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{mode.label}</p>
                          <p className={clsx(
                            "text-xs",
                            settings.colorMode === mode.id ? "text-gray-200" : "text-gray-400"
                          )}>
                            {mode.description}
                          </p>
                        </div>
                        {settings.colorMode === mode.id && (
                          <span className="text-xs font-semibold text-anime-primary">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {settings.colorMode === 'system' && (
                    <p className="text-xs text-[var(--ui-accent-strong)] opacity-60 mt-3">
                      System is currently set to {resolvedColorMode === 'dark' ? 'Dark' : 'Light'} mode.
                    </p>
                  )}
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Theme Accent</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Switch the accent color used for buttons and highlights.</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {themeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleThemeChange(option.id)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                          settings.themeStyle === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <span className="flex gap-2">
                          {option.swatches.map((color) => (
                            <span
                              key={`${option.id}-${color}`}
                              className="h-4 w-4 rounded-full border border-anime-border/70"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span className="text-sm font-semibold">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Feed Density</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Control spacing between pins for faster scanning or relaxed browsing.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    {densityOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleDensityChange(option.id)}
                        className={clsx(
                          "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                          settings.feedDensity === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className={clsx(
                            "text-xs",
                            settings.feedDensity === option.id ? "text-[var(--ui-accent-strong)]" : "text-[var(--ui-accent-strong)] opacity-80"
                          )}>
                            {option.description}
                          </p>
                        </div>
                        {settings.feedDensity === option.id && (
                          <span className="text-xs font-semibold text-anime-primary">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Card Corners</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Pick the rounding used on pins across the feed.</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {radiusOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleRadiusChange(option.id)}
                        className={clsx(
                          "flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors text-left",
                          settings.cardRadius === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <span className={clsx("h-10 w-10 border border-anime-border bg-anime-bg", option.id === 'crisp' ? 'rounded-lg' : option.id === 'soft' ? 'rounded-xl' : 'rounded-2xl')} />
                        <span>
                          <span className="text-sm font-semibold block">{option.label}</span>
                          <span className={clsx(
                            "text-xs",
                            settings.cardRadius === option.id ? "text-[var(--ui-accent-strong)]" : "text-[var(--ui-accent-strong)] opacity-80"
                          )}>
                            {option.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Pin Actions</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Decide when action buttons appear on each pin.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    {actionOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleActionVisibilityChange(option.id)}
                        className={clsx(
                          "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                          settings.actionVisibility === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className={clsx(
                            "text-xs",
                            settings.actionVisibility === option.id ? "text-[var(--ui-accent-strong)]" : "text-[var(--ui-accent-strong)] opacity-80"
                          )}>
                            {option.description}
                          </p>
                        </div>
                        {settings.actionVisibility === option.id && (
                          <span className="text-xs font-semibold text-anime-primary">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Image Quality</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Choose image quality preference for loading and display.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    {[
                      { id: 'low', label: 'Low Quality', description: 'Faster loading, lower bandwidth' },
                      { id: 'medium', label: 'Medium Quality', description: 'Balanced speed and quality' },
                      { id: 'high', label: 'High Quality', description: 'Best quality (default)' },
                      { id: 'ultra', label: 'Ultra Quality', description: 'Maximum quality, largest file size' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleImageQualityChange(option.id as ImageQuality)}
                        className={clsx(
                          "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                          settings.imageQuality === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className={clsx(
                            "text-xs",
                            settings.imageQuality === option.id ? "text-[var(--ui-accent-strong)]" : "text-[var(--ui-accent-strong)] opacity-80"
                          )}>
                            {option.description}
                          </p>
                        </div>
                        {settings.imageQuality === option.id && (
                          <span className="text-xs font-semibold text-anime-primary">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Border Style</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Customize how card borders appear.</p>
                  <div className="flex flex-col gap-3 mt-4">
                    {[
                      { id: 'solid', label: 'Solid Border', description: 'Traditional bordered cards' },
                      { id: 'outlined', label: 'Outlined (Default)', description: 'Subtle outline effect' },
                      { id: 'shadowOnly', label: 'Shadow Only', description: 'Floating card effect with shadow' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleBorderStyleChange(option.id as BorderStyle)}
                        className={clsx(
                          "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                          settings.borderStyle === option.id
                            ? "border-anime-primary border-2 bg-anime-surface"
                            : "border-anime-border bg-anime-bg hover:bg-anime-surface-muted"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className={clsx(
                            "text-xs",
                            settings.borderStyle === option.id ? "text-[var(--ui-accent-strong)]" : "text-[var(--ui-accent-strong)] opacity-80"
                          )}>
                            {option.description}
                          </p>
                        </div>
                        {settings.borderStyle === option.id && (
                          <span className="text-xs font-semibold text-anime-primary">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Loading Experience</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Show placeholder skeletons while images load.</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ui-accent-strong)]">Display Loading Skeletons</p>
                      <p className="text-xs text-[var(--ui-accent-strong)] opacity-60 mt-1">Shows animated placeholders while content loads</p>
                    </div>
                    <button
                      onClick={() => handleLoadingSkeletonsChange(!settings.showLoadingSkeletons)}
                      className={clsx(
                        "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                        settings.showLoadingSkeletons
                          ? "bg-anime-primary"
                          : "bg-anime-border"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-6 w-6 transform rounded-full bg-anime-surface transition-transform",
                          settings.showLoadingSkeletons ? "translate-x-7" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-2">Image Grid</h2>
                  <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Control how many images are shown in each row.</p>
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-[var(--ui-accent-strong)] block mb-2">Columns</label>
                    <select
                      value={String(settings.gridColumns)}
                      onChange={(e) => handleGridChange(e.target.value)}
                      className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                    >
                      {gridOptions.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--ui-accent-strong)] opacity-60 mt-2">Smaller screens will keep a safe minimum for readability.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-anime-border p-4 bg-anime-surface shadow-sm">
                  <div>
                    <p className="font-semibold">Reset appearance</p>
                    <p className="text-sm text-[var(--ui-accent-strong)] opacity-80">Restore default colors and layout settings.</p>
                  </div>
                  <button
                    onClick={resetSettings}
                    className="bg-anime-surface-muted hover:bg-anime-border px-5 py-2 rounded-full font-semibold transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'upgrade-admin' && !isAdmin ? (
            <>
              <h1 className="text-3xl font-semibold mb-2 text-yellow-500 flex items-center gap-3">
                <Shield size={32} /> Upgrade to Admin
              </h1>
              <p className="text-[var(--ui-accent-strong)] opacity-80 mb-8">Enter the admin access key to gain administrator privileges.</p>
              
              <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm max-w-md">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[var(--ui-accent-strong)] block mb-2">Admin Access Key</label>
                    <input
                      type="password"
                      value={adminAccessKey}
                      onChange={(e) => setAdminAccessKey(e.target.value)}
                      className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                      placeholder="Enter your admin access key"
                    />
                  </div>
                  <button
                    onClick={handleUpgradeToAdmin}
                    disabled={isUpgrading || !adminAccessKey.trim()}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={20} />
                    {isUpgrading ? 'Upgrading...' : 'Upgrade to Admin'}
                  </button>
                </div>
              </div>
            </>
          ) : (activeTab === 'admin-users' || activeTab === 'admin-posts') && isAdmin ? (
            <>
              <h1 className="text-3xl font-semibold mb-2 text-red-500 flex items-center gap-3">
                <ShieldCheck size={32} /> Admin Dashboard
              </h1>
              <p className="text-[var(--ui-accent-strong)] opacity-80 mb-6">Manage users and content across the system.</p>
              
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setAdminTab('users'); setActiveTab('admin-users'); loadAdminUsers(); }}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors",
                    adminTab === 'users' 
                      ? "bg-red-500 text-white" 
                      : "bg-anime-surface text-gray-400 hover:text-white"
                  )}
                >
                  <Users size={20} /> Users
                </button>
                <button
                  onClick={() => { setAdminTab('posts'); setActiveTab('admin-posts'); loadAllPosts(); }}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors",
                    adminTab === 'posts' 
                      ? "bg-red-500 text-white" 
                      : "bg-anime-surface text-gray-400 hover:text-white"
                  )}
                >
                  <FileText size={20} /> Posts
                </button>
              </div>

              {adminTab === 'users' ? (
                <div className="space-y-6">
                  <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold text-lg text-white">User Management</h2>
                      <button 
                        onClick={loadAdminUsers}
                        className="px-4 py-2 bg-anime-surface-muted hover:bg-anime-surface-strong rounded-lg text-sm text-white transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="Search by username, email, or display name..."
                        className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-colors"
                      />
                    </div>

                    {selectedUser ? (
                      <div className="border border-anime-border rounded-xl p-6 mt-4 bg-anime-bg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg text-white">User Details</h3>
                          <button onClick={handleCloseUserDetail} className="text-gray-400 hover:text-white">
                            <X size={24} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-xs text-gray-400">User ID</p>
                            <p className="font-mono text-sm text-white truncate">{selectedUser.user_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="font-semibold text-white">{selectedUser.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Name</p>
                            <p className="font-semibold text-white">{selectedUser.first_name} {selectedUser.last_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Join Date</p>
                            <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Role</p>
                            <p className={clsx(
                              "font-semibold",
                              selectedUser.role === 'admin' ? 'text-yellow-500' : 
                              selectedUser.role === 'banned' ? 'text-red-500' : 'text-green-500'
                            )}>{selectedUser.role}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Posts</p>
                            <p className="font-semibold text-white">{selectedUser.post_count}</p>
                          </div>
                          {selectedUser.banned_until && (
                            <div>
                              <p className="text-xs text-gray-400">Banned Until</p>
                              <p className="font-semibold text-red-500">
                                {selectedUser.banned_until === 'permanent' ? 'Permanent' : new Date(selectedUser.banned_until).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-anime-border pt-4">
                          <h4 className="font-semibold text-white mb-3">User's Posts ({selectedUserPosts.length})</h4>
                          {selectedUserPosts.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <button
                                  onClick={handleSelectAllUserPosts}
                                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                                >
                                  <Check size={16} />
                                  {selectedPosts.length === selectedUserPosts.length ? 'Deselect All' : 'Select All'}
                                </button>
                                {selectedPosts.length > 0 && (
                                  <button
                                    onClick={handleBulkDeleteUserPosts}
                                    disabled={isLoading}
                                    className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1 ml-auto"
                                  >
                                    <Trash2 size={16} />
                                    Delete Selected ({selectedPosts.length})
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                                {selectedUserPosts.map(post => (
                                  <div key={post.id} className="relative group">
                                    <img 
                                      src={post.urls.small} 
                                      alt={post.alt_description || undefined}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <div 
                                      className={clsx(
                                        "absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                                        selectedPosts.includes(post.id) 
                                          ? "bg-red-500 border-red-500" 
                                          : "bg-black/50 border-white/50 group-hover:border-white"
                                      )}
                                      onClick={() => handlePostSelection(post.id)}
                                    >
                                      {selectedPosts.includes(post.id) && <Check size={12} className="text-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2 mt-6 pt-4 border-t border-anime-border">
                          {selectedUser.role === 'banned' ? (
                            <button
                              onClick={handleUnbanUser}
                              disabled={isLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors"
                            >
                              <Ban size={18} /> Unban User
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowBanModal(true)}
                              disabled={isLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 rounded-lg transition-colors"
                            >
                              <Ban size={18} /> Ban User
                            </button>
                          )}
                          <button
                            onClick={handleDeleteUser}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors ml-auto"
                          >
                            <Trash2 size={18} /> Delete Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                          <thead className="text-xs text-gray-200 uppercase bg-anime-surface-muted">
                            <tr>
                              <th className="px-4 py-3 rounded-tl-lg">User</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3">Posts</th>
                              <th className="px-4 py-3 rounded-tr-lg">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUsers.map((u) => (
                              <tr key={u.user_id} className="border-b border-anime-border hover:bg-anime-surface-muted transition-colors cursor-pointer" onClick={() => handleSelectUser(u)}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                                      alt="Avatar"
                                      className="w-8 h-8 rounded-full"
                                    />
                                    <span className="font-semibold text-white">
                                      {u.first_name} {u.last_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">
                                  <span className={clsx(
                                    "px-2 py-1 rounded-full text-xs font-semibold",
                                    u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-500' : 
                                    u.role === 'banned' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                                  )}>{u.role}</span>
                                </td>
                                <td className="px-4 py-3">{u.post_count}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSelectUser(u); }}
                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    <Eye size={16} /> View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg text-white">Posts Management</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={loadAllPosts}
                        className="px-4 py-2 bg-anime-surface-muted hover:bg-anime-surface-strong rounded-lg text-sm text-white transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {allPosts.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-400">
                          {selectedPosts.length} of {allPosts.length} selected
                        </span>
                        <button
                          onClick={() => setSelectedPosts(allPosts.map(p => p.id))}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedPosts([])}
                          className="text-sm text-gray-400 hover:text-white"
                        >
                          Deselect All
                        </button>
                        {selectedPosts.length > 0 && (
                          <button
                            onClick={handleBulkDeleteAllPosts}
                            disabled={isLoading}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                            Delete Selected ({selectedPosts.length})
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-2 max-h-[500px] overflow-y-auto">
                        {allPosts.map(post => (
                          <div key={post.id} className="relative group">
                            <img 
                              src={post.urls.small} 
                              alt={post.alt_description || undefined}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <div 
                              className={clsx(
                                "absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                                selectedPosts.includes(post.id) 
                                  ? "bg-red-500 border-red-500" 
                                  : "bg-black/50 border-white/50 group-hover:border-white"
                              )}
                              onClick={() => handlePostSelection(post.id)}
                            >
                              {selectedPosts.includes(post.id) && <Check size={12} className="text-white" />}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">{post.user?.name}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {showBanModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-anime-surface border border-anime-border rounded-2xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-semibold text-white mb-4">Ban User</h3>
                    <p className="text-gray-400 mb-4">Select the ban duration for this user.</p>
                    <div className="space-y-2 mb-6">
                      {[
                        { value: 1, label: '1 Day' },
                        { value: 7, label: '7 Days' },
                        { value: 30, label: '30 Days' },
                        { value: -1, label: 'Permanent' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setBanDuration(option.value as BanDuration)}
                          className={clsx(
                            "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                            banDuration === option.value
                              ? "border-orange-500 bg-orange-500/20 text-white"
                              : "border-anime-border text-gray-400 hover:text-white"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBanModal(false)}
                        className="flex-1 px-4 py-3 bg-anime-surface-muted text-gray-400 hover:text-white rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBanUser}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-black rounded-xl font-semibold transition-colors"
                      >
                        {isLoading ? 'Banning...' : 'Ban User'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold mb-4">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-[var(--ui-accent-strong)] opacity-80">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
