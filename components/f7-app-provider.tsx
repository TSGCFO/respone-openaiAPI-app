'use client';

import React, { useEffect, useState } from 'react';
import { App, Panel, View, Page, Block } from 'framework7-react';
import { F7ToolsPanel } from './f7-tools-panel';
import { F7McpServersPanel } from './f7-mcp-servers-panel';

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
  const [mounted, setMounted] = useState(false);

  // Framework7 app parameters - simplified to avoid circular references in SSR
  const f7params = {
    name: 'AI Chat Assistant',
    theme: 'md',
    darkMode: true,
    colors: {
      primary: '#9c27b0',
    },
  };

  // Set up global haptic feedback for Android
  useEffect(() => {
    setMounted(true);

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
      {/* Panels - only render after mounted */}
      {mounted && (
        <>
          <Panel left cover>
            <View>
              <Page>
                <Block>
                  <F7ToolsPanel />
                </Block>
              </Page>
            </View>
          </Panel>

          <Panel right reveal>
            <View>
              <Page>
                <Block>
                  <F7McpServersPanel />
                </Block>
              </Page>
            </View>
          </Panel>
        </>
      )}

      {children}
    </App>
  );
}
