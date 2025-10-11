import { pgTable, text, timestamp, serial, integer, jsonb, vector, index, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Conversations table
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().default('default_user'),
  title: text('title'),
  summary: text('summary'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  isActive: boolean('is_active').default(true),
}, (table) => ({
  userIdIdx: index('conversations_user_id_idx').on(table.userId),
  createdAtIdx: index('conversations_created_at_idx').on(table.createdAt),
}));

// Messages table with vector embeddings
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 50 }).default('text'), // 'text', 'tool_call', 'tool_result'
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embeddings are 1536 dimensions
}, (table) => ({
  conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
  timestampIdx: index('messages_timestamp_idx').on(table.timestamp),
  embeddingIdx: index('messages_embedding_idx').using('ivfflat', table.embedding.op('vector_cosine_ops')),
}));

// Semantic memories table for important context
export const semanticMemories = pgTable('semantic_memories', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  userId: varchar('user_id', { length: 255 }).notNull().default('default_user'),
  content: text('content').notNull(),
  summary: text('summary'),
  context: text('context'),
  importance: integer('importance').default(5), // 1-10 scale
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastAccessed: timestamp('last_accessed').defaultNow(),
  accessCount: integer('access_count').default(0),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  userIdIdx: index('semantic_memories_user_id_idx').on(table.userId),
  importanceIdx: index('semantic_memories_importance_idx').on(table.importance),
  embeddingIdx: index('semantic_memories_embedding_idx').using('ivfflat', table.embedding.op('vector_cosine_ops')),
  createdAtIdx: index('semantic_memories_created_at_idx').on(table.createdAt),
}));

// Tool calls and results table
export const toolCalls = pgTable('tool_calls', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  toolType: varchar('tool_type', { length: 50 }).notNull(),
  toolName: varchar('tool_name', { length: 255 }),
  arguments: jsonb('arguments').$type<Record<string, any>>().default({}),
  result: jsonb('result').$type<Record<string, any>>(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  messageIdIdx: index('tool_calls_message_id_idx').on(table.messageId),
}));

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().default('default_user'),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  activeConversationId: integer('active_conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  lastActivity: timestamp('last_activity').notNull().defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  sessionTokenIdx: index('user_sessions_token_idx').on(table.sessionToken),
  userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
}));

// Relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  semanticMemories: many(semanticMemories),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  toolCalls: many(toolCalls),
}));

export const semanticMemoriesRelations = relations(semanticMemories, ({ one }) => ({
  conversation: one(conversations, {
    fields: [semanticMemories.conversationId],
    references: [conversations.id],
  }),
}));

export const toolCallsRelations = relations(toolCalls, ({ one }) => ({
  message: one(messages, {
    fields: [toolCalls.messageId],
    references: [messages.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  activeConversation: one(conversations, {
    fields: [userSessions.activeConversationId],
    references: [conversations.id],
  }),
}));

// Type exports
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type SemanticMemory = typeof semanticMemories.$inferSelect;
export type NewSemanticMemory = typeof semanticMemories.$inferInsert;
export type ToolCall = typeof toolCalls.$inferSelect;
export type NewToolCall = typeof toolCalls.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;