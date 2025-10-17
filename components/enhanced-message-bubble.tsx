"use client";

import React, { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEnhancedSwipe } from "@/hooks/useEnhancedSwipe";
import { 
  Trash2, 
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Bot
} from 'lucide-react';
import { cn } from "@/lib/utils";
import haptic from "@/lib/haptic";
import { MessageItem } from "@/lib/assistant";
import { format } from "date-fns";

interface EnhancedMessageBubbleProps {
  message: MessageItem;
  onRegenerate?: () => void;
  onReply?: () => void;
  onDelete?: () => void;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  platform?: "ios" | "android" | "other";
  messageStatus?: "sending" | "sent" | "delivered" | "read" | "failed";
  className?: string;
}

interface UndoState {
  message: MessageItem;
  timeoutId: NodeJS.Timeout;
}

const EnhancedMessageBubble = forwardRef<HTMLDivElement, EnhancedMessageBubbleProps>(({
  message,
  onDelete,
  isGroupStart = false,
  isGroupEnd = true,
  showAvatar = false,
  showTimestamp = false,
  platform: propPlatform,
  messageStatus = "sent",
  className
}) => {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">(propPlatform || "other");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedMessages, setDeletedMessages] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<Map<string, UndoState>>(new Map());
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const messageRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  
  const isUser = message.role === "user";
  const messageText = message.content[0]?.text || "";
  // Use a stable messageId that doesn't change between server and client
  const messageId = (message as any).id || `${message.role}-${messageText.slice(0, 20)}`;
  
  // Detect platform
  useEffect(() => {
    if (!propPlatform || propPlatform === "other") {
      const userAgent = navigator.userAgent || navigator.vendor;
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        setPlatform("ios");
      } else if (/android/i.test(userAgent)) {
        setPlatform("android");
      } else {
        setPlatform("other");
      }
    }
  }, [propPlatform]);
  
  // Set current time only on the client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(format(new Date(), 'HH:mm'));
  }, []);
  
  // Handle delete with undo
  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    haptic.trigger('medium');
    
    // Mark as deleted
    setDeletedMessages(prev => new Set(prev).add(messageId));
    
    // Create undo state
    const timeoutId = setTimeout(() => {
      // Permanent delete after undo timeout
      onDelete?.();
      setUndoStack(prev => {
        const newStack = new Map(prev);
        newStack.delete(messageId);
        return newStack;
      });
    }, 5000); // 5 second undo window
    
    setUndoStack(prev => new Map(prev).set(messageId, {
      message,
      timeoutId
    }));
    
    // Show undo toast
    showUndoToast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId, message, onDelete]);
  
  // Handle undo
  const handleUndo = useCallback((id: string) => {
    const undoState = undoStack.get(id);
    if (undoState) {
      clearTimeout(undoState.timeoutId);
      setDeletedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setUndoStack(prev => {
        const newStack = new Map(prev);
        newStack.delete(id);
        return newStack;
      });
      haptic.trigger('light');
    }
  }, [undoStack]);
  
  // Show undo toast
  const showUndoToast = useCallback(() => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg z-50 flex items-center gap-3 shadow-lg animate-slide-up';
    toast.innerHTML = `
      <span>Message deleted</span>
      <button class="text-blue-400 font-medium px-2 py-1 hover:bg-white/10 rounded" data-undo="${messageId}">
        Undo
      </button>
    `;
    
    document.body.appendChild(toast);
    
    const undoButton = toast.querySelector('[data-undo]') as HTMLButtonElement;
    undoButton?.addEventListener('click', () => {
      handleUndo(messageId);
      toast.remove();
    });
    
    setTimeout(() => {
      toast.classList.add('animate-slide-down');
      setTimeout(() => toast.remove(), 300);
    }, 4700);
  }, [messageId, handleUndo]);
  
  // Swipe handlers
  const handleSwipeMove = useCallback((deltaX: number, deltaY: number, _velocity: number, progress: number) => {
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    
    // Only allow left swipe for delete
    if (deltaX >= 0) return;
    
    if (messageRef.current) {
      if (platform === 'ios') {
        // iOS style: reveal delete button
        messageRef.current.style.transform = `translate3d(${deltaX}px, 0, 0)`;
        messageRef.current.style.transition = 'none';
        
        // Show/hide delete button
        if (deleteButtonRef.current) {
          deleteButtonRef.current.style.opacity = `${progress}`;
          deleteButtonRef.current.style.transform = `scale(${0.8 + progress * 0.2})`;
        }
      } else {
        // Android style: red background with icon
        messageRef.current.style.transform = `translate3d(${deltaX * 0.9}px, 0, 0)`;
        messageRef.current.style.transition = 'none';
        
        // Update background
        const parent = messageRef.current.parentElement;
        if (parent) {
          parent.style.background = `rgba(239, 68, 68, ${progress * 0.8})`;
        }
      }
    }
  }, [platform]);
  
  const handleSwipeEnd = useCallback((direction: 'left' | 'right' | null, velocity: number, deltaX: number) => {
    if (!messageRef.current) return;
    
    const threshold = 80;
    const velocityThreshold = 0.5;
    
    if (direction === 'left' && (Math.abs(deltaX) > threshold || velocity > velocityThreshold)) {
      // Trigger delete
      if (platform === 'ios') {
        // iOS: Show delete button fully
        messageRef.current.style.transform = 'translate3d(-100px, 0, 0)';
        messageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        
        if (deleteButtonRef.current) {
          deleteButtonRef.current.style.opacity = '1';
          deleteButtonRef.current.style.transform = 'scale(1)';
        }
      } else {
        // Android: Auto-delete with animation
        messageRef.current.style.transform = 'translate3d(-100%, 0, 0)';
        messageRef.current.style.opacity = '0';
        messageRef.current.style.transition = 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        
        setTimeout(() => {
          handleDelete();
        }, 300);
      }
    } else {
      // Spring back
      messageRef.current.style.transform = 'translate3d(0, 0, 0)';
      messageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      
      if (deleteButtonRef.current) {
        deleteButtonRef.current.style.opacity = '0';
        deleteButtonRef.current.style.transform = 'scale(0.8)';
      }
      
      const parent = messageRef.current.parentElement;
      if (parent) {
        parent.style.background = 'transparent';
        parent.style.transition = 'background 0.3s';
      }
    }
  }, [platform, handleDelete]);
  
  const handleSwipeCancel = useCallback(() => {
    if (!messageRef.current) return;
    
    messageRef.current.style.transform = 'translate3d(0, 0, 0)';
    messageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
    
    if (deleteButtonRef.current) {
      deleteButtonRef.current.style.opacity = '0';
    }
    
    const parent = messageRef.current.parentElement;
    if (parent) {
      parent.style.background = 'transparent';
    }
  }, []);
  
  // Use enhanced swipe hook
  const swipeState = useEnhancedSwipe(messageRef, {
    threshold: 80,
    velocityThreshold: 0.5,
    rubberBandEffect: true,
    onSwipeMove: handleSwipeMove,
    onSwipeEnd: (direction, velocity, deltaX) => {
      handleSwipeEnd(direction as 'left' | 'right' | null, velocity, deltaX);
    },
    onSwipeCancel: handleSwipeCancel,
  });
  
  // Hide deleted messages
  if (deletedMessages.has(messageId)) {
    return null;
  }
  
  return (
    <div className="relative overflow-visible">
      {/* Delete button background (iOS style) */}
      {platform === 'ios' && (
        <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-4">
          <button
            ref={deleteButtonRef}
            onClick={handleDelete}
            className="bg-red-500 text-white rounded-lg p-2 opacity-0 transform scale-75 transition-all duration-200"
            style={{
              transition: swipeState.isSwiping ? 'none' : 'all 0.2s',
            }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
      
      {/* Android style delete background */}
      {platform === 'android' && (
        <div 
          className="absolute inset-0 flex items-center justify-end pr-4 transition-colors duration-300"
          style={{
            background: swipeState.isSwiping ? undefined : 'transparent',
          }}
        >
          {swipeState.isSwiping && swipeState.direction === 'left' && (
            <Trash2 size={24} className="text-white opacity-80" />
          )}
        </div>
      )}
      
      {/* Message bubble */}
      <div
        ref={messageRef}
        className={cn(
          "relative",
          isDeleting && "opacity-50",
          className
        )}
        style={{
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl max-w-[85%] break-words",
            isUser ? [
              "ml-auto bg-blue-500 text-white",
              isGroupStart && "rounded-tr-sm",
              isGroupEnd && "rounded-br-sm",
            ] : [
              "mr-auto bg-gray-100 text-gray-900",
              isGroupStart && "rounded-tl-sm",
              isGroupEnd && "rounded-bl-sm",
            ],
            "transition-all duration-200",
            swipeState.isSwiping && "shadow-lg"
          )}
        >
          {/* Avatar */}
          {showAvatar && (
            <div className={cn(
              "absolute -bottom-1",
              isUser ? "-right-10" : "-left-10"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isUser ? "bg-blue-600" : "bg-gray-600"
              )}>
                {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
            </div>
          )}
          
          {/* Message content */}
          <div className="relative">
            {typeof messageText === 'string' ? (
              <ReactMarkdown
                className={cn(
                  "prose prose-sm max-w-none",
                  isUser ? "prose-invert" : "prose-gray"
                )}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={oneDark}
                        PreTag="div"
                        className="rounded-lg my-2"
                        {...props as any}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={cn(
                        "px-1 py-0.5 rounded",
                        isUser ? "bg-blue-600" : "bg-gray-200"
                      )} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {messageText}
              </ReactMarkdown>
            ) : (
              <span>{messageText}</span>
            )}
          </div>
          
          {/* Timestamp & Status */}
          {showTimestamp && currentTime && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs opacity-70",
              isUser ? "justify-end" : "justify-start"
            )}>
              <span>{currentTime}</span>
              {isUser && (
                <>
                  {messageStatus === 'sending' && <Clock size={12} />}
                  {messageStatus === 'sent' && <Check size={12} />}
                  {messageStatus === 'delivered' && <CheckCheck size={12} />}
                  {messageStatus === 'read' && <CheckCheck size={12} className="text-blue-300" />}
                  {messageStatus === 'failed' && <AlertCircle size={12} className="text-red-300" />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedMessageBubble.displayName = 'EnhancedMessageBubble';

export default EnhancedMessageBubble;