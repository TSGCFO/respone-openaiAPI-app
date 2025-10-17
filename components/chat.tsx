"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Item } from "@/lib/assistant";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import useConversationStore from "@/stores/useConversationStore";
import { cn } from "@/lib/utils";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onRegenerateMessage?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
  onRegenerateMessage,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100vh");
  const { isAssistantLoading } = useConversationStore();
  
  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Handle viewport height for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      // Use visualViewport if available (more accurate on mobile)
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(`${vh}px`);
    };

    updateViewportHeight();
    
    // Listen to viewport changes
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    
    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  // Load more messages handler (for pull-to-refresh)
  const handleLoadMore = useCallback(async () => {
    // TODO: Implement loading older messages
    console.log("Loading more messages...");
    
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would:
    // 1. Fetch older messages from the API
    // 2. Prepend them to the items array
    // 3. Maintain scroll position
  }, []);

  return (
    <div 
      className={cn(
        "relative w-full bg-gray-50",
        "flex flex-col"
      )}
      style={{
        height: viewportHeight,
        // Account for safe areas on mobile devices
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Message List - Mobile First Responsive */}
      <div className={cn(
        "flex-1 overflow-hidden",
        // Mobile (default): Account for bottom navigation
        "pb-16",
        // Tablet: Larger bottom padding
        "md:pb-20",
        // Desktop: No bottom padding (side nav instead)
        "lg:pb-0"
      )}>
        <MessageList
          items={items}
          isLoading={isAssistantLoading}
          onApprovalResponse={onApprovalResponse}
          onRegenerateMessage={onRegenerateMessage}
          onLoadMore={handleLoadMore}
          className="h-full"
        />
      </div>

      {/* Message Input - Mobile First Responsive */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isAssistantLoading}
        className={cn(
          // Mobile (default): Position above bottom navigation
          "pb-16",
          // Tablet: Larger padding
          "md:pb-20",
          // Desktop: No bottom padding
          "lg:pb-0",
          // Desktop: Add max-width
          "lg:max-w-4xl lg:mx-auto",
          // Large Desktop: Wider max-width
          "xl:max-w-5xl",
          // Extra Large Desktop: Even wider
          "2xl:max-w-6xl"
        )}
        placeholder={isMobile ? "Message..." : "Type a message..."}
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
        
        /* Prevent text selection on touch devices for better UX */
        @media (hover: none) and (pointer: coarse) {
          .touch-none {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        /* Prevent layout shift when keyboard appears */
        @supports (height: 100dvh) {
          .h-screen-safe {
            height: 100dvh;
          }
        }
        
        /* Material Design ripple effect */
        .ripple {
          position: relative;
          overflow: hidden;
        }
        
        .ripple::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .ripple:active::after {
          width: 300px;
          height: 300px;
        }
      `}</style>
    </div>
  );
};

export default Chat;