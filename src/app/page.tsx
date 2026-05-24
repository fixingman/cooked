"use client";
import { useMemo } from "react";
import { TimeGreeting } from "@/components/home/TimeGreeting";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecipeStates } from "@/hooks/useRecipeStates";
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

  const allRecipes = useMemo(() => [...userRecipes], [userRecipes]);

  const featuredRecipe = userRecipes[0];

  const primary = getCurrentMeal();
  const secondary = getSecondaryMeal(primary.mealTime);

  const primaryRecipes = useMemo(
    () => allRecipes.filter(r => r.mealTimes.includes(primary.mealTime)),
    [allRecipes, primary.mealTime]
  );
  const secondaryRecipes = useMemo(
    () => allRecipes.filter(r => r.mealTimes.includes(secondary.mealTime)),
    [allRecipes, secondary.mealTime]
  );

  // Recipes the user has bookmarked (wantToCook)
  const wantToCookRecipes = useMemo(() => {
    const ids = new Set(states.filter(s => s.wantToCook).map(s => s.recipeId));
    return allRecipes.filter(r => ids.has(r.id));
  }, [allRecipes, states]);

  // Favourites the user hasn't cooked yet
  const untriedFavourites = useMemo(
    () => allRecipes.filter(r => favouriteIds.includes(r.id) && !hasCooked(r.id)),
    [allRecipes, favouriteIds, hasCooked]
  );

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <TimeGreeting />
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
