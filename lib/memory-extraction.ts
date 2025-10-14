import OpenAI from 'openai';

export interface ExtractedFact {
  fact: string;
  type: 'personal_info' | 'preference' | 'location' | 'work' | 'relationship' | 'general';
  importance: number; // 1-10
}

// Extract important facts from a conversation exchange
export async function extractFactsFromMessage(
  userMessage: string,
  assistantResponse?: string
): Promise<ExtractedFact[]> {
  // Simple pattern-based extraction for now (can be enhanced with OpenAI later)
  const facts: ExtractedFact[] = [];
  const combinedText = `User: ${userMessage}${assistantResponse ? `\nAssistant: ${assistantResponse}` : ''}`;
  
  // Extract personal information
  const namePatterns = [
    /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(?:this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:speaking|here)/gi,
  ];
  
  for (const pattern of namePatterns) {
    const matches = combinedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        facts.push({
          fact: `User's name is ${match[1]}`,
          type: 'personal_info',
          importance: 9
        });
      }
    }
  }
  
  // Extract location information
  const locationPatterns = [
    /(?:i live in|i'm from|i am from|based in|located in)\s+([A-Za-z\s,]+)/gi,
    /(?:from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z][a-z]+)/gi,
  ];
  
  for (const pattern of locationPatterns) {
    const matches = combinedText.matchAll(pattern);
    for (const match of matches) {
      const location = match[2] ? `${match[1]}, ${match[2]}` : match[1];
      if (location && location.length > 2) {
        facts.push({
          fact: `User is from/lives in ${location}`,
          type: 'location',
          importance: 8
        });
      }
    }
  }
  
  // Extract work/profession information
  const workPatterns = [
    /(?:i work as|i am a|i'm a|my job is|i do)\s+([a-z\s]+)/gi,
    /(?:work at|employed by|job at)\s+([A-Za-z\s&]+)/gi,
  ];
  
  for (const pattern of workPatterns) {
    const matches = combinedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        facts.push({
          fact: `User works as/at ${match[1].trim()}`,
          type: 'work',
          importance: 7
        });
      }
    }
  }
  
  // Extract preferences
  const preferencePatterns = [
    /(?:i prefer|i like|i love|i enjoy)\s+([a-z\s,]+)/gi,
    /(?:i don't like|i dislike|i hate)\s+([a-z\s,]+)/gi,
    /(?:favorite|favourite)\s+(?:is|are)?\s*([a-z\s,]+)/gi,
  ];
  
  for (const pattern of preferencePatterns) {
    const matches = combinedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        const isNegative = combinedText.toLowerCase().includes("don't like") || 
                          combinedText.toLowerCase().includes("dislike") || 
                          combinedText.toLowerCase().includes("hate");
        facts.push({
          fact: `User ${isNegative ? 'dislikes' : 'likes'} ${match[1].trim()}`,
          type: 'preference',
          importance: 5
        });
      }
    }
  }
  
  return facts;
}

// Generate a smart summary based on extracted facts
export function generateSmartSummary(
  userMessage: string,
  facts: ExtractedFact[]
): string {
  if (facts.length > 0) {
    // Prioritize by importance
    const topFacts = facts
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(f => f.fact);
    
    if (topFacts.length > 0) {
      return topFacts.join('. ');
    }
  }
  
  // Fallback to simple summary
  if (userMessage.includes('?')) {
    return `User asked: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`;
  } else if (userMessage.length > 50) {
    return `User said: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`;
  }
  
  return userMessage;
}

// Calculate importance score based on content
export function calculateImportance(
  userMessage: string,
  facts: ExtractedFact[]
): number {
  // Base importance
  let importance = 5;
  
  // Increase for personal information
  if (facts.some(f => f.type === 'personal_info')) {
    importance = Math.max(importance, 9);
  }
  
  // Increase for location information
  if (facts.some(f => f.type === 'location')) {
    importance = Math.max(importance, 8);
  }
  
  // Increase for work information
  if (facts.some(f => f.type === 'work')) {
    importance = Math.max(importance, 7);
  }
  
  // Questions are moderately important
  if (userMessage.includes('?')) {
    importance = Math.max(importance, 6);
  }
  
  // Long messages might be important
  if (userMessage.length > 200) {
    importance = Math.max(importance, 6);
  }
  
  return importance;
}