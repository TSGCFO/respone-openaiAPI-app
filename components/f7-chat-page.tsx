'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Page,
  Navbar,
  NavRight,
  NavTitle,
  Messages,
  Message,
  Messagebar,
  Link,
  f7,
  Icon,
  Toolbar,
  Block,
} from 'framework7-react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';
import { ModelSelector } from './f7-model-selector';
import { ReasoningEffortSelector } from './f7-reasoning-selector';
import { InstallPrompt } from './install-prompt';
import { OfflineIndicator } from './offline-indicator';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export function F7ChatPage() {
  const {
    chatMessages,
    addChatMessage,
    isStreaming,
    setIsStreaming,
  } = useConversationStore();
  
  const { selectedModel } = useToolsStore();
  
  const [message, setMessage] = useState('');
  const messagesRef = useRef<any>(null);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    resetRecording,
  } = useAudioRecorder();

  // Offline queue management
  const { isOnline, queue, addToQueue } = useOfflineQueue(async (queuedMessage) => {
    // Sync function: send queued message when back online
    addChatMessage({
      type: 'message',
      role: 'user' as const,
      content: [{ type: 'input_text', text: queuedMessage.content }]
    });
    await processMessages();
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (isStreaming) return;

    const messageText = message;
    setMessage('');

    // If offline, queue the message
    if (!isOnline) {
      addToQueue(messageText);
      f7.toast.create({
        text: 'Message queued. Will send when online.',
        position: 'center',
        closeTimeout: 2000,
      }).open();
      return;
    }

    addChatMessage({
      type: 'message',
      role: 'user' as const,
      content: [{ type: 'input_text', text: messageText }]
    });
    setIsStreaming(true);

    try {
      await processMessages();
    } catch (error) {
      console.error('Error processing messages:', error);
      f7.dialog.alert('Failed to send message. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      stopRecording();
      
      // Process audio with Whisper
      if (audioBlob) {
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const { text } = await response.json();
            setMessage(text);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          f7.dialog.alert('Failed to transcribe audio.');
        } finally {
          resetRecording();
        }
      }
    } else {
      startRecording();
    }
  };

  const openToolsPanel = () => {
    f7.panel.open('left');
  };

  const openMcpServersPanel = () => {
    f7.panel.open('right');
  };

  return (
    <Page className="messages-page">
      {/* Android-style Navbar */}
      <Navbar>
        <NavTitle sliding>
          <div className="flex items-center gap-2">
            <Icon f7="bubble_left_bubble_right" size={20} aria-hidden="true" />
            <span>AI Assistant</span>
          </div>
        </NavTitle>
        <NavRight>
          <Link
            iconF7="gear_alt"
            onClick={openMcpServersPanel}
            aria-label="Open MCP servers settings"
          />
          <Link
            iconF7="square_grid_3x2"
            onClick={openToolsPanel}
            aria-label="Open tools panel"
          />
        </NavRight>
      </Navbar>

      {/* Model & Reasoning Selector Toolbar */}
      {selectedModel && (
        <Toolbar top>
          <div className="toolbar-inner">
            <div className="flex items-center gap-2 w-full">
              <ModelSelector />
              {selectedModel.includes('gpt-5') && (
                <ReasoningEffortSelector />
              )}
            </div>
          </div>
        </Toolbar>
      )}

      {/* Messages Area */}
      <div role="log" aria-live="polite" aria-atomic="false" aria-label="Chat messages">
        <Messages ref={messagesRef}>
        {chatMessages.length === 0 ? (
          <Block className="text-center">
            <div className="empty-state">
              <Icon f7="bubble_left_bubble_right" size={48} color="gray" aria-hidden="true" />
              <p className="text-gray-500 mt-2">Start a conversation</p>
            </div>
          </Block>
        ) : (
          chatMessages
            .filter((item) => item.type === 'message')
            .map((msg: any, index) => (
              <Message
                key={(msg as any).id || index}
                type={msg.role === 'user' ? 'sent' : 'received'}
                text={typeof msg.content === 'string' ? msg.content : 
                      Array.isArray(msg.content) ? msg.content.map((c: any) => c.text || '').join('') :
                      JSON.stringify(msg.content)}
                textFooter={''}
                first={index === 0 || chatMessages[index - 1]?.type === 'message' && (chatMessages[index - 1] as any)?.role !== msg.role}
                last={index === chatMessages.length - 1 || chatMessages[index + 1]?.type === 'message' && (chatMessages[index + 1] as any)?.role !== msg.role}
                tail={index === chatMessages.length - 1 || chatMessages[index + 1]?.type === 'message' && (chatMessages[index + 1] as any)?.role !== msg.role}
              />
            ))
        )}
        
        {isStreaming && (
          <Message
            type="received"
            typing
          />
        )}
      </Messages>
      </div>

      {/* Android-style Message Input Bar */}
      <Messagebar
        placeholder="Type a message..."
        value={message}
        onInput={(e) => setMessage(e.target.value)}
        sheetVisible={false}
        aria-label="Message input"
      >
        <Link
          iconF7="paperclip"
          slot="inner-start"
          onClick={() => {
            // Handle attachments
            f7.dialog.alert('Attachments coming soon!');
          }}
          aria-label="Attach file"
        />

        {/* Voice Recording Button */}
        <Link
          slot="inner-end"
          onClick={handleVoiceRecord}
          aria-label={isRecording ? "Stop recording" : "Start voice recording"}
          aria-pressed={isRecording}
        >
          <Icon
            f7={isRecording ? 'stop_circle' : 'mic'}
            size={24}
            color={isRecording ? 'red' : 'primary'}
            className={isRecording ? 'recording-active' : ''}
            aria-hidden="true"
          />
        </Link>

        {/* Send Button */}
        <Link
          slot="inner-end"
          onClick={handleSendMessage}
          className={!message.trim() ? 'disabled' : ''}
          aria-label="Send message"
          aria-disabled={!message.trim() || isStreaming}
        >
          <Icon f7="paperplane" size={24} color="primary" aria-hidden="true" />
        </Link>
      </Messagebar>

      {/* Offline Indicator */}
      <OfflineIndicator isOnline={isOnline} queueLength={queue.length} />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </Page>
  );
}