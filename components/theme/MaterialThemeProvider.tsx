'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { createMaterialYouTheme, materialMotion, materialYouColors } from './materialYouTheme';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

interface MaterialThemeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const MaterialThemeContext = createContext<MaterialThemeContextType | undefined>(undefined);

export const useMaterialTheme = () => {
  const context = useContext(MaterialThemeContext);
  if (!context) {
    throw new Error('useMaterialTheme must be used within MaterialThemeProvider');
  }
  return context;
};

interface MaterialThemeProviderProps {
  children: React.ReactNode;
}

export function MaterialThemeProvider({ children }: MaterialThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState<string>(materialYouColors.primary[40]);

  // Check for system preference and stored preference
  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    
    if (savedMode) {
      setMode(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Configure Android system bars
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    const themeColor = mode === 'light' 
      ? materialYouColors.neutral[95]
      : materialYouColors.neutral[10];
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColor;
      document.head.appendChild(meta);
    }

    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', mode === 'light' ? 'default' : 'black-translucent');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = mode === 'light' ? 'default' : 'black-translucent';
      document.head.appendChild(meta);
    }

    // Set body background for proper theming
    document.body.style.backgroundColor = mode === 'light'
      ? materialYouColors.neutral[99]
      : materialYouColors.neutral[10];
    
    // Add smooth transition for theme changes
    document.body.style.transition = `background-color ${materialMotion.duration.medium1}ms ${materialMotion.easing.emphasized}`;
  }, [mode]);

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const theme = useMemo(() => createMaterialYouTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
      primaryColor,
      setPrimaryColor,
    }),
    [mode, primaryColor]
  );

  return (
    <MaterialThemeContext.Provider value={contextValue}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <style jsx global>{`
            /* Material You CSS Variables */
            :root {
              /* Touch target sizes */
              --min-touch-target: 48px;
              --recommended-touch-target: 56px;
              
              /* Safe area insets for mobile devices */
              --safe-area-inset-top: env(safe-area-inset-top);
              --safe-area-inset-right: env(safe-area-inset-right);
              --safe-area-inset-bottom: env(safe-area-inset-bottom);
              --safe-area-inset-left: env(safe-area-inset-left);
              
              /* Android-style ripple effect */
              --ripple-color: ${mode === 'light' 
                ? `rgba(103, 80, 164, 0.12)` 
                : `rgba(208, 188, 255, 0.12)`};
              
              /* Scrollbar styling for Android feel */
              --scrollbar-width: 8px;
              --scrollbar-color: ${mode === 'light'
                ? materialYouColors.neutralVariant[60]
                : materialYouColors.neutralVariant[40]};
            }
            
            /* Custom scrollbar styling for Android feel */
            * {
              scrollbar-width: thin;
              scrollbar-color: var(--scrollbar-color) transparent;
            }
            
            *::-webkit-scrollbar {
              width: var(--scrollbar-width);
              height: var(--scrollbar-width);
            }
            
            *::-webkit-scrollbar-track {
              background: transparent;
            }
            
            *::-webkit-scrollbar-thumb {
              background-color: var(--scrollbar-color);
              border-radius: 4px;
              border: 2px solid transparent;
              background-clip: content-box;
            }
            
            *::-webkit-scrollbar-thumb:hover {
              background-color: ${mode === 'light'
                ? materialYouColors.neutralVariant[50]
                : materialYouColors.neutralVariant[50]};
            }
            
            /* Ensure all interactive elements meet minimum touch target */
            button, a, input, textarea, select, [role="button"], [role="link"] {
              min-width: var(--min-touch-target);
              min-height: var(--min-touch-target);
              touch-action: manipulation;
            }
            
            /* Smooth scrolling with momentum on touch devices */
            html, body {
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior-y: contain;
            }
            
            /* Disable text selection on UI elements for native feel */
            button, nav, header, footer {
              -webkit-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Material ripple effect base */
            .material-ripple {
              position: relative;
              overflow: hidden;
              -webkit-tap-highlight-color: transparent;
            }
            
            .material-ripple::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              border-radius: 50%;
              background: var(--ripple-color);
              transform: translate(-50%, -50%);
              transition: width ${materialMotion.duration.medium2}ms ${materialMotion.easing.emphasized},
                         height ${materialMotion.duration.medium2}ms ${materialMotion.easing.emphasized};
            }
            
            .material-ripple:active::before {
              width: 100%;
              height: 100%;
            }
            
            /* Prevent pull-to-refresh on non-scrollable areas */
            body {
              overscroll-behavior-y: ${mode === 'light' ? 'contain' : 'contain'};
            }
            
            /* Safe area padding for notched devices */
            .safe-top {
              padding-top: var(--safe-area-inset-top);
            }
            
            .safe-bottom {
              padding-bottom: var(--safe-area-inset-bottom);
            }
            
            .safe-left {
              padding-left: var(--safe-area-inset-left);
            }
            
            .safe-right {
              padding-right: var(--safe-area-inset-right);
            }
            
            /* Material You elevation classes */
            .elevation-0 {
              box-shadow: none;
            }
            
            .elevation-1 {
              box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 
                         0px 1px 3px 1px rgba(0, 0, 0, 0.15);
            }
            
            .elevation-2 {
              box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 
                         0px 2px 6px 2px rgba(0, 0, 0, 0.15);
            }
            
            .elevation-3 {
              box-shadow: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 
                         0px 1px 3px 0px rgba(0, 0, 0, 0.3);
            }
            
            .elevation-4 {
              box-shadow: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 
                         0px 2px 3px 0px rgba(0, 0, 0, 0.3);
            }
            
            .elevation-5 {
              box-shadow: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 
                         0px 4px 4px 0px rgba(0, 0, 0, 0.3);
            }
            
            /* Android-style focus ring */
            *:focus-visible {
              outline: 2px solid ${mode === 'light' 
                ? materialYouColors.primary[40]
                : materialYouColors.primary[80]};
              outline-offset: 2px;
            }
            
            /* Disable default iOS styling */
            input, textarea, select {
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
            }
            
            /* Prevent zoom on input focus on iOS */
            input[type="text"],
            input[type="number"],
            input[type="email"],
            input[type="tel"],
            input[type="password"],
            input[type="search"],
            input[type="url"],
            textarea,
            select {
              font-size: 16px;
            }
            
            /* Material motion classes */
            .motion-reduce {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
            
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          `}</style>
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </MaterialThemeContext.Provider>
  );
}