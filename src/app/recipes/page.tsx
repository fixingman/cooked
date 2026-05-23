"use client";
import { useMemo, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChefHat, Plus, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/recipes/SearchBar";
import { CategoryChips } from "@/components/recipes/CategoryChips";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { ViewToggle } from "@/components/recipes/ViewToggle";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { useRecipeFilter } from "@/hooks/useRecipeFilter";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { recipes as builtInRecipes } from "@/data/recipes";
import type { CategoryFilter, SortOption } from "@/hooks/useRecipeFilter";
import type { MealTime, DietaryTag, Recipe } from "@/types/recipe"; // DietaryTag used in matchesCategory casts

const TAG_SETS: Record<string, string[]> = {
  soup:  ["soup", "broth", "stew", "chowder"],
  pasta: ["pasta", "noodle", "noodles", "ramen", "spaghetti", "linguine", "penne"],
  bake:  ["bake", "baked", "baking", "cake", "bread", "pastry", "muffin", "cookie", "tart", "pie"],
  salad: ["salad"],
};

const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const sortLabels: { value: SortOption; label: string }[] = [
  { value: "none",       label: "Default" },
  { value: "rating",     label: "Top rated" },
  { value: "time",       label: "Quickest" },
  { value: "difficulty", label: "Easiest first" },
];

function matchesCategory(recipe: Recipe, cat: CategoryFilter, wantToCookIds?: Set<string>, cookedIds?: Set<string>): boolean {
  if (cat === "want-to-cook") return wantToCookIds?.has(recipe.id) ?? false;
  if (cat === "cooked")       return cookedIds?.has(recipe.id) ?? false;
  if (cat === "quick")        return recipe.totalTimeMinutes <= 30;
  if (cat === "thermomix")    return !!recipe.thermomixAvailable;
  if (cat === "vegetarian")   return recipe.dietaryTags.includes("vegetarian" as DietaryTag);
  if (cat === "vegan")        return recipe.dietaryTags.includes("vegan" as DietaryTag);
  if (cat === "gluten-free")  return recipe.dietaryTags.includes("gluten-free" as DietaryTag);
  if (cat === "dairy-free")   return recipe.dietaryTags.includes("dairy-free" as DietaryTag);
  if (cat in TAG_SETS) {
    const keywords = TAG_SETS[cat];
    return recipe.tags.some(t => keywords.some(k => t.toLowerCase().includes(k))) ||
           keywords.some(k => recipe.title.toLowerCase().includes(k));
  }
  return recipe.mealTimes.includes(cat as MealTime);
}

function RecipesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as CategoryFilter | null;
  const [showImport, setShowImport] = useState(false);

  const { recipes: userRecipes } = useUserRecipes();
  const { states: recipeStates } = useRecipeStates();

  const { query, categories, viewMode, sort, setQuery, toggleCategory, clearCategories, setViewMode, setSort } =
    useRecipeFilter({ categories: initialCategory ? [initialCategory] : [] });

  const allRecipes = useMemo(() => [...userRecipes, ...builtInRecipes], [userRecipes]);

  const wantToCookIds = useMemo(
    () => new Set(recipeStates.filter(s => s.wantToCook).map(s => s.recipeId)),
    [recipeStates]
  );

  const cookedIds = useMemo(
    () => new Set(recipeStates.filter(s => (s.cookedAt?.length ?? 0) > 0).map(s => s.recipeId)),
    [recipeStates]
  );

  const filtered = useMemo(() => {
    let result = [...allRecipes];

    if (categories.length > 0) {
      result = result.filter((r) => categories.every((cat) => matchesCategory(r, cat, wantToCookIds, cookedIds)));
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

    if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === "time") result = [...result].sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
    else if (sort === "difficulty") result = [...result].sort(
      (a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1)
    );

    return result;
  }, [allRecipes, query, categories, sort, wantToCookIds, cookedIds]);

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-serif text-heading text-ink-900 font-semibold">Recipes</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 bg-parchment-200 hover:bg-parchment-300 border border-parchment-300 px-3 py-1.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={15} />
            Import
          </motion.button>
        </div>
        <div className="space-y-3">
          <SearchBar value={query} onChange={setQuery} />
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <CategoryChips active={categories} onToggle={toggleCategory} onClear={clearCategories} />
            </div>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-400">
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="relative flex items-center">
              <ArrowUpDown size={12} className="absolute left-2.5 text-ink-400 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="text-xs text-ink-600 bg-parchment-200 border border-parchment-300 rounded-lg pl-7 pr-2.5 py-1.5 appearance-none cursor-pointer hover:border-parchment-400 transition-colors"
              >
                {sortLabels.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-parchment-200 rounded-full flex items-center justify-center mb-4">
            <ChefHat size={28} className="text-ink-300" />
          </div>
          <p className="font-serif text-lg text-ink-700 mb-1">No recipes found</p>
          <p className="text-sm text-ink-400 mb-4">Try a different search or filter</p>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-sm text-saffron-500 hover:text-saffron-600 font-medium transition-colors"
          >
            <Plus size={15} />
            Import a recipe
          </button>
        </div>
      ) : (
        <RecipeGrid recipes={filtered} viewMode={viewMode} />
      )}
      <div className="h-6" />

      {showImport && <ImportRecipeModal onClose={() => setShowImport(false)} />}
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
