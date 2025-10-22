import { useState, useEffect, useCallback } from 'react';
import { haptics } from '@/lib/haptic';

interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineQueueReturn {
  queuedMessages: QueuedMessage[];
  isOffline: boolean;
  addToQueue: (message: string) => void;
  removeFromQueue: (id: string) => void;
  retryMessage: (id: string) => Promise<void>;
  clearQueue: () => void;
  syncQueue: () => Promise<void>;
}

const QUEUE_KEY = 'offline_message_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Hook for managing offline message queue
 * Automatically stores messages when offline and syncs when online
 */
export function useOfflineQueue(
  onSendMessage?: (message: string) => Promise<void>
): UseOfflineQueueReturn {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Load queued messages from localStorage on mount
  useEffect(() => {
    const loadQueue = () => {
      try {
        const stored = localStorage.getItem(QUEUE_KEY);
        if (stored) {
          const messages = JSON.parse(stored) as QueuedMessage[];
          setQueuedMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load offline queue:', error);
      }
    };

    loadQueue();

    // Check initial online status
    setIsOffline(!navigator.onLine);
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      if (queuedMessages.length > 0) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queuedMessages));
      } else {
        localStorage.removeItem(QUEUE_KEY);
      }
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, [queuedMessages]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      haptics.notification();
      // Auto-sync when coming back online
      syncQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
      haptics.warning();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add a message to the queue
  const addToQueue = useCallback((message: string) => {
    const newMessage: QueuedMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueuedMessages(prev => [...prev, newMessage]);
    haptics.light();
  }, []);

  // Remove a message from the queue
  const removeFromQueue = useCallback((id: string) => {
    setQueuedMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  // Retry sending a specific message
  const retryMessage = useCallback(async (id: string) => {
    if (!onSendMessage || isOffline) {
      return;
    }

    const message = queuedMessages.find(msg => msg.id === id);
    if (!message) {
      return;
    }

    try {
      await onSendMessage(message.content);
      removeFromQueue(id);
      haptics.success();
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update retry count
      setQueuedMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { ...msg, retryCount: msg.retryCount + 1 }
          : msg
      ));

      // Remove if exceeded max retries
      if (message.retryCount + 1 >= MAX_RETRY_COUNT) {
        haptics.error();
        removeFromQueue(id);
      } else {
        haptics.warning();
      }
    }
  }, [queuedMessages, isOffline, onSendMessage, removeFromQueue]);

  // Sync all queued messages
  const syncQueue = useCallback(async () => {
    if (!onSendMessage || isOffline || queuedMessages.length === 0) {
      return;
    }

    const messagesToSync = [...queuedMessages];
    let successCount = 0;
    let failureCount = 0;

    for (const message of messagesToSync) {
      if (message.retryCount >= MAX_RETRY_COUNT) {
        removeFromQueue(message.id);
        continue;
      }

      try {
        await onSendMessage(message.content);
        removeFromQueue(message.id);
        successCount++;
        
        // Small delay between messages to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to sync message:', error);
        failureCount++;
        
        // Update retry count
        setQueuedMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, retryCount: msg.retryCount + 1 }
            : msg
        ));
      }
    }

    // Haptic feedback based on sync results
    if (successCount > 0 && failureCount === 0) {
      haptics.success();
    } else if (failureCount > 0) {
      haptics.warning();
    }
  }, [queuedMessages, isOffline, onSendMessage, removeFromQueue]);

  // Clear all queued messages
  const clearQueue = useCallback(() => {
    setQueuedMessages([]);
    localStorage.removeItem(QUEUE_KEY);
    haptics.light();
  }, []);

  return {
    queuedMessages,
    isOffline,
    addToQueue,
    removeFromQueue,
    retryMessage,
    clearQueue,
    syncQueue,
  };
}