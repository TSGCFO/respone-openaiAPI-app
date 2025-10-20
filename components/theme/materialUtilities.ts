import { materialMotion, materialYouColors } from './materialYouTheme';

// Haptic feedback utilities for Android devices
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([1, 10, 1]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
  },
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20, 10, 20]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50]);
    }
  },
};

// Ripple effect configuration
export const createRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple-effect');

  // Add necessary styles
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = `ripple ${materialMotion.duration.medium2}ms ${materialMotion.easing.emphasized}`;
  ripple.style.backgroundColor = 'currentColor';
  ripple.style.opacity = '0.15';
  ripple.style.pointerEvents = 'none';

  target.style.position = 'relative';
  target.style.overflow = 'hidden';
  target.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, materialMotion.duration.medium2);
};

// Touch feedback utilities
export const touchFeedback = {
  onTouchStart: (element: HTMLElement) => {
    element.style.transform = 'scale(0.98)';
    element.style.transition = `transform ${materialMotion.duration.short2}ms ${materialMotion.easing.emphasizedDecelerate}`;
    hapticFeedback.light();
  },
  onTouchEnd: (element: HTMLElement) => {
    element.style.transform = 'scale(1)';
    element.style.transition = `transform ${materialMotion.duration.short3}ms ${materialMotion.easing.emphasizedAccelerate}`;
  },
};

// System bar configuration
export const configureSystemBars = (mode: 'light' | 'dark') => {
  const themeColor = mode === 'light' 
    ? materialYouColors.neutral[95]
    : materialYouColors.neutral[10];
  
  // Update theme color meta tag
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', themeColor);
  
  // Update status bar style for iOS
  let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaStatusBar) {
    metaStatusBar = document.createElement('meta');
    metaStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(metaStatusBar);
  }
  metaStatusBar.setAttribute('content', mode === 'light' ? 'default' : 'black-translucent');
  
  // Update viewport for proper mobile rendering
  let metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.setAttribute('name', 'viewport');
    document.head.appendChild(metaViewport);
  }
  metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover');
};

// Animation utilities
export const materialAnimations = {
  fadeIn: {
    from: { opacity: 0, transform: 'translateY(-10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    duration: materialMotion.duration.short4,
    easing: materialMotion.easing.emphasizedDecelerate,
  },
  fadeOut: {
    from: { opacity: 1, transform: 'translateY(0)' },
    to: { opacity: 0, transform: 'translateY(-10px)' },
    duration: materialMotion.duration.short3,
    easing: materialMotion.easing.emphasizedAccelerate,
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
    duration: materialMotion.duration.medium2,
    easing: materialMotion.easing.emphasized,
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
    duration: materialMotion.duration.medium2,
    easing: materialMotion.easing.emphasized,
  },
  slideInBottom: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
    duration: materialMotion.duration.medium2,
    easing: materialMotion.easing.emphasized,
  },
  expand: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: materialMotion.duration.medium1,
    easing: materialMotion.easing.emphasizedDecelerate,
  },
  collapse: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
    duration: materialMotion.duration.short4,
    easing: materialMotion.easing.emphasizedAccelerate,
  },
  bounceIn: {
    keyframes: [
      { transform: 'scale(0.95)', opacity: 0 },
      { transform: 'scale(1.02)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    duration: materialMotion.duration.medium2,
    easing: materialMotion.easing.emphasized,
  },
};

// Scroll behavior utilities
export const smoothScroll = {
  toTop: (duration = materialMotion.duration.medium2) => {
    const start = window.pageYOffset;
    const startTime = performance.now();
    
    const scroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic easing
      
      window.scrollTo(0, start * (1 - easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };
    
    requestAnimationFrame(scroll);
  },
  toElement: (element: HTMLElement) => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  },
};

// Pull-to-refresh configuration
export const pullToRefreshConfig = {
  threshold: 100, // pixels
  resistance: 2.5,
  restoreTime: materialMotion.duration.medium1,
  refreshTime: materialMotion.duration.long2,
};

// Swipe gesture configuration
export const swipeConfig = {
  threshold: 50, // pixels
  velocity: 0.5, // pixels per millisecond
  horizontalOnly: false,
  verticalOnly: false,
  preventScroll: true,
};

// Long press configuration
export const longPressConfig = {
  delay: 500, // milliseconds
  threshold: 10, // pixels of movement allowed
};

// Safe area padding helper
export const getSafeAreaPadding = () => {
  const computedStyle = getComputedStyle(document.documentElement);
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
  };
};

// Touch target size helper
export const ensureTouchTarget = (size = 48) => ({
  minWidth: size,
  minHeight: size,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// Elevation helper
export const getElevationStyle = (level: 0 | 1 | 2 | 3 | 4 | 5) => {
  const elevations = {
    0: 'none',
    1: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    2: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
    4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
    5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
  };
  return { boxShadow: elevations[level] };
};

// Export all utilities
export const materialUtilities = {
  hapticFeedback,
  createRippleEffect,
  touchFeedback,
  configureSystemBars,
  materialAnimations,
  smoothScroll,
  pullToRefreshConfig,
  swipeConfig,
  longPressConfig,
  getSafeAreaPadding,
  ensureTouchTarget,
  getElevationStyle,
};