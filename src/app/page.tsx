import { TimeGreeting } from "@/components/home/TimeGreeting";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { getFeaturedRecipe, getRecipesByMealTime } from "@/lib/recipes";
import type { MealTime } from "@/types/recipe";

function getCurrentMeal(): { mealTime: MealTime; label: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { mealTime: "breakfast", label: "For Breakfast" };
  if (hour < 17) return { mealTime: "lunch",     label: "For Lunch" };
  return                { mealTime: "dinner",     label: "For Dinner" };
}

function getSecondarymeal(primary: MealTime): { mealTime: MealTime; label: string } {
  if (primary === "dinner") return { mealTime: "breakfast", label: "For Breakfast" };
  return { mealTime: "dinner", label: "For Dinner" };
}

export default function HomePage() {
  const featured = getFeaturedRecipe();
  const primary = getCurrentMeal();
  const secondary = getSecondarymeal(primary.mealTime);
  const primaryRecipes = getRecipesByMealTime(primary.mealTime);
  const secondaryRecipes = getRecipesByMealTime(secondary.mealTime);

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <TimeGreeting />
      {featured && <FeaturedHero recipe={featured} />}
      <MealTimeSection recipes={primaryRecipes} label={primary.label} mealTime={primary.mealTime} />
      <ContinueCooking />
      <MealTimeSection recipes={secondaryRecipes} label={secondary.label} mealTime={secondary.mealTime} />
      <div className="h-4" />
    </div>
  );
}
