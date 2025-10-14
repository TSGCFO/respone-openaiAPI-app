import { NextRequest, NextResponse } from 'next/server';
import { 
  getConversation, 
  updateConversation, 
  deleteConversation,
  getConversationMessages 
} from '@/lib/db/conversations';
import { 
  idSchema, 
  conversationUpdateSchema, 
  validateRequest, 
  ValidationError 
} from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id);
    
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    const messages = await getConversationMessages(conversationId);
    
    return NextResponse.json({ 
      conversation,
      messages 
    });
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = idSchema.parse(id);
    const validatedBody = await validateRequest(request, conversationUpdateSchema);
    
    const conversation = await updateConversation(conversationId, validatedBody);
    
    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id);
    
    await deleteConversation(conversationId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}