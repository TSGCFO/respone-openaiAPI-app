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

// Close Icon
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

// Material Design Icons SVG components
const ChatIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
  </svg>
);

const EmojiIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const MicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
  </svg>
);

const StopIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
  </svg>
);

const StarIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const IdeaIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
  </svg>
);

const WriteIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

const MagicIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zm-7.63-5.27L3 19l8.87-8.87c.39.39.39 1.02 0 1.41l-8.87 8.87 8.87-8.87c.39-.39 1.02-.39 1.41 0z"/>
  </svg>
);

const QuestionIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
);

// Offline indicator icon
const OfflineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.76.59 6.82.36 7l11.63 14.49.01.01.01-.01 3.9-4.86 3.32 3.32 1.27-1.27-3.46-3.46z"/>
  </svg>
);

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
  
  const { selectedModel, reasoningEffort, setSelectedModel, setReasoningEffort } = useToolsStore();
  
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
    // Reload the conversation from the database
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
    // This is the callback for offline queue to send messages
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
      
      // Calculate keyboard height
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = windowHeight - viewportHeight;
      
      setKeyboardHeight(keyboardHeight);
      
      // Scroll to bottom when keyboard opens
      if (keyboardHeight > 100) {
        haptics.light();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    // Listen for viewport changes
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
      // Escape key to close panels
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

  // Screen reader announcements for message state changes
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
      // Allow common extensions even if MIME type is unknown
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
    
    // Reset input to allow selecting the same file again
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
    
    // Check if offline
    if (offlineQueue.isOffline) {
      // Add to offline queue
      offlineQueue.addToQueue(message);
      setMessage('');
      haptics.warning();
      return;
    }
    
    haptics.selection();
    
    let uploadedFileUrls: any[] = [];
    let messageContent = message;
    
    // Upload files if selected
    if (selectedFiles.length > 0) {
      setIsStreaming(true); // Show loading state during upload
      
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
        
        // Add file info to message for display
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
    
    // Add to chat messages for display
    addChatMessage(userMessage);
    
    // Prepare content for OpenAI API
    let apiContent = message;
    
    // For images, we can include them as image_url content
    const imageFiles = uploadedFileUrls.filter(f => 
      f.type?.startsWith('image/') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => f.originalName.toLowerCase().endsWith(`.${ext}`))
    );
    
    // Build content array for conversation
    const contentArray: any[] = [{ type: 'text', text: message }];
    
    // Add images to content array for vision models
    imageFiles.forEach(img => {
      // Use the full URL for the image
      const imageUrl = window.location.origin + img.url;
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'auto'
        }
      });
    });
    
    // Add to conversation items for API with correct format
    const conversationMessage: any = {
      role: 'user',
      content: contentArray.length > 1 ? contentArray : message,
    };
    addConversationItem(conversationMessage);
    
    // Save user message to database for persistence
    await saveMessage('user', messageContent);
    
    // Clear message and selected files
    setMessage('');
    setSelectedFiles([]);
    setIsStreaming(true);
    
    try {
      // processMessages reads from store directly, no parameters needed
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

      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-2xl">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ChatIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
              <p className="text-xs text-purple-200 font-medium">Always here to help</p>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2" ref={menuRef}>
            {/* Offline Indicator */}
            {offlineQueue.isOffline && (
              <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <OfflineIcon />
                <span className="text-xs font-medium">Offline</span>
              </div>
            )}

            {/* Queued Messages Indicator */}
            {offlineQueue.queuedMessages.length > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium">{offlineQueue.queuedMessages.length} queued</span>
              </div>
            )}

            <button
              onClick={() => {haptics.light(); setShowMenu(!showMenu);}}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Open menu"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <MenuIcon />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 w-56 z-50 animate-fadeIn"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  onClick={() => {
                    haptics.light();
                    setShowSettingsPanel(!showSettingsPanel);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open settings panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Settings
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    haptics.light();
                    setShowMemoriesPanel(!showMemoriesPanel);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open memories panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13 3C9.23 3 6.19 5.95 6 9.66l-1.92 2.53c-.24.31.05.81.4.81H6v3c0 1.11.89 2 2 2h1v3h7v-4.68c3.3-1.3 5.65-4.5 5.65-8.26C21.65 5.21 18.79 2 15 2l-2 1zm3.5 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Memories
                  </span>
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={() => {
                    haptics.light();
                    setShowToolsPanel(!showToolsPanel);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open tools settings"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Tools Settings
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    haptics.light();
                    setShowMcpPanel(!showMcpPanel);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open MCP servers panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    MCP Servers
                  </span>
                </button>

                {/* Sync Queue Button (only show if messages are queued) */}
                {offlineQueue.queuedMessages.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" role="separator"></div>
                    <button
                      onClick={() => {
                        haptics.light();
                        offlineQueue.syncQueue();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 transition-colors"
                      role="menuitem"
                      aria-label="Sync offline messages"
                    >
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                      </svg>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        Sync {offlineQueue.queuedMessages.length} Messages
                      </span>
                    </button>
                  </>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" role="separator"></div>
                
                <button
                  onClick={() => {
                    haptics.warning();
                    if (confirm('Are you sure you want to clear the chat? This will delete all messages.')) {
                      resetConversation();
                      haptics.success();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Clear chat conversation"
                >
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Clear Chat
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Selector */}
        <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto">
          <select 
            value={selectedModel} 
            onChange={(e) => {haptics.light(); setSelectedModel(e.target.value);}}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-medium outline-none focus:bg-white/30 transition-all cursor-pointer"
            aria-label="Select AI model"
          >
            <option value="gpt-4" className="text-gray-800">GPT-4</option>
            <option value="gpt-4.1" className="text-gray-800">GPT-4.1</option>
            <option value="gpt-5" className="text-gray-800">GPT-5</option>
            <option value="gpt-5-pro" className="text-gray-800">GPT-5 Pro</option>
          </select>
          
          {selectedModel.includes('gpt-5') && (
            <div className="flex gap-1" role="group" aria-label="Reasoning effort level">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  onClick={() => {haptics.light(); setReasoningEffort(level as any);}}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                    reasoningEffort === level 
                      ? 'bg-white text-purple-600 shadow-lg scale-105' 
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                  aria-label={`Set reasoning effort to ${level}`}
                  aria-pressed={reasoningEffort === level}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area with Beautiful Styling */}
      <div 
        ref={messageListRef}
        className="flex-1 overflow-y-auto px-4 py-6 message-list-scroll" 
        role="log" 
        aria-label="Chat messages"
      >
        {chatMessages.filter(msg => msg.type === 'message').length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-fadeIn">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-pulse">
              <StarIcon />
            </div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">
              Welcome!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
              How can I assist you today?
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {[
                { icon: <IdeaIcon />, text: 'Get Ideas', color: 'from-yellow-400 to-orange-400' },
                { icon: <WriteIcon />, text: 'Write Content', color: 'from-blue-400 to-cyan-400' },
                { icon: <MagicIcon />, text: 'Create Magic', color: 'from-purple-400 to-pink-400' },
                { icon: <QuestionIcon />, text: 'Ask Anything', color: 'from-green-400 to-teal-400' }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {haptics.selection(); setMessage(`Help me ${item.text.toLowerCase()}`);}}
                  className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95`}
                >
                  <div className="flex flex-col items-center gap-3">
                    {item.icon}
                    <p className="text-sm font-bold">{item.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.filter(msg => msg.type === 'message').map((msg: any, index) => (
              <div
                key={msg.id || index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-3xl rounded-br-md shadow-xl'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-3xl rounded-bl-md shadow-lg border border-gray-100 dark:border-gray-700'
                  } px-5 py-4 relative`}
                >
                  <div className="text-sm leading-relaxed">
                    {formatMessage(msg.content, msg.metadata)}
                  </div>
                  {msg.metadata?.timestamp && (
                    <div className={`text-[11px] mt-2 font-medium ${
                      msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                    }`}>
                      {new Date(msg.metadata.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-md shadow-lg px-5 py-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Beautiful Input Area */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t dark:border-gray-700 px-4 py-4 shadow-2xl">
        {/* File Preview Area */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 px-2 animate-slideDown">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 flex items-center gap-2 animate-fadeIn shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* File error display */}
        {fileError && (
          <div className="mb-3 px-2 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center gap-2 animate-slideDown">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">{fileError}</p>
          </div>
        )}

        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-purple-600/10 backdrop-blur-sm flex items-center justify-center z-40 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-purple-500 animate-bounce">
              <svg className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-center">Drop files here to upload</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              haptics.keypress();
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={offlineQueue.isOffline ? "Type a message (offline - will queue)..." : "Type a message..."}
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-400"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Message input"
          />
          
          <div className="flex gap-2">
            {/* File Attach Button */}
            <label className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200 cursor-pointer group shadow-md hover:shadow-lg">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                aria-label="Attach files"
              />
              <AttachIcon />
            </label>
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isStreaming}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Recording FAB */}
      <div className={`fixed right-4 bottom-24 transition-all duration-300 ${isFabExpanded ? 'scale-110' : ''}`}>
        <button
          onClick={handleVoiceRecord}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
            <StopIcon />
          ) : (
            <MicIcon />
          )}
        </button>
        {isProcessingAudio && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Side Panels */}
      {showToolsPanel && <ToolsPanel onClose={() => {haptics.light(); setShowToolsPanel(false);}} />}
      {showMcpPanel && <McpServersPanel onClose={() => {haptics.light(); setShowMcpPanel(false);}} />}
      {showSettingsPanel && <ModernSettingsPanel onClose={() => {haptics.light(); setShowSettingsPanel(false);}} />}
      {showMemoriesPanel && <ModernMemoriesPanel onClose={() => {haptics.light(); setShowMemoriesPanel(false);}} />}
    </div>
  );
}