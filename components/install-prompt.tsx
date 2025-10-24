'use client';

import React from 'react';
import { Block, Button, Icon } from 'framework7-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installPrompt, dismissPrompt } = useInstallPrompt();

  // Don't show if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <Block className="install-prompt-banner" style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      zIndex: 1000,
      background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
      padding: '16px',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Icon f7="arrow_down_to_line" size={32} color="white" />
          <div className="flex-1">
            <p className="text-white font-bold text-base mb-1">
              Install AI Chat
            </p>
            <p className="text-white/90 text-sm">
              Get quick access & offline support
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            fill
            round
            small
            onClick={installPrompt || (() => {})}
            style={{
              backgroundColor: 'white',
              color: '#9c27b0',
              fontWeight: 'bold',
            }}
          >
            Install
          </Button>
          <Button
            round
            small
            onClick={dismissPrompt}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            Not now
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Block>
  );
}
