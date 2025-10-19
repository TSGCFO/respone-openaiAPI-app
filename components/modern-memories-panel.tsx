'use client';

import React, { useState, useEffect } from 'react';
import useConversationStore from '@/stores/useConversationStore';

// Icon components
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const BrainIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3C9.23 3 6.19 5.95 6 9.66l-1.92 2.53c-.24.31.05.81.4.81H6v3c0 1.11.89 2 2 2h1v3h7v-4.68c3.3-1.3 5.65-4.5 5.65-8.26C21.65 5.21 18.79 2 15 2l-2 1zm3.5 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

interface Memory {
  id: number;
  content: string;
  summary: string;
  importance: number;
  createdAt: string;
  metadata: any;
  context?: string;
}

interface ModernMemoriesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModernMemoriesPanel({ isOpen, onClose }: ModernMemoriesPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const { userId } = useConversationStore();

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/semantic-memories', {
        headers: { 'x-user-id': userId }
      });
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMemories = async (query: string) => {
    if (!query.trim()) {
      fetchMemories();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, limit: 50 }),
      });

      if (response.ok) {
        const data = await response.json();
        setMemories(data.results || []);
      }
    } catch (error) {
      console.error('Failed to search memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchDebounce) clearTimeout(searchDebounce);
    
    const timeout = setTimeout(() => {
      searchMemories(value);
    }, 300);
    
    setSearchDebounce(timeout);
  };

  const handleDelete = async (memoryId: number) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      const response = await fetch(`/api/semantic-memories?id=${memoryId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (response.ok) {
        setMemories(memories.filter(m => m.id !== memoryId));
        if (selectedMemory?.id === memoryId) {
          setSelectedMemory(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-500';
    if (importance >= 6) return 'text-orange-500';
    if (importance >= 4) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <BrainIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Semantic Memories</h2>
                  <p className="text-xs opacity-90">{memories.length} memories stored</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-full pl-10 pr-4 py-2.5 text-white placeholder-white/70 outline-none focus:bg-white/30 transition-all"
              />
            </div>
          </div>

          {/* Memories List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center py-12">
                <BrainIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No memories found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery ? 'Try a different search' : 'Start chatting to create memories'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                      selectedMemory?.id === memory.id 
                        ? 'border-purple-500 shadow-purple-100' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-1">
                          {memory.summary || 'Memory'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {memory.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {formatDate(memory.createdAt)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <StarIcon className={getImportanceColor(memory.importance)} />
                            <span className={`text-xs font-medium ${getImportanceColor(memory.importance)}`}>
                              {memory.importance}/10
                            </span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(memory.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory Detail */}
          {selectedMemory && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Memory Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Created {formatDate(selectedMemory.createdAt)}
                </p>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedMemory.summary || 'No summary'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Content</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedMemory.content}
                  </p>
                </div>
                {selectedMemory.context && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Context</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedMemory.context}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    Importance: {selectedMemory.importance}/10
                  </span>
                  <button
                    onClick={() => handleDelete(selectedMemory.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Delete Memory
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}