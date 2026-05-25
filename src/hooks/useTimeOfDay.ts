"use client";
import { useMemo } from "react";
import type { MealTime } from "@/types/recipe";

export type TimeOfDay = "night" | "morning" | "afternoon" | "evening";

export interface TimeContext {
  timeOfDay: TimeOfDay;
  greeting: string;
  mealTime: MealTime;
  hour: number;
}

export function useTimeOfDay(): TimeContext {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) {
      return { timeOfDay: "night",     greeting: "Good night",      mealTime: "dinner",    hour };
    }
    if (hour < 11) {
      return { timeOfDay: "morning",   greeting: "Good morning",    mealTime: "breakfast", hour };
    }
    if (hour < 15) {
      return { timeOfDay: "afternoon", greeting: "Good afternoon",  mealTime: "lunch",     hour };
    }
    if (hour < 19) {
      return { timeOfDay: "evening",   greeting: "Good afternoon",  mealTime: "dinner",    hour };
    }
    return   { timeOfDay: "evening",   greeting: "Good evening",    mealTime: "dinner",    hour };
  }, []);
}
