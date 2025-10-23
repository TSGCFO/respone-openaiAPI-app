'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { View, Page } from 'framework7-react';
import { F7ChatPage } from '@/components/f7-chat-page';
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

  return (
    <View main>
      <Page>
        <F7ChatPage />
      </Page>
    </View>
  );
}
