"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { FoodImage } from "@/components/ui/FoodImage";
import { Badge } from "@/components/ui/Badge";
import { RecipeRating } from "@/components/ui/RecipeRating";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe } from "@/types/recipe";

interface FeaturedHeroProps {
  recipe: Recipe;
  label?: string;
}

export function FeaturedHero({ recipe, label = "Featured Today" }: FeaturedHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-2 mb-3">
        <img src="/illustrations/flame.svg?v=2" alt="" className="h-10 w-auto shrink-0" />
        <p className="font-display text-label uppercase tracking-widest text-ink-400">{label}</p>
      </div>
      <Link href={`/recipes/${recipe.slug}`}>
        <div className="group relative rounded-card overflow-hidden aspect-[16/9] md:aspect-[21/9] cursor-pointer">
          <FoodImage
            src={recipe.heroImageUrl}
            alt={recipe.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 80vw"
            dropboxPath={recipe.heroImageDropboxPath}
            containerClassName="absolute inset-0"
          />
          <div className="absolute inset-0 bg-hero-scrim transition-opacity duration-400 group-hover:opacity-60" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
            <div className="flex items-center gap-3 mb-2">
              {recipe.cuisine && recipe.cuisine !== "any" && <Badge label={recipe.cuisine} />}
              <RecipeRating rating={recipe.rating} size={12} className="text-saffron-400" valueClassName="text-sm text-parchment-200" />
            </div>
            <h2 className="font-display text-white text-2xl md:text-3xl font-semibold leading-tight text-balance group-hover:text-saffron-300 transition-colors duration-300">
              {recipe.title}
            </h2>
            {recipe.subtitle && (
              <p className="text-parchment-300/80 text-sm mt-1 hidden md:block">{recipe.subtitle}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-parchment-300">
                <Clock size={13} />
                {formatMinutes(recipe.totalTimeMinutes)}
              </span>
              <Badge label={recipe.difficulty} variant="difficulty" overlay />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
