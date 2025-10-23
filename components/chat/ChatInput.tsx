'use client';

import React from 'react';
import { FilePreview } from './FilePreview';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { haptics } from '@/lib/haptic';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

// Icon components
const AttachIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  isStreaming: boolean;
  handleSendMessage: () => void;
  selectedFiles: File[];
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  formatFileSize: (bytes: number) => string;
  fileError: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export function ChatInput({
  message,
  setMessage,
  isStreaming,
  handleSendMessage,
  selectedFiles,
  handleFileSelect,
  removeFile,
  formatFileSize,
  fileError,
  isDragging,
  fileInputRef,
  inputRef,
}: ChatInputProps) {
  const sendMessageCallback = async () => {}; // Dummy callback since we only need offline status
  const offlineQueue = useOfflineQueue(sendMessageCallback);

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t dark:border-gray-700 px-4 py-4 shadow-2xl">
      {/* File Preview Area */}
      <FilePreview
        selectedFiles={selectedFiles}
        formatFileSize={formatFileSize}
        removeFile={removeFile}
      />
      
      {/* File error display */}
      {fileError && <ErrorToast message={fileError} />}

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
  );
}