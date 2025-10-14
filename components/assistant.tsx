"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import Chat from "./chat";
import { ConversationSidebar } from "./conversation-sidebar";
import { ConversationBottomSheet } from "./conversation-bottom-sheet";
import { SemanticSearch } from "./semantic-search";
import { Menu, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";
import haptic from "@/lib/haptic";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const { 
    chatMessages, 
    addConversationItem, 
    addChatMessage, 
    setAssistantLoading,
    saveMessage,
    createSemanticMemory,
    resetConversation,
    loadConversation,
    createNewConversation,
    currentConversationId 
  } = useConversationStore();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userItem: Item = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    };
    const userMessage: any = {
      role: "user",
      content: message.trim(),
    };

    try {
      setAssistantLoading(true);
      addConversationItem(userMessage);
      addChatMessage(userItem);
      
      // Auto-save user message
      await saveMessage("user", message.trim());
      
      // Process the message and get response
      await processMessages();
      
      // Check if this is an important exchange for semantic memory
      if (message.length > 50 || message.includes('?')) {
        const summary = `User asked: ${message.substring(0, 100)}...`;
        await createSemanticMemory(message, summary);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  const handleApprovalResponse = async (
    approve: boolean,
    id: string
  ) => {
    const approvalItem = {
      type: "mcp_approval_response",
      approve,
      approval_request_id: id,
    } as any;
    try {
      addConversationItem(approvalItem);
      await processMessages();
    } catch (error) {
      console.error("Error sending approval response:", error);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    try {
      setAssistantLoading(true);
      await loadConversation(conversation.id);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleNewConversation = useCallback(async () => {
    resetConversation();
    // New conversation will be created when first message is sent
  }, [resetConversation]);

  const handleDeleteConversation = async (id: number) => {
    if (currentConversationId === id) {
      resetConversation();
    }
  };

  const handleSearchResultSelect = useCallback(async (result: any) => {
    // If it's a message from a different conversation, load that conversation
    if (result.conversationId && result.conversationId !== currentConversationId) {
      try {
        setAssistantLoading(true);
        await loadConversation(result.conversationId);
      } catch (error) {
        console.error("Error loading conversation from search:", error);
      } finally {
        setAssistantLoading(false);
      }
    }
    
    // You could also scroll to the specific message or highlight it
    // This would require additional UI logic
  }, [currentConversationId, loadConversation, setAssistantLoading]);


  const handleOpenBottomSheet = () => {
    haptic.trigger('selection');
    setIsBottomSheetOpen(true);
  };
  
  // Ref for swipe gesture on chat area
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  
  // Add swipe right gesture to open bottom sheet on mobile
  useEffect(() => {
    if (!isMobile || !chatContainerRef.current) return;
    
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = Math.abs(endY - startY);
      
      // Detect swipe right from left edge
      if (startX < 50 && deltaX > 100 && deltaY < 50) {
        haptic.trigger('selection');
        setIsBottomSheetOpen(true);
      }
    };
    
    const element = chatContainerRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Show hint after a delay on first visit
    const hintTimeout = setTimeout(() => {
      if (!localStorage.getItem('swipeHintShown')) {
        setShowSwipeHint(true);
        localStorage.setItem('swipeHintShown', 'true');
        setTimeout(() => setShowSwipeHint(false), 3000);
      }
    }, 2000);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(hintTimeout);
    };
  }, [isMobile]);

  const shouldUseBottomSheet = isMobile || (isTablet && window.matchMedia("(orientation: portrait)").matches);

  return (
    <div className="flex h-full relative">
      {/* Desktop Sidebar - Only show on larger screens */}
      {!shouldUseBottomSheet && (
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <ConversationSidebar
            currentConversationId={currentConversationId ?? undefined}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Header with trigger button for mobile/tablet */}
        <div className="border-b p-2 flex items-center gap-2">
          {/* Mobile/Tablet: Bottom Sheet Trigger */}
          {shouldUseBottomSheet && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenBottomSheet}
              className="min-w-[44px] min-h-[44px]"
              aria-label="Open conversations"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          
          {/* Tablet in landscape: Traditional sidebar trigger */}
          {isTablet && !shouldUseBottomSheet && (
            <div className="lg:hidden">
              <ConversationSidebar
                currentConversationId={currentConversationId ?? undefined}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            </div>
          )}
          
          <SemanticSearch
            currentConversationId={currentConversationId ?? undefined}
            onSelectResult={handleSearchResultSelect}
          />
          
          {/* Current conversation indicator on mobile */}
          {isMobile && currentConversationId && (
            <div className="flex-1 text-sm text-muted-foreground truncate text-center">
              Conversation #{currentConversationId}
            </div>
          )}
        </div>
        
        {/* Chat content with swipe gesture support */}
        <div 
          ref={chatContainerRef}
          className="p-4 bg-white flex-1 overflow-auto relative"
        >
          {/* Swipe hint for mobile */}
          {showSwipeHint && isMobile && (
            <div className="absolute left-0 top-4 z-10 animate-pulse">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-r-lg text-sm flex items-center gap-2">
                <span>👉</span>
                <span>Swipe from left edge to open conversations</span>
              </div>
            </div>
          )}
          
          <Chat
            items={chatMessages}
            onSendMessage={handleSendMessage}
            onApprovalResponse={handleApprovalResponse}
          />
        </div>
      </div>

      {/* Bottom Sheet for Mobile/Tablet */}
      {shouldUseBottomSheet && (
        <ConversationBottomSheet
          currentConversationId={currentConversationId ?? undefined}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isBottomSheetOpen}
          onOpenChange={setIsBottomSheetOpen}
        />
      )}
    </div>
  );
}
