"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, Plus, Search, MessageSquare, Trash2, Edit2, Check, X, RefreshCw, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import haptic from '@/lib/haptic';
import * as VisuallyHidden from '@reach/visually-hidden';

interface Conversation {
  id: number;
  title: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

interface ConversationBottomSheetProps {
  currentConversationId?: number;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: number) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
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
    trackMouse: false,
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
        haptic.trigger('heavy');
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
          onClick={(e) => {
            e.stopPropagation();
            haptic.trigger('heavy');
            onDelete();
          }}
          className="text-white font-medium min-h-[48px] min-w-[48px] px-4 py-2 flex items-center justify-center"
        >
          Delete
        </button>
      </div>
      
      <div
        ref={itemRef}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isSwping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className={cn(
          "group relative p-3 rounded-lg bg-background cursor-pointer",
          "active:scale-[0.98] transition-all duration-150",
          isActive && "bg-accent",
          "touch-manipulation"
        )}
        onClick={(e) => {
          if (isEditing || Math.abs(swipeOffset) > 5) {
            return;
          }
          
          const target = e.target as HTMLElement;
          if (
            target.tagName === 'BUTTON' || 
            target.tagName === 'INPUT' ||
            target.closest('button') ||
            target.closest('input')
          ) {
            return;
          }
          
          haptic.trigger('selection');
          onSelect();
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
                      e.preventDefault();
                      onRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      onCancelEdit();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.trigger('selection');
                    onRename();
                  }}
                  className="min-w-[44px] min-h-[44px] p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEdit();
                  }}
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.trigger('selection');
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
                  haptic.trigger('heavy');
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

export function ConversationBottomSheet({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onOpenChange,
  triggerRef,
}: ConversationBottomSheetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [snapPoint, setSnapPoint] = useState<number | string>('355px');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pull to refresh
  const pullToRefreshState = usePullToRefresh(scrollRef, {
    onRefresh: async () => {
      await fetchConversations();
    },
  });

  // Fetch conversations on mount and when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': 'default_user',
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
        haptic.trigger('success');
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

  const handleNewConversation = () => {
    haptic.trigger('heavy');
    onNewConversation();
    onOpenChange(false);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation);
    onOpenChange(false);
  };

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          haptic.trigger('selection');
        }
        onOpenChange(open);
      }}
      snapPoints={['148px', '355px', 0.85]}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={(value) => setSnapPoint(value ?? '355px')}
      modal={true}
      handleOnly={false}
      preventScrollRestoration={true}
      disablePreventScroll={false}
      shouldScaleBackground
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => onOpenChange(false)}
        />
        <Drawer.Content 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background rounded-t-[24px]",
            "flex flex-col max-h-[96%]",
            "shadow-lg border-t",
            "focus:outline-none"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Accessibility Title - Hidden visually but available to screen readers */}
          <Drawer.Title asChild>
            <VisuallyHidden.VisuallyHidden>
              <h2>Conversations Menu</h2>
            </VisuallyHidden.VisuallyHidden>
          </Drawer.Title>

          {/* Handle / Pill indicator with better styling */}
          <div className="w-full pt-3 pb-2 flex justify-center relative">
            <div className="absolute inset-x-0 top-0 h-12 flex items-center justify-center pointer-events-none">
              <Drawer.Handle className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full shadow-sm transition-all hover:bg-gray-400 pointer-events-auto" />
            </div>
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          {/* Pull to refresh indicator */}
          {pullToRefreshState.isPulling && (
            <div 
              className="absolute top-16 left-0 right-0 flex items-center justify-center bg-accent/50 transition-all duration-300 z-10"
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

          {/* Actions */}
          <div className="p-4 space-y-3">
            <Button
              onClick={handleNewConversation}
              className="w-full justify-start min-h-[44px]"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
            
            <div className="relative">
              <Search className="absolute left-2 top-[50%] -translate-y-[50%] h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 min-h-[44px]"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div 
            ref={scrollRef}
            className={cn(
              "flex-1 px-4 overflow-y-auto overflow-x-hidden overscroll-contain",
              "min-h-0" // Important for flex child scrolling
            )}
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
                    onSelect={() => handleSelectConversation(conversation)}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}