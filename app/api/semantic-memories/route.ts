import { NextRequest, NextResponse } from 'next/server';
import { createSemanticMemory } from '@/lib/db/conversations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'default_user';
    
    const memory = await createSemanticMemory({
      ...body,
      userId,
      generateEmbedding: body.generateEmbedding !== false, // Default to true
    });
    
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Failed to create semantic memory:', error);
    return NextResponse.json(
      { error: 'Failed to create semantic memory' },
      { status: 500 }
    );
  }
}