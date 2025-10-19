'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { F7SimpleChat } from '@/components/f7-simple-chat';
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

  return <F7SimpleChat />;
}