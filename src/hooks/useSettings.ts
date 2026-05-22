"use client";
import { useCallback } from "react";
import type { UserSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type { DietaryTag } from "@/types/recipe";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";

export function useSettings() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: settings, setValue } = useDropboxSync<UserSettings>({
    dropboxPath:     "/settings.json",
    localStorageKey: "cooked-settings",
    defaultValue:    DEFAULT_SETTINGS,
    getValidAccessToken,
  });

  const update = useCallback((patch: Partial<UserSettings>) => {
    setValue((prev) => ({ ...prev, ...patch }));
  }, [setValue]);

  const toggleDietary = useCallback((tag: DietaryTag) => {
    setValue((prev) => {
      const has = prev.dietaryPreferences.includes(tag);
      return {
        ...prev,
        dietaryPreferences: has
          ? prev.dietaryPreferences.filter((d) => d !== tag)
          : [...prev.dietaryPreferences, tag],
      };
    });
  }, [setValue]);

  return { settings, update, toggleDietary };
}
