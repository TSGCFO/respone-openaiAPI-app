'use client';

import React, { useState, useRef, useEffect } from 'react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Material Design Icons SVG components
const ChatIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
  </svg>
);

const EmojiIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const MicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
  </svg>
);

const StopIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
  </svg>
);

const StarIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const IdeaIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
  </svg>
);

const WriteIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

const MagicIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zm-7.63-5.27L3 19l8.87-8.87c.39.39.39 1.02 0 1.41l-8.87 8.87 8.87-8.87c.39-.39 1.02-.39 1.41 0z"/>
  </svg>
);

const QuestionIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
);

export function ModernChatFixed() {
  const {
    chatMessages,
    conversationItems,
    addChatMessage,
    isStreaming,
    setIsStreaming,
  } = useConversationStore();
  
  const { selectedModel, reasoningEffort, setSelectedModel, setReasoningEffort } = useToolsStore();
  
  const [message, setMessage] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    resetRecording,
  } = useAudioRecorder();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Add haptic feedback
  const haptic = (intensity: number = 1) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;
    
    haptic(10);
    
    const userMessage = {
      type: 'message' as const,
      id: Date.now().toString(),
      role: 'user' as const,
      content: [{ type: 'input_text' as const, text: message }],
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    addChatMessage(userMessage);
    setMessage('');
    setIsStreaming(true);
    
    try {
      await processMessages([...conversationItems, { role: 'user', content: message }]);
    } catch (error) {
      console.error('Error processing messages:', error);
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
            setIsFabExpanded(false);
          }
        } catch (error) {
          console.error('Transcription error:', error);
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

  const formatMessage = (content: any) => {
    // Extract text from MessageItem content array structure
    if (Array.isArray(content)) {
      const textContent = content
        .filter(c => c.type === 'text' || c.type === 'input_text' || c.type === 'output_text')
        .map(c => c.text)
        .join('\n');
      if (textContent) content = textContent;
    }
    
    if (typeof content === 'string') {
      return (
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
            }
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }
    return <pre className="text-xs opacity-70">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-2xl">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <ChatIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">AI Assistant</h1>
              <p className="text-xs opacity-90 font-medium">Powered by GPT</p>
            </div>
          </div>
          <button 
            onClick={() => {haptic(); setShowMenu(!showMenu);}}
            className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <MenuIcon />
          </button>
        </div>

        {/* Model Selector */}
        <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto">
          <select 
            value={selectedModel} 
            onChange={(e) => {haptic(); setSelectedModel(e.target.value);}}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-medium outline-none focus:bg-white/30 transition-all cursor-pointer"
          >
            <option value="gpt-4" className="text-gray-800">GPT-4</option>
            <option value="gpt-4.1" className="text-gray-800">GPT-4.1</option>
            <option value="gpt-5" className="text-gray-800">GPT-5</option>
            <option value="gpt-5-pro" className="text-gray-800">GPT-5 Pro</option>
          </select>
          
          {selectedModel.includes('gpt-5') && (
            <div className="flex gap-1">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  onClick={() => {haptic(); setReasoningEffort(level as any);}}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                    reasoningEffort === level 
                      ? 'bg-white text-purple-600 shadow-lg scale-105' 
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area with Beautiful Styling */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
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
                  onClick={() => {haptic(); setMessage(`Help me ${item.text.toLowerCase()}`);}}
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
                    {formatMessage(msg.content)}
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
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 shadow-inner">
          <button 
            onClick={() => haptic()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-colors duration-200 rounded-full hover:bg-white/50"
          >
            <AttachIcon />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isStreaming || isRecording || isProcessingAudio}
            className="flex-1 bg-transparent px-3 py-2.5 outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 font-medium"
          />
          
          <button 
            onClick={() => haptic()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-colors duration-200 rounded-full hover:bg-white/50"
          >
            <EmojiIcon />
          </button>
          
          {message.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={isStreaming}
              className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              <SendIcon />
            </button>
          ) : (
            <button
              onClick={handleVoiceRecord}
              disabled={isStreaming || isProcessingAudio}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-xl' 
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isFabExpanded && (
        <div className="absolute bottom-24 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 animate-slideUp">
          <p className="text-sm font-bold mb-2">Recording...</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse"></div>
            </div>
            <button
              onClick={() => {haptic(); stopRecording(); setIsFabExpanded(false);}}
              className="text-gray-500"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessingAudio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-gray-600 dark:text-gray-300 font-bold text-lg">Processing audio...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .prose pre { background: transparent !important; padding: 0 !important; }
        .prose code { font-size: 0.875rem; }
        .prose { color: inherit; }
        .prose strong { color: inherit; }
        .prose a { color: #9333ea; text-decoration: underline; }
      `}</style>
    </div>
  );
}