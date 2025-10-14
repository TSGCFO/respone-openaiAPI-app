"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { MicrophoneButton } from './microphone-button';
import { RecordingTimer } from './recording-timer';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, audioUrl: string) => void;
  onTranscriptionRequest?: (audioBlob: Blob) => void;
  maxRecordingTime?: number; // in seconds
  className?: string;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  onTranscriptionRequest,
  maxRecordingTime = 300, // 5 minutes default
  className,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    isSupported,
  } = useAudioRecorder();

  // Auto-stop recording when max time is reached
  useEffect(() => {
    if (isRecording && recordingTime >= maxRecordingTime) {
      handleStopRecording();
    }
  }, [isRecording, recordingTime, maxRecordingTime]);

  // Handle audio blob when recording stops
  useEffect(() => {
    if (audioBlob && audioUrl && !isRecording) {
      setIsProcessing(true);
      onAudioReady(audioBlob, audioUrl);
      
      if (onTranscriptionRequest) {
        onTranscriptionRequest(audioBlob);
      }
      
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessing(false);
        setShowRecordingUI(false);
      }, 1000);
    }
  }, [audioBlob, audioUrl, isRecording, onAudioReady, onTranscriptionRequest]);

  const handleStartRecording = useCallback(async () => {
    if (!isSupported) {
      console.error('Audio recording is not supported in this browser');
      return;
    }
    
    resetRecording();
    setShowRecordingUI(true);
    await startRecording();
  }, [isSupported, resetRecording, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const handleCancelRecording = useCallback(() => {
    resetRecording();
    setShowRecordingUI(false);
    setIsProcessing(false);
  }, [resetRecording]);

  // Don't render error message on initial load (SSR)
  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      {showRecordingUI && isRecording && (
        <div className="flex items-center gap-2">
          <RecordingTimer 
            seconds={recordingTime} 
            isPaused={isPaused}
          />
          {recordingTime > 0 && (
            <button
              onClick={handleCancelRecording}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cancel recording"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {maxRecordingTime - recordingTime <= 10 && (
            <span className="text-xs text-red-500">
              {maxRecordingTime - recordingTime}s remaining
            </span>
          )}
        </div>
      )}
      
      <MicrophoneButton
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        error={error}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        disabled={disabled}
      />
    </div>
  );
};