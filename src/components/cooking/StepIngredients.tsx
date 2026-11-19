"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Ingredient } from "@/types/recipe";
import { scaleQuantity } from "@/lib/scaleIngredient";

interface StepIngredientsProps {
  allIngredients: Ingredient[];
  stepIngredientIds?: string[];
  stepInstruction?: string;
  stepId: string;
  direction: number;
  scale?: number;
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

const UNIT_ABBREV: Record<string, string> = {
  tablespoon: "tbsp", tablespoons: "tbsp",
  teaspoon: "tsp",   teaspoons: "tsp",
};

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

function IngredientRow({ ing, scale }: { ing: Ingredient; scale: number }) {
  const qty = ing.quantity > 0 ? scaleQuantity(ing.quantity, scale) : "";
  const unit = ing.unit && ing.unit !== "whole"
    ? (UNIT_ABBREV[ing.unit.toLowerCase()] ?? ing.unit)
    : "";
  return (
    <div className="flex items-baseline justify-between gap-3 bg-parchment-200 border border-parchment-300 rounded-xl px-3.5 py-2.5">
      <span className="font-serif text-ink-900 text-sm leading-snug flex-1">{ing.name}</span>
      {qty && (
        <span className="text-xs font-medium text-ink-500 shrink-0 tabular-nums">
          {qty}{unit ? ` ${unit}` : ""}
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
  scale = 1,
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
            <IngredientRow key={ing.id} ing={ing} scale={scale} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
