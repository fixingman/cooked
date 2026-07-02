import type { PantryItem } from "@/types/pantry";

// A single recipe's contribution to a shopping-list line. Manual adds have no recipe.
export interface ShoppingSource {
  recipeId?: string;
  recipeTitle?: string;
  quantity: number;
  unit: string;
}

export interface ShoppingItem {
  id: string;
  name: string;        // display name (sentence-case core ingredient)
  checked: boolean;
  addedAt: string;
  sources: ShoppingSource[];  // deduped by recipe; summed by unit for display
  manual?: boolean;           // added by hand, not from a recipe
  fromPantry?: boolean;       // auto-added because the pantry item ran low
  category?: PantryItem["category"]; // AI-assigned; pantry category wins at display time
}
