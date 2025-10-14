import { db } from '../../server/db';
import { conversations, messages, semanticMemories, toolCalls, userSessions } from '../../shared/schema';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import type { Conversation, NewConversation, Message, NewMessage, SemanticMemory, NewSemanticMemory, ToolCall, NewToolCall } from '../../shared/schema';

// Re-export db for use in other modules
export { db };
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings using OpenAI directly
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

// Conversation management
export async function createConversation(data: Partial<NewConversation>): Promise<Conversation> {
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId: data.userId || 'default_user',
      title: data.title || 'New Conversation',
      summary: data.summary,
      metadata: data.metadata || {},
    })
    .returning();
  
  return conversation;
}

export async function getConversation(id: number): Promise<Conversation | null> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  
  return conversation || null;
}

export async function getUserConversations(userId: string = 'default_user'): Promise<Conversation[]> {
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
  
  return result;
}

export async function updateConversation(id: number, data: Partial<Conversation>): Promise<Conversation> {
  const [updated] = await db
    .update(conversations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id))
    .returning();
  
  return updated;
}

export async function deleteConversation(id: number): Promise<void> {
  await db
    .delete(conversations)
    .where(eq(conversations.id, id));
}

// Message management
export async function createMessage(data: NewMessage & { generateEmbedding?: boolean }): Promise<Message> {
  const messageData: NewMessage = {
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    contentType: data.contentType || 'text',
    metadata: data.metadata || {},
  };

  // Generate embedding if requested
  if (data.generateEmbedding && data.content) {
    try {
      const embedding = await generateEmbedding(data.content);
      messageData.embedding = embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
    }
  }

  const [message] = await db
    .insert(messages)
    .values(messageData)
    .returning();
  
  // Update conversation's updatedAt timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, data.conversationId));
  
  return message;
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.timestamp);
  
  return result;
}

// Tool calls management
export async function saveToolCall(data: NewToolCall): Promise<ToolCall> {
  const [toolCall] = await db
    .insert(toolCalls)
    .values(data)
    .returning();
  
  return toolCall;
}

export async function updateToolCallResult(id: number, result: any, status: string = 'completed'): Promise<ToolCall> {
  const [updated] = await db
    .update(toolCalls)
    .set({
      result,
      status,
    })
    .where(eq(toolCalls.id, id))
    .returning();
  
  return updated;
}

// Semantic memory management
export async function createSemanticMemory(data: NewSemanticMemory & { generateEmbedding?: boolean }): Promise<SemanticMemory> {
  const memoryData: NewSemanticMemory = {
    userId: data.userId || 'default_user',
    conversationId: data.conversationId,
    content: data.content,
    summary: data.summary,
    context: data.context,
    importance: data.importance || 5,
    metadata: data.metadata || {},
  };

  // Generate embedding if requested
  if (data.generateEmbedding && data.content) {
    try {
      const embedding = await generateEmbedding(data.content);
      memoryData.embedding = embedding;
    } catch (error) {
      console.error('Failed to generate embedding for memory:', error);
    }
  }

  const [memory] = await db
    .insert(semanticMemories)
    .values(memoryData)
    .returning();
  
  return memory;
}

// Semantic search using vector similarity
export async function searchSemanticMemories(
  query: string,
  userId: string = 'default_user',
  limit: number = 10
): Promise<SemanticMemory[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using cosine similarity
    const result = await db
      .select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        sql`${semanticMemories.embedding} IS NOT NULL`
      ))
      .orderBy(sql`${semanticMemories.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);
    
    // Update access count and last accessed timestamp
    const memoryIds = result.map(m => m.id);
    if (memoryIds.length > 0) {
      await db
        .update(semanticMemories)
        .set({
          accessCount: sql`${semanticMemories.accessCount} + 1`,
          lastAccessed: new Date(),
        })
        .where(sql`${semanticMemories.id} = ANY(ARRAY[${memoryIds.join(',')}]::int[])`);
    }
    
    return result;
  } catch (error) {
    console.error('Semantic search failed:', error);
    // Fallback to text search
    return searchSemanticMemoriesByText(query, userId, limit);
  }
}

// Fallback text search
export async function searchSemanticMemoriesByText(
  query: string,
  userId: string = 'default_user',
  limit: number = 10
): Promise<SemanticMemory[]> {
  const result = await db
    .select()
    .from(semanticMemories)
    .where(and(
      eq(semanticMemories.userId, userId),
      sql`${semanticMemories.content} ILIKE ${`%${query}%`} OR ${semanticMemories.summary} ILIKE ${`%${query}%`}`
    ))
    .orderBy(desc(semanticMemories.importance), desc(semanticMemories.createdAt))
    .limit(limit);
  
  return result;
}

// Get all semantic memories for a user
export async function getAllSemanticMemories(
  userId: string = 'default_user',
  limit: number = 100
): Promise<SemanticMemory[]> {
  const result = await db
    .select()
    .from(semanticMemories)
    .where(eq(semanticMemories.userId, userId))
    .orderBy(desc(semanticMemories.importance), desc(semanticMemories.createdAt))
    .limit(limit);
  
  return result;
}

// Get high-importance profile memories for a user
export async function getProfileMemories(
  userId: string = 'default_user',
  minImportance: number = 7
): Promise<SemanticMemory[]> {
  try {
    const result = await db
      .select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        sql`${semanticMemories.importance} >= ${minImportance}`
      ))
      .orderBy(desc(semanticMemories.importance), desc(semanticMemories.accessCount))
      .limit(10);
    
    return result;
  } catch (error) {
    console.error('Failed to get profile memories:', error);
    return [];
  }
}

// Enhanced memory search for comprehensive context retrieval
export async function getRelevantMemories(
  query: string,
  userId: string = 'default_user',
  options: {
    includeProfile?: boolean;
    searchLimit?: number;
    minProfileImportance?: number;
  } = {}
): Promise<{
  profileMemories: SemanticMemory[];
  queryMemories: SemanticMemory[];
  locationMemories: SemanticMemory[];
}> {
  const { 
    includeProfile = true, 
    searchLimit = 10, 
    minProfileImportance = 7 
  } = options;

  // Always get profile memories (high importance facts about the user)
  const profileMemories = includeProfile 
    ? await getProfileMemories(userId, minProfileImportance)
    : [];

  // Get query-specific memories
  const queryMemories = await searchSemanticMemories(query, userId, searchLimit);

  // For time-related or location-sensitive queries, get location memories
  let locationMemories: SemanticMemory[] = [];
  const timeLocationKeywords = [
    'time', 'date', 'weather', 'timezone', 'clock',
    'what time', 'current time', 'now', 'today',
    'temperature', 'forecast', 'local'
  ];
  
  const needsLocation = timeLocationKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  if (needsLocation) {
    // Search specifically for location-related memories
    const locationSearchTerms = ['location', 'live', 'from', 'city', 'country', 'timezone', 'canada', 'toronto', 'vancouver', 'montreal'];
    
    try {
      // Try embedding-based search for location
      const locationQuery = 'user location city country timezone where from';
      locationMemories = await searchSemanticMemories(locationQuery, userId, 5);
      
      // If no results, try text search
      if (locationMemories.length === 0) {
        const textResults = await db
          .select()
          .from(semanticMemories)
          .where(and(
            eq(semanticMemories.userId, userId),
            sql`(
              ${semanticMemories.content} ILIKE ANY(ARRAY[${locationSearchTerms.map(term => `'%${term}%'`).join(',')}])
              OR ${semanticMemories.summary} ILIKE ANY(ARRAY[${locationSearchTerms.map(term => `'%${term}%'`).join(',')}])
            )`
          ))
          .orderBy(desc(semanticMemories.importance))
          .limit(5);
        
        locationMemories = textResults;
      }
    } catch (error) {
      console.error('Failed to search for location memories:', error);
    }
  }

  // Deduplicate memories across all categories
  const allMemoryIds = new Set<number>();
  const deduplicatedMemories = {
    profileMemories: [] as SemanticMemory[],
    queryMemories: [] as SemanticMemory[],
    locationMemories: [] as SemanticMemory[]
  };

  // Add profile memories first (highest priority)
  for (const memory of profileMemories) {
    if (!allMemoryIds.has(memory.id)) {
      allMemoryIds.add(memory.id);
      deduplicatedMemories.profileMemories.push(memory);
    }
  }

  // Add location memories (if applicable)
  for (const memory of locationMemories) {
    if (!allMemoryIds.has(memory.id)) {
      allMemoryIds.add(memory.id);
      deduplicatedMemories.locationMemories.push(memory);
    }
  }

  // Add query-specific memories
  for (const memory of queryMemories) {
    if (!allMemoryIds.has(memory.id)) {
      allMemoryIds.add(memory.id);
      deduplicatedMemories.queryMemories.push(memory);
    }
  }

  return deduplicatedMemories;
}

// Search messages with semantic similarity
export async function searchMessages(
  query: string,
  conversationId?: number,
  limit: number = 20
): Promise<Message[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    let baseQuery = db
      .select()
      .from(messages)
      .where(sql`${messages.embedding} IS NOT NULL`);
    
    if (conversationId) {
      baseQuery = baseQuery.where(eq(messages.conversationId, conversationId));
    }
    
    const result = await baseQuery
      .orderBy(sql`${messages.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);
    
    return result;
  } catch (error) {
    console.error('Message search failed:', error);
    // Fallback to text search
    return searchMessagesByText(query, conversationId, limit);
  }
}

// Fallback text search for messages
export async function searchMessagesByText(
  query: string,
  conversationId?: number,
  limit: number = 20
): Promise<Message[]> {
  let baseQuery = db
    .select()
    .from(messages);
  
  if (conversationId) {
    baseQuery = baseQuery.where(and(
      eq(messages.conversationId, conversationId),
      ilike(messages.content, `%${query}%`)
    ));
  } else {
    baseQuery = baseQuery.where(ilike(messages.content, `%${query}%`));
  }
  
  const result = await baseQuery
    .orderBy(desc(messages.timestamp))
    .limit(limit);
  
  return result;
}

// Session management
export async function getOrCreateSession(sessionToken: string, userId: string = 'default_user'): Promise<any> {
  // Check if session exists
  const [existing] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionToken, sessionToken))
    .limit(1);
  
  if (existing) {
    // Update last activity
    await db
      .update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.id, existing.id));
    
    return existing;
  }
  
  // Create new session
  const [newSession] = await db
    .insert(userSessions)
    .values({
      userId,
      sessionToken,
      lastActivity: new Date(),
      metadata: {},
    })
    .returning();
  
  return newSession;
}

export async function updateSessionConversation(sessionToken: string, conversationId: number): Promise<void> {
  await db
    .update(userSessions)
    .set({
      activeConversationId: conversationId,
      lastActivity: new Date(),
    })
    .where(eq(userSessions.sessionToken, sessionToken));
}