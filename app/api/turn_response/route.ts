import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getFreshAccessToken } from "@/lib/googleTokens";
import { withGoogleConnector } from "@/lib/tools/connectors";
import { searchSemanticMemories } from "@/lib/db/conversations";

export async function POST(request: Request) {
  try {
    const { messages, tools, googleIntegrationEnabled } = await request.json();
    console.log("Received messages:", messages);

    // Get fresh tokens (refresh if near expiry or missing access token when refresh exists)
    const { accessToken } = await getFreshAccessToken();

    // Build tools list, conditionally adding the Google Calendar connector via MCP
    const toolsWithConnector = withGoogleConnector(
      Array.isArray(tools) ? tools : [],
      { enabled: Boolean(googleIntegrationEnabled), accessToken }
    );

    // Search for relevant memories based on the user's latest message
    let relevantMemories: any[] = [];
    if (messages && messages.length > 0) {
      // Find the latest user message
      const userMessages = messages.filter((m: any) => m.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        const messageContent = typeof latestUserMessage.content === 'string' 
          ? latestUserMessage.content 
          : latestUserMessage.content?.[0]?.text || '';
        
        // Search semantic memories based on the user's message
        try {
          const userId = request.headers.get('x-user-id') || 'default_user';
          relevantMemories = await searchSemanticMemories(messageContent, userId, 5);
          console.log(`Found ${relevantMemories.length} relevant memories for query:`, messageContent);
        } catch (error) {
          console.error('Failed to search memories:', error);
          // Continue without memories if search fails
        }
      }
    }

    // Create enhanced instructions with memory context
    let enhancedInstructions = getDeveloperPrompt();
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .map(mem => `- ${mem.summary || mem.content}`)
        .join('\n');
      
      enhancedInstructions = `${getDeveloperPrompt()}

## User Context (from previous conversations):
${memoryContext}

Use this context to provide more personalized and informed responses. Remember facts about the user and reference them when relevant.`;
    }

    const openai = new OpenAI();

    const events = await openai.responses.create({
      model: MODEL,
      input: messages,
      instructions: enhancedInstructions,
      tools: toolsWithConnector as any,
      stream: true,
      parallel_tool_calls: false,
    });

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
