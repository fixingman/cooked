"use client";
import { useState, useCallback, useEffect } from "react";
import type { UserSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type { DietaryTag } from "@/types/recipe";

const STORAGE_KEY = "cooked-settings";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleDietary = useCallback((tag: DietaryTag) => {
    setSettings((prev) => {
      const has = prev.dietaryPreferences.includes(tag);
      const next = {
        ...prev,
        dietaryPreferences: has
          ? prev.dietaryPreferences.filter((d) => d !== tag)
          : [...prev.dietaryPreferences, tag],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { settings, update, toggleDietary };
}
