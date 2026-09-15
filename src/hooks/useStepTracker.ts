import { useEffect, useRef } from 'react';

interface StepTrackerOptions {
  enabled: boolean;
  onStep: (steps: number) => void;
}

function getAcceleration(event: DeviceMotionEvent) {
  const acceleration = event.accelerationIncludingGravity;
  if (!acceleration) return 0;
  return Math.sqrt(
    (acceleration.x ?? 0) ** 2 +
    (acceleration.y ?? 0) ** 2 +
    (acceleration.z ?? 0) ** 2,
  );
}

export function useStepTracker({ enabled, onStep }: StepTrackerOptions) {
  const lastPeakAt = useRef(0);
  const peakDetected = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = getAcceleration(event);
      const now = Date.now();
      if (acceleration > 12.2 && !peakDetected.current && now - lastPeakAt.current > 280) {
        peakDetected.current = true;
        lastPeakAt.current = now;
        onStep(1);
      }
      if (acceleration < 10.8) {
        peakDetected.current = false;
      }
    };

    const hasMotion = 'DeviceMotionEvent' in window;
    if (hasMotion) {
      window.addEventListener('devicemotion', handleMotion);
    }

    // Desktop/web fallback: keep a small local activity estimate alive when no sensor exists.
    const fallback = hasMotion ? undefined : window.setInterval(() => {
      if (document.visibilityState === 'visible') onStep(1);
    }, 30_000);

    return () => {
      if (hasMotion) window.removeEventListener('devicemotion', handleMotion);
      if (fallback) window.clearInterval(fallback);
    };
  }, [enabled, onStep]);
}
