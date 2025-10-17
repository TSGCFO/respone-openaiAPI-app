"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Paper,
  Divider
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Favorite as HeartIcon,
  FavoriteBorder as HeartOutlineIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Schedule as ClockIcon,
  Warning as AlertIcon,
  Person as UserIcon,
  SmartToy as BotIcon,
  Download as DownloadIcon,
  ZoomIn as ExpandIcon
} from "@mui/icons-material";
import { MessageItem } from "@/lib/assistant";
import { format } from "date-fns";
import haptic from "@/lib/haptic";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useLongPress } from "@/hooks/useLongPress";

interface MobileOptimizedMessageProps {
  message: MessageItem;
  onRegenerate?: () => void;
  onReply?: () => void;
  onDelete?: () => void;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  platform?: "ios" | "android" | "other";
  messageStatus?: "sending" | "sent" | "delivered" | "read" | "failed";
  className?: string;
  index?: number;
}

const MobileOptimizedMessage = forwardRef<HTMLDivElement, MobileOptimizedMessageProps>(({
  message,
  onRegenerate,
  onReply,
  onDelete,
  isGroupStart = false,
  isGroupEnd = true,
  showAvatar = false,
  showTimestamp = false,
  platform: propPlatform,
  messageStatus = "sent",
  className,
  index = 0
}, ref) => {
  const theme = useTheme();
  const [platform, setPlatform] = useState<"ios" | "android" | "other">(propPlatform || "other");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [messageTime, setMessageTime] = useState<string>('');
  const [imageExpanded, setImageExpanded] = useState<string | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const doubleTapRef = useRef<number>(0);
  
  const isUser = message.role === "user";
  const messageText = message.content[0]?.text || "";
  const hasImages = message.content[0]?.annotations?.some(
    (a) => a.type === "container_file_citation" && a.filename && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
  );
  
  // Detect platform
  useEffect(() => {
    if (!propPlatform || propPlatform === "other") {
      const userAgent = navigator.userAgent || navigator.vendor;
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        setPlatform("ios");
      } else if (/android/i.test(userAgent)) {
        setPlatform("android");
      } else {
        setPlatform("other");
      }
    }
  }, [propPlatform]);
  
  // Set message time
  useEffect(() => {
    const timestamp = message.metadata?.timestamp;
    if (timestamp) {
      const date = new Date(timestamp);
      setMessageTime(format(date, 'HH:mm'));
    } else {
      setMessageTime(format(new Date(), 'HH:mm'));
    }
  }, [message.metadata?.timestamp]);
  
  // Handle copy with haptic feedback
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(messageText);
    setMenuAnchorEl(null);
    haptic.trigger("light");
    
    // Show toast notification using MUI
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); color: white; padding: 12px 20px; border-radius: 24px; z-index: 9999; font-size: 14px; font-weight: 500;';
    toast.textContent = 'Copied to clipboard';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }, [messageText]);
  
  // Handle share
  const handleShare = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        haptic.trigger("selection");
        await navigator.share({ text: messageText });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    setMenuAnchorEl(null);
  }, [messageText]);
  
  // Handle delete
  const handleDelete = useCallback(() => {
    haptic.trigger("warning");
    onDelete?.();
    setMenuAnchorEl(null);
  }, [onDelete]);
  
  // Handle like/reaction
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    setLikeAnimation(true);
    haptic.trigger("heavy");
    setTimeout(() => setLikeAnimation(false), 600);
  }, [isLiked]);
  
  // Double tap handler
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      handleLike();
      doubleTapRef.current = 0;
    } else {
      doubleTapRef.current = now;
    }
  }, [handleLike]);
  
  // Long press handler
  const handleLongPress = useCallback((event: TouchEvent | MouseEvent) => {
    haptic.trigger("medium");
    const target = event.currentTarget as HTMLElement;
    setMenuAnchorEl(target);
  }, []);
  
  const { handlers: longPressHandlers } = useLongPress(
    handleLongPress,
    {
      threshold: 400,
    }
  );
  
  // Swipe gesture for quick actions
  const swipeState = useSwipeGesture(messageRef, {
    threshold: 60,
    onSwipeMove: (deltaX) => {
      if (platform === "ios" && deltaX > 0 && onReply) {
        setSwipeOffset(Math.min(deltaX * 0.8, 80));
      } else if (deltaX < 0 && onDelete) {
        setSwipeOffset(Math.max(deltaX * 0.8, -80));
      }
    },
    onSwipeEnd: (direction, velocity) => {
      if (direction === 'right' && swipeOffset > 50 && onReply) {
        haptic.trigger("selection");
        onReply();
      } else if (direction === 'left' && swipeOffset < -50 && onDelete) {
        haptic.trigger("warning");
        onDelete();
      }
      setSwipeOffset(0);
    },
  });
  
  // Custom markdown components
  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <Paper elevation={0} sx={{ my: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.900' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              px: 2, 
              py: 1, 
              bgcolor: 'grey.800'
            }}>
              <Typography variant="caption" sx={{ color: 'grey.300', fontWeight: 'medium' }}>
                {language}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                  haptic.trigger("selection");
                }}
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ overflow: 'auto' }}>
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </Box>
          </Paper>
        );
      }
      
      return (
        <Box
          component="code"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            fontSize: '0.875rem',
            bgcolor: isUser ? alpha(theme.palette.primary.main, 0.2) : 'grey.200'
          }}
          {...props}
        >
          {children}
        </Box>
      );
    },
    p({ children }: any) {
      return (
        <Typography variant="body1" paragraph sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
          {children}
        </Typography>
      );
    },
    a({ href, children }: any) {
      return (
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: isUser ? 'primary.light' : 'primary.main',
            textDecoration: 'underline',
            fontWeight: 'medium'
          }}
        >
          {children}
        </Box>
      );
    }
  }), [isUser, theme]);
  
  return (
    <>
      {/* Message container */}
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mt: isGroupStart ? 2 : 0.75,
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isSwping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          opacity: 1,
          animation: index < 20 ? `messageSlideIn ${300 + index * 50}ms ease-out` : undefined,
          '@keyframes messageSlideIn': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {/* Avatar for assistant messages */}
        {!isUser && showAvatar && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              visibility: isGroupEnd ? 'visible' : 'hidden'
            }}
          >
            <BotIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        
        {/* Message bubble */}
        <Card
          ref={messageRef}
          onClick={handleDoubleTap}
          elevation={isUser ? 0 : 1}
          onMouseDown={longPressHandlers.onMouseDown as any}
          onMouseUp={longPressHandlers.onMouseUp as any}
          onTouchStart={longPressHandlers.onTouchStart as any}
          onTouchEnd={longPressHandlers.onTouchEnd as any}
          sx={{
            maxWidth: '85%',
            borderRadius: 2.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            bgcolor: isUser 
              ? (platform === "ios" ? 'primary.main' : 'primary.dark')
              : (platform === "ios" ? 'grey.100' : 'background.paper'),
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderBottomRightRadius: isUser && isGroupEnd ? (platform === "ios" ? 8 : 12) : undefined,
            borderBottomLeftRadius: !isUser && isGroupEnd ? (platform === "ios" ? 8 : 12) : undefined,
            '&:active': {
              transform: 'scale(0.98)',
              opacity: 0.9
            },
            position: 'relative',
            border: !isUser && platform === "android" ? `1px solid ${theme.palette.divider}` : 'none'
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {/* Message content */}
            <Box sx={{ 
              '& > *': { 
                color: isUser ? 'inherit' : undefined 
              }
            }}>
              <ReactMarkdown components={markdownComponents}>
                {messageText}
              </ReactMarkdown>
            </Box>
            
            {/* Images */}
            {hasImages && message.content[0]?.annotations?.filter(
              (a) => a.type === "container_file_citation" && a.filename && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
            ).map((a, i) => {
              const imageUrl = `/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`;
              const isExpanded = imageExpanded === imageUrl;
              
              return (
                <Box key={i} sx={{ mt: 2 }}>
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={a.filename || ""}
                    sx={{
                      borderRadius: 1.5,
                      maxWidth: isExpanded ? 'none' : '100%',
                      width: isExpanded ? '100%' : 'auto',
                      cursor: 'zoom-in',
                      transition: 'all 0.3s'
                    }}
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.trigger("selection");
                      setImageExpanded(isExpanded ? null : imageUrl);
                    }}
                  />
                  {!isExpanded && (
                    <Box 
                      sx={{ 
                        mt: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        opacity: 0.7,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.trigger("selection");
                        setImageExpanded(imageUrl);
                      }}
                    >
                      <ExpandIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">Tap to expand</Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
            
            {/* Timestamp and status */}
            {showTimestamp && messageTime && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                mt: 1,
                opacity: 0.7
              }}>
                <Typography variant="caption">
                  {messageTime}
                </Typography>
                {isUser && (
                  <>
                    {messageStatus === 'sending' && <ClockIcon sx={{ fontSize: 14 }} />}
                    {messageStatus === 'sent' && <CheckIcon sx={{ fontSize: 14 }} />}
                    {messageStatus === 'delivered' && <DoneAllIcon sx={{ fontSize: 14 }} />}
                    {messageStatus === 'read' && <DoneAllIcon sx={{ fontSize: 14, color: 'primary.light' }} />}
                    {messageStatus === 'failed' && <AlertIcon sx={{ fontSize: 14, color: 'error.light' }} />}
                  </>
                )}
              </Box>
            )}
            
            {/* Like indicator */}
            {isLiked && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  p: 0.5,
                  boxShadow: 2,
                  animation: likeAnimation ? 'bounce 0.6s' : undefined,
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' }
                  }
                }}
              >
                <HeartIcon sx={{ fontSize: 16, color: 'error.main' }} />
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/* Avatar for user messages */}
        {isUser && showAvatar && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'success.main',
              visibility: isGroupEnd ? 'visible' : 'hidden'
            }}
          >
            <UserIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
      </Box>
      
      {/* Swipe action indicators */}
      {Math.abs(swipeOffset) > 30 && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [swipeOffset > 0 ? 'left' : 'right']: 3,
          animation: 'pulse 1s infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 }
          }
        }}>
          {swipeOffset > 0 ? (
            <ReplyIcon sx={{ color: 'primary.main' }} />
          ) : (
            <DeleteIcon sx={{ color: 'error.main' }} />
          )}
        </Box>
      )}
      
      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            borderRadius: 2,
            boxShadow: platform === "ios" ? '0 10px 40px rgba(0,0,0,0.2)' : undefined
          }
        }}
      >
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        
        {onReply && (
          <MenuItem onClick={() => {
            haptic.trigger("selection");
            onReply();
            setMenuAnchorEl(null);
          }}>
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reply</ListItemText>
          </MenuItem>
        )}
        
        {!isUser && onRegenerate && (
          <MenuItem onClick={() => {
            haptic.trigger("selection");
            onRegenerate();
            setMenuAnchorEl(null);
          }}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Regenerate</ListItemText>
          </MenuItem>
        )}
        
        {typeof window !== 'undefined' && navigator.share !== undefined && (
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          handleLike();
          setMenuAnchorEl(null);
        }}>
          <ListItemIcon>
            {isLiked ? <HeartIcon fontSize="small" sx={{ color: 'error.main' }} /> : <HeartOutlineIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{isLiked ? 'Unlike' : 'Like'}</ListItemText>
        </MenuItem>
        
        {onDelete && <Divider />}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
});

MobileOptimizedMessage.displayName = 'MobileOptimizedMessage';

export default MobileOptimizedMessage;