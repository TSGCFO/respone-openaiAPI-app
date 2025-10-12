"use client";
import React, { useCallback } from "react";
import Chat from "./chat";
import { ConversationSidebar } from "./conversation-sidebar";
import { SemanticSearch } from "./semantic-search";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";

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


  return (
    <div className="flex h-full relative">
      {/* Desktop Sidebar */}
      <div className="w-80 flex-shrink-0 hidden md:block">
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>
      {/* Main Chat Area with Mobile Sidebar */}
      <div className="flex-1 relative flex flex-col">
        <div className="border-b p-2 flex items-center gap-2">
          <div className="md:hidden">
            <ConversationSidebar
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
          <SemanticSearch
            currentConversationId={currentConversationId}
            onSelectResult={handleSearchResultSelect}
          />
        </div>
        <div className="p-4 bg-white flex-1 overflow-auto">
          <Chat
            items={chatMessages}
            onSendMessage={handleSendMessage}
            onApprovalResponse={handleApprovalResponse}
          />
        </div>
      </div>
    </div>
  );
}
