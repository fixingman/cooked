"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";
import type { Recipe } from "@/types/recipe";
import { useCookingHistory } from "@/hooks/useCookingHistory";
import { useRecipeStates } from "@/hooks/useRecipeStates";

interface CompletionScreenProps {
  recipe: Recipe;
}

export function CompletionScreen({ recipe }: CompletionScreenProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const { addEntry } = useCookingHistory();
  const { markCooked, updateRating } = useRecipeStates();
  const [cookedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    addEntry({ recipeId: recipe.id, cookedAt });
    markCooked(recipe.id, cookedAt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRating(star: number) {
    setRating(star);
    addEntry({ recipeId: recipe.id, cookedAt, rating: star, notes: notes || undefined });
    updateRating(recipe.id, star);
  }

  function handleNotesBlur() {
    if (!notes) return;
    addEntry({ recipeId: recipe.id, cookedAt, rating: rating || undefined, notes });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 bg-parchment-100 flex flex-col items-center justify-center p-8 z-10 overflow-hidden"
    >
      {/* Stamp ring — decorative, behind content */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          border: "3px solid rgba(232,137,12,0.09)",
          transform: "rotate(-14deg)",
          top: "50%",
          left: "50%",
          translate: "-50% -50%",
        }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 18 }}
        className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mb-6"
      >
        <ChefHat size={36} className="text-sage-600" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-3xl text-ink-900 mb-2 text-center"
      >
        You cooked it!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-ink-500 text-center mb-8"
      >
        {recipe.title} — hope it was delicious.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 mb-5"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileTap={{ scale: 0.8 }}
            onClick={() => handleRating(star)}
            className={star <= rating ? "text-saffron-500" : "text-parchment-300"}
          >
            <Star size={32} fill={star <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs mb-6"
      >
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Any notes? (e.g. added extra garlic)"
          rows={2}
          className="w-full px-3 py-2.5 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-700 placeholder:text-ink-300 resize-none focus:outline-none focus:ring-2 focus:ring-saffron-400/50"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 w-full max-w-xs"
      >
        <button onClick={() => router.replace("/recipes")} className="flex-1">
          <div className="w-full py-3 px-4 bg-parchment-200 border border-parchment-300 rounded-xl text-center text-sm font-medium text-ink-700">
            Back to recipes
          </div>
        </button>
        <button onClick={() => router.replace(`/recipes/${recipe.slug}`)} className="flex-1">
          <div className="w-full py-3 px-4 bg-sage-500 rounded-xl text-center text-sm font-medium text-white">
            View Recipe
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}
