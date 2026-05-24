"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import { cookingHistory as mockHistory } from "@/data/cookingHistory";
import type { CookingHistoryEntry } from "@/types/recipe";

// Union by cookedAt timestamp (already the unique key used throughout the hook).
function mergeHistory(local: CookingHistoryEntry[], remote: CookingHistoryEntry[]): CookingHistoryEntry[] {
  const remoteKeys = new Set(remote.map(e => e.cookedAt));
  const localOnly  = local.filter(e => !remoteKeys.has(e.cookedAt));
  return [...remote, ...localOnly].sort((a, b) => b.cookedAt.localeCompare(a.cookedAt));
}

export function useCookingHistory() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: history, setValue } = useDropboxSync<CookingHistoryEntry[]>({
    dropboxPath:     "/history.json",
    localStorageKey: "cooked-history",
    defaultValue:    mockHistory,
    getValidAccessToken,
    merge: mergeHistory,
  });

  const addEntry = useCallback((entry: CookingHistoryEntry) => {
    setValue((prev) => {
      // Replace entry with same cookedAt — handles rating updates without duplicates
      const without = prev.filter((e) => e.cookedAt !== entry.cookedAt);
      return [entry, ...without];
    });
  }, [setValue]);

  const clearHistory = useCallback(() => setValue([]), [setValue]);

  const deleteLastEntry = useCallback((recipeId: string) => {
    setValue(prev => {
      const idx = [...prev]
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.recipeId === recipeId)
        .sort((a, b) => b.e.cookedAt.localeCompare(a.e.cookedAt))[0]?.i;
      if (idx === undefined) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }, [setValue]);

  const deleteRecipeHistory = useCallback((recipeId: string) => {
    setValue(prev => prev.filter(e => e.recipeId !== recipeId));
  }, [setValue]);

  return { history, addEntry, clearHistory, deleteLastEntry, deleteRecipeHistory };
}
