'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useConversationStore from '@/stores/useConversationStore';

// Dynamically import the working chat component
const ModernChatFixed = dynamic(
  () => import('@/components/modern-chat-fixed').then(mod => ({ default: mod.ModernChatFixed })),
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
    <>
      <ModernChatFixed />
      <PWAInstallPrompt />
    </>
  );
}