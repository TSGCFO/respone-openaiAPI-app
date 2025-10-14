"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Item, McpApprovalRequestItem, MessageItem } from "@/lib/assistant";
import MobileOptimizedMessage from "./mobile-optimized-message";
import ToolCall from "./tool-call";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import LoadingMessage from "./loading-message";
import MobileTypingIndicator from "./mobile-typing-indicator";
import { ChevronDown, RefreshCw, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { useEnhancedPullToRefresh } from "@/hooks/useEnhancedPullToRefresh";

interface MessageListProps {
  items: Item[];
  isLoading?: boolean;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onRegenerateMessage?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onLoadMore?: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
  items,
  isLoading = false,
  onApprovalResponse,
  onRegenerateMessage,
  onDeleteMessage,
  onLoadMore,
  className,
  disabled = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  
  const scrollThreshold = 200;

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }
  }, []);

  // Enhanced pull to refresh
  const handleRefresh = useCallback(async () => {
    if (disabled || !onLoadMore) return;
    
    haptic.trigger("light");
    try {
      await onLoadMore();
      haptic.trigger("success");
    } catch (error) {
      console.error("Failed to load more messages:", error);
      haptic.trigger("error");
    }
  }, [onLoadMore, disabled]);

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

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    const atBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && scrollTop > 500);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? "smooth" : "instant",
      block: "end" 
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [items.length, isAtBottom, scrollToBottom]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Process messages for grouping with memoization
  const processedMessages = useMemo(() => {
    const processed: Array<{
      item: Item;
      isGroupStart: boolean;
      isGroupEnd: boolean;
      showTimestamp: boolean;
      showAvatar: boolean;
    }> = [];
    
    items.forEach((item, index) => {
      if (item.type === "message") {
        const prevItem = index > 0 ? items[index - 1] : null;
        const nextItem = index < items.length - 1 ? items[index + 1] : null;
        
        const isPrevSameRole = prevItem?.type === "message" && prevItem.role === item.role;
        const isNextSameRole = nextItem?.type === "message" && nextItem.role === item.role;
        
        const isGroupStart = !isPrevSameRole;
        const isGroupEnd = !isNextSameRole;
        
        processed.push({
          item,
          isGroupStart,
          isGroupEnd,
          showTimestamp: isGroupEnd,
          showAvatar: isGroupEnd,
        });
      } else {
        processed.push({
          item,
          isGroupStart: false,
          isGroupEnd: false,
          showTimestamp: false,
          showAvatar: false,
        });
      }
    });
    
    return processed;
  }, [items]);

  return (
    <div className={cn("relative h-full", className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex justify-center items-center z-20",
          "transition-all duration-300",
          "pointer-events-none"
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
            <Loader2 
              className="h-5 w-5 text-blue-500 animate-spin" 
            />
          ) : (
            <RefreshCw
              className={cn(
                "h-5 w-5 transition-all duration-200",
                canRefresh ? "text-blue-500" : "text-gray-400"
              )}
              style={{
                transform: `rotate(${rotation}deg) scale(${0.8 + pullProgress * 0.2})`,
              }}
            />
          )}
        </div>
        
        {/* Pull progress indicator */}
        {isPulling && !isRefreshing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{
                width: `${Math.min(100, pullProgress * 100)}%`,
              }}
            />
          </div>
        )}
        
        {/* Status text */}
        {(isPulling || isRefreshing) && (
          <div className="absolute -bottom-6 text-xs text-gray-500 font-medium">
            {isRefreshing 
              ? "Loading..." 
              : canRefresh 
              ? "Release to refresh" 
              : "Pull down to refresh"}
          </div>
        )}
      </div>

      {/* Messages container with optimized scrolling */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "h-full overflow-y-auto scroll-smooth message-list-scroll",
          "pt-4 safe-padding-bottom",
          platform === 'ios' && "ios-scroll",
          disabled && "pointer-events-none opacity-75"
        )}
        style={{
          transform: isPulling && !isRefreshing 
            ? `translateY(${Math.min(pullDistance * 0.7, 50)}px)` 
            : undefined,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        }}
      >
        {/* Empty state with mobile-optimized design */}
        {items.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 pb-20 px-6">
            <MessageCircle className="h-16 w-16 mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1 text-center text-gray-400">Start a conversation to see messages here</p>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 pb-4">
          {processedMessages.map(({ item, isGroupStart, isGroupEnd, showTimestamp, showAvatar }, index) => {
            if (item.type === "message") {
              const messageItem = item as MessageItem;
              const messageId = (messageItem as any).id || `${messageItem.role}-${index}`;
              
              return (
                <MobileOptimizedMessage
                  key={index}
                  message={messageItem}
                  onRegenerate={
                    messageItem.role === "assistant" ? onRegenerateMessage : undefined
                  }
                  onDelete={() => onDeleteMessage?.(messageId)}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  platform={platform}
                  className="animate-fade-in"
                  index={index}
                />
              );
            } else if (item.type === "tool_call") {
              return (
                <ToolCall
                  key={index}
                  toolCall={item}
                  className="animate-fade-in"
                />
              );
            } else if (item.type === "mcp_tool") {
              return (
                <McpToolsList
                  key={index}
                  tools={(item as any).tools}
                  className="animate-fade-in"
                />
              );
            } else if (item.type === "mcp_approval_request") {
              return (
                <McpApproval
                  key={index}
                  request={item as McpApprovalRequestItem}
                  onResponse={(approved: boolean) => {
                    onApprovalResponse(approved, item.id);
                  }}
                  className="animate-fade-in"
                />
              );
            } else if (item.type === "annotations") {
              return (
                <Annotations
                  key={index}
                  annotations={(item as any).annotations}
                  className="animate-fade-in"
                />
              );
            }
            return null;
          })}
          
          {/* Loading indicator with mobile optimization */}
          {isLoading && (
            <div className="animate-fade-in">
              <MobileTypingIndicator platform={platform} />
            </div>
          )}
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className={cn(
            "absolute bottom-6 right-6 z-30",
            "w-10 h-10 rounded-full",
            "bg-white shadow-lg border border-gray-200",
            "flex items-center justify-center",
            "transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "animate-fade-in"
          )}
        >
          <ChevronDown className="h-5 w-5 text-gray-600" />
        </button>
      )}
      
      {/* Edge effects for iOS */}
      {platform === 'ios' && (
        <>
          {/* Top edge elastic effect */}
          <div 
            className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
            style={{
              background: isPulling 
                ? 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)'
                : 'transparent',
              transition: 'background 0.3s',
            }}
          />
          
          {/* Bottom edge bounce effect */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(249, 250, 251, 0.9), transparent)',
            }}
          />
        </>
      )}
    </div>
  );
});

MessageList.displayName = "MessageList";

export default MessageList;