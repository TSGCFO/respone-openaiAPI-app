'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { App, Panel } from 'framework7-react';

// Import Framework7 styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'swiper/css';

// Custom styles for additional theming
import './f7-custom-styles.css';

// Dynamic imports for code splitting
const F7ToolsPanel = dynamic(() => import('./f7-tools-panel').then(mod => ({ default: mod.F7ToolsPanel })), {
  loading: () => <div className="p-4">Loading tools...</div>,
  ssr: false
});

const F7McpServersPanel = dynamic(() => import('./f7-mcp-servers-panel').then(mod => ({ default: mod.F7McpServersPanel })), {
  loading: () => <div className="p-4">Loading MCP servers...</div>,
  ssr: false
});

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
      {/* Left Panel - Tools */}
      <Panel left cover themeDark>
        <F7ToolsPanel />
      </Panel>

      {/* Right Panel - MCP Servers */}
      <Panel right reveal themeDark>
        <F7McpServersPanel />
      </Panel>

      {children}
    </App>
  );
}
