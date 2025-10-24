import { useState, useEffect, useCallback } from 'react';

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

interface OfflineQueueState {
  isOnline: boolean;
  queue: QueuedMessage[];
  addToQueue: (message: string) => void;
  removeFromQueue: (id: string) => void;
  syncQueue: () => Promise<void>;
  clearQueue: () => void;
}

const QUEUE_STORAGE_KEY = 'offline-message-queue';
const MAX_RETRY_ATTEMPTS = 3;

export function useOfflineQueue(
  onSync?: (message: QueuedMessage) => Promise<void>
): OfflineQueueState {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize queue from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue);
        setQueue(parsed);
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
      }
    }

    // Set initial online status
    setIsOnline(navigator.onLine);
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored - syncing queue');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Connection lost - queuing messages');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline]);

  const addToQueue = useCallback((message: string) => {
    const queuedMessage: QueuedMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };

    setQueue((prev) => [...prev, queuedMessage]);

    console.log('Message added to offline queue:', queuedMessage.id);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || queue.length === 0) return;

    setIsSyncing(true);

    console.log(`Syncing ${queue.length} queued messages...`);

    const updatedQueue: QueuedMessage[] = [];

    for (const message of queue) {
      if (message.synced) {
        continue; // Skip already synced messages
      }

      try {
        if (onSync) {
          await onSync(message);
        }

        console.log(`Synced message: ${message.id}`);

        // Mark as synced (will be removed from queue)
      } catch (error) {
        console.error(`Failed to sync message ${message.id}:`, error);

        // Increment retry count
        const updatedMessage: QueuedMessage = {
          ...message,
          retryCount: message.retryCount + 1,
        };

        // Keep in queue if under retry limit
        if (updatedMessage.retryCount < MAX_RETRY_ATTEMPTS) {
          updatedQueue.push(updatedMessage);
        } else {
          console.warn(`Message ${message.id} exceeded retry limit, removing from queue`);
        }
      }
    }

    setQueue(updatedQueue);
    setIsSyncing(false);

    console.log(`Sync complete. ${updatedQueue.length} messages remain in queue.`);
  }, [isOnline, isSyncing, queue, onSync]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  return {
    isOnline,
    queue,
    addToQueue,
    removeFromQueue,
    syncQueue,
    clearQueue,
  };
}
