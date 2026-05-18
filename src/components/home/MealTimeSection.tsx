"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { FoodImage } from "@/components/ui/FoodImage";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe } from "@/types/recipe";

interface MealTimeSectionProps {
  recipes: Recipe[];
  label: string;
}

export function MealTimeSection({ recipes, label }: MealTimeSectionProps) {
  if (recipes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-label uppercase tracking-widest text-ink-400">{label}</p>
        <Link href="/recipes" className="text-xs text-saffron-500 font-medium hover:text-saffron-600 transition-colors">
          See all →
        </Link>
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
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h4 className="font-serif text-sm text-ink-900 leading-snug line-clamp-2 group-hover:text-saffron-600 transition-colors">
                {recipe.title}
              </h4>
              <p className="flex items-center gap-1 text-xs text-ink-400 mt-0.5">
                <Clock size={10} />
                {formatMinutes(recipe.totalTimeMinutes)}
              </p>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
