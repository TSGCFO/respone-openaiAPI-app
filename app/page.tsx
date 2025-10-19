'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernChat } from '@/components/modern-chat';
import useConversationStore from '@/stores/useConversationStore';

// Import Framework7 styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'swiper/css';

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

  return <ModernChat />;
}