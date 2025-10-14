"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import EnhancedChat from "./enhanced-chat";
import { ConversationSidebar } from "./conversation-sidebar";
import { ConversationBottomSheet } from "./conversation-bottom-sheet";
import { SemanticSearch } from "./semantic-search";
import { FloatingActionButton } from "./floating-action-button";
import { Menu, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import useConversationStore from "@/stores/useConversationStore";
import useNavigationStore from "@/stores/useNavigationStore";
import { Item, processMessages } from "@/lib/assistant";
import haptic from "@/lib/haptic";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const { 
    chatMessages, 
    addConversationItem, 
    addChatMessage, 
    setAssistantLoading,
    isAssistantLoading,
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
  const [showFAB, setShowFAB] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [conversationList, setConversationList] = useState<Array<{ id: number; title: string; createdAt: string }>>([]);
  
  const { activeTab } = useNavigationStore();

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

  // Fetch conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversationList(data.conversations || []);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, [currentConversationId]);

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
      
      // Extract facts and create semantic memory intelligently
      const { extractFactsFromMessage, generateSmartSummary, calculateImportance } = await import('@/lib/memory-extraction');
      const facts = await extractFactsFromMessage(message);
      
      // Only create memory if we found important facts or it's a significant message
      if (facts.length > 0 || message.length > 50 || message.includes('?')) {
        const summary = generateSmartSummary(message, facts);
        const importance = calculateImportance(message, facts);
        
        // Create a semantic memory with intelligent extraction
        await createSemanticMemory(message, summary, {
          importance,
          metadata: {
            facts: facts.map(f => ({ fact: f.fact, type: f.type })),
            timestamp: new Date().toISOString()
          }
        });
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
  
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    // Filter out the deleted message from chat messages
    const filteredMessages = chatMessages.filter((item, index) => {
      if (item.type === 'message') {
        const id = (item as any).id || `${(item as any).role}-${index}`;
        return id !== messageId;
      }
      return true;
    });
    
    // Update the store
    useConversationStore.getState().setChatMessages(filteredMessages);
    
    haptic.trigger('success');
  }, [chatMessages]);
  
  const onRegenerateMessage = useCallback(async () => {
    // Find the last assistant message and regenerate it
    const lastAssistantIndex = chatMessages.findLastIndex(
      item => item.type === 'message' && (item as any).role === 'assistant'
    );
    
    if (lastAssistantIndex !== -1) {
      // Remove the last assistant message
      const newMessages = chatMessages.slice(0, lastAssistantIndex);
      useConversationStore.getState().setChatMessages(newMessages);
      
      // Regenerate response
      haptic.trigger('medium');
      setAssistantLoading(true);
      
      try {
        await processMessages();
        haptic.trigger('success');
      } catch (error) {
        console.error('Failed to regenerate message:', error);
        haptic.trigger('error');
      } finally {
        setAssistantLoading(false);
      }
    }
  }, [chatMessages, setAssistantLoading]);

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
  
  // Scroll detection to show/hide FAB
  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const handleScroll = () => {
      const scrollTop = chatContainerRef.current?.scrollTop || 0;
      
      // Show FAB when scrolling up, hide when scrolling down
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        setShowFAB(false); // Scrolling down
      } else {
        setShowFAB(true); // Scrolling up or at top
      }
      
      setLastScrollTop(scrollTop);
    };
    
    const scrollElement = chatContainerRef.current;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollTop]);
  
  // Keyboard detection
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
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
      // Delay to prevent flicker when switching between inputs
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          setIsKeyboardVisible(false);
        }
      }, 100);
    };
    
    // Multiple detection methods for better compatibility
    window.visualViewport?.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
  
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
      {/* Desktop Sidebar - Mobile First Responsive */}
      <div className={cn(
        // Mobile/Tablet (default): Hidden
        "hidden",
        // Desktop: Show sidebar
        "lg:block lg:flex-shrink-0",
        // Desktop: Base width
        "lg:w-64",
        // Large Desktop: Wider
        "xl:w-72",
        // Extra Large Desktop: Even wider
        "2xl:w-80"
      )}>
        <ConversationSidebar
          currentConversationId={currentConversationId ?? undefined}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Area - Mobile First Responsive */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - Mobile First Responsive */}
        <div className={cn(
          "border-b flex items-center gap-2 flex-shrink-0",
          // Mobile (default): Small padding
          "p-2",
          // Tablet: Medium padding
          "md:p-3",
          // Desktop: Larger padding
          "lg:p-4"
        )}>
          {/* Mobile/Tablet: Bottom Sheet Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenBottomSheet}
            className={cn(
              // Mobile/Tablet: Show
              "block",
              // Desktop: Hide
              "lg:hidden",
              // Touch target size
              "min-w-[44px] min-h-[44px]"
            )}
            aria-label="Open conversations"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <SemanticSearch
            currentConversationId={currentConversationId ?? undefined}
            onSelectResult={handleSearchResultSelect}
          />
          
          {/* Current conversation indicator - Responsive */}
          {currentConversationId && (
            <div className={cn(
              "flex-1 truncate text-center",
              // Mobile (default): Small text
              "text-xs text-muted-foreground",
              // Tablet: Medium text
              "md:text-sm",
              // Desktop: Hide (sidebar shows it)
              "lg:hidden"
            )}>
              Conversation #{currentConversationId}
            </div>
          )}
        </div>
        
        {/* Chat content - Mobile First Responsive */}
        <div 
          ref={chatContainerRef}
          className="flex-1 min-h-0 overflow-hidden bg-white"
        >
          <EnhancedChat
            items={chatMessages}
            onSendMessage={handleSendMessage}
            onApprovalResponse={handleApprovalResponse}
            onRegenerateMessage={onRegenerateMessage}
            onDeleteMessage={handleDeleteMessage}
            conversationList={conversationList}
            onConversationChange={handleSelectConversation}
            isLoading={isAssistantLoading}
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
      
      {/* Floating Action Button - render outside main layout */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-20 right-4 md:bottom-24 lg:bottom-8 lg:right-8 z-50">
          <FloatingActionButton
            onNewConversation={() => {
              handleNewConversation();
              // Close bottom sheet if open
              setIsBottomSheetOpen(false);
            }}
            onVoiceChat={() => {
              // Voice chat placeholder
              console.log('Voice chat initiated');
            }}
            onImportDocument={() => {
              // Import document placeholder
              console.log('Import document initiated');
            }}
            hide={!showFAB || isKeyboardVisible || isBottomSheetOpen}
          />
        </div>
      )}
    </div>
  );
}
