import { useState, useEffect } from 'react';
import { useSavedPins } from '../hooks/useSavedPins';
import { useCreatedPins } from '../hooks/useCreatedPins';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, type UserProfile } from '../services/userProfileService';
import { MasonryGrid } from '../components/MasonryGrid';
import { Header } from '../components/Header';
import { AvatarSelector } from '../components/AvatarSelector';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { Photo } from '../types';

export function Profile() {
  const { savedPins, loading: savedLoading } = useSavedPins();
  const { createdPins, loading: createdLoading, removePin } = useCreatedPins();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'saved' | 'created'>('saved');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Load user profile from Supabase
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const pinsToDisplay = activeTab === 'saved' ? savedPins : createdPins;
  const fullName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : user?.user_metadata?.first_name || user?.email || 'User';

  const handlePinClick = (photo: Photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  };

  const handleCreatedDelete = async (photo: Photo) => {
    const confirmed = window.confirm('Delete this pin and its image? This cannot be undone.');
    if (!confirmed) return;
    try {
      const deleted = await removePin(photo);
      if (deleted) {
        showToast('Pin deleted', 'success');
      } else {
        showToast('Failed to delete pin', 'error');
      }
    } catch (error) {
      console.error('Failed to delete pin', error);
      showToast('Failed to delete pin', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <Header />
      
      <div className="flex flex-col items-center pt-8 pb-8">
        <div className="relative w-32 h-32 mb-4 group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
             <img 
               src={userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.id} 
               alt={fullName} 
               className="w-full h-full object-cover" 
             />
          </div>
          <button
            onClick={() => setShowAvatarSelector(true)}
            className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-gray-800"
            title="Change avatar"
          >
            <Camera size={18} />
          </button>
        </div>
        <h1 className="text-3xl font-semibold mb-2">{fullName}</h1>
        <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
        {userProfile?.bio && <p className="text-gray-600 text-sm mb-6 max-w-md text-center">{userProfile.bio}</p>}
        
        <div className="flex gap-2 mb-8">
           <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full font-semibold transition-colors">Share</button>
           <button 
             onClick={() => navigate('/settings')}
             className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full font-semibold transition-colors"
           >
             Edit Profile
           </button>
        </div>

        <div className="flex gap-8 border-b-2 border-transparent relative">
           <div 
             onClick={() => setActiveTab('created')}
             className={clsx(
               "pb-2 font-semibold cursor-pointer transition-colors border-b-4",
               activeTab === 'created' ? "border-black" : "border-transparent text-gray-500 hover:text-black"
             )}
           >
             Created ({createdPins.length})
           </div>
           <div 
             onClick={() => setActiveTab('saved')}
             className={clsx(
               "pb-2 font-semibold cursor-pointer transition-colors border-b-4",
               activeTab === 'saved' ? "border-black" : "border-transparent text-gray-500 hover:text-black"
             )}
           >
             Saved ({savedPins.length})
           </div>
        </div>
      </div>

      <div className="container mx-auto">
        <div className="px-4 py-4">
          <h2 className="text-2xl md:text-3xl font-semibold">
            {activeTab === 'saved' ? 'Saved Pins' : 'Created Pins'}
          </h2>
          <p className="text-gray-600">
            {pinsToDisplay.length} pin{pinsToDisplay.length !== 1 ? 's' : ''} in this view
          </p>
        </div>

        {createdLoading || savedLoading || profileLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : pinsToDisplay.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === 'saved' ? "You haven't saved any Pins yet" : "You haven't created any Pins yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'saved' 
                ? "Find ideas from things you love and save them to your profile." 
                : "Create your first Pin to share your ideas with the world."}
            </p>
            <button 
              onClick={() => activeTab === 'saved' ? navigate('/') : navigate('/create-pin')}
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              type="button"
            >
              {activeTab === 'saved' ? "Browse Pins" : "Create Pin"}
            </button>
          </div>
        ) : (
          <MasonryGrid 
            photos={pinsToDisplay} 
            onPinClick={handlePinClick}
            onPinDelete={activeTab === 'created' ? handleCreatedDelete : undefined}
          />
        )}
      </div>

      {showAvatarSelector && user && (
        <AvatarSelector
          userId={user.id}
          currentAvatarUrl={userProfile?.avatar_url ?? undefined}
          onAvatarChange={(url) => {
            if (userProfile) {
              setUserProfile({ ...userProfile, avatar_url: url });
            }
          }}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}
