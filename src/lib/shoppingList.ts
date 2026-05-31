import type { ShoppingSource } from "@/types/shoppingList";

/** Sum source quantities grouped by unit. Different units are listed separately.
 *  e.g. [{2,""},{1,""}] → "3"  ·  [{200,"g"},{1,"cup"}] → "200 g + 1 cup" */
export function summarizeQuantity(sources: ShoppingSource[]): string {
  const byUnit = new Map<string, number>();
  for (const s of sources) {
    if (!s.quantity || s.quantity <= 0) continue;
    const unit = (s.unit ?? "").trim();
    byUnit.set(unit, (byUnit.get(unit) ?? 0) + s.quantity);
  }
  if (byUnit.size === 0) return "";
  return Array.from(byUnit.entries())
    .map(([unit, qty]) => {
      const rounded = Math.round(qty * 100) / 100;
      return unit ? `${rounded} ${unit}` : `${rounded}`;
    })
    .join(" + ");
}

/** Unique recipe titles backing a line, for the "from …" subtext. */
export function sourceTitles(sources: ShoppingSource[]): string[] {
  const titles = sources.map(s => s.recipeTitle).filter((t): t is string => !!t);
  return Array.from(new Set(titles));
}
