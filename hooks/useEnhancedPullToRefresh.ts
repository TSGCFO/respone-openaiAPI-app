import { useEffect, useRef, useState, useCallback } from 'react';
import haptic from '@/lib/haptic';

interface PullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
  refreshTimeout?: number;
  resistance?: number;
  rubberBandEffect?: boolean;
  springConfig?: {
    tension?: number;
    friction?: number;
  };
  onRefresh?: () => Promise<void> | void;
  onPullStart?: () => void;
  onPullMove?: (distance: number, progress: number) => void;
  onPullEnd?: () => void;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number;
  canRefresh: boolean;
  opacity: number;
  rotation: number;
}

export function useEnhancedPullToRefresh(
  containerRef: React.RefObject<HTMLElement>,
  options: PullToRefreshOptions = {}
) {
  const {
    threshold = 80,
    maxPull = 150,
    refreshTimeout = 3000,
    resistance = 2.5,
    rubberBandEffect = true,
    springConfig = { tension: 200, friction: 25 },
    onRefresh,
    onPullStart,
    onPullMove,
    onPullEnd,
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    pullProgress: 0,
    canRefresh: false,
    opacity: 0,
    rotation: 0,
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const touchingRef = useRef(false);
  const rafId = useRef<number>();
  const lastHaptic = useRef<'none' | 'light' | 'medium' | 'heavy'>('none');

  const calculatePullValues = useCallback((distance: number) => {
    // Apply rubber band effect
    let adjustedDistance = distance;
    if (rubberBandEffect && distance > 0) {
      // Exponential decay for rubber band effect
      const resistance = 1 - Math.exp(-distance / (maxPull * 0.5));
      adjustedDistance = maxPull * resistance;
    } else {
      adjustedDistance = Math.min(distance / resistance, maxPull);
    }

    // Calculate progress (0-1) and beyond for over-pull
    const progress = adjustedDistance / threshold;
    
    // Calculate opacity based on progress
    const opacity = Math.min(1, progress);
    
    // Calculate rotation for spinner animation
    const rotation = progress * 360;
    
    // Can refresh when progress >= 1
    const canRefresh = progress >= 1;
    
    return { adjustedDistance, progress, opacity, rotation, canRefresh };
  }, [threshold, maxPull, resistance, rubberBandEffect]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    touchingRef.current = true;
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    onPullStart?.();
  }, [containerRef, onPullStart]);

  const updatePull = useCallback((clientY: number) => {
    if (!touchingRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    currentY.current = clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0 && container.scrollTop === 0) {
      const { adjustedDistance, progress, opacity, rotation, canRefresh } = 
        calculatePullValues(distance);
      
      setState(prev => {
        // Haptic feedback at thresholds
        if (!prev.canRefresh && canRefresh) {
          haptic.trigger('medium');
          lastHaptic.current = 'medium';
        } else if (prev.canRefresh && !canRefresh && lastHaptic.current === 'medium') {
          haptic.trigger('light');
          lastHaptic.current = 'light';
        }
        
        // Additional haptic at 50% threshold
        if (progress >= 0.5 && progress < 0.6 && lastHaptic.current === 'none') {
          haptic.trigger('light');
          lastHaptic.current = 'light';
        }
        
        return {
          ...prev,
          isPulling: true,
          pullDistance: adjustedDistance,
          pullProgress: progress,
          canRefresh,
          opacity,
          rotation,
        };
      });
      
      onPullMove?.(adjustedDistance, progress);
    } else if (distance <= 0 && touchingRef.current) {
      // Reset if scrolling up
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        pullProgress: 0,
        canRefresh: false,
        opacity: 0,
        rotation: 0,
      }));
      lastHaptic.current = 'none';
    }
  }, [calculatePullValues, onPullMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchingRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const touch = e.touches[0];
    
    // Use requestAnimationFrame for smooth updates
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      updatePull(touch.clientY);
    });
    
    // Prevent scrolling when pulling
    const distance = touch.clientY - startY.current;
    if (distance > 0 && container.scrollTop === 0) {
      e.preventDefault();
    }
  }, [updatePull]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchingRef.current) return;
    
    touchingRef.current = false;
    onPullEnd?.();
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    if (state.canRefresh && !state.isRefreshing) {
      // Start refreshing
      haptic.trigger('success');
      
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold, // Keep indicator visible at threshold
        pullProgress: 1,
        opacity: 1,
      }));
      
      try {
        if (onRefresh) {
          // Add minimum refresh time for better UX
          const startTime = Date.now();
          await onRefresh();
          const elapsed = Date.now() - startTime;
          const minTime = 600; // Minimum 600ms for refresh animation
          
          if (elapsed < minTime) {
            await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
          }
        } else {
          // Default refresh simulation
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        haptic.trigger('error');
      } finally {
        // Animate back to zero
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          pullProgress: 0,
          canRefresh: false,
          opacity: 0,
          rotation: 0,
        });
        lastHaptic.current = 'none';
      }
    } else {
      // Spring back animation
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        pullProgress: 0,
        canRefresh: false,
        opacity: 0,
        rotation: 0,
      });
      lastHaptic.current = 'none';
    }
  }, [state.canRefresh, state.isRefreshing, threshold, onRefresh, onPullEnd]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Provide a manual refresh trigger
  const refresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState(prev => ({
      ...prev,
      isRefreshing: true,
      pullDistance: threshold,
      pullProgress: 1,
      opacity: 1,
      rotation: 0,
    }));
    
    haptic.trigger('success');
    
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        pullProgress: 0,
        canRefresh: false,
        opacity: 0,
        rotation: 0,
      });
    }
  }, [state.isRefreshing, threshold, onRefresh]);

  return {
    ...state,
    refresh,
  };
}