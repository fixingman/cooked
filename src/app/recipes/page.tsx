"use client";
import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChefHat } from "lucide-react";
import { SearchBar } from "@/components/recipes/SearchBar";
import { CategoryChips } from "@/components/recipes/CategoryChips";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { ViewToggle } from "@/components/recipes/ViewToggle";
import { useRecipeFilter } from "@/hooks/useRecipeFilter";
import { recipes } from "@/data/recipes";
import type { CategoryFilter, SortOption } from "@/hooks/useRecipeFilter";
import type { MealTime, DietaryTag } from "@/types/recipe";

const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const sortLabels: { value: SortOption; label: string }[] = [
  { value: "none",       label: "Default" },
  { value: "rating",     label: "Top rated" },
  { value: "time",       label: "Quickest" },
  { value: "difficulty", label: "Easiest first" },
];

function RecipesContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as CategoryFilter) || "all";

  const { query, category, dietary, viewMode, sort, setQuery, setCategory, setViewMode, setSort } =
    useRecipeFilter({ category: initialCategory });

  const filtered = useMemo(() => {
    let result = [...recipes];

    if (category !== "all") {
      if (category === "vegetarian") {
        result = result.filter((r) => r.dietaryTags.includes("vegetarian" as DietaryTag));
      } else if (category === "quick") {
        result = result.filter((r) => r.totalTimeMinutes <= 30);
      } else if (category === "thermomix") {
        result = result.filter((r) => r.thermomixAvailable);
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

    if (sort === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sort === "time") {
      result = [...result].sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
    } else if (sort === "difficulty") {
      result = [...result].sort(
        (a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1)
      );
    }

    return result;
  }, [query, category, dietary, sort]);

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-heading text-ink-900 font-semibold mb-5">Recipes</h1>
        <div className="space-y-3">
          <SearchBar value={query} onChange={setQuery} />
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <CategoryChips active={category} onChange={setCategory} />
            </div>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-400">
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-xs text-ink-600 bg-parchment-200 border border-parchment-300 rounded-lg px-2.5 py-1.5 appearance-none cursor-pointer hover:border-parchment-400 transition-colors"
            >
              {sortLabels.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-parchment-200 rounded-full flex items-center justify-center mb-4">
            <ChefHat size={28} className="text-ink-300" />
          </div>
          <p className="font-serif text-lg text-ink-700 mb-1">No recipes found</p>
          <p className="text-sm text-ink-400">Try a different search or filter</p>
        </div>
      ) : (
        <RecipeGrid recipes={filtered} viewMode={viewMode} />
      )}
      <div className="h-6" />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense>
      <RecipesContent />
    </Suspense>
  );
}
