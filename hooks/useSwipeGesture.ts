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
    trackMouse = true,
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

  const handleStart = useCallback((clientX: number, clientY: number, touch: boolean) => {
    startX.current = clientX;
    startY.current = clientY;
    startTime.current = Date.now();
    isTouch.current = touch;
    
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
    if (!startTime.current) return;
    
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime || 1);
    
    let direction: SwipeDirection = null;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > threshold || absY > threshold) {
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
    
    if (preventScroll && isTouch.current) {
      return false;
    }
  }, [threshold, preventScroll, onSwipeMove]);

  const handleEnd = useCallback(() => {
    const deltaTime = Date.now() - startTime.current;
    const velocity = state.velocity;
    
    if (state.direction && deltaTime < 1000) {
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
  }, [state.direction, state.velocity, onSwipeEnd]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const shouldPrevent = handleMove(touch.clientX, touch.clientY);
      if (shouldPrevent === false && preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!trackMouse) return;
      handleStart(e.clientX, e.clientY, false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackMouse || !startTime.current) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!trackMouse) return;
      handleEnd();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);
    
    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [ref, preventScroll, trackMouse, handleStart, handleMove, handleEnd]);

  return state;
}