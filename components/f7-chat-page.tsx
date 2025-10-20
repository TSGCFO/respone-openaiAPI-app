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
  MessagebarAttachment,
  MessagebarAttachments,
  Link,
  f7,
  Icon,
  Fab,
  Toolbar,
  Preloader,
  Block,
} from 'framework7-react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';
import { ModelSelector } from './f7-model-selector';
import { ReasoningEffortSelector } from './f7-reasoning-selector';

export function F7ChatPage() {
  const {
    chatMessages,
    conversationItems,
    addChatMessage,
    isStreaming,
    setIsStreaming,
  } = useConversationStore();
  
  const { selectedModel, reasoningEffort } = useToolsStore();
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const messagesRef = useRef<any>(null);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    resetRecording,
  } = useAudioRecorder();
  

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
    if (!message.trim() && attachments.length === 0) return;
    if (isStreaming) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    
    addChatMessage({
      type: 'message',
      role: 'user' as const,
      content: [{ type: 'input_text', text: message }]
    });
    setMessage('');
    setAttachments([]);
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
      setIsProcessingAudio(true);
      
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
          setIsProcessingAudio(false);
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
            <Icon f7="bubble_left_bubble_right" size={20} />
            <span>AI Assistant</span>
          </div>
        </NavTitle>
        <NavRight>
          <Link iconF7="gear_alt" onClick={openMcpServersPanel} />
          <Link iconF7="square_grid_3x2" onClick={openToolsPanel} />
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
      <Messages ref={messagesRef}>
        {chatMessages.length === 0 ? (
          <Block className="text-center">
            <div className="empty-state">
              <Icon f7="bubble_left_bubble_right" size={48} color="gray" />
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

      {/* Android-style Message Input Bar */}
      <Messagebar
        placeholder="Type a message..."
        value={message}
        onInput={(e) => setMessage(e.target.value)}
        attachmentsVisible={attachments.length > 0}
        sheetVisible={false}
      >
        <Link
          iconF7="paperclip"
          slot="inner-start"
          onClick={() => {
            // Handle attachments
            f7.dialog.alert('Attachments coming soon!');
          }}
        />
        
        {/* Voice Recording Button */}
        <Link
          slot="inner-end"
          onClick={handleVoiceRecord}
        >
          <Icon 
            f7={isRecording ? 'stop_circle' : 'mic'} 
            size={24}
            color={isRecording ? 'red' : 'primary'}
            className={isRecording ? 'recording-active' : ''}
          />
        </Link>
        
        {/* Send Button */}
        <Link
          slot="inner-end"
          onClick={handleSendMessage}
          className={!message.trim() ? 'disabled' : ''}
        >
          <Icon f7="paperplane" size={24} color="primary" />
        </Link>
        
        {attachments.length > 0 && (
          <MessagebarAttachments>
            {attachments.map((attachment, index) => (
              <MessagebarAttachment
                key={index}
                image={attachment.image}
                onAttachmentDelete={() => {
                  const newAttachments = [...attachments];
                  newAttachments.splice(index, 1);
                  setAttachments(newAttachments);
                }}
              />
            ))}
          </MessagebarAttachments>
        )}
      </Messagebar>

      {/* Android-style FAB for Quick Actions */}
      <Fab
        position="right-bottom"
        slot="fixed"
        color="purple"
        onClick={() => {
          // Quick action menu
          const actions = f7.actions.create({
            buttons: [
              {
                text: 'Clear Chat',
                onClick: () => {
                  f7.dialog.confirm('Clear all messages?', () => {
                    // Clear messages
                    useConversationStore.getState().resetConversation();
                  });
                }
              },
              {
                text: 'Export Chat',
                onClick: () => {
                  f7.dialog.alert('Export feature coming soon!');
                }
              },
              {
                text: 'Cancel',
                color: 'red',
              }
            ]
          });
          actions.open();
        }}
      >
        <Icon f7="plus" />
      </Fab>

      {/* Processing Indicator */}
      {isProcessingAudio && (
        <div className="processing-overlay">
          <Preloader color="purple" />
          <p>Processing audio...</p>
        </div>
      )}
    </Page>
  );
}