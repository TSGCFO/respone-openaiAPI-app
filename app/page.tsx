'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernChatFixed } from '@/components/modern-chat-fixed';
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

  // Add dark mode support
  useEffect(() => {
    document.body.classList.add('font-sans', 'antialiased');
    return () => {
      document.body.classList.remove('font-sans', 'antialiased');
    };
  }, []);

  return <ModernChatFixed />;
}