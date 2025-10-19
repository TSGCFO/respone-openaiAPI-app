'use client';

import React, { useState, useRef, useEffect } from 'react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMessages } from '@/lib/assistant';

export function F7SimpleChat() {
  const {
    chatMessages,
    conversationItems,
    appendMessage,
    isStreaming,
    setIsStreaming,
  } = useConversationStore();
  
  const { selectedModel, reasoningEffort, setSelectedModel, setReasoningEffort } = useToolsStore();
  
  const [message, setMessage] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    resetRecording,
  } = useAudioRecorder();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (isStreaming) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    
    appendMessage(userMessage);
    setMessage('');
    setIsStreaming(true);
    
    try {
      await processMessages([...conversationItems, userMessage]);
    } catch (error) {
      console.error('Error processing messages:', error);
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
        } finally {
          setIsProcessingAudio(false);
          resetRecording();
        }
      }
    } else {
      startRecording();
    }
  };

  const models = [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-pro', label: 'GPT-5 Pro' },
  ];

  return (
    <div className="f7-page h-screen flex flex-col bg-gray-50">
      {/* Android-style Navbar */}
      <div className="navbar bg-purple-600 text-white shadow-md">
        <div className="navbar-inner flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <i className="f7-icons">bubble_left_bubble_right</i>
            <span className="text-lg font-medium">AI Assistant</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowMcpPanel(!showMcpPanel)} className="p-2">
              <i className="f7-icons">gear_alt</i>
            </button>
            <button onClick={() => setShowToolsPanel(!showToolsPanel)} className="p-2">
              <i className="f7-icons">square_grid_3x2</i>
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="bg-purple-50 border-b border-purple-100 px-4 py-2">
        <div className="flex items-center gap-3 overflow-x-auto">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm"
          >
            {models.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
          
          {selectedModel.includes('gpt-5') && (
            <div className="flex gap-1">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  onClick={() => setReasoningEffort(level as any)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    reasoningEffort === level 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border border-purple-300 text-purple-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-20">
            <i className="f7-icons text-6xl text-gray-300">bubble_left_bubble_right</i>
            <p className="text-gray-500 mt-4">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                  </div>
                  {msg.timestamp && (
                    <div className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="bg-white border-t shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500">
            <i className="f7-icons">paperclip</i>
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={isStreaming || isRecording || isProcessingAudio}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleVoiceRecord}
            className={`p-2 rounded-full transition-colors ${
              isRecording ? 'text-red-500 animate-pulse' : 'text-purple-600'
            }`}
            disabled={isStreaming || isProcessingAudio}
          >
            <i className="f7-icons">{isRecording ? 'stop_circle' : 'mic'}</i>
          </button>
          
          {message.trim() && (
            <button
              onClick={handleSendMessage}
              disabled={isStreaming}
              className="p-2 bg-purple-600 text-white rounded-full"
            >
              <i className="f7-icons">paperplane</i>
            </button>
          )}
        </div>
      </div>

      {/* Processing overlay */}
      {isProcessingAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing audio...</p>
          </div>
        </div>
      )}
    </div>
  );
}