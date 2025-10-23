'use client';

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LoadingDots } from '@/components/ui/LoadingDots';
import { haptics } from '@/lib/haptic';

// Icon components
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

interface ChatMessagesProps {
  chatMessages: any[];
  isStreaming: boolean;
  setMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  formatMessage: (content: any, metadata?: any) => React.ReactNode;
}

export function ChatMessages({
  chatMessages,
  isStreaming,
  setMessage,
  messagesEndRef,
  formatMessage,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 message-list-scroll" role="log" aria-label="Chat messages">
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
          
          {isStreaming && <LoadingDots />}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}