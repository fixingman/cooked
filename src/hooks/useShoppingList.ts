"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import { usePantry } from "@/hooks/usePantry";
import { normalizeForMatch, cleanForPantry } from "@/lib/ingredientUtils";
import type { ShoppingItem, ShoppingSource } from "@/types/shoppingList";
import type { Ingredient } from "@/types/recipe";

// Union by id — local-only items (added offline) survive a remote overwrite.
function mergeItems(local: ShoppingItem[], remote: ShoppingItem[]): ShoppingItem[] {
  const byId = new Map(remote.map(i => [i.id, i]));
  for (const l of local) if (!byId.has(l.id)) byId.set(l.id, l);
  return Array.from(byId.values());
}

export function useShoppingList() {
  const { getValidAccessToken } = useDropboxAuth();
  const { addItem: addToPantry } = usePantry();
  const { value: list, setValue } = useDropboxSync<ShoppingItem[]>({
    dropboxPath:     "/shopping-list.json",
    localStorageKey: "cooked-shopping-list",
    defaultValue:    [],
    getValidAccessToken,
    merge: mergeItems,
  });

  // Add a single item by hand (no recipe source).
  const addManual = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const key = normalizeForMatch(clean);
    setValue(prev => {
      if (prev.some(i => normalizeForMatch(i.name) === key)) return prev;
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        checked: false,
        addedAt: new Date().toISOString(),
        sources: [],
        manual: true,
      };
      return [item, ...prev];
    });
  }, [setValue]);

  // Add selected ingredients from a recipe. An ingredient used more than once in
  // the same recipe (e.g. garam masala in marinade + sauce) is summed into a
  // single source first; adding the same recipe again is idempotent (deduped by
  // recipeId). Quantities across different recipes are summed at display time.
  const addFromRecipe = useCallback((ingredients: Ingredient[], recipeId: string, recipeTitle: string) => {
    // Aggregate within this recipe, keyed by normalized name + unit.
    const perKey = new Map<string, { name: string; source: ShoppingSource }>();
    for (const ing of ingredients) {
      const norm = normalizeForMatch(ing.name);
      if (!norm) continue;
      const key = `${norm}|${ing.unit}`;
      const hit = perKey.get(key);
      if (hit) {
        hit.source.quantity += ing.quantity;
      } else {
        perKey.set(key, { name: ing.name, source: { recipeId, recipeTitle, quantity: ing.quantity, unit: ing.unit } });
      }
    }

    setValue(prev => {
      const next = prev.map(i => ({ ...i, sources: [...i.sources] }));
      for (const { name, source } of Array.from(perKey.values())) {
        const norm = normalizeForMatch(name);
        const existing = next.find(i => normalizeForMatch(i.name) === norm);
        if (existing) {
          // Idempotent re-add: skip if this recipe+unit already contributed.
          if (!existing.sources.some(s => s.recipeId === recipeId && s.unit === source.unit)) {
            existing.sources.push(source);
            existing.checked = false; // re-surface a line you'd already ticked off
          }
        } else {
          next.unshift({
            id: crypto.randomUUID(),
            name: cleanForPantry(name),
            checked: false,
            addedAt: new Date().toISOString(),
            sources: [source],
          });
        }
      }
      return next;
    });
  }, [setValue]);

  // Tick / untick. Ticking moves the item into the pantry (idempotent — addItem
  // dedupes by name), completing the shop → pantry loop.
  const toggleChecked = useCallback((id: string) => {
    const item = list.find(i => i.id === id);
    const willCheck = item ? !item.checked : false;
    setValue(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    if (item && willCheck) addToPantry(item.name);
  }, [list, setValue, addToPantry]);

  const removeItem = useCallback((id: string) => {
    setValue(prev => prev.filter(i => i.id !== id));
  }, [setValue]);

  const clearChecked = useCallback(() => {
    setValue(prev => prev.filter(i => !i.checked));
  }, [setValue]);

  const clearAll = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return { list, addManual, addFromRecipe, toggleChecked, removeItem, clearChecked, clearAll };
}
