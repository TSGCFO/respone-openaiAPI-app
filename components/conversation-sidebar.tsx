"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  IconButton,
  SwipeableDrawer,
  InputAdornment,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Forum as ForumIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import haptic from '@/lib/haptic';

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
        haptic.trigger('heavy');
        setTimeout(() => {
          setSwipeOffset(0);
        }, 3000);
      } else {
        setSwipeOffset(0);
      }
    },
  });

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          insetY: 0,
          right: 0,
          width: 100,
          bgcolor: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: Math.abs(swipeOffset) > 30 ? 1 : 0,
          transition: 'opacity 0.2s'
        }}
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            haptic.trigger('heavy');
            onDelete();
          }}
          sx={{
            color: 'white',
            fontWeight: 'medium',
            minHeight: 48,
            minWidth: 48
          }}
        >
          Delete
        </Button>
      </Box>
      
      <Paper
        ref={itemRef}
        elevation={0}
        sx={{
          transform: `translateX(${swipeOffset}px)`,
          transition: (swipeState as any).isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          p: 1.5,
          borderRadius: 2,
          bgcolor: isActive ? 'action.selected' : 'background.paper',
          cursor: 'pointer',
          '&:active': {
            transform: `translateX(${swipeOffset}px) scale(0.98)`,
          },
          touchAction: 'manipulation'
        }}
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                <TextField
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
                  size="small"
                  variant="outlined"
                  fullWidth
                  autoFocus
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.trigger('selection');
                    onRename();
                  }}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEdit();
                  }}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ForumIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conversation.title}
                  </Typography>
                </Box>
                {conversation.summary && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', lineClamp: 2, overflow: 'hidden' }}>
                    {conversation.summary}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  {format(new Date(conversation.updatedAt), 'MMM d, h:mm a')}
                </Typography>
              </>
            )}
          </Box>
          
          {!isEditing && (
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              gap: 0.5,
              opacity: 0,
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 1 }
            }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.trigger('selection');
                  onEdit();
                }}
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.trigger('heavy');
                  onDelete();
                }}
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pull to refresh
  const pullToRefreshState = usePullToRefresh(scrollRef, async () => {
    await fetchConversations();
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Pull to refresh indicator */}
      {pullToRefreshState.isPulling && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            transition: 'all 0.3s',
            zIndex: 10,
            height: `${pullToRefreshState.pullDistance}px`,
            opacity: pullToRefreshState.canRefresh ? 1 : 0.5,
          }}
        >
          <RefreshIcon 
            sx={{
              fontSize: 20,
              color: 'text.primary',
              animation: pullToRefreshState.isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>
      )}
      
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          onClick={() => {
            onNewConversation();
            setIsOpen(false);
          }}
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            minHeight: 44,
            textTransform: 'none'
          }}
        >
          New Conversation
        </Button>
        
        <TextField
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ minHeight: 44 }}
        />
      </Box>
      
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          px: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Loading conversations...
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 2 }}>
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
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{ 
              minWidth: 44, 
              minHeight: 44,
              display: { xs: 'inline-flex', md: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <SwipeableDrawer
            anchor="left"
            open={isOpen}
            onClose={() => setIsOpen(false)}
            onOpen={() => setIsOpen(true)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 320,
                bgcolor: 'background.default'
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider' 
            }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Conversations
              </Typography>
              <IconButton onClick={() => setIsOpen(false)}>
                <ClearIcon />
              </IconButton>
            </Box>
            <ConversationList />
          </SwipeableDrawer>
        </>
      )}

      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          height: '100%',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.default, 0.5),
          ...(!isTouchDevice && {
            '& .group:hover': {
              opacity: 1
            }
          })
        }}
      >
        <ConversationList />
      </Box>
    </>
  );
}