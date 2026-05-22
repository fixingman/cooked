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
  resetAndStart: (duration: number) => void;
  toggle: () => void;
}

export function useCookingTimer(initialDuration = 0): CookingTimerState {
  const [total, setTotal] = useState(initialDuration);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  // Refs track latest values without re-creating the worker's onmessage closure
  const totalRef = useRef(total);
  const startTimeRef = useRef(0);    // Date.now() when isRunning last became true
  const baseElapsedRef = useRef(0);  // elapsed value at that moment

  totalRef.current = total;

  // Spin up the Web Worker once. Falls back gracefully if Workers are unavailable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let w: Worker;
    try {
      w = new Worker("/timer-worker.js");
    } catch {
      return;
    }
    w.onmessage = () => {
      const next = baseElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
      const clamped = Math.min(next, totalRef.current);
      setElapsed(clamped);
      if (totalRef.current > 0 && clamped >= totalRef.current) {
        setIsRunning(false);
        w.postMessage("stop");
      }
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  // Start or stop the worker whenever isRunning flips
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;
    if (isRunning) {
      startTimeRef.current = Date.now();
      baseElapsedRef.current = elapsed;
      w.postMessage("start");
    } else {
      w.postMessage("stop");
    }
  // elapsed intentionally omitted — we read it via ref at the moment isRunning becomes true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning(r => !r), []);

  const reset = useCallback((duration: number) => {
    setIsRunning(false);
    setTotal(duration);
    setElapsed(0);
    totalRef.current = duration;
    baseElapsedRef.current = 0;
  }, []);

  const resetAndStart = useCallback((duration: number) => {
    setTotal(duration);
    setElapsed(0);
    totalRef.current = duration;
    baseElapsedRef.current = 0;
    setIsRunning(true);
  }, []);

  const remaining = Math.max(0, total - elapsed);
  const isComplete = total > 0 && elapsed >= total;

  return { total, elapsed, remaining, isRunning, isComplete, start, pause, reset, resetAndStart, toggle };
}
