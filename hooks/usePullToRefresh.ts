import { useEffect, useRef, useState, useCallback } from 'react';
import { haptics } from '@/lib/haptic';

interface PullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
  refreshTimeout?: number;
  onRefresh?: () => Promise<void> | void;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh(
  containerRef: React.RefObject<HTMLElement>,
  onRefresh?: () => Promise<void> | void,
  options: Partial<{
    threshold: number;
    maxPull: number;
    refreshTimeout: number;
    resistance: number;
  }> = {}
) {
  const {
    threshold = 80,
    maxPull = 150,
    refreshTimeout = 2000,
    resistance = 2.5
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const touchingRef = useRef(false);
  const hapticTriggeredRef = useRef<{ halfway: boolean; threshold: boolean }>({
    halfway: false,
    threshold: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    touchingRef.current = true;
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    
    // Reset haptic triggers
    hapticTriggeredRef.current = { halfway: false, threshold: false };
  }, [containerRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchingRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0 && container.scrollTop === 0) {
      e.preventDefault();
      
      const pullDistance = Math.min(
        distance / resistance,
        maxPull
      );
      
      const easeOut = 1 - Math.pow((pullDistance / maxPull), 2);
      const easedDistance = pullDistance * easeOut;
      
      // Haptic feedback at 50% threshold
      if (easedDistance >= threshold * 0.5 && !hapticTriggeredRef.current.halfway) {
        haptics.pull();
        hapticTriggeredRef.current.halfway = true;
      }
      
      // Stronger haptic when reaching refresh threshold
      if (easedDistance >= threshold && !hapticTriggeredRef.current.threshold) {
        haptics.release();
        hapticTriggeredRef.current.threshold = true;
      }
      
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: easedDistance,
        canRefresh: easedDistance >= threshold,
      }));
    }
  }, [maxPull, threshold, containerRef, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchingRef.current) return;
    
    touchingRef.current = false;
    
    if (state.canRefresh && !state.isRefreshing) {
      // Trigger refresh haptic
      haptics.refresh();
      
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        pullDistance: threshold,
      }));
      
      try {
        if (onRefresh) {
          await Promise.race([
            onRefresh(),
            new Promise(resolve => setTimeout(resolve, refreshTimeout))
          ]);
        }
        // Success haptic after refresh completes
        haptics.success();
      } catch (error) {
        // Error haptic if refresh fails
        haptics.error();
        console.error('Refresh failed:', error);
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    } else {
      // Light haptic for cancelled pull
      if (state.pullDistance > 20) {
        haptics.light();
      }
      
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
      });
    }
    
    // Reset haptic triggers
    hapticTriggeredRef.current = { halfway: false, threshold: false };
  }, [state.canRefresh, state.isRefreshing, state.pullDistance, threshold, onRefresh, refreshTimeout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...state,
    isRefreshing: state.isRefreshing,
    pullIndicatorOffset: state.pullDistance,
    pullIndicatorOpacity: state.pullDistance > 0 ? Math.min(state.pullDistance / threshold, 1) : 0
  };
}