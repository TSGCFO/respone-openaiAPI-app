'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { processMessages } from '@/lib/assistant';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ToolsPanel from '@/components/tools-panel';
import McpServersPanel from '@/components/mcp-servers-panel';
import ModernSettingsPanel from '@/components/modern-settings-panel';
import ModernMemoriesPanel from '@/components/modern-memories-panel';
import { AppUpdateNotification } from '@/components/app-update-notification';
import { haptics } from '@/lib/haptic';

// Import new components
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { VoiceIndicator } from '@/components/chat/VoiceIndicator';

export function ModernChatFixed() {
  const {
    chatMessages,
    addChatMessage,
    addConversationItem,
    isStreaming,
    setIsStreaming,
    resetConversation,
    saveMessage,
    loadConversation,
  } = useConversationStore();
  
  const [message, setMessage] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMemoriesPanel, setShowMemoriesPanel] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');
  
  // File attachment states and refs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    resetRecording,
  } = useAudioRecorder();

  // Handle refresh for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    haptics.refresh();
    await loadConversation();
    haptics.success();
  }, [loadConversation]);

  // Pull-to-refresh hook
  const pullToRefresh = usePullToRefresh(
    messageListRef,
    handleRefresh,
    {
      threshold: 80,
      maxPull: 150,
      refreshTimeout: 2000,
      resistance: 2.5
    }
  );

  // Callback for sending messages
  const sendMessageCallback = useCallback(async (messageContent: string) => {
    const userMessage = {
      type: 'message' as const,
      id: Date.now().toString(),
      role: 'user' as const,
      content: [{ type: 'input_text' as const, text: messageContent }],
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    addChatMessage(userMessage);
    addConversationItem({ role: 'user', content: messageContent });
    await saveMessage('user', messageContent);
    setIsStreaming(true);
    
    try {
      await processMessages();
    } finally {
      setIsStreaming(false);
    }
  }, [addChatMessage, addConversationItem, saveMessage, setIsStreaming]);

  // Offline queue hook
  const offlineQueue = useOfflineQueue(sendMessageCallback);

  // Virtual keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = windowHeight - viewportHeight;
      
      setKeyboardHeight(keyboardHeight);
      
      if (keyboardHeight > 100) {
        haptics.light();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showToolsPanel) {
          setShowToolsPanel(false);
          setScreenReaderAnnouncement('Tools panel closed');
        } else if (showMcpPanel) {
          setShowMcpPanel(false);
          setScreenReaderAnnouncement('MCP servers panel closed');
        } else if (showSettingsPanel) {
          setShowSettingsPanel(false);
          setScreenReaderAnnouncement('Settings panel closed');
        } else if (showMemoriesPanel) {
          setShowMemoriesPanel(false);
          setScreenReaderAnnouncement('Memories panel closed');
        } else if (showMenu) {
          setShowMenu(false);
          setScreenReaderAnnouncement('Menu closed');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showToolsPanel, showMcpPanel, showSettingsPanel, showMemoriesPanel, showMenu]);

  // Screen reader announcements
  useEffect(() => {
    if (isStreaming) {
      setScreenReaderAnnouncement('AI is typing a response');
    } else if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        setScreenReaderAnnouncement('AI has responded');
      }
    }
  }, [isStreaming, chatMessages]);

  // Recording state announcements
  useEffect(() => {
    if (isRecording) {
      setScreenReaderAnnouncement('Recording started. Press stop to finish recording.');
    } else if (isProcessingAudio) {
      setScreenReaderAnnouncement('Processing audio. Please wait.');
    }
  }, [isRecording, isProcessingAudio]);

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
      haptics.error();
      setTimeout(() => setFileError(null), 3000);
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const extension = file.name.split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
      if (!extension || !allowedExtensions.includes(extension.toLowerCase())) {
        setFileError(`File type not supported for "${file.name}"`);
        haptics.error();
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
      haptics.selection();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    haptics.light();
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
      haptics.selection();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;
    
    if (offlineQueue.isOffline) {
      offlineQueue.addToQueue(message);
      setMessage('');
      haptics.warning();
      return;
    }
    
    haptics.selection();
    
    let uploadedFileUrls: any[] = [];
    let messageContent = message;
    
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
          haptics.error();
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
        haptics.error();
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
      haptics.success();
    } catch (error) {
      console.error('Error processing messages:', error);
      haptics.error();
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceRecord = async () => {
    haptics.medium();
    
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
            setIsFabExpanded(false);
            haptics.success();
          } else {
            haptics.error();
          }
        } catch (error) {
          console.error('Transcription error:', error);
          haptics.error();
        } finally {
          setIsProcessingAudio(false);
          resetRecording();
        }
      }
    } else {
      setIsFabExpanded(true);
      startRecording();
    }
  };

  const formatMessage = (content: any, metadata?: any) => {
    // Extract text from MessageItem content array structure
    if (Array.isArray(content)) {
      const textContent = content
        .filter(c => c.type === 'text' || c.type === 'input_text' || c.type === 'output_text')
        .map(c => c.text)
        .join('\n');
      if (textContent) content = textContent;
    }
    
    // Helper function to get file icon based on type
    const getFileIcon = (fileType: string, fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Images
      if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        );
      }
      // PDFs
      if (fileType === 'application/pdf' || ext === 'pdf') {
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      }
      // Word docs
      if (fileType?.includes('word') || ['doc', 'docx'].includes(ext)) {
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      }
      // Excel
      if (fileType?.includes('excel') || fileType?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h3v-2H8v-2h3v-2H8V8h8v10zm-3-9V3.5L18.5 9H13z"/>
          </svg>
        );
      }
      // PowerPoint
      if (fileType?.includes('powerpoint') || fileType?.includes('presentation') || ['ppt', 'pptx'].includes(ext)) {
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        );
      }
      // Default file icon
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      );
    };
    
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
              a({ href, children, ...props }: any) {
                // Check if this is a file link
                if (href?.startsWith('/uploads/')) {
                  const fileName = children?.toString() || href.split('/').pop();
                  const fileType = metadata?.files?.find((f: any) => f.url === href)?.type || '';
                  
                  // For images, show inline with Next.js Image component
                  if (fileType?.startsWith('image/') || 
                      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => href.toLowerCase().endsWith(`.${ext}`))) {
                    return (
                      <div className="my-3 relative">
                        <Image 
                          src={href} 
                          alt={fileName}
                          width={400}
                          height={300}
                          className="max-w-full rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => window.open(href, '_blank')}
                          loading="lazy"
                          style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fileName}</p>
                      </div>
                    );
                  }
                  
                  // For other files, show download link with icon
                  return (
                    <a
                      href={href}
                      download={fileName}
                      className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-3 py-2 rounded-lg transition-colors my-1"
                      {...props}
                    >
                      {getFileIcon(fileType, fileName)}
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{fileName}</span>
                    </a>
                  );
                }
                
                // Regular link
                return (
                  <a href={href} className="text-purple-600 hover:text-purple-700 underline" {...props}>
                    {children}
                  </a>
                );
              },
              img({ src, alt, ...props }: any) {
                // Use Next.js Image component for all images in markdown
                if (src) {
                  return (
                    <div className="my-3 relative">
                      <Image
                        src={src}
                        alt={alt || 'Image'}
                        width={400}
                        height={300}
                        className="max-w-full rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => window.open(src, '_blank')}
                        loading="lazy"
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
                        {...props}
                      />
                    </div>
                  );
                }
                return null;
              }
            }}
          >
            {content}
          </ReactMarkdown>
          
          {/* Display attached files that might not be in markdown */}
          {metadata?.files && metadata.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {metadata.files.map((file: any, index: number) => {
                const isImage = file.type?.startsWith('image/') || 
                  ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
                    file.originalName?.toLowerCase().endsWith(`.${ext}`) ||
                    file.url?.toLowerCase().endsWith(`.${ext}`)
                  );
                
                if (isImage) {
                  return (
                    <div key={index} className="my-3 relative">
                      <Image 
                        src={file.url} 
                        alt={file.originalName || 'Uploaded image'}
                        width={400}
                        height={300}
                        className="max-w-full rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => window.open(file.url, '_blank')}
                        loading="lazy"
                        style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {file.originalName || 'Uploaded image'}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <a
                    key={index}
                    href={file.url}
                    download={file.originalName}
                    className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-3 py-2 rounded-lg transition-colors"
                  >
                    {getFileIcon(file.type, file.originalName || file.filename || '')}
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {file.originalName || file.filename || 'Download file'}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return <pre className="text-xs opacity-70">{JSON.stringify(content, null, 2)}</pre>;
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat?')) {
      resetConversation();
      setMessage('');
      setSelectedFiles([]);
    }
  };

  return (
    <div 
      className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ paddingBottom: keyboardHeight }}
    >
      {/* App Update Notification */}
      <AppUpdateNotification />

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      {/* Pull to Refresh Indicator */}
      {pullToRefresh.isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center z-50 transition-all duration-300"
          style={{ 
            height: `${Math.min(pullToRefresh.pullIndicatorOffset, 80)}px`,
            opacity: pullToRefresh.pullIndicatorOpacity
          }}
        >
          <div className={`${pullToRefresh.isRefreshing ? 'animate-spin' : ''}`}>
            <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Chat Header Component */}
      <ChatHeader
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        onOpenSettings={() => setShowSettingsPanel(true)}
        onOpenMemories={() => setShowMemoriesPanel(true)}
        onOpenTools={() => setShowToolsPanel(true)}
        onOpenMcp={() => setShowMcpPanel(true)}
        onClearChat={handleClearChat}
        menuRef={menuRef}
      />

      {/* Messages Area Component */}
      <div ref={messageListRef} className="flex-1 overflow-y-auto">
        <ChatMessages
          chatMessages={chatMessages}
          isStreaming={isStreaming}
          setMessage={setMessage}
          messagesEndRef={messagesEndRef}
          formatMessage={formatMessage}
        />
      </div>

      {/* Input Area Component */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        isStreaming={isStreaming}
        handleSendMessage={handleSendMessage}
        selectedFiles={selectedFiles}
        handleFileSelect={handleFileSelect}
        removeFile={removeFile}
        formatFileSize={formatFileSize}
        fileError={fileError}
        isDragging={isDragging}
        fileInputRef={fileInputRef}
        inputRef={inputRef}
      />

      {/* Voice Recording FAB Component */}
      <VoiceIndicator
        isRecording={isRecording}
        isProcessingAudio={isProcessingAudio}
        isFabExpanded={isFabExpanded}
        handleVoiceRecord={handleVoiceRecord}
      />

      {/* Side Panels */}
      {showToolsPanel && <ToolsPanel onClose={() => {haptics.light(); setShowToolsPanel(false);}} />}
      {showMcpPanel && <McpServersPanel onClose={() => {haptics.light(); setShowMcpPanel(false);}} />}
      {showSettingsPanel && <ModernSettingsPanel isOpen={showSettingsPanel} onClose={() => {haptics.light(); setShowSettingsPanel(false);}} />}
      {showMemoriesPanel && <ModernMemoriesPanel isOpen={showMemoriesPanel} onClose={() => {haptics.light(); setShowMemoriesPanel(false);}} />}
    </div>
  );
}