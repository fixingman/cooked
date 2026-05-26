import { normalizeForMatch } from "@/lib/ingredientUtils";
import type { Recipe, RecipeState } from "@/types/recipe";

export interface RankSignals {
  pantryNames: Set<string>;  // normalizeForMatch-normalised pantry item names
  favouriteIds: Set<string>;
  states: RecipeState[];
}

function scoreRecipe(recipe: Recipe, signals: RankSignals): number {
  let score = 0;

  // Pantry match ratio (0–4 points) — highest-weight signal
  if (signals.pantryNames.size > 0 && recipe.ingredients.length > 0) {
    const matched = recipe.ingredients.filter(
      ing => signals.pantryNames.has(normalizeForMatch(ing.name))
    ).length;
    score += (matched / recipe.ingredients.length) * 4;
  }

  // Favourited
  if (signals.favouriteIds.has(recipe.id)) score += 2;

  const state = signals.states.find(s => s.recipeId === recipe.id);

  // Bookmarked (want to cook)
  if (state?.wantToCook) score += 1;

  // Cooked before
  const cookedCount = state?.cookedAt?.length ?? 0;
  if (cookedCount > 0) {
    score += 0.5;
    if ((state?.rating ?? 0) >= 4) score += 1.5;

    // Recency penalty — recipes cooked very recently fade from recommendations
    const mostRecent = state!.cookedAt![cookedCount - 1];
    const daysSince = (Date.now() - new Date(mostRecent).getTime()) / 86_400_000;
    if (daysSince < 3)       score -= 4;
    else if (daysSince < 7)  score -= 2;
    else if (daysSince < 14) score -= 0.5;
  }

  return score;
}

/** Sort recipes by personalised relevance score, highest first. */
export function rankRecipes(recipes: Recipe[], signals: RankSignals): Recipe[] {
  // Pre-compute scores to avoid repeated work inside sort comparator
  const scores = new Map<string, number>(
    recipes.map(r => [r.id, scoreRecipe(r, signals)])
  );
  return [...recipes].sort((a, b) => scores.get(b.id)! - scores.get(a.id)!);
}

/** Returns true when there is enough behavioural signal to show the For You section. */
export function hasEnoughSignal(signals: RankSignals): boolean {
  const cookedCount = signals.states.filter(s => (s.cookedAt?.length ?? 0) > 0).length;
  return (
    signals.pantryNames.size >= 3 ||
    signals.favouriteIds.size >= 2 ||
    cookedCount >= 2
  );
}

/** Pantry match count for a single recipe — used by ForYouSection for badge display. */
export function pantryMatchCount(recipe: Recipe, pantryNames: Set<string>): number {
  return recipe.ingredients.filter(
    ing => pantryNames.has(normalizeForMatch(ing.name))
  ).length;
}
