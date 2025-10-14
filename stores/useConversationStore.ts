import { create } from "zustand";
import { Item, MessageItem, ToolCallItem } from "@/lib/assistant";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { INITIAL_MESSAGE } from "@/config/constants";

interface ConversationState {
  // Current conversation ID
  currentConversationId: number | null;
  // Items displayed in the chat
  chatMessages: Item[];
  // Items sent to the Responses API
  conversationItems: any[];
  // Whether we are waiting for the assistant response
  isAssistantLoading: boolean;
  // User ID for the current session
  userId: string;

  setChatMessages: (items: Item[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: Item) => void;
  addConversationItem: (message: ChatCompletionMessageParam) => void;
  setAssistantLoading: (loading: boolean) => void;
  setCurrentConversationId: (id: number | null) => void;
  setUserId: (id: string) => void;
  rawSet: (state: any) => void;
  resetConversation: () => void;
  createNewConversation: () => Promise<number>;
  loadConversation: (conversationId: number) => Promise<void>;
  saveMessage: (role: 'user' | 'assistant', content: string, toolCalls?: any[]) => Promise<void>;
  createSemanticMemory: (content: string, summary: string, options?: { 
    importance?: number; 
    metadata?: Record<string, any>;
    context?: string;
  }) => Promise<void>;
}

const useConversationStore = create<ConversationState>((set, get) => ({
  currentConversationId: null,
  chatMessages: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: INITIAL_MESSAGE }],
    },
  ],
  conversationItems: [],
  isAssistantLoading: false,
  userId: 'default_user',
  
  setChatMessages: (items) => set({ chatMessages: items }),
  setConversationItems: (messages) => set({ conversationItems: messages }),
  addChatMessage: (item) =>
    set((state) => ({ chatMessages: [...state.chatMessages, item] })),
  addConversationItem: (message) =>
    set((state) => ({
      conversationItems: [...state.conversationItems, message],
    })),
  setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setUserId: (id) => set({ userId: id }),
  rawSet: set,
  
  resetConversation: () =>
    set(() => ({
      chatMessages: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: INITIAL_MESSAGE }],
        },
      ],
      conversationItems: [],
      currentConversationId: null,
    })),
    
  createNewConversation: async () => {
    const { userId } = get();
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title: 'New Conversation',
          metadata: { createdAt: new Date().toISOString() }
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      
      const { conversation } = await response.json();
      set({ currentConversationId: conversation.id });
      return conversation.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },
  
  loadConversation: async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      
      const { conversation, messages } = await response.json();
      
      // Convert database messages to chat items
      const chatMessages: Item[] = messages.map((msg: any) => {
        // Handle tool call messages
        if (msg.metadata?.toolCalls && msg.metadata.toolCalls.length > 0) {
          const toolCallItems: Item[] = msg.metadata.toolCalls.map((tc: any) => ({
            type: 'tool_call',
            tool_type: tc.toolType,
            status: tc.status || 'completed',
            id: tc.id || `tool-${Date.now()}`,
            name: tc.toolName,
            arguments: tc.arguments,
            parsedArguments: tc.parsedArguments || {},
            output: tc.result,
          }));
          return toolCallItems;
        }
        
        // Handle regular messages
        return {
          type: 'message',
          role: msg.role,
          content: [{ 
            type: msg.role === 'user' ? 'input_text' : 'output_text', 
            text: msg.content 
          }],
        };
      }).flat();
      
      // Add initial message if empty
      if (chatMessages.length === 0) {
        chatMessages.push({
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: INITIAL_MESSAGE }],
        });
      }
      
      set({ 
        currentConversationId: conversationId,
        chatMessages,
        conversationItems: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  },
  
  saveMessage: async (role: 'user' | 'assistant', content: string, toolCalls?: any[]) => {
    const { currentConversationId, userId } = get();
    let conversationId = currentConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = await get().createNewConversation();
    }
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          role,
          content,
          contentType: 'text',
          metadata: toolCalls ? { toolCalls } : {},
          generateEmbedding: true,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save message');
      
      // Update conversation title based on first user message
      if (role === 'user' && get().chatMessages.filter(m => m.type === 'message' && m.role === 'user').length === 1) {
        const title = content.substring(0, 100);
        await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  },
  
  createSemanticMemory: async (content: string, summary: string, options?: { 
    importance?: number; 
    metadata?: Record<string, any>;
    context?: string;
  }) => {
    const { currentConversationId, userId } = get();
    
    if (!currentConversationId) return;
    
    try {
      await fetch('/api/semantic-memories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content,
          summary,
          importance: options?.importance || 5,
          metadata: options?.metadata || {},
          context: options?.context,
          generateEmbedding: true,
        }),
      });
    } catch (error) {
      console.error('Failed to create semantic memory:', error);
    }
  },
}));

export default useConversationStore;