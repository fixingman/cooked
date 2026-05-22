"use client";
import { RecipeCard } from "./RecipeCard";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import type { Recipe } from "@/types/recipe";
import type { ViewMode } from "@/hooks/useRecipeFilter";
import { motion } from "framer-motion";

interface RecipeGridProps {
  recipes: Recipe[];
  viewMode?: ViewMode;
}

export function RecipeGrid({ recipes, viewMode = "grid" }: RecipeGridProps) {
  const { hasCooked } = useRecipeStates();

  if (recipes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="text-5xl mb-4">🍽️</div>
        <h3 className="font-serif text-xl text-ink-700 mb-2">No recipes found</h3>
        <p className="text-ink-500 text-sm">Try adjusting your search or filters</p>
      </motion.div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {recipes.map((recipe, i) => (
          <RecipeCard key={recipe.id} recipe={recipe} viewMode="list" index={i} isCooked={hasCooked(recipe.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recipes.map((recipe, i) => (
        <RecipeCard key={recipe.id} recipe={recipe} viewMode="grid" index={i} isCooked={hasCooked(recipe.id)} />
      ))}
    </div>
  );
}
