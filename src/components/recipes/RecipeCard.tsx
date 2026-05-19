"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Star } from "lucide-react";
import { FoodImage } from "@/components/ui/FoodImage";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  viewMode?: "grid" | "list";
  index?: number;
}

export function RecipeCard({ recipe, viewMode = "grid", index = 0 }: RecipeCardProps) {
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href={`/recipes/${recipe.slug}`}>
          <div className="flex gap-4 p-4 bg-parchment-200 rounded-card border border-parchment-300 hover:shadow-card-md transition-shadow duration-300 group">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <FoodImage
                src={recipe.heroImageUrl}
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
                <div className="flex items-center gap-1 text-saffron-500 shrink-0">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-medium text-ink-500">{recipe.rating}</span>
                </div>
              </div>
              <p className="text-sm text-ink-500 mt-1 line-clamp-2">{recipe.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  <Clock size={11} />
                  {formatMinutes(recipe.totalTimeMinutes)}
                </span>
                <Badge label={recipe.difficulty} variant="difficulty" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/recipes/${recipe.slug}`}>
        <div className="group bg-parchment-200 rounded-card overflow-hidden border border-parchment-300 hover:shadow-card-md transition-shadow duration-300 cursor-pointer">
          <div className="relative aspect-[4/3] overflow-hidden">
            <FoodImage
              src={recipe.heroImageUrl}
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
          </div>
          <div className="p-3.5">
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
              <div className="flex items-center gap-0.5 text-saffron-500">
                <Star size={11} fill="currentColor" />
                <span className="text-xs text-ink-500 ml-0.5">{recipe.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
