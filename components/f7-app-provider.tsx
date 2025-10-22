'use client';

import React from 'react';
import { App, View } from 'framework7-react';
import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'swiper/css';
import './f7-custom-styles.css';

interface F7AppProviderProps {
  children: React.ReactNode;
}

export function F7AppProvider({ children }: F7AppProviderProps) {
  // Framework7 parameters - simplified configuration
  const f7params = {
    name: 'AI Assistant',
    theme: 'md',
    darkMode: true,
    colors: {
      primary: '#9c27b0',
    },
    routes: [],
  };

  React.useEffect(() => {
    // Set up haptic feedback for Android
    if ('vibrate' in navigator) {
      document.addEventListener('click', () => {
        navigator.vibrate(1);
      });
    }
  }, []);

  return (
    <App {...f7params}>
      <View main>
        {children}
      </View>
    </App>
  );
}