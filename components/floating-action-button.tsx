"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, MessageSquarePlus, Mic, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import haptic from '@/lib/haptic';
import { useLongPress } from '@/hooks/useLongPress';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  onNewConversation: () => void;
  onVoiceChat?: () => void;
  onImportDocument?: () => void;
  className?: string;
  disabled?: boolean;
  hide?: boolean;
}

export function FloatingActionButton({
  onNewConversation,
  onVoiceChat,
  onImportDocument,
  className,
  disabled = false,
  hide = false,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 28, y: 28 });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const rotation = useSpring(0, { stiffness: 300, damping: 20 });
  
  // Detect platform
  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /android/.test(userAgent);
      
      if (isIOS) {
        setPlatform('ios');
      } else if (isAndroid) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    };
    
    detectPlatform();
  }, []);
  
  const handleMainAction = () => {
    haptic.trigger('medium');
    
    // Animate press
    scale.set(0.9);
    setIsPressed(true);
    rotation.set(45);
    
    // Show ripple on Android
    if (platform === 'android' && buttonRef.current) {
      setRipplePosition({ x: 28, y: 28 });
      setShowRipple(true);
    }
    
    setTimeout(() => {
      scale.set(1);
      setIsPressed(false);
      rotation.set(0);
      setShowRipple(false);
      onNewConversation();
    }, 150);
  };
  
  // Long press handler for quick actions
  const { handlers: longPressHandlers, isLongPressing } = useLongPress(
    () => {
      haptic.trigger('heavy');
      setIsExpanded(true);
      rotation.set(45);
    },
    { threshold: 500 }
  );
  
  // Handle regular click separately
  const handleClick = useCallback(() => {
    // Only handle click if it wasn't a long press
    if (!isLongPressing) {
      if (!isExpanded) {
        handleMainAction();
      } else {
        setIsExpanded(false);
        rotation.set(0);
      }
    }
  }, [isExpanded, isLongPressing, rotation, handleMainAction]);
  
  // Extract the event handlers and wrap them for React events
  const { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, onMouseMove } = longPressHandlers;
  
  // Wrapper functions to convert React events to native events
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => onMouseDown(e.nativeEvent);
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => onMouseUp(e.nativeEvent);
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => onMouseMove(e.nativeEvent);
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => onMouseLeave(e.nativeEvent);
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => onTouchStart(e.nativeEvent);
  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => onTouchEnd(e.nativeEvent);
  const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => onMouseMove(e.nativeEvent);
  
  const speedDialActions: FABAction[] = [
    {
      icon: <MessageSquarePlus className="h-5 w-5" />,
      label: 'New Chat',
      onClick: () => {
        haptic.trigger('selection');
        setIsExpanded(false);
        rotation.set(0);
        onNewConversation();
      },
      color: 'bg-blue-500',
    },
    ...(onVoiceChat ? [{
      icon: <Mic className="h-5 w-5" />,
      label: 'Voice Chat',
      onClick: () => {
        haptic.trigger('selection');
        setIsExpanded(false);
        rotation.set(0);
        onVoiceChat();
      },
      color: 'bg-green-500',
    }] : []),
    ...(onImportDocument ? [{
      icon: <FileText className="h-5 w-5" />,
      label: 'Import Document',
      onClick: () => {
        haptic.trigger('selection');
        setIsExpanded(false);
        rotation.set(0);
        onImportDocument();
      },
      color: 'bg-purple-500',
    }] : []),
  ];
  
  // Platform-specific styles
  const getPlatformStyles = () => {
    switch (platform) {
      case 'ios':
        return cn(
          'bg-white/90 backdrop-blur-xl backdrop-saturate-150',
          'shadow-lg shadow-black/10',
          'border border-gray-200/50'
        );
      case 'android':
        return cn(
          'bg-blue-600 shadow-xl',
          'elevation-6' // Material Design elevation
        );
      default:
        return cn(
          'bg-blue-600 shadow-lg hover:shadow-xl hover:bg-blue-700',
          'transition-all duration-200'
        );
    }
  };
  
  const buttonSize = platform === 'desktop' ? 48 : 56;
  
  return (
    <>
      {/* Speed dial backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setIsExpanded(false);
              rotation.set(0);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Speed dial actions */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">
            {speedDialActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: {
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  y: 20,
                  transition: {
                    delay: (speedDialActions.length - index - 1) * 0.05,
                  }
                }}
                className="flex items-center gap-3"
              >
                <motion.span 
                  className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  {action.label}
                </motion.span>
                <button
                  onClick={action.onClick}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "text-white shadow-lg",
                    "active:scale-90 transition-transform duration-150",
                    action.color || 'bg-primary'
                  )}
                >
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Main FAB */}
      <motion.div
        className={cn(
          "relative",
          className
        )}
        initial={false}
        animate={{ 
          scale: hide ? 0 : 1, 
          opacity: hide ? 0 : 1,
          y: hide ? 100 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 25,
        }}
      >
        <motion.button
          ref={buttonRef}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          disabled={disabled}
          style={{ 
            scale,
            width: buttonSize,
            height: buttonSize,
          }}
          className={cn(
            "relative rounded-full flex items-center justify-center",
            "touch-manipulation select-none",
            "active:outline-none focus:outline-none",
            getPlatformStyles(),
            disabled && "opacity-50 cursor-not-allowed",
            isExpanded && "z-50"
          )}
          onPointerDown={(e) => {
            if (!disabled) {
              const rect = buttonRef.current?.getBoundingClientRect();
              if (rect) {
                setRipplePosition({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }
              setIsPressed(true);
              scale.set(0.9);
            }
          }}
          onPointerUp={() => {
            setIsPressed(false);
            if (!isExpanded) {
              scale.set(1);
            }
          }}
          onPointerLeave={() => {
            setIsPressed(false);
            if (!isExpanded) {
              scale.set(1);
            }
          }}
        >
          {/* Ripple effect for Android */}
          {platform === 'android' && showRipple && (
            <motion.div
              className="absolute rounded-full bg-white/30"
              initial={{ width: 0, height: 0 }}
              animate={{ width: buttonSize * 2, height: buttonSize * 2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                left: ripplePosition.x,
                top: ripplePosition.y,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          
          {/* Icon with rotation */}
          <motion.div
            style={{ rotate: rotation }}
            className={cn(
              platform === 'ios' ? 'text-blue-600' : 'text-white'
            )}
          >
            {isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            )}
          </motion.div>
          
          {/* iOS-style pressed overlay */}
          {platform === 'ios' && isPressed && (
            <div className="absolute inset-0 rounded-full bg-black/10" />
          )}
        </motion.button>
      </motion.div>
    </>
  );
}