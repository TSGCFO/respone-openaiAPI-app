import { useEffect, useRef, useState, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeOptions {
  threshold?: number;
  preventScroll?: boolean;
  trackMouse?: boolean;
  onSwipeStart?: () => void;
  onSwipeMove?: (deltaX: number, deltaY: number, velocity: number) => void;
  onSwipeEnd?: (direction: SwipeDirection, velocity: number) => void;
}

interface SwipeState {
  isSwping: boolean;
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement>,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    preventScroll = false,
    trackMouse = false, // Changed default to false to prevent interference with clicks
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
  } = options;

  const [state, setState] = useState<SwipeState>({
    isSwping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isTouch = useRef(false);
  const isDragging = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number, touch: boolean, event?: Event) => {
    // Don't start swipe if the event is from a button, input, or other interactive element
    const target = event?.target as HTMLElement;
    if (target && (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea')
    )) {
      return;
    }

    startX.current = clientX;
    startY.current = clientY;
    startTime.current = Date.now();
    isTouch.current = touch;
    isDragging.current = true;
    
    setState({
      isSwping: true,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    });
    
    onSwipeStart?.();
  }, [onSwipeStart]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!startTime.current || !isDragging.current) return;
    
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime || 1);
    
    let direction: SwipeDirection = null;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Only detect swipe if movement is significant
    if (absX > 10 || absY > 10) {
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }
    
    setState({
      isSwping: true,
      direction,
      deltaX,
      deltaY,
      velocity,
    });
    
    onSwipeMove?.(deltaX, deltaY, velocity);
    
    if (preventScroll && isTouch.current && (absX > 5 || absY > 5)) {
      return false;
    }
  }, [preventScroll, onSwipeMove]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const deltaTime = Date.now() - startTime.current;
    const velocity = state.velocity;
    
    // Apply threshold check based on the dominant axis
    let thresholdMet = false;
    if (state.direction === 'left' || state.direction === 'right') {
      // For horizontal swipes, check deltaX threshold
      thresholdMet = Math.abs(state.deltaX) > threshold;
    } else if (state.direction === 'up' || state.direction === 'down') {
      // For vertical swipes, check deltaY threshold
      thresholdMet = Math.abs(state.deltaY) > threshold;
    }
    
    if (state.direction && thresholdMet && deltaTime < 1000) {
      onSwipeEnd?.(state.direction, velocity);
    }
    
    setState({
      isSwping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    });
    
    startX.current = 0;
    startY.current = 0;
    startTime.current = 0;
    isDragging.current = false;
  }, [state.direction, state.deltaX, state.deltaY, state.velocity, threshold, onSwipeEnd]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, true, e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const shouldPrevent = handleMove(touch.clientX, touch.clientY);
      if (shouldPrevent === false && preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    const handleTouchCancel = () => {
      handleEnd();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!trackMouse) return;
      // Prevent drag selection
      e.preventDefault();
      handleStart(e.clientX, e.clientY, false, e);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackMouse || !isDragging.current) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!trackMouse) return;
      handleEnd();
    };

    const handleMouseLeave = () => {
      if (!trackMouse || !isDragging.current) return;
      handleEnd();
    };

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);
    
    // Mouse events - only on the element itself, not document
    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      
      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [ref, preventScroll, trackMouse, threshold, handleStart, handleMove, handleEnd]);

  return state;
}