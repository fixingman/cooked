"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Ingredient } from "@/types/recipe";

interface StepIngredientsProps {
  allIngredients: Ingredient[];
  stepIngredientIds?: string[];
  stepInstruction?: string;
  stepId: string;
  direction: number;
}

// Adjectives and prep words that aren't useful for matching
const STOP_WORDS = new Set([
  "fresh", "dried", "large", "small", "medium", "extra", "finely", "thinly",
  "roughly", "coarsely", "chopped", "sliced", "diced", "grated", "minced",
  "ground", "whole", "ripe", "raw", "cooked", "frozen", "canned", "boneless",
]);

function matchByText(instruction: string, ingredients: Ingredient[]): Ingredient[] {
  const text = instruction.toLowerCase();
  return ingredients.filter(ing => {
    const name = ing.name.toLowerCase();
    if (text.includes(name)) return true;
    // Try each significant word in the ingredient name
    const keywords = name.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    return keywords.some(kw => text.includes(kw));
  });
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

function formatQuantity(qty: number): string {
  if (qty === Math.floor(qty)) return String(qty);
  const fractions: Record<number, string> = {
    0.25: "¼", 0.5: "½", 0.75: "¾",
    0.33: "⅓", 0.67: "⅔",
  };
  const decimal = Math.round((qty % 1) * 100) / 100;
  const whole = Math.floor(qty);
  const frac = fractions[decimal] ?? qty.toFixed(1).replace(/\.0$/, "");
  return whole > 0 ? `${whole}${fractions[decimal] ?? ""}` : String(frac);
}

function IngredientRow({ ing }: { ing: Ingredient }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-parchment-200 border border-parchment-300 rounded-xl px-3.5 py-2.5">
      <span className="font-serif text-ink-900 text-sm leading-snug flex-1">{ing.name}</span>
      {ing.quantity > 0 && (
        <span className="text-xs font-medium text-ink-500 shrink-0 tabular-nums">
          {formatQuantity(ing.quantity)}{ing.unit !== "whole" ? ` ${ing.unit}` : ""}
        </span>
      )}
    </div>
  );
}

export function StepIngredients({
  allIngredients,
  stepIngredientIds,
  stepInstruction,
  stepId,
  direction,
}: StepIngredientsProps) {
  // Priority: explicit IDs (built-in recipes) → text match → nothing
  const rawIngredients = stepIngredientIds?.length
    ? allIngredients.filter((i) => stepIngredientIds.includes(i.id))
    : stepInstruction
      ? matchByText(stepInstruction, allIngredients)
      : [];
  // No-amount ingredients (salt, pepper etc.) sorted to bottom
  const ingredients = [...rawIngredients].sort((a, b) => (a.quantity > 0 ? 0 : 1) - (b.quantity > 0 ? 0 : 1));

  if (ingredients.length === 0) return null;

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepId}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[300px]"
      >
        <p className="text-label text-ink-400 uppercase tracking-widest text-[10px] mb-3">
          You&apos;ll need
        </p>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[40vh]">
          {ingredients.map((ing) => (
            <IngredientRow key={ing.id} ing={ing} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
