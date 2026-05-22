"use client";
import { useMemo } from "react";
import type { MealTime } from "@/types/recipe";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface TimeContext {
  timeOfDay: TimeOfDay;
  greeting: string;
  suggestion: string;
  mealTime: MealTime;
  hour: number;
}

export function useTimeOfDay(): TimeContext {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) {
      return {
        timeOfDay: "morning",
        greeting: "Good morning",
        suggestion: "Start your day right",
        mealTime: "breakfast",
        hour,
      };
    }
    if (hour < 17) {
      return {
        timeOfDay: "afternoon",
        greeting: "Good afternoon",
        suggestion: "What's for lunch?",
        mealTime: "lunch",
        hour,
      };
    }
    return {
      timeOfDay: "evening",
      greeting: "Good evening",
      suggestion: "Time to cook something special",
      mealTime: "dinner",
      hour,
    };
  }, []);
}
