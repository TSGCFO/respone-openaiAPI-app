/**
 * Haptic feedback utility for native app-like interactions
 * Uses the Vibration API where available
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

class HapticFeedback {
  private isSupported: boolean;

  constructor() {
    // Check if Vibration API is supported
    this.isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback based on type
   */
  trigger(type: HapticFeedbackType = 'light') {
    if (!this.isSupported) return;

    // Different vibration patterns for different feedback types
    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: 15,
      success: [10, 100, 30],
      warning: [20, 40, 20],
      error: [50, 100, 50]
    };

    try {
      navigator.vibrate(patterns[type]);
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
  custom(pattern: number | number[]) {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.debug('Custom haptic feedback failed:', error);
    }
  }
}

// Singleton instance
const haptic = new HapticFeedback();

export default haptic;