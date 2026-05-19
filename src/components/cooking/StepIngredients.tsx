"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Ingredient } from "@/types/recipe";
import { FoodImage } from "@/components/ui/FoodImage";

interface StepIngredientsProps {
  allIngredients: Ingredient[];
  stepIngredientIds?: string[];
  stepId: string;
  fallbackImageUrl: string;
  direction: number;
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

export function StepIngredients({
  allIngredients,
  stepIngredientIds,
  stepId,
  fallbackImageUrl,
  direction,
}: StepIngredientsProps) {
  const stepIngredients = stepIngredientIds?.length
    ? allIngredients.filter((i) => stepIngredientIds.includes(i.id))
    : [];

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
        className="w-full flex flex-col items-center gap-4"
      >
        {stepIngredients.length > 0 ? (
          <div className="w-full max-w-[280px]">
            <p className="text-label text-ink-400 uppercase tracking-widest text-[10px] mb-3">
              You'll need
            </p>
            <div className="flex flex-col gap-2">
              {stepIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-baseline justify-between gap-3 bg-parchment-200 border border-parchment-300 rounded-xl px-3.5 py-2.5"
                >
                  <span className="font-serif text-ink-900 text-sm leading-snug flex-1">
                    {ing.name}
                  </span>
                  <span className="text-xs font-medium text-ink-500 shrink-0 tabular-nums">
                    {formatQuantity(ing.quantity)}{ing.unit !== "whole" ? ` ${ing.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-square max-w-[200px] mx-auto">
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-card-lg">
              <FoodImage
                src={fallbackImageUrl}
                alt="Recipe"
                fill
                sizes="200px"
                containerClassName="absolute inset-0"
              />
            </div>
            <div className="absolute -inset-3 rounded-[calc(1.5rem+12px)] border-2 border-parchment-300/60" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
