import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getFreshAccessToken } from "@/lib/googleTokens";
import { withGoogleConnector } from "@/lib/tools/connectors";
import { getRelevantMemories } from "@/lib/db/conversations";

export async function POST(request: Request) {
  try {
    const { messages, tools, googleIntegrationEnabled, model, reasoningEffort } = await request.json();
    console.log("Received messages:", messages);
    console.log("Model:", model || MODEL, "Reasoning Effort:", reasoningEffort);

    // Get fresh tokens (refresh if near expiry or missing access token when refresh exists)
    const { accessToken } = await getFreshAccessToken();

    // Build tools list, conditionally adding the Google Calendar connector via MCP
    const toolsWithConnector = withGoogleConnector(
      Array.isArray(tools) ? tools : [],
      { enabled: Boolean(googleIntegrationEnabled), accessToken }
    );

    // Enhanced memory retrieval for comprehensive context
    let profileMemories: any[] = [];
    let queryMemories: any[] = [];
    let locationMemories: any[] = [];
    
    if (messages && messages.length > 0) {
      // Find the latest user message
      const userMessages = messages.filter((m: any) => m.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        const messageContent = typeof latestUserMessage.content === 'string' 
          ? latestUserMessage.content 
          : latestUserMessage.content?.[0]?.text || '';
        
        // Get comprehensive memory context
        try {
          // Always use 'default_user' for consistency
          const userId = 'default_user';
          
          const memoryResults = await getRelevantMemories(messageContent, userId, {
            includeProfile: true,
            searchLimit: 10,
            minProfileImportance: 6  // Lower threshold to catch more profile info
          });
          
          profileMemories = memoryResults.profileMemories;
          queryMemories = memoryResults.queryMemories;
          locationMemories = memoryResults.locationMemories;
          
          console.log(`Memory retrieval results:
            - Profile memories: ${profileMemories.length}
            - Query-specific memories: ${queryMemories.length}
            - Location memories: ${locationMemories.length}`);
        } catch (error) {
          console.error('Failed to retrieve memories:', error);
          // Continue without memories if search fails
        }
      }
    }

    // Create enhanced instructions with comprehensive memory context
    let enhancedInstructions = getDeveloperPrompt();
    
    // Build comprehensive memory context sections
    const memoryContextSections: string[] = [];
    
    // Add profile memories with high priority
    if (profileMemories.length > 0) {
      const profileContext = profileMemories
        .map(mem => `- ${mem.summary || mem.content} [importance: ${mem.importance}/10]`)
        .join('\n');
      memoryContextSections.push(`### User Profile Information (Always Remember):
${profileContext}`);
    }
    
    // Add location context for time/location-sensitive queries
    if (locationMemories.length > 0) {
      const locationContext = locationMemories
        .map(mem => `- ${mem.summary || mem.content}`)
        .join('\n');
      memoryContextSections.push(`### User Location Context:
${locationContext}`);
    }
    
    // Add query-specific context
    if (queryMemories.length > 0) {
      const queryContext = queryMemories
        .map(mem => `- ${mem.summary || mem.content}`)
        .join('\n');
      memoryContextSections.push(`### Related Context:
${queryContext}`);
    }
    
    // If we have any memories, create enhanced instructions
    if (memoryContextSections.length > 0) {
      enhancedInstructions = `${getDeveloperPrompt()}

## IMPORTANT: User Context and Personal Information

${memoryContextSections.join('\n\n')}

### CRITICAL INSTRUCTIONS:
1. **ALWAYS use the user's stored information** when answering questions, especially:
   - When asked about time/date, use their location to determine the correct timezone
   - When discussing weather, use their location
   - Reference their name and preferences when appropriate
   
2. **For time-related queries**: If the user has a stored location (e.g., "Canada", "Toronto"), ALWAYS provide the time in their local timezone. Never give generic UTC time if you know where they are.

3. **Personalize responses** using the stored context. Show that you remember the user by naturally incorporating what you know about them.

4. **If location is known** and relevant to the query (time, weather, local information), use it proactively without asking for it again.

Remember: You have access to the user's stored memories above. Use them to provide accurate, personalized, and contextually appropriate responses.`;
    }

    const openai = new OpenAI();

    // Use provided model or fall back to MODEL constant
    const selectedModel = model || MODEL;
    
    // Build API parameters
    const apiParams: any = {
      model: selectedModel,
      input: messages,
      instructions: enhancedInstructions,
      tools: toolsWithConnector as any,
      stream: true,
      parallel_tool_calls: false,
    };

    // Add reasoning.effort for GPT-5 models
    if (selectedModel === 'gpt-5' && reasoningEffort) {
      apiParams.reasoning = { effort: reasoningEffort };
      console.log(`Using GPT-5 with reasoning effort: ${reasoningEffort}`);
    }

    // Cast to any to bypass TypeScript's type checking for the AsyncIterable
    const events = await openai.responses.create(apiParams) as any;

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
