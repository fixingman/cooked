"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import type { RecipeState } from "@/types/recipe";

export function useRecipeStates() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: states, setValue } = useDropboxSync<RecipeState[]>({
    dropboxPath:     "/recipe-states.json",
    localStorageKey: "cooked-recipe-states",
    defaultValue:    [],
    getValidAccessToken,
  });

  const getState = useCallback((recipeId: string) =>
    states.find(s => s.recipeId === recipeId), [states]);

  const isWantToCook = useCallback((recipeId: string) =>
    states.some(s => s.recipeId === recipeId && s.wantToCook), [states]);

  const hasCooked = useCallback((recipeId: string) =>
    states.some(s => s.recipeId === recipeId && (s.cookedAt?.length ?? 0) > 0), [states]);

  const toggleWantToCook = useCallback((recipeId: string) => {
    setValue(prev => {
      const existing = prev.find(s => s.recipeId === recipeId);
      if (existing) {
        return prev.map(s => s.recipeId === recipeId ? { ...s, wantToCook: !s.wantToCook } : s);
      }
      return [...prev, { recipeId, wantToCook: true }];
    });
  }, [setValue]);

  const markCooked = useCallback((recipeId: string, cookedAt: string) => {
    setValue(prev => {
      const existing = prev.find(s => s.recipeId === recipeId);
      if (existing) {
        return prev.map(s => s.recipeId === recipeId
          ? { ...s, wantToCook: false, cookedAt: [...(s.cookedAt ?? []), cookedAt] }
          : s
        );
      }
      return [...prev, { recipeId, wantToCook: false, cookedAt: [cookedAt] }];
    });
  }, [setValue]);

  const updateRating = useCallback((recipeId: string, rating: number) => {
    setValue(prev => prev.map(s => s.recipeId === recipeId ? { ...s, rating } : s));
  }, [setValue]);

  const unmarkCooked = useCallback((recipeId: string) => {
    setValue(prev => prev.map(s => {
      if (s.recipeId !== recipeId) return s;
      const remaining = (s.cookedAt ?? []).slice(0, -1);
      return { ...s, cookedAt: remaining, rating: remaining.length === 0 ? undefined : s.rating };
    }));
  }, [setValue]);

  const deleteState = useCallback((recipeId: string) => {
    setValue(prev => prev.filter(s => s.recipeId !== recipeId));
  }, [setValue]);

  return { states, getState, isWantToCook, hasCooked, toggleWantToCook, markCooked, unmarkCooked, updateRating, deleteState };
}
