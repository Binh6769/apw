import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { getUserProfile, upsertUserProfile } from '../services/userProfileService';
import { useUiSettings } from '../hooks/useUiSettings';
import type { ActionVisibility, CardRadius, ColorMode, FeedDensity, GridColumns, ThemeStyle, ImageQuality, BorderStyle } from '../contexts/UISettingsContext';
import clsx from 'clsx';
import { Upload, Trash2 } from 'lucide-react';

export function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { settings, resolvedColorMode, updateSettings, resetSettings } = useUiSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
     { id: 'profile', label: 'Profile' },
     { id: 'appearance', label: 'Appearance' },
     { id: 'tune-home-feed', label: 'Tune your home feed' },
     { id: 'claimed-accounts', label: 'Claimed accounts' },
     { id: 'notifications', label: 'Notifications' },
     { id: 'privacy-data', label: 'Privacy and data' },
     { id: 'security', label: 'Security' },
  ];

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
    <div className="min-h-screen bg-white pt-20">
      <Header />
      
      {/* Mobile Navigation */}
      <div className="md:hidden overflow-x-auto whitespace-nowrap px-4 py-2 border-b border-gray-100 scrollbar-hide">
         {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={clsx(
                  "inline-block px-4 py-2 mr-2 rounded-full font-semibold text-sm transition-colors",
                  activeTab === tab.id 
                    ? "bg-black text-white" 
                    : "bg-gray-100 text-black hover:bg-gray-200"
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
                        "text-left font-semibold px-2 py-2 rounded-lg transition-colors",
                        activeTab === tab.id
                           ? "bg-gray-100 text-black border-l-4 border-black"
                           : "hover:bg-gray-100 text-gray-500 hover:text-black border-l-4 border-transparent"
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
               <p className="text-gray-500 mb-8">Manage your personal information and profile settings</p>

               <div className="flex flex-col gap-8 max-w-[600px]">
                  {/* Profile Photo Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                     <h2 className="font-semibold text-lg mb-4">Profile Photo</h2>
                     <div className="flex items-center gap-6">
                        <div className="relative group">
                           <img 
                             src={formData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                             alt="User" 
                             className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md object-cover" 
                           />
                           {photoUploading && (
                             <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                               <div className="text-white text-xs font-semibold">{progress}%</div>
                             </div>
                           )}
                        </div>
                        <div className="flex flex-col gap-3">
                           <p className="text-sm text-gray-600">Upload a new photo to personalize your profile</p>
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
                                   ? "bg-gray-400 text-white cursor-not-allowed"
                                   : "bg-black text-white hover:bg-gray-800"
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
                                     ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                     : "bg-red-100 text-red-600 hover:bg-red-200"
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
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                     <h2 className="font-semibold text-lg mb-6">Personal Information</h2>
                     
                     <div className="space-y-4">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">First Name</label>
                              <input 
                                 type="text" 
                                 name="firstName"
                                 value={formData.firstName}
                                 onChange={handleChange}
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                                 placeholder="Enter first name"
                              />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">Last Name</label>
                              <input 
                                 type="text" 
                                 name="lastName"
                                 value={formData.lastName}
                                 onChange={handleChange}
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                                 placeholder="Enter last name"
                              />
                           </div>
                        </div>

                        {/* Birth Date & Age */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">Birth Date</label>
                              <input 
                                 type="date" 
                                 name="birthDate"
                                 value={formData.birthDate}
                                 onChange={handleBirthDateChange}
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                              />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">Age</label>
                              <input 
                                 type="text" 
                                 name="age"
                                 value={formData.age}
                                 disabled
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-600" 
                                 placeholder="Auto-calculated"
                              />
                              <p className="text-xs text-gray-500 mt-1">Auto-calculated from birth date</p>
                           </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">Email</label>
                              <input 
                                 type="email" 
                                 value={user?.email || ''}
                                 disabled
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-600" 
                              />
                              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-2">Phone Number</label>
                              <input 
                                 type="tel" 
                                 name="phone"
                                 value={formData.phone}
                                 onChange={handleChange}
                                 className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                                 placeholder="+1 (555) 000-0000"
                              />
                           </div>
                        </div>

                        {/* Location */}
                        <div>
                           <label className="text-sm font-semibold text-gray-700 block mb-2">Location</label>
                           <input 
                              type="text" 
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                              placeholder="City, Country"
                           />
                        </div>

                        {/* Website */}
                        <div>
                           <label className="text-sm font-semibold text-gray-700 block mb-2">Website</label>
                           <input 
                              type="url" 
                              name="website"
                              value={formData.website}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors" 
                              placeholder="https://yourwebsite.com"
                           />
                        </div>

                        {/* Bio */}
                        <div>
                           <label className="text-sm font-semibold text-gray-700 block mb-2">About You</label>
                           <textarea 
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              placeholder="Tell people about yourself..." 
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 h-28 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none transition-colors"
                           ></textarea>
                           <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                        </div>
                     </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                     <h3 className="font-semibold text-lg text-blue-900 mb-4">Account Summary</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-xs text-blue-600 mb-1">Full Name</p>
                           <p className="font-semibold text-blue-900">{formData.firstName} {formData.lastName}</p>
                        </div>
                        <div>
                           <p className="text-xs text-blue-600 mb-1">Age</p>
                           <p className="font-semibold text-blue-900">{formData.age || 'Not specified'}</p>
                        </div>
                        <div>
                           <p className="text-xs text-blue-600 mb-1">Location</p>
                           <p className="font-semibold text-blue-900">{formData.location || 'Not specified'}</p>
                        </div>
                        <div>
                           <p className="text-xs text-blue-600 mb-1">Account Email</p>
                           <p className="font-semibold text-blue-900 truncate">{user?.email}</p>
                        </div>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                     <button 
                        onClick={handleReset} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full font-semibold transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                       onClick={handleSave}
                       disabled={isLoading}
                       className={`text-white px-6 py-3 rounded-full font-bold transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#E60023] hover:bg-[#ad081b]'}`}
                     >
                       {isLoading ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
               </div>
             </>
           ) : activeTab === 'appearance' ? (
             <>
               <h1 className="text-3xl font-semibold mb-2">Appearance</h1>
               <p className="text-gray-500 mb-8">Personalize the look of your home feed and interface</p>

               <div className="flex flex-col gap-8 max-w-[600px]">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Quick Preview</h2>
                    <p className="text-sm text-gray-600">Live sample that reflects your current settings.</p>
                    <div className={clsx("mt-4 grid grid-cols-3", previewGapClass)}>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`preview-${index}`}
                          className={clsx(
                            "relative bg-white border border-gray-200",
                            previewRadiusClass
                          )}
                          style={{ paddingBottom: '130%' }}
                        >
                          <div className="absolute inset-3 flex flex-col justify-between">
                            <div className="h-10 w-10 rounded-full bg-gray-200" />
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Pin</span>
                              <span className="font-semibold" style={{ color: 'var(--ui-accent)' }}>Save</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Density</p>
                        <p className="font-semibold text-gray-800">{settings.feedDensity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Corners</p>
                        <p className="font-semibold text-gray-800">{settings.cardRadius}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                     <h2 className="font-semibold text-lg mb-2">Color Mode</h2>
                     <p className="text-sm text-gray-600">Choose how the app looks on this device.</p>
                     <div className="flex flex-col gap-3 mt-4">
                       {colorModes.map((mode) => (
                         <button
                           key={mode.id}
                           onClick={() => handleColorModeChange(mode.id)}
                           className={clsx(
                             "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                             settings.colorMode === mode.id
                               ? "border-black bg-black text-white"
                               : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                           )}
                         >
                           <div>
                             <p className="text-sm font-semibold">{mode.label}</p>
                             <p className={clsx(
                               "text-xs",
                               settings.colorMode === mode.id ? "text-gray-200" : "text-gray-500"
                             )}>
                               {mode.description}
                             </p>
                           </div>
                           {settings.colorMode === mode.id && (
                             <span className="text-xs font-semibold">Selected</span>
                           )}
                         </button>
                       ))}
                     </div>
                     {settings.colorMode === 'system' && (
                       <p className="text-xs text-gray-500 mt-3">
                         System is currently set to {resolvedColorMode === 'dark' ? 'Dark' : 'Light'} mode.
                       </p>
                     )}
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                     <h2 className="font-semibold text-lg mb-2">Theme Accent</h2>
                     <p className="text-sm text-gray-600">Switch the accent color used for buttons and highlights.</p>
                     <div className="grid grid-cols-2 gap-3 mt-4">
                       {themeOptions.map((option) => (
                         <button
                           key={option.id}
                           onClick={() => handleThemeChange(option.id)}
                           className={clsx(
                             "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                             settings.themeStyle === option.id
                               ? "border-black bg-black text-white"
                               : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                           )}
                         >
                           <span className="flex gap-2">
                             {option.swatches.map((color) => (
                               <span
                                 key={`${option.id}-${color}`}
                                 className="h-4 w-4 rounded-full border border-white/70"
                                 style={{ backgroundColor: color }}
                               />
                             ))}
                           </span>
                           <span className="text-sm font-semibold">{option.label}</span>
                         </button>
                       ))}
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Feed Density</h2>
                    <p className="text-sm text-gray-600">Control spacing between pins for faster scanning or relaxed browsing.</p>
                    <div className="flex flex-col gap-3 mt-4">
                      {densityOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleDensityChange(option.id)}
                          className={clsx(
                            "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                            settings.feedDensity === option.id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className={clsx(
                              "text-xs",
                              settings.feedDensity === option.id ? "text-gray-200" : "text-gray-500"
                            )}>
                              {option.description}
                            </p>
                          </div>
                          {settings.feedDensity === option.id && (
                            <span className="text-xs font-semibold">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Card Corners</h2>
                    <p className="text-sm text-gray-600">Pick the rounding used on pins across the feed.</p>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {radiusOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleRadiusChange(option.id)}
                          className={clsx(
                            "flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors text-left",
                            settings.cardRadius === option.id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                          )}
                        >
                          <span className={clsx("h-10 w-10 border border-gray-200 bg-white", option.id === 'crisp' ? 'rounded-lg' : option.id === 'soft' ? 'rounded-xl' : 'rounded-2xl')} />
                          <span>
                            <span className="text-sm font-semibold block">{option.label}</span>
                            <span className={clsx(
                              "text-xs",
                              settings.cardRadius === option.id ? "text-gray-200" : "text-gray-500"
                            )}>
                              {option.description}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Pin Actions</h2>
                    <p className="text-sm text-gray-600">Decide when action buttons appear on each pin.</p>
                    <div className="flex flex-col gap-3 mt-4">
                      {actionOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleActionVisibilityChange(option.id)}
                          className={clsx(
                            "flex items-start justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors",
                            settings.actionVisibility === option.id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className={clsx(
                              "text-xs",
                              settings.actionVisibility === option.id ? "text-gray-200" : "text-gray-500"
                            )}>
                              {option.description}
                            </p>
                          </div>
                          {settings.actionVisibility === option.id && (
                            <span className="text-xs font-semibold">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Image Quality</h2>
                    <p className="text-sm text-gray-600">Choose image quality preference for loading and display.</p>
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
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className={clsx(
                              "text-xs",
                              settings.imageQuality === option.id ? "text-gray-200" : "text-gray-500"
                            )}>
                              {option.description}
                            </p>
                          </div>
                          {settings.imageQuality === option.id && (
                            <span className="text-xs font-semibold">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Border Style</h2>
                    <p className="text-sm text-gray-600">Customize how card borders appear.</p>
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
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className={clsx(
                              "text-xs",
                              settings.borderStyle === option.id ? "text-gray-200" : "text-gray-500"
                            )}>
                              {option.description}
                            </p>
                          </div>
                          {settings.borderStyle === option.id && (
                            <span className="text-xs font-semibold">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-2">Loading Experience</h2>
                    <p className="text-sm text-gray-600">Show placeholder skeletons while images load.</p>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Display Loading Skeletons</p>
                        <p className="text-xs text-gray-500 mt-1">Shows animated placeholders while content loads</p>
                      </div>
                      <button
                        onClick={() => handleLoadingSkeletonsChange(!settings.showLoadingSkeletons)}
                        className={clsx(
                          "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                          settings.showLoadingSkeletons
                            ? "bg-black"
                            : "bg-gray-300"
                        )}
                      >
                        <span
                          className={clsx(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                            settings.showLoadingSkeletons ? "translate-x-7" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                     <h2 className="font-semibold text-lg mb-2">Image Grid</h2>
                     <p className="text-sm text-gray-600">Control how many images are shown in each row.</p>
                     <div className="mt-4">
                       <label className="text-sm font-semibold text-gray-700 block mb-2">Columns</label>
                       <select
                         value={String(settings.gridColumns)}
                         onChange={(e) => handleGridChange(e.target.value)}
                         className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors bg-white"
                       >
                         {gridOptions.map((option) => (
                           <option key={String(option.value)} value={String(option.value)}>
                             {option.label}
                           </option>
                         ))}
                       </select>
                       <p className="text-xs text-gray-500 mt-2">Smaller screens will keep a safe minimum for readability.</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 bg-white">
                     <div>
                       <p className="font-semibold text-gray-800">Reset appearance</p>
                       <p className="text-sm text-gray-500">Restore default colors and layout settings.</p>
                     </div>
                     <button
                       onClick={resetSettings}
                       className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-full font-semibold transition-colors"
                     >
                       Reset
                     </button>
                  </div>
               </div>
             </>
           ) : (
             <div className="py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">{tabs.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-gray-500">This section is coming soon.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
