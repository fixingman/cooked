"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "./useDropboxAuth";
import { useDropboxSync } from "./useDropboxSync";
import { STARTER_RECIPES } from "@/data/starterRecipes";
import type { Recipe } from "@/types/recipe";

// Merge starter recipes into the library on first ever launch — runs synchronously
// so useDropboxSync picks up the merged value as its initial state.
// Existing user recipes are preserved; starters are appended at the end.
// The cooked-seeded flag prevents re-seeding on subsequent loads.
if (typeof window !== "undefined" && !localStorage.getItem("cooked-seeded")) {
  try {
    const raw = localStorage.getItem("cooked-user-recipes");
    const existing: Recipe[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set(existing.map((r: Recipe) => r.id));
    const newStarters = STARTER_RECIPES.filter(r => !existingIds.has(r.id));
    const merged = [...existing, ...newStarters];
    localStorage.setItem("cooked-user-recipes", JSON.stringify(merged));
  } catch {}
  localStorage.setItem("cooked-seeded", "1");
}

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cooked:recipe-updated", { detail: { id } }));
    }
  }, [setValue]);

  const removeRecipe = useCallback((id: string) => {
    setValue(prev => prev.filter(r => r.id !== id));
  }, [setValue]);

  const getUserRecipe = useCallback((slug: string): Recipe | undefined => {
    return recipes.find(r => r.slug === slug);
  }, [recipes]);

  return { recipes, addRecipe, updateRecipe, removeRecipe, getUserRecipe, syncing };
}
