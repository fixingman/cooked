import { recipes } from "@/data/recipes";
import type { MealTime, Difficulty, DietaryTag, Recipe } from "@/types/recipe";

export function getRecipe(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function getRecipes(filter?: {
  mealTime?: MealTime;
  difficulty?: Difficulty;
  dietary?: DietaryTag[];
  query?: string;
}): Recipe[] {
  let result = [...recipes];
  if (!filter) return result;

  if (filter.mealTime && filter.mealTime !== ("all" as MealTime)) {
    result = result.filter((r) => r.mealTimes.includes(filter.mealTime!));
  }
  if (filter.difficulty) {
    result = result.filter((r) => r.difficulty === filter.difficulty);
  }
  if (filter.dietary && filter.dietary.length > 0) {
    result = result.filter((r) =>
      filter.dietary!.every((d) => r.dietaryTags.includes(d))
    );
  }
  if (filter.query && filter.query.trim()) {
    const q = filter.query.toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.cuisine.toLowerCase().includes(q)
    );
  }
  return result;
}

export function getFeaturedRecipe(): Recipe | undefined {
  return recipes.find((r) => r.isFeatured);
}

export function getRecipesByMealTime(mealTime: MealTime): Recipe[] {
  return recipes.filter((r) => r.mealTimes.includes(mealTime));
}

export function getRelatedRecipes(recipe: Recipe, limit = 4): Recipe[] {
  return recipes
    .filter(
      (r) =>
        r.id !== recipe.id &&
        (r.cuisine === recipe.cuisine ||
          r.mealTimes.some((m) => recipe.mealTimes.includes(m)))
    )
    .slice(0, limit);
}
