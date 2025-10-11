import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, createConversation } from '@/lib/db/conversations';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const conversations = await getUserConversations(userId);
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'default_user';
    
    const conversation = await createConversation({
      ...body,
      userId,
    });
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}