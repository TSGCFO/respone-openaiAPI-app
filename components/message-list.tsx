"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Item, McpApprovalRequestItem, MessageItem } from "@/lib/assistant";
import MessageBubble from "./message-bubble";
import ToolCall from "./tool-call";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import LoadingMessage from "./loading-message";
import TypingIndicator from "./typing-indicator";
import { ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface MessageListProps {
  items: Item[];
  isLoading?: boolean;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onRegenerateMessage?: () => void;
  onLoadMore?: () => Promise<void>;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  items,
  isLoading = false,
  onApprovalResponse,
  onRegenerateMessage,
  onLoadMore,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  
  // Scroll settings (no virtual scrolling for better mobile performance)
  const scrollThreshold = 100; // Distance from bottom to trigger auto-scroll

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    if (onLoadMore) {
      haptic.trigger("light");
      setIsLoadingMore(true);
      await onLoadMore();
      setIsLoadingMore(false);
      haptic.trigger("success");
    }
  }, [onLoadMore]);

  const { isRefreshing, pullIndicatorOffset, pullIndicatorOpacity } = usePullToRefresh(
    scrollContainerRef,
    handleRefresh,
    {
      threshold: 80,
      resistance: 2.5
    }
  );

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Check if at bottom
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
    handleScroll(); // Initial calculation

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Process messages for grouping
  const processedMessages = useMemo(() => {
    const messages = items.filter(item => item.type === "message") as MessageItem[];
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
        
        // Show timestamp only at the start of message groups
        const showTimestamp = isGroupStart;
        
        // Show avatar only for the last message in a group (for assistant messages)
        const showAvatar = isGroupEnd && item.role === "assistant";
        
        processed.push({
          item,
          isGroupStart,
          isGroupEnd,
          showTimestamp,
          showAvatar,
        });
      } else {
        // Non-message items
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
  
  // Render message item
  const renderItem = useCallback((processedItem: typeof processedMessages[0], index: number) => {
    const { item, isGroupStart, isGroupEnd, showTimestamp, showAvatar } = processedItem;
    const key = `message-${index}`;
    
    return (
      <div 
        key={key}
        className={cn(
          "animate-in fade-in-0 slide-in-from-bottom-1",
          "duration-200 ease-out"
        )}
        style={{
          animationDelay: `${Math.min(index * 50, 200)}ms`,
          animationFillMode: "backwards"
        }}
      >
        {item.type === "tool_call" ? (
          <ToolCall toolCall={item} />
        ) : item.type === "message" ? (
          <div className="flex flex-col">
            <MessageBubble
              message={item}
              onRegenerate={item.role === "assistant" ? onRegenerateMessage : undefined}
              isGroupStart={isGroupStart}
              isGroupEnd={isGroupEnd}
              showTimestamp={showTimestamp}
              showAvatar={showAvatar}
              platform={platform}
              messageStatus="sent"
            />
            {item.content &&
              item.content[0].annotations &&
              item.content[0].annotations.length > 0 && 
              item.content[0].annotations.some(
                (a) => a.type !== "container_file_citation" ||
                !a.filename || !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
              ) && (
                <Annotations annotations={item.content[0].annotations} />
              )}
          </div>
        ) : item.type === "mcp_list_tools" ? (
          <McpToolsList item={item} />
        ) : item.type === "mcp_approval_request" ? (
          <McpApproval
            item={item as McpApprovalRequestItem}
            onRespond={onApprovalResponse}
          />
        ) : null}
      </div>
    );
  }, [onApprovalResponse, onRegenerateMessage, platform]);


  return (
    <div className={cn("relative h-full", className)}>
      {/* Pull to Refresh Indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 z-20",
          "flex justify-center items-center h-20",
          "transition-transform duration-200",
          platform === "ios" && "pt-safe"
        )}
        style={{
          transform: `translateY(${pullIndicatorOffset - 80}px)`,
          opacity: pullIndicatorOpacity
        }}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-2",
          "bg-white/90 backdrop-blur-sm rounded-full shadow-sm",
          isRefreshing && "animate-pulse"
        )}>
          <RefreshCw className={cn(
            "h-4 w-4 text-gray-600",
            isRefreshing && "animate-spin"
          )} />
          <span className="text-sm text-gray-600">
            {isRefreshing ? "Loading..." : "Pull to load earlier messages"}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "h-full overflow-y-auto overflow-x-hidden",
          "overscroll-behavior-y-contain",
          // Mobile optimizations for smooth scrolling
          "-webkit-overflow-scrolling-touch",
          "scroll-smooth"
        )}
        style={{
          WebkitOverflowScrolling: "touch"
        }}
      >
        {/* Messages - Mobile First Responsive */}
        <div className={cn(
          // Mobile (default): Small padding
          "px-2",
          // Small mobile: Slightly more padding
          "sm:px-4",
          // Tablet: Medium padding
          "md:px-6",
          // Desktop: Larger padding with max-width
          "lg:px-8 lg:max-w-4xl lg:mx-auto",
          // Large Desktop: Even larger max-width
          "xl:max-w-5xl",
          // Extra Large Desktop: Maximum width
          "2xl:max-w-6xl",
          // Add padding at bottom for input
          "pb-4"
        )}>
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading earlier messages...</span>
              </div>
            </div>
          )}

          {/* All messages - no virtual scrolling */}
          <div className="space-y-4 py-4">
            {processedMessages.map((item, index) => 
              renderItem(item, index)
            )}
          </div>

          {/* Loading state */}
          {isLoading && <TypingIndicator platform={platform} />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Scroll to Bottom FAB */}
      {showScrollButton && (
        <button
          onClick={() => {
            haptic.trigger("selection");
            scrollToBottom();
          }}
          className={cn(
            "fixed bottom-32 right-4 lg:bottom-24 lg:right-8 z-20",
            "min-w-[48px] min-h-[48px] rounded-full",
            "bg-white shadow-lg border",
            "flex items-center justify-center",
            "active:scale-90 transition-all duration-200",
            "hover:shadow-xl",
            "animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5 text-gray-700" />
          {/* Unread indicator */}
          {!isAtBottom && items.length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full animate-pulse" />
          )}
        </button>
      )}

      <style jsx global>{`
        @keyframes slide-in-from-bottom-1 {
          from {
            transform: translateY(0.25rem);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slide-in-from-bottom-2 {
          from {
            transform: translateY(0.5rem);
          }
          to {
            transform: translateY(0);
          }
        }

        @supports (-webkit-touch-callout: none) {
          .touch-pan-y {
            touch-action: pan-y;
          }
          
          .-webkit-overflow-scrolling-touch {
            -webkit-overflow-scrolling: touch;
          }
        }

        .pt-safe {
          padding-top: env(safe-area-inset-top, 0);
        }

        .overscroll-behavior-y-contain {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
};