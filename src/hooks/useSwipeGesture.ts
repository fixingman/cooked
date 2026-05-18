"use client";
import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeHandlers) {
  const startX = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < threshold) return;
    if (delta < 0 && onSwipeLeft) onSwipeLeft();
    if (delta > 0 && onSwipeRight) onSwipeRight();
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
