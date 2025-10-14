import { useCallback, useEffect, useRef, useState } from 'react';
import { useEnhancedSwipe } from './useEnhancedSwipe';
import haptic from '@/lib/haptic';

interface ConversationSwipeOptions {
  currentConversationId?: number;
  conversationList: Array<{ id: number; title: string }>;
  onSwipeToConversation: (conversationId: number) => void;
  enabled?: boolean;
}

interface ConversationSwipeState {
  isTransitioning: boolean;
  targetConversationId: number | null;
  swipeProgress: number;
  direction: 'left' | 'right' | null;
  nextConversation: { id: number; title: string } | null;
  previousConversation: { id: number; title: string } | null;
  transformStyle: React.CSSProperties;
}

export function useConversationSwipe(
  containerRef: React.RefObject<HTMLElement>,
  options: ConversationSwipeOptions
) {
  const {
    currentConversationId,
    conversationList = [],
    onSwipeToConversation,
    enabled = true,
  } = options;

  // Safe window width getter
  const getWindowWidth = useCallback(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 375;
  }, []);

  const [state, setState] = useState<ConversationSwipeState>({
    isTransitioning: false,
    targetConversationId: null,
    swipeProgress: 0,
    direction: null,
    nextConversation: null,
    previousConversation: null,
    transformStyle: {},
  });

  const animationFrameRef = useRef<number>();
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // Find adjacent conversations
  const findAdjacentConversations = useCallback(() => {
    if (!currentConversationId || conversationList.length === 0) {
      return { next: null, previous: null };
    }

    const currentIndex = conversationList.findIndex(c => c.id === currentConversationId);
    if (currentIndex === -1) {
      return { next: null, previous: null };
    }

    const next = currentIndex > 0 ? conversationList[currentIndex - 1] : null; // Newer
    const previous = currentIndex < conversationList.length - 1 ? conversationList[currentIndex + 1] : null; // Older

    return { next, previous };
  }, [currentConversationId, conversationList]);

  // Update adjacent conversations when list changes
  useEffect(() => {
    const { next, previous } = findAdjacentConversations();
    setState(prev => ({
      ...prev,
      nextConversation: next,
      previousConversation: previous,
    }));
  }, [findAdjacentConversations]);

  // Spring animation helper
  const animateToValue = useCallback((
    targetValue: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) => {
    let currentValue = 0;
    const tension = 0.04;
    const friction = 0.15;
    let velocity = 0;
    
    const animate = () => {
      const springForce = (targetValue - currentValue) * tension;
      velocity = (velocity + springForce) * (1 - friction);
      currentValue += velocity;
      
      if (Math.abs(velocity) < 0.001 && Math.abs(targetValue - currentValue) < 0.001) {
        onUpdate(targetValue);
        onComplete?.();
        return;
      }
      
      onUpdate(currentValue);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  // Swipe handlers
  const handleSwipeMove = useCallback((deltaX: number, deltaY: number, velocity: number, progress: number) => {
    if (!enabled || Math.abs(deltaY) > Math.abs(deltaX)) return;

    const direction = deltaX > 0 ? 'right' : 'left';
    const { next, previous } = findAdjacentConversations();
    
    // Check if swipe is possible in this direction
    const canSwipe = (direction === 'left' && next) || (direction === 'right' && previous);
    if (!canSwipe) {
      // Apply resistance when can't swipe
      const resistance = 0.3;
      deltaX *= resistance;
    }

    // Create parallax effect
    const windowWidth = getWindowWidth();
    const translateX = deltaX * 0.8;
    const scale = 1 - Math.abs(deltaX) / windowWidth * 0.05;
    const opacity = 1 - Math.abs(deltaX) / windowWidth * 0.3;
    const rotateY = deltaX / windowWidth * 5; // Subtle 3D rotation

    setState(prev => ({
      ...prev,
      direction,
      swipeProgress: progress,
      transformStyle: {
        transform: `translate3d(${translateX}px, 0, 0) scale(${scale}) rotateY(${rotateY}deg)`,
        opacity,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transition: 'none',
        willChange: 'transform',
      },
    }));
  }, [enabled, findAdjacentConversations]);

  const handleSwipeEnd = useCallback((direction: 'left' | 'right' | null, velocity: number, deltaX: number) => {
    if (!enabled || !direction) {
      // Spring back to original position
      animateToValue(0, (value) => {
        setState(prev => ({
          ...prev,
          transformStyle: {
            transform: `translate3d(${value}px, 0, 0)`,
            opacity: 1,
            transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
          },
        }));
      });
      return;
    }

    const { next, previous } = findAdjacentConversations();
    const windowWidth = getWindowWidth();
    const threshold = windowWidth * 0.3;
    const velocityThreshold = 0.5;
    
    // Determine if should switch conversation
    const shouldSwitch = 
      Math.abs(deltaX) > threshold || 
      velocity > velocityThreshold;
    
    let targetConversation = null;
    
    if (shouldSwitch) {
      if (direction === 'left' && next) {
        targetConversation = next;
      } else if (direction === 'right' && previous) {
        targetConversation = previous;
      }
    }

    if (targetConversation) {
      // Animate out and switch
      const targetX = direction === 'left' ? -windowWidth : windowWidth;
      
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        targetConversationId: targetConversation.id,
        transformStyle: {
          transform: `translate3d(${targetX}px, 0, 0) scale(0.95)`,
          opacity: 0,
          transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        },
      }));

      haptic.trigger('medium');
      
      // Trigger conversation change after animation
      transitionTimeoutRef.current = setTimeout(() => {
        onSwipeToConversation(targetConversation.id);
        
        // Reset transform after switching
        setState(prev => ({
          ...prev,
          isTransitioning: false,
          targetConversationId: null,
          direction: null,
          swipeProgress: 0,
          transformStyle: {},
        }));
      }, 300);
    } else {
      // Spring back to center
      setState(prev => ({
        ...prev,
        transformStyle: {
          transform: 'translate3d(0, 0, 0)',
          opacity: 1,
          transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        },
      }));
      
      // Reset after animation
      transitionTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          direction: null,
          swipeProgress: 0,
          transformStyle: {},
        }));
      }, 300);
    }
  }, [enabled, findAdjacentConversations, animateToValue, onSwipeToConversation]);

  const handleSwipeCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      transformStyle: {
        transform: 'translate3d(0, 0, 0)',
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      direction: null,
      swipeProgress: 0,
    }));
  }, []);

  // Use enhanced swipe hook with safe default for SSR
  const swipeState = useEnhancedSwipe(containerRef, {
    threshold: typeof window !== 'undefined' ? window.innerWidth * 0.3 : 112.5, // Default to 375 * 0.3
    velocityThreshold: 0.5,
    enableEdgeSwipe: true,
    edgeThreshold: 30,
    rubberBandEffect: true,
    onSwipeMove: handleSwipeMove,
    onSwipeEnd: (direction, velocity, deltaX, deltaY) => {
      if (direction === 'left' || direction === 'right') {
        handleSwipeEnd(direction, velocity, deltaX);
      }
    },
    onSwipeCancel: handleSwipeCancel,
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Create edge indicators
  const getEdgeIndicatorStyle = useCallback((): React.CSSProperties => {
    if (!state.direction || state.swipeProgress === 0) {
      return { opacity: 0 };
    }

    const side = state.direction === 'left' ? 'right' : 'left';
    const opacity = Math.min(state.swipeProgress * 0.5, 0.3);
    
    return {
      position: 'absolute',
      top: 0,
      [side]: 0,
      bottom: 0,
      width: '20px',
      background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(0, 122, 255, ${opacity}), transparent)`,
      pointerEvents: 'none',
      zIndex: 100,
      transition: 'opacity 0.2s',
    };
  }, [state.direction, state.swipeProgress]);

  // Peek preview styles
  const getPeekPreviewStyle = useCallback((): React.CSSProperties => {
    if (!state.direction || state.swipeProgress === 0) {
      return { display: 'none' };
    }

    const conversation = state.direction === 'left' 
      ? state.nextConversation 
      : state.previousConversation;
      
    if (!conversation) {
      return { display: 'none' };
    }

    const windowWidth = getWindowWidth();
    const offset = state.direction === 'left' 
      ? windowWidth * (1 - state.swipeProgress * 0.3)
      : -windowWidth * (1 - state.swipeProgress * 0.3);

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      transform: `translate3d(${offset}px, 0, 0)`,
      opacity: state.swipeProgress * 0.5,
      zIndex: -1,
      pointerEvents: 'none',
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: '#666',
      fontWeight: '500',
      transition: swipeState.isSwiping ? 'none' : 'all 0.3s',
    };
  }, [state, swipeState.isSwiping]);

  return {
    ...state,
    isSwping: swipeState.isSwiping,
    edgeIndicatorStyle: getEdgeIndicatorStyle(),
    peekPreviewStyle: getPeekPreviewStyle(),
    canSwipeLeft: !!state.nextConversation,
    canSwipeRight: !!state.previousConversation,
  };
}