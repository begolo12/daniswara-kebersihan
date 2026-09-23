import { useEffect, useRef } from 'react';

/**
 * Hook to trap Android / mobile browser hardware Back button or browser Back gesture.
 * When isActive is true, clicking Back / pressing hardware Back will trigger onBack
 * instead of navigating away or exiting the PWA app.
 */
export function useHardwareBack(isActive: boolean, onBack: () => void, modalId: string = 'modal') {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isActive) return;

    // Push state so back gesture / back button pops this state instead of closing page
    const stateKey = `app_view_${modalId}_${Date.now()}`;
    window.history.pushState({ modal: stateKey }, '');

    const handlePopState = (e: PopStateEvent) => {
      // User tapped hardware back or browser back
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If we pushed state and unmounted without popping, we clean up
      if (window.history.state && window.history.state.modal === stateKey) {
        window.history.back();
      }
    };
  }, [isActive, modalId]);
}
