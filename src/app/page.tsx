"use client";
import { useMemo } from "react";
import { TimeGreeting } from "@/components/home/TimeGreeting";
import { AIPromptBar } from "@/components/home/AIPromptBar";
import { PantryWidget } from "@/components/home/PantryWidget";
import { ForYouSection } from "@/components/home/ForYouSection";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { usePantry } from "@/hooks/usePantry";
import { rankRecipes, hasEnoughSignal } from "@/lib/rankRecipes";
import { normalizeForMatch } from "@/lib/ingredientUtils";
import type { RankSignals } from "@/lib/rankRecipes";
import type { MealTime } from "@/types/recipe";

function getCurrentMeal(): { mealTime: MealTime; label: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { mealTime: "breakfast", label: "For Breakfast" };
  if (hour < 17) return { mealTime: "lunch",     label: "For Lunch" };
  return                { mealTime: "dinner",     label: "For Dinner" };
}

function getSecondaryMeal(primary: MealTime): { mealTime: MealTime; label: string } {
  if (primary === "dinner") return { mealTime: "breakfast", label: "For Breakfast" };
  return { mealTime: "dinner", label: "For Dinner" };
}

export default function HomePage() {
  const { recipes: userRecipes } = useUserRecipes();
  const { favouriteIds } = useFavourites();
  const { states, hasCooked } = useRecipeStates();
  const { items: pantryItems } = usePantry();

  const allRecipes = useMemo(() => [...userRecipes], [userRecipes]);

  const featuredRecipe = userRecipes[0];

  const primary = getCurrentMeal();
  const secondary = getSecondaryMeal(primary.mealTime);

  // Build ranking signals from pantry, favourites, and cook history
  const pantryNames = useMemo(
    () => new Set(pantryItems.map(i => normalizeForMatch(i.name))),
    [pantryItems]
  );

  const signals: RankSignals = useMemo(
    () => ({ pantryNames, favouriteIds: new Set(favouriteIds), states }),
    [pantryNames, favouriteIds, states]
  );

  // "For You" — top-ranked recipes, excluding anything cooked in the last 3 days
  const forYouRecipes = useMemo(() => {
    if (!hasEnoughSignal(signals)) return [];
    const threeDaysAgo = Date.now() - 3 * 86_400_000;
    const eligible = allRecipes.filter(r => {
      const state = signals.states.find(s => s.recipeId === r.id);
      if (!state?.cookedAt?.length) return true;
      const mostRecent = new Date(state.cookedAt[state.cookedAt.length - 1]).getTime();
      return mostRecent < threeDaysAgo;
    });
    return rankRecipes(eligible, signals).slice(0, 8);
  }, [allRecipes, signals]);

  // Meal-time carousels — ranked within their meal-time filter
  const primaryRecipes = useMemo(
    () => rankRecipes(allRecipes.filter(r => r.mealTimes.includes(primary.mealTime)), signals),
    [allRecipes, primary.mealTime, signals]
  );
  const secondaryRecipes = useMemo(
    () => rankRecipes(allRecipes.filter(r => r.mealTimes.includes(secondary.mealTime)), signals),
    [allRecipes, secondary.mealTime, signals]
  );

  // Recipes the user has bookmarked (wantToCook), ranked
  const wantToCookRecipes = useMemo(() => {
    const ids = new Set(states.filter(s => s.wantToCook).map(s => s.recipeId));
    return rankRecipes(allRecipes.filter(r => ids.has(r.id)), signals);
  }, [allRecipes, states, signals]);

  // Favourites the user hasn't cooked yet, ranked
  const untriedFavourites = useMemo(
    () => rankRecipes(
      allRecipes.filter(r => favouriteIds.includes(r.id) && !hasCooked(r.id)),
      signals
    ),
    [allRecipes, favouriteIds, hasCooked, signals]
  );

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <TimeGreeting />
      <AIPromptBar />
      <PantryWidget />
      {hasEnoughSignal(signals) && forYouRecipes.length >= 2 && (
        <ForYouSection recipes={forYouRecipes} pantryNames={pantryNames} />
      )}
      {featuredRecipe && <FeaturedHero recipe={featuredRecipe} />}
      <MealTimeSection
        recipes={wantToCookRecipes}
        label="In Your List"
        seeAllHref="/recipes?category=want-to-cook"
      />
      <MealTimeSection recipes={primaryRecipes} label={primary.label} mealTime={primary.mealTime} />
      <ContinueCooking />
      <MealTimeSection
        recipes={untriedFavourites}
        label="From Your Favourites"
        seeAllHref="/recipes"
      />
      <MealTimeSection recipes={secondaryRecipes} label={secondary.label} mealTime={secondary.mealTime} />
      <div className="h-4" />
    </div>
  );
}
