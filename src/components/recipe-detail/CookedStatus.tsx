"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { useCookingHistory } from "@/hooks/useCookingHistory";

interface CookedStatusProps {
  recipeId: string;
}

export function CookedStatus({ recipeId }: CookedStatusProps) {
  const { hasCooked, getState, updateRating } = useRecipeStates();
  const { history, addEntry } = useCookingHistory();
  const state = getState(recipeId);
  const currentRating = state?.rating ?? 0;
  const [showStars, setShowStars] = useState(currentRating > 0);

  if (!hasCooked(recipeId)) return null;

  const lastNote = history
    .filter(e => e.recipeId === recipeId && e.notes)
    .sort((a, b) => b.cookedAt.localeCompare(a.cookedAt))[0]?.notes;

  function handleRating(star: number) {
    updateRating(recipeId, star);
    const latest = history
      .filter(e => e.recipeId === recipeId)
      .sort((a, b) => b.cookedAt.localeCompare(a.cookedAt))[0];
    if (latest) addEntry({ ...latest, rating: star });
  }

  return (
    <div className="py-5 border-b border-parchment-300">
      {showStars ? (
        <>
          <p className="text-label uppercase tracking-widest text-ink-400 mb-3">Your rating</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleRating(star)}
                title={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                className={star <= currentRating ? "text-saffron-500" : "text-parchment-300 hover:text-saffron-300 transition-colors"}
              >
                <Star size={22} fill={star <= currentRating ? "currentColor" : "none"} strokeWidth={1.5} />
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <button
          onClick={() => setShowStars(true)}
          className="text-sm text-ink-400 hover:text-saffron-500 transition-colors"
        >
          Rate this recipe →
        </button>
      )}
      {lastNote && (
        <p className="text-sm text-ink-500 italic leading-relaxed bg-parchment-200 rounded-xl px-3 py-2.5">
          &ldquo;{lastNote}&rdquo;
        </p>
      )}
    </div>
  );
}
