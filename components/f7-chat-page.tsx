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
  MessagebarAttachments,
  MessagebarAttachment,
  Link,
  f7,
  Icon,
  Sheet,
  BlockTitle,
  List,
  ListItem,
  Toggle,
  Fab,
} from 'framework7-react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function F7ChatPage() {
  const {
    chatMessages,
    addChatMessage,
    addConversationItem,
    isStreaming,
    setIsStreaming,
    resetConversation,
    saveMessage,
  } = useConversationStore();
  
  const { selectedModel, reasoningEffort, setSelectedModel, setReasoningEffort } = useToolsStore();
  
  const [message, setMessage] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showToolsSheet, setShowToolsSheet] = useState(false);
  const [showMcpSheet, setShowMcpSheet] = useState(false);
  const [showMemoriesSheet, setShowMemoriesSheet] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
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
      messagesRef.current.scroll();
    }
  }, [chatMessages]);

  // Add haptic feedback
  const haptic = (intensity: number = 1) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity);
    }
  };

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  // File validation function
  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File "${file.name}" exceeds 10MB limit`);
      haptic(20);
      setTimeout(() => setFileError(null), 3000);
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const extension = file.name.split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
      if (!extension || !allowedExtensions.includes(extension.toLowerCase())) {
        setFileError(`File type not supported for "${file.name}"`);
        haptic(20);
        setTimeout(() => setFileError(null), 3000);
        return false;
      }
    }
    
    return true;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle file selection from input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      haptic(10);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    haptic(5);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      haptic(10);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    if (isStreaming) return;
    
    haptic(10);
    
    let uploadedFileUrls: any[] = [];
    let messageContent = message;
    
    // Upload files if selected
    if (selectedFiles.length > 0) {
      setIsStreaming(true);
      
      try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const uploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          setFileError(error.error || 'Failed to upload files');
          haptic(20);
          setTimeout(() => setFileError(null), 3000);
          setIsStreaming(false);
          return;
        }
        
        const { files } = await uploadResponse.json();
        uploadedFileUrls = files;
        
        const fileInfo = `\n\n📎 Attached files:\n${files.map((f: any) => `- [${f.originalName}](${f.url})`).join('\n')}`;
        messageContent = message + fileInfo;
        
      } catch (error) {
        console.error('Upload error:', error);
        setFileError('Failed to upload files. Please try again.');
        haptic(20);
        setTimeout(() => setFileError(null), 3000);
        setIsStreaming(false);
        return;
      }
    }
    
    const userMessage = {
      type: 'message' as const,
      id: Date.now().toString(),
      role: 'user' as const,
      content: [{ type: 'input_text' as const, text: messageContent }],
      metadata: {
        timestamp: new Date().toISOString(),
        files: uploadedFileUrls
      },
    };
    
    addChatMessage(userMessage);
    
    const imageFiles = uploadedFileUrls.filter(f => 
      f.type?.startsWith('image/') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => f.originalName.toLowerCase().endsWith(`.${ext}`))
    );
    
    const contentArray: any[] = [{ type: 'text', text: message }];
    
    imageFiles.forEach(img => {
      const imageUrl = window.location.origin + img.url;
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'auto'
        }
      });
    });
    
    const conversationMessage: any = {
      role: 'user',
      content: contentArray.length > 1 ? contentArray : message,
    };
    addConversationItem(conversationMessage);
    
    await saveMessage('user', messageContent);
    
    setMessage('');
    setSelectedFiles([]);
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
    haptic(20);
    
    if (isRecording) {
      stopRecording();
      setIsProcessingAudio(true);
      
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

  const formatMessage = (content: any, metadata?: any) => {
    if (Array.isArray(content)) {
      const textContent = content
        .filter(c => c.type === 'text' || c.type === 'input_text' || c.type === 'output_text')
        .map(c => c.text)
        .join('\n');
      if (textContent) content = textContent;
    }
    
    if (typeof content === 'string') {
      return (
        <div className="space-y-2">
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            components={{
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={match[1]}
                    PreTag="div"
                    className="!mt-2 !mb-2 !text-xs rounded-xl overflow-hidden"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-md text-xs" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
    return <pre className="text-xs opacity-70">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <Page>
      {/* Main Chat Page */}
      <Navbar>
        <NavTitle>AI Assistant</NavTitle>
        <NavRight>
          <Link
            iconF7="ellipsis_vertical"
            popoverOpen=".popover-menu"
            onClick={() => haptic(5)}
          />
        </NavRight>
      </Navbar>

      {/* Messages Area */}
      <Messages
        ref={messagesRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {chatMessages.map((msg, index) => (
          <Message
            key={msg.id || index}
            type={msg.role === 'user' ? 'sent' : 'received'}
            name={msg.role === 'user' ? 'You' : 'Assistant'}
            first={index === 0 || chatMessages[index - 1]?.role !== msg.role}
            last={index === chatMessages.length - 1 || chatMessages[index + 1]?.role !== msg.role}
            tail={index === chatMessages.length - 1 || chatMessages[index + 1]?.role !== msg.role}
          >
            <div slot="text">
              {formatMessage(msg.content, msg.metadata)}
            </div>
            {msg.metadata?.timestamp && (
              <div slot="footer" className="text-xs opacity-60">
                {new Date(msg.metadata.timestamp).toLocaleTimeString()}
              </div>
            )}
          </Message>
        ))}
        
        {isStreaming && (
          <Message type="received" typing />
        )}
      </Messages>

      {/* Messagebar with attachments */}
      <Messagebar
        placeholder="Type a message..."
        value={message}
        onInput={(e) => setMessage(e.target.value)}
        attachmentsVisible={selectedFiles.length > 0}
        sheetVisible={false}
      >
        <Link
          iconF7="paperclip"
          slot="inner-start"
          onClick={() => {
            haptic(5);
            fileInputRef.current?.click();
          }}
        />
        {!isRecording ? (
          <Link
            iconF7="arrow_up_circle_fill"
            slot="inner-end"
            onClick={handleSendMessage}
            style={{
              opacity: message.trim() || selectedFiles.length > 0 ? 1 : 0.5,
            }}
          />
        ) : (
          <Link
            iconF7="stop_circle_fill"
            slot="inner-end"
            onClick={handleVoiceRecord}
            className="text-red-500"
          />
        )}
        <MessagebarAttachments>
          {selectedFiles.map((file, index) => (
            <MessagebarAttachment
              key={index}
              image={file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined}
              deletable
              onAttachmentDelete={() => removeFile(index)}
            >
              {!file.type.startsWith('image/') && (
                <span className="text-xs">{file.name} ({formatFileSize(file.size)})</span>
              )}
            </MessagebarAttachment>
          ))}
        </MessagebarAttachments>
      </Messagebar>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept={ALLOWED_FILE_TYPES.join(',')}
      />

      {/* FAB for voice recording */}
      <Fab
        position="right-bottom"
        slot="fixed"
        className={`${isRecording ? 'recording-active' : ''}`}
        onClick={handleVoiceRecord}
      >
        <Icon f7={isRecording ? "stop_fill" : "mic_fill"} />
      </Fab>

      {/* Settings Sheet */}
      <Sheet
        className="demo-sheet-swipe-to-close"
        style={{ height: 'auto' }}
        swipeToClose
        backdrop
        opened={showSettingsSheet}
        onSheetClosed={() => setShowSettingsSheet(false)}
      >
        <div className="sheet-modal-swipe-step">
          <div className="margin-top text-align-center">Settings</div>
          <BlockTitle>Model Settings</BlockTitle>
          <List>
            <ListItem title="Model">
              <select 
                slot="after" 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-2 py-1 rounded border"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="o1">O1</option>
                <option value="o1-mini">O1 Mini</option>
              </select>
            </ListItem>
            <ListItem title="Reasoning Effort">
              <select
                slot="after"
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as any)}
                className="px-2 py-1 rounded border"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </ListItem>
          </List>
          <BlockTitle>Actions</BlockTitle>
          <List>
            <ListItem
              title="Clear Chat"
              onClick={() => {
                haptic(10);
                f7.dialog.confirm('Clear all messages?', 'Clear Chat', () => {
                  resetConversation();
                  setShowSettingsSheet(false);
                });
              }}
            >
              <Icon slot="media" f7="trash" />
            </ListItem>
          </List>
        </div>
      </Sheet>

      {/* Tools Sheet */}
      <Sheet
        className="demo-sheet-swipe-to-close"
        style={{ height: 'auto' }}
        swipeToClose
        backdrop
        opened={showToolsSheet}
        onSheetClosed={() => setShowToolsSheet(false)}
      >
        <div className="sheet-modal-swipe-step">
          <div className="margin-top text-align-center">Tools Settings</div>
          <BlockTitle>Available Tools</BlockTitle>
          <List>
            <ListItem title="Web Search">
              <Toggle slot="after" defaultChecked />
            </ListItem>
            <ListItem title="Code Interpreter">
              <Toggle slot="after" defaultChecked />
            </ListItem>
            <ListItem title="File Search">
              <Toggle slot="after" defaultChecked />
            </ListItem>
          </List>
        </div>
      </Sheet>

      {/* MCP Servers Sheet */}
      <Sheet
        className="demo-sheet-swipe-to-close"
        style={{ height: 'auto' }}
        swipeToClose
        backdrop
        opened={showMcpSheet}
        onSheetClosed={() => setShowMcpSheet(false)}
      >
        <div className="sheet-modal-swipe-step">
          <div className="margin-top text-align-center">MCP Servers</div>
          <BlockTitle>Connected Servers</BlockTitle>
          <List>
            <ListItem
              title="Local Server"
              footer="Connected"
            >
              <Icon slot="media" f7="server_rack" />
            </ListItem>
          </List>
        </div>
      </Sheet>

      {/* Memories Sheet */}
      <Sheet
        className="demo-sheet-swipe-to-close"
        style={{ height: 'auto' }}
        swipeToClose
        backdrop
        opened={showMemoriesSheet}
        onSheetClosed={() => setShowMemoriesSheet(false)}
      >
        <div className="sheet-modal-swipe-step">
          <div className="margin-top text-align-center">Memories</div>
          <BlockTitle>Stored Memories</BlockTitle>
          <List>
            <ListItem
              title="No memories yet"
              text="Memories will appear here as you chat"
            />
          </List>
        </div>
      </Sheet>

      {/* Popover Menu */}
      <div className="popover popover-menu">
        <div className="popover-inner">
          <List>
            <ListItem
              title="Settings"
              onClick={() => {
                haptic(5);
                f7.popover.close('.popover-menu');
                setShowSettingsSheet(true);
              }}
            >
              <Icon slot="media" f7="gear" />
            </ListItem>
            <ListItem
              title="Tools"
              onClick={() => {
                haptic(5);
                f7.popover.close('.popover-menu');
                setShowToolsSheet(true);
              }}
            >
              <Icon slot="media" f7="wrench" />
            </ListItem>
            <ListItem
              title="MCP Servers"
              onClick={() => {
                haptic(5);
                f7.popover.close('.popover-menu');
                setShowMcpSheet(true);
              }}
            >
              <Icon slot="media" f7="server_rack" />
            </ListItem>
            <ListItem
              title="Memories"
              onClick={() => {
                haptic(5);
                f7.popover.close('.popover-menu');
                setShowMemoriesSheet(true);
              }}
            >
              <Icon slot="media" f7="brain" />
            </ListItem>
          </List>
        </div>
      </div>

      {/* File error toast */}
      {fileError && (
        <div className="toast toast-bottom toast-center">
          <div className="toast-content">{fileError}</div>
        </div>
      )}
    </Page>
  );
}