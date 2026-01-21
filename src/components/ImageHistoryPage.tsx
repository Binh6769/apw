import { useState, useEffect, useMemo } from 'react';
import { useImageHistory } from '../hooks/useImageHistory';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Trash2, Search, AlertCircle, Trash } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { Photo } from '../types';
import { useMediaColumns } from '../hooks/useMediaColumns';
import { useUiSettings } from '../hooks/useUiSettings';
import { useMasonry } from '../hooks/useMasonry';
import { PinCard } from './PinCard';
import clsx from 'clsx';
import { Header } from './Header';

export default function ImageHistoryPage() {
  const { history, historyCount, loading, searchHistory, deleteHistoryItem, clearAll, loadHistory } = useImageHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'hour' | 'day' | 'month'>('all');
  const [isClearing, setIsClearing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useUiSettings();
  const columnCount = useMediaColumns(settings.gridColumns);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  const densityGap = settings.feedDensity === 'compact' ? 'gap-2' : settings.feedDensity === 'spacious' ? 'gap-6' : 'gap-4';
  const densityPadding = settings.feedDensity === 'compact' ? 'py-3' : settings.feedDensity === 'spacious' ? 'py-6' : 'py-4';

  useEffect(() => {
    loadHistory(1000, 0); // Load all for filtering
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      searchHistory(query);
    } else {
      loadHistory(1000, 0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove from history?')) return;
    try {
      await deleteHistoryItem(id);
      showToast('Image removed from history', 'success');
    } catch (error) {
      console.error('Failed to delete history item:', error);
      showToast('Failed to delete from history', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear entire image history? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await clearAll();
      setSearchQuery('');
      setTimeFilter('all');
      showToast('Image history cleared', 'success');
    } catch (error) {
      console.error('Failed to clear history:', error);
      showToast('Failed to clear history', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearByTime = async () => {
    if (!selectedDate) return;
    if (!confirm(`Delete all images from this ${timeFilter}?`)) return;
    
    const date = new Date(selectedDate);
    const itemsToDelete = filteredHistory.filter(record => {
      const recordDate = new Date(record.viewed_at);
      
      switch (timeFilter) {
        case 'hour':
          return recordDate.getHours() === date.getHours() && 
                 recordDate.getDate() === date.getDate() &&
                 recordDate.getMonth() === date.getMonth() &&
                 recordDate.getFullYear() === date.getFullYear();
        case 'day':
          return recordDate.toDateString() === date.toDateString();
        case 'month':
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        default:
          return false;
      }
    });

    for (const item of itemsToDelete) {
      await deleteHistoryItem(item.id);
    }
    showToast(`Deleted ${itemsToDelete.length} images`, 'success');
    setSelectedDate('');
  };

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    
    if (timeFilter === 'all' || !selectedDate) return history;

    const date = new Date(selectedDate);
    return history.filter(record => {
      const recordDate = new Date(record.viewed_at);
      
      switch (timeFilter) {
        case 'hour':
          return recordDate.getHours() === date.getHours() && 
                 recordDate.getDate() === date.getDate() &&
                 recordDate.getMonth() === date.getMonth() &&
                 recordDate.getFullYear() === date.getFullYear();
        case 'day':
          return recordDate.toDateString() === date.toDateString();
        case 'month':
          return recordDate.getMonth() === date.getMonth() && 
                 recordDate.getFullYear() === date.getFullYear();
        default:
          return true;
      }
    });
  }, [history, timeFilter, selectedDate]);

  // Convert history records to Photo objects for display
  const photoObjects: Photo[] = useMemo(() => {
    return filteredHistory.map(record => ({
      id: record.id,
      urls: { 
        regular: record.image_url, 
        raw: record.image_url,
        full: record.image_url,
        small: record.image_url,
        thumb: record.image_url
      },
      alt_description: record.image_title || '',
      width: record.image_width || 400,
      height: record.image_height || 600,
      color: '#e5e7eb',
      user: { 
        name: record.source,
        username: record.source,
        profile_image: { small: '', medium: '', large: '' }
      },
      likes: 0,
      description: `Viewed ${formatDateShort(record.viewed_at)}`
    } as unknown as Photo));
  }, [filteredHistory]);

  useEffect(() => {
    if (loadedIds.size === 0) return;
    const next = new Set<string>();
    for (const photo of photoObjects) {
      if (loadedIds.has(photo.id)) {
        next.add(photo.id);
      }
    }
    if (next.size !== loadedIds.size) {
      setLoadedIds(next);
    }
  }, [photoObjects, loadedIds]);

  const columns = useMasonry(photoObjects.filter(p => loadedIds.has(p.id)), columnCount);

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-8">
      <Header />
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Image History</h1>
          </div>
          <p className="text-gray-600">
            View all the images you've explored. Search, filter by time, and manage your viewing history.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            {/* Time Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'hour', 'day', 'month'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setTimeFilter(filter);
                    setSelectedDate('');
                  }}
                  className={clsx(
                    "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                    timeFilter === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {filter === 'all' ? 'All Time' : `By ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
                </button>
              ))}
            </div>

            {/* Date Selector for Deletion */}
            {timeFilter !== 'all' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedDate && (
                  <button
                    onClick={handleClearByTime}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Trash className="w-4 h-4" />
                    Delete {timeFilter}
                  </button>
                )}
              </div>
            )}

            {/* Stats */}
            {filteredHistory.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredHistory.length}</span> of <span className="font-semibold text-gray-900">{historyCount}</span> images
              </div>
            )}
          </div>

          {/* Clear All Button */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleClearAll}
              disabled={isClearing || filteredHistory.length === 0}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm",
                isClearing || filteredHistory.length === 0
                  ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="max-w-4xl mx-auto text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchQuery ? 'No images found matching your search.' : 'No image history yet. Start viewing images to build your history!'}
              </p>
            </div>
          ) : (
            <div className={clsx("flex justify-center px-2 md:px-4 w-full max-w-[2000px] mx-auto", densityGap, densityPadding)}>
              {columns.map((col, colIndex) => (
                <div key={colIndex} className={clsx("flex flex-col flex-1 min-w-0", densityGap)}>
                  {col.map((photo) => (
                    <PinCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => {
                        navigate(`/pin/${photo.id}`, { 
                          state: { background: location, photo } 
                        });
                      }}
                      onDelete={() => handleDelete(photo.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

