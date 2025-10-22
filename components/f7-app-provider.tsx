'use client';

import React from 'react';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'swiper/css';
import './f7-custom-styles.css';

interface F7AppProviderProps {
  children: React.ReactNode;
}

export function F7AppProvider({ children }: F7AppProviderProps) {
  React.useEffect(() => {
    // Add Framework7 theme classes to body
    document.body.classList.add('theme-dark', 'color-theme-purple', 'md');
    
    // Set up haptic feedback for Android
    if ('vibrate' in navigator) {
      const handleClick = () => {
        navigator.vibrate(1);
      };
      document.addEventListener('click', handleClick);
      
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return <>{children}</>;
}