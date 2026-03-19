import { useEffect, useRef } from 'react';

export function useAnimationFrame(
  callback: (time: number) => void,
  active: boolean,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let rafId: number;
    const loop = () => {
      callbackRef.current(performance.now());
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [active]);
}
