"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { FoodImage } from "@/components/ui/FoodImage";
import { Badge } from "@/components/ui/Badge";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe } from "@/types/recipe";

import type { MealTime } from "@/types/recipe";

interface MealTimeSectionProps {
  recipes: Recipe[];
  label: string;
  mealTime?: MealTime;
  seeAllHref?: string;
}

export function MealTimeSection({ recipes, label, mealTime, seeAllHref }: MealTimeSectionProps) {
  if (recipes.length === 0) return null;

  const href = seeAllHref ?? (mealTime ? `/recipes?category=${mealTime}` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-label uppercase tracking-widest text-ink-400">{label}</p>
        {href && (
          <Link href={href} className="text-xs text-saffron-500 font-medium hover:text-saffron-600 transition-colors">
            See all →
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
        {recipes.slice(0, 6).map((recipe, i) => (
          <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className="shrink-0 w-[160px] md:w-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.35 }}
              className="group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                <FoodImage
                  src={recipe.heroImageUrl}
                  alt={recipe.title}
                  fill
                  sizes="160px"
                  containerClassName="absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
              </div>
              <h4 className="font-serif text-sm text-ink-900 leading-snug line-clamp-2 group-hover:text-saffron-600 transition-colors">
                {recipe.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="flex items-center gap-1 text-xs text-ink-400">
                  <Clock size={10} />
                  {formatMinutes(recipe.totalTimeMinutes)}
                </p>
                <Badge label={recipe.difficulty} variant="difficulty" className="text-[10px] px-1.5 py-px" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
