"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Plus, Search, MessageSquare, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface Conversation {
  id: number;
  title: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

interface ConversationSidebarProps {
  currentConversationId?: number;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: number) => void;
}

interface SwipeableItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onRename: () => void;
  onCancelEdit: () => void;
}

const SwipeableConversationItem: React.FC<SwipeableItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onEdit,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onRename,
  onCancelEdit,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const swipeState = useSwipeGesture(itemRef, {
    threshold: 30,
    onSwipeMove: (deltaX) => {
      if (deltaX < 0) {
        const offset = Math.max(deltaX, -100);
        setSwipeOffset(offset);
      }
    },
    onSwipeEnd: (direction, velocity) => {
      if (direction === 'left' && (Math.abs(swipeOffset) > 50 || velocity > 0.5)) {
        setSwipeOffset(-100);
        setShowDeleteConfirm(true);
        setTimeout(() => {
          setShowDeleteConfirm(false);
          setSwipeOffset(0);
        }, 3000);
      } else {
        setSwipeOffset(0);
      }
    },
  });

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center",
          "transition-opacity duration-200",
          Math.abs(swipeOffset) > 30 ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={onDelete}
          className="text-white font-medium"
        >
          Delete
        </button>
      </div>
      
      <div
        ref={itemRef}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isSwping ? 'none' : 'transform 0.3s ease-out',
        }}
        className={cn(
          "group relative p-3 rounded-lg bg-background cursor-pointer",
          "active:scale-[0.98] transition-all duration-150",
          isActive && "bg-accent",
          "touch-manipulation"
        )}
        onClick={() => {
          if (!isEditing && swipeOffset === 0) {
            onSelect();
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editingTitle}
                  onChange={(e) => onEditingTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename();
                    } else if (e.key === 'Escape') {
                      onCancelEdit();
                    }
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRename}
                  className="min-w-[44px] min-h-[44px] p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEdit}
                  className="min-w-[44px] min-h-[44px] p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-sm font-medium truncate">
                    {conversation.title}
                  </h3>
                </div>
                {conversation.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {conversation.summary}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(conversation.updatedAt), 'MMM d, h:mm a')}
                </p>
              </>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity md:flex hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="min-w-[44px] min-h-[44px] p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="min-w-[44px] min-h-[44px] p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileSwipeRef = useRef<HTMLDivElement>(null);

  // Swipe to open/close sidebar on mobile
  const swipeState = useSwipeGesture(mobileSwipeRef, {
    threshold: 50,
    onSwipeEnd: (direction) => {
      if (direction === 'right' && !isOpen) {
        setIsOpen(true);
      } else if (direction === 'left' && isOpen) {
        setIsOpen(false);
      }
    },
  });

  // Pull to refresh
  const pullToRefreshState = usePullToRefresh(scrollRef, {
    onRefresh: async () => {
      await fetchConversations();
    },
  });

  // Detect if device has touch support
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': 'default_user', // TODO: Replace with actual user ID
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== id));
        if (onDeleteConversation) {
          onDeleteConversation(id);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleRename = async (id: number) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingTitle }),
      });
      
      if (response.ok) {
        setConversations(conversations.map(c => 
          c.id === id ? { ...c, title: editingTitle } : c
        ));
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    } finally {
      setEditingId(null);
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.summary && c.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ConversationList = () => (
    <div className="flex flex-col h-full relative">
      {/* Pull to refresh indicator */}
      {pullToRefreshState.isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-accent/50 transition-all duration-300 z-10"
          style={{
            height: `${pullToRefreshState.pullDistance}px`,
            opacity: pullToRefreshState.canRefresh ? 1 : 0.5,
          }}
        >
          <RefreshCw 
            className={cn(
              "h-5 w-5 text-foreground",
              pullToRefreshState.isRefreshing && "animate-spin"
            )}
          />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <Button
          onClick={() => {
            onNewConversation();
            setIsOpen(false);
          }}
          className="w-full justify-start min-h-[44px]"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2 top-[50%] -translate-y-[50%] h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 min-h-[44px]"
          />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 px-4 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredConversations.map((conversation) => (
              <SwipeableConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversationId === conversation.id}
                onSelect={() => {
                  onSelectConversation(conversation);
                  setIsOpen(false);
                }}
                onDelete={() => handleDelete(conversation.id)}
                onEdit={() => startEditing(conversation)}
                isEditing={editingId === conversation.id}
                editingTitle={editingTitle}
                onEditingTitleChange={setEditingTitle}
                onRename={() => handleRename(conversation.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile swipe area */}
      <div 
        ref={mobileSwipeRef}
        className="md:hidden fixed left-0 top-0 w-8 h-full z-40"
      />
      
      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="min-w-[44px] min-h-[44px]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-80 p-0"
            style={{
              animation: isOpen ? 'slide-in-left 0.3s ease-out' : 'slide-out-left 0.3s ease-out',
            }}
          >
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Conversations</SheetTitle>
            </SheetHeader>
            <ConversationList />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div 
        ref={sidebarRef}
        className={cn(
          "hidden md:block h-full border-r bg-muted/10",
          !isTouchDevice && "[&_.group]:hover:opacity-100"
        )}
      >
        <ConversationList />
      </div>

      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slide-out-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        @supports (-webkit-touch-callout: none) {
          .overscroll-contain {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        @media (hover: none) and (pointer: coarse) {
          .group:hover .group-hover\\:opacity-100 {
            opacity: 0 !important;
          }
        }
      `}</style>
    </>
  );
}