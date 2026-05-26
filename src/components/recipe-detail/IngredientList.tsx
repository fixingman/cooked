"use client";
import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import { scaleQuantity } from "@/lib/scaleIngredient";
import type { Ingredient } from "@/types/recipe";
import { cn } from "@/lib/cn";

interface IngredientListProps {
  ingredients: Ingredient[];
  scale: number;
  units?: "metric" | "imperial";
  pantryNames?: Set<string>;
}

function groupIngredients(ingredients: Ingredient[]): Map<string, Ingredient[]> {
  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const key = ing.group ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }
  // Within each group, sort no-amount ingredients to the bottom
  groups.forEach((items, key) => {
    groups.set(key, [...items].sort((a, b) => (a.quantity > 0 ? 0 : 1) - (b.quantity > 0 ? 0 : 1)));
  });
  return groups;
}

export function IngredientList({ ingredients, scale, units = "metric", pantryNames }: IngredientListProps) {
  const groups = useMemo(() => groupIngredients(ingredients), [ingredients]);

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          {group && (
            <h4 className="text-label uppercase tracking-widest text-ink-400 mb-3">{group}</h4>
          )}
          <ul className="space-y-2.5">
            {items.map((ing) => {
              const useImperial = units === "imperial" && ing.unitImperial;
              const qty = useImperial
                ? scaleQuantity(ing.quantityImperial!, scale)
                : scaleQuantity(ing.quantity, scale);
              const unit = useImperial ? ing.unitImperial! : ing.unit;

              const ABBREV: Record<string, string> = { tablespoon: "tbsp", tablespoons: "tbsp", teaspoon: "tsp", teaspoons: "tsp" };
              const normUnit = unit ? (ABBREV[unit.toLowerCase()] ?? unit) : unit;
              const displayUnit = normUnit && normUnit !== "whole" && normUnit !== "pinch" && normUnit !== "handful" ? normUnit : "";
              const hasAmount = qty !== "" || displayUnit !== "";

              return (
                <li
                  key={ing.id}
                  className={cn(
                    "flex items-baseline gap-3 py-2 border-b border-parchment-300/60 last:border-0",
                    ing.optional && "opacity-70"
                  )}
                >
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                    {hasAmount && (
                      <>
                        <span className="font-medium text-ink-900">{qty}</span>
                        {displayUnit && (
                          <em className="italic font-normal text-ink-400 ml-1">{displayUnit}</em>
                        )}
                      </>
                    )}
                  </span>
                  <span className="text-ink-700 text-sm flex-1">
                    {ing.name}
                    {ing.optional && (
                      <span className="text-ink-400 text-xs ml-1.5">(optional)</span>
                    )}
                  </span>
                  {pantryNames?.has(ing.name.toLowerCase()) && (
                    <CheckCircle size={13} className="text-sage-400 shrink-0" fill="currentColor" strokeWidth={0} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
