import { useEffect, useRef, useState, useCallback } from 'react';

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
  options: PullToRefreshOptions = {}
) {
  const {
    threshold = 80,
    maxPull = 150,
    refreshTimeout = 2000,
    onRefresh
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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    touchingRef.current = true;
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
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
        distance * 0.5,
        maxPull
      );
      
      const easeOut = 1 - Math.pow((pullDistance / maxPull), 2);
      const easedDistance = pullDistance * easeOut;
      
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: easedDistance,
        canRefresh: easedDistance >= threshold,
      }));
    }
  }, [maxPull, threshold, containerRef]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchingRef.current) return;
    
    touchingRef.current = false;
    
    if (state.canRefresh && !state.isRefreshing) {
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
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
      });
    }
  }, [state.canRefresh, state.isRefreshing, threshold, onRefresh, refreshTimeout]);

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

  return state;
}