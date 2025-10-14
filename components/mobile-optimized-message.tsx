"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { 
  Copy, 
  RotateCcw, 
  Share, 
  Heart, 
  Trash2, 
  Reply, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Bot,
  Download,
  Expand
} from 'lucide-react';
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { MessageItem } from "@/lib/assistant";
import { format } from "date-fns";
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
  const [platform, setPlatform] = useState<"ios" | "android" | "other">(propPlatform || "other");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [messageTime, setMessageTime] = useState<string>('');
  const [imageExpanded, setImageExpanded] = useState<string | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
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
  
  // Set message time (client-side only to avoid hydration mismatch)
  useEffect(() => {
    // Use the message's actual timestamp if available, otherwise use current time as fallback
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
    setShowContextMenu(false);
    haptic.trigger("light");
    
    // Show toast with better mobile styling
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/90 text-white px-5 py-3 rounded-full z-50 text-sm font-medium animate-slide-up backdrop-blur-md shadow-lg';
    toast.textContent = 'Copied to clipboard';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-slide-down');
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }, [messageText]);
  
  // Handle share with native share API
  const handleShare = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        haptic.trigger("selection");
        await navigator.share({ text: messageText });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    setShowContextMenu(false);
  }, [messageText]);
  
  // Handle delete with haptic feedback
  const handleDelete = useCallback(() => {
    haptic.trigger("warning");
    onDelete?.();
    setShowContextMenu(false);
  }, [onDelete]);
  
  // Handle like/reaction with animation
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    setLikeAnimation(true);
    haptic.trigger("impact");
    setTimeout(() => setLikeAnimation(false), 600);
  }, [isLiked]);
  
  // Double tap handler for quick actions
  const handleDoubleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      handleLike();
      doubleTapRef.current = 0;
    } else {
      doubleTapRef.current = now;
    }
  }, [handleLike]);
  
  // Context menu options with mobile-optimized icons
  const contextMenuOptions = useMemo(() => {
    const options = [
      {
        label: 'Copy',
        icon: <Copy className="h-5 w-5" />,
        action: handleCopy,
      }
    ];
    
    if (onReply) {
      options.push({
        label: 'Reply',
        icon: <Reply className="h-5 w-5" />,
        action: () => {
          haptic.trigger("selection");
          onReply();
          setShowContextMenu(false);
        },
      });
    }
    
    if (!isUser && onRegenerate) {
      options.push({
        label: 'Regenerate',
        icon: <RotateCcw className="h-5 w-5" />,
        action: () => {
          haptic.trigger("selection");
          onRegenerate();
          setShowContextMenu(false);
        },
      });
    }
    
    if (typeof window !== 'undefined' && navigator.share) {
      options.push({
        label: 'Share',
        icon: <Share className="h-5 w-5" />,
        action: handleShare,
      });
    }
    
    options.push({
      label: isLiked ? 'Unlike' : 'Like',
      icon: <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />,
      action: () => {
        handleLike();
        setShowContextMenu(false);
      },
    });
    
    if (onDelete) {
      options.push({
        label: 'Delete',
        icon: <Trash2 className="h-5 w-5 text-red-500" />,
        action: handleDelete,
        destructive: true,
      });
    }
    
    return options;
  }, [isUser, isLiked, onRegenerate, onReply, onDelete, handleCopy, handleShare, handleDelete, handleLike]);
  
  // Long press handler with haptic feedback
  const handleLongPress = useCallback((event: TouchEvent | MouseEvent) => {
    haptic.trigger("medium");
    setIsPressed(false);
    
    const rect = messageRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;
      
      // Position menu above the touch point with better mobile positioning
      const menuY = clientY - 120;
      const menuX = Math.min(Math.max(clientX, 100), window.innerWidth - 100);
      
      setContextMenuPosition({
        x: menuX,
        y: Math.max(menuY, 50), // Ensure menu doesn't go off top of screen
      });
      setShowContextMenu(true);
    }
  }, []);
  
  const { handlers: longPressHandlers } = useLongPress(
    handleLongPress,
    {
      threshold: 400, // Slightly faster activation for mobile
      onCancel: () => setIsPressed(false),
    }
  );
  
  // Swipe gesture for quick actions
  const swipeState = useSwipeGesture(messageRef, {
    threshold: 60,
    onSwipeMove: (deltaX) => {
      if (platform === "ios" && deltaX > 0 && onReply) {
        // iOS style: swipe right to reply
        setSwipeOffset(Math.min(deltaX * 0.8, 80));
      } else if (deltaX < 0 && onDelete) {
        // Swipe left to delete (both platforms)
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
      // Spring back animation
      setSwipeOffset(0);
    },
  });
  
  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
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
  
  // Custom markdown components with mobile optimization
  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div className="my-3 rounded-xl overflow-hidden bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
              <span className="font-medium">{language}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                  haptic.trigger("selection");
                }}
                className="hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!my-0 !bg-gray-900 text-sm"
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
            "px-1.5 py-0.5 rounded-md text-sm",
            isUser ? "bg-blue-600/30" : "bg-gray-200"
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
            "underline font-medium min-h-[44px] inline-flex items-center",
            isUser ? "text-blue-100" : "text-blue-600"
          )}
        >
          {children}
        </a>
      );
    },
    p({ children }: any) {
      return <p className="mb-3 last:mb-0 leading-relaxed text-base">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote className={cn(
          "border-l-4 pl-4 my-3 italic",
          isUser ? "border-blue-300/50" : "border-gray-400"
        )}>
          {children}
        </blockquote>
      );
    },
  }), [isUser]);
  
  return (
    <>
      {/* Message container with swipe animation */}
      <div
        ref={ref}
        className={cn(
          "relative flex items-end gap-2 px-4",
          isUser ? "justify-end" : "justify-start",
          isGroupStart ? "mt-4" : "mt-1.5",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isSwping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          opacity: 1,
          animation: index < 20 ? `messageSlideIn ${300 + index * 50}ms ease-out` : undefined,
        }}
      >
        {/* Avatar for assistant messages */}
        {!isUser && showAvatar && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-purple-500 to-blue-600 shadow-sm",
            !isGroupEnd && "invisible"
          )}>
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
        
        {/* Message bubble with mobile-optimized styling */}
        <div
          ref={messageRef}
          {...longPressHandlers}
          onClick={handleDoubleTap}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          className={cn(
            "relative max-w-[85%] rounded-2xl transition-all duration-200",
            "min-h-[44px] px-4 py-2.5 flex flex-col justify-center",
            "touch-manipulation select-text cursor-pointer",
            isPressed && "scale-[0.98] opacity-90",
            
            // Platform-specific message bubble styles
            isUser ? [
              platform === "ios" ? "bg-blue-500 text-white" : "bg-blue-600 text-white shadow-sm",
              isGroupEnd && platform === "ios" && "rounded-br-[6px]",
              isGroupEnd && platform === "android" && "rounded-br-[8px]",
            ] : [
              platform === "ios" ? "bg-gray-100 text-gray-900" : "bg-white text-gray-900 shadow-sm border border-gray-100",
              isGroupEnd && platform === "ios" && "rounded-bl-[6px]",
              isGroupEnd && platform === "android" && "rounded-bl-[8px]",
            ]
          )}
        >
          {/* Message content with proper typography */}
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "prose-invert" : "prose-gray",
            "text-base leading-relaxed"
          )}>
            <ReactMarkdown components={markdownComponents}>
              {messageText}
            </ReactMarkdown>
          </div>
          
          {/* Images with mobile-optimized display */}
          {hasImages && message.content[0]?.annotations?.filter(
            (a) => a.type === "container_file_citation" && a.filename && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
          ).map((a, i) => {
            const imageUrl = `/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`;
            const isExpanded = imageExpanded === imageUrl;
            
            return (
              <div key={i} className="mt-3">
                <img
                  src={imageUrl}
                  alt={a.filename || ""}
                  className={cn(
                    "rounded-lg transition-all duration-300",
                    isExpanded ? "max-w-none w-full" : "max-w-full cursor-zoom-in"
                  )}
                  loading="lazy"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.trigger("selection");
                    setImageExpanded(isExpanded ? null : imageUrl);
                  }}
                />
                {!isExpanded && (
                  <button
                    className="mt-2 text-xs opacity-70 flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.trigger("selection");
                      setImageExpanded(imageUrl);
                    }}
                  >
                    <Expand className="h-3 w-3" />
                    Tap to expand
                  </button>
                )}
              </div>
            );
          })}
          
          {/* Timestamp and status with mobile-friendly size */}
          {showTimestamp && messageTime && (
            <div className={cn(
              "flex items-center gap-2 mt-2 text-xs",
              isUser ? "text-blue-100/70 justify-end" : "text-gray-500"
            )}>
              <span>{messageTime}</span>
              {isUser && (
                <>
                  {messageStatus === 'sending' && <Clock className="h-3 w-3" />}
                  {messageStatus === 'sent' && <Check className="h-3 w-3" />}
                  {messageStatus === 'delivered' && <CheckCheck className="h-3 w-3" />}
                  {messageStatus === 'read' && <CheckCheck className="h-3 w-3 text-blue-200" />}
                  {messageStatus === 'failed' && <AlertCircle className="h-3 w-3 text-red-300" />}
                </>
              )}
            </div>
          )}
          
          {/* Message tail for iOS style */}
          {isGroupEnd && platform === "ios" && (
            <div
              className={cn(
                "absolute bottom-0 w-0 h-0",
                isUser ? [
                  "right-[-6px]",
                  "border-l-[6px] border-l-blue-500",
                  "border-t-[8px] border-t-transparent",
                  "border-b-[0px]"
                ] : [
                  "left-[-6px]",
                  "border-r-[6px] border-r-gray-100",
                  "border-t-[8px] border-t-transparent",
                  "border-b-[0px]"
                ]
              )}
            />
          )}
          
          {/* Like indicator with animation */}
          {isLiked && (
            <div className={cn(
              "absolute -bottom-2 -right-2",
              "bg-white rounded-full shadow-md p-1.5",
              likeAnimation && "animate-bounce"
            )}>
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
        
        {/* Avatar for user messages (optional) */}
        {isUser && showAvatar && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-green-500 to-blue-500 shadow-sm",
            !isGroupEnd && "invisible"
          )}>
            <User className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      
      {/* Swipe action indicators */}
      {Math.abs(swipeOffset) > 30 && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2",
          swipeOffset > 0 ? "left-6" : "right-6",
          "animate-pulse"
        )}>
          {swipeOffset > 0 ? (
            <Reply className="h-6 w-6 text-blue-500" />
          ) : (
            <Trash2 className="h-6 w-6 text-red-500" />
          )}
        </div>
      )}
      
      {/* Context Menu with mobile-optimized design */}
      {showContextMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in backdrop-blur-sm"
            onClick={() => setShowContextMenu(false)}
          />
          
          {/* Menu */}
          <div
            ref={contextMenuRef}
            className={cn(
              "fixed z-50 min-w-[200px] py-2",
              platform === "ios" ? [
                "bg-white/95 backdrop-blur-xl rounded-2xl",
                "shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
              ] : [
                "bg-white rounded-xl shadow-2xl border border-gray-100"
              ],
              "animate-scale-in"
            )}
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {contextMenuOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={option.action}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5",
                  "min-h-[48px] transition-colors duration-150",
                  "active:scale-[0.98] touch-manipulation",
                  platform === "ios" ? [
                    "hover:bg-gray-100",
                    idx < contextMenuOptions.length - 1 && "border-b border-gray-100"
                  ] : [
                    "hover:bg-gray-50"
                  ],
                  option.destructive && "text-red-600"
                )}
              >
                {option.icon}
                <span className="text-base font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* CSS animations */}
      <style jsx>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
});

MobileOptimizedMessage.displayName = "MobileOptimizedMessage";

export default React.memo(MobileOptimizedMessage);