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

const GREETINGS: Record<string, string[]> = {
  night: [
    "Good night.",
    "Burning the midnight oil?",
    "Late night snack?",
    "Still up?",
    "Midnight munchies?",
    "The kitchen never sleeps.",
    "Night owl cooking?",
    "Can't sleep?",
    "What are we making at this hour?",
    "Fuelling the night shift?",
  ],
  morning: [
    "Good morning.",
    "Morning!",
    "Rise and shine.",
    "Good morning, chef.",
    "Up early?",
    "Breakfast time.",
    "Morning, chef.",
    "Ready to cook?",
    "What's for breakfast?",
    "Coffee first?",
    "Early bird.",
    "A good morning starts in the kitchen.",
  ],
  afternoon: [
    "Good afternoon.",
    "Lunchtime?",
    "Afternoon, chef.",
    "What's for lunch?",
    "Hungry?",
    "Lunch o'clock.",
    "Midday hunger?",
    "Time to eat.",
    "Lunch break?",
    "What are you craving?",
    "Stomach calling?",
  ],
  lateAfternoon: [
    "Good afternoon.",
    "Almost dinner time.",
    "Afternoon, chef.",
    "What's cooking tonight?",
    "Planning dinner?",
    "The golden hour.",
    "Pre-dinner prep?",
    "What's on the menu?",
    "Dinner plans?",
    "Getting hungry?",
    "The best time to cook.",
    "Something smells good already.",
  ],
  evening: [
    "Good evening.",
    "Evening, chef.",
    "What's for dinner?",
    "Dinner time.",
    "Evening!",
    "Time to cook.",
    "What are we making?",
    "Hungry tonight?",
    "Chef's choice tonight?",
    "What's cooking?",
    "The dinner hour.",
    "Let's make something good.",
  ],
};

export function useTimeOfDay(): TimeContext {
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    // Consistent within a day, changes daily
    const dayIndex = now.getDate() + now.getMonth() * 31;
    const pick = (key: string) => {
      const pool = GREETINGS[key];
      return pool[dayIndex % pool.length];
    };

    if (hour < 5)  return { timeOfDay: "night",     greeting: pick("night"),         mealTime: "dinner",    hour };
    if (hour < 11) return { timeOfDay: "morning",   greeting: pick("morning"),       mealTime: "breakfast", hour };
    if (hour < 15) return { timeOfDay: "afternoon", greeting: pick("afternoon"),     mealTime: "lunch",     hour };
    if (hour < 19) return { timeOfDay: "evening",   greeting: pick("lateAfternoon"), mealTime: "dinner",    hour };
    return               { timeOfDay: "evening",   greeting: pick("evening"),       mealTime: "dinner",    hour };
  }, []);
}
