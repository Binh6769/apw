import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { updateUserProfile } from '../services/userProfileService';

interface AvatarOption {
  id: string;
  name: string;
  url: string;
  category: 'avatar' | 'dicebear' | 'upload';
}

interface AvatarSelectorProps {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarChange?: (url: string) => void;
  onClose?: () => void;
}

const DICEBEAR_STYLES = [
  'avataaars',
  'pixel-art',
  'adventurer',
  'big-ears',
  'croodles',
  'initials',
];

const AVATAR_SOURCES = [
  {
    id: 'ui-avatars',
    name: 'UI Avatars',
    url: 'https://ui-avatars.com/api/?name={{name}}&background=random',
  },
  {
    id: 'gravatar',
    name: 'Gravatar Style',
    url: 'https://www.gravatar.com/avatar/{{email}}?d=identicon',
  },
];

export function AvatarSelector({
  userId,
  currentAvatarUrl,
  onAvatarChange,
  onClose,
}: AvatarSelectorProps) {
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'dicebear' | 'upload'>('preset');

  useEffect(() => {
    generateAvatarOptions();
  }, [userId]);

  const generateAvatarOptions = () => {
    const options: AvatarOption[] = [];

    // DiceBear avatars
    DICEBEAR_STYLES.forEach((style) => {
      options.push({
        id: `dicebear-${style}`,
        name: style.replace('-', ' '),
        url: `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}`,
        category: 'dicebear',
      });
    });

    // Preset sources
    AVATAR_SOURCES.forEach((source) => {
      options.push({
        id: source.id,
        name: source.name,
        url: source.url.replace('{{email}}', 'user@example.com').replace('{{name}}', 'User'),
        category: 'avatar',
      });
    });

    setAvatarOptions(options);
  };

  const handleSelectAvatar = async (url: string) => {
    setSelectedAvatar(url);
    setLoading(true);

    try {
      const result = await updateUserProfile(userId, {
        avatar_url: url,
      });

      if (result) {
        onAvatarChange?.(url);
        setTimeout(() => {
          onClose?.();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        await handleSelectAvatar(data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('dicebear')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'dicebear'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Generated (DiceBear)
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'preset'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Preset Sources
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* DiceBear Avatars */}
          {activeTab === 'dicebear' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Choose from generated avatar styles based on your user ID
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {avatarOptions
                  .filter((opt) => opt.category === 'dicebear')
                  .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAvatar(option.url)}
                      disabled={loading}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                        selectedAvatar === option.url
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={option.url}
                          alt={option.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs text-center text-gray-600 truncate w-full">
                        {option.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Preset Sources */}
          {activeTab === 'preset' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Choose from popular avatar generator services
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {avatarOptions
                  .filter((opt) => opt.category === 'avatar')
                  .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAvatar(option.url)}
                      disabled={loading}
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg transition-all ${
                        selectedAvatar === option.url
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50 border border-gray-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                        <img
                          src={option.url}
                          alt={option.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-center">{option.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Upload */}
          {activeTab === 'upload' && (
            <div>
              <p className="text-sm text-gray-600 mb-6">
                Upload your own avatar image (JPG, PNG, GIF)
              </p>
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={32} className="text-gray-400" />
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">Click to upload</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingFile || loading}
                    className="hidden"
                  />
                </div>
              </label>

              {currentAvatarUrl && currentAvatarUrl.includes('avatars/') && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Current Avatar</p>
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={currentAvatarUrl}
                      alt="Current"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {(loading || uploadingFile) && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">
                {uploadingFile ? 'Uploading...' : 'Saving...'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
