import { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, X, Loader2 } from 'lucide-react';
import { uploadImageFromDataUrl } from '../services/storageService';
import { createPin as createPinService } from '../services/pinsService';
import { getUserProfile, type UserProfile } from '../services/userProfileService';

export function CreatePin() {
  const { showToast } = useToast();
  // const { addPin } = useCreatedPins(); // Unused variable
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
    };
    loadProfile();
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showToast('File size must be less than 20MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedFile(result);
        
        // Get dimensions
        const img = new Image();
        img.onload = () => {
           setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Please add a title', 'error');
      return;
    }
    if (!selectedFile || !imageDimensions) {
        showToast('Please upload an image', 'error'); 
        return;
    }
    if (!user) {
      showToast('You must be logged in to create a pin', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Upload image to Supabase storage
      const imageUrl = await uploadImageFromDataUrl(selectedFile, user.id);
      
      if (!imageUrl) {
        showToast('Failed to upload image', 'error');
        setIsLoading(false);
        return;
      }

      // Extract dominant color from image (simple approach)
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1);
          const [r, g, b] = imageData.data;
          const color = `rgb(${r}, ${g}, ${b})`;

          // Create pin in Supabase
          const newPin = await createPinService(
            title,
            imageUrl,
            imageDimensions.width,
            imageDimensions.height,
            description || undefined,
            undefined, // category
            color,
            link || undefined
          );

          if (newPin) {
            showToast('Pin created successfully!', 'success');
            setTimeout(() => navigate('/profile'), 500);
          } else {
            showToast('Failed to create pin', 'error');
            setIsLoading(false);
          }
        }
      };
      img.src = selectedFile;
    } catch (error) {
      console.error('Error creating pin:', error);
      showToast('Failed to create pin', 'error');
      setIsLoading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
       fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0F5] pt-20">
      <Header />
      <div className="flex justify-center py-8 px-4">
        <div className="bg-white rounded-[32px] w-full max-w-[880px] min-h-[500px] p-10 shadow-sm flex flex-col md:flex-row gap-10">
          
          {/* Left: Image Upload Area */}
          <div 
             onClick={() => fileInputRef.current?.click()}
             className={`w-full md:w-[40%] bg-[#E9E9E9] rounded-[24px] relative border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] overflow-hidden ${selectedFile ? 'border-transparent p-0' : 'border-gray-300 hover:border-gray-400 p-8'}`}
          >
             <input 
               type="file" 
               ref={fileInputRef}
               className="hidden" 
               accept="image/jpeg,image/png,image/gif,image/webp"
               onChange={handleFileChange}
             />
             
             {selectedFile ? (
                 <div className="relative w-full h-full group">
                     <img src={selectedFile} alt="Preview" className="w-full h-full object-cover" />
                     <button 
                       onClick={clearFile}
                       className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <X size={20} />
                     </button>
                 </div>
             ) : (
                 <>
                    <div className="flex flex-col items-center gap-4 text-gray-500">
                        <ArrowUpCircle size={40} />
                        <p>Choose a file or drag and drop it here</p>
                    </div>
                    <p className="absolute bottom-4 text-xs text-gray-400 px-8 text-center">
                        We recommend using high quality .jpg files less than 20MB.
                    </p>
                 </>
             )}
          </div>

          {/* Right: Input Fields */}
          <div className="flex-1 flex flex-col gap-6">
             <div className="flex justify-between items-center mb-4">
                <div className="text-gray-400 text-sm font-semibold">
                  {isLoading ? 'Uploading...' : 'Draft saved'}
                </div>
                <button 
                  onClick={handlePublish}
                  disabled={isLoading || !title.trim()}
                  className={`text-white font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${(title.trim() && !isLoading) ? 'bg-[#E60023] hover:bg-[#ad081b]' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  Publish
                </button>
             </div>

             <input 
               type="text" 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Add your title" 
               className="text-4xl font-bold placeholder-gray-400 border-b border-gray-200 py-2 focus:outline-none focus:border-blue-500 transition-colors"
             />

             <div className="flex items-center gap-3 py-4">
                {user && (
                  <>
                    <img src={userProfile?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} alt={user.email} className="w-10 h-10 rounded-full bg-gray-100" />
                    <span className="font-semibold">{user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}</span>
                  </>
                )}
             </div>

             <textarea 
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Tell everyone what your Pin is about" 
               className="w-full h-24 resize-none placeholder-gray-400 border-b border-gray-200 py-2 focus:outline-none focus:border-blue-500 transition-colors"
             />

             <input 
               type="text" 
               value={link}
               onChange={(e) => setLink(e.target.value)}
               placeholder="Add a destination link" 
               className="placeholder-gray-400 border-b border-gray-200 py-2 focus:outline-none focus:border-blue-500 transition-colors"
             />
          </div>

        </div>
      </div>
    </div>
  );
}
