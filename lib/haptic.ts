/**
 * Advanced haptic feedback utility for native app-like interactions
 * Provides sophisticated vibration patterns for enhanced user experience
 * Uses the Vibration API where available
 */

export type HapticFeedbackType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'selection' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'impact'
  | 'notification'
  | 'pull'
  | 'release'
  | 'refresh'
  | 'keypress'
  | 'toggle';

class HapticFeedback {
  private isSupported: boolean;
  private lastTriggerTime: number = 0;
  private minimumInterval: number = 50; // Minimum ms between haptics

  constructor() {
    // Check if Vibration API is supported
    this.isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Advanced vibration patterns for different interaction types
   * Pattern arrays: [vibrate, pause, vibrate, pause, ...]
   */
  private patterns: Record<HapticFeedbackType, number | number[]> = {
    // Basic feedback
    light: 10,
    medium: 20,
    heavy: 30,
    
    // UI interactions
    selection: 15,
    keypress: 5,
    toggle: [10, 10, 10],
    
    // State changes
    success: [10, 50, 10], // Quick-pause-quick pattern
    warning: [20, 40, 20, 40, 20], // Double pulse
    error: [50, 100, 50], // Strong-pause-strong
    
    // Physical interactions
    impact: [40], // Single strong tap
    notification: [25, 100, 25, 100, 25], // Triple pulse
    
    // Pull-to-refresh specific
    pull: [5, 10, 5], // Light double tap
    release: [15, 30, 10], // Medium-pause-light
    refresh: [10, 50, 10, 50, 10], // Success-like triple
  };

  /**
   * Trigger haptic feedback based on type
   * Includes debouncing to prevent excessive vibration
   */
  trigger(type: HapticFeedbackType = 'light'): void {
    if (!this.isSupported) return;

    // Debouncing - prevent too frequent haptics
    const now = Date.now();
    if (now - this.lastTriggerTime < this.minimumInterval) {
      return;
    }
    this.lastTriggerTime = now;

    try {
      const pattern = this.patterns[type];
      navigator.vibrate(pattern);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Check if haptic feedback is available
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Custom vibration pattern
   * @param pattern - Array of vibration durations in milliseconds
   */
  custom(pattern: number | number[]): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.debug('Custom haptic feedback failed:', error);
    }
  }

  /**
   * Sequence of haptic patterns with delays
   * @param sequence - Array of [type, delay] tuples
   */
  async sequence(sequence: Array<[HapticFeedbackType, number]>): Promise<void> {
    if (!this.isSupported) return;

    for (const [type, delay] of sequence) {
      this.trigger(type);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Stop any ongoing vibration
   */
  stop(): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.debug('Failed to stop vibration:', error);
    }
  }

  /**
   * Simulated haptic patterns for gradual changes
   */
  gradient(startIntensity: number = 5, endIntensity: number = 30, steps: number = 5): void {
    if (!this.isSupported) return;

    const pattern: number[] = [];
    const increment = (endIntensity - startIntensity) / steps;
    
    for (let i = 0; i < steps; i++) {
      pattern.push(Math.round(startIntensity + increment * i));
      if (i < steps - 1) {
        pattern.push(20); // Small pause between vibrations
      }
    }
    
    this.custom(pattern);
  }

  /**
   * Rhythmic pattern for continuous feedback
   */
  rhythm(duration: number = 1000, pattern: 'slow' | 'medium' | 'fast' = 'medium'): void {
    if (!this.isSupported) return;

    const rhythms = {
      slow: [100, 400],
      medium: [50, 200],
      fast: [25, 100]
    };

    const selectedRhythm = rhythms[pattern];
    const repetitions = Math.floor(duration / (selectedRhythm[0] + selectedRhythm[1]));
    const fullPattern: number[] = [];

    for (let i = 0; i < repetitions; i++) {
      fullPattern.push(...selectedRhythm);
    }

    this.custom(fullPattern);
  }
}

// Singleton instance
const haptic = new HapticFeedback();

// Export both the class and the default instance
export { HapticFeedback };
export default haptic;

// Named exports for convenient access to common patterns
export const haptics = {
  // Basic feedback
  light: () => haptic.trigger('light'),
  medium: () => haptic.trigger('medium'),
  heavy: () => haptic.trigger('heavy'),
  
  // UI interactions
  selection: () => haptic.trigger('selection'),
  keypress: () => haptic.trigger('keypress'),
  toggle: () => haptic.trigger('toggle'),
  
  // State changes
  success: () => haptic.trigger('success'),
  warning: () => haptic.trigger('warning'),
  error: () => haptic.trigger('error'),
  
  // Physical interactions
  impact: () => haptic.trigger('impact'),
  notification: () => haptic.trigger('notification'),
  
  // Pull-to-refresh
  pull: () => haptic.trigger('pull'),
  release: () => haptic.trigger('release'),
  refresh: () => haptic.trigger('refresh'),
  
  // Advanced patterns
  custom: (pattern: number | number[]) => haptic.custom(pattern),
  sequence: (sequence: Array<[HapticFeedbackType, number]>) => haptic.sequence(sequence),
  gradient: (start?: number, end?: number, steps?: number) => haptic.gradient(start, end, steps),
  rhythm: (duration?: number, pattern?: 'slow' | 'medium' | 'fast') => haptic.rhythm(duration, pattern),
  stop: () => haptic.stop(),
  
  // Utility
  isAvailable: () => haptic.isAvailable()
};