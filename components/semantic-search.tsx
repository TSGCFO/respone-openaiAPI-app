"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, Brain, MessageSquare, Clock, Star, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: number;
  content: string;
  summary?: string;
  context?: string;
  timestamp?: string;
  createdAt?: string;
  role?: string;
  conversationId?: number;
  importance?: number;
  type: 'message' | 'memory';
}

interface SemanticSearchProps {
  onSelectResult?: (result: SearchResult) => void;
  currentConversationId?: number;
}

export function SemanticSearch({ onSelectResult, currentConversationId }: SemanticSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'memories' | 'messages'>('all');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchPromises = [];
      
      // Search memories if needed
      if (searchType === 'all' || searchType === 'memories') {
        searchPromises.push(
          fetch('/api/semantic-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': 'default_user',
            },
            body: JSON.stringify({
              query: searchQuery,
              type: 'memories',
              limit: 10,
            }),
          })
        );
      }
      
      // Search messages if needed
      if (searchType === 'all' || searchType === 'messages') {
        searchPromises.push(
          fetch('/api/semantic-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              type: 'messages',
              conversationId: searchType === 'messages' ? currentConversationId : undefined,
              limit: 10,
            }),
          })
        );
      }

      const responses = await Promise.all(searchPromises);
      const resultsData = await Promise.all(responses.map(r => r.json()));
      
      const combinedResults: SearchResult[] = [];
      
      // Process results
      resultsData.forEach((data, index) => {
        if (data.results) {
          const type = (searchType === 'memories' || (searchType === 'all' && index === 0)) ? 'memory' : 'message';
          data.results.forEach((item: any) => {
            combinedResults.push({
              ...item,
              type,
            });
          });
        }
      });

      // Sort by relevance/importance
      combinedResults.sort((a, b) => {
        if (a.type === 'memory' && b.type === 'message') return -1;
        if (a.type === 'message' && b.type === 'memory') return 1;
        if (a.importance && b.importance) return b.importance - a.importance;
        return 0;
      });

      setResults(combinedResults.slice(0, 15));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType, currentConversationId]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300);
      setDebounceTimer(timer);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === 'memory') {
      if (result.importance && result.importance >= 8) {
        return <Star className="h-4 w-4 text-yellow-500" />;
      }
      return <Brain className="h-4 w-4 text-purple-500" />;
    }
    return <MessageSquare className="h-4 w-4 text-blue-500" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search memories...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search your conversations and memories..."
          value={query}
          onValueChange={setQuery}
        />
        <div className="flex gap-2 px-3 py-2 border-b">
          <Button
            size="sm"
            variant={searchType === 'all' ? 'default' : 'outline'}
            onClick={() => setSearchType('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={searchType === 'memories' ? 'default' : 'outline'}
            onClick={() => setSearchType('memories')}
          >
            Memories
          </Button>
          <Button
            size="sm"
            variant={searchType === 'messages' ? 'default' : 'outline'}
            onClick={() => setSearchType('messages')}
          >
            Messages
          </Button>
        </div>
        <CommandList>
          {isSearching ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>
              {query ? 'No results found.' : 'Start typing to search...'}
            </CommandEmpty>
          ) : (
            <>
              {results.some(r => r.type === 'memory') && (
                <CommandGroup heading="Semantic Memories">
                  {results
                    .filter(r => r.type === 'memory')
                    .map((result) => (
                      <CommandItem
                        key={`memory-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {getIcon(result)}
                          <span className="font-medium flex-1 truncate">
                            {result.summary || result.content.substring(0, 50)}
                          </span>
                          {result.importance && (
                            <span className="text-xs text-muted-foreground">
                              <Hash className="inline h-3 w-3" />
                              {result.importance}
                            </span>
                          )}
                        </div>
                        {result.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 ml-6">
                            {result.content}
                          </p>
                        )}
                        {result.context && (
                          <p className="text-xs text-muted-foreground ml-6">
                            Context: {result.context}
                          </p>
                        )}
                        <div className="flex items-center gap-2 ml-6 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(result.createdAt)}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              
              {results.some(r => r.type === 'message') && (
                <>
                  {results.some(r => r.type === 'memory') && <CommandSeparator />}
                  <CommandGroup heading="Messages">
                    {results
                      .filter(r => r.type === 'message')
                      .map((result) => (
                        <CommandItem
                          key={`message-${result.id}`}
                          onSelect={() => handleSelect(result)}
                          className="flex flex-col items-start gap-1 py-3"
                        >
                          <div className="flex items-center gap-2 w-full">
                            {getIcon(result)}
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                              {result.role}
                            </span>
                            {result.conversationId && (
                              <span className="text-xs text-muted-foreground">
                                • Conversation #{result.conversationId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-3 ml-6">
                            {result.content}
                          </p>
                          <div className="flex items-center gap-2 ml-6 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(result.timestamp)}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}