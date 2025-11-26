# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on http://localhost:5000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start` (runs on port 5000)
- **Lint code**: `npm run lint`
- **Install dependencies**: `npm install`
- **Database push schema**: `npm run db:push`
- **Database studio**: `npm run db:studio`

## Architecture Overview

This is a Next.js 15 (App Router) TypeScript application that demonstrates the OpenAI Responses API with streaming and tool calling capabilities. The app provides a mobile-first chat interface with multi-turn conversation handling, semantic memory, and multiple tool integrations.

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Framework7 (mobile UI)
- **State**: Zustand with persistence middleware
- **Database**: Neon PostgreSQL with Drizzle ORM and pgvector for semantic search
- **AI**: OpenAI SDK (Responses API, Embeddings API, Whisper API)
- **Auth**: `openid-client` for Google OAuth
- **Streaming**: Native ReadableStream with SSE formatting
- **JSON Parsing**: `partial-json` for streaming argument parsing

### Core Flow

1. UI builds tool list from user toggles in `useToolsStore`
2. Chat submission triggers `processMessages` in `lib/assistant.ts`, which calls `/api/turn_response`
3. API route retrieves relevant semantic memories, assembles OpenAI request, streams SSE events
4. Client `handleTurn` parses SSE events, updates chat state, and triggers local function execution
5. Tool outputs are appended and may trigger follow-up turns
6. Messages are persisted to PostgreSQL with vector embeddings for semantic search

## Directory Structure

```
app/
├── api/
│   ├── turn_response/       # Main OpenAI Responses API endpoint
│   ├── conversations/       # Conversation CRUD + messages
│   ├── functions/           # Custom function implementations (get_weather, get_joke)
│   ├── vector_stores/       # OpenAI vector store management
│   ├── google/              # OAuth auth, callback, status endpoints
│   ├── transcribe/          # Whisper audio transcription
│   ├── embeddings/          # OpenAI embedding generation
│   ├── semantic-memories/   # Memory CRUD with embeddings
│   └── semantic-search/     # Vector similarity search
├── layout.tsx               # Root layout with F7AppProvider
└── page.tsx                 # Main entry, renders ModernChatFixed

components/
├── modern-chat-fixed.tsx    # Primary chat interface
├── modern-chat.tsx          # Alternative chat layout
├── f7-*.tsx                 # Framework7 mobile components
├── message-bubble.tsx       # Chat message rendering
├── tool-call.tsx            # Tool execution progress display
├── tools-panel.tsx          # Tool configuration panel
├── mcp-*.tsx                # MCP server configuration
├── google-integration.tsx   # Google OAuth UI
└── ui/                      # Radix UI primitives (button, dialog, etc.)

config/
├── constants.ts             # Model name, developer prompt, initial message
├── tools-list.ts            # Declarative function tool schemas
└── functions.ts             # Browser-side function wrappers + functionsMap

lib/
├── assistant.ts             # Streaming event state machine, processMessages()
├── tools/
│   ├── tools.ts             # Composes tools array from Zustand state
│   ├── tools-handling.ts    # Function execution dispatcher
│   └── connectors.ts        # Google MCP connector helpers
├── db/
│   └── conversations.ts     # Database operations, semantic search
├── googleTokens.ts          # OAuth token refresh logic
├── googleClient.ts          # OpenID client setup
├── memory-extraction.ts     # Memory context extraction
└── utils.ts                 # Shared utilities

stores/
├── useConversationStore.ts  # Chat messages, conversation items, persistence
├── useToolsStore.ts         # Tool toggles, MCP servers, model selection
└── useNavigationStore.ts    # Tab navigation state

hooks/
├── useAudioRecorder.ts      # Voice recording for transcription
├── useSwipeGesture.ts       # Touch gesture handling
├── usePullToRefresh.ts      # Pull-to-refresh behavior
└── useLongPress.ts          # Long press detection

server/
└── db.ts                    # Drizzle + Neon pool initialization

shared/
└── schema.ts                # Drizzle schema (conversations, messages, semanticMemories, etc.)
```

## Key Patterns

### Adding New Function Tools

1. Add schema to `config/tools-list.ts`:
   ```typescript
   {
     name: "my_function",
     description: "What the function does",
     parameters: {
       param1: { type: "string", description: "..." },
     },
   }
   ```

2. Create API route at `app/api/functions/my_function/route.ts`:
   ```typescript
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     // Implementation
     return Response.json({ result });
   }
   ```

3. Add client wrapper to `config/functions.ts`:
   ```typescript
   export const my_function = async ({ param1 }: { param1: string }) => {
     const res = await fetch(`/api/functions/my_function?param1=${param1}`);
     return res.json();
   };

   export const functionsMap = {
     // ...existing
     my_function,
   };
   ```

4. Both schema and function must use identical parameter names

### Tool Types Supported

- **Web Search**: Built-in OpenAI tool with optional location configuration
- **File Search**: Uses OpenAI vector stores for document search
- **Code Interpreter**: Python code execution in sandboxed containers
- **Function Calls**: Custom functions defined in this codebase
- **MCP**: Model Context Protocol connectors (Google Calendar/Gmail + custom servers)

### State Management Rules

- Use immutable updates with spread operators for Zustand stores
- `conversationItems` contains only items sent to OpenAI API
- `chatMessages` contains all UI display items including partial streaming states
- Function tools trigger recursive `processMessages()` calls after completion
- Stores use `persist` middleware for localStorage persistence

### Database Schema

The app uses Drizzle ORM with Neon PostgreSQL:

- **conversations**: User conversations with metadata
- **messages**: Chat messages with optional vector embeddings (1536 dimensions)
- **semanticMemories**: Important user context with importance scoring and embeddings
- **toolCalls**: Tool execution history linked to messages
- **userSessions**: Session management with active conversation tracking

Vector search uses pgvector with IVFFlat indexes for cosine similarity.

### Semantic Memory System

The app maintains semantic memories for personalization:

1. High-importance memories (profile info) are always retrieved
2. Query-specific memories use vector similarity search
3. Location memories are retrieved for time/weather queries
4. Memories are injected into the system prompt for context

### SSE Streaming Pattern

The `/api/turn_response` route streams events:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const event of openaiEvents) {
      controller.enqueue(`data: ${JSON.stringify({event: event.type, data: event})}\n\n`);
    }
    controller.close();
  },
});
```

Client parses with `handleTurn` in `lib/assistant.ts`, handling events like:
- `response.output_text.delta` - Text streaming
- `response.function_call_arguments.delta` - Tool call arguments
- `response.completed` - Final response with all outputs

## Environment Variables

### Required
- `OPENAI_API_KEY`: OpenAI API access
- `DATABASE_URL`: Neon PostgreSQL connection string

### Optional
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI (defaults to http://localhost:5000/api/google/callback)

## Google Integration

Requires OAuth setup with Google Cloud Console:
1. Enable Google Calendar API and Gmail API
2. Configure OAuth consent screen
3. Create OAuth 2.0 client credentials
4. Set redirect URI: `http://localhost:5000/api/google/callback`
5. Set environment variables

The integration uses MCP connectors (`connector_googlecalendar`, `connector_gmail`) for calendar and email access.

## MCP Server Configuration

The app supports multiple MCP servers configured via `useToolsStore`:

```typescript
{
  id: string;
  label: string;           // Server identifier (alphanumeric + _ -)
  url: string;             // Server endpoint URL
  allowed_tools: string;   // Comma-separated tool names
  skip_approval: boolean;  // Auto-approve tool calls
  authToken?: string;      // Bearer token for authentication
  enabled: boolean;        // Toggle server on/off
}
```

## Mobile/PWA Features

- Framework7 integration for native-like mobile UI
- PWA manifest at `/manifest.json`
- Touch gesture hooks (swipe, pull-to-refresh, long press)
- Voice recording with Whisper transcription
- Responsive design with mobile-first approach

## Model Selection

Supports multiple OpenAI models via `useToolsStore.selectedModel`:
- `gpt-4.1` (default)
- `gpt-5` (with reasoning effort: low/medium/high)

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zustand for global state, React state for local UI state
- Follow existing patterns for new API routes and components
- Keep tool schemas in sync with function implementations
