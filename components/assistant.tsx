"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import EnhancedChat from "./enhanced-chat";
import { ConversationSidebar } from "./conversation-sidebar";
import { ConversationBottomSheet } from "./conversation-bottom-sheet";
import { SemanticSearch } from "./semantic-search";
import { FloatingActionButton } from "./floating-action-button";
import { 
  Box, 
  Container, 
  IconButton, 
  Typography,
  useTheme,
  Paper,
  AppBar,
  Toolbar
} from "@mui/material";
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Forum as MessageSquareIcon
} from "@mui/icons-material";
import useConversationStore from "@/stores/useConversationStore";
import useNavigationStore from "@/stores/useNavigationStore";
import { Item, MessageItem, processMessages } from "@/lib/assistant";
import haptic from "@/lib/haptic";

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
      metadata: {
        timestamp: new Date().toISOString()
      }
    } as MessageItem;
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
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Desktop Sidebar - Mobile First Responsive */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          flexShrink: 0,
          width: {
            lg: 256, // 256px for desktop
            xl: 288 // 288px for large desktop
          }
        }}
      >
        <ConversationSidebar
          currentConversationId={currentConversationId ?? undefined}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </Box>

      {/* Main Chat Area - Mobile First Responsive */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header - Mobile First Responsive */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Toolbar
            sx={{
              gap: 1,
              minHeight: { xs: 48, sm: 56, md: 64 },
              px: { xs: 1, sm: 2, md: 3 }
            }}
          >
            {/* Mobile/Tablet: Bottom Sheet Trigger */}
            <IconButton
              onClick={handleOpenBottomSheet}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                minWidth: 44,
                minHeight: 44
              }}
              aria-label="Open conversations"
            >
              <MessageSquareIcon />
            </IconButton>
          
          <SemanticSearch
            currentConversationId={currentConversationId ?? undefined}
            onSelectResult={handleSearchResultSelect}
          />
          
            {/* Current conversation indicator - Responsive */}
            {currentConversationId && (
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  display: { xs: 'block', lg: 'none' },
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}
              >
                Conversation #{currentConversationId}
              </Typography>
            )}
          </Toolbar>
        </AppBar>
        
        {/* Chat content - Mobile First Responsive */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.default
          }}
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
        </Box>
      </Box>

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
      
      {/* Floating Action Button - positioned to not overlap send button */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-32 right-4 md:bottom-36 lg:bottom-8 lg:right-8 z-40">
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
    </Box>
  );
}
