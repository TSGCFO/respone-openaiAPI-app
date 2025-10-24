'use client';

import React from 'react';
import { Icon } from 'framework7-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  queueLength: number;
}

export function OfflineIndicator({ isOnline, queueLength }: OfflineIndicatorProps) {
  if (isOnline && queueLength === 0) {
    return null;
  }

  return (
    <div
      className="offline-indicator"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 64px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      {!isOnline ? (
        <div
          style={{
            backgroundColor: '#ff3b30',
            color: 'white',
            boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
            padding: '8px 16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <Icon f7="wifi_slash" size={16} />
          <span>Offline</span>
        </div>
      ) : queueLength > 0 ? (
        <div
          style={{
            backgroundColor: '#ff9500',
            color: 'white',
            boxShadow: '0 2px 8px rgba(255, 149, 0, 0.4)',
            padding: '8px 16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <Icon f7="arrow_clockwise" size={16} className="spin-animation" />
          <span>Syncing {queueLength} message{queueLength > 1 ? 's' : ''}...</span>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        :global(.spin-animation) {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
