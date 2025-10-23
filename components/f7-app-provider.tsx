'use client';

import React, { useEffect } from 'react';
import { App } from 'framework7-react';

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
  // Framework7 app parameters
  const f7params = {
    name: 'AI Chat Assistant',
    theme: 'md', // Android Material Design
    darkMode: true,
    colors: {
      primary: '#9c27b0',
    },
    touch: {
      tapHold: true,
      tapHoldDelay: 750,
      tapHoldPreventClicks: true,
      iosTouchRipple: false,
      mdTouchRipple: true,
    },
    navbar: {
      mdCenterTitle: false,
      iosCenterTitle: true,
    },
    toolbar: {
      hideOnPageScroll: false,
    },
    statusbar: {
      androidBackgroundColor: '#7b1fa2',
      androidTextColor: 'white',
      iosBackgroundColor: '#9c27b0',
      iosTextColor: 'white',
    },
    // Android-specific settings
    material: {
      materialDynamicTheme: true,
    },
  };

  // Set up global haptic feedback for Android
  useEffect(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // Light haptic feedback on all taps (Android pattern)
      const handleClick = () => {
        navigator.vibrate(1);
      };

      document.addEventListener('click', handleClick, { passive: true });

      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <App {...f7params}>
      {children}
    </App>
  );
}
