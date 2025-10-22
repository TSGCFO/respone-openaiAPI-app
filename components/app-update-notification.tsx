'use client';

import React, { useEffect, useState } from 'react';
import { haptics } from '@/lib/haptic';

interface UpdateNotificationProps {
  autoPrompt?: boolean;
  promptDelay?: number;
}

/**
 * Component that listens for service worker updates and prompts user to refresh
 */
export function AppUpdateNotification({ 
  autoPrompt = true, 
  promptDelay = 3000 
}: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Function to check for updates
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        
        setRegistration(reg);

        // Check for waiting service worker (update available)
        if (reg.waiting) {
          setUpdateAvailable(true);
          haptics.notification();
        }

        // Listen for new service workers
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              setUpdateAvailable(true);
              haptics.notification();
            }
          });
        });
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates immediately
    checkForUpdates();

    // Also check periodically (every 30 minutes)
    const interval = setInterval(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        reg.update();
      }
    }, 30 * 60 * 1000);

    // Listen for controller change (when update is applied)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (isRefreshing) return;
      window.location.reload();
    });

    return () => {
      clearInterval(interval);
    };
  }, [isRefreshing]);

  const handleUpdate = async () => {
    if (!registration?.waiting) {
      // Just reload if no waiting worker
      window.location.reload();
      return;
    }

    // Tell the waiting service worker to activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    setIsRefreshing(true);
    haptics.success();
    
    // The page will reload when the new service worker takes control
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    haptics.light();
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slideUp"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          {/* Update Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <svg 
              className="w-6 h-6 text-purple-600 dark:text-purple-400" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79s7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/>
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Update Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A new version of the app is available. Refresh to get the latest features and improvements.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleUpdate}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Refresh to update app"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-0.5 mr-2 h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  'Refresh Now'
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg px-2 py-1"
                aria-label="Dismiss update notification"
              >
                Later
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}