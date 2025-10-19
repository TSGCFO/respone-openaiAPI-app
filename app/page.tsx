'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  View,
  Views,
  Panel,
  Page,
  Navbar,
  NavTitle,
  List,
  ListItem,
  Block,
  Icon,
  f7ready,
  f7,
} from 'framework7-react';
import { F7ChatPage } from '@/components/f7-chat-page';
import { F7ToolsPanel } from '@/components/f7-tools-panel';
import { F7McpServersPanel } from '@/components/f7-mcp-servers-panel';
import useConversationStore from '@/stores/useConversationStore';

export default function Main() {
  const router = useRouter();
  const { resetConversation } = useConversationStore();

  // Handle OAuth redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isConnected = new URLSearchParams(window.location.search).get('connected');
    if (isConnected === '1') {
      resetConversation();
      router.replace('/', { scroll: false });
    }
  }, [router, resetConversation]);

  // Initialize Framework7 app features
  useEffect(() => {
    f7ready((f7) => {
      // Set up Android back button behavior
      if (f7.device.android) {
        document.addEventListener('backbutton', () => {
          if (f7.panel.get('.panel-left')?.opened) {
            f7.panel.close();
          } else if (f7.panel.get('.panel-right')?.opened) {
            f7.panel.close();
          } else if (f7.views.main.history.length > 1) {
            f7.views.main.router.back();
          } else {
            // Exit app or show exit confirmation
            f7.dialog.confirm('Exit the app?', () => {
              navigator.app?.exitApp?.();
            });
          }
        });
      }
    });
  }, []);

  return (
    <>
      {/* Left Panel - Tools & Settings */}
      <Panel left cover className="panel-left">
        <F7ToolsPanel />
      </Panel>

      {/* Right Panel - MCP Servers */}
      <Panel right reveal className="panel-right">
        <F7McpServersPanel />
      </Panel>

      {/* Main Views */}
      <Views>
        <View main url="/">
          <F7ChatPage />
        </View>
      </Views>
    </>
  );
}