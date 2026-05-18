import { TimeGreeting } from "@/components/home/TimeGreeting";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { getFeaturedRecipe, getRecipesByMealTime } from "@/lib/recipes";

export default function HomePage() {
  const featured = getFeaturedRecipe();
  const breakfastRecipes = getRecipesByMealTime("breakfast");
  const dinnerRecipes = getRecipesByMealTime("dinner");

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <TimeGreeting />
      {featured && <FeaturedHero recipe={featured} />}
      <MealTimeSection recipes={breakfastRecipes} label="For Breakfast" />
      <ContinueCooking />
      <MealTimeSection recipes={dinnerRecipes} label="For Dinner" />
      <div className="h-4" />
    </div>
  );
}
