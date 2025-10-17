"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  TextField,
  IconButton,
  Box,
  Paper,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  CircularProgress
} from "@mui/material";
import {
  Send as SendIcon,
  Mic as MicIcon,
  AttachFile as AttachFileIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  EmojiEmotions as EmojiIcon,
  Functions as FunctionsIcon,
  Tag as TagIcon,
  AlternateEmail as MentionIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Videocam as VideoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from "@mui/icons-material";
import haptic from "@/lib/haptic";
import { AudioRecorder } from "./audio-recorder";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prefix: string;
}

const quickActions: QuickAction[] = [
  { icon: FunctionsIcon, label: "Command", prefix: "/" },
  { icon: MentionIcon, label: "Mention", prefix: "@" },
  { icon: TagIcon, label: "Tag", prefix: "#" },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  className,
  placeholder = "Message...",
  maxLength = 5000,
  onFocus,
  onBlur
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showCharCount, setShowCharCount] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [attachmentAnchor, setAttachmentAnchor] = useState<null | HTMLElement>(null);
  
  const textFieldRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show character count when message is long
  useEffect(() => {
    setShowCharCount(message.length > maxLength * 0.8);
  }, [message, maxLength]);

  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    haptic.trigger("impact");
    onSendMessage(message.trim());
    setMessage("");
  }, [message, disabled, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleAttachmentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAttachmentAnchor(event.currentTarget);
    haptic.trigger("selection");
  };

  const handleAttachmentClose = () => {
    setAttachmentAnchor(null);
  };

  const handleAttachmentSelect = (type: string) => {
    haptic.trigger("light");
    console.log(`Selected attachment type: ${type}`);
    handleAttachmentClose();
  };

  const handleQuickAction = (action: QuickAction) => {
    haptic.trigger("selection");
    setMessage(prev => prev + action.prefix);
    setShowQuickActions(false);
    textFieldRef.current?.querySelector('textarea')?.focus();
  };

  const handleAudioStart = () => {
    setIsRecording(true);
    haptic.trigger("impact");
  };

  const handleAudioEnd = async (blob: Blob) => {
    setIsRecording(false);
    setIsProcessingAudio(true);
    
    try {
      const formData = new FormData();
      const audioFile = new File([blob], "recording.webm", {
        type: blob.type || "audio/webm"
      });
      formData.append("audio", audioFile);
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setMessage(data.text);
          haptic.trigger("success");
        }
      } else {
        haptic.trigger("error");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      haptic.trigger("error");
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleAudioReady = useCallback(async (audioBlob: Blob) => {
    console.log("Audio ready for transcription", audioBlob.size);
  }, []);

  const handleTranscriptionRequest = useCallback(async (audioBlob: Blob) => {
    await handleAudioEnd(audioBlob);
  }, []);

  return (
    <Paper
      ref={containerRef}
      elevation={isFocused ? 8 : 2}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        borderRadius: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'background-color']),
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Quick Actions Bar */}
      <Collapse in={showQuickActions}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            p: 1, 
            borderBottom: `1px solid ${theme.palette.divider}` 
          }}
        >
          {quickActions.map((action) => (
            <Chip
              key={action.label}
              icon={<action.icon />}
              label={action.label}
              onClick={() => handleQuickAction(action)}
              variant="outlined"
              size="small"
              sx={{
                borderColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            />
          ))}
          
          {/* Dismiss keyboard button */}
          <IconButton
            onClick={() => textFieldRef.current?.querySelector('textarea')?.blur()}
            sx={{
              ml: 'auto',
              color: theme.palette.text.secondary
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
      </Collapse>

      {/* Main Input Area */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* Attachment Button */}
        <Tooltip title="Add attachment">
          <IconButton
            onClick={handleAttachmentClick}
            disabled={disabled}
            sx={{
              color: theme.palette.action.active,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>

        {/* Text Field */}
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            setIsFocused(true);
            setShowQuickActions(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowQuickActions(false), 200);
            onBlur?.();
          }}
          placeholder={isProcessingAudio ? "Processing audio..." : placeholder}
          disabled={disabled || isRecording || isProcessingAudio}
          variant="outlined"
          size="small"
          InputProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              '&.Mui-focused': {
                backgroundColor: theme.palette.background.paper,
              }
            },
            endAdornment: showCharCount && (
              <InputAdornment position="end">
                <Typography 
                  variant="caption" 
                  color={message.length > maxLength ? "error" : "textSecondary"}
                >
                  {message.length}/{maxLength}
                </Typography>
              </InputAdornment>
            )
          }}
          inputProps={{
            maxLength: maxLength,
            style: { minHeight: '24px' }
          }}
        />

        {/* Voice Recording Button */}
        {!message.trim() && (
          <Box sx={{ position: 'relative' }}>
            <AudioRecorder
              onAudioReady={handleAudioReady}
              onTranscriptionRequest={handleTranscriptionRequest}
              disabled={disabled}
              className="min-w-[48px] min-h-[48px]"
            >
              <Tooltip title={isRecording ? "Recording..." : "Hold to record"}>
                <IconButton
                  disabled={disabled || isProcessingAudio}
                  sx={{
                    backgroundColor: isRecording 
                      ? theme.palette.error.main 
                      : theme.palette.action.selected,
                    color: isRecording 
                      ? theme.palette.error.contrastText 
                      : theme.palette.action.active,
                    '&:hover': {
                      backgroundColor: isRecording
                        ? theme.palette.error.dark
                        : alpha(theme.palette.primary.main, 0.12),
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabledBackground,
                    },
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' },
                    }
                  }}
                >
                  <MicIcon />
                </IconButton>
              </Tooltip>
            </AudioRecorder>
            {isProcessingAudio && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <CircularProgress size={20} />
              </Box>
            )}
          </Box>
        )}

        {/* Send Button */}
        {message.trim() && (
          <Tooltip title="Send message">
            <IconButton
              onClick={handleSend}
              disabled={disabled}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachmentAnchor}
        open={Boolean(attachmentAnchor)}
        onClose={handleAttachmentClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => handleAttachmentSelect('image')}>
          <ListItemIcon>
            <ImageIcon />
          </ListItemIcon>
          <ListItemText primary="Image" />
        </MenuItem>
        <MenuItem onClick={() => handleAttachmentSelect('file')}>
          <ListItemIcon>
            <FileIcon />
          </ListItemIcon>
          <ListItemText primary="File" />
        </MenuItem>
        <MenuItem onClick={() => handleAttachmentSelect('video')}>
          <ListItemIcon>
            <VideoIcon />
          </ListItemIcon>
          <ListItemText primary="Video" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};