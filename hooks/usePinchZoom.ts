import { useEffect, useRef, useState, useCallback } from 'react';

interface PinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  doubleTapZoom?: number;
}

interface PinchZoomState {
  scale: number;
  isZooming: boolean;
  x: number;
  y: number;
}

export function usePinchZoom(
  ref: React.RefObject<HTMLElement>,
  options: PinchZoomOptions = {}
) {
  const {
    minScale = 1,
    maxScale = 4,
    initialScale = 1,
    doubleTapZoom = 2,
  } = options;

  const [state, setState] = useState<PinchZoomState>({
    scale: initialScale,
    isZooming: false,
    x: 0,
    y: 0,
  });

  const lastDistance = useRef(0);
  const lastScale = useRef(initialScale);
  const lastTap = useRef(0);
  const centerX = useRef(0);
  const centerY = useRef(0);

  const getDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastDistance.current = getDistance(e.touches);
      const center = getCenter(e.touches);
      centerX.current = center.x;
      centerY.current = center.y;
      lastScale.current = state.scale;
      setState(prev => ({ ...prev, isZooming: true }));
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        e.preventDefault();
        const newScale = state.scale === minScale ? doubleTapZoom : minScale;
        setState(prev => ({
          ...prev,
          scale: newScale,
          x: 0,
          y: 0,
        }));
      }
      lastTap.current = now;
    }
  }, [getDistance, getCenter, state.scale, minScale, doubleTapZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastDistance.current > 0) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const scale = (distance / lastDistance.current) * lastScale.current;
      const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
      
      const center = getCenter(e.touches);
      const deltaX = center.x - centerX.current;
      const deltaY = center.y - centerY.current;
      
      setState(prev => ({
        ...prev,
        scale: clampedScale,
        x: deltaX,
        y: deltaY,
      }));
    }
  }, [getDistance, getCenter, minScale, maxScale]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      lastDistance.current = 0;
      setState(prev => ({ ...prev, isZooming: false }));
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = state.scale * delta;
    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    
    setState(prev => ({
      ...prev,
      scale: clampedScale,
    }));
  }, [state.scale, minScale, maxScale]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [ref, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  const reset = useCallback(() => {
    setState({
      scale: initialScale,
      isZooming: false,
      x: 0,
      y: 0,
    });
  }, [initialScale]);

  return { ...state, reset };
}