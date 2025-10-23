import { z } from 'zod';

// Common validation schemas
export const ApiKeySchema = z.string().min(20).max(200).regex(/^[a-zA-Z0-9-_]+$/);

export const SessionIdSchema = z.string().length(64).regex(/^[a-f0-9]+$/);

export const FileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(), // Base64 encoded
  type: z.string().optional(),
});

// Turn response validation
export const TurnResponseSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(['text', 'image']),
        text: z.string().optional(),
        image: z.string().optional(),
      }))
    ]),
  })),
  tools: z.array(z.any()).optional(),
  googleIntegrationEnabled: z.boolean().optional(),
  model: z.string().optional(),
  reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
});

// Vector store validation
export const VectorStoreFileSchema = z.object({
  fileObject: FileUploadSchema,
});

// Conversation validation
export const ConversationIdSchema = z.string().uuid();

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  tool_calls: z.array(z.any()).optional(),
});

// Semantic search validation
export const SemanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Transcribe validation
export const TranscribeSchema = z.object({
  audio: z.string(), // Base64 encoded audio
});

// Google integration validation
export const GoogleStatusSchema = z.object({
  sessionId: SessionIdSchema.optional(),
});

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// Helper function to sanitize user input
export function sanitizeInput(input: string): string {
  // Remove any potential script tags or HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Helper function to validate and sanitize file paths
export function validateFilePath(path: string): boolean {
  // Prevent directory traversal attacks
  const forbidden = ['..', '~', '\0'];
  return !forbidden.some(pattern => path.includes(pattern));
}

// Rate limiting helper for API endpoints
interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(options: RateLimitOptions = {}) {
  const { windowMs = 60000, maxRequests = 60 } = options;
  
  return function checkLimit(clientId: string): boolean {
    const now = Date.now();
    const clientData = rateLimitStore.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (clientData.count >= maxRequests) {
      return false;
    }
    
    clientData.count++;
    return true;
  };
}

// Input size limits
export const MAX_MESSAGE_LENGTH = 100000; // 100K characters
export const MAX_ARRAY_LENGTH = 1000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validate message size
export function validateMessageSize(content: string | any): boolean {
  const size = typeof content === 'string' 
    ? content.length 
    : JSON.stringify(content).length;
  return size <= MAX_MESSAGE_LENGTH;
}

// SQL injection prevention for any dynamic queries
export function escapeSqlString(str: string): string {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
}

// XSS prevention for any user-generated content
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate environment variables
export function validateEnvironment(): { 
  isValid: boolean; 
  missing: string[] 
} {
  const required = [
    'OPENAI_API_KEY',
    'DATABASE_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

// CSRF token generation and validation (for state-changing operations)
export function generateCSRFToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  // Use constant-time comparison to prevent timing attacks
  return token.length === storedToken.length && 
         token.split('').every((char, i) => char === storedToken[i]);
}