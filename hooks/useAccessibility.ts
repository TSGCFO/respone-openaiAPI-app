import { useState, useEffect } from 'react';

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
}

export function useAccessibility(): AccessibilityPreferences {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'no-preference',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      setPreferences((prev) => ({
        ...prev,
        prefersReducedMotion: e.matches,
      }));

      // Apply to document for CSS
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };
    updateReducedMotion(reducedMotionQuery);
    reducedMotionQuery.addEventListener('change', updateReducedMotion);

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const updateHighContrast = (e: MediaQueryListEvent | MediaQueryList) => {
      setPreferences((prev) => ({
        ...prev,
        prefersHighContrast: e.matches,
      }));

      // Apply to document for CSS
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    };
    updateHighContrast(highContrastQuery);
    highContrastQuery.addEventListener('change', updateHighContrast);

    // Check for color scheme preference
    const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
    const updateColorScheme = () => {
      let scheme: 'light' | 'dark' | 'no-preference' = 'no-preference';
      if (darkSchemeQuery.matches) {
        scheme = 'dark';
      } else if (lightSchemeQuery.matches) {
        scheme = 'light';
      }
      setPreferences((prev) => ({
        ...prev,
        prefersColorScheme: scheme,
      }));
    };
    updateColorScheme();
    darkSchemeQuery.addEventListener('change', updateColorScheme);
    lightSchemeQuery.addEventListener('change', updateColorScheme);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateReducedMotion);
      highContrastQuery.removeEventListener('change', updateHighContrast);
      darkSchemeQuery.removeEventListener('change', updateColorScheme);
      lightSchemeQuery.removeEventListener('change', updateColorScheme);
    };
  }, []);

  return preferences;
}
