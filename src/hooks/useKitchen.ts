"use client";
import { useCallback } from "react";
import { usePantry } from "@/hooks/usePantry";
import { useShoppingList } from "@/hooks/useShoppingList";

// Coordination layer for cross-surface flows between Pantry and Shopping List.
// Lives above both hooks to avoid a circular import (useShoppingList already
// depends on usePantry for the check-off → pantry restock).
export function useKitchen() {
  const { items, toggleLow: pantryToggleLow } = usePantry();
  const { addFromPantry, removeFromPantry } = useShoppingList();

  // Marking an item low auto-adds it to the shopping list; un-marking removes the
  // pantry-sourced line (if still unbought).
  const toggleLow = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const becomingLow = !item.low;
    pantryToggleLow(id);
    if (becomingLow) addFromPantry(item.name);
    else removeFromPantry(item.name);
  }, [items, pantryToggleLow, addFromPantry, removeFromPantry]);

  return { toggleLow };
}
