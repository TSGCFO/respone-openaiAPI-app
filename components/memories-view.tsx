"use client";

import React, { useState, useEffect } from "react";
import { Brain, Search, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Memory {
  id: string;
  content: string;
  summary: string;
  timestamp: Date;
  isStarred?: boolean;
  conversationId?: number;
}

export default function MemoriesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/semantic-memories");
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
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
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
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
              <MemoryCard
                key={memory.id}
                memory={memory}
                isSelected={selectedMemory?.id === memory.id}
                onClick={() => setSelectedMemory(memory)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </ScrollArea>

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

interface MemoryCardProps {
  memory: Memory;
  isSelected: boolean;
  onClick: () => void;
  formatDate: (date: Date) => string;
}

function MemoryCard({ memory, isSelected, onClick, formatDate }: MemoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg transition-all duration-200",
        "bg-white border hover:shadow-md",
        isSelected && "ring-2 ring-purple-500 shadow-md"
      )}
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
    </button>
  );
}