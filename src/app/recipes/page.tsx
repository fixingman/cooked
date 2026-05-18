"use client";
import { useMemo } from "react";
import { SearchBar } from "@/components/recipes/SearchBar";
import { CategoryChips } from "@/components/recipes/CategoryChips";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { ViewToggle } from "@/components/recipes/ViewToggle";
import { useRecipeFilter } from "@/hooks/useRecipeFilter";
import { recipes } from "@/data/recipes";
import type { MealTime, DietaryTag } from "@/types/recipe";

export default function RecipesPage() {
  const { query, category, dietary, viewMode, setQuery, setCategory, setViewMode } = useRecipeFilter();

  const filtered = useMemo(() => {
    let result = [...recipes];
    if (category !== "all") {
      if (category === "vegetarian") {
        result = result.filter((r) => r.dietaryTags.includes("vegetarian" as DietaryTag));
      } else if (category === "quick") {
        result = result.filter((r) => r.totalTimeMinutes <= 30);
      } else {
        result = result.filter((r) => r.mealTimes.includes(category as MealTime));
      }
    }
    if (dietary.length > 0) {
      result = result.filter((r) => dietary.every((d) => r.dietaryTags.includes(d)));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.cuisine.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, category, dietary]);

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-heading text-ink-900 font-semibold mb-5">Recipes</h1>
        <div className="space-y-3">
          <SearchBar value={query} onChange={setQuery} />
          <div className="flex items-center justify-between gap-3">
            <CategoryChips active={category} onChange={setCategory} />
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-ink-400">
          {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <RecipeGrid recipes={filtered} viewMode={viewMode} />
      <div className="h-6" />
    </div>
  );
}
