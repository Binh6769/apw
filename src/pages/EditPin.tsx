import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { fetchPinById, updatePin, deletePin } from '../services/pinsService';
import { uploadImage, deleteImage } from '../services/storageService';
import { fetchAllCategories, createCategory, type Category } from '../services/categoriesService';
import { X, Loader2, Trash2, Save, Plus, Check, Camera, ArrowUpCircle } from 'lucide-react';
import type { Photo } from '../types';

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ALT_TEXT_LENGTH = 500;

export function EditPin() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [altText, setAltText] = useState('');
  const [link, setLink] = useState('');

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadPin = async () => {
      setLoading(true);
      const [pin, categories] = await Promise.all([
        fetchPinById(id),
        fetchAllCategories(),
      ]);
      setAllCategories(categories);
      if (pin) {
        setPhoto(pin);
        setTitle(pin.alt_description || '');
        setDescription(pin.description || '');
        setAltText(pin.alt_description || '');
        setLink(pin.source_url || '');

        // Map existing tag names to category IDs
        const tagNames = (pin.tags || []).map(t => t.toLowerCase());
        const matchedIds = categories
          .filter(c => tagNames.includes(c.name.toLowerCase()))
          .map(c => c.id);
        setSelectedCategoryIds(matchedIds);
      } else {
        showToast('Pin not found', 'error');
        navigate('/profile');
      }
      setLoading(false);
    };
    loadPin();
  }, [id]);

  const isOwner = photo?.user?.username === user?.id;

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
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]?.type.startsWith('image/')) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!id || !isOwner) return;
    setSaving(true);
    try {
      let imageUrl = photo?.urls?.full || '';
      let imageWidth = 0;
      let imageHeight = 0;

      if (newImageFile) {
        if (!user) throw new Error('Not authenticated');
        const uploadedUrl = await uploadImage(newImageFile, user.id);
        if (!uploadedUrl) {
          showToast('Failed to upload new image', 'error');
          setSaving(false);
          return;
        }
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => { imageWidth = img.width; imageHeight = img.height; resolve(); };
          img.onerror = reject;
          img.src = URL.createObjectURL(newImageFile);
        });
        if (photo?.urls?.full) {
          await deleteImage(photo.urls.full).catch(() => {});
        }
        imageUrl = uploadedUrl;
      }

      const result = await updatePin(id, {
        title,
        description,
        altDescription: altText,
        sourceUrl: link,
        categoryIds: selectedCategoryIds,
        imageUrl: imageUrl || undefined,
        imageWidth: imageWidth || undefined,
        imageHeight: imageHeight || undefined,
      });

      if (result) {
        showToast('Pin updated successfully!', 'success');
        navigate(`/pin/${id}`);
      } else {
        showToast('Failed to update pin', 'error');
      }
    } catch (error) {
      console.error('Error updating pin:', error);
      showToast('Failed to update pin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !isOwner) return;
    if (!confirm('Are you sure you want to delete this pin? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const success = await deletePin(id);
      if (success) {
        showToast('Pin deleted successfully', 'success');
        navigate('/profile');
      } else {
        showToast('Failed to delete pin', 'error');
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      showToast('Failed to delete pin', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const handleAddCustomCategory = async () => {
    if (!customCategory.trim()) return;
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-anime-primary" size={32} />
      </div>
    );
  }

  if (!photo || !isOwner) {
    return (
      <div className="min-h-screen bg-anime-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-anime-text mb-4">You don't have permission to edit this pin.</p>
          <button onClick={() => navigate('/profile')} className="text-anime-primary underline">
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  const displayImage = newImagePreview || photo.urls.regular;

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
      <Header />
      <div className="flex justify-center py-6 px-4">
        <div className="bg-anime-surface border border-anime-border rounded-[32px] w-full max-w-[1016px] min-h-[600px] p-6 md:p-10 shadow-sm flex flex-col lg:flex-row gap-8">

          {/* Left Column - Image Preview */}
          <div className="w-full lg:w-[45%]">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative bg-anime-bg rounded-[24px] overflow-hidden border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[300px] md:min-h-[450px] flex items-center justify-center
                ${newImageFile ? 'border-anime-primary' : isDragging ? 'border-anime-primary bg-anime-primary/10' : 'border-transparent group hover:border-anime-primary/50'}
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
              />

              <img
                src={displayImage}
                alt={title}
                className="w-full h-full absolute inset-0 object-contain"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                  <div className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <Camera size={24} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                    {newImageFile ? 'Change photo' : 'Click to replace'}
                  </span>
                </div>
              </div>

              {/* Drag indicator */}
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-anime-primary/20">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUpCircle size={40} className="text-anime-primary animate-bounce" />
                    <span className="text-anime-primary font-semibold">Drop image to replace</span>
                  </div>
                </div>
              )}

              {/* File info badge */}
              {newImageFile && (
                <div className="absolute top-3 left-3 bg-anime-primary/90 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
                  <Check size={12} />
                  New photo selected
                </div>
              )}

              {/* Dimensions badge */}
              {photo && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-gray-300 text-xs px-2 py-1 rounded-md">
                  {photo.width} × {photo.height}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Edit Fields */}
          <div className="flex-1 flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-anime-border">
              <h1 className="text-xl font-bold">Edit Pin</h1>
              <button onClick={() => navigate(`/pin/${id}`)} className="p-2 hover:bg-anime-surface-muted rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Title */}
            <div className="relative">
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="Add your title"
                className="w-full bg-transparent text-anime-text text-2xl font-bold placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors pr-16"
              />
              <span className={`absolute right-0 bottom-2 text-xs ${title.length >= MAX_TITLE_LENGTH ? 'text-red-400' : title.length > 80 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>

            {/* Description */}
            <div className="relative">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder="Tell everyone what your Pin is about"
                className="w-full bg-transparent text-anime-text h-20 resize-none placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors"
              />
              <span className={`absolute right-0 bottom-2 text-xs ${description.length >= MAX_DESCRIPTION_LENGTH ? 'text-red-400' : description.length > 400 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>

            {/* Alt Text */}
            <div className="relative">
              <label className="block text-sm text-gray-400 mb-1">Alt Text (for accessibility)</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value.slice(0, MAX_ALT_TEXT_LENGTH))}
                maxLength={MAX_ALT_TEXT_LENGTH}
                placeholder="Describe your image for screen readers"
                className="w-full bg-transparent text-anime-text placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors"
              />
              <span className={`absolute right-0 bottom-2 text-xs ${altText.length >= MAX_ALT_TEXT_LENGTH ? 'text-red-400' : altText.length > 400 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {altText.length}/{MAX_ALT_TEXT_LENGTH}
              </span>
            </div>

            {/* Destination Link */}
            <div className="relative">
              <label className="block text-sm text-gray-400 mb-1">Destination Link</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                className="w-full bg-transparent text-anime-text placeholder-gray-500 border-b-2 border-anime-border py-2 focus:outline-none focus:border-anime-primary transition-colors"
              />
            </div>

            {/* Categories - Tag Chips */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Categories</label>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="text-xs text-anime-primary hover:text-anime-secondary transition-colors"
                >
                  {showCategoryPicker ? 'Done' : selectedCategoryIds.length > 0 ? 'Edit' : 'Add'}
                </button>
              </div>

              {/* Selected Category Chips */}
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

              {/* Category Picker */}
              {showCategoryPicker && (
                <div className="border-2 border-anime-border rounded-xl p-3 bg-anime-bg animate-in fade-in">
                  {/* Unselected categories grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {allCategories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
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

                  {/* Custom category input */}
                  {showCustomInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter new category..."
                        className="flex-1 bg-anime-surface text-anime-text border border-anime-border rounded-lg px-3 py-2 focus:outline-none focus:border-anime-primary placeholder-gray-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomCategory();
                        }}
                      />
                      <button
                        onClick={() => { setShowCustomInput(false); setCustomCategory(''); }}
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

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-anime-border mt-auto">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => navigate(`/pin/${id}`)}
                className="px-4 py-2 bg-anime-surface hover:bg-anime-surface-muted text-anime-text rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-anime-primary hover:bg-anime-secondary text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
