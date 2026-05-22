"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "./useDropboxAuth";
import { useDropboxSync } from "./useDropboxSync";
import type { Recipe } from "@/types/recipe";

export function useUserRecipes() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: recipes, setValue, syncing } = useDropboxSync<Recipe[]>({
    dropboxPath: "/recipes/index.json",
    localStorageKey: "cooked-user-recipes",
    defaultValue: [],
    getValidAccessToken,
  });

  const addRecipe = useCallback((recipe: Recipe) => {
    setValue(prev => [recipe, ...prev.filter(r => r.id !== recipe.id)]);
  }, [setValue]);

  const removeRecipe = useCallback((id: string) => {
    setValue(prev => prev.filter(r => r.id !== id));
  }, [setValue]);

  const getUserRecipe = useCallback((slug: string): Recipe | undefined => {
    return recipes.find(r => r.slug === slug);
  }, [recipes]);

  return { recipes, addRecipe, removeRecipe, getUserRecipe, syncing };
}
