"use client";
import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FoodImage } from "@/components/ui/FoodImage";
import { Badge } from "@/components/ui/Badge";
import { useCookingHistory } from "@/hooks/useCookingHistory";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { recipes } from "@/data/recipes";
import { formatDistanceToNow } from "date-fns";
import { formatMinutes } from "@/lib/formatTime";
import { Star, Clock } from "lucide-react";

export function ContinueCooking() {
  const { history } = useCookingHistory();
  const { recipes: userRecipes } = useUserRecipes();
  const allRecipes = useMemo(() => [...userRecipes, ...recipes], [userRecipes]);
  const items = useMemo(
    () => history
      .map((h) => ({ ...h, recipe: allRecipes.find((r) => r.id === h.recipeId) }))
      .filter((h) => h.recipe),
    [history, allRecipes]
  );

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-label uppercase tracking-widest text-ink-400 mb-3">Recently Cooked</p>
      <div className="flex flex-col gap-2.5">
        {items.map(({ recipe, cookedAt, rating }, i) => (
          <Link key={recipe!.id} href={`/recipes/${recipe!.slug}`}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className="flex items-center gap-3.5 p-3 bg-parchment-200 border border-parchment-300 rounded-card hover:shadow-card transition-shadow duration-200 group"
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <FoodImage
                  src={recipe!.heroImageUrl}
                  alt={recipe!.title}
                  fill
                  sizes="56px"
                  containerClassName="absolute inset-0"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-sm font-medium text-ink-900 line-clamp-1 group-hover:text-saffron-600 transition-colors">
                  {recipe!.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <Clock size={10} />
                    {formatMinutes(recipe!.totalTimeMinutes)}
                  </span>
                  <Badge label={recipe!.difficulty} variant="difficulty" className="text-[10px] px-1.5 py-px" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {rating && (
                  <div className="flex items-center gap-0.5 text-saffron-500">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} size={10} fill="currentColor" />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-ink-300">
                  {formatDistanceToNow(new Date(cookedAt), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
