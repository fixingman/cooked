"use client";
import { notFound } from "next/navigation";
import { Clock, Users, BarChart2, Star } from "lucide-react";
import { RecipeHero } from "@/components/recipe-detail/RecipeHero";
import { ServingsAdjuster } from "@/components/recipe-detail/ServingsAdjuster";
import { IngredientList } from "@/components/recipe-detail/IngredientList";
import { InstructionSteps } from "@/components/recipe-detail/InstructionSteps";
import { StartCookingButton } from "@/components/recipe-detail/StartCookingButton";
import { Badge } from "@/components/ui/Badge";
import { useServingsScale } from "@/hooks/useServingsScale";
import { getRecipe } from "@/lib/recipes";
import { formatMinutes } from "@/lib/formatTime";
interface PageProps {
  params: { slug: string };
}

export default function RecipeDetailPage({ params }: PageProps) {
  const recipe = getRecipe(params.slug);
  if (!recipe) notFound();

  return <RecipeDetailClient recipe={recipe} />;
}

function RecipeDetailClient({ recipe }: { recipe: ReturnType<typeof getRecipe> & {} }) {
  const { servings, scale, increment, decrement } = useServingsScale(recipe.servings);

  return (
    <div className="relative">
      <RecipeHero recipe={recipe} />

      {/* Content */}
      <div className="px-4 md:px-6 pb-6 max-w-2xl mx-auto">
        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-parchment-300">
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <Clock size={14} className="text-ink-400" />
            <span className="font-medium">{formatMinutes(recipe.totalTimeMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <Users size={14} className="text-ink-400" />
            <span>Serves {recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <BarChart2 size={14} className="text-ink-400" />
            <Badge label={recipe.difficulty} variant="difficulty" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star size={13} className="text-saffron-500" fill="currentColor" />
            <span className="font-medium text-ink-700">{recipe.rating}</span>
            <span className="text-ink-400">({recipe.reviewCount.toLocaleString()})</span>
          </div>
        </div>

        {/* Description */}
        <div className="py-5 border-b border-parchment-300">
          <p className="font-serif text-ink-700 leading-relaxed text-[1.05rem]">{recipe.description}</p>
        </div>

        {/* Servings */}
        <div className="py-5 border-b border-parchment-300">
          <ServingsAdjuster servings={servings} onIncrement={increment} onDecrement={decrement} />
        </div>

        {/* Ingredients */}
        <div className="py-5 border-b border-parchment-300">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-4">Ingredients</h2>
          <IngredientList ingredients={recipe.ingredients} scale={scale} />
        </div>

        {/* Method */}
        <div className="py-5 border-b border-parchment-300">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-5">Method</h2>
          <InstructionSteps steps={recipe.steps} />
        </div>

        {/* Chef notes */}
        {recipe.chefNotes && (
          <div className="py-5 bg-saffron-300/15 rounded-card px-4 mt-2 mb-4">
            <p className="text-label uppercase tracking-widest text-saffron-600 mb-2">Chef&apos;s Notes</p>
            <p className="font-serif text-ink-700 text-sm leading-relaxed italic">{recipe.chefNotes}</p>
          </div>
        )}

        <StartCookingButton slug={recipe.slug} />
      </div>
    </div>
  );
}
