"use client";
import { memo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ShoppingCart, Check } from "lucide-react";
import { FoodImage } from "@/components/ui/FoodImage";
import { Badge } from "@/components/ui/Badge";
import { RecipeRating } from "@/components/ui/RecipeRating";
import { useDropboxImage } from "@/hooks/useDropboxImage";
import { cn } from "@/lib/cn";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  viewMode?: "grid" | "list";
  index?: number;
  isCooked?: boolean;
  onAddToShopping?: (recipe: Recipe) => number;
}

// Hover affordance: add the recipe's not-in-pantry ingredients to the shopping list.
function AddToShoppingButton({
  recipe,
  onAddToShopping,
  className,
}: {
  recipe: Recipe;
  onAddToShopping?: (recipe: Recipe) => number;
  className?: string;
}) {
  const [feedback, setFeedback] = useState<"idle" | "added" | "have">("idle");
  if (!onAddToShopping) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const n = onAddToShopping!(recipe);
    setFeedback(n > 0 ? "added" : "have");
    setTimeout(() => setFeedback("idle"), 1600);
  }

  const title =
    feedback === "added" ? "Added to shopping list"
    : feedback === "have" ? "You already have everything"
    : "Add to shopping list";

  return (
    <button
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full shadow-card transition-all duration-200",
        feedback === "added" ? "bg-sage-500 text-parchment-100"
          : "bg-parchment-100/90 backdrop-blur-sm text-ink-700 hover:bg-parchment-100 hover:text-saffron-600",
        className
      )}
    >
      {feedback === "added" ? <Check size={15} strokeWidth={2.5} /> : <ShoppingCart size={15} />}
    </button>
  );
}

export const RecipeCard = memo(function RecipeCard({ recipe, viewMode = "grid", index = 0, isCooked = false, onAddToShopping }: RecipeCardProps) {
  // Prefer Dropbox copy whenever available — external URLs can expire or be blocked.
  const dropboxImage = useDropboxImage(recipe.heroImageDropboxPath);
  const imageSrc = dropboxImage ?? recipe.heroImageUrl;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href={`/recipes/${recipe.slug}`}>
          <div className="flex gap-4 p-4 bg-parchment-200 rounded-card border border-parchment-300 hover:shadow-card-lg transition-shadow duration-300 group">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <FoodImage
                src={imageSrc}
                alt={recipe.title}
                fill
                sizes="80px"
                containerClassName="absolute inset-0"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif font-medium text-ink-900 leading-snug text-base group-hover:text-saffron-600 transition-colors duration-200 line-clamp-1">
                  {recipe.title}
                </h3>
                <RecipeRating rating={recipe.rating} size={12} valueClassName="font-medium" className="shrink-0" />
              </div>
              <p className="text-sm text-ink-500 mt-1 line-clamp-2">{recipe.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  <Clock size={11} />
                  {formatMinutes(recipe.totalTimeMinutes)}
                </span>
                <Badge label={recipe.difficulty} variant="difficulty" />
                {isCooked && (
                  <span className="text-[10px] font-semibold text-sage-600 uppercase tracking-wide">✓ Cooked</span>
                )}
              </div>
            </div>
            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <AddToShoppingButton recipe={recipe} onAddToShopping={onAddToShopping} />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.2 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link href={`/recipes/${recipe.slug}`} className="h-full block">
        <div className="group bg-parchment-200 rounded-card overflow-hidden border border-parchment-300 hover:shadow-card-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            <FoodImage
              src={imageSrc}
              alt={recipe.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              containerClassName="absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
            {recipe.dietaryTags.includes("vegetarian") && (
              <div className="absolute top-2.5 right-2.5 bg-sage-500 text-white text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Veg
              </div>
            )}
            {isCooked && (
              <div className="absolute top-2.5 left-2.5 bg-parchment-100/90 backdrop-blur-sm text-sage-700 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                ✓ Cooked
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <AddToShoppingButton recipe={recipe} onAddToShopping={onAddToShopping} />
            </div>
          </div>
          <div className="p-3.5 flex flex-col flex-1">
            <h3 className={cn(
              "font-serif font-medium text-ink-900 leading-snug group-hover:text-saffron-600 transition-colors duration-200 line-clamp-2 mb-2 text-balance",
              "text-[1rem]"
            )}>
              {recipe.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  <Clock size={11} />
                  {formatMinutes(recipe.totalTimeMinutes)}
                </span>
                <Badge label={recipe.difficulty} variant="difficulty" />
              </div>
              <RecipeRating rating={recipe.rating} size={11} className="gap-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
