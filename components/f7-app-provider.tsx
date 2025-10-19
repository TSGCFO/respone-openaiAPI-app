'use client';

import React from 'react';

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
  // Simplified provider without Framework7 App wrapper
  // to avoid conflicts with Next.js
  
  React.useEffect(() => {
    // Add Android-specific classes to body
    document.body.classList.add('theme-dark', 'color-theme-purple', 'md');
    
    // Set up haptic feedback for Android
    if ('vibrate' in navigator) {
      document.addEventListener('click', () => {
        // Light haptic feedback on all clicks (Android pattern)
        navigator.vibrate(1);
      });
    }
    
    return () => {
      document.body.classList.remove('theme-dark', 'color-theme-purple', 'md');
    };
  }, []);

  return <>{children}</>;
}