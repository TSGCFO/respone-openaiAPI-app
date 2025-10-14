"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Search, Clock, Star, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEnhancedPullToRefresh } from "@/hooks/useEnhancedPullToRefresh";
import { useEnhancedSwipe } from "@/hooks/useEnhancedSwipe";
import haptic from "@/lib/haptic";

interface Memory {
  id: string;
  content: string;
  summary: string;
  timestamp: Date;
  isStarred?: boolean;
  conversationId?: number;
}

export default function EnhancedMemoriesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }
  }, []);

  // Fetch memories
  const fetchMemories = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/semantic-memories");
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
      haptic.trigger('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const searchMemories = async (query: string) => {
    if (!query.trim()) {
      fetchMemories();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 20 })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMemories(data.results || []);
      }
    } catch (error) {
      console.error("Error searching memories:", error);
      haptic.trigger('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchMemories(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    haptic.trigger('light');
    await fetchMemories(false);
    haptic.trigger('success');
  }, [fetchMemories]);

  // Pull to refresh state
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    canRefresh,
    opacity,
    rotation,
  } = useEnhancedPullToRefresh(scrollContainerRef, {
    threshold: 80,
    maxPull: 150,
    onRefresh: handleRefresh,
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="text-purple-600" size={24} />
          <h2 className="text-lg font-semibold">Semantic Memories</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Memories List with Pull to Refresh */}
      <div className="flex-1 relative overflow-hidden">
        {/* Pull to refresh indicator */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 flex justify-center items-center z-20",
            "transition-all duration-300 pointer-events-none"
          )}
          style={{
            transform: `translateY(${pullDistance}px)`,
            opacity: opacity,
            height: '60px',
          }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-white shadow-lg",
              isRefreshing && "animate-pulse"
            )}
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
            ) : (
              <RefreshCw
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  canRefresh ? "text-purple-600" : "text-gray-400"
                )}
                style={{
                  transform: `rotate(${rotation}deg) scale(${0.8 + pullProgress * 0.2})`,
                }}
              />
            )}
          </div>
          
          {/* Status text */}
          {(isPulling || isRefreshing) && (
            <div className="absolute -bottom-6 text-xs text-gray-500 font-medium">
              {isRefreshing 
                ? "Refreshing..." 
                : canRefresh 
                ? "Release to refresh" 
                : "Pull down to refresh"}
            </div>
          )}
        </div>

        {/* Scrollable container */}
        <ScrollArea 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 h-full",
            platform === 'ios' && "scroll-touch"
          )}
          style={{
            transform: isPulling && !isRefreshing 
              ? `translateY(${Math.min(pullDistance * 0.7, 50)}px)` 
              : undefined,
            transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div className="p-4 space-y-3">
            {loading && memories.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Brain className="mx-auto mb-3 text-gray-300" size={48} />
                <p>No memories found</p>
                <p className="text-sm mt-1">Start chatting to create memories</p>
              </div>
            ) : (
              memories.map((memory) => (
                <SwipeableMemoryCard
                  key={memory.id}
                  memory={memory}
                  isSelected={selectedMemory?.id === memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  onDelete={async () => {
                    haptic.trigger('medium');
                    try {
                      // Call API to delete the memory from the database
                      const response = await fetch(`/api/semantic-memories?id=${memory.id}`, {
                        method: 'DELETE',
                      });
                      
                      if (response.ok) {
                        // Only remove from UI if deletion was successful
                        setMemories(prev => prev.filter(m => m.id !== memory.id));
                        if (selectedMemory?.id === memory.id) {
                          setSelectedMemory(null);
                        }
                        haptic.trigger('success');
                      } else {
                        console.error('Failed to delete memory');
                        haptic.trigger('error');
                      }
                    } catch (error) {
                      console.error('Error deleting memory:', error);
                      haptic.trigger('error');
                    }
                  }}
                  formatDate={formatDate}
                  platform={platform}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Edge effects for iOS */}
        {platform === 'ios' && (
          <>
            <div 
              className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
              style={{
                background: isPulling 
                  ? 'linear-gradient(to bottom, rgba(147, 51, 234, 0.1), transparent)'
                  : 'transparent',
                transition: 'background 0.3s',
              }}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(249, 250, 251, 0.9), transparent)',
              }}
            />
          </>
        )}
      </div>

      {/* Selected Memory Detail (Tablet/Desktop) */}
      {selectedMemory && (
        <div className="hidden md:block border-t bg-white p-4 h-1/3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900">Memory Detail</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMemory(null)}
            >
              ×
            </Button>
          </div>
          <ScrollArea className="h-full">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {selectedMemory.content}
            </p>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

interface SwipeableMemoryCardProps {
  memory: Memory;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
  platform: "ios" | "android" | "other";
}

function SwipeableMemoryCard({ 
  memory, 
  isSelected, 
  onClick, 
  onDelete, 
  formatDate,
  platform
}: SwipeableMemoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleSwipeMove = useCallback((deltaX: number) => {
    if (!cardRef.current || deltaX >= 0) return;
    
    const maxSwipe = 100;
    const swipeAmount = Math.min(Math.abs(deltaX), maxSwipe);
    const progress = swipeAmount / maxSwipe;
    
    if (platform === 'ios') {
      cardRef.current.style.transform = `translate3d(${deltaX}px, 0, 0)`;
    } else {
      cardRef.current.style.transform = `translate3d(${deltaX * 0.9}px, 0, 0)`;
      cardRef.current.parentElement!.style.background = `rgba(239, 68, 68, ${progress * 0.8})`;
    }
  }, [platform]);
  
  const handleSwipeEnd = useCallback((direction: 'left' | null, velocity: number, deltaX: number) => {
    if (!cardRef.current) return;
    
    if (direction === 'left' && (Math.abs(deltaX) > 80 || velocity > 0.5)) {
      setIsDeleting(true);
      cardRef.current.style.transform = 'translate3d(-100%, 0, 0)';
      cardRef.current.style.opacity = '0';
      setTimeout(() => onDelete(), 300);
    } else {
      cardRef.current.style.transform = 'translate3d(0, 0, 0)';
      if (cardRef.current.parentElement) {
        cardRef.current.parentElement.style.background = 'transparent';
      }
    }
  }, [onDelete]);
  
  const handleSwipeCancel = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'translate3d(0, 0, 0)';
    if (cardRef.current.parentElement) {
      cardRef.current.parentElement.style.background = 'transparent';
    }
  }, []);
  
  useEnhancedSwipe(cardRef, {
    threshold: 80,
    onSwipeMove: (deltaX) => handleSwipeMove(deltaX),
    onSwipeEnd: (direction, velocity, deltaX) => 
      handleSwipeEnd(direction as 'left' | null, velocity, deltaX),
    onSwipeCancel: handleSwipeCancel,
  });
  
  return (
    <div className="relative">
      {/* Delete background */}
      {platform === 'ios' && (
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-red-500 rounded-lg flex items-center justify-end pr-4">
          <Trash2 size={20} className="text-white" />
        </div>
      )}
      
      <div
        ref={cardRef}
        onClick={!isDeleting ? onClick : undefined}
        className={cn(
          "w-full text-left p-4 rounded-lg transition-all duration-200",
          "bg-white border hover:shadow-md relative",
          isSelected && "ring-2 ring-purple-500 shadow-md",
          isDeleting && "opacity-50"
        )}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {memory.summary}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {memory.content}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {formatDate(memory.timestamp)}
              </span>
            </div>
          </div>
          
          {memory.isStarred && (
            <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}