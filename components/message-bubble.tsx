"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useLongPress } from "@/hooks/useLongPress";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { 
  Copy, 
  RotateCcw, 
  Share, 
  Heart, 
  Trash2, 
  Reply, 
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Bot
} from 'lucide-react';
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { MessageItem } from "@/lib/assistant";
import { format } from "date-fns";

interface MessageBubbleProps {
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
}

interface ContextMenuOption {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  destructive?: boolean;
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(({
  message,
  onRegenerate,
  onReply,
  onDelete,
  isGroupStart = false,
  isGroupEnd = true,
  showAvatar = false,
  showTimestamp = false,
  platform: platformProp = "other",
  messageStatus = "sent",
  className
}, ref) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const messageRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const doubleTapRef = useRef<number>(0);
  
  const isUser = message.role === "user";
  const messageText = message.content[0]?.text || "";
  
  // Detect actual platform if not provided and store in state
  const [platform, setPlatform] = useState(platformProp);
  
  useEffect(() => {
    if (platformProp === "other") {
      const userAgent = navigator.userAgent || navigator.vendor;
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        setPlatform("ios");
      } else if (/android/i.test(userAgent)) {
        setPlatform("android");
      } else {
        setPlatform("other");
      }
    } else {
      setPlatform(platformProp);
    }
  }, [platformProp]);
  
  // Set current time only on the client side to avoid hydration mismatch
  useEffect(() => {
    // Use the message's actual timestamp if available, otherwise use current time as fallback
    const timestamp = message.metadata?.timestamp;
    if (timestamp) {
      const date = new Date(timestamp);
      setCurrentTime(format(date, 'h:mm a'));
    } else {
      setCurrentTime(format(new Date(), 'h:mm a'));
    }
  }, [message.metadata?.timestamp]);
  
  // Handle copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(messageText);
    setShowContextMenu(false);
    haptic.trigger("selection");
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 animate-fade-in backdrop-blur-sm';
    toast.textContent = 'Copied to clipboard';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }, [messageText]);
  
  // Handle share
  const handleShare = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: messageText });
        haptic.trigger("selection");
      } catch {
        console.log('Share cancelled');
      }
    }
    setShowContextMenu(false);
  }, [messageText]);
  
  // Handle delete
  const handleDelete = useCallback(() => {
    haptic.trigger("warning");
    onDelete?.();
    setShowContextMenu(false);
  }, [onDelete]);
  
  // Handle like/reaction
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    setLikeAnimation(true);
    haptic.trigger("selection");
    setTimeout(() => setLikeAnimation(false), 600);
  }, [isLiked]);
  
  // Double tap handler
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      handleLike();
      doubleTapRef.current = 0;
    } else {
      doubleTapRef.current = now;
    }
  }, [handleLike]);
  
  // Context menu options
  const contextMenuOptions = useMemo<ContextMenuOption[]>(() => {
    const options: ContextMenuOption[] = [
      {
        label: 'Copy',
        icon: <Copy className="h-4 w-4" />,
        action: handleCopy,
      }
    ];
    
    if (onReply) {
      options.push({
        label: 'Reply',
        icon: <Reply className="h-4 w-4" />,
        action: () => {
          onReply();
          setShowContextMenu(false);
        },
      });
    }
    
    if (!isUser && onRegenerate) {
      options.push({
        label: 'Regenerate',
        icon: <RotateCcw className="h-4 w-4" />,
        action: () => {
          onRegenerate();
          setShowContextMenu(false);
        },
      });
    }
    
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      options.push({
        label: 'Share',
        icon: <Share className="h-4 w-4" />,
        action: handleShare,
      });
    }
    
    if (onDelete) {
      options.push({
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        action: handleDelete,
        destructive: true,
      });
    }
    
    return options;
  }, [isUser, onRegenerate, onReply, onDelete, handleCopy, handleShare, handleDelete]);
  
  // Long press handler
  const handleLongPress = useCallback((event: TouchEvent | MouseEvent) => {
    haptic.trigger("medium");
    setIsSelected(true);
    
    const rect = messageRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;
      
      setContextMenuPosition({
        x: clientX,
        y: clientY - 100,
      });
      setShowContextMenu(true);
    }
  }, []);
  
  const { handlers: longPressHandlers } = useLongPress(
    handleLongPress,
    {
      threshold: 500,
      onCancel: () => setIsSelected(false),
    }
  );
  
  // Swipe gesture for reply/delete
  const swipeState = useSwipeGesture(messageRef, {
    threshold: 50,
    onSwipeMove: (deltaX) => {
      const checkPlatform = platform === "ios";
      if (checkPlatform && deltaX > 0 && onReply) {
        // Swipe right to reply (iOS style)
        setSwipeOffset(Math.min(deltaX, 80));
      } else if (deltaX < 0 && onDelete) {
        // Swipe left to delete
        setSwipeOffset(Math.max(deltaX, -80));
      }
    },
    onSwipeEnd: (direction) => {
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
  
  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
        setIsSelected(false);
      }
    };
    
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showContextMenu]);
  
  // Message bubble styles
  const bubbleStyles = cn(
    "relative max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5",
    "transition-all duration-200 ease-out",
    "touch-manipulation select-none",
    isPressed && "scale-[0.97]",
    isSelected && "ring-2 ring-blue-500 ring-offset-2",
    
    // User vs Assistant styles
    isUser ? [
      platform === "ios" ? "bg-blue-500 text-white" : "bg-blue-600 text-white",
      "ml-auto",
      isGroupEnd && platform === "ios" && "rounded-br-[4px]",
      isGroupEnd && platform === "android" && "rounded-br-[8px]",
    ] : [
      platform === "ios" ? "bg-gray-200 text-gray-900" : "bg-white text-gray-900 shadow-sm",
      "mr-auto",
      isGroupEnd && platform === "ios" && "rounded-bl-[4px]",
      isGroupEnd && platform === "android" && "rounded-bl-[8px]",
    ],
    
    // Group message styles
    !isGroupStart && "mt-1",
    isGroupStart && "mt-3",
    
    className
  );
  
  // Custom markdown components
  const markdownComponents = useMemo(() => ({
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div className="my-3 rounded-lg overflow-hidden bg-gray-900">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-gray-300 text-xs">
              <span>{language}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                  haptic.trigger("selection");
                }}
                className="hover:text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center p-3"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!my-0 !bg-gray-900"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code
          className={cn(
            "px-1 py-0.5 rounded",
            isUser ? "bg-white/20" : "bg-gray-100"
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    a({ href, children }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "underline font-medium",
            isUser ? "text-white" : "text-blue-600"
          )}
        >
          {children}
        </a>
      );
    },
    p({ children }: any) {
      return <p className="mb-2 last:mb-0">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc list-inside mb-2">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal list-inside mb-2">{children}</ol>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote className={cn(
          "border-l-4 pl-3 my-2",
          isUser ? "border-white/50" : "border-gray-400"
        )}>
          {children}
        </blockquote>
      );
    },
  }), [isUser]);
  
  return (
    <>
      <div
        ref={ref}
        className={cn(
          "flex items-end gap-2",
          isUser ? "justify-end" : "justify-start",
          "relative"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isSwping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Avatar for assistant messages */}
        {!isUser && showAvatar && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-blue-500 to-purple-600",
            !isGroupEnd && "opacity-0"
          )}>
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
        
        {/* Message bubble */}
        <div
          ref={messageRef}
          onTouchStart={(e) => {
            setIsPressed(true);
            if (longPressHandlers.onTouchStart) {
              longPressHandlers.onTouchStart(e.nativeEvent);
            }
          }}
          onTouchEnd={(e) => {
            setIsPressed(false);
            if (longPressHandlers.onTouchEnd) {
              longPressHandlers.onTouchEnd(e.nativeEvent);
            }
          }}
          onMouseDown={(e) => {
            setIsPressed(true);
            if (longPressHandlers.onMouseDown) {
              longPressHandlers.onMouseDown(e.nativeEvent);
            }
          }}
          onMouseUp={(e) => {
            setIsPressed(false);
            if (longPressHandlers.onMouseUp) {
              longPressHandlers.onMouseUp(e.nativeEvent);
            }
          }}
          onMouseLeave={() => {
            setIsPressed(false);
            if (longPressHandlers.onMouseLeave) {
              longPressHandlers.onMouseLeave();
            }
          }}
          onClick={handleDoubleTap}
          className={bubbleStyles}
        >
          {/* Timestamp */}
          {showTimestamp && currentTime && (
            <div className={cn(
              "text-xs mb-1",
              isUser ? "text-white/70" : "text-gray-500"
            )}>
              {currentTime}
            </div>
          )}
          
          {/* Message content */}
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser && "prose-invert"
          )}>
            <ReactMarkdown components={markdownComponents}>
              {messageText}
            </ReactMarkdown>
          </div>
          
          {/* Annotations and images */}
          {message.content[0]?.annotations?.filter(
            (a) => a.type === "container_file_citation" && a.filename && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
          ).map((a, i) => (
            <img
              key={i}
              src={`/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`}
              alt={a.filename || ""}
              className="mt-2 rounded-lg max-w-full"
              loading="lazy"
            />
          ))}
          
          {/* Message tail (iOS style) */}
          {isGroupEnd && platform === "ios" && (
            <div
              className={cn(
                "absolute bottom-0 w-0 h-0",
                isUser ? [
                  "right-[-6px]",
                  "border-l-[6px] border-l-blue-500",
                  "border-t-[8px] border-t-transparent",
                  "border-b-[8px] border-b-transparent"
                ] : [
                  "left-[-6px]",
                  "border-r-[6px] border-r-gray-200",
                  "border-t-[8px] border-t-transparent",
                  "border-b-[8px] border-b-transparent"
                ]
              )}
            />
          )}
          
          {/* Like indicator */}
          {isLiked && (
            <div className={cn(
              "absolute -bottom-2 -right-2",
              "bg-white rounded-full shadow-sm p-1",
              likeAnimation && "animate-bounce"
            )}>
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
        
        {/* Message status (user messages only) */}
        {isUser && isGroupEnd && (
          <div className="flex-shrink-0 ml-1 mb-1">
            {messageStatus === "sending" ? (
              <Clock className="h-3 w-3 text-gray-400" />
            ) : messageStatus === "sent" ? (
              <Check className="h-3 w-3 text-gray-400" />
            ) : messageStatus === "delivered" ? (
              <CheckCheck className="h-3 w-3 text-gray-400" />
            ) : messageStatus === "read" ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : messageStatus === "failed" ? (
              <AlertCircle className="h-3 w-3 text-red-500" />
            ) : null}
          </div>
        )}
        
        {/* Avatar for user messages (optional) */}
        {isUser && showAvatar && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-green-500 to-blue-600",
            !isGroupEnd && "opacity-0"
          )}>
            <User className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      
      {/* Swipe action indicators */}
      {Math.abs(swipeOffset) > 20 && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2",
          swipeOffset > 0 ? "left-4" : "right-4",
          "animate-pulse"
        )}>
          {swipeOffset > 0 ? (
            <Reply className="h-5 w-5 text-blue-500" />
          ) : (
            <Trash2 className="h-5 w-5 text-red-500" />
          )}
        </div>
      )}
      
      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className={cn(
            "fixed z-50 min-w-[180px] py-1",
            platform === "ios" ? [
              "bg-white/95 backdrop-blur-xl rounded-2xl",
              "shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
            ] : [
              "bg-white rounded-lg shadow-lg border border-gray-200"
            ],
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
          style={{
            left: Math.min(contextMenuPosition.x, window.innerWidth - 200),
            top: contextMenuPosition.y,
          }}
        >
          {contextMenuOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3",
                "transition-colors duration-150",
                "active:scale-[0.98]",
                platform === "ios" ? [
                  "hover:bg-gray-100",
                  index < contextMenuOptions.length - 1 && "border-b border-gray-200"
                ] : [
                  "hover:bg-gray-50"
                ],
                option.destructive && "text-red-600"
              )}
            >
              {option.icon}
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Global styles */}
      <style jsx global>{`
        @keyframes fade-in-0 {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes zoom-in-95 {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in-0 0.2s ease-out;
        }
      `}</style>
    </>
  );
});

MessageBubble.displayName = "MessageBubble";

export default React.memo(MessageBubble);