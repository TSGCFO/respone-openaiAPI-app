import { NextRequest, NextResponse } from 'next/server';
import { createMessage, saveToolCall } from '@/lib/db/conversations';
import { 
  idSchema, 
  messageCreateSchema, 
  validateRequest, 
  ValidationError 
} from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = idSchema.parse(id);
    const validatedBody = await validateRequest(request, messageCreateSchema);
    
    // Save the message
    const message = await createMessage({
      conversationId,
      role: validatedBody.role,
      content: validatedBody.content,
      contentType: validatedBody.contentType,
      metadata: validatedBody.metadata,
      generateEmbedding: validatedBody.generateEmbedding !== false, // Default to true
    });
    
    // Save tool calls if any
    if (validatedBody.toolCalls && Array.isArray(validatedBody.toolCalls)) {
      for (const toolCall of validatedBody.toolCalls) {
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
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}