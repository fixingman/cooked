"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "./useDropboxAuth";
import { useDropboxSync } from "./useDropboxSync";
import type { Recipe } from "@/types/recipe";

// Remote wins for recipes that exist in both (remote may have edits from another device).
// Local-only recipes (added while offline / disconnected) are prepended.
function mergeRecipes(local: Recipe[], remote: Recipe[]): Recipe[] {
  const remoteIds = new Set(remote.map(r => r.id));
  const localOnly = local.filter(r => !remoteIds.has(r.id));
  return [...localOnly, ...remote];
}

export function useUserRecipes() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: recipes, setValue, syncing } = useDropboxSync<Recipe[]>({
    dropboxPath: "/recipes/index.json",
    localStorageKey: "cooked-user-recipes",
    defaultValue: [],
    getValidAccessToken,
    merge: mergeRecipes,
  });

  const addRecipe = useCallback((recipe: Recipe) => {
    setValue(prev => [recipe, ...prev.filter(r => r.id !== recipe.id)]);
  }, [setValue]);

  const updateRecipe = useCallback((id: string, patch: Partial<Recipe>) => {
    setValue(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [setValue]);

  const removeRecipe = useCallback((id: string) => {
    setValue(prev => prev.filter(r => r.id !== id));
  }, [setValue]);

  const getUserRecipe = useCallback((slug: string): Recipe | undefined => {
    return recipes.find(r => r.slug === slug);
  }, [recipes]);

  return { recipes, addRecipe, updateRecipe, removeRecipe, getUserRecipe, syncing };
}
