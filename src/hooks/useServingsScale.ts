"use client";
import { useState, useCallback } from "react";

export interface ServingsScale {
  servings: number;
  scale: number;
  increment: () => void;
  decrement: () => void;
}

export function useServingsScale(base: number): ServingsScale {
  const [servings, setServings] = useState(base);
  const scale = servings / base;
  const increment = useCallback(() => setServings((s) => s + 1), []);
  const decrement = useCallback(() => setServings((s) => Math.max(1, s - 1)), []);
  return { servings, scale, increment, decrement };
}
