import { NextRequest, NextResponse } from 'next/server';
import { createSemanticMemory, getAllSemanticMemories, db } from '@/lib/db/conversations';
import { semanticMemories } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const memories = await getAllSemanticMemories(userId, limit);
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Failed to get semantic memories:', error);
    return NextResponse.json(
      { error: 'Failed to get semantic memories' },
      { status: 500 }
    );
  }
}

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

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const memoryId = searchParams.get('id');
    
    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }
    
    const [deleted] = await db
      .delete(semanticMemories)
      .where(and(
        eq(semanticMemories.id, parseInt(memoryId)),
        eq(semanticMemories.userId, userId)
      ))
      .returning();
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Failed to delete semantic memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete semantic memory' },
      { status: 500 }
    );
  }
}