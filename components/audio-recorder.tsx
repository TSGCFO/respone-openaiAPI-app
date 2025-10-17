"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { MicrophoneButton } from './microphone-button';
import { RecordingTimer } from './recording-timer';
import { Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 2 }} className={className}>
      {showRecordingUI && isRecording && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RecordingTimer 
            seconds={recordingTime} 
            isPaused={isPaused}
          />
          {recordingTime > 0 && (
            <IconButton
              onClick={handleCancelRecording}
              size="small"
              sx={{
                p: 1,
                '&:hover': {
                  backgroundColor: 'grey.100',
                }
              }}
              aria-label="Cancel recording"
            >
              <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </IconButton>
          )}
          {maxRecordingTime - recordingTime <= 10 && (
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                color: 'error.main'
              }}
            >
              {maxRecordingTime - recordingTime}s remaining
            </Box>
          )}
        </Box>
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
    </Box>
  );
};