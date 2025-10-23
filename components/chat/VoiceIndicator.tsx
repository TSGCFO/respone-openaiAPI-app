'use client';

import React from 'react';

// Icon components
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

interface VoiceIndicatorProps {
  isRecording: boolean;
  isProcessingAudio: boolean;
  isFabExpanded: boolean;
  handleVoiceRecord: () => void;
}

export function VoiceIndicator({
  isRecording,
  isProcessingAudio,
  isFabExpanded,
  handleVoiceRecord,
}: VoiceIndicatorProps) {
  return (
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
  );
}