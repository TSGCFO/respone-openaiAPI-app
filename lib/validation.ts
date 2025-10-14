import { z } from 'zod';

// Common validation schemas
export const idSchema = z.coerce.number().int().positive();

export const conversationUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  summary: z.string().optional(),
  metadata: z.any().optional(),
});

export const messageCreateSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([z.string(), z.array(z.any())]),
  contentType: z.enum(['text', 'json']).optional(),
  metadata: z.any().optional(),
  generateEmbedding: z.boolean().optional(),
  toolCalls: z.array(z.object({
    toolType: z.string(),
    toolName: z.string(),
    arguments: z.any().optional(),
    result: z.any().optional(),
    status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  })).optional(),
});

export const semanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  conversationId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const vectorStoreSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const fileIdSchema = z.object({
  vectorStoreId: z.string().min(1),
  fileId: z.string().min(1),
});

// Helper function to validate request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', error.errors);
    }
    throw error;
  }
}

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}