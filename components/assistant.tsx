"use client";
import React, { useCallback } from "react";
import Chat from "./chat";
import { ConversationSidebar } from "./conversation-sidebar";
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
      <div className="flex-1 relative">
        <div className="md:hidden absolute top-4 left-4 z-10">
          <ConversationSidebar
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
        <div className="p-4 bg-white h-full">
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
