"use client";

import React from 'react';
import { Mic, Square, Pause, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing?: boolean;
  error?: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isRecording,
  isPaused,
  isProcessing = false,
  error,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  disabled = false,
  className,
}) => {
  const handleMainButtonClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const handlePauseResumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused && onResumeRecording) {
      onResumeRecording();
    } else if (!isPaused && onPauseRecording) {
      onPauseRecording();
    }
  };

  const getButtonColor = () => {
    if (error) return 'bg-red-500 hover:bg-red-600';
    if (isProcessing) return 'bg-yellow-500 hover:bg-yellow-600';
    if (isRecording) return 'bg-red-500 hover:bg-red-600';
    return 'bg-black hover:bg-gray-800';
  };

  const getButtonIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (isProcessing) return (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    );
    if (isRecording) return <Square className="w-4 h-4 fill-current" />;
    return <Mic className="w-4 h-4" />;
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {isRecording && !isProcessing && (onPauseRecording || onResumeRecording) && (
        <button
          onClick={handlePauseResumeClick}
          disabled={disabled}
          className={cn(
            "size-7 rounded-full flex items-center justify-center text-white transition-all",
            "bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={isPaused ? "Resume recording" : "Pause recording"}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
      )}
      
      <button
        onClick={handleMainButtonClick}
        disabled={disabled || isProcessing}
        className={cn(
          "size-8 rounded-full flex items-center justify-center text-white transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          getButtonColor(),
          isRecording && !isPaused && !isProcessing && "animate-pulse",
          className
        )}
        aria-label={
          isProcessing ? "Processing..." :
          isRecording ? "Stop recording" : 
          "Start recording"
        }
      >
        <div className="relative">
          {getButtonIcon()}
          {isRecording && !isPaused && !isProcessing && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75" />
          )}
        </div>
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-[200px] p-2 bg-red-50 text-red-600 text-xs rounded-md shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
};