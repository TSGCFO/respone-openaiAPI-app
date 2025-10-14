import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  threshold?: number;
  onStart?: (event: TouchEvent | MouseEvent) => void;
  onFinish?: (event?: TouchEvent | MouseEvent) => void;
  onCancel?: () => void;
}

export function useLongPress(
  callback: (event: TouchEvent | MouseEvent) => void,
  options: LongPressOptions = {}
) {
  const { 
    threshold = 500, 
    onStart, 
    onFinish, 
    onCancel 
  } = options;
  
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const targetRef = useRef<EventTarget | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const start = useCallback((event: TouchEvent | MouseEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    startPosRef.current = { x: clientX, y: clientY };
    targetRef.current = event.target;
    
    onStart?.(event);
    
    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      callback(event);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, threshold);
  }, [callback, threshold, onStart]);

  const clear = useCallback((event?: TouchEvent | MouseEvent, shouldTriggerFinish = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    if (isLongPressing && shouldTriggerFinish) {
      onFinish?.(event);
    } else if (!isLongPressing) {
      onCancel?.();
    }
    
    setIsLongPressing(false);
    targetRef.current = null;
  }, [isLongPressing, onFinish, onCancel]);

  const move = useCallback((event: TouchEvent | MouseEvent) => {
    if (!startPosRef.current) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const moveThreshold = 10;
    
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clear(undefined, false);
    }
  }, [clear]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseMove: move,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
  };
  
  return {
    handlers,
    isLongPressing,
  };
}