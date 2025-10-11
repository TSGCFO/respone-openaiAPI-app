import { NextRequest, NextResponse } from 'next/server';
import { searchSemanticMemories, searchMessages } from '@/lib/db/conversations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'memories', conversationId, limit = 10 } = body;
    const userId = request.headers.get('x-user-id') || 'default_user';
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    let results;
    
    if (type === 'memories') {
      results = await searchSemanticMemories(query, userId, limit);
    } else if (type === 'messages') {
      results = await searchMessages(query, conversationId, limit);
    } else {
      return NextResponse.json(
        { error: 'Invalid search type' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Semantic search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}