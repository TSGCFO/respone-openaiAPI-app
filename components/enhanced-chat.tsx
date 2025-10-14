"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Item } from "@/lib/assistant";
import { MessageInput } from "./message-input";
import MessageList from "./enhanced-message-list";
import useConversationStore from "@/stores/useConversationStore";
import { useConversationSwipe } from "@/hooks/useConversationSwipe";
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EnhancedChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onRegenerateMessage?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  conversationList?: Array<{ id: number; title: string; createdAt: string }>;
  onConversationChange?: (conversationId: number) => void;
  isLoading?: boolean;
}

const EnhancedChat: React.FC<EnhancedChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
  onRegenerateMessage,
  onDeleteMessage,
  conversationList = [],
  onConversationChange,
  isLoading = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100vh");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { currentConversationId, isAssistantLoading } = useConversationStore();
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  
  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Viewport height handling
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(`${vh}px`);
    };

    updateViewportHeight();
    
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    
    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);
  
  // Keyboard detection
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const hasKeyboard = window.visualViewport.height < window.innerHeight - 100;
        setIsKeyboardVisible(hasKeyboard);
      }
    };
    
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardVisible(true);
      }
    };
    
    const handleFocusOut = () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          setIsKeyboardVisible(false);
        }
      }, 100);
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
  
  // Handle conversation change
  const handleConversationSwipe = useCallback((conversationId: number) => {
    haptic.trigger('medium');
    onConversationChange?.(conversationId);
  }, [onConversationChange]);
  
  // Use conversation swipe hook
  const swipeState = useConversationSwipe(chatContainerRef, {
    currentConversationId: currentConversationId ?? undefined,
    conversationList,
    onSwipeToConversation: handleConversationSwipe,
    enabled: !isKeyboardVisible && (isMobile || isTablet),
  });
  
  // Load more messages handler (for pull-to-refresh)
  const handleLoadMore = useCallback(async () => {
    console.log("Loading more messages...");
    
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would:
    // 1. Fetch older messages from the API
    // 2. Prepend them to the items array
    // 3. Maintain scroll position
  }, []);
  
  // Message delete handler
  const handleDeleteMessage = useCallback((messageId: string) => {
    haptic.trigger('medium');
    onDeleteMessage?.(messageId);
  }, [onDeleteMessage]);

  return (
    <div 
      ref={chatContainerRef}
      className={cn(
        "relative w-full bg-gray-50",
        "flex flex-col",
        swipeState.isSwping && "touch-none"
      )}
      style={{
        height: viewportHeight,
        paddingTop: "env(safe-area-inset-top, 0px)",
        ...swipeState.transformStyle,
      }}
    >
      {/* Edge indicator for swiping */}
      {(isMobile || isTablet) && (
        <>
          <div style={swipeState.edgeIndicatorStyle} />
          
          {/* Peek preview of next/previous conversation */}
          {swipeState.peekPreviewStyle && (
            <div style={swipeState.peekPreviewStyle}>
              <div className="text-center">
                {swipeState.direction === 'left' && swipeState.nextConversation && (
                  <>
                    <ChevronLeft className="inline-block mb-2" />
                    <p>{swipeState.nextConversation.title}</p>
                  </>
                )}
                {swipeState.direction === 'right' && swipeState.previousConversation && (
                  <>
                    <ChevronRight className="inline-block mb-2" />
                    <p>{swipeState.previousConversation.title}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Conversation indicator */}
      {currentConversationId && (isMobile || isTablet) && (
        <div className={cn(
          "absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none",
          "transition-opacity duration-300",
          swipeState.isSwping ? "opacity-100" : "opacity-0"
        )}>
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            {swipeState.canSwipeRight && <ChevronLeft size={16} />}
            <span>
              {swipeState.direction === 'left' && swipeState.nextConversation
                ? `→ ${swipeState.nextConversation.title}`
                : swipeState.direction === 'right' && swipeState.previousConversation
                ? `← ${swipeState.previousConversation.title}`
                : conversationList.find(c => c.id === currentConversationId)?.title || 'Current'}
            </span>
            {swipeState.canSwipeLeft && <ChevronRight size={16} />}
          </div>
        </div>
      )}
      
      {/* Message List */}
      <div 
        ref={messageListRef}
        className={cn(
          "flex-1 overflow-hidden",
          // Account for bottom navigation on mobile/tablet
          isMobile || isTablet ? "pb-16 md:pb-20" : "pb-0"
        )}
      >
        <MessageList
          items={items}
          isLoading={isLoading || isAssistantLoading}
          onApprovalResponse={onApprovalResponse}
          onRegenerateMessage={onRegenerateMessage}
          onDeleteMessage={handleDeleteMessage}
          onLoadMore={handleLoadMore}
          className="h-full"
          disabled={swipeState.isSwping}
        />
      </div>

      {/* Message Input - Fixed at bottom */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isLoading || isAssistantLoading || swipeState.isTransitioning}
        className={cn(
          // Position above bottom navigation on mobile/tablet
          isMobile || isTablet ? "pb-16 md:pb-20" : "pb-0",
          // Hide during transition
          swipeState.isTransitioning && "opacity-50 pointer-events-none"
        )}
        placeholder="Type a message..."
        maxLength={5000}
      />

      {/* Global styles for better mobile experience */}
      <style jsx global>{`
        /* Prevent iOS bounce scrolling on the body */
        body {
          position: fixed;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        /* Ensure smooth scrolling */
        * {
          scroll-behavior: smooth;
        }
        
        /* GPU acceleration for transforms */
        .will-change-transform {
          will-change: transform;
          transform: translateZ(0);
        }
        
        /* Prevent text selection during swipe */
        .touch-none {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* iOS-specific fixes */
        @supports (-webkit-touch-callout: none) {
          /* Fix for iOS Safari viewport height */
          .h-viewport {
            height: -webkit-fill-available;
          }
          
          /* Smooth momentum scrolling */
          .scroll-touch {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        /* Hide scrollbars on mobile for cleaner look */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            display: none;
          }
          
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
        
        /* Animations */
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-down {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        /* Edge glow effect */
        @keyframes edge-glow {
          0% {
            box-shadow: inset 0 0 0 0 rgba(59, 130, 246, 0);
          }
          50% {
            box-shadow: inset 10px 0 20px -10px rgba(59, 130, 246, 0.5);
          }
          100% {
            box-shadow: inset 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .edge-glow-left {
          animation: edge-glow 0.5s ease-out;
        }
        
        .edge-glow-right {
          animation: edge-glow 0.5s ease-out;
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
};

export default EnhancedChat;