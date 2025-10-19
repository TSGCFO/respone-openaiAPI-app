'use client';

import React, { useState, useRef, useEffect } from 'react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';
import { MessageItem } from '@/lib/assistant';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ModernChat() {
  const store = useConversationStore();
  const chatMessages = store.chatMessages;
  const conversationItems = store.conversationItems;
  const addChatMessage = store.addChatMessage;
  const isStreaming = store.isStreaming;
  const setIsStreaming = store.setIsStreaming;
  
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
    
    const userMessage: MessageItem = {
      type: 'message',
      id: Date.now().toString(),
      role: 'user',
      content: [{ type: 'input_text', text: message }],
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    (addChatMessage as any)(userMessage);
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
    if (typeof content === 'string') {
      return (
        <ReactMarkdown
          className="prose prose-sm max-w-none"
          components={{
            code({ className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;
              return !isInline && match ? (
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <i className="f7-icons text-xl">bubble_left_bubble_right_fill</i>
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Assistant</h1>
              <p className="text-xs opacity-80">Always here to help</p>
            </div>
          </div>
          <button 
            onClick={() => {haptic(); setShowMenu(!showMenu);}}
            className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
          >
            <i className="f7-icons">ellipsis</i>
          </button>
        </div>

        {/* Model Selector */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          <select 
            value={selectedModel} 
            onChange={(e) => {haptic(); setSelectedModel(e.target.value);}}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm outline-none focus:bg-white/30 transition-all"
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    reasoningEffort === level 
                      ? 'bg-white text-purple-600 shadow-lg' 
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
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
              <i className="f7-icons text-white text-5xl">star_fill</i>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
              Welcome!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              How can I assist you today?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm">
              {[
                { icon: 'lightbulb_fill', text: 'Get Ideas' },
                { icon: 'doc_text_fill', text: 'Write Content' },
                { icon: 'star_fill', text: 'Create Magic' },
                { icon: 'question_circle_fill', text: 'Ask Anything' }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {haptic(); setMessage(`Help me ${item.text.toLowerCase()}`);}}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  <i className={`f7-icons text-2xl text-purple-600 mb-2`}>{item.icon}</i>
                  <p className="text-sm font-medium">{item.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((item, index) => {
              // Type guard to check if item is a MessageItem
              if (item.type === 'message') {
                const msg = item as MessageItem;
                const messageContent = msg.content.map(c => c.text || '').join('');
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-3xl rounded-br-lg shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-3xl rounded-bl-lg shadow-md'
                      } px-5 py-3 relative`}
                    >
                      <div className="text-sm leading-relaxed">
                        {formatMessage(messageContent)}
                      </div>
                      {msg.metadata?.timestamp && (
                        <div className={`text-[10px] mt-2 ${
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
                );
              } else if (item.type === 'tool_call') {
                // Handle tool calls
                return (
                  <div key={index} className="flex justify-start animate-fadeIn">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                      Tool: {item.name || 'Processing...'}
                    </div>
                  </div>
                );
              }
              // For other types, return null or a placeholder
              return null;
            })}
            
            {isStreaming && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-lg shadow-md px-5 py-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Beautiful Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
          <button 
            onClick={() => haptic()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-colors"
          >
            <i className="f7-icons">paperclip</i>
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isStreaming || isRecording || isProcessingAudio}
            className="flex-1 bg-transparent px-2 py-2 outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
          />
          
          <button 
            onClick={() => haptic()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-colors"
          >
            <i className="f7-icons">smiley_fill</i>
          </button>
          
          {message.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={isStreaming}
              className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              <i className="f7-icons">arrow_up_circle_fill</i>
            </button>
          ) : (
            <button
              onClick={handleVoiceRecord}
              disabled={isStreaming || isProcessingAudio}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
            >
              <i className="f7-icons">{isRecording ? 'stop_circle_fill' : 'mic_fill'}</i>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isFabExpanded && (
        <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 animate-slideUp">
          <p className="text-sm font-medium mb-2">Recording...</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse"></div>
            </div>
            <button
              onClick={() => {haptic(); stopRecording(); setIsFabExpanded(false);}}
              className="text-gray-500"
            >
              <i className="f7-icons">xmark_circle_fill</i>
            </button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessingAudio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Processing audio...</p>
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
      `}</style>
    </div>
  );
}