'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useConversationStore from '@/stores/useConversationStore';

// Dynamically import Framework7 components to avoid SSR issues
const F7AppProvider = dynamic(
  () => import('@/components/f7-app-provider').then(mod => ({ default: mod.F7AppProvider })),
  { ssr: false }
);

const F7ChatPage = dynamic(
  () => import('@/components/f7-chat-page').then(mod => ({ default: mod.F7ChatPage })),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(
  () => import('@/components/pwa-install-prompt').then(mod => ({ default: mod.PWAInstallPrompt })),
  { ssr: false }
);

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

  return (
    <F7AppProvider>
      <F7ChatPage />
      <PWAInstallPrompt />
    </F7AppProvider>
  );
}