"use client";
import { useState } from "react";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { useCookingHistory } from "@/hooks/useCookingHistory";

interface CookedStatusProps {
  recipeId: string;
}

export function CookedStatus({ recipeId }: CookedStatusProps) {
  const { getState, hasCooked, markCooked, updateRating } = useRecipeStates();
  const { history, addEntry } = useCookingHistory();
  const [justMarked, setJustMarked] = useState(false);

  const cooked = hasCooked(recipeId);
  const state = getState(recipeId);
  const cookCount = state?.cookedAt?.length ?? 0;
  const currentRating = state?.rating ?? 0;

  const lastNote = history
    .filter(e => e.recipeId === recipeId && e.notes)
    .sort((a, b) => b.cookedAt.localeCompare(a.cookedAt))[0]?.notes;

  function handleMarkCooked() {
    const cookedAt = new Date().toISOString();
    markCooked(recipeId, cookedAt);
    addEntry({ recipeId, cookedAt });
    setJustMarked(true);
  }

  function handleRating(star: number) {
    updateRating(recipeId, star);
    const latest = history
      .filter(e => e.recipeId === recipeId)
      .sort((a, b) => b.cookedAt.localeCompare(a.cookedAt))[0];
    if (latest) addEntry({ ...latest, rating: star });
  }

  if (!cooked && !justMarked) {
    return (
      <div className="py-5 border-b border-parchment-300">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleMarkCooked}
          className="flex items-center gap-2 px-4 py-2.5 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-xl text-sm font-medium transition-colors"
        >
          <CheckCircle size={16} strokeWidth={2} />
          Mark as Cooked
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={justMarked ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      className="py-5 border-b border-parchment-300"
    >
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle size={15} className="text-sage-500 shrink-0" strokeWidth={2} />
        <span className="text-sm font-medium text-sage-700">
          Cooked {cookCount === 1 ? "once" : `${cookCount} times`}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <motion.button
            key={star}
            whileTap={{ scale: 0.8 }}
            onClick={() => handleRating(star)}
            className={star <= currentRating ? "text-saffron-500" : "text-parchment-300"}
          >
            <Star size={22} fill={star <= currentRating ? "currentColor" : "none"} strokeWidth={1.5} />
          </motion.button>
        ))}
      </div>

      {lastNote && (
        <p className="text-sm text-ink-500 italic leading-relaxed">
          &ldquo;{lastNote}&rdquo;
        </p>
      )}
    </motion.div>
  );
}
