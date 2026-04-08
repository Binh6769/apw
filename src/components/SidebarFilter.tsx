import { useState, useMemo } from 'react';
import { Filter, X, Search } from 'lucide-react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';

interface SidebarFilterProps {
  isOpen: boolean;
  onToggle: () => void;
  availableTags: string[];
}

export function SidebarFilter({ isOpen, onToggle, availableTags }: SidebarFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState('');

  // Extract separated tags from current URL query
  const queryTags = useMemo(() => {
    return currentQuery.split(' ').map(t => t.toLowerCase()).filter(Boolean);
  }, [currentQuery]);

  const handleTagClick = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    let newTags = [...queryTags];
    
    if (newTags.includes(lowerTag)) {
      newTags = newTags.filter(t => t !== lowerTag);
    } else {
      newTags.push(lowerTag);
    }
    
    if (newTags.length > 0) {
      searchParams.set('q', newTags.join(' '));
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
  };

  const filteredTags = useMemo(() => {
    if (!searchTerm) return availableTags;
    return availableTags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableTags, searchTerm]);

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button 
          onClick={onToggle}
          className="fixed bottom-6 left-6 z-40 bg-anime-primary text-white p-3 rounded-full shadow-lg md:hidden"
        >
          <Filter size={24} />
        </button>
      )}

      {/* Sidebar Container */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-30 pt-20 w-64 bg-anime-bg border-r border-anime-border transform transition-transform duration-300 ease-in-out flex flex-col md:translate-x-0 md:sticky md:top-20 md:h-[calc(100vh-5rem)]",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "shadow-[5px_0_15px_rgba(0,0,0,0.3)] md:shadow-none"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-anime-border/50">
          <h2 className="text-lg font-bold text-anime-text flex items-center gap-2">
            <Filter size={18} className="text-anime-primary" />
            Discover Tags
          </h2>
          <button onClick={onToggle} className="md:hidden text-anime-muted hover:text-anime-text bg-anime-surface-muted p-1 rounded-md">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-anime-border/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-anime-muted" />
            <input
              type="text"
              placeholder="Search tags or titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('q', searchTerm.trim());
                  setSearchParams(newParams);
                }
              }}
              className="w-full bg-anime-surface-strong text-anime-text pl-9 pr-3 py-2 rounded-lg text-sm border border-anime-border focus:outline-none focus:border-anime-primary transition-colors placeholder:text-anime-muted"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-col gap-1.5">
            {filteredTags.length === 0 && (
               <p className="text-sm text-anime-muted p-2">
                 no image available
               </p>
            )}
            {filteredTags.map(tag => {
              const isActive = queryTags.includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={clsx(
                    "text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group flex items-center gap-3",
                    isActive 
                      ? "bg-anime-primary text-white" 
                      : "text-anime-muted hover:bg-anime-surface-strong hover:text-anime-text"
                  )}
                >
                  <span className={clsx("text-lg", isActive ? "text-white" : "text-anime-muted group-hover:text-anime-secondary")}>#</span>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
