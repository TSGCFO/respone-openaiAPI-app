"use client";

import React from 'react';
import {
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Paper,
  useTheme,
  alpha,
  keyframes,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';

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

// Define pulse animation for recording state
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

// Define ping animation for recording indicator
const ping = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

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
  const theme = useTheme();

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
    if (error) return theme.palette.error.main;
    if (isProcessing) return theme.palette.warning.main;
    if (isRecording) return theme.palette.error.main;
    return theme.palette.primary.main; // Purple theme color
  };

  const getButtonIcon = () => {
    if (error) return <ErrorIcon sx={{ fontSize: 24 }} />;
    if (isProcessing) return (
      <CircularProgress 
        size={24} 
        sx={{ color: 'white' }}
      />
    );
    if (isRecording) return <StopIcon sx={{ fontSize: 24 }} />;
    return <MicIcon sx={{ fontSize: 24 }} />;
  };

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 1,
      }}
      className={className}
    >
      {isRecording && !isProcessing && (onPauseRecording || onResumeRecording) && (
        <IconButton
          onClick={handlePauseResumeClick}
          disabled={disabled}
          size="medium"
          sx={{
            minWidth: 40,
            minHeight: 40,
            backgroundColor: alpha(theme.palette.grey[600], 0.9),
            color: 'white',
            '&:hover': {
              backgroundColor: theme.palette.grey[700],
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
          aria-label={isPaused ? "Resume recording" : "Pause recording"}
        >
          {isPaused ? <PlayIcon sx={{ fontSize: 20 }} /> : <PauseIcon sx={{ fontSize: 20 }} />}
        </IconButton>
      )}
      
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={handleMainButtonClick}
          disabled={disabled || isProcessing}
          size="large"
          sx={{
            minWidth: 48,
            minHeight: 48,
            backgroundColor: getButtonColor(),
            color: 'white',
            position: 'relative',
            '&:hover': {
              backgroundColor: alpha(getButtonColor(), 0.8),
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              opacity: 0.5,
            },
            ...(isRecording && !isPaused && !isProcessing && {
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }),
          }}
          aria-label={
            isProcessing ? "Processing..." :
            isRecording ? "Stop recording" : 
            "Start recording"
          }
        >
          {getButtonIcon()}
          {isRecording && !isPaused && !isProcessing && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
                opacity: 0.75,
                animation: `${ping} 1.5s ease-out infinite`,
              }}
            />
          )}
        </IconButton>
      </Box>

      {error && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            mt: 1,
            left: 0,
            right: 0,
            minWidth: 200,
            p: 1.5,
            backgroundColor: theme.palette.error.light,
            zIndex: 50,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.error.contrastText,
              display: 'block',
            }}
          >
            {error}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};