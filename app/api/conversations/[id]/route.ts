import { NextRequest, NextResponse } from 'next/server';
import { 
  getConversation, 
  updateConversation, 
  deleteConversation,
  getConversationMessages 
} from '@/lib/db/conversations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id);
    const body = await request.json();
    
    const conversation = await updateConversation(conversationId, body);
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id);
    
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