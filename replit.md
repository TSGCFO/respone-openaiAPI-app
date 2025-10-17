# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on http://0.0.0.0:5000 for Replit)
- **Build for production**: `npm run build`
- **Start production server**: `npm start` (runs on http://0.0.0.0:5000 for Replit)
- **Lint code**: `npm run lint`
- **Install dependencies**: `npm install`

## Recent Updates (October 2025)

### Material Design 3 (Material You) Android UI
- **Complete Material UI Migration**: Entire app now uses Material UI v5 components
- **Material You Theme**: Dynamic color system with purple/violet branding
- **Android-Native Components**: Material Cards, TextFields, Buttons with ripple effects
- **Material Icons**: Replaced all icons with official Material Design icons
- **Elevation System**: Proper Material shadows and depth (0dp-12dp)
- **Responsive Design**: Mobile-first with 48dp touch targets
- **Material Motion**: Smooth animations following Material Design specs

### Voice Features Added
- **Speech-to-Text**: Integrated OpenAI Whisper API for audio transcription
- **Text-to-Speech**: Added OpenAI TTS API with 6 voice options and playback controls
- **Audio Recording**: Web Audio API implementation with visual feedback
- **Caching System**: Audio responses cached to minimize API calls

### Mobile PWA Enhancements
- **Progressive Web App**: Full PWA configuration with manifest and service worker
- **Touch Gestures**: Swipe navigation, pull-to-refresh, pinch-to-zoom
- **Haptic Feedback**: Vibration API for tactile responses
- **Native Transitions**: Smooth animations and iOS-style interactions
- **Offline Support**: Service worker caching for offline functionality

### Bug Fixes & Improvements
- Fixed message timestamps to show actual send times (not current time)
- Fixed conversation loading with proper ID validation
- Fixed SQL array syntax in memory search queries
- Fixed DialogContent accessibility with proper DialogTitle
- Removed virtual scrolling for better mobile performance
- Fixed input positioning and scroll container issues
- Enhanced memory recall with profile and query-specific retrieval

## Replit Migration (October 2025)

This project was migrated from Vercel to Replit with the following changes:

### Configuration Updates
- Updated npm scripts to bind to `0.0.0.0:5000` (Replit's required port)
- Modified OAuth redirect URI to automatically use `REPLIT_DEV_DOMAIN` when available
- Configured deployment with autoscale deployment target
- All environment variables properly set in Replit Secrets

### OAuth Redirect URI
The app now automatically detects the Replit environment and constructs the correct OAuth callback URL. Priority order:
1. `GOOGLE_REDIRECT_URI` (if explicitly set)
2. `https://${REPLIT_DEV_DOMAIN}/api/google/callback` (Replit environment)
3. `http://localhost:3000/api/google/callback` (local fallback)

### Production Considerations
- Session/token storage currently uses in-memory Map (suitable for development)
- For production, consider migrating to a persistent store (Redis, database, etc.)
- Deployment requires REPLIT_DEV_DOMAIN or GOOGLE_REDIRECT_URI to be set for OAuth

## Architecture Overview

This is a Next.js 15 (App Router) TypeScript application that demonstrates the OpenAI Responses API with streaming and tool calling capabilities. The app provides a chat interface with multi-turn conversation handling.

### Core Flow
1. UI builds tool list from user toggles in `useToolsStore`
2. Chat submission triggers `processMessages` in `lib/assistant.ts`, which calls `/api/turn_response`
3. API route assembles OpenAI request, conditionally injects Google MCP connectors, streams SSE events
4. Client `handleTurn` parses SSE events, updates chat state, and triggers local function execution
5. Tool outputs are appended and may trigger follow-up turns

### Key Directories & Files

**Configuration**
- `config/constants.ts`: Model name and dynamic developer prompt with date injection
- `config/tools-list.ts`: Declarative function tool schemas (must match `config/functions.ts`)
- `config/functions.ts`: Browser-side function wrappers that fetch internal API endpoints

**Core Logic**
- `lib/assistant.ts`: Streaming event state machine and message processing
- `lib/tools/tools.ts`: Composes tools array from Zustand state
- `lib/tools/connectors.ts`: Google MCP connector helpers
- `lib/validation.ts`: Zod schemas for input validation

**Voice & Audio**
- `hooks/useAudioRecorder.ts`: Audio recording management with Web Audio API
- `hooks/useTTS.ts`: Text-to-speech playback management
- `app/api/transcribe/route.ts`: OpenAI Whisper integration
- `app/api/text-to-speech/route.ts`: OpenAI TTS integration

**Mobile & Touch**
- `hooks/useSwipeGesture.ts`: Swipe detection with velocity tracking
- `hooks/useLongPress.ts`: Long-press gesture detection
- `hooks/usePinchZoom.ts`: Pinch-to-zoom functionality
- `lib/haptic.ts`: Haptic feedback utility

**State Management**
- `stores/useConversationStore.ts`: Chat messages and conversation items
- `stores/useToolsStore.ts`: Tool configuration and settings

**API Routes**
- `app/api/turn_response/route.ts`: Main endpoint for OpenAI Responses API calls
- `app/api/functions/*`: Server-side function implementations
- `app/api/vector_stores/*`: Vector store CRUD operations
- `app/api/google/*`: Google OAuth flow handlers

**UI Components**
- `components/assistant.tsx`: Main chat interface
- `components/tool-call.tsx`: Tool execution progress display
- `components/tools-panel.tsx`: Tool configuration panel
- `components/AudioRecorder.tsx`: Voice recording UI
- `components/AudioPlayer.tsx`: TTS playback controls

## Tool Integration Patterns

### Adding New Function Tools
1. Add schema to `config/tools-list.ts`
2. Create API route under `app/api/functions/<name>/route.ts`
3. Add client wrapper to `config/functions.ts` and export in `functionsMap`
4. Both schema and function must use identical parameter names

### Tool Types Supported
- **Web Search**: Built-in OpenAI tool with optional location configuration
- **File Search**: Uses vector stores for document search
- **Code Interpreter**: Python code execution
- **Function Calls**: Custom functions defined in this codebase
- **MCP**: Model Context Protocol connectors (currently Google Calendar/Gmail)

## State Management Rules

- Use immutable updates with spread operators for Zustand stores
- `conversationItems` contains only items sent to OpenAI API
- `chatMessages` contains all UI display items including partial streaming states
- Function tools trigger recursive `processMessages()` calls after completion

## Google Integration

Requires OAuth setup with Google Cloud Console:
- Enable Google Calendar API and Gmail API
- Configure OAuth client with redirect URI based on environment:
  - **Replit**: `https://<your-replit-domain>/api/google/callback`
  - **Local**: `http://localhost:3000/api/google/callback`
- Set environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Environment Variables

Required:
- `OPENAI_API_KEY`: OpenAI API access (needed for audio APIs)

Optional:
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI (auto-detected from REPLIT_DEV_DOMAIN or defaults to localhost:3000)
- `REPLIT_DEV_DOMAIN`: Auto-provided by Replit, used for OAuth callback URL

## Dependencies

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Radix UI
- **State**: Zustand for state management
- **OpenAI**: `openai` SDK for Responses API, Whisper, and TTS
- **Auth**: `openid-client` for Google OAuth
- **Streaming**: Native ReadableStream with manual SSE formatting
- **JSON Parsing**: `partial-json` for streaming argument parsing
- **PWA**: Service worker with offline caching support