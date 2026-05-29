"use client";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { scaleQuantity } from "@/lib/scaleIngredient";
import { normalizeForMatch } from "@/lib/ingredientUtils";
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

function convertToImperial(qty: number, unit: string): { qty: number; unit: string } | null {
  const u = (unit ?? "").toLowerCase();
  if (u === "g") {
    if (qty >= 454) return { qty: qty / 453.592, unit: "lb" };
    return { qty: qty / 28.3495, unit: "oz" };
  }
  if (u === "kg") return { qty: qty * 2.20462, unit: "lb" };
  if (u === "ml") {
    if (qty >= 240) return { qty: qty / 240, unit: "cup" };
    if (qty >= 14) return { qty: qty / 14.7868, unit: "tbsp" };
    if (qty >= 4)  return { qty: qty / 4.92892, unit: "tsp" };
    return { qty: qty / 29.5735, unit: "fl oz" };
  }
  if (u === "l") {
    const ml = qty * 1000;
    if (ml >= 240) return { qty: ml / 240, unit: "cup" };
    return { qty: qty * 33.814, unit: "fl oz" };
  }
  return null;
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
              let qty: string;
              let unit: string | undefined;

              if (units === "imperial" && ing.unitImperial) {
                qty = scaleQuantity(ing.quantityImperial!, scale);
                unit = ing.unitImperial;
              } else if (units === "imperial" && ing.unit) {
                const scaledQty = ing.quantity * scale;
                const conv = convertToImperial(scaledQty, ing.unit);
                qty = conv ? scaleQuantity(conv.qty, 1) : scaleQuantity(ing.quantity, scale);
                unit = conv ? conv.unit : ing.unit;
              } else {
                qty = scaleQuantity(ing.quantity, scale);
                unit = ing.unit;
              }

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
                  {pantryNames?.has(normalizeForMatch(ing.name))
                    && ing.unit !== "pinch" && ing.unit !== "handful" && (
                    <Check size={13} className="text-sage-500 shrink-0" strokeWidth={2.5} />
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
