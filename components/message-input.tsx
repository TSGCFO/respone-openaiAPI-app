"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Mic, 
  Send, 
  Paperclip, 
  X, 
  ChevronDown,
  Smile,
  Command,
  Hash,
  AtSign
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  { icon: Command, label: "Command", prefix: "/" },
  { icon: AtSign, label: "Mention", prefix: "@" },
  { icon: Hash, label: "Tag", prefix: "#" },
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
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [showCharCount, setShowCharCount] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      setTextareaHeight(`${newHeight}px`);
      
      // Show character count when message is long
      setShowCharCount(message.length > maxLength * 0.8);
    }
  }, [message, maxLength]);

  // Handle keyboard visibility
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const height = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(height);
        
        // Auto-scroll to keep input visible
        if (height > 0 && containerRef.current) {
          containerRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "end" 
          });
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target === textareaRef.current) {
        // Save scroll position before keyboard appears
        scrollPositionRef.current = window.scrollY;
        setShowQuickActions(true);
        
        // Delay to ensure keyboard is fully open
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollIntoView({ 
              behavior: "smooth", 
              block: "end" 
            });
          }
        }, 300);
      }
    };

    const handleFocusOut = () => {
      setShowQuickActions(false);
      // Restore scroll position when keyboard hides
      if (scrollPositionRef.current > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "smooth"
          });
          scrollPositionRef.current = 0;
        }, 100);
      }
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    haptic.trigger("impact");
    onSendMessage(message.trim());
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      setTextareaHeight("auto");
    }
  }, [message, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isComposing]);

  const handleQuickAction = (action: QuickAction) => {
    haptic.trigger("selection");
    setMessage(message + action.prefix);
    textareaRef.current?.focus();
    setShowQuickActions(false);
  };

  const handleAudioReady = useCallback(async (audioBlob: Blob) => {
    console.log("Audio ready for transcription", audioBlob.size);
  }, []);

  const handleTranscriptionRequest = useCallback(async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Transcription failed");
      
      const data = await response.json();
      
      if (data.text) {
        setMessage(data.text);
        haptic.trigger("success");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      haptic.trigger("error");
    } finally {
      setIsProcessingAudio(false);
    }
  }, []);

  const handleSwipeDown = useCallback((e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Swipe down to dismiss keyboard
      if (deltaY > 50) {
        textareaRef.current?.blur();
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  }, []);

  const handleAttachment = () => {
    haptic.trigger("selection");
    setIsAttachmentOpen(!isAttachmentOpen);
    // Future: Implement file picker
    console.log("Attachment clicked");
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "transition-transform duration-300 ease-out",
        className
      )}
      style={{
        transform: `translateY(-${keyboardHeight}px)`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {/* Quick Actions Bar - shows above keyboard */}
      {showQuickActions && isFocused && (
        <div className={cn(
          "absolute bottom-full left-0 right-0",
          "bg-white/95 backdrop-blur-sm border-t",
          "animate-in slide-in-from-bottom-2 duration-200"
        )}>
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  "bg-gray-100 rounded-full",
                  "text-sm font-medium text-gray-700",
                  "active:scale-95 transition-transform",
                  "min-h-[36px] whitespace-nowrap"
                )}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
            
            {/* Dismiss keyboard button */}
            <button
              onClick={() => textareaRef.current?.blur()}
              className={cn(
                "ml-auto flex items-center gap-1 px-3 py-2",
                "text-sm text-gray-500",
                "active:scale-95 transition-transform"
              )}
            >
              <ChevronDown className="h-4 w-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div className={cn(
        "bg-white border-t",
        platform === "ios" && "bg-white/95 backdrop-blur-xl",
        platform === "android" && "bg-white shadow-lg"
      )}>
        <div className="flex items-end gap-2 p-2 sm:p-3 max-w-4xl mx-auto">
          {/* Attachment Button */}
          <button
            onClick={handleAttachment}
            disabled={disabled}
            className={cn(
              "flex items-center justify-center",
              "min-w-[48px] min-h-[48px] rounded-full",
              "text-gray-600 hover:bg-gray-100",
              "active:scale-90 transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isAttachmentOpen && "bg-blue-100 text-blue-600"
            )}
            aria-label="Add attachment"
          >
            {isAttachmentOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          {/* Text Input Area */}
          <div className={cn(
            "flex-1 relative",
            "rounded-[24px] transition-all duration-200",
            platform === "ios" && "bg-gray-100",
            platform === "android" && "bg-gray-50 border border-gray-200",
            isFocused && platform === "ios" && "bg-white border border-blue-500",
            isFocused && platform === "android" && "border-blue-600 shadow-sm"
          )}>
            <div 
              className="relative"
              onTouchStart={handleSwipeDown}
            >
              {/* Floating Label for Android */}
              {platform === "android" && message.length > 0 && (
                <label className={cn(
                  "absolute -top-2 left-4 px-1",
                  "text-xs font-medium",
                  "bg-white transition-all duration-200",
                  isFocused ? "text-blue-600" : "text-gray-500"
                )}>
                  {placeholder}
                </label>
              )}

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onFocus={() => {
                  setIsFocused(true);
                  onFocus?.();
                }}
                onBlur={() => {
                  setIsFocused(false);
                  onBlur?.();
                }}
                disabled={disabled || isProcessingAudio}
                placeholder={isProcessingAudio ? "Processing audio..." : placeholder}
                maxLength={maxLength}
                rows={1}
                className={cn(
                  "w-full resize-none bg-transparent",
                  "px-4 py-3 pr-12",
                  "text-base leading-normal",
                  "focus:outline-none",
                  "touch-manipulation",
                  "min-h-[48px]",
                  "placeholder:text-gray-400"
                )}
                style={{
                  height: textareaHeight,
                  maxHeight: "120px"
                }}
              />

              {/* Character Count */}
              {showCharCount && (
                <div className={cn(
                  "absolute bottom-1 left-4",
                  "text-xs",
                  message.length >= maxLength ? "text-red-500" : "text-gray-400"
                )}>
                  {message.length}/{maxLength}
                </div>
              )}
            </div>
          </div>

          {/* Voice Recording Button */}
          <AudioRecorder
            onAudioReady={handleAudioReady}
            onTranscriptionRequest={handleTranscriptionRequest}
            disabled={disabled}
            className="min-w-[48px] min-h-[48px]"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={cn(
              "flex items-center justify-center",
              "min-w-[48px] min-h-[48px] rounded-full",
              "transition-all duration-200",
              "active:scale-90",
              message.trim() && !disabled ? [
                "bg-blue-600 text-white",
                "hover:bg-blue-700",
                "shadow-sm"
              ] : [
                "bg-gray-200 text-gray-400",
                "cursor-not-allowed"
              ]
            )}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Typing Indicator Placeholder */}
        {false && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Someone is typing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};