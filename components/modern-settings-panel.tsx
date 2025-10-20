'use client';

import React, { useState, useEffect } from 'react';
import useConversationStore from '@/stores/useConversationStore';
import useToolsStore from '@/stores/useToolsStore';

// Icon components
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const SettingsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

const MoonIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/>
  </svg>
);

const BrainIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3C9.23 3 6.19 5.95 6 9.66l-1.92 2.53c-.24.31.05.81.4.81H6v3c0 1.11.89 2 2 2h1v3h7v-4.68c3.3-1.3 5.65-4.5 5.65-8.26C21.65 5.21 18.79 2 15 2l-2 1zm3.5 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </svg>
);

const SaveIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
  </svg>
);

const DatabaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm0 6c-3.31 0-6-1.34-6-3s2.69-3 6-3 6 1.34 6 3-2.69 3-6 3zm0 8c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4zm0-4c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z"/>
  </svg>
);

interface ModernSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModernSettingsPanel({ isOpen, onClose }: ModernSettingsPanelProps) {
  const { selectedModel, setSelectedModel, reasoningEffort, setReasoningEffort, userId } = useConversationStore();
  const {
    fileSearchEnabled,
    setFileSearchEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    codeInterpreterEnabled,
    setCodeInterpreterEnabled,
    functionsEnabled,
    setFunctionsEnabled,
    googleIntegrationEnabled,
    setGoogleIntegrationEnabled,
  } = useToolsStore();
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [streamResponses, setStreamResponses] = useState(true);
  const [maxTokens, setMaxTokens] = useState('4096');
  const [temperature, setTemperature] = useState('0.7');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This will delete all conversations and memories.')) {
      // Clear localStorage
      localStorage.clear();
      // Reload the page to reset state
      window.location.reload();
    }
  };

  const haptic = (intensity: number = 1) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <SettingsIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Settings</h2>
                  <p className="text-xs opacity-90">Customize your experience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              
              {/* Model Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <BrainIcon className="text-purple-600" />
                  AI Model Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => {haptic(); setSelectedModel(e.target.value);}}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4.1">GPT-4.1</option>
                      <option value="gpt-5">GPT-5</option>
                      <option value="gpt-5-pro">GPT-5 Pro</option>
                    </select>
                  </div>
                  
                  {selectedModel.includes('gpt-5') && (
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Reasoning Effort</label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map(level => (
                          <button
                            key={level}
                            onClick={() => {haptic(); setReasoningEffort(level as any);}}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                              reasoningEffort === level
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Temperature</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max Tokens</label>
                      <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <KeyIcon className="text-purple-600" />
                  API Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">OpenAI API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Stream Responses</span>
                    <button
                      onClick={() => {haptic(); setStreamResponses(!streamResponses);}}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        streamResponses ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        streamResponses ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tools & Features */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <DatabaseIcon className="text-purple-600" />
                  Tools & Features
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'File Search', value: fileSearchEnabled, setter: setFileSearchEnabled },
                    { label: 'Web Search', value: webSearchEnabled, setter: setWebSearchEnabled },
                    { label: 'Code Interpreter', value: codeInterpreterEnabled, setter: setCodeInterpreterEnabled },
                    { label: 'Functions', value: functionsEnabled, setter: setFunctionsEnabled },
                    { label: 'Google Integration', value: googleIntegrationEnabled, setter: setGoogleIntegrationEnabled },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
                      <button
                        onClick={() => {haptic(); feature.setter(!feature.value);}}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          feature.value ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          feature.value ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MoonIcon className="text-purple-600" />
                  Appearance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                    <button
                      onClick={handleThemeToggle}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        darkMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        darkMode ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications & Data */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <BellIcon className="text-purple-600" />
                  Notifications & Data
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                    <button
                      onClick={() => {haptic(); setNotifications(!notifications);}}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-save Conversations</span>
                    <button
                      onClick={() => {haptic(); setAutoSave(!autoSave);}}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        autoSave ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoSave ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleClearData}
                      className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <SaveIcon className="text-purple-600" />
                  User Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">User ID</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">{userId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Version</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}