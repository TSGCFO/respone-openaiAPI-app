import { NextRequest, NextResponse } from 'next/server';
import { createMessage, saveToolCall } from '@/lib/db/conversations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id);
    const body = await request.json();
    
    // Save the message
    const message = await createMessage({
      conversationId,
      role: body.role,
      content: body.content,
      contentType: body.contentType,
      metadata: body.metadata,
      generateEmbedding: body.generateEmbedding !== false, // Default to true
    });
    
    // Save tool calls if any
    if (body.toolCalls && Array.isArray(body.toolCalls)) {
      for (const toolCall of body.toolCalls) {
        await saveToolCall({
          messageId: message.id,
          toolType: toolCall.toolType,
          toolName: toolCall.toolName,
          arguments: toolCall.arguments,
          result: toolCall.result,
          status: toolCall.status || 'pending',
        });
      }
    }
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}