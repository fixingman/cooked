"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export interface CookingTimerState {
  total: number;
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  reset: (duration: number) => void;
  toggle: () => void;
}

export function useCookingTimer(initialDuration = 0): CookingTimerState {
  const [total, setTotal] = useState(initialDuration);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= total) {
            setIsRunning(false);
            return e;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      clear();
    }
    return clear;
  }, [isRunning, total, clear]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning((r) => !r), []);

  const reset = useCallback((duration: number) => {
    setIsRunning(false);
    setTotal(duration);
    setElapsed(0);
  }, []);

  const remaining = Math.max(0, total - elapsed);
  const isComplete = total > 0 && elapsed >= total;

  return { total, elapsed, remaining, isRunning, isComplete, start, pause, reset, toggle };
}
