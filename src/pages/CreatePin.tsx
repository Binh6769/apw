import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, X, Loader2, Link2, FileText, Tag, Info, CheckCircle, AlertCircle, Maximize2, Plus, Check } from 'lucide-react';
import { uploadImageFromDataUrl } from '../services/storageService';
import { createPin as createPinService } from '../services/pinsService';
import { fetchAllCategories, createCategory, type Category } from '../services/categoriesService';
import { getUserProfile, type UserProfile } from '../services/userProfileService';

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ALT_TEXT_LENGTH = 500;

export function CreatePin() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [altText, setAltText] = useState('');
  const [link, setLink] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveredPreview, setIsHoveredPreview] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const [profile, categories] = await Promise.all([
        getUserProfile(user.id),
        fetchAllCategories(),
      ]);
      setUserProfile(profile);
      setAllCategories(categories);
    };
    loadData();
  }, [user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      showToast('File size must be less than 20MB', 'error');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload JPG, PNG, GIF, or WebP files only', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedFile(result);

      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
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
      const imageUrl = await uploadImageFromDataUrl(selectedFile, user.id);

      if (!imageUrl) {
        showToast('Failed to upload image', 'error');
        setIsLoading(false);
        return;
      }

      const img = new window.Image();
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

          const categoryNames = selectedCategoryIds
            .map(id => allCategories.find(c => c.id === id)?.name)
            .filter(Boolean) as string[];
          const finalCategory = categoryNames.length > 0 ? categoryNames.join(', ') : undefined;
          const newPin = await createPinService(
            title,
            imageUrl,
            imageDimensions.width,
            imageDimensions.height,
            description || undefined,
            finalCategory || undefined,
            color,
            link || undefined,
            selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter' && title.trim() && selectedFile && !isLoading) {
      handlePublish();
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

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getQualityMessage = () => {
    if (!imageDimensions) return null;
    const { width, height } = imageDimensions;
    const aspectRatio = height / width;
    
    if (aspectRatio >= 1.3 && aspectRatio <= 1.7 && width >= 800) {
      return { text: 'Perfect 2:3 ratio!', color: 'text-green-400', ratio: '2:3' };
    }
    if (aspectRatio >= 1.2 && aspectRatio <= 2 && width >= 500) {
      return { text: 'Good dimensions', color: 'text-yellow-400', ratio: calculateRatio(width, height) };
    }
    return { text: 'Try 2:3 ratio (1000×1500px)', color: 'text-orange-400', ratio: calculateRatio(width, height) };
  };

  const calculateRatio = (w: number, h: number): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(Math.round(w), Math.round(h));
    return `${Math.round(w) / divisor}:${Math.round(h) / divisor}`;
  };

  const qualityMessage = getQualityMessage();

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20" onKeyDown={handleKeyDown}>
      <Header />
      <div className="flex justify-center py-6 px-4">
        <div className="bg-anime-surface border border-anime-border rounded-[32px] w-full max-w-[1016px] min-h-[600px] p-6 md:p-10 shadow-sm flex flex-col lg:flex-row gap-8">

          {/* Left: Image Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseEnter={() => selectedFile && setIsHoveredPreview(true)}
            onMouseLeave={() => setIsHoveredPreview(false)}
            className={`w-full lg:w-[45%] bg-anime-bg rounded-[24px] relative border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[280px] md:min-h-[400px] overflow-hidden select-none
              ${selectedFile ? 'border-transparent' : isDragging ? 'border-anime-primary bg-anime-primary/10 scale-[1.02]' : 'border-anime-border hover:border-anime-primary hover:bg-anime-surface'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <>
                <div 
                  ref={imagePreviewRef}
                  className="relative w-full h-full group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(true);
                  }}
                >
                  <img 
                    src={selectedFile} 
                    alt="Preview" 
                    className="w-full h-full object-contain" 
                  />
                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-4 transition-opacity ${isHoveredPreview ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                      <Maximize2 size={20} className="text-white" />
                    </button>
                    <button 
                      onClick={clearFile}
                      className="p-3 bg-white/20 hover:bg-red-500/80 rounded-full transition-colors"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                </div>
                
                {/* Dimension & Quality Info */}
                {imageDimensions && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="bg-black/70 px-2 py-1 rounded-md text-gray-300">
                      {imageDimensions.width} × {imageDimensions.height}
                    </span>
                    {qualityMessage && (
                      <div className="flex items-center gap-2">
                        <span className="bg-anime-primary/80 px-2 py-1 rounded-md font-medium text-white">
                          {qualityMessage.ratio}
                        </span>
                        <span className={`bg-black/70 px-2 py-1 rounded-md font-medium ${qualityMessage.color}`}>
                          {qualityMessage.text}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4 text-gray-400 pointer-events-none">
                  <div className="relative">
                    <ArrowUpCircle size={48} className={isDragging ? 'text-anime-primary animate-bounce' : ''} />
                    {isDragging && (
                      <div className="absolute inset-0 animate-ping rounded-full bg-anime-primary/30"></div>
                    )}
                  </div>
                  
                  {/* File Type Badges */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                    {['JPG', 'PNG', 'GIF', 'WebP'].map((type) => (
                      <span key={type} className="px-2 py-0.5 bg-anime-surface rounded text-xs font-medium text-gray-400">
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-300">
                    {isDragging ? 'Drop your image here' : 'Choose a file or drag and drop'}
                  </p>
                </div>
                
                <p className="absolute bottom-4 text-xs text-gray-500 px-8 text-center">
                  Recommended: 1000×1500px (2:3 ratio) • Max 20MB
                </p>
              </>
            )}
          </div>

          {/* Right: Input Fields */}
          <div className="flex-1 flex flex-col gap-5" onKeyDown={handleKeyDown}>
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2">
              <div className="flex items-center gap-2">
                <div className="text-anime-secondary opacity-80 text-sm font-semibold flex items-center gap-1">
                  <Info size={14} />
                  {isLoading ? 'Uploading...' : 'Draft • Ctrl+Enter to publish'}
                </div>
              </div>
              <button
                onClick={handlePublish}
                disabled={isLoading || !title.trim()}
                className={`text-white font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${
                  (title.trim() && selectedFile && !isLoading) 
                    ? 'bg-anime-primary hover:bg-anime-secondary hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                    : 'bg-anime-border cursor-not-allowed text-gray-400'
                }`}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Publish
              </button>
            </div>

            {/* Title Field */}
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="Add your title"
                maxLength={MAX_TITLE_LENGTH}
                className="bg-transparent text-anime-text text-3xl md:text-4xl font-bold placeholder-gray-500 border-b-2 border-anime-border/py-2 focus:outline-none focus:border-anime-primary transition-colors w-full pr-16"
              />
              <span className={`absolute right-0 top-3 text-xs ${title.length >= MAX_TITLE_LENGTH ? 'text-red-400' : title.length > 80 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
              {title.length > 0 && title.length < 20 && (
                <p className="text-xs text-gray-500 mt-1">Tip: Front-load important keywords</p>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 py-2">
              {user && (
                <>
                  <img 
                    src={userProfile?.avatar_url || user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} 
                    alt={user.email} 
                    className="w-10 h-10 rounded-full bg-anime-surface-muted border border-anime-border" 
                  />
                  <span className="font-semibold text-anime-text">{user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}</span>
                </>
              )}
            </div>

            {/* Description Field */}
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                placeholder="Tell everyone what your Pin is about"
                maxLength={MAX_DESCRIPTION_LENGTH}
                className="bg-transparent text-anime-text w-full h-20 resize-none placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors"
              />
              <span className={`absolute right-0 bottom-2 text-xs ${description.length >= MAX_DESCRIPTION_LENGTH ? 'text-red-400' : description.length > 400 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
              {description.length > 0 && description.length < 50 && (
                <p className="text-xs text-gray-500 mt-1">Tip: First 220 chars shown in feeds</p>
              )}
            </div>

            {/* Alt Text Field */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Alt text (accessibility + SEO)</span>
              </div>
              <textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value.slice(0, MAX_ALT_TEXT_LENGTH))}
                placeholder="Describe your image for screen readers"
                maxLength={MAX_ALT_TEXT_LENGTH}
                className="bg-transparent text-anime-text w-full h-14 resize-none placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors"
              />
              <span className={`absolute right-0 bottom-2 text-xs ${altText.length >= MAX_ALT_TEXT_LENGTH ? 'text-red-400' : altText.length > 400 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {altText.length}/{MAX_ALT_TEXT_LENGTH}
              </span>
            </div>

            {/* Link Field */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Link2 size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Destination link</span>
              </div>
              <div className="flex items-center border-b-2 border-anime-border focus-within:border-anime-primary transition-colors">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://"
                  className="bg-transparent text-anime-text flex-1 py-2 focus:outline-none placeholder-gray-500"
                />
                {link && !isValidUrl(link) && (
                  <AlertCircle size={16} className="text-red-400" />
                )}
                {link && isValidUrl(link) && (
                  <CheckCircle size={16} className="text-green-400" />
                )}
              </div>
            </div>

            {/* Category Section - Multi-select */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Categories (optional)</span>
                </div>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="text-xs text-anime-primary hover:text-anime-secondary transition-colors"
                >
                  {showCategoryPicker ? 'Done' : selectedCategoryIds.length > 0 ? 'Edit' : 'Add'}
                </button>
              </div>
              
              {/* Selected Categories Tags */}
              {selectedCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCategoryIds.map((catId) => {
                    const cat = allCategories.find(c => c.id === catId);
                    if (!cat) return null;
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-anime-primary/20 text-anime-primary rounded-full text-sm"
                      >
                        {cat.name}
                        <button
                          onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Category Picker Modal */}
              {showCategoryPicker && (
                <div className="border-2 border-anime-border rounded-xl p-3 bg-anime-bg animate-in fade-in">
                  {/* All Categories Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {allCategories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                            } else {
                              setSelectedCategoryIds(prev => [...prev, cat.id]);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'bg-anime-primary text-white'
                              : 'bg-anime-surface hover:bg-anime-surface-muted text-anime-text'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom Category Input */}
                  {showCustomInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter new category..."
                        className="flex-1 bg-anime-surface text-anime-text border border-anime-border rounded-lg px-3 py-2 focus:outline-none focus:border-anime-primary placeholder-gray-500 text-sm"
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && customCategory.trim()) {
                            const existing = allCategories.find(c => c.name.toLowerCase() === customCategory.trim().toLowerCase());
                            if (existing) {
                              if (!selectedCategoryIds.includes(existing.id)) {
                                setSelectedCategoryIds(prev => [...prev, existing.id]);
                              }
                            } else {
                              const created = await createCategory(customCategory.trim());
                              if (created) {
                                setAllCategories(prev => [...prev, created]);
                                setSelectedCategoryIds(prev => [...prev, created.id]);
                              }
                            }
                            setCustomCategory('');
                            setShowCustomInput(false);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomCategory('');
                        }}
                        className="text-xs text-gray-400 hover:text-anime-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-anime-surface hover:bg-anime-surface-muted rounded-lg text-sm text-gray-400 transition-colors"
                    >
                      <Plus size={14} /> Add new category
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <X size={24} className="text-white" />
          </button>
          <img 
            src={selectedFile} 
            alt="Full preview" 
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}