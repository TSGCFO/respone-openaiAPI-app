# Complete Developer Setup Guide

## Build OpenAI Responses API Chat App from Scratch

This guide enables any developer to recreate this Next.js OpenAI Responses API demonstration app without access to the original repository.

## Prerequisites

- Node.js 18+ and npm
- OpenAI API account with API key
- Code editor (VS Code recommended)
- Optional: Google Cloud Console account for Calendar/Gmail integration

## Project Initialization

### 1. Create Next.js Project

```bash
npx create-next-app@latest responses-starter-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd responses-starter-app
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install openai@^4.87.3 zustand@^5.0.2 zod@^3.23.8

# UI components
npm install @radix-ui/react-dialog@^1.1.6 @radix-ui/react-dropdown-menu@^2.1.6 @radix-ui/react-popover@^1.1.6 @radix-ui/react-switch@^1.1.3 @radix-ui/react-tooltip@^1.1.8

# Utilities
npm install class-variance-authority@^0.7.1 clsx@^2.1.1 cmdk@^1.0.0 lucide-react@^0.441.0 tailwind-merge@^2.6.0 tailwindcss-animate@^1.0.7

# Additional features
npm install react-markdown@^9.0.1 react-syntax-highlighter@^15.6.1 highlight.js@^11.11.1 katex@^0.16.22 partial-json@^0.1.7 react-dropzone@^14.3.8 recharts@^2.12.7 vaul@^1.0.0 @xyflow/react@^12.3.0 @reach/visually-hidden@^0.18.0 @npmcli/fs@^4.0.0

# Google OAuth
npm install openid-client@^6.6.4

# Dev dependencies  
npm install --save-dev @types/react-syntax-highlighter@^15.5.13
```

### 3. Environment Setup

Create `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key_here

# Optional - Google integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

## File Structure & Implementation

### 4. Configuration Files

**`components.json`** (Radix UI config):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "stone",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "iconLibrary": "lucide"
}
```

**`next.config.mjs`**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
};
export default nextConfig;
```

### 5. Core Configuration

**`config/constants.ts`**:

```typescript
export const MODEL = "gpt-4.1";

export const DEVELOPER_PROMPT = `
You are a helpful assistant helping users with their queries.
If they need up to date information, you can use the web search tool to search the web for relevant information.
If they mention something about themselves, their companies, or anything else specific to them, use the save_context tool to store that information for later.
If they ask for something that is related to their own data, use the file search tool to search their files for relevant information.

If they ask questions related to their schedule, email, or calendar, use the Google connectors (Calendar and Gmail). Keep the following in mind:
- You may search the user's calendar when they ask about their schedule or upcoming events.
- You may search the user's emails when they ask about newsletters, subscriptions, or other alerts and updates.
- Weekends are Saturday and Sunday only. Do not include Friday events in responses about weekends.
- Where appropriate, format responses as a markdown list for clarity. Use line breaks between items to make lists more readable. Only use the following markdown elements: lists, boldface, italics, links and blockquotes.
`;

export function getDeveloperPrompt(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  return `${DEVELOPER_PROMPT.trim()}\n\nToday is ${dayName}, ${monthName} ${dayOfMonth}, ${year}.`;
}

export const INITIAL_MESSAGE = `Hi, how can I help you?`;

export const defaultVectorStore = { id: "", name: "Example" };
```

**`config/tools-list.ts`**:

```typescript
export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: { type: "string", description: "Location to get weather for" },
      unit: { type: "string", description: "Unit to get weather in", enum: ["celsius", "fahrenheit"] },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
];
```

**`config/functions.ts`**:

```typescript
export const get_weather = async ({ location, unit }: { location: string; unit: string }) => {
  const res = await fetch(`/api/functions/get_weather?location=${location}&unit=${unit}`).then((res) => res.json());
  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const functionsMap = {
  get_weather: get_weather,
  get_joke: get_joke,
};
```

### 6. State Management

**`stores/useConversationStore.ts`**:

```typescript
import { create } from "zustand";
import { INITIAL_MESSAGE } from "@/config/constants";

interface ConversationState {
  chatMessages: any[];
  conversationItems: any[];
  isAssistantLoading: boolean;
  setChatMessages: (items: any[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: any) => void;
  addConversationItem: (message: any) => void;
  setAssistantLoading: (loading: boolean) => void;
  resetConversation: () => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  chatMessages: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: INITIAL_MESSAGE }] }],
  conversationItems: [],
  isAssistantLoading: false,
  setChatMessages: (items) => set({ chatMessages: items }),
  setConversationItems: (messages) => set({ conversationItems: messages }),
  addChatMessage: (item) => set((state) => ({ chatMessages: [...state.chatMessages, item] })),
  addConversationItem: (message) => set((state) => ({ conversationItems: [...state.conversationItems, message] })),
  setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
  resetConversation: () => set(() => ({
    chatMessages: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: INITIAL_MESSAGE }] }],
    conversationItems: [],
  })),
}));

export default useConversationStore;
```

**`stores/useToolsStore.ts`** - Create with tool configuration state (web search, file search, functions, MCP, Google integration toggles)

### 7. Core API Routes

**`app/api/turn_response/route.ts`** (Main OpenAI endpoint):

```typescript
import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    
    const openai = new OpenAI();
    const events = await openai.responses.create({
      model: MODEL,
      input: messages,
      instructions: getDeveloperPrompt(),
      tools: tools as any,
      stream: true,
      parallel_tool_calls: false,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            const data = JSON.stringify({ event: event.type, data: event });
            controller.enqueue(`data: ${data}\n\n`);
          }
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
```

**`app/api/functions/get_weather/route.ts`**:

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const unit = searchParams.get("unit");

    // Get coordinates
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.length) {
      return new Response(JSON.stringify({ error: "Invalid location" }), { status: 404 });
    }

    const { lat, lon } = geoData[0];

    // Get weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&temperature_unit=${unit ?? "celsius"}`
    );
    const weather = await weatherRes.json();

    // Get current temperature
    const now = new Date();
    const currentHourISO = now.toISOString().slice(0, 13) + ":00";
    const index = weather.hourly.time.indexOf(currentHourISO);
    const currentTemperature = index !== -1 ? weather.hourly.temperature_2m[index] : null;

    return new Response(JSON.stringify({ temperature: currentTemperature }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error getting weather" }), { status: 500 });
  }
}
```

**`app/api/functions/get_joke/route.ts`**:

```typescript
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "How many programmers does it take to change a light bulb? None. That's a hardware problem.",
  "Why don't programmers like nature? It has too many bugs.",
];

export async function GET() {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  return Response.json({ joke: randomJoke });
}
```

### 8. Main App Components

**`app/layout.tsx`**:

```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Responses starter app",
  description: "Starter app for the OpenAI Responses API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="flex h-screen bg-gray-200 w-full flex-col text-stone-900">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
```

**`app/page.tsx`** - Main page with Assistant component and responsive tools panel

### 9. Critical Implementation Files

**`lib/assistant.ts`** - Streaming event handler and message processing logic with SSE parsing
**`lib/tools/tools.ts`** - Tool composition from Zustand state
**`components/assistant.tsx`** - Main chat interface component
**`components/tool-call.tsx`** - Tool execution progress display

### 10. Styling Setup

**`app/globals.css`** - Include Tailwind base with CSS custom properties for light/dark themes
**`tailwind.config.ts`** - Extended theme with custom colors and animations

## Google OAuth Setup (Optional)

### Google Cloud Console

1. Create new project or use existing
2. Enable APIs: Google Calendar API, Gmail API  
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/google/callback`
5. Configure OAuth consent screen with required scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.modify`

### Implementation

- `app/api/google/auth/route.ts` - OAuth initiation
- `app/api/google/callback/route.ts` - OAuth callback handler
- `app/api/google/status/route.ts` - Token status check
- `lib/googleClient.ts` - Google OAuth client setup
- `lib/googleTokens.ts` - Token management with refresh

## Vector Stores (File Search)

Create API routes for vector store management:

- `app/api/vector_stores/create_store/route.ts` - Create new vector store
- `app/api/vector_stores/upload_file/route.ts` - Upload files to OpenAI
- `app/api/vector_stores/add_file/route.ts` - Attach files to vector store
- `app/api/vector_stores/list_files/route.ts` - List vector store files
- `app/api/vector_stores/retrieve_store/route.ts` - Get vector store details

## Development Workflow

1. **Start development**: `npm run dev`
2. **Test functionality**:
   - Chat interface at <http://localhost:3000>
   - Toggle tools in right panel
   - Test custom functions (weather, jokes)
   - Upload files for file search
   - Connect Google integration if configured
3. **Build for production**: `npm run build`
4. **Lint code**: `npm run lint`

## Key Architecture Patterns

### Tool Integration Flow

1. User enables tools via `useToolsStore` toggles
2. `lib/tools/tools.ts` builds tools array from state
3. Chat submission calls `/api/turn_response` with tools
4. OpenAI Responses API streams events via SSE
5. `lib/assistant.ts` processes events and updates UI state
6. Function calls execute locally and trigger follow-up turns

### State Management

- **Zustand stores**: Persistent tool configuration, ephemeral conversation state
- **Immutable updates**: Always use spread operators for React re-renders
- **Dual state**: `chatMessages` (UI display) vs `conversationItems` (API calls)

### Streaming Implementation

- Native `ReadableStream` with manual SSE formatting
- `partial-json` parsing for streaming function arguments
- Event-driven state machine in `lib/assistant.ts`

## Essential Features

- **Multi-turn conversations** with context preservation
- **Real-time streaming** of responses and tool calls
- **Built-in OpenAI tools**: Web search, file search, code interpreter
- **Custom function calls** with full streaming support
- **MCP connector support** for external integrations
- **Mobile-responsive UI** with collapsible panels
- **Google Calendar/Gmail integration** via OAuth

## Adding New Custom Functions

1. **Tool schema** in `config/tools-list.ts`
2. **API route** under `app/api/functions/<name>/route.ts`
3. **Client wrapper** in `config/functions.ts`
4. **Export in functionsMap** for execution

## Troubleshooting

- **Missing API key**: Check `.env.local` and restart dev server
- **Google OAuth errors**: Verify redirect URI and API enablement
- **Tool calls not working**: Ensure schema matches function parameters exactly
- **Streaming issues**: Check browser network tab for SSE connection
- **Build errors**: Run `npm run lint` and fix TypeScript issues

This guide provides everything needed to recreate the complete OpenAI Responses API chat application with all its features and integrations.
