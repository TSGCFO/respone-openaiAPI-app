# GitHub Copilot Instructions for `responses-starter-app`

Concise, project-specific guidance for AI coding agents contributing to this Next.js Responses API starter.

## 1. Purpose & Architecture
A Next.js 15 (App Router) TypeScript app that demos OpenAI Responses API with streaming + tool calling (web search, file search via vector stores, function calls, code interpreter, MCP connectors for Google Calendar & Gmail). Frontend React components + Zustand stores orchestrate a multi-turn chat; backend `app/api/**/route.ts` endpoints wrap OpenAI (`openai` SDK) and supporting services.

Key flow (happy path):
1. UI builds tool list (`lib/tools/tools.ts`) from user toggles in `useToolsStore`.
2. Chat submission => `processMessages` (`lib/assistant.ts`) collects conversation items & calls `/api/turn_response`.
3. API route (`app/api/turn_response/route.ts`) assembles OpenAI request, conditionally injects Google MCP connectors, streams SSE events.
4. Client `handleTurn` incrementally parses SSE, updates chat state & triggers local function execution for function calls (mapped in `config/functions.ts`).
5. Tool outputs (including function results) are appended and may trigger follow-up turn(s).

## 2. Core Files / Directories
- `config/constants.ts`: Model name + dynamic developer prompt (date injected). Keep prompt edits concise & deterministic.
- `config/tools-list.ts`: Declarative function tool schema (names MUST match functions in `config/functions.ts`).
- `config/functions.ts`: Browser-side wrappers fetching internal API endpoints; update both here & tools list synchronously.
- `lib/assistant.ts`: Streaming event/state machine. Add new event handlers here when enabling new tool types.
- `lib/tools/tools.ts`: Composes tools array from Zustand state (`useToolsStore`). Extend here for new tool categories.
- `lib/tools/connectors.ts`: Helper to append Google MCP connectors when OAuth enabled.
- `stores/useConversationStore.ts`: Chat + conversation items; keep initial assistant message synced with `INITIAL_MESSAGE`.
- `app/api/turn_response/route.ts`: Only place constructing OpenAI `responses.create` call.
- `app/api/functions/*`: Server wrappers for callable functions (must align w/ client wrappers & schemas).
- `app/api/vector_stores/*`: CRUD around OpenAI vector stores & files (used by file_search tool).
- `components/*`: Presentational + orchestration UI (e.g. `assistant.tsx` wires store + rendering, `tool-call.tsx` renders tool progress, etc.).

## 3. Tool & Function Conventions
- Function tools: Each entry in `tools-list.ts` => same-named exported function in `config/functions.ts` => matching API route under `app/api/functions/<name>/route.ts` (HTTP GET with query params or POST body). Keep parameters JSON-serializable; schemas use `required: Object.keys(parameters)`.
- New tool type (e.g., custom MCP server): add feature flag fields to `useToolsStore`, extend `getTools()`, and implement rendering in `components/tool-call.tsx` if it emits distinct events.
- Google connectors: Controlled by `googleIntegrationEnabled` flag; token refresh via `lib/googleTokens.ts` (not heavily modified unless changing OAuth strategy).

## 4. Streaming Event Handling
`lib/assistant.ts` processes `event` strings from SSE. To add a new stream event:
1. Locate switch in `handleTurn` callback.
2. Add a case BEFORE `response.completed` for incremental events; use patterns from existing `*.delta` handlers (accumulate text/args, attempt `partial-json` parse, update store immutably then flush with spread copy).
3. Ensure finalizing event (`*.done` / `*.completed`) marks status and pushes to `conversationItems` if it should be sent back to model.

## 5. State Management Rules
- Always mutate via setters or mutate draft then `set([...])` pattern used (immutability required so React rerenders).
- `conversationItems` mirrors ONLY items actually sent to the OpenAI API; do not push transient UI-only items (e.g. partial deltas) there.
- After a function tool completes, code re-enters `processMessages()` to let the model incorporate tool output—preserve this recursion when adding new tool types that require follow-up reasoning.

## 6. Adding a New Function Tool (Example)
Steps (example: `get_stock_price`):
1. `config/tools-list.ts`: Add schema object `{ name: "get_stock_price", description: "Get latest price", parameters: { symbol: { type: "string", description: "Ticker" }}}`.
2. `app/api/functions/get_stock_price/route.ts`: Implement handler calling external API.
3. `config/functions.ts`: Export `get_stock_price({ symbol })` wrapper fetching `/api/functions/get_stock_price?symbol=...`; add to `functionsMap`.
4. UI: No changes unless custom rendering needed.
5. Restart dev server if type augmentation required.

## 7. Vector Store / File Search Pattern
- Creation: `POST /api/vector_stores/create_store` => returns store id stored in `useToolsStore` (not shown here but assumed by UI). File upload: encode file -> `/api/vector_stores/upload_file` -> file id -> `/api/vector_stores/add_file` attaches to store. File search tool expects `vector_store_ids: [currentId]`.
- Avoid large base64 in logs; current implementation base64 decodes then constructs `File` object for OpenAI SDK.

## 8. Environment & Secrets
- Required: `OPENAI_API_KEY` (runtime for all API routes hitting OpenAI). Optional: Google OAuth vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`). Keep secrets in `.env.local` (Next.js loads) and never commit.
- Model constant (`MODEL`) centralized; change there only.

## 9. Coding Style / Dependencies
- TypeScript strict-ish (implicit any avoided). Use existing patterns for error handling: `try/catch` per route returning `status 500` with simple message.
- Streaming uses native `ReadableStream` + manual SSE formatting (`data: <json>\n\n`); preserve protocol when modifying.
- JSON argument streaming uses `partial-json` parser—do not replace unless you handle partial tokens gracefully.

## 10. Common Pitfalls
- Forgetting to append new function to `functionsMap` = runtime tool execution failure (assistant never sends function output back).
- Mismatch between tool schema `parameters` and handler query param names leads to undefined server values.
- Not re-triggering `processMessages()` after tool output => assistant stalls.
- Pushing UI-only interim deltas into `conversationItems` bloats context and confuses model.

## 11. Local Dev Workflow
- Install: `npm install`
- Run: `npm run dev` (port 3000). No custom build steps beyond Next.js.
- Lint: `npm run lint`
- Build prod: `npm run build && npm start`

## 12. Safe Change Checklist
Before committing changes involving assistant logic:
- Added tool? Schema + function + API route + functionsMap updated.
- Streaming event? Added delta + done handlers; status transitions validated.
- Modified prompt? Ensure deterministic; avoid leaking secrets; keep date injection logic.

Feedback: Clarify any section you find incomplete or if deeper guidance on OAuth, MCP extensions, or vector store lifecycle is needed.
