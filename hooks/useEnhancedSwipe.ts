import { useEffect, useRef, useState, useCallback } from 'react';
import haptic from '@/lib/haptic';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
  trackMouse?: boolean;
  enableEdgeSwipe?: boolean;
  edgeThreshold?: number;
  rubberBandEffect?: boolean;
  springConfig?: {
    tension?: number;
    friction?: number;
  };
  onSwipeStart?: (startX: number, startY: number) => void;
  onSwipeMove?: (deltaX: number, deltaY: number, velocity: number, progress: number) => void;
  onSwipeEnd?: (direction: SwipeDirection, velocity: number, deltaX: number, deltaY: number) => void;
  onSwipeCancel?: () => void;
}

interface SwipeState {
  isSwiping: boolean;
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  velocity: number;
  progress: number;
  startX: number;
  startY: number;
  isEdgeSwipe: boolean;
}

export function useEnhancedSwipe(
  ref: React.RefObject<HTMLElement>,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
    trackMouse = false,
    enableEdgeSwipe = false,
    edgeThreshold = 30,
    rubberBandEffect = true,
    springConfig = { tension: 200, friction: 25 },
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    onSwipeCancel,
  } = options;

  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    progress: 0,
    startX: 0,
    startY: 0,
    isEdgeSwipe: false,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const isDragging = useRef(false);
  const rafId = useRef<number>();
  const velocities = useRef<number[]>([]);

  // Calculate weighted average velocity for smoother detection
  const calculateVelocity = useCallback(() => {
    if (velocities.current.length === 0) return 0;
    const weights = velocities.current.map((_, i) => Math.pow(0.7, velocities.current.length - i - 1));
    const weightedSum = velocities.current.reduce((sum, v, i) => sum + v * weights[i], 0);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    return weightedSum / weightSum;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number, event?: Event) => {
    // Check if it's an interactive element
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

    const isFromEdge = enableEdgeSwipe && (
      clientX < edgeThreshold || 
      (window.innerWidth - clientX) < edgeThreshold
    );

    startX.current = clientX;
    startY.current = clientY;
    lastX.current = clientX;
    lastY.current = clientY;
    startTime.current = Date.now();
    lastTime.current = Date.now();
    isDragging.current = true;
    velocities.current = [];
    
    setState({
      isSwiping: true,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      progress: 0,
      startX: clientX,
      startY: clientY,
      isEdgeSwipe: isFromEdge,
    });
    
    onSwipeStart?.(clientX, clientY);
    
    if (isFromEdge) {
      haptic.trigger('light');
    }
  }, [enableEdgeSwipe, edgeThreshold, onSwipeStart]);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime.current;
    
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const instantDeltaX = clientX - lastX.current;
    const instantDeltaY = clientY - lastY.current;
    
    // Calculate instant velocity
    if (deltaTime > 0) {
      const instantVelocity = Math.sqrt(instantDeltaX * instantDeltaX + instantDeltaY * instantDeltaY) / deltaTime;
      velocities.current.push(instantVelocity);
      // Keep only last 5 velocity samples
      if (velocities.current.length > 5) {
        velocities.current.shift();
      }
    }
    
    lastX.current = clientX;
    lastY.current = clientY;
    lastTime.current = currentTime;
    
    const velocity = calculateVelocity();
    
    // Apply rubber band effect if enabled
    let adjustedDeltaX = deltaX;
    let adjustedDeltaY = deltaY;
    
    if (rubberBandEffect) {
      const maxDelta = window.innerWidth / 2;
      const resistance = 0.55;
      
      if (Math.abs(deltaX) > maxDelta) {
        const overflow = Math.abs(deltaX) - maxDelta;
        const resistedOverflow = Math.pow(overflow, resistance);
        adjustedDeltaX = Math.sign(deltaX) * (maxDelta + resistedOverflow);
      }
    }
    
    let direction: SwipeDirection = null;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > 10 || absY > 10) {
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }
    
    // Calculate progress (0-1) based on threshold
    const progress = Math.min(1, Math.max(Math.abs(adjustedDeltaX), Math.abs(adjustedDeltaY)) / threshold);
    
    setState(prev => ({
      ...prev,
      direction,
      deltaX: adjustedDeltaX,
      deltaY: adjustedDeltaY,
      velocity,
      progress,
    }));
    
    onSwipeMove?.(adjustedDeltaX, adjustedDeltaY, velocity, progress);
    
    // Prevent scrolling if needed
    if (preventScroll && (absX > 5 || absY > 5)) {
      return false;
    }
  }, [calculateVelocity, rubberBandEffect, threshold, preventScroll, onSwipeMove]);

  const handleMove = useCallback((clientX: number, clientY: number, event?: Event) => {
    if (!isDragging.current) return;
    
    // Use requestAnimationFrame for smoother updates
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      updatePosition(clientX, clientY);
    });
    
    // Prevent default if needed
    if (preventScroll && event) {
      event.preventDefault();
    }
  }, [updatePosition, preventScroll]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    const finalVelocity = calculateVelocity();
    const deltaTime = Date.now() - startTime.current;
    
    // Check if swipe meets threshold criteria
    const meetsDistanceThreshold = (
      (state.direction === 'left' || state.direction === 'right') && 
      Math.abs(state.deltaX) > threshold
    ) || (
      (state.direction === 'up' || state.direction === 'down') && 
      Math.abs(state.deltaY) > threshold
    );
    
    const meetsVelocityThreshold = finalVelocity > velocityThreshold;
    const isQuickSwipe = deltaTime < 300 && finalVelocity > 0.5;
    
    if (state.direction && (meetsDistanceThreshold || meetsVelocityThreshold || isQuickSwipe)) {
      // Successful swipe
      onSwipeEnd?.(state.direction, finalVelocity, state.deltaX, state.deltaY);
      
      // Haptic feedback based on swipe strength
      if (finalVelocity > 1) {
        haptic.trigger('heavy');
      } else if (finalVelocity > 0.5) {
        haptic.trigger('medium');
      } else {
        haptic.trigger('light');
      }
    } else {
      // Cancelled swipe
      onSwipeCancel?.();
    }
    
    // Reset state
    setState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      progress: 0,
      startX: 0,
      startY: 0,
      isEdgeSwipe: false,
    });
    
    isDragging.current = false;
    velocities.current = [];
  }, [state.direction, state.deltaX, state.deltaY, threshold, velocityThreshold, calculateVelocity, onSwipeEnd, onSwipeCancel]);

  // Touch event handlers
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, e);
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    const handleTouchCancel = () => {
      onSwipeCancel?.();
      setState({
        isSwiping: false,
        direction: null,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
        progress: 0,
        startX: 0,
        startY: 0,
        isEdgeSwipe: false,
      });
      isDragging.current = false;
    };

    // Mouse event handlers (optional)
    const handleMouseDown = (e: MouseEvent) => {
      if (!trackMouse) return;
      e.preventDefault();
      handleStart(e.clientX, e.clientY, e);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackMouse || !isDragging.current) return;
      handleMove(e.clientX, e.clientY, e);
    };

    const handleMouseUp = () => {
      if (!trackMouse || !isDragging.current) return;
      handleEnd();
    };

    const handleMouseLeave = () => {
      if (!trackMouse || !isDragging.current) return;
      handleEnd();
    };

    // Add passive flag for better performance
    const passiveOptions = { passive: !preventScroll };
    
    element.addEventListener('touchstart', handleTouchStart, passiveOptions);
    element.addEventListener('touchmove', handleTouchMove, passiveOptions);
    element.addEventListener('touchend', handleTouchEnd, passiveOptions);
    element.addEventListener('touchcancel', handleTouchCancel, passiveOptions);

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

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleStart, handleMove, handleEnd, trackMouse, preventScroll, onSwipeCancel]);

  return state;
}