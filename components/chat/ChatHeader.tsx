'use client';

import React from 'react';
import useToolsStore from '@/stores/useToolsStore';
import { haptics } from '@/lib/haptic';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

// Icon components
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

const OfflineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.76.59 6.82.36 7l11.63 14.49.01.01.01-.01 3.9-4.86 3.32 3.32 1.27-1.27-3.46-3.46z"/>
  </svg>
);

interface ChatHeaderProps {
  showMenu: boolean;
  setShowMenu: (value: boolean) => void;
  onOpenSettings: () => void;
  onOpenMemories: () => void;
  onOpenTools: () => void;
  onOpenMcp: () => void;
  onClearChat: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

export function ChatHeader({
  showMenu,
  setShowMenu,
  onOpenSettings,
  onOpenMemories,
  onOpenTools,
  onOpenMcp,
  onClearChat,
  menuRef,
}: ChatHeaderProps) {
  const { selectedModel, reasoningEffort, setSelectedModel, setReasoningEffort } = useToolsStore();
  const sendMessageCallback = async () => {}; // Dummy callback since we only need offline status
  const offlineQueue = useOfflineQueue(sendMessageCallback);

  return (
    <>
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
          
          <div className="flex items-center gap-2" ref={menuRef}>
            {offlineQueue.isOffline && (
              <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <OfflineIcon />
                <span className="text-xs font-medium">Offline</span>
              </div>
            )}

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
            
            {showMenu && (
              <div 
                className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 w-56 z-50 animate-fadeIn"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  onClick={() => {
                    haptics.light();
                    onOpenSettings();
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
                    onOpenMemories();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open memories panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Memories
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    haptics.light();
                    onOpenTools();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open tools panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Tools
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    haptics.light();
                    onOpenMcp();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  role="menuitem"
                  aria-label="Open MCP servers panel"
                >
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    MCP Servers
                  </span>
                </button>
                
                <div className="border-t dark:border-gray-700 my-2"></div>
                
                <button
                  onClick={() => {
                    haptics.medium();
                    onClearChat();
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
    </>
  );
}