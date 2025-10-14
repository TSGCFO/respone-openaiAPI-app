"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface RecordingTimerProps {
  seconds: number;
  isPaused?: boolean;
  className?: string;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  seconds,
  isPaused = false,
  className,
}) => {
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono",
        "bg-red-50 text-red-600 border border-red-200",
        isPaused && "bg-yellow-50 text-yellow-600 border-yellow-200",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {!isPaused && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </>
        )}
        {isPaused && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        )}
      </span>
      <span>{formatTime(seconds)}</span>
      {isPaused && <span className="text-xs">(Paused)</span>}
    </div>
  );
};