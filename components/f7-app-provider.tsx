'use client';

import React, { useEffect } from 'react';
import { App, f7ready, f7 } from 'framework7-react';
import { f7params } from '@/lib/f7-params';

// Import Framework7 styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'swiper/css';

// Custom styles for additional theming
import './f7-custom-styles.css';

interface F7AppProviderProps {
  children: React.ReactNode;
}

export function F7AppProvider({ children }: F7AppProviderProps) {
  useEffect(() => {
    f7ready((f7) => {
      // Called on Framework7 initialization
      console.log('Framework7 initialized');
      
      // Add Android-specific classes to body
      if (f7.theme === 'md') {
        document.body.classList.add('theme-dark', 'color-theme-purple');
      }
      
      // Set up haptic feedback for Android
      if ('vibrate' in navigator) {
        f7.on('click', () => {
          // Light haptic feedback on all clicks (Android pattern)
          navigator.vibrate(1);
        });
      }
    });
  }, []);

  return (
    <App {...f7params}>
      {children}
    </App>
  );
}